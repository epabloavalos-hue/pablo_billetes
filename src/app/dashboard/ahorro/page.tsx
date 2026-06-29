'use client'
import { useState, useEffect, useCallback } from 'react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ArrowDownLeft, ArrowUpRight, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

interface SavingsEntry {
  id: string
  bucket: string
  type: string
  amount: number
  date: string
  notes?: string
  color: string
  emoji?: string
}

interface Bucket {
  bucket: string
  color: string
  emoji: string | null
  balance: number
  entries: SavingsEntry[]
}

export default function AhorroPage() {
  const [buckets, setBuckets] = useState<Bucket[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [withdrawBucket, setWithdrawBucket] = useState<Bucket | null>(null)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawNotes, setWithdrawNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchBuckets = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/savings')
    setBuckets(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { fetchBuckets() }, [fetchBuckets])

  async function registrarRetiro(e: React.FormEvent) {
    e.preventDefault()
    if (!withdrawBucket || !withdrawAmount) return
    setSaving(true)
    await fetch('/api/savings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'withdraw',
        bucket: withdrawBucket.bucket,
        amount: parseFloat(withdrawAmount),
        notes: withdrawNotes || null,
        color: withdrawBucket.color,
        emoji: withdrawBucket.emoji,
      }),
    })
    setSaving(false)
    setWithdrawBucket(null)
    setWithdrawAmount('')
    setWithdrawNotes('')
    fetchBuckets()
  }

  async function eliminarEntrada(id: string) {
    if (!confirm('¿Deshacer este movimiento?')) return
    await fetch(`/api/savings?id=${id}`, { method: 'DELETE' })
    fetchBuckets()
  }

  const totalBalance = buckets.reduce((s, b) => s + b.balance, 0)
  const totalDeposited = buckets.flatMap((b) => b.entries).filter((e) => e.type === 'DEPOSIT').reduce((s, e) => s + e.amount, 0)
  const totalWithdrawn = buckets.flatMap((b) => b.entries).filter((e) => e.type === 'WITHDRAWAL').reduce((s, e) => s + e.amount, 0)

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--foreground)]">Ahorro por rubro</h1>
        <p className="text-sm text-[var(--muted)] mt-0.5">Acumulado de tus distribuciones</p>
      </div>

      {/* Global summary */}
      {buckets.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-[var(--brand)]/30 bg-[var(--brand)]/5 p-3 text-center">
            <p className="text-xs text-[var(--muted)] mb-1">Saldo total</p>
            <p className="text-lg font-bold text-[var(--brand)]">{formatCurrency(totalBalance)}</p>
          </div>
          <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-3 text-center">
            <p className="text-xs text-[var(--muted)] mb-1">Depositado</p>
            <p className="text-lg font-bold text-green-400">{formatCurrency(totalDeposited)}</p>
          </div>
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-3 text-center">
            <p className="text-xs text-[var(--muted)] mb-1">Retirado</p>
            <p className="text-lg font-bold text-red-400">{formatCurrency(totalWithdrawn)}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-[var(--muted)]">Cargando...</div>
      ) : buckets.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <p className="text-4xl">💰</p>
          <p className="text-[var(--foreground)] font-medium">Todavía no hay registros de ahorro</p>
          <p className="text-sm text-[var(--muted)]">Ve a <strong>Distribuidora</strong>, escribe una cantidad y presiona <strong>Guardar registro</strong>.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {buckets.map((bucket) => {
            const isExpanded = expanded === bucket.bucket
            const deposits = bucket.entries.filter((e) => e.type === 'DEPOSIT')
            const withdrawals = bucket.entries.filter((e) => e.type === 'WITHDRAWAL')

            return (
              <div key={bucket.bucket} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-3 p-4">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ backgroundColor: bucket.color + '20' }}>
                    {bucket.emoji ?? '💰'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[var(--foreground)]">{bucket.bucket}</p>
                    <div className="flex items-center gap-3 text-xs text-[var(--muted)] mt-0.5">
                      <span className="text-green-400">+{formatCurrency(deposits.reduce((s, e) => s + e.amount, 0))}</span>
                      {withdrawals.length > 0 && <span className="text-red-400">-{formatCurrency(withdrawals.reduce((s, e) => s + e.amount, 0))}</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-lg font-bold tabular-nums ${bucket.balance < 0 ? 'text-red-400' : 'text-[var(--foreground)]'}`}>
                      {formatCurrency(bucket.balance)}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex border-t border-[var(--border)]">
                  <button
                    onClick={() => setWithdrawBucket(bucket)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    Registrar retiro
                  </button>
                  <div className="w-px bg-[var(--border)]" />
                  <button
                    onClick={() => setExpanded(isExpanded ? null : bucket.bucket)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-[var(--muted)] hover:bg-[var(--surface-2)] transition-colors"
                  >
                    {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    {isExpanded ? 'Ocultar' : `Ver historial (${bucket.entries.length})`}
                  </button>
                </div>

                {/* History */}
                {isExpanded && (
                  <div className="border-t border-[var(--border)] divide-y divide-[var(--border)]">
                    {bucket.entries.map((entry) => (
                      <div key={entry.id} className="flex items-center gap-3 px-4 py-3 group">
                        <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${entry.type === 'DEPOSIT' ? 'bg-green-500/15' : 'bg-red-500/15'}`}>
                          {entry.type === 'DEPOSIT'
                            ? <ArrowDownLeft className="h-3.5 w-3.5 text-green-400" />
                            : <ArrowUpRight className="h-3.5 w-3.5 text-red-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-[var(--foreground)]">
                            {entry.type === 'DEPOSIT' ? 'Depósito' : 'Retiro'}
                            {entry.notes && <span className="text-[var(--muted)] font-normal"> · {entry.notes}</span>}
                          </p>
                          <p className="text-xs text-[var(--muted)]">{formatDate(entry.date)}</p>
                        </div>
                        <span className={`text-sm font-semibold tabular-nums ${entry.type === 'DEPOSIT' ? 'text-green-400' : 'text-red-400'}`}>
                          {entry.type === 'DEPOSIT' ? '+' : '-'}{formatCurrency(entry.amount)}
                        </span>
                        <button
                          onClick={() => eliminarEntrada(entry.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--muted)] hover:text-red-400 ml-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Withdrawal modal */}
      <Dialog open={!!withdrawBucket} onOpenChange={(v) => !v && setWithdrawBucket(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {withdrawBucket?.emoji} Retiro de {withdrawBucket?.bucket}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={registrarRetiro} className="space-y-4">
            <div className="rounded-lg bg-[var(--surface-2)] p-3 text-sm">
              <span className="text-[var(--muted)]">Saldo disponible: </span>
              <span className="font-bold text-[var(--foreground)]">{formatCurrency(withdrawBucket?.balance ?? 0)}</span>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wr-amount">Monto a retirar (MXN)</Label>
              <Input
                id="wr-amount"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wr-notes">Motivo (opcional)</Label>
              <Input
                id="wr-notes"
                placeholder="Ej: Pago de renta, compra de comida..."
                value={withdrawNotes}
                onChange={(e) => setWithdrawNotes(e.target.value)}
              />
            </div>
            <div className="flex gap-3 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setWithdrawBucket(null)}>Cancelar</Button>
              <Button type="submit" variant="destructive" className="flex-1" disabled={saving}>
                {saving ? 'Guardando...' : 'Registrar retiro'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
