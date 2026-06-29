import { cn } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'income' | 'expense' | 'transfer' | 'debt' | 'default'
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variant === 'income' && 'bg-green-500/20 text-green-400',
        variant === 'expense' && 'bg-red-500/20 text-red-400',
        variant === 'transfer' && 'bg-blue-500/20 text-blue-400',
        variant === 'debt' && 'bg-yellow-500/20 text-yellow-400',
        variant === 'default' && 'bg-[var(--surface-2)] text-[var(--foreground)]',
        className
      )}
      {...props}
    />
  )
}
