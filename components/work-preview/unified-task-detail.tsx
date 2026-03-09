'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Edit2,
  Trash2,
  Clock,
  Calendar,
  User,
  Building2,
  AlertCircle,
  Zap,
  Users,
  Send,
  UserCheck,
  UserX,
  Target,
  ListTodo,
  MessageSquare,
  History,
  Play,
  Phone,
  Mail,
  FileText,
  StickyNote,
  Video,
  Plus,
  TrendingUp,
  Lightbulb,
  AlertTriangle,
  ArrowRight,
  Paperclip,
  X,
  Timer,
} from 'lucide-react'
import { GTDWizard } from '@/components/tasks/gtd-wizard'
import { DocumentPicker } from '@/components/documents/document-picker'
import { UploadDialog } from '@/components/accountant/documents/upload-dialog'
import { TimeTracker, type TimeTrackingEntry } from '@/components/tasks/time-tracker'
import { UrgencyBadge } from '@/components/tasks/UrgencyBadge'
import { UrgencyActions, ManagerActions } from '@/components/tasks/UrgencyActions'
import { fireTaskConfetti } from '@/components/gtd/confetti'
import type { Task } from '@/lib/types/tasks'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// ============================================
// TYPES
// ============================================

interface ChecklistItem {
  id: string
  task_id: string
  text: string
  position: number
  completed: boolean
  due_date?: string
  due_time?: string
  assigned_to?: string
  assigned_to_name?: string
  estimated_minutes?: number
  actual_minutes?: number
  completed_by?: string
  completed_at?: string
}

interface Comment {
  id: string
  task_id: string
  user_id: string
  user_name: string
  text: string
  created_at: string
}

type TimelineEventType =
  | 'created' | 'assigned' | 'accepted' | 'started' | 'completed' | 'delegated' | 'comment'
  | 'call' | 'email' | 'document' | 'note' | 'meeting' | 'decision'

interface TimelineEvent {
  id: string
  task_id: string
  event_type: TimelineEventType
  user_name: string
  description: string
  created_at: string
  duration_minutes?: number
  contact_name?: string
}

interface ProgressNote {
  id: string
  task_id: string
  user_id: string
  user_name: string
  current_status: string
  problems?: string
  next_steps?: string
  created_at: string
}

const normalizeProgressNote = (note: any): ProgressNote => ({
  id: note.id,
  task_id: note.task_id,
  user_id: note.user_id || note.author_id || '',
  user_name: note.user_name || note.author_name || 'Neznamy',
  current_status: note.current_status || '',
  problems: note.problems || undefined,
  next_steps: note.next_steps || undefined,
  created_at: note.created_at || new Date().toISOString(),
})

interface LinkedDoc {
  id: string
  document_id: string
  link_type: string
  document: {
    id: string
    file_name: string
    type: string
    status: string
    supplier_name?: string
    total_with_vat?: number
    period: string
  }
}

// ============================================
// CONFIGS
// ============================================

