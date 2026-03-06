'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CaseToggle } from '@/components/case/case-toggle'
import { CaseTimeline } from '@/components/case/case-timeline'
import { CaseDocuments } from '@/components/case/case-documents'
import { CaseBudgetCard } from '@/components/case/case-budget-card'
import { DocumentLinksPanel } from '@/components/documents/document-links-panel'
import { ScoringWizard } from '@/components/gtd/scoring-wizard'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useAccountantUser } from '@/lib/contexts/accountant-user-context'
import {
  ArrowLeft,
  Calendar,
  User,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  Target,
  Zap,
  Plus,
  Star,
  AlertCircle,
  FileText,
  Clock,
  TrendingUp,
  Pencil,
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
}

type Phase = {
  id: string
  title: string
  description: string | null
  position: number
  status: string
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

const getPriority = (score: number) => {
  if (score >= 9) return { label: 'Vysoká', emoji: '🔴', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' }
  if (score >= 6) return { label: 'Střední', emoji: '🟡', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' }
  return { label: 'Nízká', emoji: '🟢', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' }
}

const STATUS_CONFIG: Record<string, { label: string; icon: typeof PlayCircle; color: string }> = {
  planning: { label: 'Plánování', icon: Target, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  active: { label: 'Aktivní', icon: PlayCircle, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  on_hold: { label: 'Pozastaveno', icon: PauseCircle, color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
  review: { label: 'K review', icon: AlertCircle, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  completed: { label: 'Dokončeno', icon: CheckCircle2, color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  cancelled: { label: 'Zrušeno', icon: AlertCircle, color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
}

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { userId, userName } = useAccountantUser()
  const [activeView, setActiveView] = useState<'summary' | 'notes' | 'tasks' | 'documents' | 'timeline' | 'budget' | 'case'>('summary')
  const [project, setProject] = useState<Project | null>(null)
  const [phases, setPhases] = useState<Phase[]>([])
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showScoreDialog, setShowScoreDialog] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [addingTask, setAddingTask] = useState(false)
  const [documentsCount, setDocumentsCount] = useState(0)
  const [timelineCount, setTimelineCount] = useState(0)
  const [progressNotes, setProgressNotes] = useState<ProgressNote[]>([])
  const [showAddProgressNote, setShowAddProgressNote] = useState(false)
  const [newNoteStatus, setNewNoteStatus] = useState('')
  const [newNoteProblems, setNewNoteProblems] = useState('')
  const [newNoteNextSteps, setNewNoteNextSteps] = useState('')
  const [newNoteText, setNewNoteText] = useState('')

  useEffect(() => {
    fetch(`/api/projects/${params.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setError(data.error)
        } else {
          setProject(data.project)
          setPhases(data.phases || [])
          setTasks(data.tasks || [])
        }
        setLoading(false)
      })
      .catch(() => { setError('Nepodařilo se načíst projekt'); setLoading(false) })
  }, [params.id])

  useEffect(() => {
    if (!userId) return
    fetch(`/api/projects/${params.id}/progress-notes`, { headers: { 'x-user-id': userId } })
      .then(r => r.json())
      .then(data => setProgressNotes(data.notes || []))
      .catch(() => setProgressNotes([]))
  }, [params.id, userId])

  useEffect(() => {
    if (!userId) return
    fetch(`/api/projects/${params.id}/documents`, { headers: { 'x-user-id': userId } })
      .then(r => r.json())
      .then(data => setDocumentsCount((data.documents || []).length))
      .catch(() => setDocumentsCount(0))

    fetch(`/api/projects/${params.id}/timeline?page_size=1`, { headers: { 'x-user-id': userId } })
      .then(r => r.json())
      .then(data => setTimelineCount(data.pagination?.total || 0))
      .catch(() => setTimelineCount(0))
  }, [params.id, userId])

  const toggleNextAction = async (taskId: string, current: boolean) => {
    if (!current) {
      const prevNext = tasks.find(t => t.is_next_action)
      if (prevNext) {
        await fetch(`/api/tasks/${prevNext.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_next_action: false }),
        })
      }
    }
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_next_action: !current }),
    })
    setTasks(tasks.map(t => ({
      ...t,
      is_next_action: t.id === taskId ? !current : false,
    })))
  }

  const toggleTaskComplete = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed'
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
      }),
    })
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
  }

  const handleScoreUpdate = async (result: { score_money: number; score_fire: number; score_time: number; score_distance: number; score_personal: number }) => {
    try {
      const res = await fetch(`/api/projects/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result),
      })
      if (res.ok) {
        setProject(prev => prev ? { ...prev, ...result } : prev)
        toast.success('Priorita aktualizována')
      }
    } catch {
      toast.error('Chyba při ukládání')
    }
    setShowScoreDialog(false)
  }

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return
    setAddingTask(true)
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTaskTitle.trim(),
          status: 'pending',
          project_id: params.id,
          company_id: project?.company_id,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setTasks(prev => [...prev, {
          id: data.task?.id || data.id,
          title: newTaskTitle.trim(),
          status: 'pending',
          assigned_to_name: null,
          due_date: null,
          is_next_action: false,
          phase_id: null,
        }])
        setNewTaskTitle('')
        toast.success('Úkol přidán')
      }
    } catch {
      toast.error('Chyba při přidávání úkolu')
    } finally {
      setAddingTask(false)
    }
  }

  const addProgressNote = async () => {
    if (!userId || !newNoteStatus.trim()) return
    try {
      const res = await fetch(`/api/projects/${params.id}/progress-notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
          'x-user-name': userName || 'Ucetni',
        },
        body: JSON.stringify({
          current_status: newNoteStatus.trim(),
          problems: newNoteProblems.trim() || undefined,
          next_steps: newNoteNextSteps.trim() || undefined,
          note: newNoteText.trim() || undefined,
        }),
      })
      if (!res.ok) throw new Error('save failed')
      const data = await res.json()
      setProgressNotes(prev => [data.note, ...prev])
      setShowAddProgressNote(false)
      setNewNoteStatus('')
      setNewNoteProblems('')
      setNewNoteNextSteps('')
      setNewNoteText('')
      toast.success('Poznamka o prubehu pridana')
    } catch {
      toast.error('Chyba pri ukladani poznamky')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold font-display mb-2">Projekt nenalezen</h3>
        <Button onClick={() => router.push('/accountant/work')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Zpět na práci
        </Button>
      </div>
    )
  }

  const statusCfg = STATUS_CONFIG[project.status] || STATUS_CONFIG.planning
  const StatusIcon = statusCfg.icon
  const score = calculateScore(project)
  const priority = getPriority(score)
  const nextAction = tasks.find(t => t.is_next_action)
  const completedTasks = tasks.filter(t => t.status === 'completed').length
  const activeTasks = tasks.filter(t => t.status !== 'completed')
  const completedTasksList = tasks.filter(t => t.status === 'completed')
  const latestProgressNote = progressNotes[0]

  return (
    <div className="max-w-5xl mx-auto py-8 px-6">
      <Button variant="ghost" size="sm" onClick={() => router.push('/accountant/work')} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Práce
      </Button>

      <div className="flex gap-3 mb-4 flex-wrap">
        <Card className="rounded-xl shadow-soft-sm bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-3 text-center min-w-[100px]">
            <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">Ukoly</div>
            <div className="text-2xl font-bold text-green-700">{completedTasks}/{tasks.length}</div>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-soft-sm bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="p-3 text-center min-w-[110px]">
            <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">Progress</div>
            <div className="text-2xl font-bold text-blue-700">{project.progress_percentage}%</div>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-soft-sm bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200">
          <CardContent className="p-3 text-center min-w-[110px]">
            <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">Status</div>
            <div className="text-sm font-bold text-amber-700">{statusCfg.label}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-2 mb-4 overflow-x-auto">
        <Button variant={activeView === 'summary' ? 'default' : 'ghost'} onClick={() => setActiveView('summary')} className={activeView === 'summary' ? 'bg-blue-600 hover:bg-blue-700' : ''}>📋 Souhrn spisu</Button>
        <Button variant={activeView === 'notes' ? 'default' : 'ghost'} onClick={() => setActiveView('notes')} className={activeView === 'notes' ? 'bg-blue-600 hover:bg-blue-700' : ''}>📝 Poznamky o prubehu{progressNotes.length ? ` (${progressNotes.length})` : ''}</Button>
        <Button variant={activeView === 'tasks' ? 'default' : 'ghost'} onClick={() => setActiveView('tasks')} className={activeView === 'tasks' ? 'bg-blue-600 hover:bg-blue-700' : ''}>✓ Ukoly ({completedTasks}/{tasks.length})</Button>
        {project.is_case && (
          <>
            <Button variant={activeView === 'documents' ? 'default' : 'ghost'} onClick={() => setActiveView('documents')} className={activeView === 'documents' ? 'bg-blue-600 hover:bg-blue-700' : ''}>📎 Dokumenty ({documentsCount})</Button>
            <Button variant={activeView === 'timeline' ? 'default' : 'ghost'} onClick={() => setActiveView('timeline')} className={activeView === 'timeline' ? 'bg-blue-600 hover:bg-blue-700' : ''}>🕐 Timeline ({timelineCount})</Button>
            <Button variant={activeView === 'budget' ? 'default' : 'ghost'} onClick={() => setActiveView('budget')} className={activeView === 'budget' ? 'bg-blue-600 hover:bg-blue-700' : ''}>💰 Rozpocet</Button>
          </>
        )}
        <Button variant={activeView === 'case' ? 'default' : 'ghost'} onClick={() => setActiveView('case')} className={activeView === 'case' ? 'bg-blue-600 hover:bg-blue-700' : ''}>⚙️ Spisovy system</Button>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <Button onClick={() => setActiveView('timeline')} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Pridat udalost
        </Button>
        <Button
          onClick={() => {
            setActiveView('notes')
            setShowAddProgressNote(true)
          }}
          variant="outline"
        >
          <Pencil className="h-4 w-4 mr-2" />
          Pridat poznamku o prubehu
        </Button>
      </div>

      <div className="mb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold font-display text-gray-900 dark:text-white truncate">{project.title}</h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge className={statusCfg.color}>{statusCfg.label}</Badge>
              <Badge className={priority.color}>{priority.emoji} {score}/12 · {priority.label}</Badge>
              <button
                onClick={() => setShowScoreDialog(true)}
                className="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-0.5"
              >
                <Pencil className="h-3 w-3" /> Upravit skore
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
              <span>
                Posledni aktivita: {new Date(project.created_at).toLocaleDateString('cs-CZ')} •
                {' '}Status: <span className="font-medium">{statusCfg.label}</span>
              </span>
              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{project.due_date ? new Date(project.due_date).toLocaleDateString('cs-CZ') : '—'}</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-xs text-gray-500 mb-1">Progress</div>
            <div className="text-xl font-bold text-purple-700">{project.progress_percentage}%</div>
            <div className="text-xs text-gray-500">{completedTasks}/{tasks.length} ukolu</div>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="space-y-4">
          {activeView === 'summary' && (
            <div className="space-y-4">
              {(latestProgressNote?.current_status || project.outcome) && (
                <Card className="rounded-xl shadow-soft border-green-200 bg-green-50">
                  <CardContent className="p-5">
                    <h3 className="font-bold mb-2">📍 Kde jsme skoncili</h3>
                    <p className="text-sm text-gray-700 dark:text-gray-200">{latestProgressNote?.current_status || project.outcome}</p>
                    {latestProgressNote?.next_steps && (
                      <p className="text-xs text-blue-700 mt-3 whitespace-pre-wrap"><strong>Dalsi kroky:</strong> {latestProgressNote.next_steps}</p>
                    )}
                  </CardContent>
                </Card>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="rounded-xl shadow-soft-sm">
                  <CardContent className="p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">Priorita</div>
                    <div className="text-xl font-bold">{priority.label}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Skore {score}/12</div>
                  </CardContent>
                </Card>
                <Card className="rounded-xl shadow-soft-sm">
                  <CardContent className="p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">Deadline</div>
                    <div className="text-xl font-bold">{project.due_date ? new Date(project.due_date).toLocaleDateString('cs-CZ') : 'Neni'}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Status {statusCfg.label}</div>
                  </CardContent>
                </Card>
                <Card className="rounded-xl shadow-soft-sm">
                  <CardContent className="p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">Dalsi krok</div>
                    <div className="text-sm font-bold truncate">{nextAction?.title || 'Neni nastaven'}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{nextAction?.assigned_to_name || ''}</div>
                  </CardContent>
                </Card>
              </div>
              <Card className="rounded-xl shadow-soft-sm">
                <CardContent className="p-5">
                  <h3 className="font-bold mb-3">🚀 Nedokoncene ukoly</h3>
                  {activeTasks.length === 0 ? (
                    <p className="text-sm text-gray-500">Vsechny ukoly jsou dokoncene.</p>
                  ) : (
                    <div className="space-y-2">
                      {activeTasks.slice(0, 8).map(task => (
                        <div key={task.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate cursor-pointer hover:underline" onClick={() => router.push(`/accountant/tasks/${task.id}`)}>{task.title}</div>
                            <div className="flex gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                              {task.due_date && <span>⏰ {new Date(task.due_date).toLocaleDateString('cs-CZ')}</span>}
                              {task.assigned_to_name && <span>👤 {task.assigned_to_name}</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeView === 'notes' && (
            <div className="space-y-6">
              <Button onClick={() => setShowAddProgressNote(true)} className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Pridat poznamku o prubehu
              </Button>

              {showAddProgressNote && (
                <Card className="rounded-xl shadow-soft border-green-200">
                  <CardContent className="p-6 space-y-4">
                    <h3 className="font-bold">📝 Nova poznamka o prubehu</h3>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Aktualni stav *</label>
                      <Textarea value={newNoteStatus} onChange={(e) => setNewNoteStatus(e.target.value)} rows={3} />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Problemy</label>
                      <Textarea value={newNoteProblems} onChange={(e) => setNewNoteProblems(e.target.value)} rows={2} />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Dalsi kroky</label>
                      <Textarea value={newNoteNextSteps} onChange={(e) => setNewNoteNextSteps(e.target.value)} rows={2} />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Volna poznamka</label>
                      <Textarea value={newNoteText} onChange={(e) => setNewNoteText(e.target.value)} rows={2} />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={addProgressNote} className="bg-green-600">Ulozit</Button>
                      <Button variant="outline" onClick={() => setShowAddProgressNote(false)}>Zrusit</Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {progressNotes.map(note => (
                <Card key={note.id} className="rounded-xl shadow-soft-sm border-l-4 border-blue-500">
                  <CardContent className="p-6">
                    <div className="text-sm text-gray-600 dark:text-gray-300 mb-4" suppressHydrationWarning>
                      {new Date(note.created_at).toLocaleString('cs-CZ')} • {note.author_name || 'Ucetni'}
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="font-semibold mb-1">📌 Aktualni stav:</div>
                        <div className="text-gray-700 dark:text-gray-200">{note.current_status}</div>
                      </div>
                      {note.problems && (<div><div className="font-semibold text-red-700 mb-1">⚠️ Problemy:</div><div className="text-gray-700 dark:text-gray-200">{note.problems}</div></div>)}
                      {note.next_steps && (<div><div className="font-semibold text-blue-700 mb-1">⏭️ Dalsi kroky:</div><div className="text-gray-700 dark:text-gray-200 whitespace-pre-line">{note.next_steps}</div></div>)}
                      {note.note && (<div className="text-sm text-gray-600 dark:text-gray-300 italic">{note.note}</div>)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {activeView === 'tasks' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="rounded-xl shadow-soft border-red-200">
                <CardContent className="p-5">
                  <h3 className="font-bold text-red-700 mb-3">🔥 Nedokoncene ukoly ({activeTasks.length})</h3>
                  <div className="space-y-2">
                    {activeTasks.map(task => (
                      <div key={task.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <button onClick={() => toggleTaskComplete(task.id, task.status)} className="mt-1">
                          <CheckCircle2 className="h-4 w-4 text-gray-300 hover:text-green-600" />
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate cursor-pointer hover:underline" onClick={() => router.push(`/accountant/tasks/${task.id}`)}>{task.title}</div>
                          <div className="flex gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {task.due_date && <span>⏰ {new Date(task.due_date).toLocaleDateString('cs-CZ')}</span>}
                            {task.assigned_to_name && <span>👤 {task.assigned_to_name}</span>}
                          </div>
                        </div>
                        <button onClick={() => toggleNextAction(task.id, task.is_next_action)} className={task.is_next_action ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-500'}>
                          <Star className="h-4 w-4" fill={task.is_next_action ? 'currentColor' : 'none'} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-4 pt-3 border-t border-dashed">
                    <Input
                      placeholder="Pridat ukol..."
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newTaskTitle.trim()) {
                          e.preventDefault()
                          handleAddTask()
                        }
                      }}
                      className="h-8 text-sm"
                    />
                    <Button size="sm" variant="outline" onClick={handleAddTask} disabled={!newTaskTitle.trim() || addingTask} className="h-8 px-3">
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-xl shadow-soft border-green-200">
                <CardContent className="p-5">
                  <h3 className="font-bold text-green-700 mb-3">✅ Dokoncene ukoly ({completedTasksList.length})</h3>
                  <div className="space-y-2">
                    {completedTasksList.map(task => (
                      <div key={task.id} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg opacity-80">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-1" />
                        <div className="flex-1">
                          <div className="font-medium line-through">{task.title}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {project.is_case && activeView === 'documents' && (
            <div className="space-y-4">
              <CaseDocuments projectId={params.id} />
              {project.company_id && (
                <Card className="rounded-xl shadow-soft-sm">
                  <CardContent className="p-4">
                    <DocumentLinksPanel
                      entityType="project"
                      entityId={params.id}
                      companyId={project.company_id}
                      allowEdit
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {project.is_case && activeView === 'timeline' && (
            <CaseTimeline projectId={params.id} />
          )}

          {project.is_case && activeView === 'budget' && (
            <CaseBudgetCard projectId={params.id} />
          )}

          {activeView === 'case' && (
            <Card className="rounded-xl shadow-soft-sm">
              <CardContent className="p-4">
                <CaseToggle
                  projectId={params.id}
                  project={project}
                  onUpdate={(updated) => setProject(prev => prev ? { ...prev, ...updated } : prev)}
                />
              </CardContent>
            </Card>
          )}
      </div>

      {/* Score Dialog */}
      <Dialog open={showScoreDialog} onOpenChange={setShowScoreDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ohodnocení priority</DialogTitle>
          </DialogHeader>
          <ScoringWizard
            onComplete={handleScoreUpdate}
            onCancel={() => setShowScoreDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
