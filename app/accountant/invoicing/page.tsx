'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DollarSign,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileText,
  Download,
  CheckCircle,
  Clock,
  TrendingUp,
  Building2,
  Search,
  ChevronDown,
  ChevronUp,
  Eye,
  Send,
  CheckCheck,
  AlertTriangle,
  Users,
  X,
  Printer,
  ArrowRight,
  Loader2,
} from 'lucide-react'
import {
  type Invoice,
  type InvoiceStatus,
} from '@/lib/mock-data'
import {
  type TimeEntry,
  type BillableProject,
  type UserStats,
  type InvoicingData,
} from '@/lib/types/invoicing'
import { toast } from 'sonner'
import { useAccountantUser } from '@/lib/contexts/accountant-user-context'
import { ProfitabilityWidget } from '@/components/accountant/profitability-widget'

type FilterStatus = 'all' | InvoiceStatus

// Invoice preview type
interface InvoicePreview {
  projectId: string
  clientName: string
  projectTitle: string
  totalHours: number
  hourlyRate: number
  totalAmount: number
  timeEntries: Array<{
    date: string
    userName: string
    description: string
    hours: number
    note?: string
  }>
  vatRate: number
}

// Helper to calculate user stats from projects
function getUserStats(projects: BillableProject[]): UserStats[] {
  const userMap = new Map<string, UserStats>()

  projects.forEach(project => {
    project.timeEntries.forEach(entry => {
      if (!userMap.has(entry.userId)) {
        userMap.set(entry.userId, {
          userId: entry.userId,
          userName: entry.userName,
          totalHours: 0,
          totalRevenue: 0,
          projectCount: 0
        })
      }

      const stats = userMap.get(entry.userId)!
      stats.totalHours += entry.hours
      stats.totalRevenue += entry.hours * project.hourlyRate
    })
  })

  // Count unique projects per user
  projects.forEach(project => {
    const userIds = new Set(project.timeEntries.map(e => e.userId))
    userIds.forEach(userId => {
      const stats = userMap.get(userId)
      if (stats) stats.projectCount++
    })
  })

  return Array.from(userMap.values()).sort((a, b) => b.totalHours - a.totalHours)
}

