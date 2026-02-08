'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Shield,
  Users,
  FileText,
  Activity,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Building2,
  Calendar,
} from 'lucide-react'
import Link from 'next/link'
// Admin page - hardcoded stats until full migration

// Mock data pro admin dashboard
const mockAdminStats = {
  totalUsers: 4,
  activeUsers: 3,
  totalClients: 12,
  totalLogsToday: 47,
  totalExportsThisMonth: 3,
  lastBackup: '2025-12-23T02:00:00Z',
}

const mockRecentActivity = [
  {
    id: '1',
    user: 'Účetní',
    action: 'Schválila uzávěrku',
    target: 'Horák s.r.o. - Prosinec 2025',
    timestamp: '2025-12-23T10:30:00Z',
    type: 'approval',
  },
  {
    id: '2',
    user: 'Marie Účetní',
    action: 'Přidala zprávu',
    target: 'TechStart s.r.o.',
    timestamp: '2025-12-23T10:15:00Z',
    type: 'message',
  },
  {
    id: '3',
    user: 'Radim',
    action: 'Exportoval data klienta',
    target: 'ABC Company a.s.',
    timestamp: '2025-12-23T09:45:00Z',
    type: 'export',
  },
  {
    id: '4',
    user: 'Účetní',
    action: 'Upravila nastavení',
    target: 'Ceník služeb',
    timestamp: '2025-12-23T09:30:00Z',
    type: 'settings',
  },
  {
    id: '5',
    user: 'Marie Účetní',
    action: 'Přihlásila se',
    target: '',
    timestamp: '2025-12-23T08:00:00Z',
    type: 'login',
  },
]

const mockSystemHealth = [
  { name: 'Databáze', status: 'ok', message: 'Připojeno' },
  { name: 'API', status: 'ok', message: 'Funkční' },
  { name: 'Supabase Auth', status: 'ok', message: 'Aktivní' },
  { name: 'Zálohy', status: 'ok', message: 'Poslední: dnes 02:00' },
]

export default function AdminDashboardPage() {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'approval': return CheckCircle2
      case 'message': return FileText
      case 'export': return Download
      case 'settings': return Activity
      case 'login': return Users
      default: return Activity
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'approval': return 'text-green-600 bg-green-100'
      case 'message': return 'text-blue-600 bg-blue-100'
      case 'export': return 'text-orange-600 bg-orange-100'
      case 'settings': return 'text-purple-600 bg-purple-100'
      case 'login': return 'text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700'
      default: return 'text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700'
    }
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Uživatelů</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{mockAdminStats.totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Aktivních</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">{mockAdminStats.activeUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Klientů</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{mockAdminStats.totalClients}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <FileText className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Logů dnes</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{mockAdminStats.totalLogsToday}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Download className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Exportů</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{mockAdminStats.totalExportsThisMonth}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Calendar className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Záloha</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{formatTime(mockAdminStats.lastBackup)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Poslední aktivita
                </CardTitle>
                <CardDescription>Akce provedené uživateli systému</CardDescription>
              </div>
              <Link href="/accountant/admin/audit-logs">
                <Badge variant="outline" className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700">
                  Zobrazit vše
                </Badge>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockRecentActivity.map((activity) => {
                const Icon = getActivityIcon(activity.type)
                const colorClass = getActivityColor(activity.type)

                return (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${colorClass}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-white">{activity.user}</span>
                        <span className="text-gray-500 dark:text-gray-400">{activity.action}</span>
                      </div>
                      {activity.target && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 truncate">{activity.target}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                      {formatTime(activity.timestamp)}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Stav systému
            </CardTitle>
            <CardDescription>Zdraví služeb a komponent</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockSystemHealth.map((service) => (
                <div key={service.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {service.status === 'ok' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    )}
                    <span className="font-medium text-gray-900 dark:text-white">{service.name}</span>
                  </div>
                  <span className={`text-sm ${service.status === 'ok' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {service.message}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t dark:border-gray-700">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Rychlé akce</h4>
              <div className="space-y-2">
                <Link href="/accountant/admin/audit-logs">
                  <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 cursor-pointer transition-colors">
                    <FileText className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm">Prohlédnout audit logy</span>
                  </div>
                </Link>
                <Link href="/accountant/admin/user-activity">
                  <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 cursor-pointer transition-colors">
                    <Users className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm">Aktivita uživatelů</span>
                  </div>
                </Link>
                <Link href="/accountant/admin/export">
                  <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 cursor-pointer transition-colors">
                    <Download className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm">Export dat klienta</span>
                  </div>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Notice */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-900 mb-1">Bezpečnostní upozornění</h4>
              <p className="text-sm text-amber-800 mb-2">
                Jako administrátor máte přístup ke všem datům v systému. Všechny vaše akce jsou logovány.
              </p>
              <ul className="text-xs text-amber-700 space-y-1 ml-4 list-disc">
                <li>Export dat klientů je sledován a zaznamenán</li>
                <li>Změny nastavení vyžadují potvrzení</li>
                <li>Přístup k citlivým datům je auditován</li>
                <li>Při podezřelé aktivitě bude účet zablokován</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
