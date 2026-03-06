'use client'

import { useState } from 'react'
import { CalendarDays, Clock, Briefcase } from 'lucide-react'
import { CollapsibleSection } from '@/components/collapsible-section'
import { WorkOverviewSection } from '@/components/accountant/work-overview-section'
import { QuickTimeLog } from '@/components/quick-time-log'
import { PrepaidProjectsSection } from '@/components/prepaid/prepaid-projects-section'
import { TileContainer } from '@/components/tiles/tile-container'
import type { TileDefinition } from '@/lib/types/layout'
import { useCompany } from '../layout'

const PRACE_TILES: TileDefinition[] = [
  { id: 'work-overview', label: 'Pracovní přehled', defaultVisible: true },
  { id: 'time-log', label: 'Odpracovaný čas', defaultVisible: true },
  { id: 'prepaid-projects', label: 'Předplacené projekty', defaultVisible: true },
]

export default function WorkPage() {
  const { company, companyId } = useCompany()
  const [prepaidRefreshKey, setPrepaidRefreshKey] = useState(0)

  return (
    <TileContainer
      pageKey="client-detail-prace"
      definitions={PRACE_TILES}
      renderTile={(tileId) => {
        switch (tileId) {
          case 'work-overview':
            return (
              <CollapsibleSection id="work-overview" title="Pracovní přehled" icon={CalendarDays} defaultOpen={true}>
                <WorkOverviewSection companyId={companyId} vatPayer={company.vat_payer} vatPeriod={company.vat_period} accountingStartDate={company.accounting_start_date} />
              </CollapsibleSection>
            )
          case 'time-log':
            return (
              <CollapsibleSection id="time-log" title="Odpracovaný čas" icon={Clock} defaultOpen={true}>
                <QuickTimeLog companyId={companyId} companyName={company.name} onTimeLogged={() => setPrepaidRefreshKey(k => k + 1)} />
              </CollapsibleSection>
            )
          case 'prepaid-projects':
            return (
              <CollapsibleSection id="prepaid-projects" title="Předplacené projekty" icon={Briefcase} defaultOpen={true}>
                <PrepaidProjectsSection companyId={companyId} companyName={company.name} refreshTrigger={prepaidRefreshKey} />
              </CollapsibleSection>
            )
          default:
            return null
        }
      }}
    />
  )
}
