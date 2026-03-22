'use client'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { LayoutDashboard, Landmark, FileText, Receipt } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ClosureTabValue = 'overview' | 'bank' | 'documents' | 'invoices'

interface ClosureTabsProps {
  defaultTab?: ClosureTabValue
  onTabChange?: (tab: ClosureTabValue) => void
  children: React.ReactNode
  className?: string
}

const tabConfig: { value: ClosureTabValue; label: string; icon: typeof LayoutDashboard }[] = [
  { value: 'overview', label: 'Přehled', icon: LayoutDashboard },
  { value: 'bank', label: 'Banka', icon: Landmark },
  { value: 'documents', label: 'Doklady', icon: FileText },
  { value: 'invoices', label: 'Faktury', icon: Receipt },
]

export function ClosureTabs({ defaultTab = 'overview', onTabChange, children, className }: ClosureTabsProps) {
  return (
    <Tabs
      defaultValue={defaultTab}
      onValueChange={(v) => onTabChange?.(v as ClosureTabValue)}
      className={cn('w-full', className)}
    >
      <TabsList className="w-full grid grid-cols-4 mb-4">
        {tabConfig.map(({ value, label, icon: Icon }) => (
          <TabsTrigger key={value} value={value} className="flex items-center gap-1.5 text-sm">
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
          </TabsTrigger>
        ))}
      </TabsList>
      {children}
    </Tabs>
  )
}

export { TabsContent as ClosureTabContent }
