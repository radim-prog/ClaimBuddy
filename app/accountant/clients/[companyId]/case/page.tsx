'use client'

import { useState, useEffect, useCallback } from 'react'
import { useCompany } from '../layout'
import { useAccountantUser } from '@/lib/contexts/accountant-user-context'
import {
  Briefcase, Plus, ArrowLeft, FileText, MessageSquare,
  CheckSquare, FolderOpen, Clock, AlertTriangle, ChevronRight,
  Trash2, CalendarDays, User, Loader2, X
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { CaseTimeline } from '@/components/case/case-timeline'
import { CaseDocuments } from '@/components/case/case-documents'
import { CaseBudgetCard } from '@/components/case/case-budget-card'
import type { CaseType } from '@/lib/types/project'
import type { Task } from '@/lib/types/tasks'

// ============================================
// TYPES
// ============================================

interface CaseProject {
  id: string
  name: string
  case_number: string | null
  case_type_id: string | null
  status: string
  case_opened_at: string | null
  case_closed_at: string | null
  hourly_rate: number | null
  client_visible: boolean | null
  case_opposing_party: string | null
  case_reference: string | null
}

interface ProgressNote {
  id: string
  project_id: string
  author_id: string | null
  author_name: string
  current_status: string
  problems: string | null
  next_steps: string | null
  note: string | null
  created_at: string
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function CasePage() {
  const { companyId, company } = useCompany()
  const { userName } = useAccountantUser()

  const [cases, setCases] = useState<CaseProject[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCase, setSelectedCase] = useState<CaseProject | null>(null)
  const [activeTab, setActiveTab] = useState<'summary' | 'notes' | 'tasks' | 'documents' | 'timeline'>('summary')

  // New case dialog
  const [showNewCase, setShowNewCase] = useState(false)
  const [caseTypes, setCaseTypes] = useState<CaseType[]>([])
  const [newCaseName, setNewCaseName] = useState('')
  const [newCaseTypeId, setNewCaseTypeId] = useState('')
  const [newCaseOpposing, setNewCaseOpposing] = useState('')
  const [newCaseReference, setNewCaseReference] = useState('')
  const [newCaseRate, setNewCaseRate] = useState('')
  const [creating, setCreating] = useState(false)

  // Fetch cases
  const fetchCases = useCallback(async () => {
    try {
      const res = await fetch(`/api/accountant/companies/${companyId}/cases`)
      if (res.ok) {
        const data = await res.json()
        setCases(data.cases || [])
        // If only one case, select it automatically
        if (data.cases?.length === 1 && !selectedCase) {
          setSelectedCase(data.cases[0])
        }
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [companyId, selectedCase])

  useEffect(() => {
    fetchCases()
  }, [fetchCases])

  // Fetch case types for new case dialog
  useEffect(() => {
    if (showNewCase && caseTypes.length === 0) {
      fetch('/api/case-types')
        .then(r => r.json())
        .then(data => setCaseTypes(data.case_types || []))
        .catch(() => {})
    }
  }, [showNewCase, caseTypes.length])

  const handleCreateCase = async () => {
    if (!newCaseName.trim()) return
    setCreating(true)
    try {
      const res = await fetch(`/api/accountant/companies/${companyId}/cases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCaseName.trim(),
          case_type_id: newCaseTypeId || undefined,
          case_opposing_party: newCaseOpposing.trim() || undefined,
          case_reference: newCaseReference.trim() || undefined,
          hourly_rate: newCaseRate ? parseFloat(newCaseRate) : undefined,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setCases(prev => [data.case, ...prev])
        setSelectedCase(data.case)
        setShowNewCase(false)
        setNewCaseName('')
        setNewCaseTypeId('')
        setNewCaseOpposing('')
        setNewCaseReference('')
        setNewCaseRate('')
      }
    } catch {
      // silently fail
    } finally {
      setCreating(false)
    }
  }

  // Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
      </div>
    )
  }

  // ---- Level 2: Case Detail ----
  if (selectedCase) {
    return (
      <CaseDetail
        caseProject={selectedCase}
        companyName={company.name}
        userName={userName}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onBack={() => { setSelectedCase(null); setActiveTab('summary') }}
      />
    )
  }

  // ---- Level 1: Case List ----
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-purple-500" />
          Spisy firmy {company.name}
        </h2>
        <Button
          size="sm"
          className="rounded-xl bg-purple-500 hover:bg-purple-600 text-white"
          onClick={() => setShowNewCase(true)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Nový spis
        </Button>
      </div>

      {/* New case form */}
      {showNewCase && (
        <Card className="rounded-xl border-purple-200 dark:border-purple-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Vytvořit nový spis</CardTitle>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setShowNewCase(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Název spisu *</label>
              <Input
                value={newCaseName}
                onChange={e => setNewCaseName(e.target.value)}
                placeholder="Např. Daňová kontrola 2025"
                className="rounded-lg"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Typ spisu</label>
                <select
                  value={newCaseTypeId}
                  onChange={e => {
                    setNewCaseTypeId(e.target.value)
                    const ct = caseTypes.find(c => c.id === e.target.value)
                    if (ct?.default_hourly_rate && !newCaseRate) {
                      setNewCaseRate(ct.default_hourly_rate.toString())
                    }
                  }}
                  className="w-full h-9 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm"
                >
                  <option value="">Vyberte typ...</option>
                  {caseTypes.map(ct => (
                    <option key={ct.id} value={ct.id}>{ct.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Hodinová sazba</label>
                <Input
                  type="number"
                  value={newCaseRate}
                  onChange={e => setNewCaseRate(e.target.value)}
                  placeholder="1500"
                  className="rounded-lg"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Protistrana</label>
                <Input
                  value={newCaseOpposing}
                  onChange={e => setNewCaseOpposing(e.target.value)}
                  placeholder="Např. Finanční úřad"
                  className="rounded-lg"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Spisová značka</label>
                <Input
                  value={newCaseReference}
                  onChange={e => setNewCaseReference(e.target.value)}
                  placeholder="Např. 12345/2025"
                  className="rounded-lg"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" size="sm" className="rounded-lg" onClick={() => setShowNewCase(false)}>
                Zrušit
              </Button>
              <Button
                size="sm"
                className="rounded-lg bg-purple-500 hover:bg-purple-600 text-white"
                onClick={handleCreateCase}
                disabled={!newCaseName.trim() || creating}
              >
                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                Vytvořit
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Case list */}
      {cases.length === 0 ? (
        <Card className="rounded-xl">
          <CardContent className="py-12 text-center">
            <Briefcase className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Zatím žádné spisy</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Vytvořte první spis tlačítkem &quot;+ Nový spis&quot;
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {cases.map(c => (
            <Card
              key={c.id}
              className="rounded-xl cursor-pointer hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
              onClick={() => setSelectedCase(c)}
            >
              <CardContent className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-purple-100 dark:bg-purple-900/30 shrink-0">
                    <Briefcase className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {c.case_number && (
                        <span className="text-xs font-mono text-purple-600 dark:text-purple-400">{c.case_number}</span>
                      )}
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{c.name}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {c.case_opened_at && (
                        <span className="text-xs text-gray-400">
                          {new Date(c.case_opened_at).toLocaleDateString('cs-CZ')}
                        </span>
                      )}
                      {c.case_opposing_party && (
                        <span className="text-xs text-gray-400">vs. {c.case_opposing_party}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    variant="outline"
                    className={
                      c.status === 'active'
                        ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                        : c.status === 'completed'
                        ? 'bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
                        : 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800'
                    }
                  >
                    {c.status === 'active' ? 'Aktivní' : c.status === 'completed' ? 'Uzavřeno' : c.status}
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================
// CASE DETAIL (Level 2)
// ============================================

function CaseDetail({
  caseProject,
  companyName,
  userName,
  activeTab,
  setActiveTab,
  onBack,
}: {
  caseProject: CaseProject
  companyName: string
  userName: string
  activeTab: 'summary' | 'notes' | 'tasks' | 'documents' | 'timeline'
  setActiveTab: (tab: 'summary' | 'notes' | 'tasks' | 'documents' | 'timeline') => void
  onBack: () => void
}) {
  const tabs = [
    { key: 'summary' as const, label: 'Souhrn', icon: FileText },
    { key: 'notes' as const, label: 'Poznámky', icon: MessageSquare },
    { key: 'tasks' as const, label: 'Úkoly', icon: CheckSquare },
    { key: 'documents' as const, label: 'Dokumenty', icon: FolderOpen },
    { key: 'timeline' as const, label: 'Osa', icon: Clock },
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="rounded-xl text-gray-500 hover:text-gray-700 shrink-0" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Zpět
        </Button>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {caseProject.case_number && (
              <span className="text-sm font-mono text-purple-600 dark:text-purple-400 shrink-0">{caseProject.case_number}</span>
            )}
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{caseProject.name}</h2>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-0.5 -mx-1 px-1">
        {tabs.map(tab => (
          <Button
            key={tab.key}
            variant={activeTab === tab.key ? 'default' : 'ghost'}
            size="sm"
            className={`rounded-xl shrink-0 text-xs h-8 ${
              activeTab === tab.key
                ? 'bg-purple-500 hover:bg-purple-600 text-white shadow-soft-sm'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            <tab.icon className="h-3.5 w-3.5 mr-1" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'summary' && <SummaryTab caseProject={caseProject} />}
      {activeTab === 'notes' && <NotesTab projectId={caseProject.id} userName={userName} />}
      {activeTab === 'tasks' && <TasksTab projectId={caseProject.id} />}
      {activeTab === 'documents' && <CaseDocuments projectId={caseProject.id} />}
      {activeTab === 'timeline' && <CaseTimeline projectId={caseProject.id} />}
    </div>
  )
}

// ============================================
// TAB 1: Summary
// ============================================

function SummaryTab({ caseProject }: { caseProject: CaseProject }) {
  const [latestNote, setLatestNote] = useState<ProgressNote | null>(null)

  useEffect(() => {
    fetch(`/api/projects/${caseProject.id}/progress-notes`)
      .then(r => r.json())
      .then(data => {
        if (data.notes?.length > 0) setLatestNote(data.notes[0])
      })
      .catch(() => {})
  }, [caseProject.id])

  return (
    <div className="space-y-4">
      {/* Metadata */}
      <Card className="rounded-xl">
        <CardContent className="py-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-xs text-gray-400 block">Číslo spisu</span>
              <span className="font-mono text-purple-600 dark:text-purple-400">{caseProject.case_number || '—'}</span>
            </div>
            <div>
              <span className="text-xs text-gray-400 block">Stav</span>
              <Badge variant="outline" className={
                caseProject.status === 'active'
                  ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400'
              }>
                {caseProject.status === 'active' ? 'Aktivní' : caseProject.status === 'completed' ? 'Uzavřeno' : caseProject.status}
              </Badge>
            </div>
            <div>
              <span className="text-xs text-gray-400 block">Datum otevření</span>
              <span>{caseProject.case_opened_at ? new Date(caseProject.case_opened_at).toLocaleDateString('cs-CZ') : '—'}</span>
            </div>
            {caseProject.case_opposing_party && (
              <div>
                <span className="text-xs text-gray-400 block">Protistrana</span>
                <span>{caseProject.case_opposing_party}</span>
              </div>
            )}
            {caseProject.case_reference && (
              <div>
                <span className="text-xs text-gray-400 block">Spisová značka</span>
                <span className="font-mono">{caseProject.case_reference}</span>
              </div>
            )}
            {caseProject.hourly_rate && (
              <div>
                <span className="text-xs text-gray-400 block">Hodinová sazba</span>
                <span>{caseProject.hourly_rate.toLocaleString('cs-CZ')} Kč/hod</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Budget */}
      <CaseBudgetCard projectId={caseProject.id} />

      {/* Latest progress note */}
      {latestNote && (
        <Card className="rounded-xl border-l-4 border-l-blue-400">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Poslední poznámka
              <span className="text-xs text-gray-400 ml-auto">
                {new Date(latestNote.created_at).toLocaleDateString('cs-CZ')} &middot; {latestNote.author_name}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Aktuální stav:</span>
              <p className="text-sm">{latestNote.current_status}</p>
            </div>
            {latestNote.problems && (
              <div>
                <span className="text-xs font-medium text-red-600 dark:text-red-400">Problémy:</span>
                <p className="text-sm">{latestNote.problems}</p>
              </div>
            )}
            {latestNote.next_steps && (
              <div>
                <span className="text-xs font-medium text-green-600 dark:text-green-400">Další kroky:</span>
                <p className="text-sm">{latestNote.next_steps}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ============================================
// TAB 2: Progress Notes
// ============================================

function NotesTab({ projectId, userName }: { projectId: string; userName: string }) {
  const [notes, setNotes] = useState<ProgressNote[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form fields
  const [currentStatus, setCurrentStatus] = useState('')
  const [problems, setProblems] = useState('')
  const [nextSteps, setNextSteps] = useState('')
  const [noteText, setNoteText] = useState('')

  useEffect(() => {
    fetch(`/api/projects/${projectId}/progress-notes`)
      .then(r => r.json())
      .then(data => setNotes(data.notes || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [projectId])

  const handleSubmit = async () => {
    if (!currentStatus.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/progress-notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_status: currentStatus.trim(),
          problems: problems.trim() || undefined,
          next_steps: nextSteps.trim() || undefined,
          note: noteText.trim() || undefined,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setNotes(prev => [data.note, ...prev])
        setCurrentStatus('')
        setProblems('')
        setNextSteps('')
        setNoteText('')
        setShowForm(false)
      }
    } catch {
      // silently fail
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (noteId: string) => {
    const res = await fetch(`/api/projects/${projectId}/progress-notes?noteId=${noteId}`, {
      method: 'DELETE',
    })
    if (res.ok) {
      setNotes(prev => prev.filter(n => n.id !== noteId))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Poznámky o průběhu ({notes.length})
        </h3>
        <Button
          size="sm"
          variant={showForm ? 'ghost' : 'default'}
          className={showForm ? 'rounded-lg' : 'rounded-lg bg-purple-500 hover:bg-purple-600 text-white'}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? <X className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
          {showForm ? 'Zrušit' : 'Nový záznam'}
        </Button>
      </div>

      {/* New note form - medical record style */}
      {showForm && (
        <Card className="rounded-xl border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/10">
          <CardContent className="py-4 space-y-3">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
              <CalendarDays className="h-3.5 w-3.5" />
              {new Date().toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' })}
              <User className="h-3.5 w-3.5 ml-2" />
              {userName || 'Účetní'}
            </div>
            <div>
              <label className="text-xs font-semibold text-blue-700 dark:text-blue-400 block mb-1">
                Aktuální stav *
              </label>
              <Textarea
                value={currentStatus}
                onChange={e => setCurrentStatus(e.target.value)}
                placeholder="Popište aktuální stav věci..."
                className="rounded-lg min-h-[60px] text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-red-600 dark:text-red-400 block mb-1">
                Problémy / překážky
              </label>
              <Textarea
                value={problems}
                onChange={e => setProblems(e.target.value)}
                placeholder="Problémy, rizika, překážky..."
                className="rounded-lg min-h-[40px] text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-green-700 dark:text-green-400 block mb-1">
                Další kroky
              </label>
              <Textarea
                value={nextSteps}
                onChange={e => setNextSteps(e.target.value)}
                placeholder="Co bude následovat..."
                className="rounded-lg min-h-[40px] text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">
                Volná poznámka
              </label>
              <Textarea
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="Cokoliv dalšího..."
                className="rounded-lg min-h-[40px] text-sm"
              />
            </div>
            <div className="flex justify-end">
              <Button
                size="sm"
                className="rounded-lg bg-purple-500 hover:bg-purple-600 text-white"
                onClick={handleSubmit}
                disabled={!currentStatus.trim() || submitting}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                Uložit záznam
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes list */}
      {notes.length === 0 ? (
        <Card className="rounded-xl">
          <CardContent className="py-8 text-center">
            <MessageSquare className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Zatím žádné záznamy o průběhu</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notes.map(n => (
            <Card key={n.id} className="rounded-xl border-l-4 border-l-blue-300 dark:border-l-blue-700">
              <CardContent className="py-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <CalendarDays className="h-3 w-3" />
                    {new Date(n.created_at).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' })}
                    <span>&middot;</span>
                    <span>{n.author_name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-gray-300 hover:text-red-500"
                    onClick={() => handleDelete(n.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <div className="space-y-1.5">
                  <div>
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">Stav: </span>
                    <span className="text-sm">{n.current_status}</span>
                  </div>
                  {n.problems && (
                    <div>
                      <span className="text-xs font-semibold text-red-500 dark:text-red-400 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Problémy:
                      </span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{n.problems}</span>
                    </div>
                  )}
                  {n.next_steps && (
                    <div>
                      <span className="text-xs font-semibold text-green-600 dark:text-green-400">Další kroky: </span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{n.next_steps}</span>
                    </div>
                  )}
                  {n.note && (
                    <div className="mt-1 pt-1 border-t border-gray-100 dark:border-gray-800">
                      <span className="text-sm text-gray-600 dark:text-gray-400 italic">{n.note}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================
// TAB 3: Tasks
// ============================================

function TasksTab({ projectId }: { projectId: string }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/tasks?project_id=${projectId}`)
      .then(r => r.json())
      .then(data => setTasks(data.tasks || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [projectId])

  const toggleTask = async (taskId: string, isCompleted: boolean) => {
    const newStatus: Task['status'] = isCompleted ? 'pending' : 'completed'
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
      </div>
    )
  }

  const priorityColors: Record<string, string> = {
    high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    urgent: 'bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  }

  const priorityLabels: Record<string, string> = {
    urgent: 'Urgentní',
    high: 'Vysoká',
    medium: 'Střední',
    low: 'Nízká',
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
        Úkoly spisu ({tasks.length})
      </h3>

      {tasks.length === 0 ? (
        <Card className="rounded-xl">
          <CardContent className="py-8 text-center">
            <CheckSquare className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Žádné úkoly přiřazené ke spisu</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {tasks.map(task => {
            const isDone = task.status === 'completed'
            return (
              <Card key={task.id} className={`rounded-xl ${isDone ? 'opacity-60' : ''}`}>
                <CardContent className="py-3 flex items-center gap-3">
                  <button
                    className={`shrink-0 h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${
                      isDone
                        ? 'bg-purple-500 border-purple-500 text-white'
                        : 'border-gray-300 dark:border-gray-600 hover:border-purple-400'
                    }`}
                    onClick={() => toggleTask(task.id, isDone)}
                  >
                    {isDone && <CheckSquare className="h-3 w-3" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${isDone ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {task.priority && (
                        <Badge variant="outline" className={`text-[10px] ${priorityColors[task.priority] || ''}`}>
                          {priorityLabels[task.priority] || task.priority}
                        </Badge>
                      )}
                      {task.due_date && (
                        <span className="text-xs text-gray-400">
                          {new Date(task.due_date).toLocaleDateString('cs-CZ')}
                        </span>
                      )}
                      {task.assigned_to_name && (
                        <span className="text-xs text-gray-400">{task.assigned_to_name}</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
