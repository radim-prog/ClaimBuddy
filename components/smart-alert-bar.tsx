'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { AlertCircle, X, ChevronDown, ChevronUp, FileText, Users, UserPlus, ClipboardList, CheckCircle, Clock, Filter } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

type StatusType = 'missing' | 'uploaded' | 'approved'

type Company = {
  id: string
  name: string
  group_name?: string | null
  ico: string
}

type MonthlyClosure = {
  id: string
  company_id: string
  period: string
  status: string
  bank_statement_status: StatusType
  expense_documents_status: StatusType
  income_invoices_status: StatusType
}

type AlertContext = 'dashboard' | 'clients' | 'client-detail' | 'onboarding' | 'tasks'

interface AlertItem {
  id: string
  type: 'critical' | 'urgent' | 'warning'
  title: string
  subtitle?: string
  link?: string
  details?: string[]
}

export function SmartAlertBar() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [data, setData] = useState<{ companies: Company[], closures: MonthlyClosure[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)

  // Get current filter from URL
  const currentFilter = searchParams.get('status')

  // Extract companyId from URL if on client detail page
  const companyIdFromUrl = useMemo(() => {
    const match = pathname.match(/\/accountant\/clients\/([^/]+)/)
    return match ? match[1] : null
  }, [pathname])

  // Function to set filter via URL
  const setFilter = useCallback((status: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (status) {
      params.set('status', status)
    } else {
      params.delete('status')
    }
    router.push(`${pathname}?${params.toString()}`)
  }, [pathname, router, searchParams])

  // Determine context from pathname
  const context: AlertContext = useMemo(() => {
    if (pathname.match(/\/accountant\/clients\/[^/]+/)) return 'client-detail'
    if (pathname.includes('/accountant/clients')) return 'clients'
    if (pathname.includes('/accountant/onboarding')) return 'onboarding'
    if (pathname.includes('/accountant/tasks')) return 'tasks'
    return 'dashboard'
  }, [pathname])

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/accountant/matrix')
        if (!response.ok) return
        const result = await response.json()
        setData(result)
      } catch (err) {
        // Silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Process data based on context
  const alertData = useMemo(() => {
    if (!data) return null

    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1

    // Filter only current and past closures
    const relevantClosures = data.closures.filter(c => {
      const [year, month] = c.period.split('-').map(Number)
      if (year < currentYear) return true
      if (year === currentYear && month <= currentMonth) return true
      return false
    })

    const getCompanyDisplayName = (companyId: string) => {
      const company = data.companies.find(c => c.id === companyId)
      if (!company) return 'Neznámá firma'
      return company.group_name
        ? `${company.group_name} – ${company.name}`
        : company.name
    }

    const getMissingDocs = (closure: MonthlyClosure): string[] => {
      const missing: string[] = []
      if (closure.bank_statement_status === 'missing') missing.push('výpis')
      if (closure.expense_documents_status === 'missing') missing.push('náklady')
      if (closure.income_invoices_status === 'missing') missing.push('příjmy')
      return missing
    }

    switch (context) {
      case 'dashboard': {
        // Dashboard: Přehled všech úkolů a stavů
        const stats = {
          overdue: 0,
          overdueClients: new Set<string>(),
          missingDocs: 0,
          pending: 0,
          pendingClients: new Set<string>(),
          pendingDocs: 0,
          upcoming: 0,
          complete: 0
        }

        const overdueItems: AlertItem[] = []
        const pendingItems: AlertItem[] = []

        relevantClosures.forEach(closure => {
          const [year, month] = closure.period.split('-').map(Number)
          const deadline = new Date(year, month, 10)
          const isOverdue = now > deadline
          const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          const isUpcoming = !isOverdue && daysUntilDeadline <= 7

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

          // Count missing docs
          let missingCount = 0
          if (closure.bank_statement_status === 'missing') missingCount++
          if (closure.expense_documents_status === 'missing') missingCount++
          if (closure.income_invoices_status === 'missing') missingCount++

          // Count pending docs
          let pendingCount = 0
          if (closure.bank_statement_status === 'uploaded') pendingCount++
          if (closure.expense_documents_status === 'uploaded') pendingCount++
          if (closure.income_invoices_status === 'uploaded') pendingCount++

          if (hasMissing && isOverdue) {
            stats.overdue++
            stats.overdueClients.add(closure.company_id)
            stats.missingDocs += missingCount
            const missing = getMissingDocs(closure)
            overdueItems.push({
              id: closure.id,
              type: 'critical',
              title: getCompanyDisplayName(closure.company_id),
              subtitle: `Uzávěrka ${month}/${year}`,
              link: `/accountant/clients/${closure.company_id}`,
              details: missing
            })
          } else if (hasUploaded && !hasMissing) {
            stats.pending++
            stats.pendingClients.add(closure.company_id)
            stats.pendingDocs += pendingCount
            pendingItems.push({
              id: closure.id,
              type: 'warning',
              title: getCompanyDisplayName(closure.company_id),
              subtitle: `Uzávěrka ${month}/${year}`,
              link: `/accountant/clients/${closure.company_id}`,
              details: ['Čeká na schválení']
            })
          } else if (hasMissing && isUpcoming) {
            stats.upcoming++
          } else if (allApproved) {
            stats.complete++
          }
        })

        return {
          icon: ClipboardList,
          label: 'úkolů',
          color: stats.overdue > 0 ? 'bg-red-600' : stats.pending > 0 ? 'bg-yellow-500' : 'bg-green-600',
          count: stats.overdue + stats.pending,
          items: [...overdueItems, ...pendingItems],
          emptyMessage: 'Všechny úkoly splněny',
          summaryPrefix: 'Přehled',
          // Extra data for dashboard context
          dashboardStats: {
            overdue: stats.overdue,
            overdueClients: stats.overdueClients.size,
            missingDocs: stats.missingDocs,
            pending: stats.pending,
            pendingClients: stats.pendingClients.size,
            pendingDocs: stats.pendingDocs,
            upcoming: stats.upcoming,
            complete: stats.complete,
            total: relevantClosures.length
          }
        }
      }

      case 'clients': {
        // Klienti: Statistiky podle stavu dokumentů
        const stats = {
          missing: new Set<string>(),
          uploaded: new Set<string>(),
          complete: new Set<string>(),
          missingDocs: 0,
          uploadedDocs: 0
        }

        // Pro každou firmu zjistit celkový stav
        data.companies.forEach(company => {
          const companyClosures = relevantClosures.filter(c => c.company_id === company.id)

          let hasMissing = false
          let hasUploaded = false
          let companyMissingDocs = 0
          let companyUploadedDocs = 0

          companyClosures.forEach(closure => {
            if (closure.bank_statement_status === 'missing') { hasMissing = true; companyMissingDocs++ }
            if (closure.expense_documents_status === 'missing') { hasMissing = true; companyMissingDocs++ }
            if (closure.income_invoices_status === 'missing') { hasMissing = true; companyMissingDocs++ }

            if (closure.bank_statement_status === 'uploaded') { hasUploaded = true; companyUploadedDocs++ }
            if (closure.expense_documents_status === 'uploaded') { hasUploaded = true; companyUploadedDocs++ }
            if (closure.income_invoices_status === 'uploaded') { hasUploaded = true; companyUploadedDocs++ }
          })

          if (hasMissing) {
            stats.missing.add(company.id)
            stats.missingDocs += companyMissingDocs
          } else if (hasUploaded) {
            stats.uploaded.add(company.id)
            stats.uploadedDocs += companyUploadedDocs
          } else {
            stats.complete.add(company.id)
          }
        })

        // Items pro rozbalený detail
        const clientsWithIssues = new Map<string, { missing: string[], periods: string[] }>()
        relevantClosures.forEach(closure => {
          const hasMissing =
            closure.bank_statement_status === 'missing' ||
            closure.expense_documents_status === 'missing' ||
            closure.income_invoices_status === 'missing'

          if (hasMissing) {
            const existing = clientsWithIssues.get(closure.company_id) || { missing: [], periods: [] }
            const missing = getMissingDocs(closure)
            const [year, month] = closure.period.split('-').map(Number)

            existing.missing = [...new Set([...existing.missing, ...missing])]
            existing.periods.push(`${month}/${year}`)
            clientsWithIssues.set(closure.company_id, existing)
          }
        })

        const items: AlertItem[] = Array.from(clientsWithIssues.entries()).map(([companyId, info]) => ({
          id: companyId,
          type: 'urgent' as const,
          title: getCompanyDisplayName(companyId),
          subtitle: `${info.periods.length} měsíc(ů)`,
          link: `/accountant/clients/${companyId}`,
          details: info.missing
        }))

        return {
          icon: Users,
          label: 'klientů',
          color: 'bg-purple-600',
          count: data.companies.length,
          items,
          emptyMessage: 'Žádní klienti',
          summaryPrefix: 'Přehled',
          // Extra data for clients context
          clientsStats: {
            missing: stats.missing.size,
            missingDocs: stats.missingDocs,
            uploaded: stats.uploaded.size,
            uploadedDocs: stats.uploadedDocs,
            complete: stats.complete.size,
            total: data.companies.length
          }
        }
      }

      case 'client-detail': {
        // Profil klienta: Úkoly tohoto konkrétního klienta
        if (!companyIdFromUrl) return null

        const clientClosures = relevantClosures.filter(c => c.company_id === companyIdFromUrl)
        const currentCompany = data.companies.find(c => c.id === companyIdFromUrl)
        const clientDisplayName = currentCompany
          ? (currentCompany.group_name ? `${currentCompany.group_name} – ${currentCompany.name}` : currentCompany.name)
          : 'Klient'

        // Stats for client
        const stats = {
          overdue: 0,
          overdueDocs: 0,
          pending: 0,
          pendingDocs: 0,
          missing: 0,
          missingDocs: 0,
          complete: 0,
          total: clientClosures.length
        }

        const items: AlertItem[] = []

        clientClosures.forEach(closure => {
          const [year, month] = closure.period.split('-').map(Number)
          const deadline = new Date(year, month, 10)
          const isOverdue = now > deadline

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

          // Count documents
          let missingCount = 0
          let uploadedCount = 0
          if (closure.bank_statement_status === 'missing') missingCount++
          if (closure.expense_documents_status === 'missing') missingCount++
          if (closure.income_invoices_status === 'missing') missingCount++
          if (closure.bank_statement_status === 'uploaded') uploadedCount++
          if (closure.expense_documents_status === 'uploaded') uploadedCount++
          if (closure.income_invoices_status === 'uploaded') uploadedCount++

          if (hasMissing && isOverdue) {
            stats.overdue++
            stats.overdueDocs += missingCount
            const missing = getMissingDocs(closure)
            items.push({
              id: `${closure.id}-missing`,
              type: 'critical',
              title: `Uzávěrka ${month}/${year}`,
              subtitle: 'Po termínu!',
              details: missing.map(m => `Chybí: ${m}`)
            })
          } else if (hasMissing) {
            stats.missing++
            stats.missingDocs += missingCount
            const missing = getMissingDocs(closure)
            items.push({
              id: `${closure.id}-missing`,
              type: 'urgent',
              title: `Uzávěrka ${month}/${year}`,
              subtitle: `Termín: ${deadline.toLocaleDateString('cs-CZ')}`,
              details: missing.map(m => `Chybí: ${m}`)
            })
          } else if (hasUploaded) {
            stats.pending++
            stats.pendingDocs += uploadedCount
            items.push({
              id: `${closure.id}-approval`,
              type: 'warning',
              title: `Uzávěrka ${month}/${year}`,
              subtitle: 'Čeká na schválení',
              details: ['Dokumenty nahrány, ke kontrole']
            })
          } else if (allApproved) {
            stats.complete++
          }
        })

        return {
          icon: FileText,
          label: 'úkolů',
          color: stats.overdue > 0 ? 'bg-red-600' : (stats.missing > 0 || stats.pending > 0) ? 'bg-orange-500' : 'bg-green-600',
          count: items.length,
          items,
          emptyMessage: 'Žádné nevyřízené úkoly',
          summaryPrefix: clientDisplayName,
          // Extra stats for client detail context
          clientDetailStats: {
            clientName: clientDisplayName,
            overdue: stats.overdue,
            overdueDocs: stats.overdueDocs,
            missing: stats.missing,
            missingDocs: stats.missingDocs,
            pending: stats.pending,
            pendingDocs: stats.pendingDocs,
            complete: stats.complete,
            total: stats.total
          }
        }
      }

      case 'onboarding': {
        // Onboarding: Klienti čekající na náběr (simulace)
        // V reálné aplikaci by to bralo data z onboarding tabulky
        return {
          icon: UserPlus,
          label: 'klientů čeká na náběr',
          color: 'bg-blue-500',
          count: 0,
          items: [],
          emptyMessage: 'Žádní noví klienti k náběru',
          summaryPrefix: 'Náběr'
        }
      }

      case 'tasks': {
        // Tasks: Všechny úkoly (podobné jako dashboard)
        return {
          icon: ClipboardList,
          label: 'aktivních úkolů',
          color: 'bg-purple-600',
          count: 0,
          items: [],
          emptyMessage: 'Žádné aktivní úkoly',
          summaryPrefix: 'Úkoly'
        }
      }

      default:
        return null
    }
  }, [data, context, companyIdFromUrl])

  if (loading || !alertData) return null

  // Don't show bar if no items and we want to hide empty states
  // (optional - můžeš odkomentovat pro skrytí prázdných stavů)
  // if (alertData.count === 0) return null

  const Icon = alertData.icon
  const hasItems = alertData.count > 0

  // Check if we have stats for special contexts
  const clientsStats = 'clientsStats' in alertData ? alertData.clientsStats : null
  const dashboardStats = 'dashboardStats' in alertData ? alertData.dashboardStats : null

  // Generate summary for collapsed view
  const collapsedSummary = () => {
    if (!hasItems) return alertData.emptyMessage

    const firstItems = alertData.items.slice(0, 2)
    const summary = firstItems.map(item => {
      const details = item.details?.slice(0, 2).join(', ')
      return details ? `${item.title} (${details})` : item.title
    }).join(', ')

    const remaining = alertData.count - 2
    return remaining > 0 ? `${summary} a další ${remaining}` : summary
  }

  // Special render for dashboard context with interactive stats
  if (context === 'dashboard' && dashboardStats) {
    return (
      <div className="relative">
        <div className="bg-gray-800 text-white px-4 py-2">
          <div className="max-w-7xl mx-auto">
            {/* Stats row with clickable actions */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-blue-400" />
                <span className="font-medium">Přehled úkolů</span>
              </div>

              {/* Interactive stat buttons - only show problems */}
              <div className="flex items-center gap-2">
                {/* Overdue - po termínu */}
                {dashboardStats.overdueClients > 0 && (
                  <button
                    onClick={() => setExpanded(!expanded)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-all"
                  >
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>Po termínu: {dashboardStats.overdueClients} klientů</span>
                    <span className="text-xs opacity-75">({dashboardStats.missingDocs} dok.)</span>
                  </button>
                )}

                {/* Pending - ke schválení */}
                {dashboardStats.pendingClients > 0 && (
                  <button
                    onClick={() => setExpanded(!expanded)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-yellow-500 text-gray-900 hover:bg-yellow-400 transition-all"
                  >
                    <Clock className="h-3.5 w-3.5" />
                    <span>Ke schválení: {dashboardStats.pendingClients} klientů</span>
                    <span className="text-xs opacity-75">({dashboardStats.pendingDocs} dok.)</span>
                  </button>
                )}

                {/* All good message */}
                {dashboardStats.overdueClients === 0 && dashboardStats.pendingClients === 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1 text-sm font-medium text-green-300">
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span>Vše v pořádku</span>
                  </div>
                )}

                {/* Expand/collapse toggle */}
                {(dashboardStats.overdueClients > 0 || dashboardStats.pendingClients > 0) && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-7 text-xs bg-white/10 hover:bg-white/20 text-white border-0 ml-2"
                    onClick={() => setExpanded(!expanded)}
                  >
                    {expanded ? 'Skrýt' : 'Detail'}
                    {expanded ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Expanded dropdown for dashboard */}
        {expanded && hasItems && (
          <div className="absolute left-0 right-0 top-full bg-gray-50 border-b shadow-xl z-40 max-h-[50vh] overflow-y-auto">
            <div className="max-w-7xl mx-auto p-4">
              <div className="space-y-2">
                {alertData.items.map(item => (
                  <div
                    key={item.id}
                    className={`bg-white rounded-lg border p-3 hover:shadow-md transition-shadow ${
                      item.type === 'critical' ? 'border-l-4 border-l-red-500' :
                      item.type === 'warning' ? 'border-l-4 border-l-yellow-500' :
                      'border-l-4 border-l-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-900">{item.title}</span>
                          {item.subtitle && (
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                item.type === 'critical' ? 'text-red-600 border-red-300' :
                                item.type === 'warning' ? 'text-yellow-600 border-yellow-300' :
                                'text-gray-600 border-gray-300'
                              }`}
                            >
                              {item.subtitle}
                            </Badge>
                          )}
                        </div>
                        {item.details && item.details.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {item.details.map((detail, idx) => (
                              <span key={idx} className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                {detail}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {/* Action buttons */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {item.type === 'critical' && (
                          <Button size="sm" variant="outline" className="text-xs h-7 text-orange-600 border-orange-300 hover:bg-orange-50">
                            Připomenout klienta
                          </Button>
                        )}
                        {item.type === 'warning' && (
                          <Button size="sm" className="text-xs h-7 bg-green-600 hover:bg-green-700 text-white">
                            Schválit dokumenty
                          </Button>
                        )}
                        {item.link && (
                          <Link href={item.link}>
                            <Button size="sm" variant="ghost" className="text-xs h-7 text-gray-500 hover:text-purple-600">
                              Detail →
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Check for client detail stats
  const clientDetailStats = 'clientDetailStats' in alertData ? alertData.clientDetailStats : null

  // Special render for client-detail context with interactive stats
  if (context === 'client-detail' && clientDetailStats) {
    const hasIssues = clientDetailStats.overdue > 0 || clientDetailStats.missing > 0 || clientDetailStats.pending > 0
    return (
      <div className="relative">
        <div className="bg-gray-800 text-white px-4 py-2">
          <div className="max-w-7xl mx-auto">
            {/* Stats row with clickable actions */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-400" />
                <span className="font-medium truncate max-w-xs">{clientDetailStats.clientName}</span>
                <span className="text-gray-400 mx-1">•</span>
                <span className="text-sm text-gray-300">{clientDetailStats.total} měsíců</span>
              </div>

              {/* Interactive stat buttons */}
              <div className="flex items-center gap-2">
                {/* Overdue - po termínu */}
                {clientDetailStats.overdue > 0 && (
                  <button
                    onClick={() => setExpanded(!expanded)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-red-500 text-white hover:bg-red-600"
                  >
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>Po termínu: {clientDetailStats.overdue}</span>
                    <span className="text-xs opacity-75">({clientDetailStats.overdueDocs} dok.)</span>
                  </button>
                )}

                {/* Missing but not overdue */}
                {clientDetailStats.missing > 0 && (
                  <button
                    onClick={() => setExpanded(!expanded)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-orange-500 text-white hover:bg-orange-600"
                  >
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>Chybí: {clientDetailStats.missing}</span>
                    <span className="text-xs opacity-75">({clientDetailStats.missingDocs} dok.)</span>
                  </button>
                )}

                {/* Pending - ke schválení */}
                {clientDetailStats.pending > 0 && (
                  <button
                    onClick={() => setExpanded(!expanded)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-yellow-500 text-gray-900 hover:bg-yellow-400"
                  >
                    <Clock className="h-3.5 w-3.5" />
                    <span>Ke schválení: {clientDetailStats.pending}</span>
                    <span className="text-xs opacity-75">({clientDetailStats.pendingDocs} dok.)</span>
                  </button>
                )}

                {/* All good message */}
                {!hasIssues && (
                  <div className="flex items-center gap-1.5 px-3 py-1 text-sm font-medium text-green-300">
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span>Vše v pořádku</span>
                  </div>
                )}

                {/* Expand/collapse toggle */}
                {hasIssues && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-7 text-xs bg-white/10 hover:bg-white/20 text-white border-0 ml-2"
                    onClick={() => setExpanded(!expanded)}
                  >
                    {expanded ? 'Skrýt' : 'Detail'}
                    {expanded ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Expanded dropdown for client detail */}
        {expanded && hasItems && (
          <div className="absolute left-0 right-0 top-full bg-gray-50 border-b shadow-xl z-40 max-h-[50vh] overflow-y-auto">
            <div className="max-w-7xl mx-auto p-4">
              <div className="space-y-2">
                {alertData.items.map(item => (
                  <div
                    key={item.id}
                    className={`bg-white rounded-lg border p-3 hover:shadow-md transition-shadow ${
                      item.type === 'critical' ? 'border-l-4 border-l-red-500' :
                      item.type === 'urgent' ? 'border-l-4 border-l-orange-500' :
                      item.type === 'warning' ? 'border-l-4 border-l-yellow-500' :
                      'border-l-4 border-l-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-900">{item.title}</span>
                          {item.subtitle && (
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                item.type === 'critical' ? 'text-red-600 border-red-300' :
                                item.type === 'urgent' ? 'text-orange-600 border-orange-300' :
                                item.type === 'warning' ? 'text-yellow-600 border-yellow-300' :
                                'text-gray-600 border-gray-300'
                              }`}
                            >
                              {item.subtitle}
                            </Badge>
                          )}
                        </div>
                        {item.details && item.details.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {item.details.map((detail, idx) => (
                              <span key={idx} className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                {detail}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {/* Action buttons */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {(item.type === 'critical' || item.type === 'urgent') && (
                          <Button size="sm" variant="outline" className="text-xs h-7 text-orange-600 border-orange-300 hover:bg-orange-50">
                            Připomenout
                          </Button>
                        )}
                        {item.type === 'warning' && (
                          <Button size="sm" className="text-xs h-7 bg-green-600 hover:bg-green-700 text-white">
                            Schválit dokumenty
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Special render for clients context with interactive stats
  if (context === 'clients' && clientsStats) {
    return (
      <div className="relative">
        <div className="bg-gray-800 text-white px-4 py-2">
          <div className="max-w-7xl mx-auto">
            {/* Stats row with clickable filters */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-400" />
                <span className="font-medium">{clientsStats.total} klientů</span>
                <span className="text-gray-400 mx-2">|</span>
                <span className="text-sm text-gray-300">Rychlý filtr:</span>
              </div>

              {/* Interactive stat buttons - only problems */}
              <div className="flex items-center gap-2">
                {/* Missing docs */}
                {clientsStats.missing > 0 && (
                  <button
                    onClick={() => setFilter(currentFilter === 'missing' ? null : 'missing')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium transition-all ${
                      currentFilter === 'missing'
                        ? 'bg-red-500 text-white ring-2 ring-red-300'
                        : 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                    }`}
                  >
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>Chybí: {clientsStats.missing} klientů</span>
                    <span className="text-xs opacity-75">({clientsStats.missingDocs} dok.)</span>
                  </button>
                )}

                {/* Uploaded docs */}
                {clientsStats.uploaded > 0 && (
                  <button
                    onClick={() => setFilter(currentFilter === 'uploaded' ? null : 'uploaded')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium transition-all ${
                      currentFilter === 'uploaded'
                        ? 'bg-yellow-500 text-gray-900 ring-2 ring-yellow-300'
                        : 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30'
                    }`}
                  >
                    <Clock className="h-3.5 w-3.5" />
                    <span>Ke schválení: {clientsStats.uploaded} klientů</span>
                    <span className="text-xs opacity-75">({clientsStats.uploadedDocs} dok.)</span>
                  </button>
                )}

                {/* All good message */}
                {clientsStats.missing === 0 && clientsStats.uploaded === 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1 text-sm font-medium text-green-300">
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span>Všichni klienti v pořádku</span>
                  </div>
                )}

                {/* Clear filter */}
                {currentFilter && (
                  <button
                    onClick={() => setFilter(null)}
                    className="flex items-center gap-1 px-2 py-1 rounded text-sm text-gray-400 hover:text-white hover:bg-white/10"
                  >
                    <X className="h-3.5 w-3.5" />
                    Zrušit filtr
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Main bar */}
      <div className={`${alertData.color} text-white px-4 py-2 transition-colors`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Icon className={`h-5 w-5 flex-shrink-0 ${hasItems ? 'animate-pulse' : ''}`} />
            <div className="text-sm flex-1 min-w-0">
              <span className="font-bold">
                {hasItems
                  ? `${alertData.count} ${alertData.label}`
                  : alertData.emptyMessage
                }
              </span>
              {hasItems && (
                <>
                  <span className="mx-2 opacity-60">|</span>
                  <span className="opacity-90 truncate">
                    {collapsedSummary()}
                  </span>
                </>
              )}
            </div>
          </div>

          {hasItems && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                size="sm"
                variant="secondary"
                className="h-7 text-xs bg-white/20 hover:bg-white/30 text-white border-0"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? 'Skrýt' : 'Detail'}
                {expanded ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Expanded dropdown */}
      {expanded && hasItems && (
        <div className="absolute left-0 right-0 top-full bg-gray-50 border-b shadow-xl z-40 max-h-[50vh] overflow-y-auto">
          <div className="max-w-7xl mx-auto p-4">
            <div className="space-y-2">
              {alertData.items.map(item => (
                <div
                  key={item.id}
                  className={`bg-white rounded-lg border p-3 hover:shadow-md transition-shadow ${
                    item.type === 'critical' ? 'border-l-4 border-l-red-500' :
                    item.type === 'urgent' ? 'border-l-4 border-l-orange-500' :
                    'border-l-4 border-l-yellow-500'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900">{item.title}</span>
                        {item.subtitle && (
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              item.type === 'critical' ? 'text-red-600 border-red-300' :
                              item.type === 'urgent' ? 'text-orange-600 border-orange-300' :
                              'text-yellow-600 border-yellow-300'
                            }`}
                          >
                            {item.subtitle}
                          </Badge>
                        )}
                      </div>
                      {item.details && item.details.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {item.details.map((detail, idx) => (
                            <span key={idx} className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                              {detail}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Action buttons */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {(item.type === 'critical' || item.type === 'urgent') && (
                        <Button size="sm" variant="outline" className="text-xs h-7 text-orange-600 border-orange-300 hover:bg-orange-50">
                          Připomenout
                        </Button>
                      )}
                      {item.type === 'warning' && (
                        <Button size="sm" className="text-xs h-7 bg-green-600 hover:bg-green-700 text-white">
                          Schválit
                        </Button>
                      )}
                      {item.link && (
                        <Link href={item.link}>
                          <Button size="sm" variant="ghost" className="text-xs h-7 text-gray-500 hover:text-purple-600">
                            Detail →
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
