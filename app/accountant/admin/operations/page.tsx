'use client'

import { useState } from 'react'
import {
  Repeat,
  GitBranch,
  Bell,
  Receipt,
  DollarSign,
  HardDrive,
  Link2,
  Calculator,
  Sparkles,
  Mail,
  Store,
  TrendingUp,
  CreditCard,
} from 'lucide-react'
import { CollapsibleSection } from '@/components/collapsible-section'
import { TaskTemplates } from '@/components/admin/task-templates'
import { OperationsWorkflow } from '@/components/admin/operations-workflow'
import { OperationsNotifications } from '@/components/admin/operations-notifications'
import { InvoicingSettings } from '@/components/admin/invoicing-settings'
import { PricingSettings } from '@/components/admin/pricing-settings'
import { CompanyDriveMapper } from '@/components/drive/company-drive-mapper'
import { CompanyRaynetMapper } from '@/components/raynet/company-raynet-mapper'
import { OperationsTaxRates } from '@/components/admin/operations-tax-rates'
import { OperationsMarketing } from '@/components/admin/operations-marketing'
import { LeadsList } from '@/components/admin/leads-list'
import { MarketplaceProviders } from '@/components/admin/marketplace-providers'
import { OperationsRevenue } from '@/components/admin/operations-revenue'
import { OperationsBilling } from '@/components/admin/operations-billing'

const sections = [
  { id: 'marketplace', label: 'Marketplace — registrace', icon: Store, Component: MarketplaceProviders },
  { id: 'revenue', label: 'Revenue sharing', icon: TrendingUp, Component: OperationsRevenue },
  { id: 'billing', label: 'Billing-as-a-service', icon: CreditCard, Component: OperationsBilling },
  { id: 'leads', label: 'Leady — Chci účetní', icon: Sparkles, Component: LeadsList },
  { id: 'templates', label: 'Šablony úkolů', icon: Repeat, Component: TaskTemplates },
  { id: 'workflow', label: 'Workflow pravidla', icon: GitBranch, Component: OperationsWorkflow },
  { id: 'notifications', label: 'Notifikace', icon: Bell, Component: OperationsNotifications },
  { id: 'invoicing', label: 'Fakturace', icon: Receipt, Component: InvoicingSettings },
  { id: 'pricing', label: 'Ceník a sazby', icon: DollarSign, Component: PricingSettings },
  { id: 'drive', label: 'Google Drive', icon: HardDrive, Component: CompanyDriveMapper },
  { id: 'raynet', label: 'Raynet CRM', icon: Link2, Component: CompanyRaynetMapper },
  { id: 'tax-rates', label: 'Daňové sazby', icon: Calculator, Component: OperationsTaxRates },
  { id: 'marketing', label: 'Email Marketing (Ecomail)', icon: Mail, Component: OperationsMarketing },
] as const

export default function OperationsPage() {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['templates']))

  const toggle = (id: string) => {
    setOpenSections(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className="space-y-2">
      {sections.map(({ id, label, icon, Component }) => (
        <CollapsibleSection
          key={id}
          id={id}
          label={label}
          icon={icon}
          expanded={openSections.has(id)}
          onToggle={() => toggle(id)}
          variant="bordered"
        >
          <Component />
        </CollapsibleSection>
      ))}
    </div>
  )
}
