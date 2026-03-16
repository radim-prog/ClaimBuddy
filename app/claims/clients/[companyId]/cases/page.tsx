'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ShieldAlert,
  Plus,
  ArrowLeft,
  Loader2,
  Calendar,
  Banknote,
  ChevronRight,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { InsuranceCase, InsuranceCaseStatus, InsuranceType } from '@/lib/types/insurance'
import { insuranceTypeLabel } from '@/lib/types/insurance'

// ─── Formatters ──────────────────────────────────────────────────────────────

const czk = new Intl.NumberFormat('cs-CZ', {
  style: 'currency',
  currency: 'CZK',
  maximumFractionDigits: 0,
})

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('cs-CZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

// ─── Status badge ─────────────────────────────────────────────────────────────

type StatusConfig = {
  label: string
  className: string
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  new:               { label: 'Nový',             className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  gathering_docs:    { label: 'Sbírání dok.',     className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' },
  submitted:         { label: 'Podáno',           className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' },
  under_review:      { label: 'Šetření',          className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
  additional_info:   { label: 'Doklady',          className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
  partially_approved:{ label: 'Částečně',         className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' },
  in_progress:       { label: 'Probíhá',          className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' },
  waiting:           { label: 'Čeká se',          className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
  approved:          { label: 'Schváleno',        className: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  resolved:          { label: 'Vyřešeno',         className: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  appealed:          { label: 'Odvolání',         className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  closed:            { label: 'Uzavřeno',         className: 'bg-gray-100 text-gray-600 dark:bg-gray-700/60 dark:text-gray-300' },
  cancelled:         { label: 'Zrušeno',          className: 'bg-gray-100 text-gray-600 dark:bg-gray-700/60 dark:text-gray-300' },
  rejected:          { label: 'Zamítnuto',        className: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, className: 'bg-gray-100 text-gray-600' }
  return (
    <Badge className={`text-xs font-medium px-2 py-0.5 border-0 ${cfg.className}`}>
      {cfg.label}
    </Badge>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ companyId }: { companyId: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div className="p-4 rounded-full bg-blue-50 dark:bg-blue-900/20">
        <ShieldAlert className="h-10 w-10 text-blue-400 dark:text-blue-500" />
      </div>
      <div>
        <p className="text-gray-700 dark:text-gray-200 font-semibold text-lg">
          Žádné pojistné události
        </p>
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
          Pojistné případy tohoto klienta se zobrazí zde po vytvoření
        </p>
      </div>
      <Button asChild className="mt-2 bg-blue-600 hover:bg-blue-700 text-white">
        <Link href={`/claims/cases/new?company_id=${companyId}`}>
          <Plus className="h-4 w-4 mr-1.5" />
          Nová událost
        </Link>
      </Button>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ClaimsClientCasesPage() {
  const params = useParams()
  const companyId = params?.companyId as string

  const [cases, setCases] = useState<InsuranceCase[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!companyId) return

    let cancelled = false

    async function fetchCases() {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`/api/claims/cases?company_id=${companyId}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data: InsuranceCase[] = await res.json()
        if (!cancelled) setCases(data)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Chyba načítání')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchCases()
    return () => { cancelled = true }
  }, [companyId])

  // ── Loading ──

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  // ── Error ──

  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-4 rounded-xl">
          <p className="text-sm text-red-700 dark:text-red-400">
            Nepodařilo se načíst pojistné události: {error}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl"
        >
          <Link href={`/claims/clients/${companyId}`}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Zpět na klienta
          </Link>
        </Button>
      </div>
    )
  }

  // ── Empty ──

  if (!cases || cases.length === 0) {
    return <EmptyState companyId={companyId} />
  }

  // ── List ──

  return (
    <div className="space-y-3">

      {/* Header row */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {cases.length} {cases.length === 1 ? 'případ' : cases.length <= 4 ? 'případy' : 'případů'}
        </p>
        <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
          <Link href={`/claims/cases/new?company_id=${companyId}`}>
            <Plus className="h-4 w-4 mr-1.5" />
            Nová událost
          </Link>
        </Button>
      </div>

      {/* Cards */}
      {cases.map((c) => (
        <Link key={c.id} href={`/claims/cases/${c.id}`} className="block group">
          <Card className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200">
            <CardContent className="py-4 px-5">
              <div className="flex items-start justify-between gap-3">

                {/* Left — icon + info */}
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 shrink-0 mt-0.5">
                    <ShieldAlert className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    {/* Case number + type */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-semibold text-blue-700 dark:text-blue-400 text-sm">
                        {c.case_number}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {insuranceTypeLabel(c.insurance_type as InsuranceType)}
                      </span>
                    </div>

                    {/* Description */}
                    {c.event_description && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5 truncate max-w-xs sm:max-w-md">
                        {c.event_description}
                      </p>
                    )}

                    {/* Meta row */}
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <StatusBadge status={c.status} />

                      {c.event_date && (
                        <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                          <Calendar className="h-3 w-3" />
                          {formatDate(c.event_date)}
                        </span>
                      )}

                      {c.claimed_amount != null && (
                        <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                          <Banknote className="h-3 w-3" />
                          {czk.format(c.claimed_amount)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right — arrow */}
                <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors shrink-0 mt-1" />
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}

    </div>
  )
}
