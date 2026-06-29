'use client'
import { useEffect, useState } from 'react'
import { formatCurrency } from '@/lib/utils'

interface Props {
  expenses: number
}

interface Bucket {
  bucket: string
  balance: number
}

export function DisponibleBar({ expenses }: Props) {
  const [disponible, setDisponible] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/savings')
      .then((r) => r.json())
      .then((buckets: Bucket[]) => {
        const sum = buckets
          .filter((b) => b.bucket === 'Necesidades' || b.bucket === 'Deseos')
          .reduce((acc, b) => acc + b.balance, 0)
        setDisponible(sum)
      })
      .catch(() => setDisponible(0))
  }, [])

  if (disponible === null) return null
  if (disponible <= 0) return null

  const pct = Math.min((expenses / disponible) * 100, 100)
  const remaining = disponible - expenses

  const barColor =
    pct >= 90 ? '#ef4444' :
    pct >= 70 ? '#f59e0b' :
    '#4ade80'

  const label =
    pct >= 90 ? '⚠ Límite casi alcanzado' :
    pct >= 70 ? '· Más de la mitad gastado' :
    '· Dentro del presupuesto'

  return (
    <div
      className="rounded-xl p-4 space-y-3"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      {/* header row */}
      <div className="flex items-center justify-between">
        <div>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.6rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
            }}
          >
            Disponible · Necesidades + Deseos
          </p>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              color: barColor,
              marginTop: '0.15rem',
              letterSpacing: '0.06em',
            }}
          >
            {label}
          </p>
        </div>
        <div className="text-right">
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 300,
              letterSpacing: '-0.02em',
              fontSize: '1.15rem',
              color: remaining >= 0 ? 'var(--foreground)' : '#ef4444',
            }}
          >
            {formatCurrency(Math.abs(remaining))}
          </p>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.55rem',
              letterSpacing: '0.1em',
              color: 'var(--muted)',
              marginTop: '0.1rem',
            }}
          >
            {remaining >= 0 ? 'restante' : 'excedido'}
          </p>
        </div>
      </div>

      {/* bar */}
      <div
        style={{
          height: '6px',
          borderRadius: '3px',
          background: 'var(--surface-2)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: barColor,
            borderRadius: '3px',
            transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1), background 0.4s ease',
            boxShadow: `0 0 8px ${barColor}60`,
          }}
        />
      </div>

      {/* footer row */}
      <div className="flex justify-between">
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.6rem',
            letterSpacing: '0.08em',
            color: 'var(--muted)',
          }}
        >
          Gastado {formatCurrency(expenses)} · {pct.toFixed(0)}%
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.6rem',
            letterSpacing: '0.08em',
            color: 'var(--muted)',
          }}
        >
          Total {formatCurrency(disponible)}
        </span>
      </div>
    </div>
  )
}
