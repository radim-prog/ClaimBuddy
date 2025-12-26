'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Shield,
  FileText,
  Users,
  Download,
  Activity,
  Settings,
  AlertTriangle,
  Network,
  Bell,
  GitBranch,
  Clock,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const adminNavItems = [
  {
    href: '/accountant/admin',
    label: 'Přehled',
    icon: Shield,
  },
  {
    href: '/accountant/admin/hierarchy',
    label: 'Hierarchie týmu',
    icon: Network,
  },
  {
    href: '/accountant/admin/notifications',
    label: 'Notifikace',
    icon: Bell,
  },
  {
    href: '/accountant/admin/workflow',
    label: 'Workflow',
    icon: GitBranch,
  },
  {
    href: '/accountant/admin/audit-logs',
    label: 'Audit logy',
    icon: FileText,
  },
  {
    href: '/accountant/admin/user-activity',
    label: 'Aktivita',
    icon: Activity,
  },
  {
    href: '/accountant/admin/time-reports',
    label: 'Čas',
    icon: Clock,
  },
  {
    href: '/accountant/admin/export',
    label: 'Export',
    icon: Download,
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
            {adminNavItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href ||
                (item.href !== '/accountant/admin' && pathname.startsWith(item.href))

              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
                      ${isActive
                        ? 'bg-purple-100 text-purple-700 font-semibold'
                        : 'text-gray-600 hover:bg-gray-100'
                      }
                    `}
                  >
                    <Icon className="h-4 w-4" />
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
