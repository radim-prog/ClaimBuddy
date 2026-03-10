'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Shield,
  FileText,
  Users,
  Download,
  Activity,
  AlertTriangle,
  Network,
  Bell,
  GitBranch,
  Clock,
  Receipt,
  DollarSign,
  Repeat,
  HardDrive,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const adminNavGroups = [
  {
    items: [
      { href: '/accountant/admin', label: 'Přehled', icon: Shield },
      { href: '/accountant/admin/users', label: 'Uživatelé', icon: Users },
      { href: '/accountant/admin/hierarchy', label: 'Hierarchie', icon: Network },
      { href: '/accountant/admin/user-activity', label: 'Aktivita', icon: Activity },
    ],
  },
  {
    items: [
      { href: '/accountant/admin/time-reports', label: 'Čas', icon: Clock },
      { href: '/accountant/admin/notifications', label: 'Notifikace', icon: Bell },
      { href: '/accountant/admin/workflow', label: 'Workflow', icon: GitBranch },
    ],
  },
  {
    items: [
      { href: '/accountant/admin/invoicing', label: 'Fakturace', icon: Receipt },
      { href: '/accountant/admin/pricing', label: 'Ceník', icon: DollarSign },
      { href: '/accountant/admin/templates', label: 'Šablony', icon: Repeat },
    ],
  },
  {
    items: [
      { href: '/accountant/admin/audit-logs', label: 'Audit logy', icon: FileText },
      { href: '/accountant/admin/export', label: 'Export', icon: Download },
      { href: '/accountant/admin/drive', label: 'Google Drive', icon: HardDrive },
    ],
  },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div>
      {/* Admin Warning Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-3 mb-6 rounded-lg">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6" />
          <div>
            <h2 className="font-bold text-lg">Administrace</h2>
            <p className="text-sm text-purple-100">
              Tato sekce je přístupná pouze pro administrátory. Všechny akce jsou logovány.
            </p>
          </div>
        </div>
      </div>

      {/* Admin Navigation */}
      <Card className="mb-6">
        <CardContent className="pt-4 pb-4">
          <nav className="flex items-center gap-2 flex-wrap">
            {adminNavGroups.map((group, groupIndex) => (
              <div key={groupIndex} className="contents">
                {groupIndex > 0 && (
                  <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />
                )}
                {group.items.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href ||
                    (item.href !== '/accountant/admin' && pathname.startsWith(item.href))

                  return (
                    <Link key={item.href} href={item.href}>
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
                        <span>{item.label}</span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            ))}
          </nav>
        </CardContent>
      </Card>

      {/* Content */}
      {children}
    </div>
  )
}
