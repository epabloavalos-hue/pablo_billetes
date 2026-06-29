import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET: returns all buckets with their balance and history
export async function GET() {
  try {
    const entries = await prisma.savingsEntry.findMany({ orderBy: { date: 'desc' } })

    const bucketsMap: Record<string, {
      bucket: string; color: string; emoji: string | null;
      balance: number; entries: typeof entries
    }> = {}

    for (const e of entries) {
      if (!bucketsMap[e.bucket]) {
        bucketsMap[e.bucket] = { bucket: e.bucket, color: e.color, emoji: e.emoji, balance: 0, entries: [] }
      }
      bucketsMap[e.bucket].entries.push(e)
      bucketsMap[e.bucket].balance += e.type === 'DEPOSIT' ? e.amount : -e.amount
      bucketsMap[e.bucket].color = e.color
      bucketsMap[e.bucket].emoji = e.emoji
    }

    return NextResponse.json(Object.values(bucketsMap))
  } catch (err) {
    console.error('[savings GET]', err)
    return NextResponse.json([], { status: 200 })
  }
}

// POST: create a full distribution (multiple DEPOSIT entries) or a single WITHDRAWAL
export async function POST(req: Request) {
  const body = await req.json()

  if (body.action === 'distribute') {
    // body.items = [{ bucket, amount, color, emoji }]
    // body.distributionId = uuid
    const { items, distributionId } = body as {
      items: { bucket: string; amount: number; color: string; emoji?: string }[]
      distributionId: string
    }
    const created = await prisma.savingsEntry.createMany({
      data: items.map((item) => ({
        bucket: item.bucket,
        type: 'DEPOSIT',
        amount: item.amount,
        color: item.color,
        emoji: item.emoji ?? null,
        distributionId,
      })),
    })
    return NextResponse.json({ created: created.count }, { status: 201 })
  }

  if (body.action === 'withdraw') {
    // body = { bucket, amount, notes, color, emoji }
    const { bucket, amount, notes, color, emoji } = body
    const entry = await prisma.savingsEntry.create({
      data: { bucket, type: 'WITHDRAWAL', amount: Number(amount), notes: notes || null, color, emoji: emoji || null },
    })
    return NextResponse.json(entry, { status: 201 })
  }

  return NextResponse.json({ error: 'action inválido' }, { status: 400 })
}

// DELETE a single entry (undo)
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })
  await prisma.savingsEntry.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
