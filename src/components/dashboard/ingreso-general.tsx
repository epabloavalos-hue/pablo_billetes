'use client'
import { useState, useEffect, useRef } from 'react'
import { formatCurrency } from '@/lib/utils'
import { Lock, Eye, EyeOff, Pencil, Check, X, Delete } from 'lucide-react'

const PIN_KEY = 'finance_pin'
const INCOME_KEY = 'finance_ingreso_general'

export function IngresoGeneral() {
  const [pin, setPin] = useState<string | null>(null)
  const [income, setIncome] = useState<number | null>(null)
  const [unlocked, setUnlocked] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [mode, setMode] = useState<'enter' | 'setup_pin' | 'setup_income'>('enter')
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState(false)
  const [newPin, setNewPin] = useState('')
  const [incomeInput, setIncomeInput] = useState('')
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const editRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const storedPin = localStorage.getItem(PIN_KEY)
    const storedIncome = localStorage.getItem(INCOME_KEY)
    setPin(storedPin)
    if (storedIncome) setIncome(parseFloat(storedIncome))
  }, [])

  function openModal() {
    setPinInput('')
    setPinError(false)
    setMode(pin ? 'enter' : 'setup_pin')
    setShowModal(true)
  }

  function handlePinDigit(d: string) {
    if (pinInput.length >= 4) return
    const next = pinInput + d
    setPinInput(next)
    setPinError(false)

    if (next.length === 4) {
      setTimeout(() => {
        if (mode === 'enter') {
          if (next === pin) {
            setUnlocked(true)
            setShowModal(false)
            setPinInput('')
          } else {
            setPinError(true)
            setPinInput('')
          }
        } else if (mode === 'setup_pin') {
          setNewPin(next)
          setPinInput('')
          setMode('setup_income')
        }
      }, 150)
    }
  }

  function handleDeleteDigit() {
    setPinInput((p) => p.slice(0, -1))
    setPinError(false)
  }

  function handleSaveIncome() {
    const val = parseFloat(incomeInput)
    if (!val || val <= 0) return
    localStorage.setItem(PIN_KEY, newPin)
    localStorage.setItem(INCOME_KEY, String(val))
    setPin(newPin)
    setIncome(val)
    setUnlocked(true)
    setShowModal(false)
    setIncomeInput('')
    setNewPin('')
  }

  function handleLock() {
    setUnlocked(false)
    setEditing(false)
  }

  function startEdit() {
    setEditValue(income?.toString() ?? '')
    setEditing(true)
    setTimeout(() => editRef.current?.focus(), 50)
  }

  function saveEdit() {
    const val = parseFloat(editValue)
    if (val > 0) {
      localStorage.setItem(INCOME_KEY, String(val))
      setIncome(val)
    }
    setEditing(false)
  }

  function cancelEdit() {
    setEditing(false)
  }

  const PAD = ['1','2','3','4','5','6','7','8','9','','0','⌫']

  return (
    <>
      {/* Button / revealed income */}
      {!unlocked ? (
        <button
          onClick={openModal}
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-2)] transition-colors"
        >
          <Lock className="h-4 w-4 text-[var(--muted)]" />
          Ingreso general
        </button>
      ) : (
        <div className="inline-flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-2.5">
          {editing ? (
            <>
              <span className="text-green-400 font-bold text-sm">$</span>
              <input
                ref={editRef}
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit() }}
                className="w-32 bg-transparent text-green-400 font-bold text-sm focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button onClick={saveEdit} className="text-green-400 hover:text-green-300"><Check className="h-4 w-4" /></button>
              <button onClick={cancelEdit} className="text-[var(--muted)] hover:text-red-400"><X className="h-4 w-4" /></button>
            </>
          ) : (
            <>
              <span className="text-green-400 font-bold text-sm">{formatCurrency(income ?? 0)}<span className="text-green-600 font-normal">/mes</span></span>
              <button onClick={startEdit} className="text-green-700 hover:text-green-400 transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
              <button onClick={handleLock} className="text-green-700 hover:text-[var(--muted)] transition-colors ml-1"><EyeOff className="h-3.5 w-3.5" /></button>
            </>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-xs rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-5">

            {mode === 'enter' && (
              <>
                <div className="text-center space-y-1">
                  <div className="text-2xl mb-2">🔐</div>
                  <p className="font-semibold text-[var(--foreground)]">Ingresa tu PIN</p>
                  <p className="text-xs text-[var(--muted)]">4 dígitos para ver tu ingreso general</p>
                </div>
                <PinDots value={pinInput} error={pinError} />
                {pinError && <p className="text-xs text-red-400 text-center">PIN incorrecto, intenta de nuevo</p>}
                <PinPad onDigit={handlePinDigit} onDelete={handleDeleteDigit} pad={PAD} />
                <button onClick={() => setShowModal(false)} className="w-full text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors pt-1">Cancelar</button>
              </>
            )}

            {mode === 'setup_pin' && (
              <>
                <div className="text-center space-y-1">
                  <div className="text-2xl mb-2">🔑</div>
                  <p className="font-semibold text-[var(--foreground)]">Crea tu PIN</p>
                  <p className="text-xs text-[var(--muted)]">Elige 4 dígitos para proteger tu ingreso</p>
                </div>
                <PinDots value={pinInput} error={false} />
                <PinPad onDigit={handlePinDigit} onDelete={handleDeleteDigit} pad={PAD} />
                <button onClick={() => setShowModal(false)} className="w-full text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors pt-1">Cancelar</button>
              </>
            )}

            {mode === 'setup_income' && (
              <>
                <div className="text-center space-y-1">
                  <div className="text-2xl mb-2">💵</div>
                  <p className="font-semibold text-[var(--foreground)]">¿Cuánto recibes al mes?</p>
                  <p className="text-xs text-[var(--muted)]">Este dato quedará protegido con tu PIN</p>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3">
                  <span className="text-green-400 font-bold text-xl">$</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={incomeInput}
                    onChange={(e) => setIncomeInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveIncome()}
                    autoFocus
                    className="flex-1 bg-transparent text-2xl font-bold text-green-400 focus:outline-none placeholder:text-[var(--surface-2)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-[var(--muted)] text-sm">MXN</span>
                </div>
                <button
                  onClick={handleSaveIncome}
                  disabled={!incomeInput || parseFloat(incomeInput) <= 0}
                  className="w-full rounded-xl bg-[var(--brand)] text-black font-bold py-3 text-sm hover:bg-[var(--brand-hover)] transition-colors disabled:opacity-40"
                >
                  Guardar y activar
                </button>
                <button onClick={() => setShowModal(false)} className="w-full text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">Cancelar</button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

function PinDots({ value, error }: { value: string; error: boolean }) {
  return (
    <div className="flex justify-center gap-4">
      {[0,1,2,3].map((i) => (
        <div
          key={i}
          className={`h-4 w-4 rounded-full border-2 transition-all ${
            error
              ? 'border-red-400 bg-red-400'
              : i < value.length
              ? 'border-[var(--brand)] bg-[var(--brand)]'
              : 'border-[var(--border)] bg-transparent'
          }`}
        />
      ))}
    </div>
  )
}

function PinPad({ onDigit, onDelete, pad }: { onDigit: (d: string) => void; onDelete: () => void; pad: string[] }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {pad.map((key, i) => {
        if (key === '') return <div key={i} />
        if (key === '⌫') return (
          <button key={i} onClick={onDelete} className="flex items-center justify-center h-14 rounded-xl bg-[var(--surface-2)] text-[var(--muted)] hover:bg-[var(--border)] transition-colors">
            <Delete className="h-5 w-5" />
          </button>
        )
        return (
          <button key={i} onClick={() => onDigit(key)} className="flex items-center justify-center h-14 rounded-xl bg-[var(--surface-2)] text-[var(--foreground)] text-xl font-semibold hover:bg-[var(--border)] active:scale-95 transition-all">
            {key}
          </button>
        )
      })}
    </div>
  )
}
