'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ArrowLeftRight, Wallet, BarChart3, Sliders } from 'lucide-react'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Inicio' },
  { href: '/dashboard/transacciones', icon: ArrowLeftRight, label: 'Movimientos' },
  { href: '/dashboard/cuentas', icon: Wallet, label: 'Cuentas' },
  { href: '/dashboard/reportes', icon: BarChart3, label: 'Reportes' },
  { href: '/dashboard/distribuidora', icon: Sliders, label: 'Distribuidora' },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] bg-[var(--surface)] flex">
      {nav.map(({ href, icon: Icon, label }) => {
        const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors',
              active ? 'text-[var(--brand)]' : 'text-[var(--muted)]'
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
