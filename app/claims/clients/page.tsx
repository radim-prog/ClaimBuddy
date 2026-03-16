'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useCachedFetch } from '@/lib/hooks/use-cached-fetch'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Building2,
  Search,
  Users,
  Loader2,
  ChevronRight,
  ShieldAlert,
  FileText,
  DollarSign,
  AlertCircle,
} from 'lucide-react'
import type { InsuranceCase, InsuranceCaseStatus } from '@/lib/types/insurance'
import { insuranceStatusLabel, insuranceStatusColor } from '@/lib/types/insurance'

type Company = {
  id: string
  name: string
  ico: string
  status: string
}

type CompanyClaims = {
  companyId: string
  caseCount: number
  totalClaimed: number
  totalPaid: number
  lastStatus: InsuranceCaseStatus | null
}

const czk = new Intl.NumberFormat('cs-CZ', {
  style: 'currency',
  currency: 'CZK',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

type StatusFilter = 'all' | 'with_cases' | 'no_cases' | 'active_cases'

export default function ClaimsClientsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  // Fetch companies
  const { data: companiesData, loading: companiesLoading } = useCachedFetch<{
    companies: Company[]
  }>('/api/accountant/companies')

  // Fetch all claims cases
  const { data: casesData, loading: casesLoading } = useCachedFetch<{
    cases: InsuranceCase[]
  }>('/api/claims/cases?limit=100')

  const loading = companiesLoading || casesLoading
  const companies = companiesData?.companies || []
  const cases = casesData?.cases || []

  // Build claims summary per company
  const claimsByCompany = useMemo(() => {
    const map = new Map<string, CompanyClaims>()

    for (const c of cases) {
      if (!c.company_id) continue
      const existing = map.get(c.company_id)
      if (existing) {
        existing.caseCount++
        existing.totalClaimed += c.claimed_amount || 0
        existing.totalPaid += c.paid_amount || 0
        // Keep the most recent case status (cases are ordered by created_at desc)
        if (!existing.lastStatus) {
          existing.lastStatus = c.status
        }
      } else {
        map.set(c.company_id, {
          companyId: c.company_id,
          caseCount: 1,
          totalClaimed: c.claimed_amount || 0,
          totalPaid: c.paid_amount || 0,
          lastStatus: c.status,
        })
      }
    }

    return map
  }, [cases])

  // Active statuses (not resolved/closed)
  const activeStatuses: InsuranceCaseStatus[] = [
    'new', 'gathering_docs', 'submitted', 'under_review', 'additional_info', 'appealed',
  ]

  // Filter and search
  const filteredCompanies = useMemo(() => {
    let filtered = companies.filter(c => c.status === 'active')

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(
        c => c.name.toLowerCase().includes(q) || c.ico?.includes(q)
      )
    }

    // Status filter
    if (statusFilter === 'with_cases') {
      filtered = filtered.filter(c => (claimsByCompany.get(c.id)?.caseCount || 0) > 0)
    } else if (statusFilter === 'no_cases') {
      filtered = filtered.filter(c => !claimsByCompany.has(c.id))
    } else if (statusFilter === 'active_cases') {
      filtered = filtered.filter(c => {
        const claims = claimsByCompany.get(c.id)
        if (!claims?.lastStatus) return false
        return activeStatuses.includes(claims.lastStatus)
      })
    }

    // Sort: companies with cases first, then by name
    filtered.sort((a, b) => {
      const aCases = claimsByCompany.get(a.id)?.caseCount || 0
      const bCases = claimsByCompany.get(b.id)?.caseCount || 0
      if (aCases !== bCases) return bCases - aCases
      return a.name.localeCompare(b.name, 'cs')
    })

    return filtered
  }, [companies, searchQuery, statusFilter, claimsByCompany, activeStatuses])

  // Stats
  const totalWithCases = companies.filter(c => claimsByCompany.has(c.id)).length
  const totalActiveCases = cases.filter(c => activeStatuses.includes(c.status)).length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-display text-gray-900 dark:text-white">
          Klienti — Pojistné události
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Přehled firem a jejich pojistných případů
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Aktivních firem</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {companies.filter(c => c.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                <ShieldAlert className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">S pojistnými případy</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{totalWithCases}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                <FileText className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Aktivních případů</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{totalActiveCases}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl">
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Celkem vyplaceno</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {czk.format(Array.from(claimsByCompany.values()).reduce((s, c) => s + c.totalPaid, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <Input
                placeholder="Hledat firmu nebo IČO..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="flex gap-1.5">
              {([
                { value: 'all', label: 'Všechny' },
                { value: 'with_cases', label: 'S případy' },
                { value: 'active_cases', label: 'Aktivní případy' },
                { value: 'no_cases', label: 'Bez případů' },
              ] as const).map(f => (
                <Button
                  key={f.value}
                  size="sm"
                  variant={statusFilter === f.value ? 'default' : 'outline'}
                  className={statusFilter === f.value ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}
                  onClick={() => setStatusFilter(f.value)}
                >
                  {f.label}
                </Button>
              ))}
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {filteredCompanies.length} firem
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Company list */}
      <div className="space-y-2">
        {filteredCompanies.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <p className="text-gray-600 dark:text-gray-400">
                {searchQuery ? 'Žádné firmy neodpovídají hledání' : 'Žádné firmy k zobrazení'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredCompanies.map(company => {
            const claims = claimsByCompany.get(company.id)
            const hasCases = claims && claims.caseCount > 0

            return (
              <Card
                key={company.id}
                className="cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                onClick={() => router.push(`/claims/clients/${company.id}`)}
              >
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl flex-shrink-0">
                        <Building2 className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {company.name}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          IČO: {company.ico || '—'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 flex-shrink-0">
                      {/* Case count */}
                      <div className="text-right">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Případů</p>
                        <p className={`text-sm font-bold ${hasCases ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>
                          {claims?.caseCount || 0}
                        </p>
                      </div>

                      {/* Total claimed */}
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Nárokováno</p>
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          {hasCases ? czk.format(claims.totalClaimed) : '—'}
                        </p>
                      </div>

                      {/* Total paid */}
                      <div className="text-right hidden md:block">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Vyplaceno</p>
                        <p className={`text-sm font-semibold ${hasCases && claims.totalPaid > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                          {hasCases && claims.totalPaid > 0 ? czk.format(claims.totalPaid) : '—'}
                        </p>
                      </div>

                      {/* Last status */}
                      <div className="hidden lg:block">
                        {claims?.lastStatus ? (
                          <Badge className={insuranceStatusColor(claims.lastStatus)}>
                            {insuranceStatusLabel(claims.lastStatus)}
                          </Badge>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </div>

                      <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
