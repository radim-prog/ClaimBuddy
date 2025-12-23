'use client'

import { useState, useMemo } from 'react'
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
  Filter,
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
} from 'lucide-react'

type AuditLogEntry = {
  id: string
  timestamp: string
  user_id: string
  user_name: string
  user_email: string
  action: string
  action_type: 'create' | 'update' | 'delete' | 'view' | 'export' | 'login' | 'logout' | 'approve' | 'reject' | 'send'
  entity_type: 'company' | 'closure' | 'document' | 'user' | 'settings' | 'message' | 'task' | 'session'
  entity_id: string
  entity_name: string
  ip_address: string
  user_agent: string
  changes?: {
    field: string
    old_value: string
    new_value: string
  }[]
  metadata?: Record<string, any>
}

// Mock audit logs
const mockAuditLogs: AuditLogEntry[] = [
  {
    id: 'log-1',
    timestamp: '2025-12-23T10:30:15Z',
    user_id: 'user-1',
    user_name: 'Jana Svobodová',
    user_email: 'jana@ucetni.cz',
    action: 'Schválila uzávěrku',
    action_type: 'approve',
    entity_type: 'closure',
    entity_id: 'closure-123',
    entity_name: 'Horák s.r.o. - Prosinec 2025',
    ip_address: '192.168.1.100',
    user_agent: 'Chrome/120.0.0.0',
  },
  {
    id: 'log-2',
    timestamp: '2025-12-23T10:15:42Z',
    user_id: 'user-2',
    user_name: 'Marie Účetní',
    user_email: 'marie@ucetni.cz',
    action: 'Přidala zprávu',
    action_type: 'create',
    entity_type: 'message',
    entity_id: 'msg-456',
    entity_name: 'TechStart s.r.o.',
    ip_address: '192.168.1.101',
    user_agent: 'Firefox/121.0',
  },
  {
    id: 'log-3',
    timestamp: '2025-12-23T09:45:00Z',
    user_id: 'user-admin',
    user_name: 'Radim',
    user_email: 'radim@ucetni.cz',
    action: 'Exportoval data klienta',
    action_type: 'export',
    entity_type: 'company',
    entity_id: 'company-789',
    entity_name: 'ABC Company a.s.',
    ip_address: '192.168.1.1',
    user_agent: 'Chrome/120.0.0.0',
    metadata: {
      export_format: 'ZIP',
      file_size: '15.2 MB',
      includes: ['dokumenty', 'uzávěrky', 'zprávy'],
    },
  },
  {
    id: 'log-4',
    timestamp: '2025-12-23T09:30:22Z',
    user_id: 'user-1',
    user_name: 'Jana Svobodová',
    user_email: 'jana@ucetni.cz',
    action: 'Upravila nastavení',
    action_type: 'update',
    entity_type: 'settings',
    entity_id: 'pricing',
    entity_name: 'Ceník služeb',
    ip_address: '192.168.1.100',
    user_agent: 'Chrome/120.0.0.0',
    changes: [
      { field: 'hourlyRate.standard', old_value: '800', new_value: '850' },
      { field: 'hourlyRate.expert', old_value: '1200', new_value: '1300' },
    ],
  },
  {
    id: 'log-5',
    timestamp: '2025-12-23T08:00:00Z',
    user_id: 'user-2',
    user_name: 'Marie Účetní',
    user_email: 'marie@ucetni.cz',
    action: 'Přihlásila se',
    action_type: 'login',
    entity_type: 'session',
    entity_id: 'session-abc',
    entity_name: '',
    ip_address: '192.168.1.101',
    user_agent: 'Firefox/121.0',
  },
  {
    id: 'log-6',
    timestamp: '2025-12-22T17:30:00Z',
    user_id: 'user-1',
    user_name: 'Jana Svobodová',
    user_email: 'jana@ucetni.cz',
    action: 'Odhlásila se',
    action_type: 'logout',
    entity_type: 'session',
    entity_id: 'session-def',
    entity_name: '',
    ip_address: '192.168.1.100',
    user_agent: 'Chrome/120.0.0.0',
  },
  {
    id: 'log-7',
    timestamp: '2025-12-22T16:45:30Z',
    user_id: 'user-1',
    user_name: 'Jana Svobodová',
    user_email: 'jana@ucetni.cz',
    action: 'Vytvořila úkol',
    action_type: 'create',
    entity_type: 'task',
    entity_id: 'task-111',
    entity_name: 'Kontrola DPH - Horák s.r.o.',
    ip_address: '192.168.1.100',
    user_agent: 'Chrome/120.0.0.0',
  },
  {
    id: 'log-8',
    timestamp: '2025-12-22T15:20:00Z',
    user_id: 'user-admin',
    user_name: 'Radim',
    user_email: 'radim@ucetni.cz',
    action: 'Přidal uživatele',
    action_type: 'create',
    entity_type: 'user',
    entity_id: 'user-new',
    entity_name: 'Petr Asistent',
    ip_address: '192.168.1.1',
    user_agent: 'Chrome/120.0.0.0',
  },
  {
    id: 'log-9',
    timestamp: '2025-12-22T14:00:00Z',
    user_id: 'user-2',
    user_name: 'Marie Účetní',
    user_email: 'marie@ucetni.cz',
    action: 'Zamítla dokument',
    action_type: 'reject',
    entity_type: 'document',
    entity_id: 'doc-222',
    entity_name: 'Faktura 2025-0123',
    ip_address: '192.168.1.101',
    user_agent: 'Firefox/121.0',
    metadata: {
      reason: 'Chybějící podpis',
    },
  },
  {
    id: 'log-10',
    timestamp: '2025-12-22T11:30:00Z',
    user_id: 'user-1',
    user_name: 'Jana Svobodová',
    user_email: 'jana@ucetni.cz',
    action: 'Zobrazila detail klienta',
    action_type: 'view',
    entity_type: 'company',
    entity_id: 'company-11',
    entity_name: 'Horák s.r.o.',
    ip_address: '192.168.1.100',
    user_agent: 'Chrome/120.0.0.0',
  },
]

