'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { DollarSign, Settings as SettingsIcon, Users as UsersIcon, Building2 } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    fetchCurrentUser()
  }, [])

  const fetchCurrentUser = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (authUser) {
      const { data } = await supabase
        .from('users')
        .select('role')
        .eq('id', authUser.id)
        .single()
      setCurrentUserRole(data?.role || null)
    }
  }

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
      name: 'Správa uživatelů',
      href: '/accountant/settings/users',
      icon: UsersIcon,
      show: currentUserRole === 'admin'
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
      <div className="flex gap-2 border-b border-gray-200">
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
                  : 'border-transparent text-gray-600 hover:text-gray-900'
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
