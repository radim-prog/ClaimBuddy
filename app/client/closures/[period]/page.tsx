'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Loader2,
  Upload,
  FileText,
  Landmark,
  Receipt,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useClientUser } from '@/lib/contexts/client-user-context'

const monthNames = ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen', 'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec']

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  approved: { label: 'Schváleno', color: 'text-green-600', icon: CheckCircle2 },
  reviewed: { label: 'Zkontrolováno', color: 'text-green-600', icon: CheckCircle2 },
  uploaded: { label: 'Nahráno', color: 'text-yellow-600', icon: AlertCircle },
  missing: { label: 'Chybí', color: 'text-red-600', icon: XCircle },
  skipped: { label: 'Přeskočeno', color: 'text-gray-500 dark:text-gray-400', icon: CheckCircle2 },
}

interface ClosureDetail {
  closure: {
    status: string
    bank_statement_status: string
    expense_documents_status: string
    income_invoices_status: string
  }
  transactions_summary: { total: number; matched: number; unmatched: number; private: number }
  documents_summary: { total: number; approved: number; pending: number }
  invoices_summary: { total_income: number; matched: number; unmatched: number }
  tax_impact: { income_tax: number; vat: number; total: number }
}

export default function ClosureDetailPage() {
  const params = useParams()
  const router = useRouter()
  const period = params.period as string
  const { visibleCompanies, selectedCompanyId } = useClientUser()
  const companyId = selectedCompanyId || visibleCompanies[0]?.id || ''

  const [data, setData] = useState<ClosureDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!companyId || !period) return
    setLoading(true)
    fetch(`/api/client/closures?company_id=${companyId}&period=${period}`)
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [companyId, period])

  const [year, month] = period.split('-').map(Number)
  const monthName = monthNames[(month || 1) - 1] || ''

  const overallLabel = !data ? '' :
    data.closure.status === 'closed' ? 'Uzavřeno' :
    data.closure.status === 'in_progress' ? 'Rozpracováno' : 'Otevřeno'

  const overallColor = !data ? '' :
    data.closure.status === 'closed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
    data.closure.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold font-display">{monthName} {year}</h1>
        </div>
        {data && <Badge className={cn('rounded-md', overallColor)}>{overallLabel}</Badge>}
      </div>

      {data && (
        <>
          {/* 3 status cards */}
          <div className="space-y-3">
            <StatusCard
              icon={Landmark}
              label="Bankovní výpis"
              status={data.closure.bank_statement_status}
              detail={data.transactions_summary.total > 0
                ? `${data.transactions_summary.total} transakcí, ${data.transactions_summary.matched} spárováno${data.transactions_summary.unmatched > 0 ? `, ${data.transactions_summary.unmatched} chybí doklad` : ''}`
                : 'Žádné transakce'
              }
            />
            <StatusCard
              icon={Receipt}
              label="Doklady (výdaje)"
              status={data.closure.expense_documents_status}
              detail={data.documents_summary.total > 0
                ? `${data.documents_summary.total} dokladů, ${data.documents_summary.approved} schváleno${data.documents_summary.pending > 0 ? `, ${data.documents_summary.pending} čeká` : ''}`
                : data.transactions_summary.unmatched > 0
                  ? `Chybí ${data.transactions_summary.unmatched} dokladů`
                  : 'Žádné doklady'
              }
              showUpload={data.transactions_summary.unmatched > 0}
              onUpload={() => router.push('/client/documents')}
            />
            <StatusCard
              icon={FileText}
              label="Faktury (příjmy)"
              status={data.closure.income_invoices_status}
              detail={data.invoices_summary.total_income > 0
                ? `${data.invoices_summary.matched} z ${data.invoices_summary.total_income} napárováno`
                : 'Žádné faktury'
              }
            />
          </div>

          {/* Tax impact */}
          {data.tax_impact.total > 0 && (
            <Card className="rounded-2xl border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-bold text-red-700 dark:text-red-300">Dopad chybějících dokladů</span>
                </div>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                  {data.tax_impact.total.toLocaleString('cs-CZ')} Kč
                </p>
                <div className="flex items-center gap-4 mt-1 text-xs text-red-600 dark:text-red-400">
                  {data.tax_impact.income_tax > 0 && <span>Daň {data.tax_impact.income_tax.toLocaleString('cs-CZ')} Kč</span>}
                  {data.tax_impact.vat > 0 && <span>DPH {data.tax_impact.vat.toLocaleString('cs-CZ')} Kč</span>}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Missing documents list — CTA */}
          {data.transactions_summary.unmatched > 0 && (
            <Card className="rounded-2xl">
              <CardContent className="p-4">
                <p className="text-sm font-medium mb-3">
                  {data.transactions_summary.unmatched} {data.transactions_summary.unmatched === 1 ? 'transakce' : data.transactions_summary.unmatched < 5 ? 'transakce' : 'transakcí'} bez dokladu
                </p>
                <Button onClick={() => router.push('/client/documents')} className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  Dodejte chybějící doklady
                </Button>
              </CardContent>
            </Card>
          )}

          {/* All good state */}
          {data.closure.status === 'closed' && data.transactions_summary.unmatched === 0 && (
            <Card className="rounded-2xl border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20">
              <CardContent className="p-6 text-center">
                <CheckCircle2 className="h-10 w-10 text-green-600 mx-auto mb-2" />
                <p className="font-bold text-green-700 dark:text-green-300">Vše v pořádku!</p>
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">Všechny doklady jsou dodány a uzávěrka je uzavřena.</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

function StatusCard({
  icon: Icon,
  label,
  status,
  detail,
  showUpload,
  onUpload,
}: {
  icon: typeof Landmark
  label: string
  status: string
  detail: string
  showUpload?: boolean
  onUpload?: () => void
}) {
  const cfg = statusConfig[status] || statusConfig.missing
  const StatusIcon = cfg.icon

  return (
    <Card className="rounded-2xl">
      <CardContent className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-muted rounded-lg shrink-0">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{label}</span>
              <div className={cn('flex items-center gap-1 text-xs font-medium', cfg.color)}>
                <StatusIcon className="h-3.5 w-3.5" />
                {cfg.label}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{detail}</p>
          </div>
          {showUpload && onUpload && (
            <Button variant="outline" size="sm" onClick={onUpload} className="shrink-0">
              <Upload className="h-3 w-3 mr-1" />
              Nahrát
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
