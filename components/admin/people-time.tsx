'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
  Clock,
  Users,
  Building2,
  Calendar,
  TrendingUp,
  Download,
  Timer,
  Briefcase,
  CheckCircle2,
  Loader2,
  Wallet,
} from 'lucide-react'

type TimeLogEntry = {
  id: string
  company_id: string | null
  user_id: string | null
  user_name: string | null
  date: string | null
  hours: number
  minutes: number
  description: string | null
  task_title: string | null
  note: string | null
  billable: boolean
  hourly_rate: number | null
  company_name: string | null
  created_at: string
}

type ApiSummary = {
  total_entries: number
  total_hours: number
  total_minutes: number
}

type UserCompensation = {
  id: string
  name: string
  compensation_type: 'hourly' | 'monthly'
  compensation_amount: number
}

function formatHoursMinutes(hours: number, minutes: number): string {
  return `${hours}h ${minutes}m`
}

export function PeopleTime() {
  const [logs, setLogs] = useState<TimeLogEntry[]>([])
  const [summary, setSummary] = useState<ApiSummary>({ total_entries: 0, total_hours: 0, total_minutes: 0 })
  const [loading, setLoading] = useState(true)
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([])
  const [users, setUsers] = useState<{ id: string; name: string }[]>([])
  const [userCompensations, setUserCompensations] = useState<UserCompensation[]>([])

  const [filterUser, setFilterUser] = useState<string>('all')
  const [filterCompany, setFilterCompany] = useState<string>('all')
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  const monthOptions = useMemo(() => {
    const months: string[] = []
    const now = new Date()
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    }
    return months
  }, [])

  // Fetch users (with compensation) and companies on mount
  useEffect(() => {
    fetch('/api/accountant/users')
      .then(r => r.json())
      .then(data => {
        const allUsers = data.users ?? []
        setUsers(allUsers.map((u: any) => ({ id: u.id, name: u.name || u.full_name || 'Neznámý' })))
        setUserCompensations(allUsers.map((u: any) => ({
          id: u.id,
          name: u.name || 'Neznámý',
          compensation_type: u.compensation_type || 'hourly',
          compensation_amount: Number(u.compensation_amount) || 0,
        })))
      })
      .catch(() => {})

    fetch('/api/accountant/admin/companies')
      .then(r => r.json())
      .then(data => setCompanies(data.companies ?? []))
      .catch(() => {})
  }, [])

  // Fetch time logs
  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      const dateFrom = `${selectedMonth}-01`
      const [year, month] = selectedMonth.split('-').map(Number)
      const lastDay = new Date(year, month, 0).getDate()
      const dateTo = `${selectedMonth}-${String(lastDay).padStart(2, '0')}`
      params.set('date_from', dateFrom)
      params.set('date_to', dateTo)

      if (filterUser !== 'all') params.set('user_id', filterUser)
      if (filterCompany !== 'all') params.set('company_id', filterCompany)

      const res = await fetch(`/api/accountant/admin/time-logs?${params}`)
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs ?? [])
        setSummary(data.summary ?? { total_entries: 0, total_hours: 0, total_minutes: 0 })
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [selectedMonth, filterUser, filterCompany])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  // Compensation map for quick lookup
  const compensationMap = useMemo(() => {
    const map = new Map<string, UserCompensation>()
    userCompensations.forEach(u => map.set(u.id, u))
    return map
  }, [userCompensations])

  // Compute stats by user (with compensation)
  const statsByUser = useMemo(() => {
    const map = new Map<string, { userName: string; totalMinutes: number; billableMinutes: number; entries: number }>()
    logs.forEach(log => {
      const key = log.user_id || 'unknown'
      const existing = map.get(key) || { userName: log.user_name || 'Neznámý', totalMinutes: 0, billableMinutes: 0, entries: 0 }
      const mins = (log.hours || 0) * 60 + (log.minutes || 0)
      existing.totalMinutes += mins
      if (log.billable) existing.billableMinutes += mins
      existing.entries += 1
      map.set(key, existing)
    })
    return Array.from(map.entries()).map(([userId, stats]) => {
      const comp = compensationMap.get(userId)
      const estimatedPay = comp
        ? comp.compensation_type === 'hourly'
          ? (stats.totalMinutes / 60) * comp.compensation_amount
          : comp.compensation_amount
        : 0
      return { userId, ...stats, compensation: comp, estimatedPay }
    }).sort((a, b) => b.totalMinutes - a.totalMinutes)
  }, [logs, compensationMap])

  // Compute stats by company
  const statsByCompany = useMemo(() => {
    const map = new Map<string, { companyName: string; totalMinutes: number; billableMinutes: number; entries: number }>()
    logs.filter(l => l.company_id).forEach(log => {
      const key = log.company_id!
      const existing = map.get(key) || { companyName: log.company_name || 'Neznámý', totalMinutes: 0, billableMinutes: 0, entries: 0 }
      const mins = (log.hours || 0) * 60 + (log.minutes || 0)
      existing.totalMinutes += mins
      if (log.billable) existing.billableMinutes += mins
      existing.entries += 1
      map.set(key, existing)
    })
    return Array.from(map.entries()).map(([companyId, stats]) => ({ companyId, ...stats })).sort((a, b) => b.totalMinutes - a.totalMinutes)
  }, [logs])

  const totalMinutesAll = logs.reduce((sum, l) => sum + (l.hours || 0) * 60 + (l.minutes || 0), 0)
  const billableMinutesAll = logs.filter(l => l.billable).reduce((sum, l) => sum + (l.hours || 0) * 60 + (l.minutes || 0), 0)
  const totalEstimatedCost = statsByUser.reduce((sum, s) => sum + s.estimatedPay, 0)

  const fmtMin = (m: number) => `${Math.floor(m / 60)}h ${m % 60}m`
  const fmtKc = (n: number) => Math.round(n).toLocaleString('cs-CZ') + ' Kč'

  const exportToCsv = () => {
    const headers = ['Datum', 'Uživatel', 'Klient', 'Popis', 'Hodiny', 'Minuty', 'Fakturovatelné']
    const rows = logs.map(log => [
      log.date || '',
      log.user_name || '-',
      log.company_name || '-',
      log.description || '',
      String(log.hours || 0),
      String(log.minutes || 0),
      log.billable ? 'Ano' : 'Ne',
    ])
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `time-report-${selectedMonth}.csv`
    link.click()
  }

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <>
      {/* Month selector and export */}
      <div className="flex items-center gap-3 justify-end">
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[180px]">
            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map(month => (
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

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Celkem odpracováno</p>
                <p className="text-2xl font-bold font-display text-gray-900 dark:text-white">{fmtMin(totalMinutesAll)}</p>
              </div>
              <Clock className="h-10 w-10 text-blue-100 dark:text-blue-900/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Fakturovatelné</p>
                <p className="text-2xl font-bold font-display text-green-600">{fmtMin(billableMinutesAll)}</p>
              </div>
              <TrendingUp className="h-10 w-10 text-green-100 dark:text-green-900/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Záznamy</p>
                <p className="text-2xl font-bold font-display text-blue-600">{summary.total_entries}</p>
              </div>
              <Briefcase className="h-10 w-10 text-blue-100 dark:text-blue-900/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Nefakturovatelné</p>
                <p className="text-2xl font-bold font-display text-orange-600">{fmtMin(totalMinutesAll - billableMinutesAll)}</p>
              </div>
              <Timer className="h-10 w-10 text-orange-100 dark:text-orange-900/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Celkové náklady</p>
                <p className="text-2xl font-bold font-display text-purple-600">{fmtKc(totalEstimatedCost)}</p>
              </div>
              <Wallet className="h-10 w-10 text-purple-100 dark:text-purple-900/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* By User - with compensation columns */}
      {statsByUser.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display">
              <Users className="h-5 w-5" />
              Podle účetních
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Účetní</TableHead>
                  <TableHead className="text-right">Celkem</TableHead>
                  <TableHead className="text-right">Fakturovatelné</TableHead>
                  <TableHead className="text-right">Využití</TableHead>
                  <TableHead className="text-right">Sazba</TableHead>
                  <TableHead className="text-right">Odhadovaná odměna</TableHead>
                  <TableHead className="text-right">Záznamy</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statsByUser.map(stat => {
                  const utilPct = stat.totalMinutes > 0 ? Math.round((stat.billableMinutes / stat.totalMinutes) * 100) : 0
                  const comp = stat.compensation
                  return (
                    <TableRow key={stat.userId}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                            {stat.userName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">{stat.userName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-gray-900 dark:text-white">{fmtMin(stat.totalMinutes)}</TableCell>
                      <TableCell className="text-right text-green-600">{fmtMin(stat.billableMinutes)}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary" className={
                          utilPct >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          utilPct >= 60 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }>
                          {utilPct}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-gray-500">
                        {comp && comp.compensation_amount > 0
                          ? `${comp.compensation_amount.toLocaleString('cs-CZ')} Kč${comp.compensation_type === 'hourly' ? '/h' : '/měs'}`
                          : '-'
                        }
                      </TableCell>
                      <TableCell className="text-right font-semibold text-purple-600">
                        {stat.estimatedPay > 0 ? fmtKc(stat.estimatedPay) : '-'}
                      </TableCell>
                      <TableCell className="text-right text-gray-600 dark:text-gray-300">{stat.entries}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* By Company */}
      {statsByCompany.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display">
              <Building2 className="h-5 w-5" />
              Podle klientů
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Klient</TableHead>
                  <TableHead className="text-right">Celkem</TableHead>
                  <TableHead className="text-right">Fakturovatelné</TableHead>
                  <TableHead className="text-right">Záznamy</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statsByCompany.map(stat => (
                  <TableRow key={stat.companyId}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-gray-400" />
                        <span className="font-medium text-gray-900 dark:text-white">{stat.companyName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-gray-900 dark:text-white">{fmtMin(stat.totalMinutes)}</TableCell>
                    <TableCell className="text-right text-green-600">{fmtMin(stat.billableMinutes)}</TableCell>
                    <TableCell className="text-right text-gray-600 dark:text-gray-300">{stat.entries}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Detailed Records */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-display">Detailní záznamy</CardTitle>
              <CardDescription>Všechny záznamy za vybraný měsíc</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={filterUser} onValueChange={setFilterUser}>
                <SelectTrigger className="w-[180px]">
                  <Users className="h-4 w-4 mr-2 text-gray-400" />
                  <SelectValue placeholder="Všichni" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Všichni účetní</SelectItem>
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterCompany} onValueChange={setFilterCompany}>
                <SelectTrigger className="w-[180px]">
                  <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                  <SelectValue placeholder="Všichni" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Všichni klienti</SelectItem>
                  {companies.slice(0, 30).map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
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
                <TableHead>Uživatel</TableHead>
                <TableHead>Klient</TableHead>
                <TableHead>Popis</TableHead>
                <TableHead className="text-right">Čas</TableHead>
                <TableHead className="text-center">Faktur.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500 dark:text-gray-400 py-8">
                    Žádné záznamy pro vybraný měsíc a filtry
                  </TableCell>
                </TableRow>
              ) : (
                logs.map(log => (
                  <TableRow key={log.id}>
                    <TableCell className="text-gray-600 dark:text-gray-300">
                      {log.date ? new Date(log.date).toLocaleDateString('cs-CZ') : '-'}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-gray-900 dark:text-white">{log.user_name || '-'}</span>
                    </TableCell>
                    <TableCell className="text-gray-700 dark:text-gray-200">
                      {log.company_name || <span className="text-gray-400">-</span>}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-gray-700 dark:text-gray-200" title={log.description || ''}>
                      {log.description || log.task_title || '-'}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-gray-900 dark:text-white">
                      {formatHoursMinutes(log.hours || 0, log.minutes || 0)}
                    </TableCell>
                    <TableCell className="text-center">
                      {log.billable ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )
}
