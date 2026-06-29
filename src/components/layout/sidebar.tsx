'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const nav = [
  { href: '/dashboard',               symbol: '○', label: 'Inicio' },
  { href: '/dashboard/distribuidora', symbol: '◈', label: 'Distribuidora' },
  { href: '/dashboard/ahorro',        symbol: '◇', label: 'Ahorro' },
  { href: '/dashboard/reportes',      symbol: '▲', label: 'Reportes' },
  { href: '/dashboard/metas',         symbol: '▸', label: 'Metas' },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <>
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          position: 'fixed',
          top: '1.2rem',
          left: collapsed ? '0.75rem' : '13.5rem',
          zIndex: 200,
          width: '1.5rem',
          height: '1.5rem',
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          borderRadius: '4px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--muted)',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.6rem',
          transition: 'left 0.25s ease',
        }}
        title={collapsed ? 'Mostrar barra' : 'Ocultar barra'}
      >
        {collapsed ? '▸' : '◂'}
      </button>

      <aside
        className="shrink-0 flex flex-col border-r overflow-hidden"
        style={{
          background: 'var(--surface)',
          borderColor: 'var(--border)',
          width: collapsed ? '0' : '13rem',
          padding: collapsed ? '0' : '2.5rem 1rem',
          transition: 'width 0.25s ease, padding 0.25s ease',
          minHeight: '100vh',
        }}
      >
        {/* brand */}
        <div className="px-3 mb-10" style={{ whiteSpace: 'nowrap' }}>
          <span
            className="block"
            style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 300,
              fontSize: '1.1rem',
              letterSpacing: '0.35em',
              textTransform: 'uppercase',
              color: 'var(--foreground)',
            }}
          >
            FINANZAS
          </span>
          <p
            className="mt-1.5"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.55rem',
              letterSpacing: '0.12em',
              color: 'var(--border)',
            }}
          >
            {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'short' })}
          </p>
        </div>

        {/* nav */}
        <nav className="flex flex-col gap-0.5 flex-1" style={{ whiteSpace: 'nowrap' }}>
          {nav.map(({ href, symbol, label }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors"
                style={{
                  background: active ? 'var(--surface-2)' : 'transparent',
                  color: active ? 'var(--foreground)' : 'var(--muted)',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.65rem',
                    width: '1rem',
                    textAlign: 'center',
                    opacity: active ? 1 : 0.35,
                  }}
                >
                  {symbol}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.72rem',
                    fontWeight: active ? 500 : 300,
                    letterSpacing: '0.08em',
                  }}
                >
                  {label}
                </span>
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
