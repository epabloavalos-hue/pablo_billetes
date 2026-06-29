'use client'
import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Trash2, CheckCircle, Bell, CreditCard, Calendar } from 'lucide-react'

interface Reminder {
  id: string
  title: string
  type: string
  dueDate: string
  amount?: number
  isRecurring: boolean
  isDone: boolean
  notes?: string
}

const REMINDER_TYPE_LABELS: Record<string, string> = {
  PAYMENT: 'Pago',
  CUT_DATE: 'Fecha de corte',
  CUSTOM: 'Personalizado',
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  PAYMENT: CreditCard,
  CUT_DATE: Calendar,
  CUSTOM: Bell,
}

function daysUntil(date: string) {
  const diff = new Date(date).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export default function RecordatoriosPage() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [openForm, setOpenForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ title: '', type: 'PAYMENT', dueDate: '', amount: '', isRecurring: false, notes: '' })

  const fetchReminders = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/reminders')
    setReminders(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { fetchReminders() }, [fetchReminders])

  async function saveReminder(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, amount: form.amount ? parseFloat(form.amount) : undefined }),
    })
    setOpenForm(false)
    setForm({ title: '', type: 'PAYMENT', dueDate: '', amount: '', isRecurring: false, notes: '' })
    fetchReminders()
  }

  async function markDone(id: string) {
    await fetch('/api/reminders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isDone: true }),
    })
    fetchReminders()
  }

  async function deleteReminder(id: string) {
    await fetch(`/api/reminders?id=${id}`, { method: 'DELETE' })
    fetchReminders()
  }

  const urgent = reminders.filter((r) => daysUntil(r.dueDate) <= 3)
  const upcoming = reminders.filter((r) => daysUntil(r.dueDate) > 3)

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--foreground)]">Recordatorios</h1>
        <Button onClick={() => setOpenForm(true)}>+ Nuevo</Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-[var(--muted)]">Cargando...</div>
      ) : reminders.length === 0 ? (
        <div className="text-center py-12 text-[var(--muted)]">
          <p className="mb-3">Sin recordatorios pendientes.</p>
          <Button onClick={() => setOpenForm(true)}>Crear recordatorio</Button>
        </div>
      ) : (
        <div className="space-y-6">
          {urgent.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wide flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
                Urgentes (próximos 3 días)
              </h2>
              {urgent.map((r) => <ReminderCard key={r.id} reminder={r} onDone={markDone} onDelete={deleteReminder} urgent />)}
            </div>
          )}
          {upcoming.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wide">Próximos</h2>
              {upcoming.map((r) => <ReminderCard key={r.id} reminder={r} onDone={markDone} onDelete={deleteReminder} />)}
            </div>
          )}
        </div>
      )}

      <Dialog open={openForm} onOpenChange={(v) => !v && setOpenForm(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo recordatorio</DialogTitle>
          </DialogHeader>
          <form onSubmit={saveReminder} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="rem-title">Título</Label>
              <Input id="rem-title" placeholder="Ej: Pago AMEX, Corte BBVA..." value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(REMINDER_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="rem-date">Fecha</Label>
                <Input id="rem-date" type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rem-amount">Monto (opcional)</Label>
                <Input id="rem-amount" type="number" step="0.01" min="0" placeholder="0.00" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-[var(--muted)] cursor-pointer">
              <input type="checkbox" className="rounded" checked={form.isRecurring} onChange={(e) => setForm((f) => ({ ...f, isRecurring: e.target.checked }))} />
              Recurrente (mensual)
            </label>
            <div className="space-y-1.5">
              <Label htmlFor="rem-notes">Notas (opcional)</Label>
              <Input id="rem-notes" placeholder="Notas..." value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
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

function ReminderCard({
  reminder,
  onDone,
  onDelete,
  urgent,
}: {
  reminder: Reminder
  onDone: (id: string) => void
  onDelete: (id: string) => void
  urgent?: boolean
}) {
  const days = daysUntil(reminder.dueDate)
  const Icon = TYPE_ICONS[reminder.type] ?? Bell

  return (
    <div className={`rounded-xl border p-4 flex items-center gap-3 group ${urgent ? 'border-red-500/30 bg-red-500/5' : 'border-[var(--border)] bg-[var(--surface)]'}`}>
      <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${urgent ? 'bg-red-500/20' : 'bg-[var(--surface-2)]'}`}>
        <Icon className={`h-4 w-4 ${urgent ? 'text-red-400' : 'text-[var(--muted)]'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-[var(--foreground)]">{reminder.title}</p>
        <p className="text-xs text-[var(--muted)]">
          {REMINDER_TYPE_LABELS[reminder.type]} · {formatDate(reminder.dueDate)}
          {reminder.isRecurring && ' · 🔁 Mensual'}
        </p>
        {days <= 0 ? (
          <span className="text-xs text-red-400 font-medium">Vencido</span>
        ) : days === 1 ? (
          <span className="text-xs text-red-400 font-medium">Mañana</span>
        ) : (
          <span className="text-xs text-[var(--muted)]">En {days} días</span>
        )}
      </div>
      {reminder.amount && (
        <span className="text-sm font-semibold text-[var(--foreground)] tabular-nums">{formatCurrency(reminder.amount)}</span>
      )}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onDone(reminder.id)} title="Marcar como hecho" className="p-1.5 rounded text-green-400 hover:bg-green-500/10">
          <CheckCircle className="h-4 w-4" />
        </button>
        <button onClick={() => onDelete(reminder.id)} className="p-1.5 rounded text-[var(--muted)] hover:text-red-400 hover:bg-red-500/10">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
