'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { DollarSign, Settings as SettingsIcon, Users as UsersIcon, Building2, Repeat, MapPin, HardDrive, Receipt } from 'lucide-react'
import { useAccountantUser } from '@/lib/contexts/accountant-user-context'

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { userRole, permissions } = useAccountantUser()

  const isAdmin = userRole === 'admin' || permissions?.users_manage === true

  const tabs = [
    {
      name: 'Obecné nastavení',
      href: '/accountant/settings',
      icon: SettingsIcon,
      show: true
    },
    {
      name: 'Firma',
      href: '/accountant/settings/company',
      icon: Building2,
      show: true
    },
    {
      name: 'Fakturace',
      href: '/accountant/settings/invoicing',
      icon: Receipt,
      show: true
    },
    {
      name: 'Ceník a Sazby',
      href: '/accountant/settings/pricing',
      icon: DollarSign,
      show: true
    },
    {
      name: 'Šablony úkolů',
      href: '/accountant/settings/templates',
      icon: Repeat,
      show: true
    },
    {
      name: 'Místa',
      href: '/accountant/settings/locations',
      icon: MapPin,
      show: true
    },
    {
      name: 'Google Drive',
      href: '/accountant/settings/drive',
      icon: HardDrive,
      show: isAdmin
    },
    {
      name: 'Správa uživatelů',
      href: '/accountant/settings/users',
      icon: UsersIcon,
      show: isAdmin
    }
  ]

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Nastavení</h1>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 overflow-x-auto border-b border-gray-200 dark:border-gray-700 pb-px">
        {tabs.filter(tab => tab.show).map((tab) => {
          const isActive = pathname === tab.href
          const Icon = tab.icon
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`px-3 py-1.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5" />
                {tab.name}
              </div>
            </Link>
          )
        })}
      </div>

      {/* Page Content */}
      <div className="max-w-3xl">
        {children}
      </div>
    </div>
  )
}
