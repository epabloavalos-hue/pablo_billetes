'use client'
import { useState, useEffect, useCallback } from 'react'
import { AccountForm } from '@/components/accounts/account-form'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { ACCOUNT_TYPE_LABELS } from '@/types'
import { Wallet, CreditCard, Banknote, PiggyBank, TrendingUp, AlertTriangle, Trash2 } from 'lucide-react'

interface Account {
  id: string
  name: string
  type: string
  balance: number
  creditLimit?: number
  color: string
  isActive: boolean
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  BANK: Wallet,
  CREDIT_CARD: CreditCard,
  CASH: Banknote,
  SAVINGS: PiggyBank,
  INVESTMENT: TrendingUp,
  LOAN: AlertTriangle,
}

export default function CuentasPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [openForm, setOpenForm] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchAccounts = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/accounts')
    setAccounts(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { fetchAccounts() }, [fetchAccounts])

  async function deleteAccount(id: string) {
    if (!confirm('¿Archivar esta cuenta?')) return
    await fetch(`/api/accounts/${id}`, { method: 'DELETE' })
    fetchAccounts()
  }

  const totalBalance = accounts
    .filter((a) => a.type !== 'CREDIT_CARD' && a.type !== 'LOAN')
    .reduce((s, a) => s + a.balance, 0)

  const totalDebt = accounts
    .filter((a) => a.type === 'CREDIT_CARD' || a.type === 'LOAN')
    .reduce((s, a) => s + Math.abs(a.balance), 0)

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--foreground)]">Cuentas</h1>
        <Button onClick={() => setOpenForm(true)}>+ Nueva cuenta</Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4">
          <p className="text-xs text-green-400 uppercase tracking-wide mb-1">Saldo disponible</p>
          <p className="text-2xl font-bold text-green-400">{formatCurrency(totalBalance)}</p>
        </div>
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
          <p className="text-xs text-red-400 uppercase tracking-wide mb-1">Deuda total</p>
          <p className="text-2xl font-bold text-red-400">{formatCurrency(totalDebt)}</p>
        </div>
      </div>

      {/* Accounts list */}
      {loading ? (
        <div className="text-center py-12 text-[var(--muted)]">Cargando...</div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-12 text-[var(--muted)]">
          <p className="mb-3">No tienes cuentas registradas.</p>
          <Button onClick={() => setOpenForm(true)}>Agregar primera cuenta</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map((acc) => {
            const Icon = TYPE_ICONS[acc.type] ?? Wallet
            const isDebt = acc.type === 'CREDIT_CARD' || acc.type === 'LOAN'
            const displayBalance = isDebt ? Math.abs(acc.balance) : acc.balance
            const usedPct = acc.creditLimit && acc.creditLimit > 0
              ? (Math.abs(acc.balance) / acc.creditLimit) * 100
              : null

            return (
              <div
                key={acc.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 group"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: acc.color + '20' }}
                  >
                    <Icon className="h-5 w-5" style={{ color: acc.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-[var(--foreground)]">{acc.name}</p>
                      <span className="text-xs text-[var(--muted)] bg-[var(--surface-2)] px-2 py-0.5 rounded-full">
                        {ACCOUNT_TYPE_LABELS[acc.type as keyof typeof ACCOUNT_TYPE_LABELS]}
                      </span>
                    </div>
                    {acc.creditLimit && (
                      <p className="text-xs text-[var(--muted)] mt-0.5">
                        Límite: {formatCurrency(acc.creditLimit)}
                        {usedPct !== null && ` · Usado: ${usedPct.toFixed(0)}%`}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold tabular-nums ${isDebt ? 'text-red-400' : 'text-[var(--foreground)]'}`}>
                      {isDebt ? '-' : ''}{formatCurrency(displayBalance)}
                    </p>
                    {isDebt && <p className="text-xs text-[var(--muted)]">pendiente</p>}
                  </div>
                  <button
                    onClick={() => deleteAccount(acc.id)}
                    className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--muted)] hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {usedPct !== null && (
                  <div className="mt-3">
                    <div className="h-2 w-full rounded-full bg-[var(--surface-2)]">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(usedPct, 100)}%`,
                          backgroundColor: usedPct > 80 ? '#ef4444' : usedPct > 60 ? '#f59e0b' : acc.color,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <AccountForm open={openForm} onClose={() => setOpenForm(false)} onSaved={fetchAccounts} />
    </div>
  )
}
