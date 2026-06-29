import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const accountId = searchParams.get('accountId')
  const categoryId = searchParams.get('categoryId')
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const limit = searchParams.get('limit')

  const transactions = await prisma.transaction.findMany({
    where: {
      ...(type && { type }),
      ...(accountId && { OR: [{ accountId }, { toAccountId: accountId }] }),
      ...(categoryId && { categoryId }),
      ...(from || to
        ? {
            date: {
              ...(from && { gte: new Date(from) }),
              ...(to && { lte: new Date(to) }),
            },
          }
        : {}),
    },
    include: { category: true, account: true, toAccount: true },
    orderBy: { date: 'desc' },
    ...(limit && { take: parseInt(limit) }),
  })
  return NextResponse.json(transactions)
}

export async function POST(req: Request) {
  const body = await req.json()
  const { date, type, amount, description, notes } = body

  if (!date || !type || !amount || !description) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  const numAmount = Number(amount)

  // Resolve or create default account and category automatically
  let account = await prisma.account.findFirst({ where: { isActive: true } })
  if (!account) {
    account = await prisma.account.create({
      data: { name: 'General', type: 'BANK', balance: 0 },
    })
  }

  const categoryType = type === 'INCOME' ? 'INCOME' : 'EXPENSE'
  let category = await prisma.category.findFirst({ where: { type: categoryType } })
  if (!category) {
    category = await prisma.category.create({
      data: { name: categoryType === 'INCOME' ? 'Ingreso' : 'Gasto', type: categoryType },
    })
  }

  const result = await prisma.$transaction(async (tx) => {
    const transaction = await tx.transaction.create({
      data: {
        date: new Date(date),
        type,
        amount: numAmount,
        accountId: account!.id,
        categoryId: category!.id,
        description,
        notes: notes || null,
      },
      include: { category: true, account: true },
    })

    if (type === 'INCOME') {
      await tx.account.update({ where: { id: account!.id }, data: { balance: { increment: numAmount } } })
    } else if (type === 'EXPENSE') {
      await tx.account.update({ where: { id: account!.id }, data: { balance: { decrement: numAmount } } })
    }

    return transaction
  })

  return NextResponse.json(result, { status: 201 })
}
