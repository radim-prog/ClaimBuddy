'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { TaxImpactInline } from './tax-impact-inline'
import { CheckCircle2, HelpCircle, XCircle, Eye } from 'lucide-react'

type TierType = 'auto' | 'suggestions' | 'unmatched' | 'private'

const tierConfig: Record<TierType, { label: string; color: string; icon: typeof CheckCircle2; badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  auto: { label: 'Automaticky spárováno', color: 'text-green-600', icon: CheckCircle2, badgeVariant: 'default' },
  suggestions: { label: 'Návrhy k potvrzení', color: 'text-yellow-600', icon: HelpCircle, badgeVariant: 'secondary' },
  unmatched: { label: 'Nespárováno', color: 'text-red-600', icon: XCircle, badgeVariant: 'destructive' },
  private: { label: 'Soukromé převody', color: 'text-gray-500', icon: Eye, badgeVariant: 'outline' },
}

interface Transaction {
  id: string
  amount: number
  transaction_date: string
  counterparty_name?: string | null
  variable_symbol?: string | null
  description?: string | null
  match_confidence?: number | null
  tax_impact?: number | null
  total_impact?: number | null
}

interface TransactionGroupCardProps {
  tier: TierType
  transactions: Transaction[]
  renderActions?: (tx: Transaction) => React.ReactNode
  className?: string
}

export function TransactionGroupCard({ tier, transactions, renderActions, className }: TransactionGroupCardProps) {
  const config = tierConfig[tier]
  const Icon = config.icon

  if (transactions.length === 0) return null

  const totalAmount = transactions.reduce((s, t) => s + t.amount, 0)

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Icon className={cn('h-5 w-5', config.color)} />
            {config.label}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={config.badgeVariant}>{transactions.length}</Badge>
            <span className="text-sm font-mono font-medium">
              {totalAmount.toLocaleString('cs-CZ', { minimumFractionDigits: 2 })} Kč
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="divide-y">
          {transactions.map(tx => (
            <div key={tx.id} className="py-2 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">
                    {tx.counterparty_name || tx.description || 'Neznámý'}
                  </span>
                  {tx.variable_symbol && (
                    <span className="text-xs text-muted-foreground">VS: {tx.variable_symbol}</span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{tx.transaction_date}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {tier === 'unmatched' && tx.total_impact ? (
                  <TaxImpactInline total={tx.total_impact} />
                ) : null}
                <span className={cn(
                  'text-sm font-mono font-medium tabular-nums',
                  tx.amount >= 0 ? 'text-green-600' : 'text-red-600'
                )}>
                  {tx.amount.toLocaleString('cs-CZ', { minimumFractionDigits: 2 })} Kč
                </span>
                {renderActions?.(tx)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
