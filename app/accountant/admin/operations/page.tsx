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
} from 'lucide-react'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { TaskTemplates } from '@/components/admin/task-templates'
import { OperationsWorkflow } from '@/components/admin/operations-workflow'
import { OperationsNotifications } from '@/components/admin/operations-notifications'
import { InvoicingSettings } from '@/components/admin/invoicing-settings'
import { PricingSettings } from '@/components/admin/pricing-settings'
import { CompanyDriveMapper } from '@/components/drive/company-drive-mapper'
import { CompanyRaynetMapper } from '@/components/raynet/company-raynet-mapper'

const sections = [
  { id: 'templates', label: 'Šablony úkolů', icon: Repeat, Component: TaskTemplates },
  { id: 'workflow', label: 'Workflow pravidla', icon: GitBranch, Component: OperationsWorkflow },
  { id: 'notifications', label: 'Notifikace', icon: Bell, Component: OperationsNotifications },
  { id: 'invoicing', label: 'Fakturace', icon: Receipt, Component: InvoicingSettings },
  { id: 'pricing', label: 'Ceník a sazby', icon: DollarSign, Component: PricingSettings },
  { id: 'drive', label: 'Google Drive', icon: HardDrive, Component: CompanyDriveMapper },
  { id: 'raynet', label: 'Raynet CRM', icon: Link2, Component: CompanyRaynetMapper },
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
        >
          <Component />
        </CollapsibleSection>
      ))}
    </div>
  )
}
