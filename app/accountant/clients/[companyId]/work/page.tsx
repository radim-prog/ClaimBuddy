'use client'

import { useState } from 'react'
import { CalendarDays, Clock, Briefcase, ClipboardList, MessageCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { CollapsibleSection } from '@/components/collapsible-section'
import { AccountantMessagesSection } from '@/components/accountant/messages-section'
import { AccountantTasksSection } from '@/components/accountant/tasks-section'
import { WorkOverviewSection } from '@/components/accountant/work-overview-section'
import { QuickTimeLog } from '@/components/quick-time-log'
import { PrepaidProjectsSection } from '@/components/prepaid/prepaid-projects-section'
import { TileContainer } from '@/components/tiles/tile-container'
import type { TileDefinition } from '@/lib/types/layout'
import { useAttention } from '@/lib/contexts/attention-context'
import { useCompany } from '../layout'

const PRACE_TILES: TileDefinition[] = [
  { id: 'work-overview', label: 'Pracovn\u00ed p\u0159ehled', defaultVisible: true },
  { id: 'time-log', label: 'Odpracovan\u00fd \u010das', defaultVisible: true },
  { id: 'prepaid-projects', label: 'P\u0159edplacen\u00e9 projekty', defaultVisible: true },
  { id: 'tasks', label: '\u00dakoly', defaultVisible: true },
  { id: 'messages', label: 'Zpr\u00e1vy', defaultVisible: true },
]

export default function WorkPage() {
  const { company, companyId, tasks, setTasks } = useCompany()
  const attention = useAttention().getCompanyAttention(companyId)
  const [prepaidRefreshKey, setPrepaidRefreshKey] = useState(0)

  return (
    <TileContainer
      pageKey="client-detail-prace"
      definitions={PRACE_TILES}
      renderTile={(tileId) => {
        switch (tileId) {
          case 'work-overview':
            return (
              <CollapsibleSection id="work-overview" title="Pracovn\u00ed p\u0159ehled" icon={CalendarDays} defaultOpen={true}>
                <WorkOverviewSection companyId={companyId} vatPayer={company.vat_payer} vatPeriod={company.vat_period} accountingStartDate={company.accounting_start_date} />
              </CollapsibleSection>
            )
          case 'time-log':
            return (
              <CollapsibleSection id="time-log" title="Odpracovan\u00fd \u010das" icon={Clock} defaultOpen={true}>
                <QuickTimeLog companyId={companyId} companyName={company.name} onTimeLogged={() => setPrepaidRefreshKey(k => k + 1)} />
              </CollapsibleSection>
            )
          case 'prepaid-projects':
            return (
              <CollapsibleSection id="prepaid-projects" title="P\u0159edplacen\u00e9 projekty" icon={Briefcase} defaultOpen={true}>
                <PrepaidProjectsSection companyId={companyId} companyName={company.name} refreshTrigger={prepaidRefreshKey} />
              </CollapsibleSection>
            )
          case 'tasks':
            return (
              <CollapsibleSection
                id="tasks" title="\u00dakoly" icon={ClipboardList} defaultOpen={true}
                badge={tasks.filter(t => t.status !== 'completed' && t.status !== 'someday_maybe').length > 0 && (
                  <Badge variant="secondary" className="ml-2 rounded-md">{tasks.filter(t => t.status !== 'completed' && t.status !== 'someday_maybe').length}</Badge>
                )}
              >
                <AccountantTasksSection companyId={companyId} companyName={company.name} tasks={tasks} onTasksChange={setTasks} />
              </CollapsibleSection>
            )
          case 'messages':
            return (
              <CollapsibleSection
                id="messages" title="Zpr\u00e1vy" icon={MessageCircle} defaultOpen={true}
                badge={attention.unread_messages > 0 && (
                  <Badge variant="destructive" className="ml-2 rounded-md">{attention.unread_messages}</Badge>
                )}
              >
                <AccountantMessagesSection companyId={companyId} companyName={company.name} />
              </CollapsibleSection>
            )
          default:
            return null
        }
      }}
    />
  )
}
