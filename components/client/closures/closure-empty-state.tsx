'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, Loader2, CheckCircle2, FileX } from 'lucide-react'
import { cn } from '@/lib/utils'

export type EmptyStateVariant = 'no_statement' | 'matching_in_progress' | 'all_matched' | 'pausal_optional'

interface ClosureEmptyStateProps {
  variant: EmptyStateVariant
  onAction?: () => void
  className?: string
}

const variants: Record<EmptyStateVariant, {
  icon: typeof Upload
  iconColor: string
  title: string
  description: string
  actionLabel?: string
  cardClass?: string
}> = {
  no_statement: {
    icon: FileX,
    iconColor: 'text-gray-400',
    title: 'Chybí bankovní výpis',
    description: 'Nahrajte bankovní výpis pro tento měsíc, abychom mohli spárovat transakce s doklady.',
    actionLabel: 'Nahrát výpis',
  },
  matching_in_progress: {
    icon: Loader2,
    iconColor: 'text-blue-500',
    title: 'Párování probíhá',
    description: 'Automatické párování transakcí s doklady právě probíhá. Výsledky se zobrazí za okamžik.',
  },
  all_matched: {
    icon: CheckCircle2,
    iconColor: 'text-green-500',
    title: 'Vše spárováno',
    description: 'Všechny transakce jsou spárované a doklady zkontrolované. Měsíc je připraven ke schválení.',
    cardClass: 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/30',
  },
  pausal_optional: {
    icon: CheckCircle2,
    iconColor: 'text-blue-500',
    title: 'Výdajové doklady nejsou potřeba',
    description: 'Používáte paušální výdaje — stačí evidovat příjmy. Výdajové doklady nejsou pro daňové přiznání nutné.',
    cardClass: 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30',
  },
}

export function ClosureEmptyState({ variant, onAction, className }: ClosureEmptyStateProps) {
  const config = variants[variant]
  const Icon = config.icon

  return (
    <Card className={cn(config.cardClass, className)}>
      <CardContent className="pt-6 pb-6 flex flex-col items-center text-center gap-3">
        <div className={cn('w-12 h-12 rounded-full bg-muted flex items-center justify-center', config.cardClass && 'bg-transparent')}>
          <Icon className={cn('h-6 w-6', config.iconColor, variant === 'matching_in_progress' && 'animate-spin')} />
        </div>
        <div>
          <h3 className="font-medium text-sm">{config.title}</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">{config.description}</p>
        </div>
        {config.actionLabel && onAction && (
          <Button size="sm" onClick={onAction} className="mt-1">
            <Upload className="h-4 w-4 mr-1.5" />
            {config.actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
