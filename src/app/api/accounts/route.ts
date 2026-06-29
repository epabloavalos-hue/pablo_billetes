import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const accounts = await prisma.account.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json(accounts)
}

export async function POST(req: Request) {
  const body = await req.json()
  const { name, type, balance = 0, creditLimit, color, icon } = body

  if (!name || !type) {
    return NextResponse.json({ error: 'name y type son requeridos' }, { status: 400 })
  }

  const account = await prisma.account.create({
    data: { name, type, balance: Number(balance), creditLimit: creditLimit ? Number(creditLimit) : null, color, icon },
  })
  return NextResponse.json(account, { status: 201 })
}
