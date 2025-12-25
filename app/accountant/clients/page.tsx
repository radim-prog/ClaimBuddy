'use client'

import { Suspense, useEffect, useState, useMemo, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Building2,
  Search,
  AlertCircle,
  CheckCircle,
  Clock,
  Filter,
  Users,
  X,
  Plus,
  Sparkles,
  UserCheck,
} from 'lucide-react'
import Link from 'next/link'
import { mockCompanies } from '@/lib/mock-data'
import { OnboardingSetupEditor } from '@/components/onboarding-setup-editor'
import { OnboardingStep } from '@/lib/types/onboarding'

type Company = {
  id: string
  name: string
  group_name: string | null
  ico: string
  dic: string
  legal_form: string
  vat_payer: boolean
  vat_period: 'monthly' | 'quarterly' | null
  owner_id: string
  street: string
  city: string
  zip: string
  health_insurance_company: string | null
  has_employees: boolean
  employee_count: number
  data_box: { id: string } | null
}

type MonthlyClosure = {
  id: string
  company_id: string
  period: string
  bank_statement_status: string
  expense_documents_status: string
  income_invoices_status: string
}

function ClientsPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [companies, setCompanies] = useState<Company[]>([])
  const [closures, setClosures] = useState<MonthlyClosure[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Onboarding editor modal
  const [showOnboardingEditor, setShowOnboardingEditor] = useState(false)

  // Filtry
  const [showFilters, setShowFilters] = useState(false)
  const [filterGroup, setFilterGroup] = useState<string | null>(null)
  const [filterLegalForm, setFilterLegalForm] = useState<string | null>(null)
  const [filterVatPayer, setFilterVatPayer] = useState<boolean | null>(null)
  const [filterVatPeriod, setFilterVatPeriod] = useState<string | null>(null)
  const [filterHasEmployees, setFilterHasEmployees] = useState<boolean | null>(null)
  const [filterClientStatus, setFilterClientStatus] = useState<string | null>(null)

  // Read status filter from URL params
  const filterStatus = searchParams.get('status')

  // Read client status from URL (for onboarding filter from navigation)
  const urlClientStatus = searchParams.get('clientStatus')

  // Sync URL clientStatus with state
  useEffect(() => {
    setFilterClientStatus(urlClientStatus)
  }, [urlClientStatus])

  // Function to update status filter via URL
  const setStatusFilter = useCallback((status: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (status) {
      params.set('status', status)
    } else {
      params.delete('status')
    }
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname
    router.push(newUrl)
  }, [pathname, router, searchParams])

  // Function to update client status filter via URL
  const setClientStatusFilter = useCallback((status: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (status) {
      params.set('clientStatus', status)
    } else {
      params.delete('clientStatus')
    }
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname
    router.push(newUrl)
    setFilterClientStatus(status)
  }, [pathname, router, searchParams])

  // Helper to get client status from mock data
  const getClientStatus = useCallback((companyId: string) => {
    const mockCompany = mockCompanies.find(c => c.id === companyId)
    return mockCompany?.status || 'active'
  }, [])

  // Handler for onboarding setup confirmation
  const handleOnboardingConfirm = useCallback((steps: OnboardingStep[]) => {
    // TODO: V produkci by se zde vytvořil nový klient s onboardingem
    console.log('Onboarding steps configured:', steps)
    // Prozatím jen ukážeme alert
    alert(`Onboarding nakonfigurován s ${steps.length} kroky (${steps.filter(s => s.required).length} povinných).\n\nV produkční verzi by se nyní otevřel formulář pro zadání údajů klienta.`)
  }, [])

  // Dynamické aktuální období
  const currentPeriod = useMemo(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    return `${year}-${month}`
  }, [])

  const currentMonthName = useMemo(() => {
    const now = new Date()
    return now.toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' })
  }, [])

  useEffect(() => {
    fetch('/api/accountant/matrix')
      .then(res => res.json())
      .then(data => {
        setCompanies(data.companies || [])
        setClosures(data.closures || [])
        setLoading(false)
      })
      .catch(error => {
        console.error('Error loading clients:', error)
        setLoading(false)
      })
  }, [])

  // Memoized map of company statuses - calculated once for all companies
  // This avoids O(n²) complexity from calling getCompanyFullStatus for each company
  const companyStatusMap = useMemo(() => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1

    const statusMap = new Map<string, {
      status: 'ok' | 'missing' | 'uploaded'
      missingMonths: number
      uploadedMonths: number
      missingDocs: number
      uploadedDocs: number
    }>()

    // Group closures by company_id first for O(n) access
    const closuresByCompany = new Map<string, MonthlyClosure[]>()
    closures.forEach(closure => {
      const [year, month] = closure.period.split('-').map(Number)
      // Only include current and past months
      if (year < currentYear || (year === currentYear && month <= currentMonth)) {
        const existing = closuresByCompany.get(closure.company_id) || []
        existing.push(closure)
        closuresByCompany.set(closure.company_id, existing)
      }
    })

    // Calculate status for each company
    companies.forEach(company => {
      const companyClosures = closuresByCompany.get(company.id) || []

      let missingMonths = 0
      let uploadedMonths = 0
      let missingDocs = 0
      let uploadedDocs = 0

      companyClosures.forEach(closure => {
        const hasMissing =
          closure.bank_statement_status === 'missing' ||
          closure.expense_documents_status === 'missing' ||
          closure.income_invoices_status === 'missing'

        const hasUploaded =
          closure.bank_statement_status === 'uploaded' ||
          closure.expense_documents_status === 'uploaded' ||
          closure.income_invoices_status === 'uploaded'

        const allApproved =
          closure.bank_statement_status === 'approved' &&
          closure.expense_documents_status === 'approved' &&
          closure.income_invoices_status === 'approved'

        if (hasMissing) {
          missingMonths++
          if (closure.bank_statement_status === 'missing') missingDocs++
          if (closure.expense_documents_status === 'missing') missingDocs++
          if (closure.income_invoices_status === 'missing') missingDocs++
        }

        // Count uploaded documents (waiting for approval)
        if (closure.bank_statement_status === 'uploaded') uploadedDocs++
        if (closure.expense_documents_status === 'uploaded') uploadedDocs++
        if (closure.income_invoices_status === 'uploaded') uploadedDocs++

        if (hasUploaded && !allApproved && !hasMissing) {
          uploadedMonths++
        }
      })

      // Determine overall status
      let status: 'ok' | 'missing' | 'uploaded' = 'ok'
      if (missingMonths > 0) status = 'missing'
      else if (uploadedMonths > 0) status = 'uploaded'

      statusMap.set(company.id, {
        status,
        missingMonths,
        uploadedMonths,
        missingDocs,
        uploadedDocs,
      })
    })

    return statusMap
  }, [companies, closures])

  // Helper to get status from memoized map
  const getCompanyFullStatus = useCallback((companyId: string) => {
    return companyStatusMap.get(companyId) || {
      status: 'ok' as const,
      missingMonths: 0,
      uploadedMonths: 0,
      missingDocs: 0,
      uploadedDocs: 0,
    }
  }, [companyStatusMap])

  // Zjistit unikátní hodnoty pro filtry
  const uniqueGroups = useMemo(() =>
    Array.from(new Set(companies.map(c => c.group_name).filter(Boolean))).sort() as string[],
    [companies]
  )

  const uniqueLegalForms = useMemo(() =>
    Array.from(new Set(companies.map(c => c.legal_form))).sort(),
    [companies]
  )

  const activeFiltersCount = [
    filterGroup,
    filterLegalForm,
    filterVatPayer,
    filterVatPeriod,
    filterHasEmployees,
    filterStatus,
    filterClientStatus
  ].filter(f => f !== null).length

  const clearAllFilters = () => {
    setFilterGroup(null)
    setFilterLegalForm(null)
    setFilterVatPayer(null)
    setFilterVatPeriod(null)
    setFilterHasEmployees(null)
    // Clear URL status param
    if (filterStatus) {
      setStatusFilter(null)
    }
    if (filterClientStatus) {
      setClientStatusFilter(null)
    }
  }

  const filteredCompanies = useMemo(() => {
    return companies
      .filter(company => {
        // Text search - hledá i ve skupině
        if (searchQuery) {
          const query = searchQuery.toLowerCase()
          if (!company.name.toLowerCase().includes(query) &&
              !company.ico.includes(query) &&
              !(company.dic || '').toLowerCase().includes(query) &&
              !(company.group_name || '').toLowerCase().includes(query)) {
            return false
          }
        }

        // Filters
        if (filterGroup && company.group_name !== filterGroup) return false
        if (filterLegalForm && company.legal_form !== filterLegalForm) return false
        if (filterVatPayer !== null && company.vat_payer !== filterVatPayer) return false
        if (filterVatPeriod && company.vat_period !== filterVatPeriod) return false
        if (filterHasEmployees !== null && company.has_employees !== filterHasEmployees) return false

        if (filterStatus) {
          const status = getCompanyFullStatus(company.id).status
          if (filterStatus === 'missing' && status !== 'missing') return false
          if (filterStatus === 'uploaded' && status !== 'uploaded') return false
          if (filterStatus === 'complete' && status !== 'ok') return false
        }

        // Client status filter (onboarding/active)
        if (filterClientStatus) {
          const clientStatus = getClientStatus(company.id)
          if (filterClientStatus !== clientStatus) return false
        }

        return true
      })
      .sort((a, b) => {
        // Řadit podle skupiny (pokud existuje) nebo názvu firmy - vše v jedné abecedě
        const sortKeyA = a.group_name || a.name
        const sortKeyB = b.group_name || b.name

        if (sortKeyA !== sortKeyB) {
          return sortKeyA.localeCompare(sortKeyB, 'cs')
        }

        // V rámci stejné skupiny řadit podle názvu firmy
        return a.name.localeCompare(b.name, 'cs')
      })
  }, [companies, searchQuery, filterGroup, filterLegalForm, filterVatPayer, filterVatPeriod, filterHasEmployees, filterStatus, filterClientStatus, getCompanyFullStatus, getClientStatus])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Načítám klienty...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Klienti</h1>
            <p className="mt-1 text-gray-600">
              {companies.length} klientů • Stav za {currentMonthName}
            </p>
          </div>
          <Button
            onClick={() => setShowOnboardingEditor(true)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nový klient
          </Button>
        </div>
      </div>

      {/* Onboarding Setup Editor Modal */}
      <OnboardingSetupEditor
        open={showOnboardingEditor}
        onOpenChange={setShowOnboardingEditor}
        onConfirm={handleOnboardingConfirm}
        title="Nastavení onboardingu pro nového klienta"
      />

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Search className="h-5 w-5 text-gray-400" />
              <Input
                placeholder="Hledat podle názvu, IČ nebo DIČ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
            </div>
            <Button
              variant={showFilters ? 'default' : 'outline'}
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? 'bg-purple-600 hover:bg-purple-700' : ''}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtry
              {activeFiltersCount > 0 && (
                <Badge className="ml-2 bg-white text-purple-600">{activeFiltersCount}</Badge>
              )}
            </Button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex flex-wrap gap-4">
                {/* Group/Owner */}
                {uniqueGroups.length > 0 && (
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Skupina/Vlastník</label>
                    <select
                      value={filterGroup || ''}
                      onChange={(e) => setFilterGroup(e.target.value || null)}
                      className="px-3 py-2 border rounded-lg text-sm"
                    >
                      <option value="">Všechny skupiny</option>
                      {uniqueGroups.map(group => (
                        <option key={group} value={group}>{group}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Legal Form */}
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Právní forma</label>
                  <select
                    value={filterLegalForm || ''}
                    onChange={(e) => setFilterLegalForm(e.target.value || null)}
                    className="px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="">Všechny</option>
                    {uniqueLegalForms.map(form => (
                      <option key={form} value={form}>{form}</option>
                    ))}
                  </select>
                </div>

                {/* VAT Payer */}
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Plátce DPH</label>
                  <select
                    value={filterVatPayer === null ? '' : filterVatPayer ? 'yes' : 'no'}
                    onChange={(e) => setFilterVatPayer(e.target.value === '' ? null : e.target.value === 'yes')}
                    className="px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="">Všichni</option>
                    <option value="yes">Plátci DPH</option>
                    <option value="no">Neplátci DPH</option>
                  </select>
                </div>

                {/* VAT Period */}
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">DPH období</label>
                  <select
                    value={filterVatPeriod || ''}
                    onChange={(e) => setFilterVatPeriod(e.target.value || null)}
                    className="px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="">Všechny</option>
                    <option value="monthly">Měsíční</option>
                    <option value="quarterly">Kvartální</option>
                  </select>
                </div>

                {/* Has Employees */}
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Zaměstnanci</label>
                  <select
                    value={filterHasEmployees === null ? '' : filterHasEmployees ? 'yes' : 'no'}
                    onChange={(e) => setFilterHasEmployees(e.target.value === '' ? null : e.target.value === 'yes')}
                    className="px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="">Všichni</option>
                    <option value="yes">Se zaměstnanci</option>
                    <option value="no">Bez zaměstnanců</option>
                  </select>
                </div>

                {/* Client Status */}
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Stav klienta</label>
                  <select
                    value={filterClientStatus || ''}
                    onChange={(e) => setClientStatusFilter(e.target.value || null)}
                    className="px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="">Všichni klienti</option>
                    <option value="onboarding">V onboardingu</option>
                    <option value="active">Aktivní</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Stav dokumentů</label>
                  <select
                    value={filterStatus || ''}
                    onChange={(e) => setStatusFilter(e.target.value || null)}
                    className="px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="">Všechny stavy</option>
                    <option value="missing">Chybí podklady</option>
                    <option value="uploaded">Čeká na schválení</option>
                    <option value="complete">V pořádku</option>
                  </select>
                </div>

                {/* Clear filters */}
                {activeFiltersCount > 0 && (
                  <div className="flex items-end">
                    <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                      <X className="h-4 w-4 mr-1" />
                      Zrušit filtry
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results info */}
      {(searchQuery || activeFiltersCount > 0) && (
        <div className="mb-4 text-sm text-gray-600">
          Zobrazeno {filteredCompanies.length} z {companies.length} klientů
        </div>
      )}

      {/* Clients list */}
      <div className="space-y-3">
        {filteredCompanies.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Žádní klienti</h3>
              <p className="text-gray-600">
                {searchQuery || activeFiltersCount > 0
                  ? 'Nenalezeny žádné výsledky pro tyto filtry'
                  : 'Zatím nemáte žádné přiřazené klienty'}
              </p>
              {activeFiltersCount > 0 && (
                <Button variant="outline" className="mt-4" onClick={clearAllFilters}>
                  Zrušit filtry
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredCompanies.map((company) => {
            const fullStatus = getCompanyFullStatus(company.id)
            const clientStatus = getClientStatus(company.id)
            const isOnboarding = clientStatus === 'onboarding'

            // Barva levého okraje podle stavu
            const borderColor = isOnboarding ? 'border-l-purple-500' :
                               fullStatus.status === 'missing' ? 'border-l-red-500' :
                               fullStatus.status === 'uploaded' ? 'border-l-yellow-500' :
                               'border-l-green-500'

            // Formátování adresy
            const address = [company.street, company.city, company.zip].filter(Boolean).join(', ')

            return (
              <Link key={company.id} href={`/accountant/clients/${company.id}`}>
                <Card className={`hover:shadow-md transition-all cursor-pointer border-l-4 ${borderColor}`}>
                  <CardContent className="py-3 px-4">
                    {/* Grid layout pro konzistentní zarovnání */}
                    <div className="grid grid-cols-12 gap-4 items-center">

                      {/* Sloupec 1: Název a identifikace (5 sloupců) */}
                      <div className="col-span-5 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {company.group_name && (
                            <span className="text-purple-600">{company.group_name} – </span>
                          )}
                          {company.name}
                        </h3>
                        <div className="text-sm text-gray-500 truncate">
                          {company.ico}{company.dic && ` • ${company.dic}`}
                        </div>
                      </div>

                      {/* Sloupec 2: Adresa (3 sloupce) */}
                      <div className="col-span-3 text-sm text-gray-500 truncate">
                        {address || '—'}
                      </div>

                      {/* Sloupec 3: Vlastnosti - fixní šířky (2 sloupce) */}
                      <div className="col-span-2 flex items-center gap-1.5">
                        {/* Onboarding badge - první pozice pokud je v onboardingu */}
                        {isOnboarding && (
                          <Badge className="bg-purple-500 text-white hover:bg-purple-500 text-xs px-1.5">
                            <Sparkles className="h-3 w-3 mr-0.5" />
                            ONB
                          </Badge>
                        )}
                        {/* DPH */}
                        <div className="w-8 flex-shrink-0">
                          {company.vat_payer ? (
                            <Badge className="bg-blue-500 text-white hover:bg-blue-500 text-xs font-bold px-2">
                              {company.vat_period === 'monthly' ? 'M' : 'Q'}
                            </Badge>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </div>
                        {/* Zaměstnanci */}
                        <div className="w-10 flex-shrink-0">
                          {company.has_employees ? (
                            <Badge variant="outline" className="text-gray-600 text-xs px-1.5">
                              <Users className="h-3 w-3 mr-0.5" />
                              {company.employee_count}
                            </Badge>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </div>
                      </div>

                      {/* Sloupec 4: Stav dokumentů (2 sloupce) */}
                      <div className="col-span-2 text-right">
                        {fullStatus.status === 'ok' ? (
                          <span className="inline-flex items-center gap-1 text-green-600 text-sm font-medium">
                            <CheckCircle className="h-4 w-4" />
                            OK
                          </span>
                        ) : fullStatus.status === 'missing' ? (
                          <span className="inline-flex items-center gap-1 text-red-600 text-sm font-medium">
                            <AlertCircle className="h-4 w-4" />
                            Chybí {fullStatus.missingDocs} dok.
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-yellow-600 text-sm font-medium">
                            <Clock className="h-4 w-4" />
                            Ke schválení {fullStatus.uploadedDocs} dok.
                          </span>
                        )}
                      </div>

                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}

export default function ClientsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Načítám klienty...</p>
        </div>
      </div>
    }>
      <ClientsPageContent />
    </Suspense>
  )
}
