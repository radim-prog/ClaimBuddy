'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Users,
  Activity,
  Clock,
  LogIn,
  LogOut,
  Eye,
  FileText,
  Calendar,
  TrendingUp,
  User,
  Search,
  Loader2,
  Edit2,
  Plus,
  Trash2,
  Download,
} from 'lucide-react'

type UserData = {
  id: string
  name: string
  email: string
  role: string
  last_login_at: string | null
  created_at: string
}

type AuditEntry = {
  id: string
  user_id: string | null
  user_name?: string
  action: string
  table_name: string
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export default function UserActivityPage() {
  const [apiUsers, setApiUsers] = useState<UserData[]>([])
  const [recentActivity, setRecentActivity] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const [usersRes, activityRes] = await Promise.all([
          fetch('/api/accountant/users'),
          fetch('/api/accountant/admin/audit-logs?limit=50'),
        ])
        if (usersRes.ok) {
          const data = await usersRes.json()
          setApiUsers((data.users ?? []).map((u: any) => ({
            id: u.id,
            name: u.name || u.full_name || 'Neznámý',
            email: u.email || '',
            role: u.role || 'user',
            last_login_at: u.last_login_at || null,
            created_at: u.created_at || '',
          })))
        }
        if (activityRes.ok) {
          const data = await activityRes.json()
          setRecentActivity(data.logs ?? [])
        }
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Determine "online" status based on last_login_at (within last 2 hours)
  const usersWithStatus = useMemo(() => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    return apiUsers.map(user => ({
      ...user,
      isOnline: !!(user.last_login_at && user.last_login_at >= twoHoursAgo),
      avatar: user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
    }))
  }, [apiUsers])

  // Activity stats per user
  const userActivityStats = useMemo(() => {
    const map = new Map<string, { actions: number; lastAction: string | null }>()
    recentActivity.forEach(entry => {
      if (!entry.user_id) return
      const existing = map.get(entry.user_id) || { actions: 0, lastAction: null }
      existing.actions += 1
      if (!existing.lastAction || entry.created_at > existing.lastAction) {
        existing.lastAction = entry.created_at
      }
      map.set(entry.user_id, existing)
    })
    return map
  }, [recentActivity])

  // Activity by action type
  const activityByAction = useMemo(() => {
    const map = new Map<string, number>()
    recentActivity.forEach(entry => {
      map.set(entry.action, (map.get(entry.action) || 0) + 1)
    })
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1])
  }, [recentActivity])

  // Activity by table
  const activityByTable = useMemo(() => {
    const map = new Map<string, number>()
    recentActivity.forEach(entry => {
      if (entry.table_name) {
        map.set(entry.table_name, (map.get(entry.table_name) || 0) + 1)
      }
    })
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8)
  }, [recentActivity])

  // Filtered activity
  const filteredActivity = useMemo(() => {
    let items = [...recentActivity]
    if (selectedUser !== 'all') {
      items = items.filter(e => e.user_id === selectedUser)
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      items = items.filter(e =>
        (e.user_name?.toLowerCase().includes(q)) ||
        (e.action?.toLowerCase().includes(q)) ||
        (e.table_name?.toLowerCase().includes(q))
      )
    }
    return items
  }, [recentActivity, selectedUser, searchQuery])

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString('cs-CZ', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
      case 'accountant': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      case 'assistant': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin'
      case 'accountant': return 'Účetní'
      case 'assistant': return 'Asistent'
      default: return role
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'INSERT': return Plus
      case 'UPDATE': return Edit2
      case 'DELETE': return Trash2
      case 'LOGIN': return LogIn
      case 'LOGOUT': return LogOut
      case 'EXPORT': return Download
      default: return Activity
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
      INSERT: 'Vytvoření', UPDATE: 'Úprava', DELETE: 'Smazání',
      LOGIN: 'Přihlášení', LOGOUT: 'Odhlášení', EXPORT: 'Export',
    }
    return map[action] || action
  }

  const activeUsersCount = usersWithStatus.filter(u => u.isOnline).length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Online</p>
                <p className="text-2xl font-bold font-display text-green-600">{activeUsersCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Celkem uživatelů</p>
                <p className="text-2xl font-bold font-display text-blue-600">{apiUsers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Activity className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Posledních akcí</p>
                <p className="text-2xl font-bold font-display text-purple-600">{recentActivity.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Poslední aktivita</p>
                <p className="text-sm font-bold text-orange-600">
                  {recentActivity.length > 0 ? formatDateTime(recentActivity[0].created_at) : '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Cards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Uživatelé
          </CardTitle>
          <CardDescription>Přehled uživatelů a jejich aktivity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {usersWithStatus.map((user) => {
              const stats = userActivityStats.get(user.id)
              return (
                <div
                  key={user.id}
                  className={`p-4 rounded-xl border ${
                    user.isOnline
                      ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                      : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                        user.isOnline ? 'bg-green-200 text-green-700 dark:bg-green-800 dark:text-green-200' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {user.avatar}
                      </div>
                      {user.isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant="outline" className={getRoleColor(user.role)}>
                          {getRoleLabel(user.role)}
                        </Badge>
                        {user.isOnline ? (
                          <span className="text-xs text-green-600 dark:text-green-400">Online</span>
                        ) : user.last_login_at ? (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDateTime(user.last_login_at)}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Nikdy</span>
                        )}
                      </div>
                      {stats && (
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {stats.actions} akcí v logu
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            {usersWithStatus.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 col-span-4 text-center py-4">
                Žádní uživatelé
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 font-display">
                  <Activity className="h-5 w-5" />
                  Poslední aktivita
                </CardTitle>
                <CardDescription>Akce provedené uživateli</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Hledat..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-48 h-11"
                  />
                </div>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Uživatel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Všichni</SelectItem>
                    {usersWithStatus.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredActivity.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Activity className="h-10 w-10 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                  <p>Žádná aktivita</p>
                  <p className="text-xs mt-1">Záznamy se vytváří automaticky</p>
                </div>
              ) : (
                filteredActivity.map((entry) => {
                  const ActionIcon = getActionIcon(entry.action)
                  return (
                    <div
                      key={entry.id}
                      className="p-3 rounded-xl border border-border/50 bg-gray-50 dark:bg-gray-800/50"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${getActionColor(entry.action)}`}>
                          <ActionIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {entry.user_name || 'Systém'}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {getActionLabel(entry.action)}
                            </span>
                            {entry.table_name && (
                              <Badge variant="outline" className="text-xs">
                                {entry.table_name}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDateTime(entry.created_at)}
                            </span>
                            {entry.ip_address && <span>IP: {entry.ip_address}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats Sidebar */}
        <div className="space-y-6">
          {/* Activity by Action */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-display">
                <TrendingUp className="h-5 w-5" />
                Typy akcí
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activityByAction.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">Žádná data</p>
                ) : (
                  activityByAction.map(([action, count]) => {
                    const maxCount = activityByAction[0][1]
                    const pct = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0
                    return (
                      <div key={action}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-700 dark:text-gray-200">{getActionLabel(action)}</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{count}</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Activity by Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-display">
                <Eye className="h-5 w-5" />
                Aktivita podle tabulek
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activityByTable.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">Žádná data</p>
                ) : (
                  activityByTable.map(([table, count]) => {
                    const maxCount = activityByTable[0][1]
                    const pct = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0
                    return (
                      <div key={table}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-700 dark:text-gray-200">{table}</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{count}</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-purple-600 h-2 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
