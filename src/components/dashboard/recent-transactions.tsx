'use client'
import { useState, useEffect, useCallback } from 'react'
import { TransactionForm } from '@/components/transactions/transaction-form'
import { formatCurrency } from '@/lib/utils'
import { Pencil, Trash2 } from 'lucide-react'

interface Tx {
  id: string
  date: string
  type: string
  amount: number
  description: string
  notes?: string
  category: { name: string; color: string }
  account: { name: string }
}

export function RecentTransactions() {
  const [transactions, setTransactions] = useState<Tx[]>([])
  const [openForm, setOpenForm] = useState(false)
  const [editingTx, setEditingTx] = useState<Tx | null>(null)

  const fetch_ = useCallback(async () => {
    const res = await fetch('/api/transactions?limit=20')
    setTransactions(await res.json())
  }, [])

  useEffect(() => { fetch_() }, [fetch_])

  async function deleteTx(id: string) {
    if (!confirm('¿Eliminar este movimiento?')) return
    await fetch(`/api/transactions/${id}`, { method: 'DELETE' })
    fetch_()
  }

  function openEdit(tx: Tx) {
    setEditingTx(tx)
    setOpenForm(true)
  }

  function closeForm() {
    setOpenForm(false)
    setEditingTx(null)
  }

  if (transactions.length === 0) {
    return <p className="text-sm text-[var(--muted)] text-center py-8">No hay movimientos este mes.</p>
  }

  return (
    <>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] divide-y divide-[var(--border)]">
        {transactions.map((tx) => (
          <div key={tx.id} className="flex items-center gap-3 px-4 py-3 group">
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: tx.category.color + '20' }}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tx.category.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--foreground)] truncate">{tx.description}</p>
              <p className="text-xs text-[var(--muted)]">{tx.category.name} · {tx.account.name}</p>
            </div>
            <div className="text-right shrink-0">
              <p className={`text-sm font-semibold tabular-nums ${tx.type === 'INCOME' ? 'text-green-400' : 'text-red-400'}`}>
                {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
              </p>
              <p className="text-xs text-[var(--muted)]">
                {new Date(tx.date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
              </p>
            </div>
            <div className="flex items-center gap-1 ml-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button
                onClick={() => openEdit(tx)}
                className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => deleteTx(tx.id)}
                className="p-1.5 rounded-lg text-[var(--muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <TransactionForm
        open={openForm}
        onClose={closeForm}
        onSaved={() => { fetch_(); closeForm() }}
        editing={editingTx}
      />
    </>
  )
}
