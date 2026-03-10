'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Users,
  Building2,
  Clock,
  FileText,
  Activity,
  Loader2,
} from 'lucide-react'

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

  useEffect(() => {
    fetch('/api/accountant/admin/stats')
      .then(r => r.ok ? r.json() : null)
      .then(data => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })
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
      {/* Compact stat row */}
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <span className="flex items-center gap-1.5">
          <Users className="h-4 w-4 text-purple-500" /> <b>{s?.users.total ?? 0}</b> uživatelů
        </span>
        <span className="flex items-center gap-1.5">
          <Building2 className="h-4 w-4 text-blue-500" /> <b>{s?.companies.total ?? 0}</b> klientů
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-orange-500" /> <b>{s?.time_logs.month_hours ?? 0}</b>h tento měsíc
        </span>
        <span className="flex items-center gap-1.5">
          <FileText className="h-4 w-4 text-yellow-500" /> <b>{s?.audit.today_count ?? 0}</b> logů dnes
        </span>
      </div>

      {/* Recent Activity */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <Activity className="h-5 w-5" />
            Poslední aktivita
          </CardTitle>
          <CardDescription>Akce provedené uživateli systému</CardDescription>
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
    </div>
  )
}
