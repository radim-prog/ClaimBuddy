'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Users, CheckSquare, Settings, ScanLine } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { name: 'Dashboard', href: '/accountant/extraction', icon: LayoutDashboard, exact: true },
  { name: 'Klienti', href: '/accountant/extraction/clients', icon: Users },
  { name: 'Verifikace', href: '/accountant/extraction/verify', icon: CheckSquare },
  { name: 'Nastavení', href: '/accountant/extraction/settings', icon: Settings },
]

export default function ExtractionLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-soft-sm">
            <ScanLine className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display">Vytěžování</h1>
            <p className="text-sm text-muted-foreground">OCR + AI extrakce dokladů</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-1 -mb-px">
          {tabs.map((tab) => {
            const isActive = tab.exact
              ? pathname === tab.href
              : pathname.startsWith(tab.href)
            const Icon = tab.icon
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
                  isActive
                    ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.name}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Content */}
      {children}
    </div>
  )
}
