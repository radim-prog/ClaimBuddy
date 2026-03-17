'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Shield,
  Plus,
  Search,
  Loader2,
  ChevronRight,
  AlertCircle,
  FileText,
  Clock,
  CheckCircle,
  Hourglass,
} from 'lucide-react'
import { useAccountantUser } from '@/lib/contexts/accountant-user-context'
import type {
  InsuranceCase,
  InsuranceCaseStatus,
  InsuranceType,
} from '@/lib/types/insurance'
import {
  insuranceStatusLabel,
  insuranceStatusColor,
  insuranceTypeLabel,
  priorityLabel,
  priorityColor,
} from '@/lib/types/insurance'

const STATUS_OPTIONS: { value: InsuranceCaseStatus | ''; label: string }[] = [
  { value: '', label: 'Všechny stavy' },
  { value: 'new', label: 'Nový' },
  { value: 'gathering_docs', label: 'Shromažďování' },
  { value: 'submitted', label: 'Podáno' },
  { value: 'under_review', label: 'V posouzení' },
  { value: 'additional_info', label: 'Doplnění' },
  { value: 'approved', label: 'Schváleno' },
  { value: 'rejected', label: 'Zamítnuto' },
  { value: 'closed', label: 'Uzavřeno' },
]

const TYPE_OPTIONS: { value: InsuranceType | ''; label: string }[] = [
  { value: '', label: 'Všechny typy' },
  { value: 'auto', label: 'Autopojištění' },
  { value: 'property', label: 'Majetek' },
  { value: 'life', label: 'Životní' },
  { value: 'liability', label: 'Odpovědnost' },
  { value: 'travel', label: 'Cestovní' },
  { value: 'industrial', label: 'Průmyslové' },
  { value: 'other', label: 'Jiné' },
]

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

export default function ClientClaimsPage() {
  const { companyId } = useParams<{ companyId: string }>()
  const { userId } = useAccountantUser()

  const [cases, setCases] = useState<InsuranceCase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<InsuranceCaseStatus | ''>('')
  const [filterType, setFilterType] = useState<InsuranceType | ''>('')

  const fetchCases = useCallback(async () => {
    if (!userId) { setLoading(false); return }
    try {
      const params = new URLSearchParams()
      params.set('company_id', companyId)
      if (filterStatus) params.set('status', filterStatus)
      if (search) params.set('search', search)

      const res = await fetch(`/api/claims/cases?${params}`)

      if (res.ok) {
        const data = await res.json()
        setCases(data.cases || [])
        setError(null)
      } else {
        setError('Chyba při načítání pojistných událostí')
      }
    } catch {
      setError('Nepodařilo se načíst pojistné události')
    } finally {
      setLoading(false)
    }
  }, [companyId, userId, filterStatus, search])

  useEffect(() => {
    fetchCases()
  }, [fetchCases])

  // Client-side type filter
  const filteredCases = cases.filter(c =>
    !filterType || c.insurance_type === filterType
  )

  const activeCount = cases.filter(c => !['closed', 'cancelled', 'rejected'].includes(c.status)).length
  const totalClaimed = cases.reduce((sum, c) => sum + (c.claimed_amount || 0), 0)
  const totalApproved = cases.reduce((sum, c) => sum + (c.approved_amount || 0), 0)

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Shield className="h-4 w-4 text-blue-500" />
              Celkem případů
            </div>
            <div className="text-2xl font-bold">{cases.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Clock className="h-4 w-4 text-amber-500" />
              Aktivních
            </div>
            <div className="text-2xl font-bold">{activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Hourglass className="h-4 w-4 text-purple-500" />
              Nárokováno
            </div>
            <div className="text-2xl font-bold text-purple-600">{czk.format(totalClaimed)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Schváleno
            </div>
            <div className="text-2xl font-bold text-green-600">{czk.format(totalApproved)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-indigo-600" />
              Pojistné události
            </CardTitle>
            <Link href="/accountant/claims/cases/new">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Nový případ
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Hledat číslo případu..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              className="text-sm border rounded px-2 py-1 bg-background"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as InsuranceCaseStatus | '')}
            >
              {STATUS_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <select
              className="text-sm border rounded px-2 py-1 bg-background"
              value={filterType}
              onChange={e => setFilterType(e.target.value as InsuranceType | '')}
            >
              {TYPE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Error banner */}
          {error && (
            <div className="flex items-center gap-3 p-4 mb-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300 flex-1">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30"
                onClick={() => { setError(null); setLoading(true); fetchCases() }}
              >
                <Loader2 className="h-3.5 w-3.5 mr-1" />
                Zkusit znovu
              </Button>
            </div>
          )}

          {/* List */}
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
              Načítám...
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
              <p className="mb-1 font-medium">Žádné pojistné události</p>
              <p className="text-sm">
                {cases.length > 0 ? 'Zkuste změnit filtry' : 'Vytvořte nový případ tlačítkem výše'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredCases.map(c => (
                <Link
                  key={c.id}
                  href={`/accountant/claims/cases/${c.id}`}
                  className="block border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">
                          {c.case_number}
                          {c.claim_number && <span className="text-muted-foreground ml-2">({c.claim_number})</span>}
                        </div>
                        <div className="text-sm text-muted-foreground truncate">
                          {insuranceTypeLabel(c.insurance_type)}
                          {c.event_date && <> &middot; {formatDate(c.event_date)}</>}
                          {c.insurance_company && <> &middot; {c.insurance_company.name}</>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                      {c.claimed_amount != null && c.claimed_amount > 0 && (
                        <span className="text-sm font-medium hidden sm:inline">{czk.format(c.claimed_amount)}</span>
                      )}
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${insuranceStatusColor(c.status)}`}>
                        {insuranceStatusLabel(c.status)}
                      </span>
                      <span className={`text-xs ${priorityColor(c.priority)}`}>
                        {priorityLabel(c.priority)}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  {c.event_description && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-1">{c.event_description}</p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
