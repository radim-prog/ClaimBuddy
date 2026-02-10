'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Clock,
  Users,
  Building2,
  Calendar,
  TrendingUp,
  Download,
  Filter,
  ChevronRight,
  Timer,
  Briefcase,
  Phone,
  Mail,
  FileText,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'
import {
  mockUsers,
  TimeLog,
  ActivityType,
} from '@/lib/mock-data'
import Link from 'next/link'

// Helper to format minutes to hours:minutes
function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${mins}m`
}

// Get activity type label
function getActivityLabel(type: ActivityType): string {
  const labels: Record<ActivityType, string> = {
    task: 'Úkoly',
    general: 'Obecná práce',
    admin: 'Administrativa',
    meeting: 'Schůzky',
    call: 'Telefony',
    email: 'Emaily',
  }
  return labels[type]
}

// Get activity type icon
function getActivityIcon(type: ActivityType) {
  const icons: Record<ActivityType, typeof Clock> = {
    task: Briefcase,
    general: Clock,
    admin: FileText,
    meeting: Users,
    call: Phone,
    email: Mail,
  }
  return icons[type]
}

// Get available months from time logs
// TODO: Fetch time logs and companies from Supabase API
const mockTimeLogs: TimeLog[] = []
const mockCompanies: { id: string; name: string }[] = []

function getUserTimeStats(_userId: string, _month?: string) {
  return { totalMinutes: 0, billableMinutes: 0, nonBillableMinutes: 0, taskMinutes: 0, nonTaskMinutes: 0, byActivityType: { task: 0, general: 0, admin: 0, meeting: 0, call: 0, email: 0 } as Record<ActivityType, number> }
}

function getClientTimeStats(_clientId: string, _month?: string) {
  return { totalMinutes: 0, billableMinutes: 0, byUser: [] as { userId: string; userName: string; minutes: number }[], byActivityType: { task: 0, general: 0, admin: 0, meeting: 0, call: 0, email: 0 } as Record<ActivityType, number> }
}

function getAvailableMonths(): string[] {
  const months = new Set<string>()
  mockTimeLogs.forEach(log => {
    if (log.date) {
      const month = log.date.substring(0, 7) // YYYY-MM
      months.add(month)
    }
  })
  const result = Array.from(months).sort().reverse()
  // If no months found, return current month
  if (result.length === 0) {
    return [new Date().toISOString().substring(0, 7)]
  }
  return result
}

export default function TimeReportsPage() {
  const [selectedMonth, setSelectedMonth] = useState<string>(getAvailableMonths()[0] || '2025-12')
  const [viewMode, setViewMode] = useState<'accountants' | 'clients'>('accountants')
  const [selectedAccountant, setSelectedAccountant] = useState<string | null>(null)
  const [selectedClient, setSelectedClient] = useState<string | null>(null)
  const [filterAccountant, setFilterAccountant] = useState<string>('all')
  const [filterClient, setFilterClient] = useState<string>('all')

  // Get all accountants
  const accountants = useMemo(() => {
    return mockUsers.filter(u => u.role === 'accountant' || u.role === 'assistant')
  }, [])

  // Get time stats by accountant
  const accountantStats = useMemo(() => {
    return accountants.map(user => {
      const stats = getUserTimeStats(user.id, selectedMonth)
      return {
        userId: user.id,
        userName: user.name,
        ...stats,
      }
    }).filter(s => s.totalMinutes > 0)
  }, [accountants, selectedMonth])

  // Get time stats by client
  const clientStats = useMemo(() => {
    return mockCompanies.map(company => {
      const stats = getClientTimeStats(company.id, selectedMonth)
      return {
        clientId: company.id,
        clientName: company.name,
        ...stats,
      }
    }).filter(s => s.totalMinutes > 0)
  }, [selectedMonth])

  // Filtered logs for detail view
  const filteredLogs = useMemo(() => {
    let logs = mockTimeLogs.filter(log => log.date && log.date.startsWith(selectedMonth))

    if (filterAccountant !== 'all') {
      logs = logs.filter(log => log.user_id === filterAccountant)
    }
    if (filterClient !== 'all') {
      logs = logs.filter(log => log.client_id === filterClient)
    }

    return logs.sort((a, b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime())
  }, [selectedMonth, filterAccountant, filterClient])

  // Total stats
  const totalStats = useMemo(() => {
    const logs = mockTimeLogs.filter(log => log.date && log.date.startsWith(selectedMonth))
    let totalMinutes = 0
    let billableMinutes = 0
    let taskMinutes = 0
    let nonTaskMinutes = 0

    logs.forEach(log => {
      totalMinutes += log.minutes
      if (log.is_billable) billableMinutes += log.minutes
      if (log.task_id) taskMinutes += log.minutes
      else nonTaskMinutes += log.minutes
    })

    return { totalMinutes, billableMinutes, taskMinutes, nonTaskMinutes }
  }, [selectedMonth])

  // Export to CSV
  const exportToCsv = () => {
    const headers = ['Datum', 'Účetní', 'Klient', 'Typ', 'Popis', 'Minuty', 'Fakturovatelné']
    const rows = filteredLogs.map(log => [
      log.date || '',
      log.user_name,
      log.client_name || '-',
      getActivityLabel(log.activity_type),
      log.description,
      log.minutes.toString(),
      log.is_billable ? 'Ano' : 'Ne',
    ])

    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `time-report-${selectedMonth}.csv`
    link.click()
  }

  const availableMonths = getAvailableMonths()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Clock className="h-7 w-7 text-blue-600" />
            Time Reports
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Přehled odpracovaného času účetních a klientů
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2 text-gray-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableMonths.map(month => (
                <SelectItem key={month} value={month}>
                  {new Date(month + '-01').toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportToCsv}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Celkem odpracováno</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatMinutes(totalStats.totalMinutes)}</p>
              </div>
              <Clock className="h-10 w-10 text-blue-100" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Fakturovatelné</p>
                <p className="text-2xl font-bold text-green-600">{formatMinutes(totalStats.billableMinutes)}</p>
              </div>
              <TrendingUp className="h-10 w-10 text-green-100" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Na úkolech</p>
                <p className="text-2xl font-bold text-blue-600">{formatMinutes(totalStats.taskMinutes)}</p>
              </div>
              <Briefcase className="h-10 w-10 text-blue-100" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Mimo úkoly</p>
                <p className="text-2xl font-bold text-orange-600">{formatMinutes(totalStats.nonTaskMinutes)}</p>
              </div>
              <Timer className="h-10 w-10 text-orange-100" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'accountants' | 'clients')}>
        <TabsList>
          <TabsTrigger value="accountants" className="gap-2">
            <Users className="h-4 w-4" />
            Podle účetních
          </TabsTrigger>
          <TabsTrigger value="clients" className="gap-2">
            <Building2 className="h-4 w-4" />
            Podle klientů
          </TabsTrigger>
        </TabsList>

        {/* By Accountants */}
        <TabsContent value="accountants" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Přehled podle účetních</CardTitle>
              <CardDescription>
                Odpracovaný čas jednotlivých účetních za {new Date(selectedMonth + '-01').toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Účetní</TableHead>
                    <TableHead className="text-right">Celkem</TableHead>
                    <TableHead className="text-right">Na úkolech</TableHead>
                    <TableHead className="text-right">Mimo úkoly</TableHead>
                    <TableHead className="text-right">Fakturovatelné</TableHead>
                    <TableHead className="text-right">Využití</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accountantStats.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-500 dark:text-gray-400 py-8">
                        Žádné záznamy pro vybraný měsíc
                      </TableCell>
                    </TableRow>
                  ) : (
                    accountantStats.map(stat => {
                      const utilizationPercent = stat.totalMinutes > 0
                        ? Math.round((stat.billableMinutes / stat.totalMinutes) * 100)
                        : 0

                      return (
                        <TableRow key={stat.userId} className="hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-800/50">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                                {stat.userName.split(' ').map(n => n[0]).join('')}
                              </div>
                              <span className="font-medium">{stat.userName}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatMinutes(stat.totalMinutes)}
                          </TableCell>
                          <TableCell className="text-right text-blue-600">
                            {formatMinutes(stat.taskMinutes)}
                          </TableCell>
                          <TableCell className="text-right text-orange-600">
                            {formatMinutes(stat.nonTaskMinutes)}
                          </TableCell>
                          <TableCell className="text-right text-green-600">
                            {formatMinutes(stat.billableMinutes)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge
                              variant="secondary"
                              className={
                                utilizationPercent >= 80 ? 'bg-green-100 text-green-700' :
                                utilizationPercent >= 60 ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }
                            >
                              {utilizationPercent}%
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedAccountant(stat.userId)}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* By Clients */}
        <TabsContent value="clients" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Přehled podle klientů</CardTitle>
              <CardDescription>
                Čas strávený na jednotlivých klientech za {new Date(selectedMonth + '-01').toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Klient</TableHead>
                    <TableHead className="text-right">Celkem</TableHead>
                    <TableHead className="text-right">Fakturovatelné</TableHead>
                    <TableHead className="text-right">Extra čas</TableHead>
                    <TableHead>Účetní</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientStats.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500 dark:text-gray-400 py-8">
                        Žádné záznamy pro vybraný měsíc
                      </TableCell>
                    </TableRow>
                  ) : (
                    clientStats.map(stat => {
                      const extraMinutes = stat.totalMinutes - stat.billableMinutes
                      const hasHighExtra = extraMinutes > 60 // More than 1 hour extra

                      return (
                        <TableRow key={stat.clientId} className="hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-800/50">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-5 w-5 text-gray-400" />
                              <span className="font-medium">{stat.clientName}</span>
                              {hasHighExtra && (
                                <span title="Vysoký extra čas">
                                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatMinutes(stat.totalMinutes)}
                          </TableCell>
                          <TableCell className="text-right text-green-600">
                            {formatMinutes(stat.billableMinutes)}
                          </TableCell>
                          <TableCell className="text-right">
                            {extraMinutes > 0 ? (
                              <span className="text-orange-600">{formatMinutes(extraMinutes)}</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {stat.byUser.slice(0, 3).map(u => (
                                <Badge key={u.userId} variant="secondary" className="text-xs">
                                  {u.userName.split(' ')[0]}
                                </Badge>
                              ))}
                              {stat.byUser.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{stat.byUser.length - 3}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedClient(stat.clientId)}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detailed Log Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Detailní záznamy</CardTitle>
              <CardDescription>
                Všechny záznamy času za vybraný měsíc
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={filterAccountant} onValueChange={setFilterAccountant}>
                <SelectTrigger className="w-[180px]">
                  <Users className="h-4 w-4 mr-2 text-gray-400" />
                  <SelectValue placeholder="Všichni účetní" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Všichni účetní</SelectItem>
                  {accountants.map(user => (
                    <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterClient} onValueChange={setFilterClient}>
                <SelectTrigger className="w-[180px]">
                  <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                  <SelectValue placeholder="Všichni klienti" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Všichni klienti</SelectItem>
                  {mockCompanies.slice(0, 20).map(company => (
                    <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datum</TableHead>
                <TableHead>Účetní</TableHead>
                <TableHead>Klient</TableHead>
                <TableHead>Typ</TableHead>
                <TableHead>Popis</TableHead>
                <TableHead className="text-right">Čas</TableHead>
                <TableHead className="text-center">Faktur.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 dark:text-gray-400 py-8">
                    Žádné záznamy pro vybrané filtry
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map(log => {
                  const Icon = getActivityIcon(log.activity_type)
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="text-gray-600 dark:text-gray-300">
                        {log.date ? new Date(log.date).toLocaleDateString('cs-CZ') : '-'}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{log.user_name}</span>
                      </TableCell>
                      <TableCell>
                        {log.client_name || <span className="text-gray-400">-</span>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          <Icon className="h-3 w-3" />
                          {getActivityLabel(log.activity_type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate" title={log.description}>
                        {log.description}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatMinutes(log.minutes)}
                      </TableCell>
                      <TableCell className="text-center">
                        {log.is_billable ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Accountant Detail Dialog */}
      <Dialog open={!!selectedAccountant} onOpenChange={() => setSelectedAccountant(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Detail účetního - {accountantStats.find(s => s.userId === selectedAccountant)?.userName}
            </DialogTitle>
            <DialogDescription>
              Rozpis odpracovaného času za {new Date(selectedMonth + '-01').toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' })}
            </DialogDescription>
          </DialogHeader>
          {selectedAccountant && (() => {
            const stat = accountantStats.find(s => s.userId === selectedAccountant)
            if (!stat) return null

            return (
              <div className="space-y-4">
                {/* Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-600">Celkem</p>
                    <p className="text-xl font-bold text-blue-700">{formatMinutes(stat.totalMinutes)}</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-600">Fakturovatelné</p>
                    <p className="text-xl font-bold text-green-700">{formatMinutes(stat.billableMinutes)}</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <p className="text-sm text-orange-600">Nefakturovatelné</p>
                    <p className="text-xl font-bold text-orange-700">{formatMinutes(stat.nonBillableMinutes)}</p>
                  </div>
                </div>

                {/* By activity type */}
                <div>
                  <h4 className="font-semibold mb-2">Podle typu aktivity</h4>
                  <div className="space-y-2">
                    {Object.entries(stat.byActivityType)
                      .filter(([_, minutes]) => minutes > 0)
                      .sort((a, b) => b[1] - a[1])
                      .map(([type, minutes]) => {
                        const Icon = getActivityIcon(type as ActivityType)
                        const percent = Math.round((minutes / stat.totalMinutes) * 100)
                        return (
                          <div key={type} className="flex items-center gap-3">
                            <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            <span className="w-24 text-sm">{getActivityLabel(type as ActivityType)}</span>
                            <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-blue-500 rounded-full h-2"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium w-16 text-right">{formatMinutes(minutes)}</span>
                          </div>
                        )
                      })}
                  </div>
                </div>

                {/* Recent logs */}
                <div>
                  <h4 className="font-semibold mb-2">Poslední záznamy</h4>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {mockTimeLogs
                      .filter(log => log.user_id === selectedAccountant && log.date && log.date.startsWith(selectedMonth))
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .slice(0, 10)
                      .map(log => (
                        <div key={log.id} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800/50 rounded text-sm">
                          <span className="text-gray-500 dark:text-gray-400 w-20">{log.date ? new Date(log.date).toLocaleDateString('cs-CZ') : '-'}</span>
                          <span className="flex-1 truncate">{log.description}</span>
                          <span className="font-medium">{formatMinutes(log.minutes)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>

      {/* Client Detail Dialog */}
      <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Detail klienta - {clientStats.find(s => s.clientId === selectedClient)?.clientName}
            </DialogTitle>
            <DialogDescription>
              Strávený čas za {new Date(selectedMonth + '-01').toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' })}
            </DialogDescription>
          </DialogHeader>
          {selectedClient && (() => {
            const stat = clientStats.find(s => s.clientId === selectedClient)
            if (!stat) return null

            return (
              <div className="space-y-4">
                {/* Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-600">Celkem</p>
                    <p className="text-xl font-bold text-blue-700">{formatMinutes(stat.totalMinutes)}</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-600">Fakturovatelné</p>
                    <p className="text-xl font-bold text-green-700">{formatMinutes(stat.billableMinutes)}</p>
                  </div>
                </div>

                {/* By accountant */}
                <div>
                  <h4 className="font-semibold mb-2">Podle účetního</h4>
                  <div className="space-y-2">
                    {stat.byUser.map(user => {
                      const percent = Math.round((user.minutes / stat.totalMinutes) * 100)
                      return (
                        <div key={user.userId} className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-xs">
                            {user.userName.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className="w-32 text-sm">{user.userName}</span>
                          <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-blue-500 rounded-full h-2"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-16 text-right">{formatMinutes(user.minutes)}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* By activity type */}
                <div>
                  <h4 className="font-semibold mb-2">Podle typu aktivity</h4>
                  <div className="space-y-2">
                    {Object.entries(stat.byActivityType)
                      .filter(([_, minutes]) => minutes > 0)
                      .sort((a, b) => b[1] - a[1])
                      .map(([type, minutes]) => {
                        const Icon = getActivityIcon(type as ActivityType)
                        const percent = Math.round((minutes / stat.totalMinutes) * 100)
                        return (
                          <div key={type} className="flex items-center gap-3">
                            <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            <span className="w-24 text-sm">{getActivityLabel(type as ActivityType)}</span>
                            <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-green-500 rounded-full h-2"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium w-16 text-right">{formatMinutes(minutes)}</span>
                          </div>
                        )
                      })}
                  </div>
                </div>
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}
