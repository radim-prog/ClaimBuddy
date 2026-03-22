'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Upload,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface TaxOverviewWidgetProps {
  companyId: string
  closures: Array<{
    period: string
    company_id: string
    bank_statement_status: string
    expense_documents_status: string
    income_invoices_status: string
  }>
}

interface TaxData {
  year: number
  legal_form: string
  vat_payer: boolean
  months: Array<{
    period: string
    unmatched_count: number
    cumulative: {
      income_tax: number
      social_insurance: number
      health_insurance: number
      vat: number
      total: number
    }
  }>
  total: {
    income_tax: number
    social_insurance: number
    health_insurance: number
    vat: number
    total: number
  }
  unmatched_count: number
}

function formatCZK(amount: number): string {
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: 'CZK',
    maximumFractionDigits: 0,
  }).format(amount)
}

type ClosureIcon = '\u2705' | '\u26A0\uFE0F' | '\u274C' | '\u2014'

function getClosureIcon(closure: TaxOverviewWidgetProps['closures'][0] | undefined, isFuture: boolean, isCurrent: boolean = false): ClosureIcon {
  if (isFuture) return '\u2014'
  if (!closure) return isCurrent ? '\u26A0\uFE0F' : '\u2014'
  const statuses = [closure.bank_statement_status, closure.expense_documents_status, closure.income_invoices_status]
  if (statuses.some(s => s === 'missing')) return isCurrent ? '\u26A0\uFE0F' : '\u274C'
  if (statuses.some(s => s === 'uploaded')) return '\u26A0\uFE0F'
  return '\u2705'
}

export function TaxOverviewWidget({ companyId, closures }: TaxOverviewWidgetProps) {
  const router = useRouter()
  const [data, setData] = useState<TaxData | null>(null)
  const [loading, setLoading] = useState(true)

  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()

  useEffect(() => {
    if (!companyId) return
    setLoading(true)
    fetch(`/api/client/bank-transactions/tax-impact-detail?company_id=${companyId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [companyId])

  if (loading) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    )
  }

  const unmatchedCount = data?.unmatched_count || 0
  const totalImpact = data?.total?.total || 0

  // Severity: 0 = green, 1-5 = amber, 6+ = red
  const severity = unmatchedCount === 0 ? 'green' : unmatchedCount <= 5 ? 'amber' : 'red'

  // Mini closure strip — 12 months
  const closureStrip = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1
    const period = `${currentYear}-${String(month).padStart(2, '0')}`
    const closure = closures.find(c => c.period === period)
    const isFuture = month > currentMonth + 1
    const isCurrent = month === currentMonth
    return { month, period, icon: getClosureIcon(closure, isFuture, isCurrent), isFuture }
  })

  // Green — all matched
  if (severity === 'green') {
    return (
      <Card className="rounded-2xl border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20">
        <CardContent className="py-5 px-5">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-bold text-green-700 dark:text-green-300 text-sm">Daňový přehled</p>
              <p className="text-xs text-green-600 dark:text-green-400">Všechny výdaje jsou spárované</p>
            </div>
          </div>
          {/* Mini closure strip */}
          <ClosureStrip items={closureStrip} onMonthClick={(period) => router.push(`/client/closures/${period}`)} />
        </CardContent>
      </Card>
    )
  }

  // Amber/Red — has unmatched
  const borderColor = severity === 'amber'
    ? 'border-amber-200 dark:border-amber-800'
    : 'border-red-200 dark:border-red-800'
  const bgColor = severity === 'amber'
    ? 'bg-amber-50/50 dark:bg-amber-950/20'
    : 'bg-red-50/50 dark:bg-red-950/20'
  const textColor = severity === 'amber'
    ? 'text-amber-700 dark:text-amber-300'
    : 'text-red-700 dark:text-red-300'
  const subColor = severity === 'amber'
    ? 'text-amber-600 dark:text-amber-400'
    : 'text-red-600 dark:text-red-400'

  return (
    <Card className={cn('rounded-2xl', borderColor, bgColor)}>
      <CardContent className="py-5 px-5 space-y-3">
        {/* Header + main number */}
        <div className="flex items-start gap-3">
          <div className="p-2 bg-white/60 dark:bg-white/10 rounded-lg shrink-0">
            {severity === 'amber'
              ? <AlertTriangle className="h-5 w-5 text-amber-600" />
              : <TrendingDown className="h-5 w-5 text-red-600" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground">Odhadovaná daň navíc</p>
            <p className={cn('text-2xl font-bold', textColor)}>
              {formatCZK(totalImpact)}
            </p>
            <p className={cn('text-xs mt-0.5', subColor)}>
              {unmatchedCount} {unmatchedCount === 1 ? 'nedoložený výdaj' : unmatchedCount < 5 ? 'nedoložené výdaje' : 'nedoložených výdajů'}
            </p>
          </div>
        </div>

        {/* 4-line breakdown */}
        {data && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Daň z příjmu:</span>
              <span className={cn('font-medium', subColor)}>{formatCZK(data.total.income_tax)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sociální poj.:</span>
              <span className="font-medium text-orange-600 dark:text-orange-400">{formatCZK(data.total.social_insurance)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Zdravotní poj.:</span>
              <span className="font-medium text-amber-600 dark:text-amber-400">{formatCZK(data.total.health_insurance)}</span>
            </div>
            {data.vat_payer && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">DPH:</span>
                <span className="font-medium text-blue-600 dark:text-blue-400">{formatCZK(data.total.vat)}</span>
              </div>
            )}
          </div>
        )}

        {/* Mini closure strip */}
        <ClosureStrip items={closureStrip} onMonthClick={(period) => router.push(`/client/closures/${period}`)} />

        {/* CTA */}
        <Button asChild variant="outline" size="sm" className="w-full">
          <Link href="/client/documents">
            <Upload className="h-3.5 w-3.5 mr-1.5" />
            Dodejte chybějící doklady
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

function ClosureStrip({ items, onMonthClick }: {
  items: Array<{ month: number; period: string; icon: ClosureIcon; isFuture: boolean }>
  onMonthClick: (period: string) => void
}) {
  const monthLabels = ['L', 'Ú', 'B', 'D', 'K', 'Č', 'Č', 'S', 'Z', 'Ř', 'L', 'P']

  return (
    <div className="flex items-center gap-1">
      {items.map(({ month, period, icon, isFuture }) => (
        <button
          key={month}
          disabled={isFuture}
          onClick={() => !isFuture && onMonthClick(period)}
          className={cn(
            'flex-1 text-center py-1 rounded text-[10px] leading-none transition-colors',
            isFuture ? 'opacity-30' : 'hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer',
          )}
          title={`${monthLabels[month - 1]} — ${period}`}
        >
          <div className="text-[8px] text-muted-foreground mb-0.5">{monthLabels[month - 1]}</div>
          <div>{icon}</div>
        </button>
      ))}
    </div>
  )
}
