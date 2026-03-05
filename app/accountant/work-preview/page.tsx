'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, ChevronDown, FileText, ClipboardList, MessageSquare, Clock, BarChart3 } from 'lucide-react'
import { CaseSummaryPanel } from '@/components/work-preview/case-summary-panel'
import { ProgressNotesPanel } from '@/components/work-preview/progress-notes-panel'
import { TasksPanel } from '@/components/work-preview/tasks-panel'
import { BillingReport } from '@/components/work-preview/billing-report'
import { CaseTimeline } from '@/components/case/case-timeline'
import { CaseDocuments } from '@/components/case/case-documents'
import { CaseBudgetCard } from '@/components/case/case-budget-card'

type Tab = 'summary' | 'notes' | 'tasks' | 'documents' | 'timeline'

interface Project {
  id: string
  title: string
  status: string
  company_id?: string
  is_case?: boolean
}

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'summary', label: 'Souhrn', icon: BarChart3 },
  { id: 'notes', label: 'Poznámky', icon: MessageSquare },
  { id: 'tasks', label: 'Úkoly', icon: ClipboardList },
  { id: 'documents', label: 'Dokumenty', icon: FileText },
  { id: 'timeline', label: 'Timeline', icon: Clock },
]

export default function WorkPreviewPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [activeTab, setActiveTab] = useState<Tab>('summary')
  const [loading, setLoading] = useState(true)
  const [showBilling, setShowBilling] = useState(false)

  useEffect(() => {
    fetch('/api/projects', {
      headers: { 'x-user-id': 'radim' },
    })
      .then(r => r.json())
      .then(data => {
        const list = data.projects || []
        setProjects(list)
        if (list.length > 0) setSelectedId(list[0].id)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const selectedProject = projects.find(p => p.id === selectedId)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="max-w-3xl mx-auto py-12">
        <Card className="rounded-xl shadow-soft">
          <CardContent className="p-12 text-center">
            <h1 className="text-2xl font-bold font-display mb-4">Pracovní pohled</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Zatím nemáte žádné projekty. Vytvořte projekt v sekci Práce, abyste mohli tento pohled otestovat.
            </p>
            <Badge variant="outline" className="text-sm">DEMO</Badge>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-display text-gray-900 dark:text-white">Pracovní pohled</h1>
            <Badge variant="outline" className="text-xs">DEMO</Badge>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Sloučený koncept: mock design + produkční data
          </p>
        </div>
      </div>

      {/* Project selector */}
      <Card className="rounded-xl shadow-soft">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Projekt:</span>
            <Select value={selectedId} onValueChange={v => { setSelectedId(v); setActiveTab('summary') }}>
              <SelectTrigger className="w-[400px]">
                <SelectValue placeholder="Vyberte projekt" />
              </SelectTrigger>
              <SelectContent>
                {projects.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    <span className="flex items-center gap-2">
                      {p.title}
                      <Badge variant="secondary" className="text-xs ml-2">{p.status}</Badge>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 5-tab interface */}
      {selectedId && (
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
            {activeTab === 'summary' && <CaseSummaryPanel projectId={selectedId} />}
            {activeTab === 'notes' && <ProgressNotesPanel projectId={selectedId} />}
            {activeTab === 'tasks' && <TasksPanel projectId={selectedId} />}
            {activeTab === 'documents' && <CaseDocuments projectId={selectedId} />}
            {activeTab === 'timeline' && <CaseTimeline projectId={selectedId} />}
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
                Přehled hodin a fakturace
              </span>
              <ChevronDown className={`h-4 w-4 transition-transform ${showBilling ? 'rotate-180' : ''}`} />
            </Button>
            {showBilling && (
              <div className="mt-4">
                <BillingReport projectId={selectedId} />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
