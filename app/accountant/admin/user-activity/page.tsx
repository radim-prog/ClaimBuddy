'use client'

import { useState, useMemo, useEffect } from 'react'
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
  Users,
  Activity,
  Clock,
  Monitor,
  Smartphone,
  Globe,
  LogIn,
  LogOut,
  Eye,
  FileText,
  Building2,
  CheckCircle2,
  XCircle,
  Calendar,
  TrendingUp,
  User,
  Search,
} from 'lucide-react'
// User activity data is generated from API users
// TODO: Replace with real session tracking when available

// Placeholder session/stats generators
function generateMockSessions(users: { id: string; name: string; email: string }[]) {
  return users.slice(0, 5).map((user, index) => ({
    id: `session-${index + 1}`,
    user_id: user.id,
    user_name: user.name,
    user_email: user.email,
    login_time: new Date(Date.now() - (index + 1) * 3 * 60 * 60 * 1000).toISOString(),
    logout_time: index >= 2 ? new Date(Date.now() - index * 2 * 60 * 60 * 1000).toISOString() : null,
    duration: index >= 2 ? `${index}h 30m` : null,
    ip_address: `192.168.1.${100 + index}`,
    device: index === 2 ? 'mobile' as const : 'desktop' as const,
    browser: ['Chrome 120', 'Firefox 121', 'Safari Mobile', 'Edge 120', 'Chrome 120'][index] || 'Chrome',
    location: ['Praha, CZ', 'Brno, CZ', 'Praha, CZ', 'Ostrava, CZ', 'Praha, CZ'][index] || 'CZ',
    is_active: index < 2,
    pages_viewed: [47, 32, 12, 156, 234][index] || 10,
    actions_performed: [23, 15, 5, 78, 112][index] || 5,
  }))
}

function generateMockUserStats(users: { id: string; name: string }[]) {
  return users.map((user, index) => ({
    user_id: user.id,
    user_name: user.name,
    total_sessions: [45, 38, 12, 22][index % 4] || 10,
    total_time: ['180h', '152h', '24h', '88h'][index % 4] || '40h',
    avg_session: ['4h', '4h', '2h', '4h'][index % 4] || '4h',
    pages_viewed: [3420, 2890, 456, 1780][index % 4] || 500,
    actions: [1560, 1340, 89, 890][index % 4] || 200,
    last_login: new Date(Date.now() - index * 2 * 60 * 60 * 1000).toISOString(),
    most_visited: ['Klienti', 'Uzávěrky', 'Admin', 'Dokumenty'][index % 4] || 'Dashboard',
    trend: ['up', 'up', 'same', 'down'][index % 4] || 'same',
  }))
}

// Mock page views by section
const mockPageViews = [
  { section: 'Dashboard', views: 1234, percentage: 25 },
  { section: 'Klienti', views: 987, percentage: 20 },
  { section: 'Uzávěrky', views: 876, percentage: 18 },
  { section: 'Úkoly', views: 654, percentage: 13 },
  { section: 'Dokumenty', views: 543, percentage: 11 },
  { section: 'Faktury', views: 321, percentage: 7 },
  { section: 'Nastavení', views: 210, percentage: 4 },
  { section: 'Admin', views: 98, percentage: 2 },
]

