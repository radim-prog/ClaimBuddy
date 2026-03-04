'use client'

import { useState, useEffect } from 'react'
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
  Loader2,
} from 'lucide-react'
import Link from 'next/link'

type AdminStats = {
  users: { total: number; active: number }
  companies: { total: number }
  audit: { today_count: number }
  time_logs: { month_hours: number }
  recent_activity: {
    id: string
    user_name?: string
    action: string
    table_name: string
    created_at: string
  }[]
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [healthOk, setHealthOk] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const [statsRes, healthRes] = await Promise.all([
          fetch('/api/accountant/admin/stats'),
          fetch('/api/health'),
        ])
        if (statsRes.ok) {
          setStats(await statsRes.json())
        }
        setHealthOk(healthRes.ok)
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })
  }

  const getActionLabel = (action: string) => {
    const map: Record<string, string> = {
      INSERT: 'Vytvořil(a)',
      UPDATE: 'Upravil(a)',
      DELETE: 'Smazal(a)',
      LOGIN: 'Přihlásil(a) se',
      EXPORT: 'Exportoval(a)',
    }
    return map[action] || action
  }

  const getActionColor = (action: string) => {
    const map: Record<string, string> = {
      INSERT: 'text-green-600 bg-green-100 dark:bg-green-900/30',
      UPDATE: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
      DELETE: 'text-red-600 bg-red-100 dark:bg-red-900/30',
      LOGIN: 'text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700',
      EXPORT: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30',
    }
    return map[action] || 'text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  const s = stats

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <Card className="shadow-soft-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Uživatelů</p>
                <p className="text-xl font-bold font-display text-gray-900 dark:text-white">{s?.users.total ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Aktivních (30d)</p>
                <p className="text-xl font-bold font-display text-green-600 dark:text-green-400">{s?.users.active ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Klientů</p>
                <p className="text-xl font-bold font-display text-gray-900 dark:text-white">{s?.companies.total ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <FileText className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Logů dnes</p>
                <p className="text-xl font-bold font-display text-gray-900 dark:text-white">{s?.audit.today_count ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Hodin (měsíc)</p>
                <p className="text-xl font-bold font-display text-gray-900 dark:text-white">{s?.time_logs.month_hours ?? 0}h</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2 shadow-soft">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 font-display">
                  <Activity className="h-5 w-5" />
                  Poslední aktivita
                </CardTitle>
                <CardDescription>Akce provedené uživateli systému</CardDescription>
              </div>
              <Link href="/accountant/admin/audit-logs">
                <Badge variant="outline" className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800">
                  Zobrazit vše
                </Badge>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(s?.recent_activity ?? []).length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  Zatím žádné záznamy aktivity
                </p>
              ) : (
                (s?.recent_activity ?? []).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${getActionColor(activity.action)}`}>
                      <Activity className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {activity.user_name || 'Systém'}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                          {getActionLabel(activity.action)}
                        </span>
                      </div>
                      {activity.table_name && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                          {activity.table_name}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                      {formatTime(activity.created_at)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display">
              <Shield className="h-5 w-5" />
              Stav systému
            </CardTitle>
            <CardDescription>Zdraví služeb a komponent</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: 'Databáze (Supabase)', ok: s !== null },
                { name: 'API Server', ok: healthOk },
                { name: 'Autentizace', ok: true },
              ].map((service) => (
                <div key={service.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <div className="flex items-center gap-2">
                    {service.ok ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    )}
                    <span className="font-medium text-gray-900 dark:text-white">{service.name}</span>
                  </div>
                  <span className={`text-sm ${service.ok ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {service.ok ? 'OK' : 'Chyba'}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-border/50">
              <h4 className="font-medium font-display text-gray-900 dark:text-white mb-2">Rychlé akce</h4>
              <div className="space-y-2">
                <Link href="/accountant/admin/audit-logs">
                  <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                    <FileText className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm">Prohlédnout audit logy</span>
                  </div>
                </Link>
                <Link href="/accountant/admin/user-activity">
                  <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                    <Users className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm">Aktivita uživatelů</span>
                  </div>
                </Link>
                <Link href="/accountant/admin/export">
                  <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                    <Download className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm">Export dat klienta</span>
                  </div>
                </Link>
                <Link href="/accountant/admin/subscription">
                  <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                    <TrendingUp className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm">Předplatné a tarify</span>
                  </div>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Notice */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800">
        <CardContent className="pt-6 pb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold font-display text-amber-900 dark:text-amber-200 mb-1">Bezpečnostní upozornění</h4>
              <p className="text-sm text-amber-800 dark:text-amber-300 mb-2">
                Jako administrátor máte přístup ke všem datům v systému. Všechny vaše akce jsou logovány.
              </p>
              <ul className="text-xs text-amber-700 dark:text-amber-400 space-y-1 ml-4 list-disc">
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
