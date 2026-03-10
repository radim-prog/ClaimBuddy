'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CaseTimeline } from '@/components/case/case-timeline'
import { CaseDocuments } from '@/components/case/case-documents'
import { DocumentLinksPanel } from '@/components/documents/document-links-panel'
import { DocumentPicker } from '@/components/documents/document-picker'
import { UploadDialog } from '@/components/accountant/documents/upload-dialog'
import { ScoringWizard } from '@/components/gtd/scoring-wizard'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useAccountantUser } from '@/lib/contexts/accountant-user-context'
import {
  ArrowLeft,
  Calendar,
  User,
  Users,
  CheckCircle2,
  Circle,
  PauseCircle,
  PlayCircle,
  Target,
  Zap,
  Plus,
  XCircle,
  AlertCircle,
  FileText,
  Clock,
  TrendingUp,
  Pencil,
  ChevronDown,
  ChevronRight,
  ListTodo,
  Loader2,
  Paperclip,
  Trash2,
} from 'lucide-react'

type Project = {
  id: string
  title: string
  description: string | null
  outcome: string | null
  status: string
  company_id: string | null
  due_date: string | null
  estimated_hours: number | null
  actual_hours: number
  progress_percentage: number
  created_at: string
  is_case?: boolean
  case_number?: string
  case_type_id?: string
  case_opposing_party?: string
  case_reference?: string
  score_money?: number
  score_fire?: number
  score_time?: number
  score_distance?: number
  score_personal?: number
  assigned_to?: string
  assigned_to_name?: string
}

type TaskItem = {
  id: string
  title: string
  status: string
  assigned_to_name: string | null
  due_date: string | null
  is_next_action: boolean
  phase_id: string | null
}

type ProgressNote = {
  id: string
  current_status: string
  problems?: string | null
  next_steps?: string | null
  note?: string | null
  author_name?: string | null
  created_at: string
}

const calculateScore = (p: Project) =>
  (p.score_money || 0) + (p.score_fire || 0) + (p.score_time || 0) + (p.score_distance || 0) + (p.score_personal || 0)