export default function AuditLogsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterUser, setFilterUser] = useState<string>('all')
  const [filterActionType, setFilterActionType] = useState<string>('all')
  const [filterEntityType, setFilterEntityType] = useState<string>('all')
  const [filterDateRange, setFilterDateRange] = useState<string>('all')
  const [expandedLog, setExpandedLog] = useState<string | null>(null)

  // Get unique users for filter
  const uniqueUsers = useMemo(() => {
    return Array.from(new Set(mockAuditLogs.map(log => log.user_name))).sort()
  }, [])

  // Filter logs
  const filteredLogs = useMemo(() => {
    return mockAuditLogs.filter(log => {
      // Search
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (!log.action.toLowerCase().includes(query) &&
            !log.entity_name.toLowerCase().includes(query) &&
            !log.user_name.toLowerCase().includes(query)) {
          return false
        }
      }

      // User filter
      if (filterUser !== 'all' && log.user_name !== filterUser) return false

      // Action type filter
      if (filterActionType !== 'all' && log.action_type !== filterActionType) return false

      // Entity type filter
      if (filterEntityType !== 'all' && log.entity_type !== filterEntityType) return false

      // Date range filter
      if (filterDateRange !== 'all') {
        const logDate = new Date(log.timestamp)
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

        if (filterDateRange === 'today') {
          if (logDate < today) return false
        } else if (filterDateRange === 'yesterday') {
          const yesterday = new Date(today)
          yesterday.setDate(yesterday.getDate() - 1)
          if (logDate < yesterday || logDate >= today) return false
        } else if (filterDateRange === 'week') {
          const weekAgo = new Date(today)
          weekAgo.setDate(weekAgo.getDate() - 7)
          if (logDate < weekAgo) return false
        }
      }

      return true
    })
  }, [searchQuery, filterUser, filterActionType, filterEntityType, filterDateRange])

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

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'create': return Plus
      case 'update': return Edit2
      case 'delete': return Trash2
      case 'view': return Eye
      case 'export': return Download
      case 'login': return LogIn
      case 'logout': return LogOut
      case 'approve': return CheckCircle2
      case 'reject': return XCircle
      case 'send': return Mail
      default: return FileText
    }
  }

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'create': return 'bg-green-100 text-green-700'
      case 'update': return 'bg-blue-100 text-blue-700'
      case 'delete': return 'bg-red-100 text-red-700'
      case 'view': return 'bg-gray-100 text-gray-700'
      case 'export': return 'bg-orange-100 text-orange-700'
      case 'login': return 'bg-purple-100 text-purple-700'
      case 'logout': return 'bg-gray-100 text-gray-600'
      case 'approve': return 'bg-green-100 text-green-700'
      case 'reject': return 'bg-red-100 text-red-700'
      case 'send': return 'bg-blue-100 text-blue-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'company': return Building2
      case 'user': return User
      case 'settings': return Settings
      case 'message': return Mail
      case 'task': return FileText
      default: return FileText
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit logy</h1>
          <p className="text-gray-600">Historie všech akcí v systému</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export logů
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2 flex-1">
              <Search className="h-5 w-5 text-gray-400" />
              <Input
                placeholder="Hledat v lozích..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Uživatel</label>
              <Select value={filterUser} onValueChange={setFilterUser}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Všichni uživatelé</SelectItem>
                  {uniqueUsers.map(user => (
                    <SelectItem key={user} value={user}>{user}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">Typ akce</label>
              <Select value={filterActionType} onValueChange={setFilterActionType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Všechny akce</SelectItem>
                  <SelectItem value="create">Vytvoření</SelectItem>
                  <SelectItem value="update">Úprava</SelectItem>
                  <SelectItem value="delete">Smazání</SelectItem>
                  <SelectItem value="view">Zobrazení</SelectItem>
                  <SelectItem value="export">Export</SelectItem>
                  <SelectItem value="approve">Schválení</SelectItem>
                  <SelectItem value="reject">Zamítnutí</SelectItem>
                  <SelectItem value="login">Přihlášení</SelectItem>
                  <SelectItem value="logout">Odhlášení</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">Typ entity</label>
              <Select value={filterEntityType} onValueChange={setFilterEntityType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Všechny entity</SelectItem>
                  <SelectItem value="company">Klient</SelectItem>
                  <SelectItem value="closure">Uzávěrka</SelectItem>
                  <SelectItem value="document">Dokument</SelectItem>
                  <SelectItem value="message">Zpráva</SelectItem>
                  <SelectItem value="task">Úkol</SelectItem>
                  <SelectItem value="user">Uživatel</SelectItem>
                  <SelectItem value="settings">Nastavení</SelectItem>
                  <SelectItem value="session">Session</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">Období</label>
              <Select value={filterDateRange} onValueChange={setFilterDateRange}>
                <SelectTrigger>
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

          <div className="mt-4 text-sm text-gray-600">
            Zobrazeno {filteredLogs.length} z {mockAuditLogs.length} záznamů
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Žádné logy odpovídající filtrům</p>
              </div>
            ) : (
              filteredLogs.map((log) => {
                const ActionIcon = getActionIcon(log.action_type)
                const EntityIcon = getEntityIcon(log.entity_type)
                const isExpanded = expandedLog === log.id

                return (
                  <div
                    key={log.id}
                    className="border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className="p-4 cursor-pointer"
                      onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                    >
                      <div className="flex items-center gap-4">
                        {/* Action Icon */}
                        <div className={`p-2 rounded-lg ${getActionColor(log.action_type)}`}>
                          <ActionIcon className="h-4 w-4" />
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-gray-900">{log.user_name}</span>
                            <span className="text-gray-500">{log.action}</span>
                            {log.entity_name && (
                              <>
                                <span className="text-gray-400">•</span>
                                <span className="text-gray-700 truncate">{log.entity_name}</span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDateTime(log.timestamp)}
                            </span>
                            <span>IP: {log.ip_address}</span>
                          </div>
                        </div>

                        {/* Entity Type Badge */}
                        <Badge variant="outline" className="flex-shrink-0">
                          <EntityIcon className="h-3 w-3 mr-1" />
                          {log.entity_type}
                        </Badge>

                        {/* Expand Icon */}
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t bg-gray-50">
                        <div className="pt-4 grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">ID záznamu</p>
                            <p className="font-mono text-gray-900">{log.id}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Email uživatele</p>
                            <p className="text-gray-900">{log.user_email}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">ID entity</p>
                            <p className="font-mono text-gray-900">{log.entity_id}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">User Agent</p>
                            <p className="text-gray-900 truncate">{log.user_agent}</p>
                          </div>

                          {/* Changes */}
                          {log.changes && log.changes.length > 0 && (
                            <div className="col-span-2">
                              <p className="text-gray-500 mb-2">Změny</p>
                              <div className="bg-white rounded-lg p-3 border space-y-2">
                                {log.changes.map((change, idx) => (
                                  <div key={idx} className="flex items-center gap-2 text-sm">
                                    <span className="font-mono text-gray-600">{change.field}:</span>
                                    <span className="text-red-600 line-through">{change.old_value}</span>
                                    <span className="text-gray-400">→</span>
                                    <span className="text-green-600">{change.new_value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Metadata */}
                          {log.metadata && (
                            <div className="col-span-2">
                              <p className="text-gray-500 mb-2">Metadata</p>
                              <pre className="bg-white rounded-lg p-3 border text-xs overflow-x-auto">
                                {JSON.stringify(log.metadata, null, 2)}
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
        </CardContent>
      </Card>
    </div>
  )
}
