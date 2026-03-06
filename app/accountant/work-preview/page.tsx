'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Loader2, ChevronDown, FileText, ClipboardList, Clock, BarChart3,
  Briefcase, Wrench,
} from 'lucide-react'
import { CaseSummaryPanel } from '@/components/work-preview/case-summary-panel'
import { TimelineTasksPanel } from '@/components/work-preview/timeline-tasks-panel'
import { BillingReport } from '@/components/work-preview/billing-report'
import { CaseTimeline } from '@/components/case/case-timeline'
import { CaseDocuments } from '@/components/case/case-documents'
import { PrepaidProjectsSection } from '@/components/prepaid/prepaid-projects-section'
import { QuickTimeLog } from '@/components/quick-time-log'
import { WorkOverviewSection } from '@/components/accountant/work-overview-section'

type Tab = 'summary' | 'timeline' | 'tasks' | 'projects' | 'documents' | 'work'

interface Company {
  id: string
  name: string
  ico: string
  status: string
  vat_payer?: boolean
  vat_period?: string | null
}

interface Project {
  id: string
  title?: string
  name?: string
  status: string
  company_id?: string
}

interface HeaderStats {
  tasksCompleted: number
  tasksTotal: number
  totalMinutes: number
  billableAmount: number
}

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'summary', label: 'Souhrn', icon: BarChart3 },
  { id: 'timeline', label: 'Timeline', icon: Clock },
  { id: 'tasks', label: 'Ukoly', icon: ClipboardList },
  { id: 'projects', label: 'Projekty', icon: Briefcase },
  { id: 'documents', label: 'Dokumenty', icon: FileText },
  { id: 'work', label: 'Prace', icon: Wrench },
]

function formatMinutes(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0 && m === 0) return '0 min'
  if (h === 0) return `${m} min`
  if (m === 0) return `${h} hod`
  return `${h} hod ${m} min`
}

