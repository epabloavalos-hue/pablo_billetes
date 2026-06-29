import { prisma } from '@/lib/prisma'
import { formatCurrency, formatMonth, getCurrentMonth } from '@/lib/utils'
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { IngresoGeneral } from '@/components/dashboard/ingreso-general'
import { DisponibleBar } from '@/components/dashboard/disponible-bar'
import { RecentTransactions } from '@/components/dashboard/recent-transactions'

export const dynamic = 'force-dynamic'

async function getDashboardData() {
  const { year, month } = getCurrentMonth()
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0, 23, 59, 59)

  const [accounts, transactions, reminders, budgets] = await Promise.all([
    prisma.account.findMany({ where: { isActive: true }, orderBy: { createdAt: 'asc' } }),
    prisma.transaction.findMany({
      where: { date: { gte: startDate, lte: endDate } },
      include: { category: true, account: true },
      orderBy: { date: 'desc' },
    }),
    prisma.reminder.findMany({
      where: {
        isDone: false,
        dueDate: { lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { dueDate: 'asc' },
    }),
    prisma.budget.findMany({
      where: { period: 'MONTHLY', year, month },
      include: { category: true },
    }),
  ])

  const income = transactions.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0)
  const expenses = transactions.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0)
  const netBalance = accounts.filter((a) => a.type !== 'CREDIT_CARD').reduce((s, a) => s + a.balance, 0)
  const creditDebt = accounts.filter((a) => a.type === 'CREDIT_CARD').reduce((s, a) => s + Math.abs(a.balance), 0)

  // Spending by category this month
  const spentByCat: Record<string, { name: string; color: string; amount: number }> = {}
  transactions.filter((t) => t.type === 'EXPENSE').forEach((t) => {
    if (!spentByCat[t.categoryId]) {
      spentByCat[t.categoryId] = { name: t.category.name, color: t.category.color, amount: 0 }
    }
    spentByCat[t.categoryId].amount += t.amount
  })

  // Budget alerts (over 80%)
  const spentByCatId: Record<string, number> = {}
  transactions.filter((t) => t.type === 'EXPENSE').forEach((t) => {
    spentByCatId[t.categoryId] = (spentByCatId[t.categoryId] ?? 0) + t.amount
  })
  const budgetAlerts = budgets.filter((b) => {
    const spent = spentByCatId[b.categoryId] ?? 0
    return spent >= b.limitAmount * 0.8
  })

  return {
    accounts,
    income,
    expenses,
    netBalance,
    creditDebt,
    spentByCat: Object.values(spentByCat).sort((a, b) => b.amount - a.amount).slice(0, 6),
    recentTransactions: transactions.slice(0, 8),
    reminders,
    budgetAlerts,
    currentMonth: formatMonth(year, month),
    savingsRate: income > 0 ? ((income - expenses) / income) * 100 : 0,
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData()

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)]">Panel financiero</h1>
          <p className="text-sm text-[var(--muted)] capitalize">{data.currentMonth}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <IngresoGeneral />
          <Link
            href="/dashboard/transacciones"
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--brand)] text-black px-4 py-2 text-sm font-medium hover:bg-[var(--brand-hover)] transition-colors"
          >
            + Nuevo movimiento
          </Link>
        </div>
      </div>

      {/* Alertas */}
      {(data.reminders.length > 0 || data.budgetAlerts.length > 0) && (
        <div className="space-y-2">
          {data.reminders.map((r) => (
            <div key={r.id} className="flex items-center gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-300">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span className="font-medium">{r.title}</span>
              {r.amount && <span className="ml-auto text-yellow-400 font-semibold">{formatCurrency(r.amount)}</span>}
            </div>
          ))}
          {data.budgetAlerts.map((b) => {
            const spent = 0
            return (
              <div key={b.id} className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Presupuesto de <strong>{b.category.name}</strong> al límite</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Summary cards */}
      <div className="space-y-3">
        <div className="flex gap-3 flex-wrap">
          <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 space-y-1 flex-1 min-w-[140px]">
            <p className="text-xs text-green-400 uppercase tracking-wide flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Ingresos</p>
            <p className="text-xl font-bold text-green-400">{formatCurrency(data.income)}</p>
            <p className="text-xs text-[var(--muted)]">Este mes</p>
          </div>
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 space-y-1 flex-1 min-w-[140px]">
            <p className="text-xs text-red-400 uppercase tracking-wide flex items-center gap-1"><TrendingDown className="h-3 w-3" /> Gastos</p>
            <p className="text-xl font-bold text-red-400">{formatCurrency(data.expenses)}</p>
            <p className="text-xs text-[var(--muted)]">Este mes</p>
          </div>
        </div>
        <DisponibleBar expenses={data.expenses} />
      </div>


      {/* Recent transactions */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">Movimientos recientes</h2>
        <RecentTransactions />
      </div>
    </div>
  )
}
