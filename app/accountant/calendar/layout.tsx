'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { CalendarCheck, Bell, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { name: 'Termíny', href: '/accountant/calendar', icon: CalendarCheck, exact: true },
  { name: 'Připomínky', href: '/accountant/calendar/reminders', icon: Bell },
  { name: 'Kalendář', href: '/accountant/calendar/view', icon: Calendar },
]

export default function CalendarLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? ''

  return (
    <div className="flex flex-col">
      {/* Header: icon + title + tabs */}
      <div className="flex items-center border-b border-border py-1.5 px-1 gap-3 min-h-[40px]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-soft-sm flex-shrink-0">
            <CalendarCheck className="h-4 w-4 text-white" />
          </div>
          <h1 className="text-lg font-bold font-display flex-shrink-0">Kalendář</h1>

          <div className="w-px h-5 bg-border flex-shrink-0" />

          <nav className="flex items-center gap-0.5">
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
                    'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="pt-3">
        {children}
      </div>
    </div>
  )
}
