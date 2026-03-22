'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Download, TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CashEntry {
  id: string
  doc_type: 'PPD' | 'VPD'
  doc_number: string
  transaction_date: string
  amount: number
  description?: string | null
  counterparty_name?: string | null
  category?: string | null
  running_balance: number
}

interface CashBookData {
  company_id: string
  period: string
  opening_balance: number
  closing_balance: number
  total_income: number
  total_expense: number
  entries: CashEntry[]
  count: number
}

interface CashBookViewProps {
  data: CashBookData
  onExport?: () => void
  onRowClick?: (entry: CashEntry) => void
  className?: string
}

const fmtCZK = (n: number) => Math.round(n).toLocaleString('cs-CZ')

export function CashBookView({ data, onExport, onRowClick, className }: CashBookViewProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <Wallet className="h-3.5 w-3.5" /> Poč. zůstatek
            </div>
            <p className="text-lg font-bold font-mono">{fmtCZK(data.opening_balance)} Kč</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <TrendingUp className="h-3.5 w-3.5 text-green-500" /> Příjmy
            </div>
            <p className="text-lg font-bold text-green-600 font-mono">+{fmtCZK(data.total_income)} Kč</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <TrendingDown className="h-3.5 w-3.5 text-red-500" /> Výdaje
            </div>
            <p className="text-lg font-bold text-red-600 font-mono">-{fmtCZK(data.total_expense)} Kč</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <Wallet className="h-3.5 w-3.5" /> Kon. zůstatek
            </div>
            <p className={cn('text-lg font-bold font-mono', data.closing_balance >= 0 ? 'text-green-600' : 'text-red-600')}>
              {fmtCZK(data.closing_balance)} Kč
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm">
            Pokladní kniha {data.period !== 'all' ? `– ${data.period}` : ''} ({data.count} záznamů)
          </CardTitle>
          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="h-4 w-4 mr-1.5" />
              Export XML
            </Button>
          )}
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs text-muted-foreground">
                <th className="text-left py-2 px-2 font-medium">Č. dokladu</th>
                <th className="text-left py-2 px-2 font-medium">Datum</th>
                <th className="text-left py-2 px-2 font-medium">Partner</th>
                <th className="text-left py-2 px-2 font-medium">Popis</th>
                <th className="text-right py-2 px-2 font-medium">Příjem</th>
                <th className="text-right py-2 px-2 font-medium">Výdaj</th>
                <th className="text-right py-2 px-2 font-medium">Zůstatek</th>
              </tr>
            </thead>
            <tbody>
              {/* Opening balance row */}
              <tr className="border-b bg-muted/30">
                <td colSpan={6} className="py-1.5 px-2 text-xs text-muted-foreground italic">
                  Počáteční zůstatek
                </td>
                <td className="py-1.5 px-2 text-right font-mono text-xs font-medium">
                  {fmtCZK(data.opening_balance)} Kč
                </td>
              </tr>

              {data.entries.map((entry) => (
                <tr
                  key={entry.id}
                  className={cn(
                    'border-b hover:bg-muted/50 transition-colors',
                    onRowClick && 'cursor-pointer'
                  )}
                  onClick={() => onRowClick?.(entry)}
                >
                  <td className="py-1.5 px-2">
                    <Badge
                      variant={entry.doc_type === 'PPD' ? 'default' : 'destructive'}
                      className={cn(
                        'text-[10px] px-1.5 py-0',
                        entry.doc_type === 'PPD' ? 'bg-green-600' : ''
                      )}
                    >
                      {entry.doc_type}
                    </Badge>
                    <span className="ml-1.5 text-xs text-muted-foreground">{entry.doc_number}</span>
                  </td>
                  <td className="py-1.5 px-2 text-xs tabular-nums">
                    {new Date(entry.transaction_date).toLocaleDateString('cs-CZ')}
                  </td>
                  <td className="py-1.5 px-2 text-xs truncate max-w-[140px]">
                    {entry.counterparty_name || '—'}
                  </td>
                  <td className="py-1.5 px-2 text-xs truncate max-w-[180px] text-muted-foreground">
                    {entry.description || '—'}
                  </td>
                  <td className="py-1.5 px-2 text-right font-mono text-xs">
                    {entry.amount > 0 ? (
                      <span className="text-green-600">+{fmtCZK(entry.amount)}</span>
                    ) : ''}
                  </td>
                  <td className="py-1.5 px-2 text-right font-mono text-xs">
                    {entry.amount < 0 ? (
                      <span className="text-red-600">-{fmtCZK(Math.abs(entry.amount))}</span>
                    ) : ''}
                  </td>
                  <td className="py-1.5 px-2 text-right font-mono text-xs font-medium">
                    {fmtCZK(entry.running_balance)}
                  </td>
                </tr>
              ))}

              {data.entries.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground text-sm">
                    Žádné hotovostní transakce
                  </td>
                </tr>
              )}

              {/* Closing balance row */}
              {data.entries.length > 0 && (
                <tr className="bg-muted/30 font-medium">
                  <td colSpan={4} className="py-1.5 px-2 text-xs">Celkem / Konečný zůstatek</td>
                  <td className="py-1.5 px-2 text-right font-mono text-xs text-green-600">
                    +{fmtCZK(data.total_income)}
                  </td>
                  <td className="py-1.5 px-2 text-right font-mono text-xs text-red-600">
                    -{fmtCZK(data.total_expense)}
                  </td>
                  <td className="py-1.5 px-2 text-right font-mono text-xs">
                    {fmtCZK(data.closing_balance)} Kč
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
