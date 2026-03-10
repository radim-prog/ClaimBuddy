'use client'

import { useState } from 'react'
import { FileText, Download } from 'lucide-react'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { SystemAudit } from '@/components/admin/system-audit'
import { SystemExport } from '@/components/admin/system-export'

const sections = [
  { id: 'audit', label: 'Audit logy', icon: FileText, Component: SystemAudit },
  { id: 'export', label: 'Export dat', icon: Download, Component: SystemExport },
] as const

export default function SystemPage() {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['audit']))

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
