'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  BarChart3,
  Target,
  Users,
  Clock,
  Gauge,
  Shield,
  GitBranchPlus,
  TrendingUp,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useAccountantUser } from '@/lib/contexts/accountant-user-context'

const analyticsTabs = [
  { href: '/accountant/analytics', label: 'Prehled', icon: BarChart3 },
  { href: '/accountant/analytics/goals', label: 'Cile', icon: Target },
  { href: '/accountant/analytics/clients', label: 'Klienti', icon: Users },
  { href: '/accountant/analytics/time-reports', label: 'Odpracovano', icon: Clock },
  { href: '/accountant/analytics/capacity', label: 'Kapacity', icon: Gauge },
  { href: '/accountant/analytics/pipeline', label: 'Pipeline', icon: GitBranchPlus },
  { href: '/accountant/analytics/profitability', label: 'Ziskovost', icon: TrendingUp },
]

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  const { userRole, loading } = useAccountantUser()
  const pathname = usePathname() ?? ''

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    )
  }

  const hasAnalyticsAccess = ['admin', 'accountant', 'senior'].includes(userRole)
  if (!hasAnalyticsAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
          <Shield className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Nedostatecna opravneni</h2>
        <p className="text-gray-500 dark:text-gray-400">Tato sekce je dostupna pouze pro administratory.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Header Banner */}
      <div className="flex items-center gap-2 px-3 py-1.5 mb-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-800 text-sm">
        <BarChart3 className="h-3.5 w-3.5 text-emerald-600" />
        <span className="font-medium text-emerald-700 dark:text-emerald-300">Analytika</span>
        <span className="text-emerald-400 dark:text-emerald-500 text-xs">&mdash; data a metriky firmy</span>
      </div>

      {/* Tab Navigation */}
      <Card className="mb-6">
        <CardContent className="pt-3 pb-3">
          <nav className="flex items-center gap-2 flex-wrap">
            {analyticsTabs.map((tab) => {
              const Icon = tab.icon
              const isActive = tab.href === '/accountant/analytics'
                ? pathname === '/accountant/analytics'
                : pathname.startsWith(tab.href)

              return (
                <Link key={tab.href} href={tab.href}>
                  <div
                    className={`
                      flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-sm
                      ${isActive
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-semibold'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }
                    `}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{tab.label}</span>
                  </div>
                </Link>
              )
            })}
          </nav>
        </CardContent>
      </Card>

      {/* Content — full width for charts/tables */}
      {children}
    </div>
  )
}