export default function InvoicingPage() {
  const router = useRouter()
  const { userRole } = useAccountantUser()
  const isAdmin = userRole === 'admin'

  // Period state (YYYY-MM format)
  const [currentPeriod, setCurrentPeriod] = useState('2025-11')

  // Data state
  const [invoicingData, setInvoicingData] = useState<InvoicingData>({ periods: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [filterClient, setFilterClient] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [showOnlyPending, setShowOnlyPending] = useState(true)

  // Expandable card state
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())

  // Invoice state
  // TODO: Fetch invoices from Supabase API
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())

  // Invoice preview modal state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewInvoice, setPreviewInvoice] = useState<InvoicePreview | null>(null)
  const [generatingInvoice, setGeneratingInvoice] = useState(false)

  // Fetch data from API
  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch('/api/accountant/invoicing')
        if (!response.ok) {
          throw new Error('Failed to fetch invoicing data')
        }
        const data = await response.json()
        setInvoicingData(data)
      } catch (err) {
        console.error('Error fetching invoicing data:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        // Set empty data on error
        setInvoicingData({ periods: [] })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // TODO: Fetch billable tasks from Supabase API
  const billableTasksByCompany = useMemo(() => {
    return {} as Record<string, { company: any, tasks: any[], totalHours: number, totalAmount: number }>
  }, [invoices])

  // Handler: Open invoice preview modal
  const handleGenerateInvoice = (project: BillableProject) => {
    const preview: InvoicePreview = {
      projectId: project.id,
      clientName: project.clientName,
      projectTitle: project.projectTitle,
      totalHours: project.totalBillableHours,
      hourlyRate: project.hourlyRate,
      totalAmount: project.totalAmount,
      timeEntries: project.timeEntries,
      vatRate: 21, // Standard Czech VAT rate
    }
    setPreviewInvoice(preview)
    setIsPreviewOpen(true)
  }

  // Handler: Close preview modal
  const handleClosePreview = () => {
    setIsPreviewOpen(false)
    setPreviewInvoice(null)
    setGeneratingInvoice(false)
  }

  // Handler: Confirm and generate invoice
  const handleConfirmInvoice = async () => {
    if (!previewInvoice) return
    setGeneratingInvoice(true)
    // TODO: Create invoice via Supabase API
    toast.info('Fakturace zatím není napojena na API')
    handleClosePreview()
  }

  // Handler: Navigate to time entry task detail
  const handleTimeEntryClick = (entry: { description: string; userName: string }) => {
    toast.info('Navigace k úkolu', {
      description: `Úkol: ${entry.description.substring(0, 50)}...`,
    })
  }

  // Handler: Create invoice from selected tasks
  const handleCreateInvoice = (_companyId: string, _taskIds: string[]) => {
    // TODO: Create invoice via Supabase API
    toast.info('Fakturace zatím není napojena na API')
  }

  // Handler: Mark invoice as sent
  const handleMarkAsSent = (invoiceId: string) => {
    setInvoices(prev => prev.map(inv =>
      inv.id === invoiceId
        ? { ...inv, status: 'sent' as InvoiceStatus, updated_at: new Date().toISOString() }
        : inv
    ))
    toast.success('Faktura označena jako odeslaná')
  }

  // Handler: Mark invoice as paid
  const handleMarkAsPaid = (invoiceId: string) => {
    setInvoices(prev => prev.map(inv =>
      inv.id === invoiceId
        ? {
            ...inv,
            status: 'paid' as InvoiceStatus,
            paid_at: new Date().toISOString().split('T')[0],
            updated_at: new Date().toISOString()
          }
        : inv
    ))
    toast.success('Faktura označena jako zaplacená')
  }

  // Get data for current period
  const periodData = invoicingData.periods.find(p => p.period === currentPeriod)
  const projects = periodData?.projects || []

  // Get unique clients for filter
  const uniqueClients = useMemo(() => {
    const clients = new Set(projects.map(p => p.clientName))
    return Array.from(clients).sort()
  }, [projects])

  // Navigate between periods
  const navigatePeriod = (direction: 'prev' | 'next') => {
    const [year, month] = currentPeriod.split('-').map(Number)
    let newYear = year
    let newMonth = month

    if (direction === 'prev') {
      newMonth -= 1
      if (newMonth < 1) {
        newMonth = 12
        newYear -= 1
      }
    } else {
      newMonth += 1
      if (newMonth > 12) {
        newMonth = 1
        newYear += 1
      }
    }

    setCurrentPeriod(`${newYear}-${String(newMonth).padStart(2, '0')}`)
  }

  // Format period for display
  const formatPeriod = (period: string) => {
    const [year, month] = period.split('-')
    const monthNames = [
      'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
      'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'
    ]
    return `${monthNames[parseInt(month) - 1]} ${year}`
  }

  // Filter and search projects
  const filteredProjects = useMemo(() => {
    let filtered = projects

    // Show only pending (not invoiced yet)
    if (showOnlyPending) {
      filtered = filtered.filter(p => p.invoiceStatus === 'draft')
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.projectTitle.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Client filter
    if (filterClient !== 'all') {
      filtered = filtered.filter(p => p.clientName === filterClient)
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(p => p.invoiceStatus === filterStatus)
    }

    return filtered
  }, [projects, searchQuery, filterClient, filterStatus, showOnlyPending])

  // Calculate summary statistics
  const summary = useMemo(() => {
    const totalHours = filteredProjects.reduce((sum, p) => sum + p.totalBillableHours, 0)
    const totalAmount = filteredProjects.reduce((sum, p) => sum + p.totalAmount, 0)
    const paidAmount = filteredProjects
      .filter(p => p.invoiceStatus === 'paid')
      .reduce((sum, p) => sum + p.totalAmount, 0)
    const unpaidAmount = filteredProjects
      .filter(p => p.invoiceStatus !== 'paid')
      .reduce((sum, p) => sum + p.totalAmount, 0)

    return {
      totalHours: totalHours.toFixed(1),
      totalAmount,
      paidAmount,
      unpaidAmount,
      projectCount: filteredProjects.length,
    }
  }, [filteredProjects])

  // Calculate user statistics
  const userStats = useMemo(() => {
    return getUserStats(filteredProjects)
  }, [filteredProjects])

  // Toggle project expansion
  const toggleProjectExpansion = (projectId: string) => {
    const newExpanded = new Set(expandedProjects)
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId)
    } else {
      newExpanded.add(projectId)
    }
    setExpandedProjects(newExpanded)
  }

  // Status configuration
  const statusConfig = {
    draft: {
      label: 'Koncept',
      color: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300',
      icon: FileText,
    },
    sent: {
      label: 'Odesláno',
      color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300',
      icon: Send,
    },
    paid: {
      label: 'Zaplaceno',
      color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300',
      icon: CheckCheck,
    },
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Calculate VAT amount
  const calculateVAT = (amount: number, vatRate: number) => {
    return amount * (vatRate / 100)
  }

  // Loading state
  if (loading) {
    return (
      <div className="max-w-7xl flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 text-blue-600 animate-spin" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Načítání fakturačních dat...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-7xl">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="py-8 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-600 mb-4" />
            <h3 className="text-lg font-semibold text-red-900 mb-2">Chyba při načítání dat</h3>
            <p className="text-red-700">{error}</p>
            <Button
              className="mt-4"
              onClick={() => window.location.reload()}
              variant="outline"
            >
              Zkusit znovu
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Přehled fakturace</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Služby a projekty připravené k vyfakturování
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              💡 Faktury se vystavují u jednotlivých úkolů, projektů a klientů. Zde máte přehled co je připraveno k fakturaci.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="lg"
              variant={showOnlyPending ? 'default' : 'outline'}
              className={showOnlyPending ? 'bg-orange-600 hover:bg-orange-700' : ''}
              onClick={() => setShowOnlyPending(!showOnlyPending)}
            >
              <AlertTriangle className="mr-2 h-5 w-5" />
              {showOnlyPending ? 'Jen nevyfakturované' : 'Zobrazit všechno'}
            </Button>
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              onClick={() => {
                const url = `/api/accountant/invoicing/export-xml?period=${currentPeriod}`
                window.open(url, '_blank')
              }}
            >
              <Download className="mr-2 h-5 w-5" />
              Export do Pohody
            </Button>
          </div>
        </div>

        {/* Period Selector + Summary Stats */}
        <div className={`grid gap-4 ${isAdmin ? 'md:grid-cols-5' : 'md:grid-cols-3'} mb-6`}>
          {/* Period Selector */}
          <Card className="md:col-span-1">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigatePeriod('prev')}
                  className="h-8 w-8"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-center flex-1">
                  <Calendar className="h-5 w-5 mx-auto mb-1 text-blue-600 dark:text-blue-400" />
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatPeriod(currentPeriod)}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigatePeriod('next')}
                  className="h-8 w-8"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Summary Stats */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Celkem hodin</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{summary.totalHours}h</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Celková částka</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatCurrency(summary.totalAmount)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {isAdmin && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Zaplaceno</p>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(summary.paidAmount)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {isAdmin && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Nezaplaceno</p>
                    <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                      {formatCurrency(summary.unpaidAmount)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Rest of the page continues similarly... */}
        {Object.keys(billableTasksByCompany).length > 0 && (
          <Card className="mb-6 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-900">
                <Clock className="h-5 w-5" />
                Neprofakturované úkoly (billing_type: extra)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(billableTasksByCompany).map(([companyId, data]) => (
                  <div
                    key={companyId}
                    className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-amber-200"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-amber-600" />
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {data.company.name}
                        </span>
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                          {data.tasks.length} {data.tasks.length === 1 ? 'úkol' : 'úkolů'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-lg font-bold text-amber-700">
                            {formatCurrency(data.totalAmount)}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => handleCreateInvoice(companyId, data.tasks.map(t => t.id))}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Vytvořit fakturu
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* User Statistics - admin only */}
        {isAdmin && userStats.length > 0 && (
          <Card className="mb-6 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Users className="h-5 w-5" />
                Statistiky podle účetních
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-blue-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Účetní</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold">Projektů</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold">Hodin</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold">Vyfakturováno</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userStats.map((stat) => (
                      <tr key={stat.userId} className="border-b border-gray-200">
                        <td className="py-3 px-4 font-semibold">{stat.userName}</td>
                        <td className="text-right py-3 px-4">{stat.projectCount}</td>
                        <td className="text-right py-3 px-4 font-semibold text-blue-700">{stat.totalHours.toFixed(1)}h</td>
                        <td className="text-right py-3 px-4 font-semibold text-green-700">
                          {formatCurrency(stat.totalRevenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filter Bar - compact */}
        <Card className="mb-6">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <Input
                  placeholder="Hledat..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9"
                />
              </div>
              <Select value={filterClient} onValueChange={setFilterClient}>
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue placeholder="Klient" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Všichni klienti</SelectItem>
                  {uniqueClients.map(client => (
                    <SelectItem key={client} value={client}>{client}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as FilterStatus)}>
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Vše</SelectItem>
                  <SelectItem value="draft">Koncept</SelectItem>
                  <SelectItem value="sent">Odesláno</SelectItem>
                  <SelectItem value="paid">Zaplaceno</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-md border">
                <span className="text-sm text-gray-600">
                  Zobrazeno projektů: <strong>{filteredProjects.length}</strong>
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Cards */}
      <div className="space-y-4">
        {filteredProjects.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Žádné projekty k fakturaci
              </h3>
              <p className="text-gray-600">
                {searchQuery || filterClient !== 'all' || filterStatus !== 'all'
                  ? 'Zkuste změnit filtry'
                  : 'V tomto období nejsou žádné fakturovatelné projekty'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredProjects.map((project) => {
            const isExpanded = expandedProjects.has(project.id)
            const StatusIcon = statusConfig[project.invoiceStatus].icon

            return (
              <Card key={project.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => router.push(`/accountant/projects/${project.id}`)}>
                      <div className="flex items-center gap-2 mb-2">
                        <Building2 className="h-5 w-5 text-gray-500 flex-shrink-0" />
                        <span className="text-sm font-semibold text-gray-600">{project.clientName}</span>
                        <Badge className={`${statusConfig[project.invoiceStatus].color}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig[project.invoiceStatus].label}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl mb-2">{project.projectTitle}</CardTitle>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Odpracováno</p>
                          <p className="font-semibold">{project.totalBillableHours.toFixed(1)}h</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Hodinová sazba</p>
                          <p className="font-semibold">{formatCurrency(project.hourlyRate)}/h</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Celková částka</p>
                          <p className="font-semibold text-blue-600 text-lg">{formatCurrency(project.totalAmount)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {project.invoiceStatus === 'draft' && (
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={() => handleGenerateInvoice(project)}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Vygenerovat fakturu
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleProjectExpansion(project.id)}
                    className="w-full mb-3"
                  >
                    {isExpanded ? (
                      <><ChevronUp className="h-4 w-4 mr-2" />Skrýt rozpis</>
                    ) : (
                      <><ChevronDown className="h-4 w-4 mr-2" />Zobrazit rozpis ({project.timeEntries.length})</>
                    )}
                  </Button>
                  {isExpanded && (
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      {project.timeEntries.map((entry, index) => (
                        <div key={index} className="bg-white rounded-lg p-3 border">
                          <div className="flex justify-between">
                            <div>
                              <span className="text-xs text-gray-500">{entry.date}</span>
                              <p className="font-medium">{entry.description}</p>
                              <span className="text-xs text-gray-600">{entry.userName}</span>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{entry.hours.toFixed(1)}h</p>
                              <p className="text-sm text-gray-600">{formatCurrency(entry.hours * project.hourlyRate)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Invoice Preview Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Náhled faktury</DialogTitle>
            <DialogDescription>Zkontrolujte údaje před vygenerováním</DialogDescription>
          </DialogHeader>
          {previewInvoice && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p><strong>Odběratel:</strong> {previewInvoice.clientName}</p>
                <p><strong>Projekt:</strong> {previewInvoice.projectTitle}</p>
                <p><strong>Celkem hodin:</strong> {previewInvoice.totalHours.toFixed(1)}h</p>
                <p><strong>Celková částka:</strong> {formatCurrency(previewInvoice.totalAmount)}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={handleClosePreview}>Zrušit</Button>
            <Button onClick={handleConfirmInvoice} disabled={generatingInvoice} className="bg-blue-600">
              {generatingInvoice ? 'Generuji...' : 'Vygenerovat fakturu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mt-6">
        {isAdmin && <ProfitabilityWidget limit={20} />}
      </div>
    </div>
  )
}
