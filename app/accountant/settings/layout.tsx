'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { DollarSign, Settings as SettingsIcon, Users as UsersIcon, Building2, Repeat } from 'lucide-react'

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  // TODO: Check user role from Supabase when connected
  const isAdmin = true // For now, show all tabs

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
      name: 'Správa uživatelů',
      href: '/accountant/settings/users',
      icon: UsersIcon,
      show: isAdmin
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nastavení</h1>
        <p className="text-muted-foreground">
          Spravujte své předvolby a nastavení účtu
        </p>
      </div>

      {/* Unified Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {tabs.filter(tab => tab.show).map((tab) => {
          const isActive = pathname === tab.href
          const Icon = tab.icon
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                isActive
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {tab.name}
              </div>
            </Link>
          )
        })}
      </div>

      {/* Page Content */}
      {children}
    </div>
  )
}
