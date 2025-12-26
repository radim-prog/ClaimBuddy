'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  Filter,
  ChevronDown,
  ChevronUp,
  Eye,
  Send,
  CheckCheck,
  AlertTriangle,
  Users,
} from 'lucide-react'
import { mockInvoicingData, getUserStats, type InvoiceStatus, type UserStats } from '@/lib/invoicing-mock-data'
import { getBillableByClient } from '@/lib/mock-data'

type FilterStatus = 'all' | InvoiceStatus

export default function InvoicingPage() {
  // Period state (YYYY-MM format)
  const [currentPeriod, setCurrentPeriod] = useState('2025-11')

  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [filterClient, setFilterClient] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [showOnlyPending, setShowOnlyPending] = useState(true)

  // Expandable card state
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())

  // Get data for current period
  const periodData = mockInvoicingData.periods.find(p => p.period === currentPeriod)
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

  // FÁZE 7: Get uninvoiced time from task system
  const billableTimeLogs = useMemo(() => {
    return getBillableByClient()
  }, [])

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
      color: 'bg-gray-100 text-gray-700 border-gray-300',
      icon: FileText,
    },
    sent: {
      label: 'Odesláno',
      color: 'bg-blue-100 text-blue-700 border-blue-300',
      icon: Send,
    },
    paid: {
      label: 'Zaplaceno',
      color: 'bg-green-100 text-green-700 border-green-300',
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

  return (
    <div className="max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Přehled fakturace</h1>
            <p className="mt-2 text-gray-600">
              Služby a projekty připravené k vyfakturování
            </p>
            <p className="mt-1 text-sm text-gray-500">
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
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Download className="mr-2 h-5 w-5" />
              Export do Pohody
            </Button>
          </div>
        </div>

        {/* Period Selector + Summary Stats */}
        <div className="grid gap-4 md:grid-cols-5 mb-6">
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
                  <Calendar className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                  <p className="text-sm font-semibold text-gray-900">
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
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Celkem hodin</p>
                  <p className="text-lg font-bold text-gray-900">{summary.totalHours}h</p>
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
                  <p className="text-xs text-gray-600">Celková částka</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(summary.totalAmount)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Zaplaceno</p>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(summary.paidAmount)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Nezaplaceno</p>
                  <p className="text-lg font-bold text-orange-600">
                    {formatCurrency(summary.unpaidAmount)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FÁZE 7: Uninvoiced Time Logs from Task System */}
        {billableTimeLogs.length > 0 && (
          <Card className="mb-6 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-900">
                <Clock className="h-5 w-5" />
                Neprofakturované time logy z úkolů
              </CardTitle>
              <p className="text-sm text-gray-600">
                Dokončené úkoly s logovaným časem, které ještě nebyly vyfakturovány
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {billableTimeLogs.map((summary) => (
                  <div
                    key={summary.company_id}
                    className="p-4 bg-white rounded-lg border border-amber-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-amber-600" />
                        <span className="font-semibold text-gray-900">
                          {summary.company_name}
                        </span>
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                          {summary.uninvoicedTasks.length} {summary.uninvoicedTasks.length === 1 ? 'úkol' : 'úkolů'}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-amber-700">
                          {formatCurrency(summary.totalAmount)}
                        </span>
                        <span className="text-sm text-gray-500 ml-2">
                          ({Math.round(summary.totalMinutes / 60 * 10) / 10}h)
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      {summary.uninvoicedTasks.slice(0, 3).map((task) => (
                        <div key={task.task_id} className="flex justify-between">
                          <span className="truncate">{task.task_title}</span>
                          <span className="text-gray-900">{formatCurrency(task.amount)}</span>
                        </div>
                      ))}
                      {summary.uninvoicedTasks.length > 3 && (
                        <p className="text-amber-600">+ {summary.uninvoicedTasks.length - 3} dalších úkolů</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-amber-200 flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  Celkem k fakturaci z time logů:
                </span>
                <span className="text-xl font-bold text-amber-700">
                  {formatCurrency(billableTimeLogs.reduce((sum, s) => sum + s.totalAmount, 0))}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* User Statistics */}
        {userStats.length > 0 && (
          <Card className="mb-6 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Users className="h-5 w-5" />
                Statistiky podle účetních
              </CardTitle>
              <p className="text-sm text-gray-600">
                Přehled odpracovaných hodin a vyfakturované částky podle jednotlivých členů týmu
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-blue-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Účetní
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                        Počet projektů
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                        Odpracováno hodin
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                        Vyfakturováno
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                        Průměrná sazba
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {userStats.map((stat) => (
                      <tr
                        key={stat.userId}
                        className="border-b border-gray-200 hover:bg-white/50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <p className="font-semibold text-gray-900">{stat.userName}</p>
                        </td>
                        <td className="text-right py-3 px-4 text-gray-700">
                          {stat.projectCount}
                        </td>
                        <td className="text-right py-3 px-4">
                          <span className="font-semibold text-blue-700">
                            {stat.totalHours.toFixed(1)}h
                          </span>
                        </td>
                        <td className="text-right py-3 px-4">
                          <span className="font-semibold text-green-700">
                            {formatCurrency(stat.totalRevenue)}
                          </span>
                        </td>
                        <td className="text-right py-3 px-4 text-gray-600">
                          {formatCurrency(stat.totalRevenue / stat.totalHours)}/h
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-blue-300 bg-blue-100/50">
                      <td className="py-3 px-4 font-bold text-gray-900">
                        Celkem
                      </td>
                      <td className="text-right py-3 px-4 font-bold text-gray-900">
                        {userStats.reduce((sum, s) => sum + s.projectCount, 0)}
                      </td>
                      <td className="text-right py-3 px-4 font-bold text-blue-900">
                        {userStats.reduce((sum, s) => sum + s.totalHours, 0).toFixed(1)}h
                      </td>
                      <td className="text-right py-3 px-4 font-bold text-green-900">
                        {formatCurrency(userStats.reduce((sum, s) => sum + s.totalRevenue, 0))}
                      </td>
                      <td className="text-right py-3 px-4 text-gray-600">
                        {formatCurrency(
                          userStats.reduce((sum, s) => sum + s.totalRevenue, 0) /
                          userStats.reduce((sum, s) => sum + s.totalHours, 0)
                        )}/h
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filter Bar */}
        <Card className="mb-6">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <Input
                placeholder="Hledat podle klienta nebo projektu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Select value={filterClient} onValueChange={setFilterClient}>
                <SelectTrigger>
                  <SelectValue placeholder="Všichni klienti" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Všichni klienti</SelectItem>
                  {uniqueClients.map(client => (
                    <SelectItem key={client} value={client}>{client}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as FilterStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="Všechny statusy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Všechny statusy</SelectItem>
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
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Building2 className="h-5 w-5 text-gray-500 flex-shrink-0" />
                        <span className="text-sm font-semibold text-gray-600">
                          {project.clientName}
                        </span>
                        <Badge className={`${statusConfig[project.invoiceStatus].color} flex items-center gap-1`}>
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig[project.invoiceStatus].label}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl mb-2">{project.projectTitle}</CardTitle>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Odpracováno</p>
                          <p className="font-semibold text-gray-900">
                            {project.totalBillableHours.toFixed(1)}h
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Hodinová sazba</p>
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(project.hourlyRate)}/h
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Celková částka</p>
                          <p className="font-semibold text-blue-600 text-lg">
                            {formatCurrency(project.totalAmount)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2">
                      {project.invoiceStatus === 'draft' && (
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                          <FileText className="h-4 w-4 mr-1" />
                          Vygenerovat fakturu
                        </Button>
                      )}
                      {project.invoiceStatus === 'sent' && (
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Označit jako zaplaceno
                        </Button>
                      )}
                      {project.invoiceStatus === 'paid' && (
                        <Button size="sm" variant="outline" className="text-green-600 border-green-300">
                          <Eye className="h-4 w-4 mr-1" />
                          Zobrazit fakturu
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Expand/Collapse Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleProjectExpansion(project.id)}
                    className="w-full mb-3"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-2" />
                        Skrýt rozpis času
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-2" />
                        Zobrazit rozpis času ({project.timeEntries.length} záznamů)
                      </>
                    )}
                  </Button>

                  {/* Time Entry Breakdown */}
                  {isExpanded && (
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <h4 className="font-semibold text-gray-900 mb-3">Rozpis odpracovaného času</h4>
                      <div className="space-y-2">
                        {project.timeEntries.map((entry, index) => (
                          <div
                            key={index}
                            className="bg-white rounded-lg p-3 border border-gray-200"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs text-gray-500">
                                    {new Date(entry.date).toLocaleDateString('cs-CZ', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric',
                                    })}
                                  </span>
                                  <span className="text-xs text-gray-400">•</span>
                                  <span className="text-xs font-semibold text-gray-700">
                                    {entry.userName}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-900 mb-2">{entry.description}</p>
                                {entry.note && (
                                  <p className="text-xs text-gray-600 italic">
                                    Poznámka: {entry.note}
                                  </p>
                                )}
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-sm font-semibold text-gray-900">
                                  {entry.hours.toFixed(1)}h
                                </p>
                                <p className="text-xs text-gray-600">
                                  {formatCurrency(entry.hours * project.hourlyRate)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Summary */}
                      <div className="border-t border-gray-300 pt-3 mt-3">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-900">Celkem:</span>
                          <div className="text-right">
                            <p className="font-bold text-gray-900">
                              {project.totalBillableHours.toFixed(1)}h
                            </p>
                            <p className="text-sm font-semibold text-blue-600">
                              {formatCurrency(project.totalAmount)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Info Box */}
      <Card className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Jak funguje fakturace v aplikaci</h4>
              <p className="text-sm text-gray-700 mb-2">
                Faktury nevystavujete zde - tato stránka slouží jako **přehled** služeb připravených k fakturaci.
              </p>
              <ul className="text-xs text-gray-600 space-y-1 ml-4 list-disc">
                <li><strong>Vystavení faktury:</strong> Faktury vystavujete přímo u úkolů, projektů nebo klientů</li>
                <li><strong>Koncept (nevyfakturováno):</strong> Služba je dokončena a připravena k vyfakturování</li>
                <li><strong>Odesláno:</strong> Faktura vystavena a odeslána klientovi</li>
                <li><strong>Zaplaceno:</strong> Platba přijata a zpracována</li>
                <li><strong>Export do Pohody:</strong> Hromadný export faktur do účetního systému</li>
              </ul>
              <p className="text-xs text-blue-700 mt-3 font-semibold">
                💡 Pro vystavení faktury přejděte na detail úkolu/projektu/klienta
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
