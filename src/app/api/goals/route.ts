import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const goals = await prisma.financialGoal.findMany({ orderBy: { createdAt: 'asc' } })
  return NextResponse.json(goals)
}

export async function POST(req: Request) {
  const body = await req.json()
  const { name, type, targetAmount, currentAmount = 0, deadline, accountId, notes } = body
  const goal = await prisma.financialGoal.create({
    data: {
      name,
      type,
      targetAmount: Number(targetAmount),
      currentAmount: Number(currentAmount),
      deadline: deadline ? new Date(deadline) : null,
      accountId: accountId || null,
      notes: notes || null,
    },
  })
  return NextResponse.json(goal, { status: 201 })
}

export async function PATCH(req: Request) {
  const body = await req.json()
  const { id, ...data } = body
  if (data.targetAmount) data.targetAmount = Number(data.targetAmount)
  if (data.currentAmount !== undefined) data.currentAmount = Number(data.currentAmount)
  if (data.deadline) data.deadline = new Date(data.deadline)
  const goal = await prisma.financialGoal.update({ where: { id }, data })
  return NextResponse.json(goal)
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })
  await prisma.financialGoal.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
