'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  ShieldCheck,
  Search,
  Calendar,
  MapPin,
  Banknote,
  Clock,
  AlertCircle,
  Plus,
} from 'lucide-react'
import { useCachedFetch } from '@/lib/hooks/use-cached-fetch'
import {
  InsuranceCase,
  insuranceStatusLabel,
  insuranceStatusColor,
  insuranceTypeLabel,
} from '@/lib/types/insurance'

export default function ClientClaimsPage() {
  const [search, setSearch] = useState('')

  const { data, loading } = useCachedFetch<{ cases: InsuranceCase[] }>(
    'client-claims',
    () => fetch('/api/client/claims').then(r => r.json()),
    { ttl: 60_000 }
  )

  const cases = data?.cases ?? []

  const filtered = cases.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      c.case_number?.toLowerCase().includes(q) ||
      c.event_description?.toLowerCase().includes(q) ||
      c.event_location?.toLowerCase().includes(q) ||
      insuranceTypeLabel(c.insurance_type).toLowerCase().includes(q)
    )
  })

  const activeCases = filtered.filter(c => !['closed', 'cancelled', 'rejected'].includes(c.status))
  const closedCases = filtered.filter(c => ['closed', 'cancelled', 'rejected'].includes(c.status))

  const formatAmount = (amount: number | null) =>
    amount != null ? amount.toLocaleString('cs-CZ') + ' Kč' : '—'

  const formatDate = (date: string | null) => {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('cs-CZ')
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-display text-gray-900 dark:text-white">
          Pojistné události
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mt-1">
          Přehled vašich pojistných událostí a stav jejich řešení
        </p>
      </div>

      {/* Action bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Hledat podle čísla, popisu, místa..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <a
          href="/claims/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors shrink-0"
        >
          <Plus className="h-4 w-4" />
          Nahlásit pojistnou událost
        </a>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full" />
        </div>
      ) : cases.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <ShieldCheck className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
              Žádné pojistné události
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Zatím nemáte evidované žádné pojistné události.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Active cases */}
          {activeCases.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Aktivní ({activeCases.length})
              </h3>
              {activeCases.map(c => (
                <CaseCard key={c.id} case_={c} formatAmount={formatAmount} formatDate={formatDate} />
              ))}
            </div>
          )}

          {/* Closed cases */}
          {closedCases.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Uzavřené ({closedCases.length})
              </h3>
              {closedCases.map(c => (
                <CaseCard key={c.id} case_={c} formatAmount={formatAmount} formatDate={formatDate} />
              ))}
            </div>
          )}

          {filtered.length === 0 && search && (
            <div className="text-center py-8 text-gray-500">
              Žádné pojistné události neodpovídají hledání &quot;{search}&quot;
            </div>
          )}
        </>
      )}
    </div>
  )
}

function CaseCard({
  case_: c,
  formatAmount,
  formatDate,
}: {
  case_: InsuranceCase
  formatAmount: (a: number | null) => string
  formatDate: (d: string | null) => string
}) {
  const hasDeadline = c.deadline && new Date(c.deadline) > new Date()
  const isOverdue = c.deadline && new Date(c.deadline) < new Date() && !['closed', 'cancelled', 'approved', 'rejected'].includes(c.status)

  return (
    <Card className={isOverdue ? 'border-red-300 dark:border-red-800' : ''}>
      <CardContent className="py-4">
        <div className="flex flex-col sm:flex-row sm:items-start gap-3">
          {/* Header */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                {c.case_number}
              </span>
              <Badge className={`text-xs ${insuranceStatusColor(c.status)}`}>
                {insuranceStatusLabel(c.status)}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {insuranceTypeLabel(c.insurance_type)}
              </Badge>
            </div>

            {c.event_description && (
              <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 mb-2">
                {c.event_description}
              </p>
            )}

            {/* Meta row */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
              {c.event_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(c.event_date)}
                </span>
              )}
              {c.event_location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {c.event_location}
                </span>
              )}
              {(c.insurance_company as { name?: string })?.name && (
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  {(c.insurance_company as { name: string }).name}
                </span>
              )}
              {c.deadline && (
                <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                  {isOverdue ? <AlertCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                  Lhůta: {formatDate(c.deadline)}
                </span>
              )}
            </div>
          </div>

          {/* Amounts */}
          <div className="flex sm:flex-col items-end gap-1 text-right shrink-0">
            {c.claimed_amount != null && (
              <div>
                <div className="text-xs text-gray-500">Nárokováno</div>
                <div className="text-sm font-medium flex items-center gap-1">
                  <Banknote className="h-3 w-3 text-gray-400" />
                  {formatAmount(c.claimed_amount)}
                </div>
              </div>
            )}
            {c.approved_amount != null && c.approved_amount > 0 && (
              <div>
                <div className="text-xs text-gray-500">Schváleno</div>
                <div className="text-sm font-medium text-green-600">
                  {formatAmount(c.approved_amount)}
                </div>
              </div>
            )}
            {c.paid_amount > 0 && (
              <div>
                <div className="text-xs text-gray-500">Vyplaceno</div>
                <div className="text-sm font-bold text-green-700">
                  {formatAmount(c.paid_amount)}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
