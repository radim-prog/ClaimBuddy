'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Shield,
  Users,
  Settings2,
  Database,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const adminNavItems = [
  { href: '/accountant/admin', label: 'Přehled', icon: Shield },
  { href: '/accountant/admin/people', label: 'Lidé', icon: Users },
  { href: '/accountant/admin/operations', label: 'Provoz', icon: Settings2 },
  { href: '/accountant/admin/system', label: 'Systém', icon: Database },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div>
      {/* Slim Admin Banner */}
      <div className="flex items-center gap-2 px-3 py-1.5 mb-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800 text-sm">
        <Shield className="h-3.5 w-3.5 text-purple-600" />
        <span className="font-medium text-purple-700 dark:text-purple-300">Administrace</span>
        <span className="text-purple-400 dark:text-purple-500 text-xs">&mdash; akce jsou logovány</span>
      </div>

      {/* Admin Navigation — 4 flat tabs */}
      <Card className="mb-6">
        <CardContent className="pt-3 pb-3">
          <nav className="flex items-center gap-2 flex-wrap">
            {adminNavItems.map((item) => {
              const Icon = item.icon
              const isActive = item.href === '/accountant/admin'
                ? pathname === '/accountant/admin'
                : pathname.startsWith(item.href)

              return (
                <Link key={item.href} href={item.href}>
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
                    <span>{item.label}</span>
                  </div>
                </Link>
              )
            })}
          </nav>
        </CardContent>
      </Card>

      {/* Content */}
      {children}
    </div>
  )
}
