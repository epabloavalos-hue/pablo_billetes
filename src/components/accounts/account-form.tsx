'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ACCOUNT_TYPE_LABELS } from '@/types'

const COLORS = ['#4ade80', '#60a5fa', '#f87171', '#fb923c', '#a78bfa', '#fbbf24', '#34d399', '#f472b6', '#94a3b8']

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
}

export function AccountForm({ open, onClose, onSaved }: Props) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    type: 'BANK',
    balance: '',
    creditLimit: '',
    color: '#4ade80',
    icon: 'wallet',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.type) return
    setLoading(true)
    try {
      await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          balance: parseFloat(form.balance || '0'),
          creditLimit: form.creditLimit ? parseFloat(form.creditLimit) : undefined,
        }),
      })
      onSaved()
      onClose()
      setForm({ name: '', type: 'BANK', balance: '', creditLimit: '', color: '#4ade80', icon: 'wallet' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva cuenta</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="acc-name">Nombre</Label>
            <Input
              id="acc-name"
              placeholder="Ej: BBVA débito, AMEX, Efectivo..."
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Tipo de cuenta</Label>
            <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(ACCOUNT_TYPE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="balance">
              {form.type === 'CREDIT_CARD' ? 'Saldo pendiente (deuda actual)' : 'Saldo inicial'}
            </Label>
            <Input
              id="balance"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={form.balance}
              onChange={(e) => setForm((f) => ({ ...f, balance: e.target.value }))}
            />
            {form.type === 'CREDIT_CARD' && (
              <p className="text-xs text-[var(--muted)]">Ingresa el monto que ya debes (positivo). El saldo se guardará como negativo.</p>
            )}
          </div>
          {form.type === 'CREDIT_CARD' && (
            <div className="space-y-1.5">
              <Label htmlFor="creditLimit">Límite de crédito</Label>
              <Input
                id="creditLimit"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.creditLimit}
                onChange={(e) => setForm((f) => ({ ...f, creditLimit: e.target.value }))}
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, color: c }))}
                  className={`h-7 w-7 rounded-full transition-transform ${form.color === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-[var(--surface)]' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="flex-1" disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
