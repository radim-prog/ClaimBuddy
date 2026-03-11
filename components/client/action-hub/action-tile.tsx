'use client'

import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ActionTileProps {
  icon: LucideIcon
  label: string
  subtitle?: string
  badge?: number
  variant: 'primary' | 'secondary'
  color: 'blue' | 'green' | 'amber'
  onClick: () => void
}

const colorStyles = {
  blue: {
    primary: 'bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-500/25',
    secondary: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
    icon: 'text-white',
    iconSecondary: 'text-blue-600 dark:text-blue-400',
  },
  green: {
    primary: 'bg-gradient-to-br from-green-500 to-green-700 text-white shadow-lg shadow-green-500/25',
    secondary: 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800',
    icon: 'text-white',
    iconSecondary: 'text-green-600 dark:text-green-400',
  },
  amber: {
    primary: 'bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-lg shadow-amber-500/25',
    secondary: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
    icon: 'text-white',
    iconSecondary: 'text-amber-600 dark:text-amber-400',
  },
}

export function ActionTile({ icon: Icon, label, subtitle, badge, variant, color, onClick }: ActionTileProps) {
  const styles = colorStyles[color]

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative w-full h-20 rounded-xl flex items-center gap-4 px-5 transition-all duration-150 active:scale-[0.97]',
        variant === 'primary' ? styles.primary : styles.secondary,
      )}
    >
      <Icon className={cn(
        'shrink-0',
        variant === 'primary' ? 'h-8 w-8' : 'h-7 w-7',
        variant === 'primary' ? styles.icon : styles.iconSecondary,
      )} />
      <div className="text-left min-w-0">
        <div className={cn(
          'font-bold font-display truncate',
          variant === 'primary' ? 'text-lg' : 'text-base',
        )}>
          {label}
        </div>
        {subtitle && (
          <div className={cn(
            'text-sm truncate',
            variant === 'primary' ? 'text-white/80' : 'opacity-70',
          )}>
            {subtitle}
          </div>
        )}
      </div>
      {badge !== undefined && badge > 0 && (
        <span className="absolute top-2 right-2 min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold">
          {badge}
        </span>
      )}
    </button>
  )
}
