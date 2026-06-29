import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentMonth } from '@/lib/utils'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const yearParam = searchParams.get('year')
  const monthParam = searchParams.get('month')
  const { year: currentYear, month: currentMonth } = getCurrentMonth()
  const year = yearParam ? parseInt(yearParam) : currentYear
  const month = monthParam ? parseInt(monthParam) : currentMonth

  const budgets = await prisma.budget.findMany({
    where: { period: 'MONTHLY', year, month },
    include: { category: true },
  })

  // Calculate spent per category for the period
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0, 23, 59, 59)

  const spentByCategory = await prisma.transaction.groupBy({
    by: ['categoryId'],
    where: {
      type: 'EXPENSE',
      date: { gte: startDate, lte: endDate },
    },
    _sum: { amount: true },
  })

  const spentMap = Object.fromEntries(
    spentByCategory.map((s) => [s.categoryId, s._sum.amount ?? 0])
  )

  return NextResponse.json(budgets.map((b) => ({ ...b, spent: spentMap[b.categoryId] ?? 0 })))
}

export async function POST(req: Request) {
  const body = await req.json()
  const { categoryId, period = 'MONTHLY', year, month, week, limitAmount } = body

  const numYear = Number(year)
  const numMonth = month ? Number(month) : null
  const numWeek = week ? Number(week) : null
  const existing = await prisma.budget.findFirst({
    where: { categoryId, period, year: numYear, month: numMonth, week: numWeek },
  })
  let budget
  if (existing) {
    budget = await prisma.budget.update({ where: { id: existing.id }, data: { limitAmount: Number(limitAmount) }, include: { category: true } })
  } else {
    budget = await prisma.budget.create({ data: { categoryId, period, year: numYear, month: numMonth, week: numWeek, limitAmount: Number(limitAmount) }, include: { category: true } })
  }
  return NextResponse.json(budget, { status: 201 })
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })
  await prisma.budget.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
