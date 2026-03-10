'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
  FileText,
  Search,
  Download,
  User,
  Building2,
  Settings,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  Plus,
  Eye,
  LogIn,
  LogOut,
  Mail,
  Calendar,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react'

type AuditLogEntry = {
  id: string
  user_id: string | null
  user_name?: string
  action: string
  table_name: string
  record_id: string | null
  old_values: Record<string, any> | null
  new_values: Record<string, any> | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export function SystemAudit() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)

  const [searchQuery, setSearchQuery] = useState('')
  const [filterAction, setFilterAction] = useState<string>('all')
  const [filterDateRange, setFilterDateRange] = useState<string>('all')
  const [expandedLog, setExpandedLog] = useState<string | null>(null)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '20' })
      if (filterAction !== 'all') params.set('action', filterAction)
      if (filterDateRange !== 'all') {
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        if (filterDateRange === 'today') {
          params.set('date_from', today.toISOString())
        } else if (filterDateRange === 'yesterday') {
          const yesterday = new Date(today)
          yesterday.setDate(yesterday.getDate() - 1)
          params.set('date_from', yesterday.toISOString())
          params.set('date_to', today.toISOString())
        } else if (filterDateRange === 'week') {
          const weekAgo = new Date(today)
          weekAgo.setDate(weekAgo.getDate() - 7)
          params.set('date_from', weekAgo.toISOString())
        }
      }

      const res = await fetch(`/api/accountant/admin/audit-logs?${params}`)
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs ?? [])
        setTotal(data.total ?? 0)
        setTotalPages(data.total_pages ?? 0)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [page, filterAction, filterDateRange])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  // Client-side search filter on already fetched logs
  const filteredLogs = useMemo(() => {
    if (!searchQuery) return logs
    const query = searchQuery.toLowerCase()
    return logs.filter(log =>
      (log.action?.toLowerCase().includes(query)) ||
      (log.table_name?.toLowerCase().includes(query)) ||
      (log.user_name?.toLowerCase().includes(query))
    )
  }, [logs, searchQuery])

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString('cs-CZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'INSERT': return Plus
      case 'UPDATE': return Edit2
      case 'DELETE': return Trash2
      case 'LOGIN': return LogIn
      case 'LOGOUT': return LogOut
      case 'EXPORT': return Download
      default: return FileText
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'INSERT': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'UPDATE': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      case 'DELETE': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      case 'LOGIN': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
      case 'LOGOUT': return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
      case 'EXPORT': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  const getActionLabel = (action: string) => {
    const map: Record<string, string> = {
      INSERT: 'Vytvoření',
      UPDATE: 'Úprava',
      DELETE: 'Smazání',
      LOGIN: 'Přihlášení',
      LOGOUT: 'Odhlášení',
      EXPORT: 'Export',
    }
    return map[action] || action
  }

  const getTableIcon = (table: string) => {
    switch (table) {
      case 'companies': return Building2
      case 'users': return User
      case 'settings': return Settings
      case 'messages':
      case 'chat_messages': return Mail
      default: return FileText
    }
  }

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="shadow-soft">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2 flex-1">
              <Search className="h-5 w-5 text-gray-400" />
              <Input
                placeholder="Hledat v lozích..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 h-11"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Typ akce</label>
              <Select value={filterAction} onValueChange={(v) => { setFilterAction(v); setPage(1) }}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Všechny akce</SelectItem>
                  <SelectItem value="INSERT">Vytvoření</SelectItem>
                  <SelectItem value="UPDATE">Úprava</SelectItem>
                  <SelectItem value="DELETE">Smazání</SelectItem>
                  <SelectItem value="LOGIN">Přihlášení</SelectItem>
                  <SelectItem value="LOGOUT">Odhlášení</SelectItem>
                  <SelectItem value="EXPORT">Export</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Období</label>
              <Select value={filterDateRange} onValueChange={(v) => { setFilterDateRange(v); setPage(1) }}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Vše</SelectItem>
                  <SelectItem value="today">Dnes</SelectItem>
                  <SelectItem value="yesterday">Včera</SelectItem>
                  <SelectItem value="week">Posledních 7 dní</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">
            Celkem {total} záznamů{filteredLogs.length !== logs.length && ` (zobrazeno ${filteredLogs.length})`}
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      <Card className="shadow-soft">
        <CardContent className="pt-6">
          <div className="space-y-2">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <p className="font-medium">Žádné záznamy v audit logu</p>
                <p className="text-xs mt-1">Záznamy se vytváří automaticky při akcích v systému</p>
              </div>
            ) : (
              filteredLogs.map((log) => {
                const ActionIcon = getActionIcon(log.action)
                const TableIcon = getTableIcon(log.table_name)
                const isExpanded = expandedLog === log.id

                return (
                  <div
                    key={log.id}
                    className="border border-border/50 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div
                      className="p-4 cursor-pointer"
                      onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${getActionColor(log.action)}`}>
                          <ActionIcon className="h-4 w-4" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {log.user_name || 'Systém'}
                            </span>
                            <span className="text-gray-500 dark:text-gray-400">
                              {getActionLabel(log.action)}
                            </span>
                            {log.table_name && (
                              <>
                                <span className="text-gray-400">•</span>
                                <span className="text-gray-700 dark:text-gray-200 truncate">
                                  {log.table_name}
                                </span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDateTime(log.created_at)}
                            </span>
                            {log.ip_address && <span>IP: {log.ip_address}</span>}
                          </div>
                        </div>

                        <Badge variant="outline" className="flex-shrink-0 rounded-md">
                          <TableIcon className="h-3 w-3 mr-1" />
                          {log.table_name || '-'}
                        </Badge>

                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-border/50 bg-gray-50 dark:bg-gray-800/50">
                        <div className="pt-4 grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">ID záznamu</p>
                            <p className="font-mono text-gray-900 dark:text-white text-xs">{log.id}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">ID entity</p>
                            <p className="font-mono text-gray-900 dark:text-white text-xs">{log.record_id || '-'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">User Agent</p>
                            <p className="text-gray-900 dark:text-white truncate text-xs">{log.user_agent || '-'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">User ID</p>
                            <p className="font-mono text-gray-900 dark:text-white text-xs">{log.user_id || '-'}</p>
                          </div>

                          {log.old_values && Object.keys(log.old_values).length > 0 && (
                            <div className="col-span-2">
                              <p className="text-gray-500 dark:text-gray-400 mb-2">Předchozí hodnoty</p>
                              <pre className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-border/50 text-xs overflow-x-auto">
                                {JSON.stringify(log.old_values, null, 2)}
                              </pre>
                            </div>
                          )}

                          {log.new_values && Object.keys(log.new_values).length > 0 && (
                            <div className="col-span-2">
                              <p className="text-gray-500 dark:text-gray-400 mb-2">Nové hodnoty</p>
                              <pre className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-border/50 text-xs overflow-x-auto">
                                {JSON.stringify(log.new_values, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/50">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Strana {page} z {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
