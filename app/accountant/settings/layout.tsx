'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Settings as SettingsIcon, Building2, MapPin } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const tabs = [
    {
      name: 'Obecné nastavení',
      href: '/accountant/settings',
      icon: SettingsIcon,
    },
    {
      name: 'Firma',
      href: '/accountant/settings/company',
      icon: Building2,
    },
    {
      name: 'Místa',
      href: '/accountant/settings/locations',
      icon: MapPin,
    },
  ]

  return (
    <div className="max-w-3xl">
      {/* Header Banner */}
      <div className="bg-gray-100 dark:bg-gray-800/50 text-gray-900 dark:text-white px-4 py-3 mb-6 rounded-lg">
        <div className="flex items-center gap-3">
          <SettingsIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          <div>
            <h2 className="font-bold text-lg">Nastavení</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Osobní a firemní nastavení
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation - pill buttons in Card */}
      <Card className="mb-6">
        <CardContent className="pt-4 pb-4">
          <nav className="flex items-center gap-2 flex-wrap">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = pathname === tab.href ||
                (tab.href !== '/accountant/settings' && pathname.startsWith(tab.href))

              return (
                <Link key={tab.href} href={tab.href}>
                  <div
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
                      ${isActive
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-semibold'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }
                    `}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.name}</span>
                  </div>
                </Link>
              )
            })}
          </nav>
        </CardContent>
      </Card>

      {/* Page Content - full width */}
      {children}
    </div>
  )
}
