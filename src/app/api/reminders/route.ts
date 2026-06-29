import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const reminders = await prisma.reminder.findMany({
    where: { isDone: false },
    orderBy: { dueDate: 'asc' },
  })
  return NextResponse.json(reminders)
}

export async function POST(req: Request) {
  const body = await req.json()
  const { title, type, dueDate, amount, accountId, isRecurring, notes } = body
  const reminder = await prisma.reminder.create({
    data: {
      title,
      type,
      dueDate: new Date(dueDate),
      amount: amount ? Number(amount) : null,
      accountId: accountId || null,
      isRecurring: Boolean(isRecurring),
      notes: notes || null,
    },
  })
  return NextResponse.json(reminder, { status: 201 })
}

export async function PATCH(req: Request) {
  const body = await req.json()
  const { id, ...data } = body
  if (data.dueDate) data.dueDate = new Date(data.dueDate)
  if (data.amount !== undefined) data.amount = data.amount ? Number(data.amount) : null
  const reminder = await prisma.reminder.update({ where: { id }, data })
  return NextResponse.json(reminder)
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })
  await prisma.reminder.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
