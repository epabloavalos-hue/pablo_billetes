'use client'
import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatCurrency, getCurrentMonth, formatMonth } from '@/lib/utils'
import { Trash2, ChevronLeft, ChevronRight } from 'lucide-react'

interface Category { id: string; name: string; type: string; color: string }
interface Budget {
  id: string
  categoryId: string
  limitAmount: number
  spent: number
  category: Category
}

export default function PresupuestosPage() {
  const { year: cy, month: cm } = getCurrentMonth()
  const [year, setYear] = useState(cy)
  const [month, setMonth] = useState(cm)
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [openForm, setOpenForm] = useState(false)
  const [form, setForm] = useState({ categoryId: '', limitAmount: '' })
  const [loading, setLoading] = useState(true)

  const fetchBudgets = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/budgets?year=${year}&month=${month}`)
    setBudgets(await res.json())
    setLoading(false)
  }, [year, month])

  useEffect(() => { fetchBudgets() }, [fetchBudgets])
  useEffect(() => {
    fetch('/api/categories').then((r) => r.json()).then((cats) =>
      setCategories(cats.filter((c: Category) => c.type === 'EXPENSE'))
    )
  }, [])

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }

  async function saveBudget(e: React.FormEvent) {
    e.preventDefault()
    if (!form.categoryId || !form.limitAmount) return
    await fetch('/api/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoryId: form.categoryId, period: 'MONTHLY', year, month, limitAmount: parseFloat(form.limitAmount) }),
    })
    setOpenForm(false)
    setForm({ categoryId: '', limitAmount: '' })
    fetchBudgets()
  }

  async function deleteBudget(id: string) {
    await fetch(`/api/budgets?id=${id}`, { method: 'DELETE' })
    fetchBudgets()
  }

  const totalLimit = budgets.reduce((s, b) => s + b.limitAmount, 0)
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0)
  const existingCategoryIds = new Set(budgets.map((b) => b.categoryId))

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--foreground)]">Presupuestos</h1>
        <Button onClick={() => setOpenForm(true)}>+ Agregar</Button>
      </div>

      {/* Month selector */}
      <div className="flex items-center gap-3">
        <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-[var(--surface)] text-[var(--muted)]">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-medium text-[var(--foreground)] capitalize min-w-[120px] text-center">
          {formatMonth(year, month)}
        </span>
        <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-[var(--surface)] text-[var(--muted)]">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Summary */}
      {budgets.length > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--muted)]">Gastado vs presupuestado</span>
            <span className={`font-semibold ${totalSpent > totalLimit ? 'text-red-400' : 'text-[var(--foreground)]'}`}>
              {formatCurrency(totalSpent)} / {formatCurrency(totalLimit)}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-[var(--surface-2)]">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0, 100)}%`,
                backgroundColor: totalSpent > totalLimit ? '#ef4444' : '#4ade80',
              }}
            />
          </div>
          <p className="text-xs text-[var(--muted)]">
            Disponible: <span className={`font-medium ${totalLimit - totalSpent < 0 ? 'text-red-400' : 'text-green-400'}`}>
              {formatCurrency(totalLimit - totalSpent)}
            </span>
          </p>
        </div>
      )}

      {/* Budget cards */}
      {loading ? (
        <div className="text-center py-12 text-[var(--muted)]">Cargando...</div>
      ) : budgets.length === 0 ? (
        <div className="text-center py-12 text-[var(--muted)]">
          <p className="mb-3">Sin presupuestos para este mes.</p>
          <Button onClick={() => setOpenForm(true)}>Crear presupuesto</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {budgets.map((b) => {
            const pct = b.limitAmount > 0 ? (b.spent / b.limitAmount) * 100 : 0
            const over = pct > 100
            const warning = pct >= 80 && !over
            return (
              <div key={b.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 group">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: b.category.color }} />
                    <span className="font-medium text-[var(--foreground)] text-sm">{b.category.name}</span>
                    {over && <span className="text-xs text-red-400 font-medium bg-red-500/10 px-2 py-0.5 rounded-full">Excedido</span>}
                    {warning && <span className="text-xs text-yellow-400 font-medium bg-yellow-500/10 px-2 py-0.5 rounded-full">Casi al límite</span>}
                  </div>
                  <button
                    onClick={() => deleteBudget(b.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--muted)] hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-[var(--muted)]">
                    <span>Gastado: <span className="text-[var(--foreground)] font-medium">{formatCurrency(b.spent)}</span></span>
                    <span>Límite: <span className="text-[var(--foreground)] font-medium">{formatCurrency(b.limitAmount)}</span></span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[var(--surface-2)]">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(pct, 100)}%`,
                        backgroundColor: over ? '#ef4444' : warning ? '#f59e0b' : b.category.color,
                      }}
                    />
                  </div>
                  <p className="text-xs text-right text-[var(--muted)]">{pct.toFixed(0)}% usado</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={openForm} onOpenChange={(v) => !v && setOpenForm(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo presupuesto — {formatMonth(year, month)}</DialogTitle>
          </DialogHeader>
          <form onSubmit={saveBudget} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Categoría</Label>
              <Select value={form.categoryId} onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecciona categoría" /></SelectTrigger>
                <SelectContent>
                  {categories.filter((c) => !existingCategoryIds.has(c.id)).map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="limit">Límite mensual (MXN)</Label>
              <Input
                id="limit"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.limitAmount}
                onChange={(e) => setForm((f) => ({ ...f, limitAmount: e.target.value }))}
                required
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setOpenForm(false)}>Cancelar</Button>
              <Button type="submit" className="flex-1">Guardar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
