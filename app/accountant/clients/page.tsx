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
  XCircle,
  CheckSquare,
  Square,
  Layers,
  List,
  Mail,
} from 'lucide-react'
import Link from 'next/link'
// Company data fetched from API (Supabase-backed)
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
  status?: string
}

type MonthlyClosure = {
  id: string
  company_id: string
  period: string
  bank_statement_status: string
  expense_documents_status: string
  income_invoices_status: string
}

// Extracted company row component with checkbox
function CompanyRow({ company, fullStatus, clientStatus, selected, onToggleSelect }: {
  company: Company
  fullStatus: { status: 'ok' | 'missing' | 'uploaded'; missingDocs: number; uploadedDocs: number }
  clientStatus: string
  selected: boolean
  onToggleSelect: (id: string, e: React.MouseEvent) => void
}) {
  const isOnboarding = clientStatus === 'onboarding'
  const isInactive = clientStatus === 'inactive'
  const borderColor = isInactive ? 'border-l-gray-400' :
                     isOnboarding ? 'border-l-purple-500' :
                     fullStatus.status === 'missing' ? 'border-l-red-500' :
                     fullStatus.status === 'uploaded' ? 'border-l-yellow-500' :
                     'border-l-green-500'

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={(e) => onToggleSelect(company.id, e)}
        className={`flex-shrink-0 w-5 h-5 rounded border transition-colors ${
          selected
            ? 'bg-purple-600 border-purple-600 text-white'
            : 'border-gray-300 dark:border-gray-600 hover:border-purple-400'
        }`}
      >
        {selected && <CheckSquare className="h-5 w-5 p-0.5" />}
      </button>
      <Link href={`/accountant/clients/${company.id}`} className="flex-1">
        <Card className={`hover:shadow-md transition-all cursor-pointer border-l-4 ${borderColor} ${isInactive ? 'opacity-60' : ''}`}>
          <CardContent className="py-3 px-4">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-start sm:items-center">
              {/* Název */}
              <div className="col-span-1 sm:col-span-4 min-w-0">
                <h3 className={`font-semibold truncate ${isInactive ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                  {company.group_name && (
                    <span className="text-purple-600">{company.group_name} – </span>
                  )}
                  {company.name}
                </h3>
                <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {company.ico}{company.dic && ` • ${company.dic}`}
                </div>
              </div>

              {/* Právní forma + badges */}
              <div className="col-span-1 sm:col-span-3 flex items-center gap-1.5 flex-wrap mt-1 sm:mt-0">
                {company.legal_form === 'OSVČ' ? (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-orange-100 text-orange-700 border-orange-200">
                    FO
                  </Badge>
                ) : company.legal_form === 's.r.o.' ? (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 border-blue-200">
                    s.r.o.
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-gray-500 dark:text-gray-400">
                    {company.legal_form}
                  </Badge>
                )}
                {isInactive && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-red-600 border-red-300 bg-red-50 dark:bg-red-900/20">
                    Neaktivní
                  </Badge>
                )}
                {isOnboarding && (
                  <Badge className="bg-purple-500 text-white hover:bg-purple-500 text-[10px] px-1.5 py-0">
                    ONB
                  </Badge>
                )}
              </div>

              {/* DPH + zaměstnanci */}
              <div className="col-span-1 sm:col-span-3 flex items-center gap-1.5 mt-1 sm:mt-0">
                {company.vat_payer ? (
                  <Badge className="bg-blue-500 text-white hover:bg-blue-500 text-xs font-bold px-2">
                    DPH {company.vat_period === 'monthly' ? 'M' : 'Q'}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-gray-400">ne-DPH</Badge>
                )}
                {company.has_employees && (
                  <Badge variant="outline" className="text-gray-600 dark:text-gray-300 text-xs px-1.5">
                    <Users className="h-3 w-3 mr-0.5" />
                    {company.employee_count}
                  </Badge>
                )}
              </div>

              {/* Stav */}
              <div className="col-span-2 text-right">
                {isInactive ? (
                  <span className="inline-flex items-center gap-1 text-gray-400 text-sm">
                    <XCircle className="h-4 w-4" />
                  </span>
                ) : fullStatus.status === 'ok' ? (
                  <span className="inline-flex items-center gap-1 text-green-600 text-sm font-medium">
                    <CheckCircle className="h-4 w-4" />
                    OK
                  </span>
                ) : fullStatus.status === 'missing' ? (
                  <span className="inline-flex items-center gap-1 text-red-600 text-sm font-medium">
                    <AlertCircle className="h-4 w-4" />
                    {fullStatus.missingDocs}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-yellow-600 text-sm font-medium">
                    <Clock className="h-4 w-4" />
                    {fullStatus.uploadedDocs}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  )
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

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Group view
  const [groupView, setGroupView] = useState(false)

  // Filtry
  const [showFilters, setShowFilters] = useState(false)
  const [filterGroup, setFilterGroup] = useState<string | null>(null)
  const [filterLegalForm, setFilterLegalForm] = useState<string | null>(null)
  const [filterVatPayer, setFilterVatPayer] = useState<boolean | null>(null)
  const [filterVatPeriod, setFilterVatPeriod] = useState<string | null>(null)
  const [filterHasEmployees, setFilterHasEmployees] = useState<boolean | null>(null)
  const [filterClientStatus, setFilterClientStatus] = useState<string | null>('active')

  // Read status filter from URL params
  const filterStatus = searchParams.get('status')

  // Read client status from URL (for onboarding filter from navigation)
  const urlClientStatus = searchParams.get('clientStatus')

  // Sync URL clientStatus with state - pokud URL specifikuje status, použij ho; jinak zachovej default 'active'
  useEffect(() => {
    if (urlClientStatus !== null) {
      setFilterClientStatus(urlClientStatus)
    }
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

  // Helper to get client status from fetched companies data
  const getClientStatus = useCallback((companyId: string) => {
    const company = companies.find(c => c.id === companyId)
    return company?.status || 'active'
  }, [companies])

  // Handler for onboarding setup confirmation
  const handleOnboardingConfirm = useCallback((steps: OnboardingStep[]) => {
    // TODO: V produkci by se zde vytvořil nový klient s onboardingem
    console.log('Onboarding steps configured:', steps)
    // Přesměrování na onboarding stránku
    router.push('/accountant/onboarding')
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
    filterClientStatus === 'active' ? null : filterClientStatus, // 'active' je default, nepočítat jako filtr
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
    if (filterClientStatus && filterClientStatus !== 'active') {
      setClientStatusFilter('active')
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

        // Client status filter (onboarding/active/inactive)
        if (filterClientStatus) {
          const cs = (company as any).status || getClientStatus(company.id)
          if (filterClientStatus !== cs) return false
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

  // Selection helpers
  const toggleSelection = useCallback((id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(filteredCompanies.map(c => c.id)))
  }, [filteredCompanies])

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  // Grouped companies
  const groupedCompanies = useMemo(() => {
    if (!groupView) return null
    const groups = new Map<string, typeof filteredCompanies>()
    filteredCompanies.forEach(company => {
      const groupKey = company.group_name || 'Bez skupiny'
      const existing = groups.get(groupKey) || []
      existing.push(company)
      groups.set(groupKey, existing)
    })
    return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0], 'cs'))
  }, [filteredCompanies, groupView])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Načítám klienty...</p>
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Klienti</h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              {companies.filter((c: any) => (c.status || 'active') === 'active').length} aktivních z {companies.length} klientů • Stav za {currentMonthName}
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
                <Badge className="ml-2 bg-white dark:bg-gray-800 text-purple-600">{activeFiltersCount}</Badge>
              )}
            </Button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t dark:border-gray-700">
              <div className="flex flex-wrap gap-4">
                {/* Group/Owner */}
                {uniqueGroups.length > 0 && (
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Skupina/Vlastník</label>
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
                  <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Právní forma</label>
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
                  <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Plátce DPH</label>
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
                  <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">DPH období</label>
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
                  <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Zaměstnanci</label>
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
                  <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Stav klienta</label>
                  <select
                    value={filterClientStatus || ''}
                    onChange={(e) => setClientStatusFilter(e.target.value || null)}
                    className="px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="">Všichni klienti</option>
                    <option value="active">Aktivní</option>
                    <option value="inactive">Neaktivní</option>
                    <option value="onboarding">V onboardingu</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Stav dokumentů</label>
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

      {/* Bulk action toolbar */}
      {selectedIds.size > 0 && (
        <div className="mb-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
              Vybráno: {selectedIds.size} firem
            </span>
            <Button variant="ghost" size="sm" onClick={deselectAll} className="text-purple-600">
              <X className="h-4 w-4 mr-1" /> Zrušit výběr
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {/* Hromadná upomínka - TODO: implementovat později
            <Button variant="outline" size="sm" onClick={() => toast.info('Hromadná upomínka - připravujeme')}>
              <Mail className="h-4 w-4 mr-1" /> Hromadná upomínka
            </Button>
            */}
          </div>
        </div>
      )}

      {/* Results info + View toggle */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {(searchQuery || activeFiltersCount > 0) && (
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Zobrazeno {filteredCompanies.length} z {companies.length} klientů
            </span>
          )}
          {filteredCompanies.length > 0 && (
            <button
              onClick={selectedIds.size === filteredCompanies.length ? deselectAll : selectAll}
              className="text-xs text-purple-600 hover:underline"
            >
              {selectedIds.size === filteredCompanies.length ? 'Odznačit vše' : 'Vybrat vše'}
            </button>
          )}
        </div>
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setGroupView(false)}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${!groupView ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
          >
            <List className="h-3.5 w-3.5 inline mr-1" />
            Seznam
          </button>
          <button
            onClick={() => setGroupView(true)}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${groupView ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
          >
            <Layers className="h-3.5 w-3.5 inline mr-1" />
            Skupiny
          </button>
        </div>
      </div>

      {/* Clients list */}
      <div className="space-y-3">
        {filteredCompanies.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Žádní klienti</h3>
              <p className="text-gray-600 dark:text-gray-400">
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
        ) : groupView && groupedCompanies ? (
          // === GROUP VIEW ===
          groupedCompanies.map(([groupName, groupCompanies]) => (
            <div key={groupName} className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <Layers className="h-4 w-4 text-purple-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white">{groupName}</h3>
                <Badge variant="outline" className="text-xs">{groupCompanies.length}</Badge>
              </div>
              <div className="space-y-1 pl-2 border-l-2 border-purple-200 dark:border-purple-800">
                {groupCompanies.map(company => (
                  <CompanyRow
                    key={company.id}
                    company={company}
                    fullStatus={getCompanyFullStatus(company.id)}
                    clientStatus={(company as any).status || getClientStatus(company.id)}
                    selected={selectedIds.has(company.id)}
                    onToggleSelect={toggleSelection}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          // === LIST VIEW ===
          filteredCompanies.map(company => (
            <CompanyRow
              key={company.id}
              company={company}
              fullStatus={getCompanyFullStatus(company.id)}
              clientStatus={(company as any).status || getClientStatus(company.id)}
              selected={selectedIds.has(company.id)}
              onToggleSelect={toggleSelection}
            />
          ))
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
          <p className="mt-4 text-gray-600 dark:text-gray-400">Načítám klienty...</p>
        </div>
      </div>
    }>
      <ClientsPageContent />
    </Suspense>
  )
}
