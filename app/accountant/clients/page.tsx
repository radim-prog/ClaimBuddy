'use client'

import { Suspense, useEffect, useState, useMemo, useCallback } from 'react'
import { useDebounce } from '@/lib/hooks/use-debounce'
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
  XCircle,
  CheckSquare,
  Layers,
  List,
  Power,
  PowerOff,
  Loader2,
  Tag,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Bell, MessageCircle } from 'lucide-react'
// Company data fetched from API (Supabase-backed)
import { NewClientForm } from '@/components/new-client-form'
import { MessagePopupDialog } from '@/components/komunikace/message-popup-dialog'
import { useAttention } from '@/lib/contexts/attention-context'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'

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
  monthly_reporting?: boolean
  employee_count: number
  data_box: { id: string } | null
  status?: string
  managing_director?: string | null
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
// Reusable tooltip wrapper
function Tip({ children, text }: { children: React.ReactNode; text: string }) {
  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="top" className="text-xs max-w-[200px]">
        {text}
      </TooltipContent>
    </Tooltip>
  )
}

function CompanyRow({ company, fullStatus, clientStatus, selected, onToggleSelect, attentionCount, healthScore, isFirst, unreadMessages, onMessageClick }: {
  company: Company
  fullStatus: { status: 'ok' | 'missing' | 'uploaded'; missingDocs: number; uploadedDocs: number }
  clientStatus: string
  selected: boolean
  onToggleSelect: (id: string, e: React.MouseEvent) => void
  attentionCount: number
  healthScore?: number | null
  isFirst?: boolean
  unreadMessages?: number
  onMessageClick?: (companyId: string, companyName: string) => void
}) {
  const isOnboarding = clientStatus === 'onboarding'
  const isInactive = clientStatus === 'inactive'
  const isFO = company.legal_form === 'OSVČ'
  const borderColor = isInactive ? 'border-l-red-500' :
                     isOnboarding ? 'border-l-purple-500' :
                     isFO ? (company.vat_payer ? 'border-l-emerald-700' : 'border-l-emerald-400') :
                     (company.vat_payer ? 'border-l-blue-700' : 'border-l-blue-400')

  return (
    <div className="flex items-center gap-2" data-tour={isFirst ? 'client-row' : undefined}>
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
        <Card className={`card-hover transition-all duration-200 cursor-pointer border-l-4 rounded-xl ${borderColor} ${isInactive ? 'opacity-60' : ''}`}>
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
                  {company.managing_director && ` • ${company.managing_director}`}
                </div>
              </div>

              {/* Právní forma + stav klienta */}
              <div className="col-span-1 sm:col-span-3 flex items-center gap-1.5 flex-wrap mt-1 sm:mt-0">
                <Tip text={isFO ? 'Fyzická osoba — OSVČ' : company.legal_form === 's.r.o.' ? 'Společnost s ručením omezeným' : company.legal_form}>
                  <span>
                    {isFO ? (
                      <Badge variant="outline" className="text-xs px-1.5 py-0 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700">
                        OSVČ
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs px-1.5 py-0 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700">
                        {company.legal_form}
                      </Badge>
                    )}
                  </span>
                </Tip>
                {isInactive && (
                  <Tip text="Klient je neaktivní — neúčtuje se">
                    <span>
                      <Badge variant="outline" className="text-xs px-1.5 py-0 text-red-600 border-red-300 bg-red-50 dark:bg-red-900/20">
                        Neaktivní
                      </Badge>
                    </span>
                  </Tip>
                )}
                {isOnboarding && (
                  <Tip text="Klient v procesu onboardingu">
                    <span>
                      <Badge className="bg-purple-500 text-white hover:bg-purple-500 text-xs px-1.5 py-0">
                        Onboarding
                      </Badge>
                    </span>
                  </Tip>
                )}
              </div>

              {/* DPH + zaměstnanci */}
              <div className="col-span-1 sm:col-span-3 flex items-center gap-1.5 mt-1 sm:mt-0">
                {company.vat_payer ? (
                  <Tip text={`Plátce DPH — ${company.vat_period === 'monthly' ? 'měsíční' : 'čtvrtletní'} přiznání`}>
                    <span>
                      <Badge className="bg-blue-500 text-white hover:bg-blue-500 text-xs font-bold px-2">
                        DPH {company.vat_period === 'monthly' ? 'měs.' : 'čtvrt.'}
                      </Badge>
                    </span>
                  </Tip>
                ) : (
                  <Tip text="Neplátce DPH">
                    <span>
                      <Badge variant="outline" className="text-xs px-1.5 py-0 text-gray-400">
                        neplátce
                      </Badge>
                    </span>
                  </Tip>
                )}
                {company.has_employees && (
                  <Tip text={`Počet zaměstnanců: ${company.employee_count}`}>
                    <span>
                      <Badge variant="outline" className="text-gray-600 dark:text-gray-300 text-xs px-1.5">
                        <Users className="h-3 w-3 mr-0.5" />
                        {company.employee_count}
                      </Badge>
                    </span>
                  </Tip>
                )}
              </div>

              {/* Stav */}
              <div className="col-span-2 text-right flex items-center justify-end gap-2">
                {(unreadMessages ?? 0) > 0 && !isInactive && onMessageClick && (
                  <Tip text={`${unreadMessages} neprectenych zprav`}>
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onMessageClick(company.id, company.name) }}
                      className="inline-flex items-center gap-1 text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                    >
                      <MessageCircle className="h-3 w-3" />
                      <span className="font-semibold">{unreadMessages}</span>
                    </button>
                  </Tip>
                )}
                {healthScore != null && !isInactive && (
                  <Tip text={`Zdraví klienta: ${healthScore}/100`}>
                    <span className={`inline-flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded-md ${
                      healthScore >= 80 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                      healthScore >= 60 ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                      healthScore >= 40 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                      'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                    }`}>
                      {healthScore >= 80 ? 'A' : healthScore >= 60 ? 'B' : healthScore >= 40 ? 'C' : 'D'}
                      <span className="font-normal text-[10px] opacity-80">{healthScore}</span>
                    </span>
                  </Tip>
                )}
                {attentionCount > 0 && !isInactive && (
                  <Tip text={`${attentionCount} položek vyžaduje vaši pozornost`}>
                    <span className="inline-flex items-center gap-1 text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded-full">
                      <Bell className="h-3 w-3" />
                      <span className="font-semibold">{attentionCount}</span>
                    </span>
                  </Tip>
                )}
                {isInactive ? (
                  <Tip text="Neaktivní klient">
                    <span className="inline-flex items-center gap-1 text-gray-400 text-sm">
                      <XCircle className="h-4 w-4" />
                    </span>
                  </Tip>
                ) : fullStatus.status === 'ok' ? (
                  <Tip text="Všechny doklady v pořádku">
                    <span className="inline-flex items-center gap-1 text-green-600 text-sm font-medium">
                      <CheckCircle className="h-4 w-4" />
                      OK
                    </span>
                  </Tip>
                ) : fullStatus.status === 'missing' ? (
                  <Tip text={`Chybí ${fullStatus.missingDocs} ${fullStatus.missingDocs === 1 ? 'doklad' : fullStatus.missingDocs < 5 ? 'doklady' : 'dokladů'} za tento měsíc`}>
                    <span className="inline-flex items-center gap-1 text-red-600 text-sm font-medium">
                      <AlertCircle className="h-4 w-4" />
                      {fullStatus.missingDocs}
                    </span>
                  </Tip>
                ) : (
                  <Tip text={`${fullStatus.uploadedDocs} ${fullStatus.uploadedDocs === 1 ? 'doklad čeká' : fullStatus.uploadedDocs < 5 ? 'doklady čekají' : 'dokladů čeká'} na schválení`}>
                    <span className="inline-flex items-center gap-1 text-yellow-600 text-sm font-medium">
                      <Clock className="h-4 w-4" />
                      {fullStatus.uploadedDocs}
                    </span>
                  </Tip>
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
  const { getCompanyAttention } = useAttention()
  const [companies, setCompanies] = useState<Company[]>([])
  const [closures, setClosures] = useState<MonthlyClosure[]>([])
  const [healthScores, setHealthScores] = useState<Map<string, number | null>>(new Map())
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)

  // New client modal
  const [showNewClient, setShowNewClient] = useState(false)

  // Message popup
  const [messagePopup, setMessagePopup] = useState<{ companyId: string; companyName: string } | null>(null)
  const handleMessageClick = useCallback((companyId: string, companyName: string) => {
    setMessagePopup({ companyId, companyName })
  }, [])

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Group view
  const [groupView, setGroupView] = useState(false)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  // Filtry
  const [showFilters, setShowFilters] = useState(false)
  const [filterGroup, setFilterGroup] = useState<string | null>(null)
  const [filterLegalForm, setFilterLegalForm] = useState<string | null>(null)
  const [filterVatPayer, setFilterVatPayer] = useState<boolean | null>(null)
  const [filterVatPeriod, setFilterVatPeriod] = useState<string | null>(null)
  const [filterHasEmployees, setFilterHasEmployees] = useState<boolean | null>(null)
  const [filterMonthlyReporting, setFilterMonthlyReporting] = useState<boolean | null>(null)
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

  const fetchCompanies = useCallback(() => {
    setLoading(true)
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

  useEffect(() => {
    fetchCompanies()
    // Fetch health scores
    fetch('/api/accountant/health-scores')
      .then(res => res.json())
      .then(data => {
        const map = new Map<string, number | null>()
        for (const s of data.scores || []) {
          map.set(s.company_id, s.score)
        }
        setHealthScores(map)
      })
      .catch(() => {})
  }, [fetchCompanies])

  // Handler for new client creation success
  const handleNewClientSuccess = useCallback((companyId: string) => {
    setShowNewClient(false)
    fetchCompanies()
  }, [fetchCompanies])

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

    // Current period string for filtering
    const currentPeriodStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}`

    // Group CURRENT MONTH closures by company_id for status display
    const closuresByCompany = new Map<string, MonthlyClosure>()
    closures.forEach(closure => {
      if (closure.period === currentPeriodStr) {
        closuresByCompany.set(closure.company_id, closure)
      }
    })

    // Calculate status for each company based on CURRENT MONTH only
    companies.forEach(company => {
      const closure = closuresByCompany.get(company.id)

      let missingDocs = 0
      let uploadedDocs = 0

      if (closure) {
        if (closure.bank_statement_status === 'missing') missingDocs++
        if (closure.expense_documents_status === 'missing') missingDocs++
        if (closure.income_invoices_status === 'missing') missingDocs++

        if (closure.bank_statement_status === 'uploaded') uploadedDocs++
        if (closure.expense_documents_status === 'uploaded') uploadedDocs++
        if (closure.income_invoices_status === 'uploaded') uploadedDocs++
      } else if (company.monthly_reporting !== false && (company as any).status !== 'inactive') {
        // No closure record for current month = all 3 document types missing
        missingDocs = 3
      }

      // Determine overall status
      let status: 'ok' | 'missing' | 'uploaded' = 'ok'
      if (missingDocs > 0) status = 'missing'
      else if (uploadedDocs > 0) status = 'uploaded'

      statusMap.set(company.id, {
        status,
        missingMonths: missingDocs > 0 ? 1 : 0,
        uploadedMonths: uploadedDocs > 0 ? 1 : 0,
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
    filterMonthlyReporting,
    filterStatus,
    filterClientStatus === 'active' ? null : filterClientStatus, // 'active' je default, nepočítat jako filtr
  ].filter(f => f !== null).length

  const clearAllFilters = () => {
    setFilterGroup(null)
    setFilterLegalForm(null)
    setFilterVatPayer(null)
    setFilterVatPeriod(null)
    setFilterHasEmployees(null)
    setFilterMonthlyReporting(null)
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
        if (debouncedSearch) {
          const query = debouncedSearch.toLowerCase()
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
        if (filterMonthlyReporting !== null && (company.monthly_reporting !== false) !== filterMonthlyReporting) return false

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
        // Neaktivní klienti vždy na konci
        const aInactive = (a as any).status === 'inactive' ? 1 : 0
        const bInactive = (b as any).status === 'inactive' ? 1 : 0
        if (aInactive !== bInactive) return aInactive - bInactive

        // Řadit podle skupiny (pokud existuje) nebo názvu firmy - vše v jedné abecedě
        const sortKeyA = a.group_name || a.name
        const sortKeyB = b.group_name || b.name

        if (sortKeyA !== sortKeyB) {
          return sortKeyA.localeCompare(sortKeyB, 'cs')
        }

        // V rámci stejné skupiny řadit podle názvu firmy
        return a.name.localeCompare(b.name, 'cs')
      })
  }, [companies, debouncedSearch, filterGroup, filterLegalForm, filterVatPayer, filterVatPeriod, filterHasEmployees, filterMonthlyReporting, filterStatus, filterClientStatus, getCompanyFullStatus, getClientStatus])

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

  const [bulkLoading, setBulkLoading] = useState(false)
  const [showGroupAssign, setShowGroupAssign] = useState(false)
  const [bulkGroupName, setBulkGroupName] = useState('')

  const bulkUpdateStatus = useCallback(async (newStatus: string) => {
    if (!confirm(`Opravdu chcete změnit stav ${selectedIds.size} klientů na "${newStatus === 'active' ? 'Aktivní' : newStatus === 'inactive' ? 'Neaktivní' : 'Onboarding'}"?`)) return
    setBulkLoading(true)
    let success = 0
    let failed = 0
    for (const id of selectedIds) {
      try {
        const res = await fetch(`/api/accountant/companies/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        })
        if (res.ok) success++
        else failed++
      } catch { failed++ }
    }
    setBulkLoading(false)
    if (success > 0) {
      toast.success(`${success} klientů změněno na "${newStatus === 'active' ? 'Aktivní' : newStatus === 'inactive' ? 'Neaktivní' : 'Onboarding'}"`)
      setSelectedIds(new Set())
      fetchCompanies()
    }
    if (failed > 0) toast.error(`${failed} klientů se nepodařilo změnit`)
  }, [selectedIds, fetchCompanies])

  const bulkAssignGroup = useCallback(async () => {
    if (!bulkGroupName.trim() && !confirm('Chcete odstranit skupinu u vybraných klientů?')) return
    setBulkLoading(true)
    let success = 0
    let failed = 0
    for (const id of selectedIds) {
      try {
        const res = await fetch(`/api/accountant/companies/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ group_name: bulkGroupName.trim() || null }),
        })
        if (res.ok) success++
        else failed++
      } catch { failed++ }
    }
    setBulkLoading(false)
    if (success > 0) {
      toast.success(`Skupina "${bulkGroupName.trim() || '(žádná)'}" přiřazena ${success} klientům`)
      setSelectedIds(new Set())
      setBulkGroupName('')
      setShowGroupAssign(false)
      fetchCompanies()
    }
    if (failed > 0) toast.error(`${failed} klientů se nepodařilo změnit`)
  }, [selectedIds, bulkGroupName, fetchCompanies])

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
    <TooltipProvider>
    <div className="max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold font-display text-gray-900 dark:text-white tracking-tight">Klienti</h1>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              {companies.filter((c: any) => (c.status || 'active') === 'active').length} aktivních z {companies.length} • {currentMonthName}
            </p>
          </div>
          <Button
            onClick={() => setShowNewClient(true)}
            className="bg-purple-600 hover:bg-purple-700 rounded-xl"
            size="sm"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Nový klient
          </Button>
        </div>
      </div>

      {/* New Client Form Modal */}
      <NewClientForm
        open={showNewClient}
        onOpenChange={setShowNewClient}
        onSuccess={handleNewClientSuccess}
      />

      {/* Search and Filters */}
      <Card className="mb-5 rounded-xl shadow-soft-sm">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1 relative">
              <Search className="h-4 w-4 text-gray-400 absolute left-3" />
              <Input
                placeholder="Hledat podle názvu, IČ nebo DIČ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 pl-9 h-9 rounded-xl"
              />
            </div>
            <Button
              variant={showFilters ? 'default' : 'outline'}
              onClick={() => setShowFilters(!showFilters)}
              className={`rounded-xl ${showFilters ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
              size="sm"
            >
              <Filter className="h-3.5 w-3.5 mr-1.5" />
              Filtry
              {activeFiltersCount > 0 && (
                <Badge className="ml-1.5 bg-white dark:bg-gray-800 text-purple-600 text-[10px] px-1.5">{activeFiltersCount}</Badge>
              )}
            </Button>
          </div>

          {/* Quick Filter Toggles */}
          <div className="flex items-center gap-1.5 mt-3 flex-wrap">
            <button
              onClick={() => setFilterClientStatus(filterClientStatus === 'active' ? null : 'active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${filterClientStatus === 'active' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 shadow-sm ring-1 ring-green-200 dark:ring-green-800' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
            >
              Aktivní
              <span className="ml-1 opacity-60">{companies.filter((c: any) => (c.status || 'active') === 'active').length}</span>
            </button>
            <button
              onClick={() => setClientStatusFilter(filterClientStatus === 'onboarding' ? 'active' : 'onboarding')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${filterClientStatus === 'onboarding' ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 shadow-sm ring-1 ring-purple-200 dark:ring-purple-800' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
            >
              Onboarding
              <span className="ml-1 opacity-60">{companies.filter((c: any) => (c.status) === 'onboarding').length}</span>
            </button>
            <button
              onClick={() => setFilterVatPayer(filterVatPayer === true ? null : true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${filterVatPayer === true ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow-sm ring-1 ring-blue-200 dark:ring-blue-800' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
            >
              Plátci DPH
              <span className="ml-1 opacity-60">{companies.filter(c => c.vat_payer).length}</span>
            </button>
            <button
              onClick={() => {
                if (filterClientStatus === null && filterVatPayer === null) {
                  setFilterClientStatus('active')
                } else {
                  setFilterClientStatus(null)
                  setFilterVatPayer(null)
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${filterClientStatus === null && filterVatPayer === null ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
            >
              Vše
              <span className="ml-1 opacity-60">{companies.length}</span>
            </button>
            <div className="ml-auto text-xs text-gray-400 dark:text-gray-500">
              {filteredCompanies.length}
            </div>
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
                      className="px-3 py-2 border dark:border-gray-600 rounded-lg text-sm bg-background dark:bg-gray-800 dark:text-gray-200"
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
                    className="px-3 py-2 border dark:border-gray-600 rounded-lg text-sm bg-background dark:bg-gray-800 dark:text-gray-200"
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
                    className="px-3 py-2 border dark:border-gray-600 rounded-lg text-sm bg-background dark:bg-gray-800 dark:text-gray-200"
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
                    className="px-3 py-2 border dark:border-gray-600 rounded-lg text-sm bg-background dark:bg-gray-800 dark:text-gray-200"
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
                    className="px-3 py-2 border dark:border-gray-600 rounded-lg text-sm bg-background dark:bg-gray-800 dark:text-gray-200"
                  >
                    <option value="">Všichni</option>
                    <option value="yes">Se zaměstnanci</option>
                    <option value="no">Bez zaměstnanců</option>
                  </select>
                </div>

                {/* Monthly Reporting */}
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Měs. reporting</label>
                  <select
                    value={filterMonthlyReporting === null ? '' : filterMonthlyReporting ? 'yes' : 'no'}
                    onChange={(e) => setFilterMonthlyReporting(e.target.value === '' ? null : e.target.value === 'yes')}
                    className="px-3 py-2 border dark:border-gray-600 rounded-lg text-sm bg-background dark:bg-gray-800 dark:text-gray-200"
                  >
                    <option value="">Všichni</option>
                    <option value="yes">S reportingem</option>
                    <option value="no">Bez reportingu</option>
                  </select>
                </div>

                {/* Client Status */}
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Stav klienta</label>
                  <select
                    value={filterClientStatus || ''}
                    onChange={(e) => setClientStatusFilter(e.target.value || null)}
                    className="px-3 py-2 border dark:border-gray-600 rounded-lg text-sm bg-background dark:bg-gray-800 dark:text-gray-200"
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
                    className="px-3 py-2 border dark:border-gray-600 rounded-lg text-sm bg-background dark:bg-gray-800 dark:text-gray-200"
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
        <div className="mb-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                Vybráno: {selectedIds.size} firem
              </span>
              <Button variant="ghost" size="sm" onClick={deselectAll} className="text-purple-600">
                <X className="h-4 w-4 mr-1" /> Zrušit výběr
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={bulkLoading}
                onClick={() => bulkUpdateStatus('active')}
                className="text-green-700 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-900/20"
              >
                {bulkLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Power className="h-4 w-4 mr-1" />}
                Aktivovat
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={bulkLoading}
                onClick={() => bulkUpdateStatus('inactive')}
                className="text-red-700 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/20"
              >
                {bulkLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <PowerOff className="h-4 w-4 mr-1" />}
                Deaktivovat
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={bulkLoading}
                onClick={() => setShowGroupAssign(!showGroupAssign)}
                className="text-purple-700 border-purple-300 hover:bg-purple-50 dark:text-purple-400 dark:border-purple-700 dark:hover:bg-purple-900/20"
              >
                <Tag className="h-4 w-4 mr-1" />
                Přiřadit skupinu
              </Button>
            </div>
          </div>
          {showGroupAssign && (
            <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-700 flex items-center gap-3">
              <Input
                value={bulkGroupName}
                onChange={(e) => setBulkGroupName(e.target.value)}
                placeholder="Název skupiny (prázdné = odebrat skupinu)"
                className="max-w-xs"
              />
              <Button size="sm" disabled={bulkLoading} onClick={bulkAssignGroup} className="bg-purple-600 hover:bg-purple-700 text-white">
                {bulkLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
                Uložit skupinu
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setShowGroupAssign(false); setBulkGroupName('') }}>
                Zrušit
              </Button>
            </div>
          )}
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
      <div className="space-y-2">
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
          <>
            {groupedCompanies.length > 1 && (
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={() => setCollapsedGroups(new Set())}
                  className="text-xs text-purple-600 hover:underline"
                >
                  Rozbalit vše
                </button>
                <span className="text-gray-300 dark:text-gray-600">|</span>
                <button
                  onClick={() => setCollapsedGroups(new Set(groupedCompanies.map(([name]) => name)))}
                  className="text-xs text-purple-600 hover:underline"
                >
                  Sbalit vše
                </button>
              </div>
            )}
            {groupedCompanies.map(([groupName, groupCompanies]) => {
              const isCollapsed = collapsedGroups.has(groupName)
              return (
                <div key={groupName} className="space-y-2">
                  <button
                    onClick={() => setCollapsedGroups(prev => {
                      const next = new Set(prev)
                      if (next.has(groupName)) next.delete(groupName)
                      else next.add(groupName)
                      return next
                    })}
                    className="flex items-center gap-2 px-1 w-full text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg py-1.5 transition-colors group"
                  >
                    {isCollapsed
                      ? <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-purple-500 transition-colors" />
                      : <ChevronDown className="h-4 w-4 text-gray-400 group-hover:text-purple-500 transition-colors" />
                    }
                    <Layers className="h-4 w-4 text-purple-500" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">{groupName}</h3>
                    <Badge variant="outline" className="text-xs">{groupCompanies.length}</Badge>
                  </button>
                  {!isCollapsed && (
                    <div className="space-y-1 pl-2 border-l-2 border-purple-200 dark:border-purple-800">
                      {groupCompanies.map(company => (
                        <CompanyRow
                          key={company.id}
                          company={company}
                          fullStatus={getCompanyFullStatus(company.id)}
                          clientStatus={(company as any).status || getClientStatus(company.id)}
                          selected={selectedIds.has(company.id)}
                          onToggleSelect={toggleSelection}
                          attentionCount={getCompanyAttention(company.id).total}
                          healthScore={healthScores.get(company.id)}
                          unreadMessages={getCompanyAttention(company.id).unread_messages}
                          onMessageClick={handleMessageClick}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </>
        ) : (
          // === LIST VIEW ===
          filteredCompanies.map((company, idx) => (
            <CompanyRow
              key={company.id}
              company={company}
              fullStatus={getCompanyFullStatus(company.id)}
              clientStatus={(company as any).status || getClientStatus(company.id)}
              selected={selectedIds.has(company.id)}
              onToggleSelect={toggleSelection}
              attentionCount={getCompanyAttention(company.id).total}
              healthScore={healthScores.get(company.id)}
              isFirst={idx === 0}
              unreadMessages={getCompanyAttention(company.id).unread_messages}
              onMessageClick={handleMessageClick}
            />
          ))
        )}
      </div>
    </div>
    {messagePopup && (
      <MessagePopupDialog
        open={!!messagePopup}
        onOpenChange={(open) => { if (!open) setMessagePopup(null) }}
        companyId={messagePopup.companyId}
        companyName={messagePopup.companyName}
      />
    )}
    </TooltipProvider>
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