export default function WorkPreviewPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('')
  const [projects, setProjects] = useState<Project[]>([])
  const [activeTab, setActiveTab] = useState<Tab>('summary')
  const [loading, setLoading] = useState(true)
  const [showBilling, setShowBilling] = useState(false)
  const [stats, setStats] = useState<HeaderStats>({
    tasksCompleted: 0, tasksTotal: 0, totalMinutes: 0, billableAmount: 0,
  })
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Load companies
  useEffect(() => {
    fetch('/api/accountant/companies', {
      headers: { 'x-user-id': 'radim' },
    })
      .then(r => r.json())
      .then(data => {
        const list = (data.companies || []).filter((c: Company) => c.status === 'active')
        setCompanies(list)
        if (list.length > 0) setSelectedCompanyId(list[0].id)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const selectedCompany = companies.find(c => c.id === selectedCompanyId)

  // Load projects + stats when company changes
  useEffect(() => {
    if (!selectedCompanyId) return

    const headers: Record<string, string> = { 'x-user-id': 'radim', 'x-user-name': 'Radim Zajicek' }
    const now = new Date()
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    Promise.all([
      fetch(`/api/projects?company_id=${selectedCompanyId}`, { headers })
        .then(r => r.json()).catch(() => ({ projects: [] })),
      fetch(`/api/tasks?company_id=${selectedCompanyId}&page_size=100`, { headers })
        .then(r => r.json()).catch(() => ({ tasks: [] })),
      fetch(`/api/time-entries?company_id=${selectedCompanyId}&period=${period}&limit=200`, { headers })
        .then(r => r.json()).catch(() => ({ entries: [] })),
    ]).then(([projectsData, tasksData, timeData]) => {
      setProjects(projectsData.projects || [])

      const tasks = tasksData.tasks || []
      const completedCount = tasks.filter((t: any) => t.status === 'completed').length

      let totalMins = 0
      let billable = 0
      const entries = timeData.entries || []
      for (const e of entries) {
        const mins = e.minutes || Math.round((e.hours || 0) * 60)
        totalMins += mins
        if (e.billable && !e.in_tariff) {
          billable += (mins / 60) * (e.hourly_rate || 700)
        }
      }

      setStats({
        tasksCompleted: completedCount,
        tasksTotal: tasks.length,
        totalMinutes: totalMins,
        billableAmount: Math.round(billable),
      })
    })
  }, [selectedCompanyId, refreshTrigger])

  // First project for timeline/docs/summary tabs
  const firstProjectId = projects.length > 0 ? projects[0].id : null

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (companies.length === 0) {
    return (
      <div className="max-w-3xl mx-auto py-12">
        <Card className="rounded-xl shadow-soft">
          <CardContent className="p-12 text-center">
            <h1 className="text-2xl font-bold font-display mb-4">Pracovni pohled</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Zatim nemate zadne aktivni klienty.
            </p>
            <Badge variant="outline" className="text-sm">DEMO</Badge>
          </CardContent>
        </Card>
      </div>
    )
  }

  const tasksPercent = stats.tasksTotal > 0
    ? Math.round((stats.tasksCompleted / stats.tasksTotal) * 100)
    : 0

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold font-display text-gray-900 dark:text-white">
            Pracovni pohled
          </h1>
          <Badge variant="outline" className="text-xs">DEMO</Badge>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Slouceny koncept: Osa + Prace
        </p>
      </div>

      {/* Company selector */}
      <Card className="rounded-xl shadow-soft">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Klient:</span>
            <Select
              value={selectedCompanyId}
              onValueChange={v => { setSelectedCompanyId(v); setActiveTab('summary') }}
            >
              <SelectTrigger className="w-[400px]">
                <SelectValue placeholder="Vyberte klienta" />
              </SelectTrigger>
              <SelectContent>
                {companies.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Header stat cards */}
      {selectedCompanyId && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="rounded-xl shadow-soft-sm">
            <CardContent className="p-4">
              <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">Ukoly</div>
              <div className="text-3xl font-bold">
                {stats.tasksCompleted}/{stats.tasksTotal}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {stats.tasksTotal > 0 ? `${tasksPercent}% dokonceno` : 'Zadne ukoly'}
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl shadow-soft-sm">
            <CardContent className="p-4">
              <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">Odpracovano</div>
              <div className="text-2xl font-bold">{formatMinutes(stats.totalMinutes)}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">tento mesic</div>
            </CardContent>
          </Card>
          <Card className="rounded-xl shadow-soft-sm">
            <CardContent className="p-4">
              <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">K fakturaci</div>
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                {stats.billableAmount.toLocaleString('cs-CZ')} Kc
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">tento mesic</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 6-tab interface */}
      {selectedCompanyId && (
        <>
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex gap-1">
              {TABS.map(tab => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                      isActive
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tab content */}
          <div className="min-h-[400px]">
            {/* Tab 1: Souhrn */}
            {activeTab === 'summary' && firstProjectId && (
              <CaseSummaryPanel projectId={firstProjectId} />
            )}
            {activeTab === 'summary' && !firstProjectId && (
              <NoProjectMessage message="Tento klient zatim nema zadne projekty/spisy pro zobrazeni souhrnu." />
            )}

            {/* Tab 2: Timeline */}
            {activeTab === 'timeline' && firstProjectId && (
              <CaseTimeline projectId={firstProjectId} />
            )}
            {activeTab === 'timeline' && !firstProjectId && (
              <NoProjectMessage message="Tento klient zatim nema zadne spisy pro timeline." />
            )}

            {/* Tab 3: Ukoly (new timeline visual + GTD) */}
            {activeTab === 'tasks' && (
              <TimelineTasksPanel
                companyId={selectedCompanyId}
                companyName={selectedCompany?.name || ''}
              />
            )}

            {/* Tab 4: Projekty (prepaid) */}
            {activeTab === 'projects' && (
              <PrepaidProjectsSection
                companyId={selectedCompanyId}
                companyName={selectedCompany?.name || ''}
                refreshTrigger={refreshTrigger}
              />
            )}

            {/* Tab 5: Dokumenty */}
            {activeTab === 'documents' && firstProjectId && (
              <CaseDocuments projectId={firstProjectId} />
            )}
            {activeTab === 'documents' && !firstProjectId && (
              <NoProjectMessage message="Tento klient zatim nema zadne dokumenty ve spisu." />
            )}

            {/* Tab 6: Prace (WorkOverview + QuickTimeLog) */}
            {activeTab === 'work' && (
              <div className="space-y-6">
                <WorkOverviewSection
                  companyId={selectedCompanyId}
                  vatPayer={selectedCompany?.vat_payer}
                  vatPeriod={(selectedCompany?.vat_period as 'monthly' | 'quarterly') || null}
                />
                <QuickTimeLog
                  companyId={selectedCompanyId}
                  companyName={selectedCompany?.name || ''}
                  onTimeLogged={() => setRefreshTrigger(t => t + 1)}
                />
              </div>
            )}
          </div>

          {/* Billing report toggle */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowBilling(!showBilling)}
              className="w-full justify-between"
            >
              <span className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Prehled hodin a fakturace
              </span>
              <ChevronDown className={`h-4 w-4 transition-transform ${showBilling ? 'rotate-180' : ''}`} />
            </Button>
            {showBilling && firstProjectId && (
              <div className="mt-4">
                <BillingReport projectId={firstProjectId} />
              </div>
            )}
            {showBilling && !firstProjectId && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Zadny projekt pro zobrazeni fakturace
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function NoProjectMessage({ message }: { message: string }) {
  return (
    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
      {message}
    </div>
  )
}
