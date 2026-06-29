'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { formatCurrency, formatMonth, getCurrentMonth } from '@/lib/utils'
import { Plus, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const STORAGE_KEY = 'finance_distribuidora_v4'
const COLORS = ['#4ade80', '#60a5fa', '#f87171', '#fb923c', '#a78bfa', '#fbbf24', '#34d399', '#f472b6', '#94a3b8', '#e879f9']

interface Rule {
  id: string
  label: string
  percentage: number
  color: string
  emoji?: string
}

function generateId() { return Math.random().toString(36).slice(2) }

const DEFAULT_RULES: Rule[] = [
  { id: '1', label: 'Necesidades',      percentage: 35, color: '#4ade80', emoji: '🛒' },
  { id: '2', label: 'Deseos',           percentage: 15, color: '#60a5fa', emoji: '🎮' },
  { id: '3', label: 'Deudas',           percentage: 10, color: '#f87171', emoji: '💳' },
  { id: '4', label: 'Vivienda',         percentage: 10, color: '#fb923c', emoji: '🏠' },
  { id: '5', label: 'Fondo emergencia', percentage: 15, color: '#fbbf24', emoji: '🆘' },
  { id: '6', label: 'Ahorro/Inversión', percentage:  5, color: '#a78bfa', emoji: '💰' },
  { id: '7', label: 'Gathijas',         percentage: 10, color: '#f9a8d4', emoji: '🐱' },
]

export default function DistribuidoraPage() {
  const router = useRouter()
  const { year, month } = getCurrentMonth()
  const [rules, setRules] = useState<Rule[]>(DEFAULT_RULES)
  const [incomeInput, setIncomeInput] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [newPct, setNewPct] = useState('')
  const [newColor, setNewColor] = useState(COLORS[0])
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const income = parseFloat(incomeInput) || 0

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) { try { setRules(JSON.parse(stored)) } catch {} }
  }, [])

  function persistRules(updated: Rule[]) {
    setRules(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  function addRule() {
    if (!newLabel || !newPct) return
    persistRules([...rules, { id: generateId(), label: newLabel, percentage: parseFloat(newPct), color: newColor }])
    setNewLabel(''); setNewPct(''); setNewColor(COLORS[rules.length % COLORS.length]); setAdding(false)
  }

  function removeRule(id: string) { persistRules(rules.filter((r) => r.id !== id)) }
  function updatePct(id: string, v: string) { persistRules(rules.map((r) => r.id === id ? { ...r, percentage: parseFloat(v) || 0 } : r)) }
  function updateLabel(id: string, v: string) { persistRules(rules.map((r) => r.id === id ? { ...r, label: v } : r)) }

  async function guardarRegistro() {
    if (income <= 0) return
    setSaving(true)
    const distributionId = generateId()
    const items = rules.map((r) => ({ bucket: r.label, amount: income * (r.percentage / 100), color: r.color, emoji: r.emoji }))
    await fetch('/api/savings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'distribute', distributionId, items }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      setIncomeInput('')
      router.push('/dashboard/ahorro')
    }, 1200)
  }

  const totalPct = rules.reduce((s, r) => s + r.percentage, 0)
  const remaining = 100 - totalPct
  const grandTotal = income * (Math.min(totalPct, 100) / 100)

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--foreground)]">Distribuidora de ingresos</h1>
        <p className="text-sm text-[var(--muted)] capitalize mt-0.5">{formatMonth(year, month)}</p>
      </div>

      {/* Income input */}
      <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 space-y-2">
        <p className="text-xs text-green-400 uppercase tracking-wide">¿Cuánto dinero tienes para distribuir?</p>
        <div className="flex items-center gap-2">
          <span className="text-green-400 font-bold text-xl">$</span>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={incomeInput}
            onChange={(e) => { setIncomeInput(e.target.value); setSaved(false) }}
            className="flex-1 bg-transparent text-3xl font-bold text-green-400 focus:outline-none placeholder:text-green-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-green-600 text-sm font-medium">MXN</span>
        </div>
        {income === 0 && (
          <p className="text-xs text-green-700">Escribe una cantidad para ver la distribución automática</p>
        )}
      </div>

      {/* % warning */}
      {Math.abs(totalPct - 100) > 0.5 && (
        <div className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${remaining < 0 ? 'bg-red-500/10 border border-red-500/30 text-red-400' : 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400'}`}>
          <AlertCircle className="h-4 w-4 shrink-0" />
          {remaining > 0 ? `Te sobra ${remaining.toFixed(0)}% por asignar` : `Estás ${Math.abs(remaining).toFixed(0)}% por encima del 100%`}
        </div>
      )}

      {/* Visual bar */}
      <div className="space-y-2">
        <div className="flex h-4 w-full rounded-full overflow-hidden gap-0.5">
          {rules.map((r) => (
            <div key={r.id} className="transition-all" style={{ width: `${Math.max(r.percentage, 0)}%`, backgroundColor: r.color }} title={`${r.label}: ${r.percentage}%`} />
          ))}
          {remaining > 0 && <div className="flex-1 bg-[var(--surface-2)]" />}
        </div>
        <div className="flex flex-wrap gap-3">
          {rules.map((r) => (
            <span key={r.id} className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: r.color }} />
              {r.emoji} {r.label} ({r.percentage}%)
            </span>
          ))}
        </div>
      </div>

      {/* Rules list */}
      <div className="space-y-2">
        {rules.map((rule) => (
          <div key={rule.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="flex items-center gap-3">
              <span className="text-base shrink-0">{rule.emoji ?? '•'}</span>
              <div className="flex-1 min-w-0 space-y-2">
                <input
                  type="text"
                  value={rule.label}
                  onChange={(e) => updateLabel(rule.id, e.target.value)}
                  className="w-full bg-transparent text-sm font-medium text-[var(--foreground)] focus:outline-none border-b border-transparent focus:border-[var(--border)] pb-0.5 transition-colors"
                />
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number" min="0" max="100" step="1"
                      value={rule.percentage}
                      onChange={(e) => updatePct(rule.id, e.target.value)}
                      className="w-16 bg-[var(--surface-2)] text-[var(--foreground)] text-sm rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[var(--brand)] text-center"
                    />
                    <span className="text-sm text-[var(--muted)]">%</span>
                  </div>
                  {income > 0 && (
                    <span className="text-sm font-semibold text-[var(--foreground)] tabular-nums">
                      = {formatCurrency(income * (rule.percentage / 100))}
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => removeRule(rule.id)} className="text-[var(--muted)] hover:text-red-400 transition-colors p-1 shrink-0">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}

      </div>

      {/* Add rule */}
      {adding ? (
        <div className="rounded-xl border border-[var(--brand)]/30 bg-[var(--surface)] p-4 space-y-3">
          <p className="text-sm font-medium text-[var(--foreground)]">Nueva categoría</p>
          <div className="space-y-1.5">
            <Label htmlFor="new-label">Nombre</Label>
            <Input id="new-label" placeholder="Ej: Educación, Viajes..." value={newLabel} onChange={(e) => setNewLabel(e.target.value)} autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-pct">Porcentaje</Label>
            <div className="flex items-center gap-2">
              <Input id="new-pct" type="number" min="0" max="100" step="1" placeholder="0" value={newPct} onChange={(e) => setNewPct(e.target.value)} className="w-24" />
              <span className="text-sm text-[var(--muted)]">%</span>
              {newPct && income > 0 && <span className="text-sm text-[var(--brand)] font-medium ml-1">= {formatCurrency(income * (parseFloat(newPct) / 100))}</span>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setNewColor(c)} className={`h-6 w-6 rounded-full transition-transform ${newColor === c ? 'scale-125 ring-2 ring-white ring-offset-1 ring-offset-[var(--surface)]' : ''}`} style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setAdding(false)}>Cancelar</Button>
            <Button size="sm" onClick={addRule}>Agregar</Button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="w-full rounded-xl border border-dashed border-[var(--border)] py-3 text-sm text-[var(--muted)] hover:border-[var(--brand)] hover:text-[var(--brand)] transition-colors flex items-center justify-center gap-2">
          <Plus className="h-4 w-4" /> Agregar categoría
        </button>
      )}

      {/* Summary + Guardar */}
      {income > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-2">
          <p className="text-xs text-[var(--muted)] uppercase tracking-wide font-medium">Resumen de distribución</p>
          {rules.map((r) => (
            <div key={r.id} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="text-xs">{r.emoji}</span>
                <span className="text-[var(--muted)]">{r.label}</span>
                <span className="text-xs bg-[var(--surface-2)] text-[var(--muted)] px-1.5 rounded">{r.percentage}%</span>
              </div>
              <span className="font-semibold text-[var(--foreground)] tabular-nums">{formatCurrency(income * (r.percentage / 100))}</span>
            </div>
          ))}
          <div className="pt-2 border-t border-[var(--border)] flex justify-between text-sm font-semibold">
            <span className="text-[var(--foreground)]">Total comprometido</span>
            <span className={grandTotal > income ? 'text-red-400' : 'text-[var(--brand)]'}>{formatCurrency(grandTotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--muted)]">Libre disponible</span>
            <span className={income - grandTotal >= 0 ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>{formatCurrency(income - grandTotal)}</span>
          </div>

          {/* CTA */}
          <div className="pt-3">
            <button
              onClick={guardarRegistro}
              disabled={saving || saved}
              className={`w-full rounded-xl py-3.5 text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                saved
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-[var(--brand)] text-black hover:bg-[var(--brand-hover)] disabled:opacity-60'
              }`}
            >
              {saved ? (
                <><CheckCircle2 className="h-4 w-4" /> ¡Registro guardado! Redirigiendo...</>
              ) : saving ? (
                'Guardando...'
              ) : (
                '💾 Guardar registro de distribución'
              )}
            </button>
            <p className="text-xs text-[var(--muted)] text-center mt-2">
              Esto registrará los montos en tu pestaña Ahorro
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
