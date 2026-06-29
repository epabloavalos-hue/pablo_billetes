'use client'
import { useState, useEffect } from 'react'
import { formatCurrency, getCurrentMonth, formatMonth } from '@/lib/utils'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid
} from 'recharts'

interface Transaction {
  id: string
  date: string
  type: string
  amount: number
  category: { name: string; color: string }
}

const MONTH_LABELS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

export default function ReportesPage() {
  const { year: cy, month: cm } = getCurrentMonth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/transactions')
      .then((r) => r.json())
      .then((data) => { setTransactions(data); setLoading(false) })
  }, [])

  if (loading) return <div className="p-6 text-center text-[var(--muted)]">Cargando...</div>

  // Spending by category (current month)
  const startOfMonth = new Date(cy, cm - 1, 1)
  const endOfMonth = new Date(cy, cm, 0, 23, 59, 59)
  const thisMonthExpenses = transactions.filter((t) => {
    const d = new Date(t.date)
    return t.type === 'EXPENSE' && d >= startOfMonth && d <= endOfMonth
  })

  const byCat: Record<string, { name: string; color: string; value: number }> = {}
  thisMonthExpenses.forEach((t) => {
    if (!byCat[t.category.name]) byCat[t.category.name] = { name: t.category.name, color: t.category.color, value: 0 }
    byCat[t.category.name].value += t.amount
  })
  const pieData = Object.values(byCat).sort((a, b) => b.value - a.value)

  // Monthly income vs expense trend (last 6 months)
  const months: { month: number; year: number }[] = []
  for (let i = 5; i >= 0; i--) {
    let m = cm - i
    let y = cy
    if (m <= 0) { m += 12; y -= 1 }
    months.push({ month: m, year: y })
  }

  const trendData = months.map(({ month, year }) => {
    const start = new Date(year, month - 1, 1)
    const end = new Date(year, month, 0, 23, 59, 59)
    const filtered = transactions.filter((t) => {
      const d = new Date(t.date)
      return d >= start && d <= end
    })
    const income = filtered.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0)
    const expense = filtered.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0)
    return { name: MONTH_LABELS[month - 1], ingresos: income, gastos: expense, ahorro: income - expense }
  })

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-xs shadow-xl">
        <p className="font-medium text-[var(--foreground)] mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }}>{p.name}: {formatCurrency(p.value)}</p>
        ))}
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl font-bold text-[var(--foreground)]">Reportes</h1>
        <p className="text-sm text-[var(--muted)] capitalize">Análisis de tus finanzas</p>
      </div>

      {/* Trend: income vs expense */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="text-sm font-semibold text-[var(--foreground)] mb-4">Ingresos vs gastos — últimos 6 meses</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={trendData} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="name" tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="ingresos" name="Ingresos" fill="#4ade80" radius={[4, 4, 0, 0]} />
            <Bar dataKey="gastos" name="Gastos" fill="#f87171" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Savings line */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="text-sm font-semibold text-[var(--foreground)] mb-4">Ahorro mensual</h2>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="name" tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="ahorro"
              name="Ahorro"
              stroke="#4ade80"
              strokeWidth={2}
              dot={{ fill: '#4ade80', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Spending by category pie + list */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <h2 className="text-sm font-semibold text-[var(--foreground)] mb-4">Gastos por categoría — {formatMonth(cy, cm)}</h2>
          {pieData.length === 0 ? (
            <p className="text-sm text-[var(--muted)] text-center py-8">Sin gastos este mes.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <h2 className="text-sm font-semibold text-[var(--foreground)] mb-4">Detalle por categoría</h2>
          {pieData.length === 0 ? (
            <p className="text-sm text-[var(--muted)] text-center py-8">Sin datos</p>
          ) : (
            <div className="space-y-3">
              {pieData.map((cat) => {
                const total = pieData.reduce((s, c) => s + c.value, 0)
                const pct = total > 0 ? (cat.value / total) * 100 : 0
                return (
                  <div key={cat.name} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                        <span className="text-[var(--foreground)]">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--muted)]">{pct.toFixed(0)}%</span>
                        <span className="font-medium tabular-nums text-[var(--foreground)]">{formatCurrency(cat.value)}</span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-[var(--surface-2)]">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: cat.color }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
