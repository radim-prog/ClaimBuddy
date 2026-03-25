'use client'

import { Suspense, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useCachedFetch } from '@/lib/hooks/use-cached-fetch'
import { useUrlFilters } from '@/lib/hooks/use-url-filters'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  FileText,
  Search,
  Filter,
  Plus,
  Clock,
  CheckCircle,
  Hourglass,
  Loader2,
  ChevronRight,
  Download,
} from 'lucide-react'
import Link from 'next/link'
import type {
  InsuranceCase,
  InsuranceCaseStatus,
  InsuranceType,
  CasePriority,
} from '@/lib/types/insurance'
import {
  insuranceStatusLabel,
  insuranceStatusColor,
  insuranceTypeLabel,
  priorityLabel,
  priorityColor,
} from '@/lib/types/insurance'

// ─── Local types ────────────────────────────────────────────────────────────

type ClaimsStats = {
  total: number
  active: number
  waiting: number
  resolved_this_month: number
}

type InsuranceCompanyOption = {
  id: string
  name: string
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ALL_STATUSES: InsuranceCaseStatus[] = [
  'new',
  'gathering_docs',
  'submitted',
  'under_review',
  'additional_info',
  'partially_approved',
  'approved',
  'rejected',
  'appealed',
  'closed',
  'cancelled',
]

const ALL_TYPES: InsuranceType[] = [
  'auto',
  'property',
  'life',
  'liability',
  'travel',
  'industrial',
  'other',
]

const ALL_PRIORITIES: CasePriority[] = ['low', 'normal', 'high', 'urgent']

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

// ─── KPI Card ────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  icon,
  iconColor,
  bgColor,
}: {
  label: string
  value: number | string
  icon: React.ReactNode
  iconColor: string
  bgColor: string
}) {
  return (
    <Card className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
      <CardContent className="py-4 px-5">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${bgColor}`}>
            <span className={iconColor}>{icon}</span>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-tight">{label}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div className="p-4 rounded-full bg-blue-50 dark:bg-blue-900/20">
        <FileText className="h-10 w-10 text-blue-400 dark:text-blue-500" />
      </div>
      <div>
        <p className="text-gray-700 dark:text-gray-200 font-semibold text-lg">
          {hasFilters ? 'Žádné spisy neodpovídají filtrům' : 'Žádné spisy'}
        </p>
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
          {hasFilters
            ? 'Zkuste upravit nebo vymazat filtry'
            : 'Pojistné případy se zde zobrazí po vytvoření'}
        </p>
      </div>
      {!hasFilters && (
        <Button asChild className="mt-2 bg-blue-600 hover:bg-blue-700 text-white">
          <Link href="/accountant/claims/cases/new">
            <Plus className="h-4 w-4 mr-1.5" />
            Vytvořit první případ
          </Link>
        </Button>
      )}
    </div>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function ClaimsCasesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>}>
      <ClaimsCasesPageInner />
    </Suspense>
  )
}

function ClaimsCasesPageInner() {
  const router = useRouter()

  // ── URL-based filter state (Krok 4) ──
  const { filters, setFilter, clearFilters } = useUrlFilters({
    search: '',
    status: '',
    company: '',
    priority: '',
    type: '',
  })

  const search = filters.search
  const statusFilter = filters.status as InsuranceCaseStatus | ''
  const companyFilter = filters.company
  const priorityFilter = filters.priority as CasePriority | ''
  const typeFilter = filters.type as InsuranceType | ''

  // ── Stats ──
  const { data: stats, loading: statsLoading } = useCachedFetch<ClaimsStats>(
    'claims-stats',
    () => fetch('/api/claims/stats').then((r) => r.json()),
  )

  // ── Insurance companies for filter dropdown ──
  const { data: insuranceCompanies } = useCachedFetch<InsuranceCompanyOption[]>(
    'claims-companies',
    async () => {
      const res = await fetch('/api/claims/companies')
      const data = await res.json()
      return Array.isArray(data) ? data : (Array.isArray(data?.companies) ? data.companies : [])
    },
  )

  // ── Cases — rebuild fetch key whenever filters change ──
  const casesKey = useMemo(() => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (statusFilter) params.set('status', statusFilter)
    if (companyFilter) params.set('insurance_company_id', companyFilter)
    if (priorityFilter) params.set('priority', priorityFilter)
    if (typeFilter) params.set('insurance_type', typeFilter)
    return `claims-cases:${params.toString()}`
  }, [search, statusFilter, companyFilter, priorityFilter, typeFilter])

  const casesFetcher = useCallback(async () => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (statusFilter) params.set('status', statusFilter)
    if (companyFilter) params.set('insurance_company_id', companyFilter)
    if (priorityFilter) params.set('priority', priorityFilter)
    if (typeFilter) params.set('insurance_type', typeFilter)
    const res = await fetch(`/api/claims/cases?${params.toString()}`)
    const data = await res.json()
    const list = Array.isArray(data) ? data : Array.isArray(data?.cases) ? data.cases : []
    return list as InsuranceCase[]
  }, [search, statusFilter, companyFilter, priorityFilter, typeFilter])

  const { data: cases, loading: casesLoading } = useCachedFetch<InsuranceCase[]>(
    casesKey,
    casesFetcher,
  )

  const hasFilters = !!(search || statusFilter || companyFilter || priorityFilter || typeFilter)

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 md:p-6 max-w-screen-xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pojistné případy</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Evidence a správa pojistných událostí
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/api/claims/export"
            className="inline-flex items-center h-10 px-4 rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Download className="h-4 w-4 mr-1.5" />
            Export CSV
          </a>
          <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white shrink-0">
            <Link href="/accountant/claims/cases/new">
              <Plus className="h-4 w-4 mr-1.5" />
              Nový případ
            </Link>
          </Button>
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          label="Celkem spisů"
          value={statsLoading ? '…' : (stats?.total ?? 0)}
          icon={<FileText className="h-5 w-5" />}
          iconColor="text-blue-600 dark:text-blue-400"
          bgColor="bg-blue-100 dark:bg-blue-900/30"
        />
        <KpiCard
          label="Aktivní"
          value={statsLoading ? '…' : (stats?.active ?? 0)}
          icon={<Clock className="h-5 w-5" />}
          iconColor="text-green-600 dark:text-green-400"
          bgColor="bg-green-100 dark:bg-green-900/30"
        />
        <KpiCard
          label="Čekající na pojišťovnu"
          value={statsLoading ? '…' : (stats?.waiting ?? 0)}
          icon={<Hourglass className="h-5 w-5" />}
          iconColor="text-orange-600 dark:text-orange-400"
          bgColor="bg-orange-100 dark:bg-orange-900/30"
        />
        <KpiCard
          label="Vyřešené tento měsíc"
          value={statsLoading ? '…' : (stats?.resolved_this_month ?? 0)}
          icon={<CheckCircle className="h-5 w-5" />}
          iconColor="text-green-600 dark:text-green-400"
          bgColor="bg-green-100 dark:bg-green-900/30"
        />
      </div>

      {/* ── Filters ── */}
      <Card className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <CardContent className="py-4 px-5">
          <div className="flex flex-col md:flex-row gap-3">

            {/* Search */}
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Hledat spis, pojistku, popis…"
                value={search}
                onChange={(e) => setFilter('search', e.target.value)}
                className="pl-9 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
              />
            </div>

            {/* Status */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <select
                value={statusFilter}
                onChange={(e) => setFilter('status', e.target.value)}
                className="h-10 pl-9 pr-3 rounded-md border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[180px]"
              >
                <option value="">Všechny stavy</option>
                {ALL_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {insuranceStatusLabel(s)}
                  </option>
                ))}
              </select>
            </div>

            {/* Insurance company */}
            <div className="relative">
              <select
                value={companyFilter}
                onChange={(e) => setFilter('company', e.target.value)}
                className="h-10 px-3 rounded-md border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[180px]"
              >
                <option value="">Všechny pojišťovny</option>
                {(Array.isArray(insuranceCompanies) ? insuranceCompanies : []).map((ic) => (
                  <option key={ic.id} value={ic.id}>
                    {ic.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div className="relative">
              <select
                value={priorityFilter}
                onChange={(e) => setFilter('priority', e.target.value)}
                className="h-10 px-3 rounded-md border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]"
              >
                <option value="">Všechny priority</option>
                {ALL_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {priorityLabel(p)}
                  </option>
                ))}
              </select>
            </div>

            {/* Insurance type */}
            <div className="relative">
              <select
                value={typeFilter}
                onChange={(e) => setFilter('type', e.target.value)}
                className="h-10 px-3 rounded-md border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[170px]"
              >
                <option value="">Všechny typy</option>
                {ALL_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {insuranceTypeLabel(t)}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear filters */}
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-10 px-3 text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 shrink-0"
              >
                Vymazat filtry
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Table ── */}
      <Card className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
        {casesLoading && !cases ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : !Array.isArray(cases) || cases.length === 0 ? (
          <EmptyState hasFilters={hasFilters} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60">
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    Číslo spisu
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    Klient
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap hidden md:table-cell">
                    Pojišťovna
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap hidden lg:table-cell">
                    Typ
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap hidden md:table-cell">
                    Priorita
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap hidden lg:table-cell">
                    Nárok (Kč)
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap hidden lg:table-cell">
                    Vyplaceno (Kč)
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap hidden xl:table-cell">
                    Zpracovatel
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap hidden xl:table-cell">
                    Datum události
                  </th>
                  <th className="px-4 py-3 w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                {cases.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => router.push(`/accountant/claims/cases/${c.id}`)}
                    className="hover:bg-blue-50/40 dark:hover:bg-blue-900/10 cursor-pointer transition-colors"
                  >
                    {/* Číslo spisu — Link (Krok 7) */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Link href={`/accountant/claims/cases/${c.id}`} onClick={(e) => e.stopPropagation()} className="font-mono font-medium text-blue-700 dark:text-blue-400 hover:underline">
                        {c.case_number}
                      </Link>
                      {c.policy_number && (
                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                          {c.policy_number}
                        </div>
                      )}
                    </td>

                    {/* Klient */}
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {c.company?.name ?? '—'}
                      </span>
                      {c.company?.ico && (
                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                          IČO {c.company.ico}
                        </div>
                      )}
                    </td>

                    {/* Pojišťovna */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-gray-700 dark:text-gray-300">
                        {c.insurance_company?.name ?? '—'}
                      </span>
                    </td>

                    {/* Typ */}
                    <td className="px-4 py-3 hidden lg:table-cell whitespace-nowrap">
                      <span className="text-gray-600 dark:text-gray-400">
                        {insuranceTypeLabel(c.insurance_type)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge className={`text-xs font-medium px-2 py-0.5 border-0 ${insuranceStatusColor(c.status)}`}>
                        {insuranceStatusLabel(c.status)}
                      </Badge>
                    </td>

                    {/* Priorita */}
                    <td className="px-4 py-3 hidden md:table-cell whitespace-nowrap">
                      <span className={`font-medium text-xs ${priorityColor(c.priority)}`}>
                        {priorityLabel(c.priority)}
                      </span>
                    </td>

                    {/* Nárok */}
                    <td className="px-4 py-3 text-right hidden lg:table-cell whitespace-nowrap">
                      <span className="text-gray-700 dark:text-gray-300">
                        {c.claimed_amount != null ? czk.format(c.claimed_amount) : '—'}
                      </span>
                    </td>

                    {/* Vyplaceno */}
                    <td className="px-4 py-3 text-right hidden lg:table-cell whitespace-nowrap">
                      <span className={`font-medium ${c.paid_amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                        {c.paid_amount > 0 ? czk.format(c.paid_amount) : '—'}
                      </span>
                    </td>

                    {/* Zpracovatel */}
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <span className="text-gray-600 dark:text-gray-400 text-xs">
                        {c.assigned_user?.name ?? '—'}
                      </span>
                    </td>

                    {/* Datum události */}
                    <td className="px-4 py-3 hidden xl:table-cell whitespace-nowrap">
                      <span className="text-gray-600 dark:text-gray-400 text-xs">
                        {formatDate(c.event_date)}
                      </span>
                    </td>

                    {/* Arrow */}
                    <td className="px-3 py-3">
                      <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
