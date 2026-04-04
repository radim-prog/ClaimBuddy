'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileText, CreditCard, Receipt } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { name: 'K fakturaci', href: '/accountant/invoicing', icon: FileText, exact: true },
  { name: 'Předplatné', href: '/accountant/invoicing/billing', icon: CreditCard },
]

export default function InvoicingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? ''

  return (
    <div className="flex flex-col">
      {/* Header with tabs */}
      <div className="flex items-center border-b border-border py-1.5 px-1 gap-3 min-h-[40px]">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-soft-sm flex-shrink-0">
          <Receipt className="h-4 w-4 text-white" />
        </div>
        <h1 className="text-lg font-bold font-display flex-shrink-0">Fakturace</h1>

        <div className="w-px h-5 bg-border flex-shrink-0" />

        <nav className="flex items-center gap-0.5">
          {tabs.map((tab) => {
            const isActive = 'exact' in tab && tab.exact
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
                    ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
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

      {/* Content */}
      <div className="pt-3">
        {children}
      </div>
    </div>
  )
}