const getScorePriority = (score: number): { label: string; color: string } => {
  if (score >= 9) return { label: 'Vysoka', color: 'text-white bg-red-500' }
  if (score >= 6) return { label: 'Stredni', color: 'text-white bg-orange-500' }
  return { label: 'Nizka', color: 'text-white bg-green-600' }
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  planning: { label: 'Planovani', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  active: { label: 'Aktivni', color: 'bg-green-100 text-green-700 border-green-300' },
  on_hold: { label: 'Pozastaveno', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  review: { label: 'K review', color: 'bg-purple-100 text-purple-700 border-purple-300' },
  completed: { label: 'Dokonceno', color: 'bg-gray-100 text-gray-600 border-gray-300' },
  cancelled: { label: 'Zruseno', color: 'bg-red-100 text-red-600 border-red-300' },
}

const SCORE_OPTIONS = {
  money: [
    { value: 0, label: '0 - <5k Kc', color: 'text-red-600' },
    { value: 1, label: '1 - 5k+ Kc', color: 'text-purple-600' },
    { value: 2, label: '2 - 15k+ Kc', color: 'text-blue-600' },
    { value: 3, label: '3 - 50k+ Kc', color: 'text-green-600' },
  ],
  fire: [
    { value: 0, label: '0 - Easy', color: 'text-green-600' },
    { value: 1, label: '1 - Normal', color: 'text-blue-600' },
    { value: 2, label: '2 - High', color: 'text-purple-600' },
    { value: 3, label: '3 - Critical', color: 'text-red-600' },
  ],
  time: [
    { value: 0, label: '0 - den+', color: 'text-red-600' },
    { value: 1, label: '1 - 2-4h', color: 'text-purple-600' },
    { value: 2, label: '2 - <1h', color: 'text-blue-600' },
    { value: 3, label: '3 - <30min', color: 'text-green-600' },
  ],
  distance: [
    { value: 0, label: '0 - Daleko', color: 'text-red-600' },
    { value: 1, label: '1 - Lokalne', color: 'text-blue-600' },
    { value: 2, label: '2 - PC', color: 'text-green-600' },
  ],
  personal: [
    { value: 0, label: '0 - Poor', color: 'text-red-600' },
    { value: 1, label: '1 - Good', color: 'text-green-600' },
  ],
}

type TabKey = 'spis' | 'ukoly' | 'dokumenty' | 'vykaz'

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { userId, userName } = useAccountantUser()
  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    const urlTab = searchParams.get('tab')
    if (urlTab && ['spis', 'ukoly', 'dokumenty', 'vykaz'].includes(urlTab)) return urlTab as TabKey
    return 'spis'
  })
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [addingTask, setAddingTask] = useState(false)
  const [progressNotes, setProgressNotes] = useState<ProgressNote[]>([])
  const [showRScorePanel, setShowRScorePanel] = useState(false)
  const [showScoreDialog, setShowScoreDialog] = useState(false)
  const [timelineComposerSignal, setTimelineComposerSignal] = useState(0)
  const [documentsCount, setDocumentsCount] = useState(0)
  const [timelineCount, setTimelineCount] = useState(0)
  const [lastActivityAt, setLastActivityAt] = useState<string | null>(null)
  // Delegate dialog
  const [showDelegateDialog, setShowDelegateDialog] = useState(false)
  const [delegateTo, setDelegateTo] = useState('')
  const [apiUsers, setApiUsers] = useState<{ id: string; name: string }[]>([])
  // Aggregated docs & time
  const [aggDocs, setAggDocs] = useState<any[]>([])
  const [aggTime, setAggTime] = useState<{ entries: any[]; totals: { total_minutes: number; billable_minutes: number } }>({ entries: [], totals: { total_minutes: 0, billable_minutes: 0 } })

  // Progress note form
  const [showAddNote, setShowAddNote] = useState(false)
  const [newNoteStatus, setNewNoteStatus] = useState('')
  const [newNoteProblems, setNewNoteProblems] = useState('')
  const [newNoteNextSteps, setNewNoteNextSteps] = useState('')
  const [newNoteText, setNewNoteText] = useState('')

  // Editing
  const [editingTitle, setEditingTitle] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editingDesc, setEditingDesc] = useState(false)
  const [editDesc, setEditDesc] = useState('')
  const [editingOutcome, setEditingOutcome] = useState(false)
  const [editOutcome, setEditOutcome] = useState('')

  useEffect(() => {
    if (!userId) return
    fetch(`/api/projects/${params.id}`, { headers: { 'x-user-id': userId } })
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error) }
        else { setProject(data.project); setTasks(data.tasks || []) }
        setLoading(false)
      })
      .catch(() => { setError('Nepodarilo se nacist projekt'); setLoading(false) })
  }, [params.id, userId])

  useEffect(() => {
    if (!userId) return
    fetch(`/api/projects/${params.id}/progress-notes`, { headers: { 'x-user-id': userId } })
      .then(r => r.json())
      .then(data => setProgressNotes(data.notes || []))
      .catch(() => setProgressNotes([]))
  }, [params.id, userId])

  const refreshCaseCounts = useCallback(() => {
    if (!userId) return
    fetch(`/api/projects/${params.id}/documents`, { headers: { 'x-user-id': userId } })
      .then(r => r.json())
      .then(data => setDocumentsCount((data.documents || []).length))
      .catch(() => setDocumentsCount(0))
    fetch(`/api/projects/${params.id}/timeline?page_size=1`, { headers: { 'x-user-id': userId } })
      .then(r => r.json())
      .then(data => {
        setTimelineCount(data.pagination?.total || 0)
        setLastActivityAt(data.entries?.[0]?.event_date || null)
      })
      .catch(() => { setTimelineCount(0); setLastActivityAt(null) })
  }, [params.id, userId])

  useEffect(() => { refreshCaseCounts() }, [refreshCaseCounts, activeTab])

  const fetchAggDocs = useCallback(() => {
    fetch(`/api/projects/${params.id}/aggregated-docs`, { headers: { 'x-user-id': userId || '' } })
      .then(r => r.json())
      .then(data => setAggDocs(data.documents || []))
      .catch(() => setAggDocs([]))
  }, [params.id, userId])

  const fetchAggTime = useCallback(() => {
    fetch(`/api/projects/${params.id}/aggregated-time`, { headers: { 'x-user-id': userId || '' } })
      .then(r => r.json())
      .then(data => setAggTime({ entries: data.entries || [], totals: data.totals || { total_minutes: 0, billable_minutes: 0 } }))
      .catch(() => setAggTime({ entries: [], totals: { total_minutes: 0, billable_minutes: 0 } }))
  }, [params.id, userId])

  useEffect(() => { fetchAggDocs(); fetchAggTime() }, [fetchAggDocs, fetchAggTime])

  const persistProjectUpdate = async (changes: Record<string, any>) => {
    try {
      const res = await fetch(`/api/projects/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId || '' },
        body: JSON.stringify(changes),
      })
      if (!res.ok) toast.error('Nepodarilo se ulozit zmeny')
    } catch { toast.error('Chyba pri ukladani') }
  }

  const toggleTaskComplete = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed'
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, completed_at: newStatus === 'completed' ? new Date().toISOString() : null }),
    })
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
  }

  const toggleNextAction = async (taskId: string, current: boolean) => {
    if (!current) {
      const prevNext = tasks.find(t => t.is_next_action)
      if (prevNext) {
        await fetch(`/api/tasks/${prevNext.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_next_action: false }) })
      }
    }
    await fetch(`/api/tasks/${taskId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_next_action: !current }) })
    setTasks(prev => prev.map(t => ({ ...t, is_next_action: t.id === taskId ? !current : false })))
  }

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return
    setAddingTask(true)
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTaskTitle.trim(), status: 'pending', project_id: params.id, parent_project_id: params.id, company_id: project?.company_id }),
      })
      if (res.ok) {
        const data = await res.json()
        setTasks(prev => [...prev, { id: data.task?.id || data.id, title: newTaskTitle.trim(), status: 'pending', assigned_to_name: null, due_date: null, is_next_action: false, phase_id: null }])
        setNewTaskTitle('')
        toast.success('Ukol pridan')
      }
    } catch { toast.error('Chyba pri pridavani ukolu') }
    finally { setAddingTask(false) }
  }

  const handleScoreUpdate = async (result: { score_money: number; score_fire: number; score_time: number; score_distance: number; score_personal: number }) => {
    await persistProjectUpdate(result)
    setProject(prev => prev ? { ...prev, ...result } : prev)
    setShowScoreDialog(false)
    toast.success('Priorita aktualizovana')
  }

  const addProgressNote = async () => {
    if (!userId || !newNoteStatus.trim()) return
    try {
      const res = await fetch(`/api/projects/${params.id}/progress-notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId, 'x-user-name': userName || 'Ucetni' },
        body: JSON.stringify({ current_status: newNoteStatus.trim(), problems: newNoteProblems.trim() || undefined, next_steps: newNoteNextSteps.trim() || undefined, note: newNoteText.trim() || undefined }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setProgressNotes(prev => [data.note, ...prev])
      setShowAddNote(false)
      setNewNoteStatus(''); setNewNoteProblems(''); setNewNoteNextSteps(''); setNewNoteText('')
      toast.success('Poznamka pridana')
    } catch { toast.error('Chyba pri ukladani') }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Projekt nenalezen</h2>
        <p className="text-gray-500 mb-4">{error || 'Neznama chyba'}</p>
        <Button variant="outline" onClick={() => router.push('/accountant/work?type=projects')}><ArrowLeft className="mr-2 h-4 w-4" />Zpet</Button>
      </div>
    )
  }

  const score = calculateScore(project)
  const scorePriority = getScorePriority(score)
  const statusCfg = STATUS_CONFIG[project.status] || STATUS_CONFIG.planning
  const completedTasks = tasks.filter(t => t.status === 'completed')
  const activeTasks = tasks.filter(t => t.status !== 'completed')
  const progress = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : project.progress_percentage

  return (
    <div className="max-w-5xl mx-auto py-8 px-6 space-y-6">
      {/* Header — matches UnifiedTaskDetail */}
      <div className="mb-2">
        <Button variant="ghost" size="sm" onClick={() => router.push('/accountant/work?type=projects')} className="mb-3 rounded-xl text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Zpet
        </Button>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {editingTitle ? (
              <Input
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                onBlur={() => {
                  if (editTitle.trim() && editTitle !== project.title) {
                    persistProjectUpdate({ title: editTitle.trim() })
                    setProject(prev => prev ? { ...prev, title: editTitle.trim() } : prev)
                    toast.success('Nazev ulozen')
                  }
                  setEditingTitle(false)
                }}
                onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') setEditingTitle(false) }}
                className="text-2xl font-bold font-display h-auto py-1"
                autoFocus
              />
            ) : (
              <h1
                className="text-2xl font-bold font-display text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded px-1 -mx-1 truncate"
                onClick={() => { setEditTitle(project.title); setEditingTitle(true) }}
              >
                {project.title}
              </h1>
            )}

            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
                <Target className="h-3 w-3 mr-1" />Projekt
              </Badge>
              {project.is_case && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                  <FileText className="h-3 w-3 mr-1" />Spis
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
              <span>
                Posledni aktivita: {new Date(lastActivityAt || project.created_at).toLocaleDateString('cs-CZ')} •
                {' '}Status: <span className="font-medium">{statusCfg.label}</span>
              </span>
              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{project.due_date ? new Date(project.due_date).toLocaleDateString('cs-CZ') : '—'}</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <Badge className={cn('text-sm px-3 py-1', scorePriority.color)}>
              {score} &bull; {scorePriority.label}
            </Badge>
            <Badge variant="outline" className={statusCfg.color}>
              {statusCfg.label}
            </Badge>
          </div>
        </div>

      </div>

      {/* Compact action bar — matches UnifiedTaskDetail */}
      <div className="border rounded-xl bg-gray-50 dark:bg-gray-900 p-2.5 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowRScorePanel(!showRScorePanel)}
            className={cn('text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer transition-colors flex items-center gap-1', scorePriority.color)}
          >
            <TrendingUp className="h-3 w-3" />
            {score}/12
            <span className="text-[10px] ml-0.5">{showRScorePanel ? '▲' : '▼'}</span>
          </button>

          <Separator orientation="vertical" className="h-4" />

          <div className="flex items-center gap-2.5 text-xs text-gray-500 flex-wrap">
            <span className="flex items-center gap-1.5">
              <div className="w-16 bg-gray-200 rounded-full h-1.5">
                <div className="bg-purple-500 h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
              {completedTasks.length}/{tasks.length}
            </span>
            {project.estimated_hours && <span>Odhad: {project.estimated_hours}h</span>}
            {project.actual_hours > 0 && <span>Odpracovano: {project.actual_hours}h</span>}
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            {project.status === 'active' && (
              <Button size="sm" className="bg-green-600 hover:bg-green-700 h-7 text-xs" onClick={() => {
                persistProjectUpdate({ status: 'completed' })
                setProject(prev => prev ? { ...prev, status: 'completed' } : prev)
                toast.success('Projekt dokoncen')
              }}><CheckCircle2 className="mr-1 h-3 w-3" />Dokoncit</Button>
            )}
            {project.status === 'active' && (
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => {
                persistProjectUpdate({ status: 'on_hold' })
                setProject(prev => prev ? { ...prev, status: 'on_hold' } : prev)
                toast.success('Projekt pozastaven')
              }}><PauseCircle className="mr-1 h-3 w-3" />Pozastavit</Button>
            )}
            {project.status === 'on_hold' && (
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 h-7 text-xs" onClick={() => {
                persistProjectUpdate({ status: 'active' })
                setProject(prev => prev ? { ...prev, status: 'active' } : prev)
                toast.success('Projekt obnoven')
              }}><PlayCircle className="mr-1 h-3 w-3" />Obnovit</Button>
            )}
            {project.status !== 'completed' && project.status !== 'cancelled' && (
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => {
                if (apiUsers.length === 0) {
                  fetch('/api/accountant/users', { headers: { 'x-user-id': userId || '' } })
                    .then(r => r.json())
                    .then(data => setApiUsers(data.users || []))
                    .catch(() => {})
                }
                setShowDelegateDialog(true)
              }}><Users className="mr-1 h-3 w-3" />Delegovat</Button>
            )}
            {project.status !== 'completed' && project.status !== 'cancelled' && (
              <Button size="sm" variant="outline" className="h-7 text-xs text-red-600 hover:text-red-700 border-red-200 hover:border-red-300" onClick={() => {
                persistProjectUpdate({ status: 'cancelled' })
                setProject(prev => prev ? { ...prev, status: 'cancelled' } : prev)
                toast.success('Projekt zrusen')
              }}><XCircle className="mr-1 h-3 w-3" />Zrusit</Button>
            )}
          </div>
        </div>

        {/* R-Score collapsible panel */}
        {showRScorePanel && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t">
            {([
              { key: 'score_money' as const, label: 'Money', emoji: '\uD83D\uDCB0', options: SCORE_OPTIONS.money },
              { key: 'score_fire' as const, label: 'Fire', emoji: '\uD83D\uDD25', options: SCORE_OPTIONS.fire },
              { key: 'score_time' as const, label: 'Time', emoji: '\u23F1\uFE0F', options: SCORE_OPTIONS.time },
              { key: 'score_distance' as const, label: 'Distance', emoji: '\uD83D\uDCCD', options: SCORE_OPTIONS.distance },
              { key: 'score_personal' as const, label: 'Personal', emoji: '\u2764\uFE0F', options: SCORE_OPTIONS.personal },
            ] as const).map(({ key, label, emoji, options }) => (
              <div key={key}>
                <span className="text-[10px] text-gray-500">{emoji} {label}</span>
                <Select
                  value={(project[key] ?? 0).toString()}
                  onValueChange={v => {
                    const val = parseInt(v)
                    persistProjectUpdate({ [key]: val })
                    setProject(prev => prev ? { ...prev, [key]: val } : prev)
                    toast.success('Score aktualizovano')
                  }}
                >
                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {options.map(opt => (
                      <SelectItem key={opt.value} value={opt.value.toString()}>
                        <span className={opt.color}>{opt.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Description */}
      <div className="border rounded-xl p-3 bg-white dark:bg-gray-900">
        <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Popis projektu</div>
        {editingDesc ? (
          <div className="space-y-2">
            <Textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={3} autoFocus placeholder="Popis projektu..." />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => {
                if (editDesc !== (project.description || '')) {
                  persistProjectUpdate({ description: editDesc.trim() })
                  setProject(prev => prev ? { ...prev, description: editDesc.trim() } : prev)
                  toast.success('Popis ulozen')
                }
                setEditingDesc(false)
              }}>Ulozit</Button>
              <Button size="sm" variant="outline" onClick={() => setEditingDesc(false)}>Zrusit</Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded p-1 -m-1" onClick={() => { setEditDesc(project.description || ''); setEditingDesc(true) }}>
            {project.description || 'Klikni pro pridani popisu...'}
          </p>
        )}
        {/* Cil projektu — editable */}
        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
          <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Cil projektu</div>
          {editingOutcome ? (
            <div className="space-y-2">
              <Textarea value={editOutcome} onChange={e => setEditOutcome(e.target.value)} rows={2} autoFocus placeholder="Ceho chceme dosahnut..." />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => {
                  if (editOutcome !== (project.outcome || '')) {
                    persistProjectUpdate({ outcome: editOutcome.trim() })
                    setProject(prev => prev ? { ...prev, outcome: editOutcome.trim() } : prev)
                    toast.success('Cil ulozen')
                  }
                  setEditingOutcome(false)
                }}>Ulozit</Button>
                <Button size="sm" variant="outline" onClick={() => setEditingOutcome(false)}>Zrusit</Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-purple-700 dark:text-purple-300 whitespace-pre-wrap cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded p-1 -m-1" onClick={() => { setEditOutcome(project.outcome || ''); setEditingOutcome(true) }}>
              {project.outcome || 'Klikni pro pridani cile...'}
            </p>
          )}
        </div>
      </div>

      {/* View Tabs — matches UnifiedTaskDetail */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-2 overflow-x-auto">
        {[
          { id: 'spis' as TabKey, label: 'Spis' },
          { id: 'ukoly' as TabKey, label: `Ukoly (${completedTasks.length}/${tasks.length})` },
          { id: 'dokumenty' as TabKey, label: `Dokumenty (${aggDocs.length})` },
          { id: 'vykaz' as TabKey, label: `Vykaz${aggTime.totals.total_minutes ? ` (${Math.round(aggTime.totals.total_minutes / 60 * 10) / 10}h)` : ''}` },
        ].map(tab => {
          const isActive = activeTab === tab.id
          return (
            <Button
              key={tab.id}
              variant={isActive ? 'default' : 'ghost'}
              size="sm"
              className={`shrink-0 ${isActive ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </Button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'spis' && (
          <ProjectSpisTab
            progressNotes={progressNotes}
            showAddNote={showAddNote}
            setShowAddNote={setShowAddNote}
            newNoteStatus={newNoteStatus}
            setNewNoteStatus={setNewNoteStatus}
            newNoteProblems={newNoteProblems}
            setNewNoteProblems={setNewNoteProblems}
            newNoteNextSteps={newNoteNextSteps}
            setNewNoteNextSteps={setNewNoteNextSteps}
            newNoteText={newNoteText}
            setNewNoteText={setNewNoteText}
            onAddNote={addProgressNote}
            projectId={params.id}
            timelineComposerSignal={timelineComposerSignal}
            setTimelineComposerSignal={setTimelineComposerSignal}
            refreshCaseCounts={refreshCaseCounts}
            isCase={project.is_case}
          />
        )}

        {activeTab === 'ukoly' && (
          <ProjectUkolyTab
            tasks={tasks}
            activeTasks={activeTasks}
            completedTasks={completedTasks}
            newTaskTitle={newTaskTitle}
            setNewTaskTitle={setNewTaskTitle}
            addingTask={addingTask}
            onAddTask={handleAddTask}
            onToggleComplete={toggleTaskComplete}
            onToggleNextAction={toggleNextAction}
            projectId={params.id}
          />
        )}

        {activeTab === 'dokumenty' && (
          <ProjectDokumentyTab
            projectId={params.id}
            companyId={project.company_id}
            docs={aggDocs}
            onRefresh={() => fetchAggDocs()}
            userId={userId || ''}
          />
        )}

        {activeTab === 'vykaz' && (
          <ProjectVykazTab
            entries={aggTime.entries}
            totals={aggTime.totals}
          />
        )}
      </div>

      {/* Score Dialog */}
      <Dialog open={showScoreDialog} onOpenChange={setShowScoreDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Ohodnoceni priority</DialogTitle></DialogHeader>
          <ScoringWizard onComplete={handleScoreUpdate} onCancel={() => setShowScoreDialog(false)} />
        </DialogContent>
      </Dialog>

      {/* Delegate Dialog */}
      <Dialog open={showDelegateDialog} onOpenChange={setShowDelegateDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delegovat projekt</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium mb-1 block">Komu delegovat</label>
              <Select value={delegateTo} onValueChange={setDelegateTo}>
                <SelectTrigger><SelectValue placeholder="Vyberte uzivatele" /></SelectTrigger>
                <SelectContent>
                  {apiUsers.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="outline" onClick={() => setShowDelegateDialog(false)}>Zrusit</Button>
              <Button size="sm" disabled={!delegateTo} onClick={() => {
                const user = apiUsers.find(u => u.id === delegateTo)
                persistProjectUpdate({ assigned_to: delegateTo, assigned_to_name: user?.name })
                toast.success(`Delegovano: ${user?.name}`)
                setShowDelegateDialog(false)
                setDelegateTo('')
              }}>Delegovat</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============================================
// TAB: SPIS (progress notes + timeline)
// ============================================

function ProjectSpisTab({
  progressNotes, showAddNote, setShowAddNote,
  newNoteStatus, setNewNoteStatus, newNoteProblems, setNewNoteProblems,
  newNoteNextSteps, setNewNoteNextSteps, newNoteText, setNewNoteText,
  onAddNote, projectId, timelineComposerSignal, setTimelineComposerSignal,
  refreshCaseCounts, isCase,
}: {
  progressNotes: ProgressNote[]
  showAddNote: boolean; setShowAddNote: (v: boolean) => void
  newNoteStatus: string; setNewNoteStatus: (v: string) => void
  newNoteProblems: string; setNewNoteProblems: (v: string) => void
  newNoteNextSteps: string; setNewNoteNextSteps: (v: string) => void
  newNoteText: string; setNewNoteText: (v: string) => void
  onAddNote: () => void
  projectId: string
  timelineComposerSignal: number; setTimelineComposerSignal: (fn: (v: number) => number) => void
  refreshCaseCounts: () => void
  isCase?: boolean
}) {
  return (
    <div className="space-y-4">
      {/* Action buttons */}
      <div className="flex gap-2">
        <Button size="sm" onClick={() => setShowAddNote(true)} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="h-3.5 w-3.5 mr-1" />Pridat zaznam
        </Button>
        {isCase && (
          <Button size="sm" variant="outline" onClick={() => setTimelineComposerSignal(v => v + 1)}>
            <Plus className="h-3.5 w-3.5 mr-1" />Pridat udalost
          </Button>
        )}
      </div>

      {/* Add note form */}
      {showAddNote && (
        <Card className="rounded-xl border-green-200 bg-green-50/50">
          <CardContent className="p-5 space-y-3">
            <h3 className="font-bold text-sm">Nova poznamka o prubehu</h3>
            <div>
              <label className="text-xs font-medium mb-1 block">Aktualni stav *</label>
              <Textarea value={newNoteStatus} onChange={e => setNewNoteStatus(e.target.value)} rows={2} className="text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Problemy</label>
              <Textarea value={newNoteProblems} onChange={e => setNewNoteProblems(e.target.value)} rows={2} className="text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Dalsi kroky</label>
              <Textarea value={newNoteNextSteps} onChange={e => setNewNoteNextSteps(e.target.value)} rows={2} className="text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Volna poznamka</label>
              <Textarea value={newNoteText} onChange={e => setNewNoteText(e.target.value)} rows={2} className="text-sm" />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={onAddNote} disabled={!newNoteStatus.trim()} className="bg-green-600 hover:bg-green-700">Ulozit</Button>
              <Button size="sm" variant="outline" onClick={() => setShowAddNote(false)}>Zrusit</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress notes timeline */}
      {progressNotes.length > 0 ? (
        <div className="space-y-3">
          {progressNotes.map(note => (
            <Card key={note.id} className="rounded-xl shadow-soft-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-xs text-gray-500" suppressHydrationWarning>
                    {new Date(note.created_at).toLocaleString('cs-CZ')} • {note.author_name || 'Ucetni'}
                  </span>
                </div>
                <div className="ml-4 space-y-1.5">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{note.current_status}</p>
                  {note.problems && <p className="text-xs text-red-600"><strong>Problemy:</strong> {note.problems}</p>}
                  {note.next_steps && <p className="text-xs text-blue-600 whitespace-pre-line"><strong>Dalsi kroky:</strong> {note.next_steps}</p>}
                  {note.note && <p className="text-xs text-gray-500 italic">{note.note}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Zatim zadne zaznamy. Pridejte prvni poznamku vyse.</p>
        </div>
      )}

      {/* Case timeline */}
      {isCase && (
        <div className="mt-6">
          <CaseTimeline projectId={projectId} openComposerSignal={timelineComposerSignal} onChanged={refreshCaseCounts} />
        </div>
      )}
    </div>
  )
}

// ============================================
// TAB: UKOLY
// ============================================

function ProjectUkolyTab({
  tasks, activeTasks, completedTasks,
  newTaskTitle, setNewTaskTitle, addingTask,
  onAddTask, onToggleComplete, onToggleNextAction,
  projectId,
}: {
  tasks: TaskItem[]
  activeTasks: TaskItem[]
  completedTasks: TaskItem[]
  newTaskTitle: string; setNewTaskTitle: (v: string) => void
  addingTask: boolean
  onAddTask: () => void
  onToggleComplete: (id: string, status: string) => void
  onToggleNextAction: (id: string, current: boolean) => void
  projectId: string
}) {
  const [showDone, setShowDone] = useState(false)
  const progressPct = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      {tasks.length > 0 && (
        <div className="flex items-center gap-3 px-1">
          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div className="bg-gradient-to-r from-purple-600 to-purple-500 h-2 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
          </div>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">
            {completedTasks.length}/{tasks.length} dokonceno
          </span>
        </div>
      )}

      {/* Add task input */}
      <div className="flex gap-2">
        <Input
          placeholder="Pridat novy ukol..."
          value={newTaskTitle}
          onChange={e => setNewTaskTitle(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && newTaskTitle.trim()) { e.preventDefault(); onAddTask() } }}
          className="flex-1"
        />
        <Button size="sm" onClick={onAddTask} disabled={!newTaskTitle.trim() || addingTask} className="bg-purple-600 hover:bg-purple-700 shrink-0">
          <Plus className="h-4 w-4 mr-1" />Pridat
        </Button>
      </div>

      {/* Active tasks */}
      {activeTasks.length > 0 && (
        <div className="space-y-1.5">
          {activeTasks.map(task => (
            <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg border bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-purple-300 transition-colors group">
              <button onClick={() => onToggleComplete(task.id, task.status)} className="shrink-0">
                <Circle className="h-5 w-5 text-gray-300 group-hover:text-purple-400 transition-colors" />
              </button>
              <Link href={`/accountant/tasks/${task.id}?from_project=${projectId}&from_type=legacy`} className="flex-1 min-w-0 text-sm font-medium truncate hover:text-purple-600 transition-colors">
                {task.title}
              </Link>
              <div className="flex items-center gap-2 shrink-0">
                {task.due_date && <span className="text-xs text-gray-500">{new Date(task.due_date).toLocaleDateString('cs-CZ')}</span>}
                {task.assigned_to_name && <span className="text-xs text-gray-400">{task.assigned_to_name}</span>}
                <button
                  onClick={() => onToggleNextAction(task.id, task.is_next_action)}
                  className={cn(
                    'text-[10px] px-2 py-0.5 rounded-full border',
                    task.is_next_action
                      ? 'bg-yellow-100 text-yellow-700 border-yellow-300 font-semibold'
                      : 'text-gray-400 border-gray-200 hover:border-yellow-300'
                  )}
                >
                  {task.is_next_action ? 'Dalsi akce' : 'Nastavit'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Completed tasks (collapsible) */}
      {completedTasks.length > 0 && (
        <div>
          <button
            onClick={() => setShowDone(!showDone)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors py-1"
          >
            {showDone ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            Dokoncene ({completedTasks.length})
          </button>
          {showDone && (
            <div className="space-y-1.5 mt-1.5">
              {completedTasks.map(task => (
                <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg border bg-green-50/50 dark:bg-green-900/10 border-green-200 transition-colors">
                  <button onClick={() => onToggleComplete(task.id, task.status)} className="shrink-0">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </button>
                  <Link href={`/accountant/tasks/${task.id}?from_project=${projectId}&from_type=legacy`} className="flex-1 min-w-0 text-sm font-medium truncate line-through text-gray-400 hover:text-purple-600 transition-colors">
                    {task.title}
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {tasks.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <ListTodo className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Zatim zadne ukoly. Pridejte prvni vyse.</p>
        </div>
      )}
    </div>
  )
}

// ============================================
// TAB: DOKUMENTY (aggregated from subtasks)
// ============================================

function ProjectDokumentyTab({ projectId, companyId, docs, onRefresh, userId }: {
  projectId: string
  companyId: string | null
  docs: any[]
  onRefresh: () => void
  userId: string
}) {
  const [showUpload, setShowUpload] = useState(false)
  const [showDocPicker, setShowDocPicker] = useState(false)

  const handleDetach = async (linkId: string) => {
    try {
      await fetch(`/api/document-links/${linkId}`, { method: 'DELETE', headers: { 'x-user-id': userId } })
      onRefresh()
      toast.success('Dokument odpojen')
    } catch { toast.error('Chyba pri odpojovani') }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button size="sm" className="bg-purple-600 hover:bg-purple-700" onClick={() => setShowUpload(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" />Nahrat dokument
        </Button>
        {companyId && (
          <Button size="sm" variant="outline" onClick={() => setShowDocPicker(true)}>
            <Paperclip className="h-3.5 w-3.5 mr-1" />Pripojit existujici
          </Button>
        )}
      </div>

      {docs.length > 0 ? (
        <div className="space-y-1.5">
          {docs.map((doc: any) => (
            <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg border bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
              <FileText className="h-4 w-4 text-gray-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium truncate block">{doc.document?.file_name || doc.file_name || 'Dokument'}</span>
                {doc.source_task_title && (
                  <Badge variant="outline" className="text-[10px] mt-0.5">z ukolu: {doc.source_task_title}</Badge>
                )}
              </div>
              <button onClick={() => handleDetach(doc.id)} className="text-gray-300 hover:text-red-500 shrink-0">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Zatim zadne dokumenty.</p>
        </div>
      )}

      {companyId && showUpload && (
        <UploadDialog
          companyId={companyId}
          open={showUpload}
          onOpenChange={setShowUpload}
          onUploaded={() => {
            onRefresh()
            setShowUpload(false)
          }}
        />
      )}

      {companyId && (
        <DocumentPicker
          companyId={companyId}
          open={showDocPicker}
          onOpenChange={setShowDocPicker}
          onSelect={(docIds) => {
            Promise.all(docIds.map(docId =>
              fetch('/api/document-links', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
                body: JSON.stringify({ entity_type: 'project', entity_id: projectId, document_id: docId, link_type: 'attachment' }),
              })
            )).then(() => { onRefresh(); setShowDocPicker(false) }).catch(() => {})
          }}
        />
      )}
    </div>
  )
}

// ============================================
// TAB: VYKAZ PRACE (aggregated from subtasks)
// ============================================

function ProjectVykazTab({ entries, totals }: {
  entries: any[]
  totals: { total_minutes: number; billable_minutes: number }
}) {
  // Group entries by task_title
  const grouped: Record<string, any[]> = {}
  entries.forEach((e: any) => {
    const key = e.task_title || 'Bez ukolu'
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(e)
  })

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card className="rounded-xl border-purple-200 bg-purple-50/50">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-purple-700">{Math.round(totals.total_minutes / 60 * 10) / 10}h</div>
              <div className="text-xs text-gray-500">Celkem</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-700">{Math.round(totals.billable_minutes / 60 * 10) / 10}h</div>
              <div className="text-xs text-gray-500">Fakturovatelne</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-600">{entries.length}</div>
              <div className="text-xs text-gray-500">Zaznamu</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grouped entries */}
      {Object.entries(grouped).map(([taskTitle, taskEntries]) => (
        <div key={taskTitle}>
          <div className="text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1.5">
            <Target className="h-3 w-3" />
            {taskTitle}
          </div>
          <div className="space-y-1">
            {taskEntries.sort((a: any, b: any) => (b.date || b.created_at || '').localeCompare(a.date || a.created_at || '')).map((entry: any) => (
              <div key={entry.id} className="flex items-center gap-3 p-2.5 rounded-lg border bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-sm">
                <Clock className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                <span className="text-xs text-gray-500 shrink-0">
                  {entry.date ? new Date(entry.date).toLocaleDateString('cs-CZ') : '—'}
                </span>
                <span className="font-medium shrink-0">{entry.duration_minutes || 0} min</span>
                <span className="text-gray-500 truncate flex-1">{entry.description || entry.note || ''}</span>
                {entry.billable && <Badge variant="outline" className="text-[10px] text-green-600 border-green-300 shrink-0">Fakt.</Badge>}
              </div>
            ))}
          </div>
        </div>
      ))}

      {entries.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Zatim zadne zaznamy prace.</p>
        </div>
      )}
    </div>
  )
}
