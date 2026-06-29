import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: { category: true, account: true, toAccount: true },
  })
  if (!transaction) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(transaction)
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { date, type, amount, description, notes } = body

  const existing = await prisma.transaction.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const numAmount = Number(amount)

  const result = await prisma.$transaction(async (db) => {
    // Reverse old balance effect
    if (existing.type === 'INCOME') {
      await db.account.update({ where: { id: existing.accountId }, data: { balance: { decrement: existing.amount } } })
    } else if (existing.type === 'EXPENSE') {
      await db.account.update({ where: { id: existing.accountId }, data: { balance: { increment: existing.amount } } })
    }

    // Apply new balance effect
    if (type === 'INCOME') {
      await db.account.update({ where: { id: existing.accountId }, data: { balance: { increment: numAmount } } })
    } else if (type === 'EXPENSE') {
      await db.account.update({ where: { id: existing.accountId }, data: { balance: { decrement: numAmount } } })
    }

    return db.transaction.update({
      where: { id },
      data: {
        date: new Date(date),
        type,
        amount: numAmount,
        description,
        notes: notes || null,
      },
      include: { category: true, account: true },
    })
  })

  return NextResponse.json(result)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const tx = await prisma.transaction.findUnique({ where: { id } })
  if (!tx) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.$transaction(async (db) => {
    // Reverse the balance effect
    if (tx.type === 'INCOME') {
      await db.account.update({ where: { id: tx.accountId }, data: { balance: { decrement: tx.amount } } })
    } else if (tx.type === 'EXPENSE') {
      await db.account.update({ where: { id: tx.accountId }, data: { balance: { increment: tx.amount } } })
    } else if ((tx.type === 'TRANSFER' || tx.type === 'DEBT_PAYMENT') && tx.toAccountId) {
      await db.account.update({ where: { id: tx.accountId }, data: { balance: { increment: tx.amount } } })
      await db.account.update({ where: { id: tx.toAccountId }, data: { balance: { decrement: tx.amount } } })
    }
    await db.transaction.delete({ where: { id } })
  })

  return NextResponse.json({ ok: true })
}
