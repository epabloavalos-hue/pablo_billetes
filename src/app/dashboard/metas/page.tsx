'use client'
import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Trash2, CheckCircle, Target, TrendingDown, ShoppingBag } from 'lucide-react'

interface Goal {
  id: string
  name: string
  type: string
  targetAmount: number
  currentAmount: number
  deadline?: string
  notes?: string
  isCompleted: boolean
}

const GOAL_TYPE_LABELS: Record<string, string> = {
  SAVINGS: 'Ahorro',
  DEBT_PAYMENT: 'Pago de deuda',
  PURCHASE: 'Compra',
}

const GOAL_ICONS: Record<string, React.ElementType> = {
  SAVINGS: Target,
  DEBT_PAYMENT: TrendingDown,
  PURCHASE: ShoppingBag,
}

export default function MetasPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [openForm, setOpenForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', type: 'SAVINGS', targetAmount: '', currentAmount: '', deadline: '', notes: '' })

  const fetchGoals = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/goals')
    setGoals(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { fetchGoals() }, [fetchGoals])

  async function saveGoal(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, targetAmount: parseFloat(form.targetAmount), currentAmount: parseFloat(form.currentAmount || '0') }),
    })
    setOpenForm(false)
    setForm({ name: '', type: 'SAVINGS', targetAmount: '', currentAmount: '', deadline: '', notes: '' })
    fetchGoals()
  }

  async function toggleComplete(goal: Goal) {
    await fetch('/api/goals', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: goal.id, isCompleted: !goal.isCompleted }),
    })
    fetchGoals()
  }

  async function deleteGoal(id: string) {
    if (!confirm('¿Eliminar esta meta?')) return
    await fetch(`/api/goals?id=${id}`, { method: 'DELETE' })
    fetchGoals()
  }

  const active = goals.filter((g) => !g.isCompleted)
  const completed = goals.filter((g) => g.isCompleted)

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--foreground)]">Metas financieras</h1>
        <Button onClick={() => setOpenForm(true)}>+ Nueva meta</Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-[var(--muted)]">Cargando...</div>
      ) : goals.length === 0 ? (
        <div className="text-center py-12 text-[var(--muted)]">
          <p className="mb-3">Sin metas aún. ¡Crea tu primera meta!</p>
          <Button onClick={() => setOpenForm(true)}>Crear meta</Button>
        </div>
      ) : (
        <div className="space-y-6">
          {active.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wide">En progreso</h2>
              {active.map((goal) => {
                const pct = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0
                const Icon = GOAL_ICONS[goal.type] ?? Target
                return (
                  <div key={goal.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 group">
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-lg bg-[var(--brand)]/10 flex items-center justify-center shrink-0">
                        <Icon className="h-5 w-5 text-[var(--brand)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-[var(--foreground)]">{goal.name}</p>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => toggleComplete(goal)} title="Marcar como completada" className="text-green-400 hover:text-green-300">
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button onClick={() => deleteGoal(goal.id)} className="text-[var(--muted)] hover:text-red-400">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-[var(--muted)]">
                          {GOAL_TYPE_LABELS[goal.type]}
                          {goal.deadline && ` · Fecha límite: ${formatDate(goal.deadline)}`}
                        </p>
                        {goal.notes && <p className="text-xs text-[var(--muted)] mt-1 italic">{goal.notes}</p>}
                        <div className="mt-3 space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="text-[var(--muted)]">Progreso: <span className="text-[var(--foreground)] font-medium">{formatCurrency(goal.currentAmount)}</span></span>
                            <span className="text-[var(--muted)]">Meta: <span className="text-[var(--foreground)] font-medium">{formatCurrency(goal.targetAmount)}</span></span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-[var(--surface-2)]">
                            <div
                              className="h-full rounded-full bg-[var(--brand)] transition-all"
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                          <p className="text-xs text-right text-[var(--muted)]">
                            {pct.toFixed(0)}% · Falta {formatCurrency(Math.max(goal.targetAmount - goal.currentAmount, 0))}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {completed.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wide">Completadas</h2>
              {completed.map((goal) => (
                <div key={goal.id} className="rounded-xl border border-green-500/20 bg-green-500/5 p-4 flex items-center gap-3 group opacity-75">
                  <CheckCircle className="h-5 w-5 text-green-400 shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-[var(--foreground)]">{goal.name}</p>
                    <p className="text-xs text-[var(--muted)]">{formatCurrency(goal.targetAmount)} — completada</p>
                  </div>
                  <button onClick={() => deleteGoal(goal.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--muted)] hover:text-red-400">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Dialog open={openForm} onOpenChange={(v) => !v && setOpenForm(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva meta</DialogTitle>
          </DialogHeader>
          <form onSubmit={saveGoal} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="goal-name">Nombre de la meta</Label>
              <Input id="goal-name" placeholder="Ej: Fondo de emergencia, Vacaciones..." value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(GOAL_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="target">Meta (MXN)</Label>
                <Input id="target" type="number" step="0.01" min="0" placeholder="0.00" value={form.targetAmount} onChange={(e) => setForm((f) => ({ ...f, targetAmount: e.target.value }))} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="current">Ya tengo</Label>
                <Input id="current" type="number" step="0.01" min="0" placeholder="0.00" value={form.currentAmount} onChange={(e) => setForm((f) => ({ ...f, currentAmount: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deadline">Fecha límite (opcional)</Label>
              <Input id="deadline" type="date" value={form.deadline} onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="goal-notes">Notas (opcional)</Label>
              <Input id="goal-notes" placeholder="Notas..." value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
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
