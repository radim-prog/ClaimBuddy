'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Receipt, Settings, Shield, Building2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useAccountantUser } from '@/lib/contexts/accountant-user-context'

const firmTabs = [
  { href: '/accountant/firm/billing', label: 'Fakturace', icon: Receipt },
  { href: '/accountant/firm/settings', label: 'Nastavení', icon: Settings },
]

export default function FirmLayout({ children }: { children: React.ReactNode }) {
  const { userRole, loading } = useAccountantUser()
  const pathname = usePathname() ?? ''

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    )
  }

  if (userRole !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
          <Shield className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Nedostatečná oprávnění</h2>
        <p className="text-gray-500 dark:text-gray-400">Tato sekce je dostupná pouze pro administrátory.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Header Banner */}
      <div className="flex items-center gap-2 px-3 py-1.5 mb-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800 text-sm">
        <Building2 className="h-3.5 w-3.5 text-blue-600" />
        <span className="font-medium text-blue-700 dark:text-blue-300">Moje firma</span>
        <span className="text-blue-400 dark:text-blue-500 text-xs">&mdash; správa firmy a fakturace</span>
      </div>

      {/* Tab Navigation */}
      <Card className="mb-6">
        <CardContent className="pt-3 pb-3">
          <nav className="flex items-center gap-2 flex-wrap">
            {firmTabs.map((tab) => {
              const Icon = tab.icon
              const isActive = pathname.startsWith(tab.href)

              return (
                <Link key={tab.href} href={tab.href}>
                  <div
                    className={`
                      flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-sm
                      ${isActive
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold'
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

      {children}
    </div>
  )
}
