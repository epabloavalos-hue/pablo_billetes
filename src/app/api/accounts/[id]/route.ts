import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const account = await prisma.account.update({ where: { id }, data: body })
  return NextResponse.json(account)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.account.update({ where: { id }, data: { isActive: false } })
  return NextResponse.json({ ok: true })
}