const TIMELINE_EVENT_CONFIG: Record<TimelineEventType, {
  label: string
  icon: typeof Phone
  color: string
  bgColor: string
}> = {
  created: { label: 'Vytvoreno', icon: Circle, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  assigned: { label: 'Prirazeno', icon: User, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  accepted: { label: 'Prijato', icon: UserCheck, color: 'text-green-600', bgColor: 'bg-green-100' },
  started: { label: 'Zahajeno', icon: Play, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  completed: { label: 'Dokonceno', icon: CheckCircle2, color: 'text-green-600', bgColor: 'bg-green-100' },
  delegated: { label: 'Delegovano', icon: Users, color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
  comment: { label: 'Komentar', icon: MessageSquare, color: 'text-gray-600 dark:text-gray-300', bgColor: 'bg-gray-100 dark:bg-gray-700' },
  call: { label: 'Hovor', icon: Phone, color: 'text-cyan-600', bgColor: 'bg-cyan-100' },
  email: { label: 'Email', icon: Mail, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  document: { label: 'Dokument', icon: FileText, color: 'text-amber-600', bgColor: 'bg-amber-100' },
  note: { label: 'Poznamka', icon: StickyNote, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  meeting: { label: 'Schuzka', icon: Video, color: 'text-pink-600', bgColor: 'bg-pink-100' },
  decision: { label: 'Rozhodnuti', icon: Lightbulb, color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
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

type TabKey = 'souhrn' | 'poznamky' | 'ukoly' | 'timeline' | 'dokumenty' | 'hodiny'

// ============================================
// HELPERS
// ============================================

const calculateTotalScore = (task: Task): number =>
  (task.score_money || 0) + (task.score_fire || 0) + (task.score_time || 0) +
  (task.score_distance || 0) + (task.score_personal || 0)

const getScorePriority = (score: number): { label: string; color: string } => {
  if (score >= 9) return { label: 'Vysoka', color: 'text-white bg-red-500' }
  if (score >= 6) return { label: 'Stredni', color: 'text-white bg-orange-500' }
  return { label: 'Nizka', color: 'text-white bg-green-600' }
}

const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    pending: 'Ceka', accepted: 'Prijato', in_progress: 'Probiha',
    waiting_for: 'Ceka na', completed: 'Dokonceno', someday_maybe: 'Nekdy/Mozna',
    awaiting_approval: 'Ke schvaleni', draft: 'Koncept', cancelled: 'Zruseno',
  }
  return map[status] || status
}

const getStatusColor = (status: string) => {
  const map: Record<string, string> = {
    completed: 'bg-green-100 text-green-700 border-green-300',
    in_progress: 'bg-blue-100 text-blue-700 border-blue-300',
    waiting_for: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    accepted: 'bg-purple-100 text-purple-700 border-purple-300',
    awaiting_approval: 'bg-indigo-100 text-indigo-700 border-indigo-300',
    pending: 'bg-gray-100 text-gray-700 border-gray-300',
  }
  return map[status] || 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300'
}

// ============================================
// MAIN COMPONENT
// ============================================

interface UnifiedTaskDetailProps {
  taskId: string
  userId: string
  userName: string
  onBack: () => void
}

export function UnifiedTaskDetail({ taskId, userId, userName, onBack }: UnifiedTaskDetailProps) {
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('souhrn')
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [progressNotes, setProgressNotes] = useState<ProgressNote[]>([])
  const [timeEntries, setTimeEntries] = useState<TimeTrackingEntry[]>([])
  const [linkedDocs, setLinkedDocs] = useState<LinkedDoc[]>([])
  const [apiUsers, setApiUsers] = useState<{ id: string; name: string; role: string }[]>([])

  // Dialogs
  const [newComment, setNewComment] = useState('')
  const [showGTDWizard, setShowGTDWizard] = useState(false)
  const [showDelegateDialog, setShowDelegateDialog] = useState(false)
  const [delegateTo, setDelegateTo] = useState('')
  const [delegateReason, setDelegateReason] = useState('')
  const [showCompletionDialog, setShowCompletionDialog] = useState(false)
  const [completionActualMinutes, setCompletionActualMinutes] = useState('')
  const [completionNote, setCompletionNote] = useState('')
  const [showRejectionDialog, setShowRejectionDialog] = useState(false)
  const [rejectionComment, setRejectionComment] = useState('')
  const [showEventDialog, setShowEventDialog] = useState(false)
  const [newEventType, setNewEventType] = useState<TimelineEventType>('call')
  const [newEventDescription, setNewEventDescription] = useState('')
  const [newEventContact, setNewEventContact] = useState('')
  const [newEventDuration, setNewEventDuration] = useState('')
  const [showProgressNoteDialog, setShowProgressNoteDialog] = useState(false)
  const [newProgressStatus, setNewProgressStatus] = useState('')
  const [newProgressProblems, setNewProgressProblems] = useState('')
  const [newProgressNextSteps, setNewProgressNextSteps] = useState('')
  const [showDocPicker, setShowDocPicker] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [editingDesc, setEditingDesc] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')

  // ============================================
  // DATA FETCHING
  // ============================================

  const persistTaskUpdate = async (changes: Record<string, any>) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
          'x-user-name': userName || 'Ucetni',
        },
        body: JSON.stringify(changes),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Nepodarilo se ulozit zmeny')
      }
    } catch {
      toast.error('Chyba pri ukladani')
    }
  }

  const updateTask = (updater: (prev: Task) => Task) => {
    setTask(prev => {
      if (!prev) return null
      const updated = updater(prev)
      const changes: Record<string, any> = {}
      for (const key of Object.keys(updated) as (keyof Task)[]) {
        if (updated[key] !== prev[key] && key !== 'id' && key !== 'created_at' && key !== 'created_by' && key !== 'created_by_name') {
          changes[key] = updated[key]
        }
      }
      if (Object.keys(changes).length > 0) persistTaskUpdate(changes)
      return updated
    })
  }

  const persistTaskData = (updater: (prevData: Record<string, any>) => Record<string, any>) => {
    setTask(prev => {
      if (!prev) return null
      const prevTaskData = (prev.task_data && typeof prev.task_data === 'object') ? prev.task_data : {}
      const nextTaskData = updater(prevTaskData)
      persistTaskUpdate({ task_data: nextTaskData })
      return { ...prev, task_data: nextTaskData }
    })
  }

  const fetchLinkedDocs = useCallback(() => {
    fetch(`/api/tasks/${taskId}/documents`, { headers: { 'x-user-id': userId } })
      .then(r => r.json())
      .then(data => setLinkedDocs(Array.isArray(data) ? data : []))
      .catch(() => setLinkedDocs([]))
  }, [taskId, userId])

  useEffect(() => {
    async function fetchTask() {
      if (!userId) return
      try {
        const res = await fetch(`/api/tasks/${taskId}`, { headers: { 'x-user-id': userId } })
        if (!res.ok) { setFetchError('Ukol nenalezen'); return }
        const data = await res.json()
        setTask(data.task)
        if (data.task.checklist_items) setChecklistItems(data.task.checklist_items)
        if (Array.isArray(data.task.task_data?.comments)) setComments(data.task.task_data.comments)
        if (Array.isArray(data.task.task_data?.timeline)) {
          setTimeline(data.task.task_data.timeline.sort((a: TimelineEvent, b: TimelineEvent) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()))
        }
        if (data.task.time_entries) {
          setTimeEntries(data.task.time_entries.map((te: any) => ({
            id: te.id, task_id: te.task_id || taskId, user_id: te.user_id,
            user_name: te.user_name || '', started_at: te.started_at,
            stopped_at: te.stopped_at, duration_minutes: te.duration_minutes,
            note: te.note || te.description || '', billable: te.billable || false,
            created_at: te.created_at,
          })))
        }
      } catch { setFetchError('Nepodarilo se nacist ukol') }
      finally { setLoading(false) }
    }
    fetchTask()
  }, [taskId, userId])

  useEffect(() => {
    fetch('/api/accountant/users')
      .then(r => r.json())
      .then(data => setApiUsers((data.users || []).map((u: any) => ({ id: u.id, name: u.name || u.full_name, role: u.role }))))
      .catch(() => {})
  }, [])

  useEffect(() => { fetchLinkedDocs() }, [fetchLinkedDocs])

  useEffect(() => {
    if (!userId) return
    fetch(`/api/tasks/${taskId}/progress-notes`, { headers: { 'x-user-id': userId } })
      .then(r => r.json())
      .then(data => {
        const notes = Array.isArray(data.notes) ? data.notes.map(normalizeProgressNote) : []
        setProgressNotes(notes)
      })
      .catch(() => setProgressNotes([]))
  }, [taskId, userId])

  // ============================================
  // HANDLERS
  // ============================================

  const currentUser = { id: userId, name: userName, role: 'accountant' as const }
  const availableAccountants = apiUsers.filter(u => u.role !== 'client' && u.id !== userId)
  const canApprove = true // demo

  const handleAttachDocs = async (docIds: string[]) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/documents`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-user-id': userId, 'x-user-name': userName || 'Ucetni' },
        body: JSON.stringify({ document_ids: docIds, link_type: 'reference' }),
      })
      if (res.ok) { toast.success(`Pripojeno ${docIds.length} dokumentu`); fetchLinkedDocs() }
      else toast.error('Chyba pri pripojovani')
    } catch { toast.error('Chyba pri pripojovani') }
  }

  const handleDetachDoc = async (documentId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/documents?document_id=${documentId}`, { method: 'DELETE', headers: { 'x-user-id': userId } })
      if (res.ok) { toast.success('Dokument odpojen'); fetchLinkedDocs() }
      else toast.error('Chyba pri odpojovani')
    } catch { toast.error('Chyba pri odpojovani') }
  }

  const handleChecklistToggle = (itemId: string) => {
    setChecklistItems(prev => {
      const nextItems = prev.map(item =>
        item.id === itemId
          ? {
              ...item,
              completed: !item.completed,
              completed_by: !item.completed ? userId : undefined,
              completed_at: !item.completed ? new Date().toISOString() : undefined,
            }
          : item
      )
      const target = nextItems.find(item => item.id === itemId)
      if (target) {
        fetch(`/api/tasks/${taskId}/checklist/${itemId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId,
            'x-user-name': userName || 'Ucetni',
          },
          body: JSON.stringify({
            completed: target.completed,
            completed_by: target.completed ? userId : null,
            completed_at: target.completed ? target.completed_at : null,
          }),
        })
          .then(res => {
            if (!res.ok) throw new Error('save failed')
            toast.success('Checklist aktualizovan')
          })
          .catch(() => toast.error('Checklist se nepodarilo ulozit'))
      }
      return nextItems
    })
  }

  const handleAcceptTask = () => { updateTask(prev => ({ ...prev, status: 'accepted' })); toast.success('Ukol prijat') }
  const handleStartTask = () => { updateTask(prev => ({ ...prev, status: 'in_progress' })); toast.success('Ukol zahajen') }

  const handleDelegateSubmit = () => {
    if (!delegateTo) { toast.error('Vyberte osobu'); return }
    const delegateUser = apiUsers.find(u => u.id === delegateTo)
    updateTask(prev => ({ ...prev, status: 'pending', assigned_to: delegateTo, assigned_to_name: delegateUser?.name || '', updated_at: new Date().toISOString() }))
    setTimeline(prev => {
      const newEvent: TimelineEvent = {
        id: `tl-del-${Date.now()}`,
        task_id: taskId,
        event_type: 'delegated',
        user_name: userName,
        description: `Delegoval(a) na: ${delegateUser?.name}${delegateReason ? ` (${delegateReason})` : ''}`,
        created_at: new Date().toISOString(),
      }
      const next = [...prev, newEvent]
      persistTaskData(taskData => ({ ...taskData, timeline: next }))
      return next
    })
    setShowDelegateDialog(false); setDelegateTo(''); setDelegateReason('')
    toast.success(`Delegovano na ${delegateUser?.name}`)
  }

  const handleMarkComplete = () => {
    const totalLogged = timeEntries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0)
    setCompletionActualMinutes(totalLogged > 0 ? totalLogged.toString() : task?.actual_minutes?.toString() || '')
    setShowCompletionDialog(true)
  }

  const handleSubmitCompletion = () => {
    if (!task) return
    const mins = parseInt(completionActualMinutes)
    if (isNaN(mins) || mins <= 0) { toast.error('Zadejte skutecny cas'); return }
    updateTask(prev => ({ ...prev, status: 'awaiting_approval', actual_minutes: mins, progress_percentage: 100, updated_at: new Date().toISOString() }))
    setTimeline(prev => {
      const newEvent: TimelineEvent = {
        id: `tl-comp-${Date.now()}`,
        task_id: taskId,
        event_type: 'completed',
        user_name: userName,
        description: `Oznacil(a) jako hotovo (${mins} min)${completionNote ? ` - ${completionNote}` : ''}`,
        created_at: new Date().toISOString(),
      }
      const next = [...prev, newEvent]
      persistTaskData(taskData => ({ ...taskData, timeline: next }))
      return next
    })
    setShowCompletionDialog(false); setCompletionActualMinutes(''); setCompletionNote('')
    toast.success('Ukol odeslan ke schvaleni')
  }

  const handleApproveTask = () => {
    updateTask(prev => ({ ...prev, status: 'completed', completed_at: new Date().toISOString(), approved_by: userId, approved_by_name: userName, approved_at: new Date().toISOString() }))
    fireTaskConfetti()
    toast.success('Ukol schvalen')
  }

  const handleRejectTask = () => {
    if (!rejectionComment.trim()) { toast.error('Zadejte duvod vraceni'); return }
    updateTask(prev => ({ ...prev, status: 'in_progress', rejected_by: userId, rejected_by_name: userName, rejected_at: new Date().toISOString(), rejection_comment: rejectionComment, rejection_count: (prev.rejection_count || 0) + 1 }))
    setShowRejectionDialog(false); setRejectionComment('')
    toast.warning('Ukol vracen')
  }

  const handleCancelTask = () => {
    updateTask(prev => ({
      ...prev,
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    }))
    setTimeline(prev => {
      const newEvent: TimelineEvent = {
        id: `tl-cancel-${Date.now()}`,
        task_id: taskId,
        event_type: 'note',
        user_name: userName,
        description: 'Ukol oznacen jako zruseny',
        created_at: new Date().toISOString(),
      }
      const next = [...prev, newEvent]
      persistTaskData(taskData => ({ ...taskData, timeline: next }))
      return next
    })
    toast.success('Ukol oznacen jako zruseny')
  }

  const handleClaimTask = () => {
    if (!task) return
    updateTask(prev => ({ ...prev, claimed_by: userId, claimed_by_name: userName, claimed_at: new Date().toISOString(), assigned_to: userId, assigned_to_name: userName, status: 'accepted' }))
    toast.success(`Bonus ukol prevzat! +${task.points_value || 0} bodu`)
  }

  const handleAddComment = () => {
    if (!newComment.trim()) return
    const note: Comment = {
      id: `c-${Date.now()}`,
      task_id: taskId,
      user_id: userId,
      user_name: userName,
      text: newComment.trim(),
      created_at: new Date().toISOString(),
    }
    setComments(prev => {
      const next = [...prev, note]
      persistTaskData(taskData => ({ ...taskData, comments: next }))
      return next
    })
    setNewComment(''); toast.success('Komentar pridan')
  }

  const handleAddTimelineEvent = () => {
    if (!newEventDescription.trim()) { toast.error('Zadejte popis udalosti'); return }
    setTimeline(prev => {
      const next = [...prev, {
        id: `tl-${newEventType}-${Date.now()}`,
        task_id: taskId,
        event_type: newEventType,
        user_name: userName,
        description: newEventDescription.trim(),
        created_at: new Date().toISOString(),
        ...(newEventContact && { contact_name: newEventContact }),
        ...(newEventDuration && { duration_minutes: parseInt(newEventDuration) }),
      }].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      persistTaskData(taskData => ({ ...taskData, timeline: next }))
      return next
    })
    setShowEventDialog(false); setNewEventDescription(''); setNewEventContact(''); setNewEventDuration('')
    toast.success(`${TIMELINE_EVENT_CONFIG[newEventType].label} zaznamenan`)
  }

  const handleAddProgressNote = async () => {
    if (!newProgressStatus.trim()) { toast.error('Zadejte aktualni stav'); return }
    try {
      const res = await fetch(`/api/tasks/${taskId}/progress-notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
          'x-user-name': userName || 'Ucetni',
        },
        body: JSON.stringify({
          current_status: newProgressStatus.trim(),
          problems: newProgressProblems.trim() || undefined,
          next_steps: newProgressNextSteps.trim() || undefined,
        }),
      })
      if (!res.ok) throw new Error('save failed')
      const data = await res.json()
      setProgressNotes(prev => [normalizeProgressNote(data.note), ...prev])
      setShowProgressNoteDialog(false)
      setNewProgressStatus('')
      setNewProgressProblems('')
      setNewProgressNextSteps('')
      toast.success('Progress note pridan')
    } catch {
      toast.error('Chyba pri ukladani progress note')
    }
  }

  const handleTimeUpdate = (actualMinutes: number, entries: TimeTrackingEntry[]) => {
    updateTask(prev => ({ ...prev, actual_minutes: actualMinutes }))
    setTimeEntries(entries)
  }

  const handleGTDWizardComplete = async (data: any) => {
    updateTask(prev => ({ ...prev, title: data.title, description: data.description, is_project: data.isProject, project_outcome: data.projectOutcome, gtd_context: data.contexts, gtd_energy_level: data.energyLevel, gtd_is_quick_action: data.isQuickAction, estimated_minutes: data.estimatedMinutes, is_billable: data.isBillable, hourly_rate: data.hourlyRate, due_date: data.dueDate, assigned_to: data.assignedTo }))
    setShowGTDWizard(false); toast.success('Ukol aktualizovan')
  }

  // ============================================
  // DERIVED
  // ============================================

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
      </div>
    )
  }

  if (fetchError || !task) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Ukol nenalezen</h2>
        <p className="text-gray-500 mb-4">{fetchError || 'Neznama chyba'}</p>
        <Button variant="outline" onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4" />Zpet</Button>
      </div>
    )
  }

  const totalScore = calculateTotalScore(task)
  const scorePriority = getScorePriority(totalScore)
  const progress = task.is_project && checklistItems.length > 0
    ? Math.round((checklistItems.filter(i => i.completed).length / checklistItems.length) * 100)
    : task.progress_percentage || 0

  const timeData = task.is_project
    ? { estimated: checklistItems.reduce((s, i) => s + (i.estimated_minutes || 0), 0), actual: checklistItems.reduce((s, i) => s + (i.actual_minutes || 0), 0) }
    : { estimated: task.estimated_minutes || 0, actual: task.actual_minutes || 0 }

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="max-w-5xl mx-auto py-8 px-6 space-y-6">
      {/* Header */}
      <div className="mb-2">
        <Button variant="ghost" size="sm" onClick={onBack} className="mb-3 rounded-xl text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Zpet
        </Button>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {editingTitle ? (
              <Input
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                onBlur={() => { if (editTitle.trim() && editTitle !== task.title) { updateTask(prev => ({ ...prev, title: editTitle.trim() })); toast.success('Nazev ulozen') } setEditingTitle(false) }}
                onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') setEditingTitle(false) }}
                className="text-2xl font-bold font-display h-auto py-1"
                autoFocus
              />
            ) : (
              <h1
                className="text-2xl font-bold font-display text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded px-1 -mx-1 truncate"
                onClick={() => { setEditTitle(task.title); setEditingTitle(true) }}
              >
                {task.title}
              </h1>
            )}

            <div className="flex flex-wrap items-center gap-2 mt-2">
              {task.task_type === 'bonus' && (
                <Badge className="bg-amber-500 text-white font-semibold shadow-sm">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  BONUS {task.points_value && `+${task.points_value}b`}
                </Badge>
              )}
              {task.gtd_is_quick_action && (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                  <Zap className="h-3 w-3 mr-1" />&lt; 2 min
                </Badge>
              )}
              {task.is_project && (
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
                  <Target className="h-3 w-3 mr-1" />Projekt
                </Badge>
              )}
              <UrgencyBadge task={task} showDetails size="md" />
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
              <span>
                Posledni aktivita: {new Date(task.updated_at || task.created_at || new Date().toISOString()).toLocaleDateString('cs-CZ')} •
                {' '}Status: <span className="font-medium">{getStatusLabel(task.status)}</span>
              </span>
              <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />{task.company_name}</span>
              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{task.due_date ? new Date(task.due_date).toLocaleDateString('cs-CZ') : '—'}{task.due_time && ` ${task.due_time}`}</span>
              {task.assigned_to_name && <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{task.assigned_to_name}</span>}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <Badge className={cn('text-sm px-3 py-1', scorePriority.color)}>
              {totalScore} &bull; {scorePriority.label}
            </Badge>
            <Badge variant="outline" className={getStatusColor(task.status)}>
              {getStatusLabel(task.status)}
            </Badge>
          </div>
        </div>

        {/* Project progress bar */}
        {task.is_project && (
          <Card className="border-purple-200 bg-purple-50/50 mt-4 rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-purple-900 flex items-center gap-1.5">
                  <Target className="h-4 w-4 text-purple-600" />Progress projektu
                </span>
                <span className="text-xl font-bold text-purple-600">{progress}%</span>
              </div>
              <div className="w-full bg-purple-200 rounded-full h-2.5">
                <div className="bg-gradient-to-r from-purple-600 to-purple-500 h-2.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
              {task.project_outcome && <p className="text-sm text-purple-700 mt-2"><strong>Cil:</strong> {task.project_outcome}</p>}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Top stats cards like timeline-demo */}
      <div className="flex gap-3 flex-wrap">
        <Card className="rounded-xl shadow-soft-sm bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-3 text-center min-w-[110px]">
            <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">Ukoly</div>
            <div className="text-2xl font-bold text-green-700">
              {task.is_project ? `${checklistItems.filter(i => i.completed).length}/${checklistItems.length}` : `${task.status === 'completed' ? 1 : 0}/1`}
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-soft-sm bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="p-3 text-center min-w-[130px]">
            <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">Odpracovano</div>
            <div className="text-lg font-bold text-blue-700">{timeData.actual} min</div>
            <div className="text-xs font-semibold text-gray-900 dark:text-white">{timeEntries.length} zaznamu</div>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-soft-sm bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200">
          <CardContent className="p-3 text-center min-w-[120px]">
            <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">Dokumenty</div>
            <div className="text-2xl font-bold text-amber-700">{linkedDocs.length}</div>
            <div className="text-xs font-semibold text-gray-900 dark:text-white">pripojeno</div>
          </CardContent>
        </Card>
        {task.is_billable && task.hourly_rate ? (
          <Card className="rounded-xl shadow-soft-sm bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
            <CardContent className="p-3 text-center min-w-[130px]">
              <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">Fakturace</div>
              <div className="text-xl font-bold text-purple-700">{Math.round((timeData.actual / 60) * task.hourly_rate).toLocaleString('cs-CZ')} Kc</div>
              <div className="text-xs font-semibold text-gray-900 dark:text-white">{timeData.actual > 0 ? `${(timeData.actual / 60).toFixed(1)}h` : '—'}</div>
            </CardContent>
          </Card>
        ) : null}
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-2 overflow-x-auto">
        {[
          { id: 'souhrn' as TabKey, label: '📋 Souhrn spisu' },
          { id: 'poznamky' as TabKey, label: `📝 Poznamky o prubehu${progressNotes.length ? ` (${progressNotes.length})` : ''}` },
          { id: 'ukoly' as TabKey, label: `✓ Ukoly${task.is_project ? ` (${checklistItems.filter(i => i.completed).length}/${checklistItems.length})` : ''}` },
          { id: 'dokumenty' as TabKey, label: `📎 Dokumenty (${linkedDocs.length})` },
          { id: 'timeline' as TabKey, label: `🕐 Timeline (${timeline.length})` },
          { id: 'hodiny' as TabKey, label: `💰 Hodiny${timeEntries.length ? ` (${timeEntries.length})` : ''}` },
        ].map(tab => {
          const isActive = activeTab === tab.id
          return (
            <Button
              key={tab.id}
              variant={isActive ? 'default' : 'ghost'}
              size="sm"
              className={`shrink-0 ${
                isActive
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : ''
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </Button>
          )
        })}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 flex-wrap">
        <Button onClick={() => setShowEventDialog(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Pridat udalost
        </Button>
        <Button onClick={() => setShowProgressNoteDialog(true)} variant="outline">
          <MessageSquare className="h-4 w-4 mr-2" />
          Pridat poznamku o prubehu
        </Button>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'souhrn' && (
          <SummaryTab
            task={task}
            totalScore={totalScore}
            scorePriority={scorePriority}
            progress={progress}
            timeData={timeData}
            linkedDocsCount={linkedDocs.length}
            progressNotes={progressNotes}
          />
        )}
        {activeTab === 'ukoly' && (
          <SouhrnTab
            task={task} updateTask={updateTask} checklistItems={checklistItems}
            onChecklistToggle={handleChecklistToggle} totalScore={totalScore}
            scorePriority={scorePriority} timeData={timeData}
            onAccept={handleAcceptTask} onStart={handleStartTask}
            onComplete={handleMarkComplete} onDelegate={() => setShowDelegateDialog(true)}
            onClaim={handleClaimTask} onApprove={handleApproveTask}
            onReject={() => setShowRejectionDialog(true)}
            onCancel={handleCancelTask}
            canApprove={canApprove} currentUserId={userId}
            editingDesc={editingDesc} setEditingDesc={setEditingDesc}
            editDesc={editDesc} setEditDesc={setEditDesc}
          />
        )}
        {activeTab === 'poznamky' && (
          <PoznamkyTab
            progressNotes={progressNotes} comments={comments}
            newComment={newComment} setNewComment={setNewComment}
            onAddComment={handleAddComment}
            onAddProgressNote={() => setShowProgressNoteDialog(true)}
          />
        )}
        {activeTab === 'timeline' && (
          <OsaTab
            timeline={timeline}
            onAddEvent={() => setShowEventDialog(true)}
          />
        )}
        {activeTab === 'dokumenty' && (
          <DokumentyTab
            linkedDocs={linkedDocs} companyId={task.company_id}
            taskId={taskId} userId={userId} userName={userName || ''}
            onAttach={() => setShowDocPicker(true)}
            onDetach={handleDetachDoc}
            onRefresh={fetchLinkedDocs}
          />
        )}
        {activeTab === 'hodiny' && (
          <HodinyTab
            task={task} timeEntries={timeEntries} timeData={timeData}
            onTimeUpdate={handleTimeUpdate} userId={userId} userName={userName}
          />
        )}
      </div>

      {/* ============================================ */}
      {/* DIALOGS */}
      {/* ============================================ */}

      {/* Document Picker */}
      {task.company_id && (
        <DocumentPicker
          companyId={task.company_id}
          open={showDocPicker}
          onOpenChange={setShowDocPicker}
          onSelect={handleAttachDocs}
          excludeIds={linkedDocs.map(l => l.document_id)}
        />
      )}

      {/* GTD Wizard */}
      {showGTDWizard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <GTDWizard
              companyId={task.company_id} companyName={task.company_name}
              onComplete={handleGTDWizardComplete} onCancel={() => setShowGTDWizard(false)}
              initialData={{ title: task.title, description: task.description, isProject: task.is_project, projectOutcome: task.project_outcome || '', isQuickAction: task.gtd_is_quick_action || false, shouldDelegate: false, contexts: (task.gtd_context || []) as string[], energyLevel: task.gtd_energy_level || '', estimatedMinutes: task.estimated_minutes, isBillable: task.is_billable, hourlyRate: task.hourly_rate, dueDate: task.due_date, assignedTo: task.assigned_to, subtasks: [] }}
              availableUsers={apiUsers.map(u => ({ id: u.id, name: u.name }))}
            />
          </div>
        </div>
      )}

      {/* Delegate Dialog */}
      <Dialog open={showDelegateDialog} onOpenChange={setShowDelegateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Delegovat ukol</DialogTitle>
            <DialogDescription>Vyberte kolegu pro delegovani</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Delegovat komu *</Label>
              <Select value={delegateTo} onValueChange={setDelegateTo}>
                <SelectTrigger><SelectValue placeholder="Vyberte osobu..." /></SelectTrigger>
                <SelectContent>
                  {availableAccountants.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Duvod (volitelne)</Label>
              <Textarea value={delegateReason} onChange={e => setDelegateReason(e.target.value)} placeholder="Napr. lepsi znalost klienta..." rows={3} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setShowDelegateDialog(false); setDelegateTo(''); setDelegateReason('') }}>Zrusit</Button>
            <Button onClick={handleDelegateSubmit} disabled={!delegateTo} className="bg-blue-600 hover:bg-blue-700"><Users className="mr-2 h-4 w-4" />Delegovat</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Completion Dialog */}
      <Dialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-green-600" />Dokoncit ukol</DialogTitle>
            <DialogDescription>Vyplnte skutecny cas</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {task.estimated_minutes && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Odhad:</span><span className="font-semibold">{task.estimated_minutes} min</span></div>
              </div>
            )}
            <div className="space-y-2">
              <Label>Skutecny cas (minuty) *</Label>
              <Input type="number" min="1" placeholder="45" value={completionActualMinutes} onChange={e => setCompletionActualMinutes(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Poznamka (volitelne)</Label>
              <Textarea value={completionNote} onChange={e => setCompletionNote(e.target.value)} placeholder="Co bylo udelano..." rows={3} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCompletionDialog(false)}>Zrusit</Button>
            <Button onClick={handleSubmitCompletion} className="bg-green-600 hover:bg-green-700"><CheckCircle2 className="mr-2 h-4 w-4" />Odeslat</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={showRejectionDialog} onOpenChange={setShowRejectionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Vratit k prepracovani</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Duvod vraceni *</Label>
              <Textarea value={rejectionComment} onChange={e => setRejectionComment(e.target.value)} placeholder="Duvod vraceni..." rows={3} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowRejectionDialog(false)}>Zrusit</Button>
            <Button onClick={handleRejectTask} variant="destructive">Vratit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Timeline Event Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Zaznamenat udalost</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Typ udalosti</Label>
              <Select value={newEventType} onValueChange={v => setNewEventType(v as TimelineEventType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(['call', 'email', 'meeting', 'document', 'note', 'decision'] as TimelineEventType[]).map(t => (
                    <SelectItem key={t} value={t}>{TIMELINE_EVENT_CONFIG[t].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Popis *</Label>
              <Textarea value={newEventDescription} onChange={e => setNewEventDescription(e.target.value)} placeholder="Popis udalosti..." rows={3} />
            </div>
            {(newEventType === 'call' || newEventType === 'email' || newEventType === 'meeting') && (
              <div className="space-y-2">
                <Label>Kontakt</Label>
                <Input value={newEventContact} onChange={e => setNewEventContact(e.target.value)} placeholder="Jmeno / organizace" />
              </div>
            )}
            {(newEventType === 'call' || newEventType === 'meeting') && (
              <div className="space-y-2">
                <Label>Trvani (minuty)</Label>
                <Input type="number" value={newEventDuration} onChange={e => setNewEventDuration(e.target.value)} placeholder="30" />
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowEventDialog(false)}>Zrusit</Button>
            <Button onClick={handleAddTimelineEvent} className="bg-purple-600 hover:bg-purple-700">Zaznamenat</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Progress Note Dialog */}
      <Dialog open={showProgressNoteDialog} onOpenChange={setShowProgressNoteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pridat progress note</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Aktualni stav *</Label>
              <Textarea value={newProgressStatus} onChange={e => setNewProgressStatus(e.target.value)} placeholder="Co se aktualne deje..." rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Problemy (volitelne)</Label>
              <Textarea value={newProgressProblems} onChange={e => setNewProgressProblems(e.target.value)} placeholder="Zjistene problemy..." rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Dalsi kroky (volitelne)</Label>
              <Textarea value={newProgressNextSteps} onChange={e => setNewProgressNextSteps(e.target.value)} placeholder="1. ... 2. ..." rows={2} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowProgressNoteDialog(false)}>Zrusit</Button>
            <Button onClick={handleAddProgressNote} className="bg-emerald-600 hover:bg-emerald-700">Pridat</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============================================
// TAB 1: SOUHRN
// ============================================

function SummaryTab({ task, totalScore, scorePriority, progress, timeData, linkedDocsCount, progressNotes }: {
  task: Task
  totalScore: number
  scorePriority: { label: string; color: string }
  progress: number
  timeData: { estimated: number; actual: number }
  linkedDocsCount: number
  progressNotes: ProgressNote[]
}) {
  const latestNote = progressNotes[0]
  const latestStatus = latestNote?.current_status || task.description || 'Zatim bez popisu.'

  return (
    <div className="space-y-6">
      <Card className="rounded-xl shadow-soft border-green-200 bg-green-50">
        <CardContent className="p-6">
          <h2 className="text-lg font-bold mb-2">📍 Kde jsme skoncili</h2>
          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-green-100">
            {latestNote && (
              <div className="text-sm text-gray-600 dark:text-gray-300 mb-2" suppressHydrationWarning>
                {new Date(latestNote.created_at).toLocaleString('cs-CZ')} • {latestNote.user_name}
              </div>
            )}
            <div className="space-y-3">
              <div>
                <div className="font-semibold text-gray-900 dark:text-white mb-1">Aktualni stav:</div>
                <div className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{latestStatus}</div>
              </div>
              {latestNote?.problems && (
                <div>
                  <div className="font-semibold text-red-700 mb-1">Problemy:</div>
                  <div className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{latestNote.problems}</div>
                </div>
              )}
              {latestNote?.next_steps && (
                <div>
                  <div className="font-semibold text-blue-700 mb-1">Dalsi kroky:</div>
                  <div className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{latestNote.next_steps}</div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-xl shadow-soft-sm"><CardContent className="p-4"><div className="text-sm text-gray-600 mb-1">Priorita</div><div className="text-xl font-bold">{scorePriority.label}</div><div className="text-xs text-gray-500 mt-1">Skore {totalScore}/12</div></CardContent></Card>
        <Card className="rounded-xl shadow-soft-sm"><CardContent className="p-4"><div className="text-sm text-gray-600 mb-1">Postup</div><div className="text-xl font-bold">{progress}%</div><div className="text-xs text-gray-500 mt-1">{timeData.actual} min odpracovano</div></CardContent></Card>
        <Card className="rounded-xl shadow-soft-sm"><CardContent className="p-4"><div className="text-sm text-gray-600 mb-1">Dokumenty</div><div className="text-xl font-bold">{linkedDocsCount}</div><div className="text-xs text-gray-500 mt-1">{task.is_project ? 'projekt' : 'ukol'}</div></CardContent></Card>
      </div>
    </div>
  )
}

function SouhrnTab({ task, updateTask, checklistItems, onChecklistToggle, totalScore, scorePriority, timeData, onAccept, onStart, onComplete, onDelegate, onClaim, onApprove, onReject, onCancel, canApprove, currentUserId, editingDesc, setEditingDesc, editDesc, setEditDesc }: {
  task: Task
  updateTask: (updater: (prev: Task) => Task) => void
  checklistItems: ChecklistItem[]
  onChecklistToggle: (id: string) => void
  totalScore: number
  scorePriority: { label: string; color: string }
  timeData: { estimated: number; actual: number }
  onAccept: () => void
  onStart: () => void
  onComplete: () => void
  onDelegate: () => void
  onClaim: () => void
  onApprove: () => void
  onReject: () => void
  onCancel: () => void
  canApprove: boolean
  currentUserId: string
  editingDesc: boolean
  setEditingDesc: (v: boolean) => void
  editDesc: string
  setEditDesc: (v: string) => void
}) {
  const isBonusAvailable = task.task_type === 'bonus' && !task.claimed_by && !task.assigned_to
  const isBonusClaimed = task.task_type === 'bonus' && task.claimed_by
  const openChecklist = checklistItems.filter(i => !i.completed)
  const doneChecklist = checklistItems.filter(i => i.completed)

  return (
    <div className="space-y-4">
      {/* Description */}
      <Card className="rounded-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            Popis ukolu
            {!editingDesc && (
              <Button variant="ghost" size="sm" onClick={() => { setEditDesc(task.description || ''); setEditingDesc(true) }}>
                <Edit2 className="h-3 w-3 mr-1" />Upravit
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {editingDesc ? (
            <div className="space-y-2">
              <Textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={4} autoFocus />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => { if (editDesc !== (task.description || '')) { updateTask(prev => ({ ...prev, description: editDesc.trim() })); toast.success('Popis ulozen') } setEditingDesc(false) }}>Ulozit</Button>
                <Button size="sm" variant="outline" onClick={() => setEditingDesc(false)}>Zrusit</Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded p-1 -m-1" onClick={() => { setEditDesc(task.description || ''); setEditingDesc(true) }}>
              {task.description || 'Klikni pro pridani popisu...'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Two-column: R-Score + GTD */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* R-Tasks Score Card */}
        <Card className="rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-1.5"><TrendingUp className="h-4 w-4" />R-Tasks Score</span>
              <Badge className={cn('text-sm px-2 py-0.5', scorePriority.color)}>{totalScore}/12</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* Score dropdowns */}
            {([
              { key: 'score_money' as const, label: 'Money', emoji: '\uD83D\uDCB0', options: SCORE_OPTIONS.money },
              { key: 'score_fire' as const, label: 'Fire', emoji: '\uD83D\uDD25', options: SCORE_OPTIONS.fire },
              { key: 'score_time' as const, label: 'Time', emoji: '\u23F1\uFE0F', options: SCORE_OPTIONS.time },
              { key: 'score_distance' as const, label: 'Distance', emoji: '\uD83D\uDCCD', options: SCORE_OPTIONS.distance },
              { key: 'score_personal' as const, label: 'Personal', emoji: '\u2764\uFE0F', options: SCORE_OPTIONS.personal },
            ] as const).map(({ key, label, emoji, options }) => (
              <div key={key} className="flex items-center gap-2">
                <span className="text-xs w-20 text-gray-500 flex items-center gap-1">{emoji} {label}</span>
                <Select
                  value={(task[key] ?? 0).toString()}
                  onValueChange={v => { updateTask(prev => ({ ...prev, [key]: parseInt(v) })); toast.success('Score aktualizovano') }}
                >
                  <SelectTrigger className="h-7 text-xs flex-1"><SelectValue /></SelectTrigger>
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
          </CardContent>
        </Card>

        {/* Workflow Actions */}
        <Card className="rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-1.5"><Target className="h-4 w-4" />Workflow akce</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Action buttons */}
            <div className="space-y-1.5">
              {isBonusAvailable && (
                <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 h-8 text-xs" onClick={onClaim}>
                  <TrendingUp className="mr-1.5 h-3.5 w-3.5" />Prevzit bonus (+{task.points_value || 0}b)
                </Button>
              )}
              {isBonusClaimed && task.claimed_by !== currentUserId && (
                <p className="text-xs text-gray-500">Prevzal(a): {task.claimed_by_name}</p>
              )}

              {task.status === 'pending' && (
                <>
                  <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 h-8 text-xs" onClick={onAccept}><UserCheck className="mr-1.5 h-3.5 w-3.5" />Prijmout</Button>
                  <Button size="sm" variant="outline" className="w-full h-8 text-xs" onClick={onDelegate}><Users className="mr-1.5 h-3.5 w-3.5" />Delegovat</Button>
                </>
              )}
              {task.status === 'accepted' && (
                <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 h-8 text-xs" onClick={onStart}><Play className="mr-1.5 h-3.5 w-3.5" />Zacit pracovat</Button>
              )}
              {(task.status === 'in_progress' || task.status === 'accepted') && (
                <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 h-8 text-xs" onClick={onComplete}><CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />Oznacit jako hotovo</Button>
              )}
              {task.status === 'awaiting_approval' && canApprove && (
                <>
                  <div className="p-2 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800 mb-1">
                    Ceka na schvaleni ({task.actual_minutes} min)
                  </div>
                  <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 h-8 text-xs" onClick={onApprove}><CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />Schvalit</Button>
                  <Button size="sm" variant="outline" className="w-full h-8 text-xs" onClick={onReject}><AlertCircle className="mr-1.5 h-3.5 w-3.5" />Vratit</Button>
                </>
              )}
              {!['completed', 'cancelled'].includes(task.status) && (
                <Button size="sm" variant="outline" className="w-full h-8 text-xs text-red-600 border-red-300 hover:bg-red-50" onClick={onCancel}>
                  Oznacit jako zruseny
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Waiting for */}
      {task.is_waiting_for && (
        <Card className="border-yellow-200 bg-yellow-50 rounded-xl">
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2 text-yellow-900"><Clock className="h-4 w-4" />Cekam na</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {task.waiting_for_who && <div><Label className="text-yellow-900 text-xs">Kdo:</Label><p className="text-sm text-yellow-800 font-medium">{task.waiting_for_who}</p></div>}
            {task.waiting_for_what && <div><Label className="text-yellow-900 text-xs">Co:</Label><p className="text-sm text-yellow-800 font-medium">{task.waiting_for_what}</p></div>}
            <Separator className="my-2" />
            <UrgencyActions task={task} onTaskUpdate={updated => updateTask(() => updated)} />
            {task.escalated_to && <ManagerActions task={task} onTaskUpdate={updated => updateTask(() => updated)} currentUserId={currentUserId} />}
          </CardContent>
        </Card>
      )}

      {/* Checklist for projects */}
      {task.is_project && checklistItems.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="rounded-xl shadow-soft border-red-200">
            <CardContent className="p-5">
              <h3 className="font-bold text-red-700 mb-3">🔥 Nedokoncene ukoly ({openChecklist.length})</h3>
              <div className="space-y-2">
                {openChecklist.map(item => (
                  <div key={item.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg cursor-pointer" onClick={() => onChecklistToggle(item.id)}>
                    <Checkbox checked={item.completed} className="mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{item.text}</div>
                      <div className="flex gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {item.due_date && <span>⏰ {new Date(item.due_date).toLocaleDateString('cs-CZ')}</span>}
                        {item.assigned_to_name && <span>👤 {item.assigned_to_name}</span>}
                        {item.estimated_minutes && <span>🕐 {item.estimated_minutes} min</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl shadow-soft border-green-200">
            <CardContent className="p-5">
              <h3 className="font-bold text-green-700 mb-3">✅ Dokoncene ukoly ({doneChecklist.length})</h3>
              <div className="space-y-2">
                {doneChecklist.map(item => (
                  <div key={item.id} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg opacity-80 cursor-pointer" onClick={() => onChecklistToggle(item.id)}>
                    <Checkbox checked={item.completed} className="mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium line-through truncate">{item.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

// ============================================
// TAB 2: POZNAMKY
// ============================================

function PoznamkyTab({ progressNotes, comments, newComment, setNewComment, onAddComment, onAddProgressNote }: {
  progressNotes: ProgressNote[]
  comments: Comment[]
  newComment: string
  setNewComment: (v: string) => void
  onAddComment: () => void
  onAddProgressNote: () => void
}) {
  return (
    <div className="space-y-4">
      {/* Progress Notes */}
      <Card className="rounded-xl border-emerald-200">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><Lightbulb className="h-4 w-4 text-emerald-600" />Aktualni stav</CardTitle>
            <Button size="sm" variant="outline" onClick={onAddProgressNote} className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 h-7 text-xs">
              <Plus className="h-3.5 w-3.5 mr-1" />Pridat update
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {progressNotes.length === 0 ? (
            <div className="text-center py-6 text-gray-400"><Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-30" /><p className="text-sm">Zatim zadne progress notes</p></div>
          ) : progressNotes.map(note => (
            <div key={note.id} className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-emerald-800">{note.user_name}</span>
                <span className="text-xs text-gray-500" suppressHydrationWarning>{new Date(note.created_at).toLocaleString('cs-CZ')}</span>
              </div>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5"><CheckCircle2 className="h-3 w-3 text-emerald-600" /></div>
                  <div><p className="text-[10px] font-medium text-emerald-700 uppercase">Stav</p><p className="text-sm text-gray-700 dark:text-gray-200">{note.current_status}</p></div>
                </div>
                {note.problems && (
                  <div className="flex gap-2">
                    <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center shrink-0 mt-0.5"><AlertTriangle className="h-3 w-3 text-orange-600" /></div>
                    <div><p className="text-[10px] font-medium text-orange-700 uppercase">Problemy</p><p className="text-sm text-gray-700 dark:text-gray-200">{note.problems}</p></div>
                  </div>
                )}
                {note.next_steps && (
                  <div className="flex gap-2">
                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5"><ArrowRight className="h-3 w-3 text-blue-600" /></div>
                    <div><p className="text-[10px] font-medium text-blue-700 uppercase">Dalsi kroky</p><p className="text-sm text-gray-700 dark:text-gray-200">{note.next_steps}</p></div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Comments */}
      <Card className="rounded-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><MessageSquare className="h-4 w-4" />Komentare ({comments.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {comments.map(c => (
            <div key={c.id} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{c.user_name}</span>
                <span className="text-xs text-gray-500" suppressHydrationWarning>{new Date(c.created_at).toLocaleString('cs-CZ')}</span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-200">{c.text}</p>
            </div>
          ))}
          <div className="space-y-2 pt-3 border-t">
            <Textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Napiste komentar..." rows={3} />
            <Button onClick={onAddComment} disabled={!newComment.trim()} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
              <Send className="mr-1.5 h-3.5 w-3.5" />Pridat
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================
// TAB 3: OSA (Timeline)
// ============================================

function OsaTab({ timeline, onAddEvent }: {
  timeline: TimelineEvent[]
  onAddEvent: () => void
}) {
  const grouped = timeline.reduce<Record<string, TimelineEvent[]>>((acc, ev) => {
    const d = new Date(ev.created_at)
    const key = d.toISOString().slice(0, 10)
    if (!acc[key]) acc[key] = []
    acc[key].push(ev)
    return acc
  }, {})
  const groupedEntries = Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a))

  return (
    <Card className="rounded-xl">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2"><History className="h-4 w-4" />Timeline ({timeline.length})</CardTitle>
          <Button size="sm" variant="outline" onClick={onAddEvent} className="h-7 text-xs"><Plus className="h-3.5 w-3.5 mr-1" />Zaznamenat</Button>
        </div>
      </CardHeader>
      <CardContent>
        {groupedEntries.length === 0 ? (
          <div className="text-center py-8 text-gray-400"><History className="h-8 w-8 mx-auto mb-2 opacity-30" /><p className="text-sm">Zatim zadne udalosti</p></div>
        ) : (
          <div className="space-y-5">
            {groupedEntries.map(([day, events]) => (
              <div key={day} className="space-y-3">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {new Date(day).toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
                {events.map((event, index) => {
                  const config = TIMELINE_EVENT_CONFIG[event.event_type]
                  const EventIcon = config.icon
                  return (
                    <div key={event.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={cn("w-7 h-7 rounded-full flex items-center justify-center", config.bgColor)}>
                          <EventIcon className={cn("h-3.5 w-3.5", config.color)} />
                        </div>
                        {index < events.length - 1 && <div className="w-0.5 flex-1 min-h-[12px] bg-gray-200" />}
                      </div>
                      <div className="flex-1 pb-3">
                        <div className="flex items-center gap-2 mb-0.5">
                          <Badge variant="outline" className={cn("text-[10px]", config.bgColor, config.color)}>{config.label}</Badge>
                          {event.duration_minutes && <Badge variant="outline" className="text-[10px]"><Clock className="h-3 w-3 mr-0.5" />{event.duration_minutes} min</Badge>}
                        </div>
                        <p className="text-sm font-medium">{event.description}</p>
                        {event.contact_name && <p className="text-xs text-gray-500 flex items-center gap-1"><Building2 className="h-3 w-3" />{event.contact_name}</p>}
                        <p className="text-xs text-gray-400" suppressHydrationWarning>{event.user_name} &bull; {new Date(event.created_at).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================
// TAB 4: DOKUMENTY
// ============================================

function DokumentyTab({ linkedDocs, companyId, taskId, userId, userName, onAttach, onDetach, onRefresh }: {
  linkedDocs: LinkedDoc[]
  companyId: string
  taskId: string
  userId: string
  userName: string
  onAttach: () => void
  onDetach: (docId: string) => void
  onRefresh: () => void
}) {
  const [showUpload, setShowUpload] = useState(false)

  return (
    <Card className="rounded-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2"><FileText className="h-4 w-4" />Dokumenty ({linkedDocs.length})</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setShowUpload(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Nahrat novy
            </Button>
            {companyId && <Button variant="outline" size="sm" onClick={onAttach} className="h-7 text-xs"><Paperclip className="h-3.5 w-3.5 mr-1" />Pripojit existujici</Button>}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <UploadDialog
          open={showUpload}
          onOpenChange={setShowUpload}
          companyId={companyId}
          taskId={taskId}
          userId={userId}
          userName={userName}
          onUploaded={onRefresh}
        />
        {linkedDocs.length === 0 ? (
          <div className="text-center py-8 text-gray-400"><FileText className="h-8 w-8 mx-auto mb-2 opacity-30" /><p className="text-sm">Zadne pripojene dokumenty</p></div>
        ) : (
          <div className="divide-y">
            {linkedDocs.map(link => (
              <div key={link.id} className="flex items-center gap-3 py-2.5">
                <FileText className="h-4 w-4 text-gray-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{link.document.file_name}</div>
                  <div className="text-xs text-gray-500 flex gap-2">
                    <span>{link.document.period}</span>
                    {link.document.supplier_name && <span>{link.document.supplier_name}</span>}
                    {link.document.total_with_vat != null && <span>{link.document.total_with_vat.toLocaleString('cs-CZ')} Kc</span>}
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] shrink-0">
                  {link.document.type === 'bank_statement' ? 'Vypis' : link.document.type === 'expense_invoice' ? 'Naklad' : link.document.type === 'income_invoice' ? 'Prijem' : link.document.type}
                </Badge>
                <Button variant="ghost" size="sm" onClick={() => onDetach(link.document_id)} className="h-7 w-7 p-0 text-gray-400 hover:text-red-600">
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================
// TAB 5: HODINY
// ============================================

function HodinyTab({ task, timeEntries, timeData, onTimeUpdate, userId, userName }: {
  task: Task
  timeEntries: TimeTrackingEntry[]
  timeData: { estimated: number; actual: number }
  onTimeUpdate: (actualMinutes: number, entries: TimeTrackingEntry[]) => void
  userId: string
  userName: string
}) {
  const [showBillingReport, setShowBillingReport] = useState(false)
  const rate = task.hourly_rate || 0
  const billableEntries = timeEntries.filter(e => e.billable)
  const billableMinutes = billableEntries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0)
  const totalCost = Math.round((billableMinutes / 60) * rate)

  const formatDur = (mins: number) => {
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return h > 0 ? `${h}h ${m}min` : `${m} min`
  }

  return (
    <div className="space-y-4">
      {/* Time Tracker */}
      <TimeTracker
        taskId={task.id}
        companyId={task.company_id}
        companyName={task.company_name}
        taskTitle={task.title}
        estimatedMinutes={task.estimated_minutes}
        actualMinutes={task.actual_minutes}
        hourlyRate={task.hourly_rate}
        isBillable={task.is_billable}
        isProject={task.is_project || false}
        onTimeUpdate={onTimeUpdate}
        currentUserId={userId}
        currentUserName={userName}
        initialEntries={timeEntries}
      />

      {/* Toggle billing report */}
      {task.is_billable && rate > 0 && (
        <Button
          onClick={() => setShowBillingReport(!showBillingReport)}
          variant={showBillingReport ? 'default' : 'outline'}
          className={showBillingReport ? 'bg-purple-600 hover:bg-purple-700 w-full' : 'w-full'}
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          {showBillingReport ? 'Skryt' : 'Zobrazit'} prehled hodin
        </Button>
      )}

      {/* Billing report - Osa style */}
      {showBillingReport && task.is_billable && rate > 0 && (
        <Card className="rounded-xl shadow-soft border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold font-display text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Prehled hodin a podklad pro fakturaci
            </h2>

            {billableEntries.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Zatim zadne fakturovatelne zaznamy</p>
              </div>
            ) : (
              <div className="space-y-2">
                {billableEntries.map(entry => {
                  const mins = entry.duration_minutes || 0
                  const cost = Math.round((mins / 60) * rate)
                  return (
                    <div key={entry.id} className="bg-white dark:bg-gray-800 rounded-lg p-3 flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-medium text-sm text-gray-900 dark:text-white">{entry.user_name}</span>
                          <Badge className="bg-green-600 text-white text-[10px] px-1.5 py-0">Fakturovatelne</Badge>
                        </div>
                        {entry.note && <p className="text-xs text-gray-600 dark:text-gray-300 italic">{entry.note}</p>}
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5" suppressHydrationWarning>
                          {new Date(entry.stopped_at || entry.created_at).toLocaleDateString('cs-CZ')}
                          {entry.stopped_at && ` ${new Date(entry.stopped_at).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}`}
                        </div>
                      </div>
                      <div className="text-right ml-4 shrink-0">
                        <div className="font-semibold text-purple-700">{formatDur(mins)}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-300">{cost.toLocaleString('cs-CZ')} Kc</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Total */}
            <div className="mt-4 pt-4 border-t-2 border-purple-300">
              <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-4">
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">Celkem k fakturaci</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Sazba: {rate} Kc/hod &bull; {billableEntries.length} zaznamu
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-purple-700">{formatDur(billableMinutes)}</div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{totalCost.toLocaleString('cs-CZ')} Kc</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Simple billing summary (always visible when billable) */}
      {task.is_billable && rate > 0 && !showBillingReport && (
        <Card className="rounded-xl">
          <CardContent className="p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Sazba:</span><span className="font-semibold">{rate} Kc/hod</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Odhad:</span><span className="font-semibold">{formatDur(timeData.estimated)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Skutecne:</span><span className="font-semibold">{formatDur(timeData.actual)}</span></div>
            <Separator />
            <div className="flex justify-between text-base"><span className="font-semibold">Celkem k fakturaci:</span><span className="font-bold text-green-600">{totalCost.toLocaleString('cs-CZ')} Kc</span></div>
          </CardContent>
        </Card>
      )}

      {/* Project time summary */}
      {task.is_project && (
        <Card className="rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" />Casovy souhrn projektu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Odhad:</span><span className="font-semibold">{formatDur(timeData.estimated)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Skutecne:</span><span className="font-semibold">{formatDur(timeData.actual)}</span></div>
            <div className="flex justify-between">
              <span className="text-gray-500">Rozdil:</span>
              <span className={cn("font-semibold", timeData.actual > timeData.estimated ? "text-red-600" : "text-green-600")}>
                {timeData.actual > timeData.estimated ? '+' : ''}{timeData.actual - timeData.estimated} min
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