export default function UserActivityPage() {
  const [selectedUser, setSelectedUser] = useState<string>('all')
  const [dateRange, setDateRange] = useState<string>('today')
  const [apiUsers, setApiUsers] = useState<{ id: string; name: string; email: string; role: string }[]>([])

  useEffect(() => {
    fetch('/api/accountant/users')
      .then(r => r.json())
      .then(data => setApiUsers((data.users || []).map((u: any) => ({ id: u.id, name: u.name || u.full_name, email: u.email || '', role: u.role }))))
      .catch(() => {})
  }, [])

  // Generate mock data from real users
  const mockUsers = useMemo(() => apiUsers.map((user, index) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role === 'accountant' ? 'admin' : user.role,
    avatar: user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
    isOnline: index < 2,
    lastActive: new Date(Date.now() - index * 2 * 60 * 60 * 1000).toISOString(),
  })), [apiUsers])

  const mockSessions = useMemo(() => generateMockSessions(apiUsers), [apiUsers])
  const mockUserStats = useMemo(() => generateMockUserStats(apiUsers), [apiUsers])
  const [searchQuery, setSearchQuery] = useState('')

  const filteredSessions = useMemo(() => {
    let sessions = [...mockSessions]

    if (selectedUser !== 'all') {
      sessions = sessions.filter(s => s.user_id === selectedUser)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      sessions = sessions.filter(s =>
        s.user_name.toLowerCase().includes(query) ||
        s.user_email.toLowerCase().includes(query) ||
        s.ip_address.includes(query)
      )
    }

    return sessions
  }, [selectedUser, searchQuery])

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit' })
  }

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString('cs-CZ', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getDeviceIcon = (device: string) => {
    switch (device) {
      case 'mobile': return Smartphone
      case 'desktop': return Monitor
      default: return Globe
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-700'
      case 'accountant': return 'bg-blue-100 text-blue-700'
      case 'assistant': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
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

  const activeUsersCount = mockUsers.filter(u => u.isOnline).length
  const totalSessions = mockSessions.length
  const activeSessions = mockSessions.filter(s => s.is_active).length

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Online uživatelů</p>
                <p className="text-2xl font-bold text-green-600">{activeUsersCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Aktivní sessions</p>
                <p className="text-2xl font-bold text-blue-600">{activeSessions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Eye className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Zobrazení dnes</p>
                <p className="text-2xl font-bold text-purple-600">
                  {mockSessions.filter(s => s.is_active).reduce((sum, s) => sum + s.pages_viewed, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Celkem sessions</p>
                <p className="text-2xl font-bold text-orange-600">{totalSessions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Online Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Online uživatelé
          </CardTitle>
          <CardDescription>Aktuálně přihlášení uživatelé v systému</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {mockUsers.map((user) => (
              <div
                key={user.id}
                className={`p-4 rounded-lg border ${
                  user.isOnline ? 'bg-green-50 border-green-200' : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                      user.isOnline ? 'bg-green-200 text-green-700' : 'bg-gray-200 text-gray-600 dark:text-gray-300'
                    }`}>
                      {user.avatar}
                    </div>
                    {user.isOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
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
                        <span className="text-xs text-green-600">Online</span>
                      ) : (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDateTime(user.lastActive)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sessions List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <LogIn className="h-5 w-5" />
                  Historie přihlášení
                </CardTitle>
                <CardDescription>Přehled všech sessions uživatelů</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Hledat..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-48"
                  />
                </div>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Uživatel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Všichni</SelectItem>
                    {mockUsers.map((user) => (
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
              {filteredSessions.map((session) => {
                const DeviceIcon = getDeviceIcon(session.device)

                return (
                  <div
                    key={session.id}
                    className={`p-4 rounded-lg border ${
                      session.is_active ? 'bg-green-50 border-green-200' : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          session.is_active ? 'bg-green-200' : 'bg-gray-200'
                        }`}>
                          {session.is_active ? (
                            <LogIn className="h-4 w-4 text-green-700" />
                          ) : (
                            <LogOut className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{session.user_name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{session.user_email}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDateTime(session.login_time)}
                              {session.logout_time && ` - ${formatTime(session.logout_time)}`}
                            </span>
                            {session.duration && (
                              <Badge variant="outline" className="text-xs">
                                {session.duration}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="flex items-center gap-2 justify-end">
                          <DeviceIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-xs text-gray-600 dark:text-gray-300">{session.browser}</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{session.ip_address}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{session.location}</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center gap-4 text-xs">
                      <span className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                        <Eye className="h-3 w-3" />
                        {session.pages_viewed} zobrazení
                      </span>
                      <span className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                        <Activity className="h-3 w-3" />
                        {session.actions_performed} akcí
                      </span>
                      {session.is_active && (
                        <Badge className="bg-green-100 text-green-700 border-green-300">
                          Aktivní
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* User Stats & Page Views */}
        <div className="space-y-6">
          {/* User Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-5 w-5" />
                Statistiky uživatelů
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockUserStats.map((stat) => (
                  <div key={stat.user_id} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900 dark:text-white">{stat.user_name}</span>
                      {stat.trend === 'up' && (
                        <Badge className="bg-green-100 text-green-700">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Aktivní
                        </Badge>
                      )}
                      {stat.trend === 'down' && (
                        <Badge className="bg-red-100 text-red-700">
                          Méně aktivní
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-300">
                      <div>Sessions: <span className="font-medium">{stat.total_sessions}</span></div>
                      <div>Čas: <span className="font-medium">{stat.total_time}</span></div>
                      <div>Stránky: <span className="font-medium">{stat.pages_viewed}</span></div>
                      <div>Akce: <span className="font-medium">{stat.actions}</span></div>
                    </div>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Nejčastěji: <span className="font-medium">{stat.most_visited}</span>
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Page Views by Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Eye className="h-5 w-5" />
                Návštěvnost sekcí
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockPageViews.map((page) => (
                  <div key={page.section}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700 dark:text-gray-200">{page.section}</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{page.views}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${page.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
