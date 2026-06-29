'use client'
import { useState, useEffect, useCallback } from 'react'
import { TransactionForm } from '@/components/transactions/transaction-form'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Trash2, Pencil } from 'lucide-react'
import { TRANSACTION_TYPE_LABELS } from '@/types'

interface Transaction {
  id: string
  date: string
  type: string
  amount: number
  description: string
  notes?: string
  category: { name: string; color: string }
  account: { name: string }
}

export default function TransaccionesPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [openForm, setOpenForm] = useState(false)
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)
  const [filterType, setFilterType] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterType) params.set('type', filterType)
    const res = await fetch(`/api/transactions?${params}`)
    setTransactions(await res.json())
    setLoading(false)
  }, [filterType])

  useEffect(() => { fetchTransactions() }, [fetchTransactions])

  async function deleteTransaction(id: string) {
    if (!confirm('¿Eliminar este movimiento?')) return
    await fetch(`/api/transactions/${id}`, { method: 'DELETE' })
    fetchTransactions()
  }

  function openEdit(tx: Transaction) {
    setEditingTx(tx)
    setOpenForm(true)
  }

  function closeForm() {
    setOpenForm(false)
    setEditingTx(null)
  }

  const typeColors: Record<string, string> = {
    INCOME: 'text-green-400',
    EXPENSE: 'text-red-400',
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--foreground)]">Transacciones</h1>
        <Button onClick={() => { setEditingTx(null); setOpenForm(true) }}>+ Nuevo</Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(['', 'INCOME', 'EXPENSE'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filterType === t
                ? 'bg-[var(--brand)] text-black'
                : 'bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)]'
            }`}
          >
            {t === '' ? 'Todos' : TRANSACTION_TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-12 text-[var(--muted)]">Cargando...</div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-12 text-[var(--muted)]">
          <p className="mb-3">No hay movimientos.</p>
          <Button onClick={() => setOpenForm(true)}>Registrar primero</Button>
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] divide-y divide-[var(--border)]">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-center gap-3 px-4 py-3 group">
              <div
                className="h-9 w-9 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: tx.category.color + '20' }}
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: tx.category.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--foreground)] truncate">{tx.description}</p>
                <p className="text-xs text-[var(--muted)]">{tx.category.name} · {tx.account.name}</p>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-sm font-semibold tabular-nums ${typeColors[tx.type] ?? ''}`}>
                  {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                </p>
                <p className="text-xs text-[var(--muted)]">{formatDate(tx.date)}</p>
              </div>
              <div className="flex items-center gap-1 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEdit(tx)}
                  className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => deleteTransaction(tx.id)}
                  className="p-1.5 rounded-lg text-[var(--muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <TransactionForm
        open={openForm}
        onClose={closeForm}
        onSaved={() => { fetchTransactions(); closeForm() }}
        editing={editingTx}
      />
    </div>
  )
}
