'use client'

import { useState } from 'react'
import {
  Repeat,
  GitBranch,
  Bell,
  Receipt,
  SlidersHorizontal,
  DollarSign,
  HardDrive,
  Link2,
  Calculator,
  Sparkles,
  Mail,
  Store,
  TrendingUp,
  CreditCard,
  PenLine,
  FolderTree,
  FileText,
  CheckSquare,
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
import { SigniSettings } from '@/components/admin/signi-settings'
import { LeadsList } from '@/components/admin/leads-list'
import { MarketplaceProviders } from '@/components/admin/marketplace-providers'
import { OperationsRevenue } from '@/components/admin/operations-revenue'
import { OperationsBilling } from '@/components/admin/operations-billing'
import { OperationsFolderTemplates } from '@/components/admin/operations-folder-templates'
import { OperationsEmail } from '@/components/admin/operations-email'
import { InvoiceNoticesSettings } from '@/components/admin/operations-invoice-notices'
import { OperationsBillingSettings } from '@/components/admin/operations-billing-settings'
import { OperationsClosureSettings } from '@/components/admin/operations-closure-settings'

const demoBadge = <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Demo</span>

const sections = [
  { id: 'marketplace', label: 'Marketplace — registrace', icon: Store, Component: MarketplaceProviders, badge: demoBadge },
  { id: 'revenue', label: 'Revenue sharing', icon: TrendingUp, Component: OperationsRevenue, badge: demoBadge },
  { id: 'billing', label: 'Billing-as-a-service', icon: CreditCard, Component: OperationsBilling, badge: demoBadge },
  { id: 'leads', label: 'Leady — Chci účetní', icon: Sparkles, Component: LeadsList, badge: demoBadge },
  { id: 'closure-settings', label: 'Nastavení uzávěrek', icon: CheckSquare, Component: OperationsClosureSettings },
  { id: 'templates', label: 'Šablony úkolů', icon: Repeat, Component: TaskTemplates },
  { id: 'workflow', label: 'Automatická pravidla', icon: GitBranch, Component: OperationsWorkflow },
  { id: 'notifications', label: 'Notifikace', icon: Bell, Component: OperationsNotifications },
  { id: 'email-settings', label: 'Email adresy', icon: Mail, Component: OperationsEmail },
  { id: 'billing-settings', label: 'Fakturační nastavení', icon: SlidersHorizontal, Component: OperationsBillingSettings },
  { id: 'invoicing', label: 'Fakturace', icon: Receipt, Component: InvoicingSettings },
  { id: 'invoice-notices', label: 'Hlášky na fakturách', icon: FileText, Component: InvoiceNoticesSettings },
  { id: 'pricing', label: 'Ceník a sazby', icon: DollarSign, Component: PricingSettings },
  { id: 'folder-templates', label: 'Struktura složek klientů', icon: FolderTree, Component: OperationsFolderTemplates },
  { id: 'drive', label: 'Google Drive', icon: HardDrive, Component: CompanyDriveMapper },
  { id: 'raynet', label: 'Raynet CRM', icon: Link2, Component: CompanyRaynetMapper },
  { id: 'tax-rates', label: 'Daňové sazby', icon: Calculator, Component: OperationsTaxRates },
  { id: 'marketing', label: 'Email Marketing (Ecomail)', icon: Mail, Component: OperationsMarketing },
  { id: 'signi', label: 'Signi.com — Elektronický podpis', icon: PenLine, Component: SigniSettings },
]

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
      {sections.map(({ id, label, icon, Component, badge }) => (
        <CollapsibleSection
          key={id}
          id={id}
          label={label}
          icon={icon}
          expanded={openSections.has(id)}
          onToggle={() => toggle(id)}
          variant="bordered"
          badge={badge}
        >
          <Component />
        </CollapsibleSection>
      ))}
    </div>
  )
}
