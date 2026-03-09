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
  Loader2,
  ChevronDown,
  ChevronRight,
  Square,
} from 'lucide-react'
import { GTDWizard } from '@/components/tasks/gtd-wizard'
import { DocumentPicker } from '@/components/documents/document-picker'
import { UploadDialog } from '@/components/accountant/documents/upload-dialog'
// TimeTrackingEntry type (was imported from time-tracker, now local)
interface TimeTrackingEntry {
  id: string
  task_id: string
  user_id: string
  user_name: string
  started_at: string
  stopped_at?: string
  duration_minutes?: number
  note?: string
  billable: boolean
  created_at: string
}
import { UrgencyBadge } from '@/components/tasks/UrgencyBadge'
import { UrgencyActions, ManagerActions } from '@/components/tasks/UrgencyActions'
import { fireTaskConfetti } from '@/components/gtd/confetti'
import type { Task } from '@/lib/types/tasks'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useAccountantUser } from '@/lib/contexts/accountant-user-context'

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

type SpisFilterKey = 'all' | 'documents' | 'notes' | 'communication' | 'work'

type SpisEntryType = 'progress_note' | 'comment' | 'timeline_event' | 'document_added' | 'work_session'

interface SpisEntry {
  id: string
  type: SpisEntryType
  user_name: string
  created_at: string
  duration_minutes?: number
  data: ProgressNote | Comment | TimelineEvent | LinkedDoc | TimeTrackingEntry
}

type UnifiedEntryType = 'note' | 'communication' | 'document'

type TabKey = 'spis' | 'ukoly' | 'dokumenty' | 'vykaz'

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
  const [activeTab, setActiveTab] = useState<TabKey>('spis')
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
  // Unified "Přidat záznam" dialog
  const [showSpisDialog, setSpisDialog] = useState(false)
  const [spisEntryType, setSpisEntryType] = useState<UnifiedEntryType>('note')
  // Note fields
  const [spisNoteStatus, setSpisNoteStatus] = useState('')
  const [spisNoteProblems, setSpisNoteProblems] = useState('')
  const [spisNoteNextSteps, setSpisNoteNextSteps] = useState('')
  // Communication fields
  const [spisCommType, setSpisCommType] = useState<TimelineEventType>('call')
  const [spisCommDescription, setSpisCommDescription] = useState('')
  const [spisCommContact, setSpisCommContact] = useState('')
  // Shared: time spent
  const [spisTimeSpent, setSpisTimeSpent] = useState('')
  // Spis filter
  const [spisFilter, setSpisFilter] = useState<SpisFilterKey>('all')
  const [showDocPicker, setShowDocPicker] = useState(false)
  const [autoOpenUpload, setAutoOpenUpload] = useState(0)
  const [editingTitle, setEditingTitle] = useState(false)
  const [editingDesc, setEditingDesc] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [showRScorePanel, setShowRScorePanel] = useState(false)
  const [showConvertDialog, setShowConvertDialog] = useState(false)

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
            user_name: te.user_name || '', started_at: te.started_at || te.date,
            stopped_at: te.stopped_at || te.date, duration_minutes: te.duration_minutes || te.minutes,
            note: te.note || te.description || '', billable: te.billable !== false,
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

  const logTimeEntry = async (minutes: number, description: string) => {
    if (minutes <= 0) return
    try {
      await fetch('/api/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId, 'x-user-name': userName || 'Ucetni' },
        body: JSON.stringify({ task_id: taskId, company_id: task?.company_id, duration_minutes: minutes, note: description, billable: task?.is_billable || false }),
      })
      // Refresh time entries
      const res = await fetch(`/api/tasks/${taskId}`, { headers: { 'x-user-id': userId } })
      if (res.ok) {
        const data = await res.json()
        if (data.task?.time_entries) {
          const entries = data.task.time_entries.map((te: any) => ({
            id: te.id, task_id: te.task_id || taskId, user_id: te.user_id,
            user_name: te.user_name || '', started_at: te.started_at || te.date,
            stopped_at: te.stopped_at || te.date, duration_minutes: te.duration_minutes || te.minutes,
            note: te.note || te.description || '', billable: te.billable !== false,
            created_at: te.created_at,
          }))
          setTimeEntries(entries)
          const total = entries.reduce((s: number, e: TimeTrackingEntry) => s + (e.duration_minutes || 0), 0)
          updateTask(prev => ({ ...prev, actual_minutes: total }))
        }
      }
    } catch { /* silently fail, main action already succeeded */ }
  }

  const handleAddSpisEntry = async () => {
    if (spisEntryType === 'note') {
      if (!spisNoteStatus.trim()) { toast.error('Zadejte aktualni stav'); return }
      try {
        const res = await fetch(`/api/tasks/${taskId}/progress-notes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-id': userId, 'x-user-name': userName || 'Ucetni' },
          body: JSON.stringify({ current_status: spisNoteStatus.trim(), problems: spisNoteProblems.trim() || undefined, next_steps: spisNoteNextSteps.trim() || undefined }),
        })
        if (!res.ok) throw new Error('save failed')
        const data = await res.json()
        setProgressNotes(prev => [normalizeProgressNote(data.note), ...prev])
        toast.success('Zaznam pridan do spisu')
      } catch { toast.error('Chyba pri ukladani'); return }
    } else if (spisEntryType === 'communication') {
      if (!spisCommDescription.trim()) { toast.error('Zadejte popis'); return }
      setTimeline(prev => {
        const next = [...prev, {
          id: `tl-${spisCommType}-${Date.now()}`,
          task_id: taskId,
          event_type: spisCommType,
          user_name: userName,
          description: spisCommDescription.trim(),
          created_at: new Date().toISOString(),
          ...(spisCommContact && { contact_name: spisCommContact }),
          ...(spisTimeSpent && { duration_minutes: parseInt(spisTimeSpent) }),
        }].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        persistTaskData(taskData => ({ ...taskData, timeline: next }))
        return next
      })
      toast.success(`${TIMELINE_EVENT_CONFIG[spisCommType].label} zaznamenan`)
    }
    // Log time if provided
    const mins = parseInt(spisTimeSpent)
    if (!isNaN(mins) && mins > 0) {
      const desc = spisEntryType === 'note' ? spisNoteStatus.trim() : spisCommDescription.trim()
      logTimeEntry(mins, desc)
    }
    // Reset all fields
    setSpisDialog(false)
    setSpisNoteStatus(''); setSpisNoteProblems(''); setSpisNoteNextSteps('')
    setSpisCommDescription(''); setSpisCommContact(''); setSpisTimeSpent('')
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

      {/* Compact action bar — single row */}
      <div className="border rounded-xl bg-gray-50 dark:bg-gray-900 p-2.5 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Left: R-Score + stats */}
          <button
            onClick={() => setShowRScorePanel(!showRScorePanel)}
            className={cn(
              'text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer transition-colors flex items-center gap-1',
              scorePriority.color
            )}
          >
            <TrendingUp className="h-3 w-3" />
            {totalScore}/12
            <span className="text-[10px] ml-0.5">{showRScorePanel ? '▲' : '▼'}</span>
          </button>

          <Separator orientation="vertical" className="h-4" />

          <div className="flex items-center gap-2.5 text-xs text-gray-500 flex-wrap">
            {task.is_project && (
              <span>Ukoly: {checklistItems.filter(i => i.completed).length}/{checklistItems.length}</span>
            )}
            <span>Odpracovano: {timeData.actual} min</span>
            <span>Dokumenty: {linkedDocs.length}</span>
            {task.is_billable && task.hourly_rate && timeData.actual > 0 && (
              <span className="text-purple-600 font-medium">{Math.round((timeData.actual / 60) * task.hourly_rate).toLocaleString('cs-CZ')} Kc</span>
            )}
          </div>

          {/* Right: Workflow buttons + convert — pushed to right */}
          <div className="flex items-center gap-1.5 ml-auto">
            {task.task_type === 'bonus' && !task.claimed_by && !task.assigned_to && (
              <Button size="sm" className="bg-green-600 hover:bg-green-700 h-7 text-xs" onClick={handleClaimTask}>
                <TrendingUp className="mr-1 h-3 w-3" />+{task.points_value || 0}b
              </Button>
            )}
            {task.status === 'pending' && (
              <Button size="sm" className="bg-green-600 hover:bg-green-700 h-7 text-xs" onClick={handleAcceptTask}><UserCheck className="mr-1 h-3 w-3" />Prijmout</Button>
            )}
            {task.status === 'accepted' && (
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 h-7 text-xs" onClick={handleStartTask}><Play className="mr-1 h-3 w-3" />Zacit</Button>
            )}
            {task.status === 'awaiting_approval' && canApprove && (
              <>
                <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">Ceka</Badge>
                <Button size="sm" className="bg-green-600 hover:bg-green-700 h-7 text-xs" onClick={handleApproveTask}><CheckCircle2 className="mr-1 h-3 w-3" />Schvalit</Button>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowRejectionDialog(true)}><AlertCircle className="mr-1 h-3 w-3" />Vratit</Button>
              </>
            )}
            {!['completed', 'cancelled'].includes(task.status) && (
              <>
                {!task.is_project && (
                  <Button size="sm" variant="outline" className="h-7 text-xs border-purple-300 text-purple-700 hover:bg-purple-50" onClick={() => setShowConvertDialog(true)}>
                    <Target className="mr-1 h-3 w-3" />Prepnout na projekt
                  </Button>
                )}
                {(task.status === 'in_progress' || task.status === 'accepted') && (
                  <>
                    <Separator orientation="vertical" className="h-4" />
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 h-7 text-xs" onClick={handleMarkComplete}><CheckCircle2 className="mr-1 h-3 w-3" />Hotovo</Button>
                  </>
                )}
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowDelegateDialog(true)}><Send className="mr-1 h-3 w-3" />Delegovat</Button>
                <Button size="sm" variant="outline" className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50" onClick={handleCancelTask}>Zrusit</Button>
              </>
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
                  value={(task[key] ?? 0).toString()}
                  onValueChange={v => { updateTask(prev => ({ ...prev, [key]: parseInt(v) })); toast.success('Score aktualizovano') }}
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

        {/* Waiting for */}
        {task.is_waiting_for && (
          <div className="border-t pt-2 mt-1">
            <div className="flex items-center gap-2 text-xs text-yellow-800 bg-yellow-50 rounded-lg p-2">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>Cekam na: <strong>{task.waiting_for_who}</strong> {task.waiting_for_what && `— ${task.waiting_for_what}`}</span>
            </div>
          </div>
        )}
      </div>

      {/* Description — below action bar with label */}
      <div className="border rounded-xl p-3 bg-white dark:bg-gray-900">
        <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Popis ukolu</div>
        {editingDesc ? (
          <div className="space-y-2">
            <Textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={3} autoFocus placeholder="Popis ukolu..." />
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
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-2 overflow-x-auto">
        {[
          { id: 'spis' as TabKey, label: 'Spis' },
          ...(task.is_project ? [{ id: 'ukoly' as TabKey, label: `Ukoly (${checklistItems.filter(i => i.completed).length}/${checklistItems.length})` }] : []),
          { id: 'dokumenty' as TabKey, label: `Dokumenty (${linkedDocs.length})` },
          { id: 'vykaz' as TabKey, label: `Vykaz prace${timeEntries.length ? ` (${timeEntries.length})` : ''}` },
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

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'spis' && (
          <SpisTab
            progressNotes={progressNotes}
            comments={comments}
            timeline={timeline}
            linkedDocs={linkedDocs}
            timeEntries={timeEntries}
            filter={spisFilter}
            onFilterChange={setSpisFilter}
            onAddEntry={() => setSpisDialog(true)}
            newComment={newComment}
            setNewComment={setNewComment}
            onAddComment={handleAddComment}
          />
        )}
        {activeTab === 'ukoly' && (
          <UkolyTab
            task={task} checklistItems={checklistItems}
            onChecklistToggle={handleChecklistToggle}
          />
        )}
        {activeTab === 'dokumenty' && (
          <DokumentyTab
            linkedDocs={linkedDocs} companyId={task.company_id}
            taskId={taskId} userId={userId} userName={userName || ''}
            onAttach={() => setShowDocPicker(true)}
            onDetach={handleDetachDoc}
            onRefresh={fetchLinkedDocs}
            autoOpenUpload={autoOpenUpload}
          />
        )}
        {activeTab === 'vykaz' && (
          <VykazTab
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

      {/* Convert to Project dialog */}
      <Dialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Prepnout na projekt?</DialogTitle>
            <DialogDescription>
              Ukol se stane projektem a budete moct pridavat dilci ukoly. Tato akce je nevratna.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConvertDialog(false)}>Zrusit</Button>
            <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => {
              updateTask(prev => ({ ...prev, is_project: true }))
              setShowConvertDialog(false)
              toast.success('Prepnuto na projekt')
            }}>Ano, prepnout</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      {/* Unified Spis Entry Dialog */}
      <Dialog open={showSpisDialog} onOpenChange={setSpisDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-purple-600" />Pridat zaznam do spisu</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Entry type selector */}
            <div className="space-y-2">
              <Label>Typ zaznamu</Label>
              <Select value={spisEntryType} onValueChange={v => setSpisEntryType(v as UnifiedEntryType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="note">Poznamka</SelectItem>
                  <SelectItem value="communication">Komunikace</SelectItem>
                  <SelectItem value="document">Dokument</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Note fields */}
            {spisEntryType === 'note' && (
              <>
                <div className="space-y-2">
                  <Label>Aktualni stav *</Label>
                  <Textarea value={spisNoteStatus} onChange={e => setSpisNoteStatus(e.target.value)} placeholder="Co se aktualne deje..." rows={3} />
                </div>
                <div className="space-y-2">
                  <Label>Problemy (volitelne)</Label>
                  <Textarea value={spisNoteProblems} onChange={e => setSpisNoteProblems(e.target.value)} placeholder="Zjistene problemy..." rows={2} />
                </div>
                <div className="space-y-2">
                  <Label>Dalsi kroky (volitelne)</Label>
                  <Textarea value={spisNoteNextSteps} onChange={e => setSpisNoteNextSteps(e.target.value)} placeholder="1. ... 2. ..." rows={2} />
                </div>
              </>
            )}

            {/* Communication fields */}
            {spisEntryType === 'communication' && (
              <>
                <div className="space-y-2">
                  <Label>Druh</Label>
                  <Select value={spisCommType} onValueChange={v => setSpisCommType(v as TimelineEventType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(['call', 'email', 'meeting', 'decision'] as TimelineEventType[]).map(t => (
                        <SelectItem key={t} value={t}>{TIMELINE_EVENT_CONFIG[t].label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Popis *</Label>
                  <Textarea value={spisCommDescription} onChange={e => setSpisCommDescription(e.target.value)} placeholder="Popis komunikace..." rows={3} />
                </div>
                <div className="space-y-2">
                  <Label>S kym (volitelne)</Label>
                  <Input value={spisCommContact} onChange={e => setSpisCommContact(e.target.value)} placeholder="Klient, urad, pojistovna..." />
                </div>
              </>
            )}

            {/* Document type - opens upload dialog */}
            {spisEntryType === 'document' && (
              <div className="text-center py-4 text-gray-500">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Po kliknuti na &quot;Pridat&quot; se otevre dialog pro nahrani dokumentu.</p>
              </div>
            )}

            {/* Always visible: time spent */}
            {spisEntryType !== 'document' && (
              <div className="border-t pt-3">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Timer className="h-3.5 w-3.5 text-gray-400" />
                    Straveny cas (minuty)
                  </Label>
                  <Input type="number" min="1" value={spisTimeSpent} onChange={e => setSpisTimeSpent(e.target.value)} placeholder="15" />
                  <p className="text-[11px] text-gray-400">Volitelne — automaticky se zapise do vykazu prace</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSpisDialog(false)}>Zrusit</Button>
            {spisEntryType === 'document' ? (
              <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => { setSpisDialog(false); setActiveTab('dokumenty'); setAutoOpenUpload(Date.now()) }}>
                <FileText className="mr-1 h-4 w-4" />Nahrat dokument
              </Button>
            ) : (
              <Button onClick={handleAddSpisEntry} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="mr-1 h-4 w-4" />Pridat
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============================================
// TAB: SPIS (unified chronological feed)
// ============================================

const SPIS_FILTER_CHIPS: { key: SpisFilterKey; label: string }[] = [
  { key: 'all', label: 'Vse' },
  { key: 'documents', label: 'Dokumenty' },
  { key: 'notes', label: 'Poznamky' },
  { key: 'communication', label: 'Komunikace' },
  { key: 'work', label: 'Prace' },
]

const SPIS_ENTRY_ICON: Record<SpisEntryType, { icon: typeof Phone; color: string; bg: string }> = {
  progress_note: { icon: Lightbulb, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  comment: { icon: MessageSquare, color: 'text-gray-600', bg: 'bg-gray-100' },
  timeline_event: { icon: History, color: 'text-cyan-600', bg: 'bg-cyan-100' },
  document_added: { icon: Paperclip, color: 'text-amber-600', bg: 'bg-amber-100' },
  work_session: { icon: Timer, color: 'text-purple-600', bg: 'bg-purple-100' },
}

function buildSpisEntries(
  progressNotes: ProgressNote[],
  comments: Comment[],
  timeline: TimelineEvent[],
  linkedDocs: LinkedDoc[],
  timeEntries: TimeTrackingEntry[],
): SpisEntry[] {
  const entries: SpisEntry[] = []

  for (const n of progressNotes) {
    entries.push({ id: `pn-${n.id}`, type: 'progress_note', user_name: n.user_name, created_at: n.created_at, data: n })
  }
  for (const c of comments) {
    entries.push({ id: `cm-${c.id}`, type: 'comment', user_name: c.user_name, created_at: c.created_at, data: c })
  }
  for (const t of timeline) {
    entries.push({
      id: `tl-${t.id}`, type: 'timeline_event', user_name: t.user_name, created_at: t.created_at,
      duration_minutes: t.duration_minutes, data: t,
    })
  }
  for (const d of linkedDocs) {
    entries.push({ id: `doc-${d.id}`, type: 'document_added', user_name: '', created_at: '', data: d })
  }
  for (const te of timeEntries) {
    if (te.duration_minutes && te.duration_minutes > 0) {
      entries.push({
        id: `te-${te.id}`, type: 'work_session', user_name: te.user_name, created_at: te.created_at,
        duration_minutes: te.duration_minutes, data: te,
      })
    }
  }

  return entries.filter(e => e.created_at).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

function filterSpisEntries(entries: SpisEntry[], filter: SpisFilterKey): SpisEntry[] {
  if (filter === 'all') return entries
  if (filter === 'documents') return entries.filter(e => e.type === 'document_added')
  if (filter === 'notes') return entries.filter(e => e.type === 'progress_note' || e.type === 'comment')
  if (filter === 'communication') return entries.filter(e => e.type === 'timeline_event')
  if (filter === 'work') return entries.filter(e => e.type === 'work_session')
  return entries
}

function SpisTab({ progressNotes, comments, timeline, linkedDocs, timeEntries, filter, onFilterChange, onAddEntry, newComment, setNewComment, onAddComment }: {
  progressNotes: ProgressNote[]
  comments: Comment[]
  timeline: TimelineEvent[]
  linkedDocs: LinkedDoc[]
  timeEntries: TimeTrackingEntry[]
  filter: SpisFilterKey
  onFilterChange: (f: SpisFilterKey) => void
  onAddEntry: () => void
  newComment: string
  setNewComment: (v: string) => void
  onAddComment: () => void
}) {
  const allEntries = buildSpisEntries(progressNotes, comments, timeline, linkedDocs, timeEntries)
  const entries = filterSpisEntries(allEntries, filter)

  // Group by day
  const grouped = entries.reduce<Record<string, SpisEntry[]>>((acc, entry) => {
    const day = new Date(entry.created_at).toISOString().slice(0, 10)
    if (!acc[day]) acc[day] = []
    acc[day].push(entry)
    return acc
  }, {})
  const groupedDays = Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a))

  const renderEntry = (entry: SpisEntry) => {
    const iconConfig = SPIS_ENTRY_ICON[entry.type]
    const Icon = entry.type === 'timeline_event'
      ? (TIMELINE_EVENT_CONFIG[(entry.data as TimelineEvent).event_type]?.icon || iconConfig.icon)
      : iconConfig.icon
    const iconColor = entry.type === 'timeline_event'
      ? (TIMELINE_EVENT_CONFIG[(entry.data as TimelineEvent).event_type]?.color || iconConfig.color)
      : iconConfig.color
    const iconBg = entry.type === 'timeline_event'
      ? (TIMELINE_EVENT_CONFIG[(entry.data as TimelineEvent).event_type]?.bgColor || iconConfig.bg)
      : iconConfig.bg

    return (
      <div key={entry.id} className="flex gap-3 py-2">
        <div className={cn('w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5', iconBg)}>
          <Icon className={cn('h-3.5 w-3.5', iconColor)} />
        </div>
        <div className="flex-1 min-w-0">
          {/* Progress note */}
          {entry.type === 'progress_note' && (() => {
            const note = entry.data as ProgressNote
            return (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-emerald-700">Stav</span>
                  {entry.duration_minutes && <Badge variant="outline" className="text-[10px]"><Timer className="h-3 w-3 mr-0.5" />{entry.duration_minutes} min</Badge>}
                </div>
                <p className="text-sm text-gray-800 dark:text-gray-200">{note.current_status}</p>
                {note.problems && <p className="text-sm text-orange-700"><span className="font-medium">Problemy:</span> {note.problems}</p>}
                {note.next_steps && <p className="text-sm text-blue-700"><span className="font-medium">Dalsi kroky:</span> {note.next_steps}</p>}
              </div>
            )
          })()}

          {/* Comment */}
          {entry.type === 'comment' && (
            <p className="text-sm text-gray-700 dark:text-gray-200">{(entry.data as Comment).text}</p>
          )}

          {/* Timeline event */}
          {entry.type === 'timeline_event' && (() => {
            const ev = entry.data as TimelineEvent
            const config = TIMELINE_EVENT_CONFIG[ev.event_type]
            return (
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn('text-[10px]', config?.bgColor, config?.color)}>{config?.label}</Badge>
                  {ev.duration_minutes && <Badge variant="outline" className="text-[10px]"><Timer className="h-3 w-3 mr-0.5" />{ev.duration_minutes} min</Badge>}
                </div>
                <p className="text-sm font-medium">{ev.description}</p>
                {ev.contact_name && <p className="text-xs text-gray-500 flex items-center gap-1"><Building2 className="h-3 w-3" />{ev.contact_name}</p>}
              </div>
            )
          })()}

          {/* Document added */}
          {entry.type === 'document_added' && (() => {
            const doc = entry.data as LinkedDoc
            return (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">{doc.document?.file_name}</span>
                <Badge variant="outline" className="text-[10px] shrink-0">{doc.document?.type}</Badge>
              </div>
            )
          })()}

          {/* Work session */}
          {entry.type === 'work_session' && (() => {
            const te = entry.data as TimeTrackingEntry
            return (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700"><Timer className="h-3 w-3 mr-0.5" />{te.duration_minutes} min</Badge>
                {te.note && <span className="text-sm text-gray-600 dark:text-gray-300 italic truncate">{te.note}</span>}
                {te.billable && <Badge className="bg-green-600 text-white text-[10px] px-1.5 py-0">Faktur.</Badge>}
              </div>
            )
          })()}

          {/* Footer: user + time */}
          <p className="text-xs text-gray-400 mt-0.5" suppressHydrationWarning>
            {entry.user_name && <>{entry.user_name} &bull; </>}
            {new Date(entry.created_at).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter chips + add button */}
      <div className="flex items-center gap-2 flex-wrap">
        {SPIS_FILTER_CHIPS.map(chip => (
          <button
            key={chip.key}
            onClick={() => onFilterChange(chip.key)}
            className={cn(
              'text-xs px-3 py-1.5 rounded-full border transition-colors',
              filter === chip.key
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-blue-300'
            )}
          >
            {chip.label}
          </button>
        ))}
        <Button size="sm" className="ml-auto bg-purple-600 hover:bg-purple-700 h-7 text-xs" onClick={onAddEntry}>
          <Plus className="h-3.5 w-3.5 mr-1" />Pridat zaznam
        </Button>
      </div>

      {/* Chronological feed */}
      {groupedDays.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <History className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Zatim zadne zaznamy v tomto filtru</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={onAddEntry}>
            <Plus className="h-3.5 w-3.5 mr-1" />Pridat prvni zaznam
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedDays.map(([day, dayEntries]) => (
            <div key={day}>
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-2">
                <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                <span suppressHydrationWarning>{new Date(day).toLocaleDateString('cs-CZ', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {dayEntries.map(renderEntry)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick comment at bottom */}
      <div className="border-t pt-3 mt-4">
        <div className="flex gap-2">
          <Input
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="Rychly komentar..."
            onKeyDown={e => { if (e.key === 'Enter' && newComment.trim()) onAddComment() }}
            className="flex-1"
          />
          <Button onClick={onAddComment} disabled={!newComment.trim()} size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// TAB: UKOLY (only for projects)
// ============================================

function UkolyTab({ task, checklistItems, onChecklistToggle }: {
  task: Task
  checklistItems: ChecklistItem[]
  onChecklistToggle: (id: string) => void
}) {
  const openChecklist = checklistItems.filter(i => !i.completed)
  const doneChecklist = checklistItems.filter(i => i.completed)

  return (
    <div className="space-y-4">
      {task.is_project && checklistItems.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="rounded-xl shadow-soft border-red-200">
            <CardContent className="p-5">
              <h3 className="font-bold text-red-700 mb-3">Nedokoncene ukoly ({openChecklist.length})</h3>
              <div className="space-y-2">
                {openChecklist.map(item => (
                  <div key={item.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg cursor-pointer" onClick={() => onChecklistToggle(item.id)}>
                    <Checkbox checked={item.completed} className="mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{item.text}</div>
                      <div className="flex gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {item.due_date && <span>{new Date(item.due_date).toLocaleDateString('cs-CZ')}</span>}
                        {item.assigned_to_name && <span>{item.assigned_to_name}</span>}
                        {item.estimated_minutes && <span>{item.estimated_minutes} min</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl shadow-soft border-green-200">
            <CardContent className="p-5">
              <h3 className="font-bold text-green-700 mb-3">Dokoncene ukoly ({doneChecklist.length})</h3>
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
      {(!task.is_project || checklistItems.length === 0) && (
        <div className="text-center py-8 text-gray-400">
          <ListTodo className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">{task.is_project ? 'Zatim zadne dilci ukoly' : 'Toto je ukol, nikoliv projekt.'}</p>
        </div>
      )}
    </div>
  )
}

// ============================================
// TAB 4: DOKUMENTY
// ============================================

function DokumentyTab({ linkedDocs, companyId, taskId, userId, userName, onAttach, onDetach, onRefresh, autoOpenUpload }: {
  linkedDocs: LinkedDoc[]
  companyId: string
  taskId: string
  userId: string
  userName: string
  onAttach: () => void
  onDetach: (docId: string) => void
  onRefresh: () => void
  autoOpenUpload?: number
}) {
  const [showUpload, setShowUpload] = useState(false)

  useEffect(() => {
    if (autoOpenUpload) setShowUpload(true)
  }, [autoOpenUpload])

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
// TAB: VYKAZ PRACE (redesigned)
// ============================================

const VYKAZ_QUICK_TIMES = [
  { label: '0:15', minutes: 15 },
  { label: '0:30', minutes: 30 },
  { label: '1:00', minutes: 60 },
  { label: '1:30', minutes: 90 },
  { label: '2:00', minutes: 120 },
  { label: '3:00', minutes: 180 },
]

const VYKAZ_DATE_OPTIONS = [
  { label: 'Dnes', value: () => new Date().toISOString().split('T')[0] },
  { label: 'Včera', value: () => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().split('T')[0] } },
  { label: 'Předevčírem', value: () => { const d = new Date(); d.setDate(d.getDate() - 2); return d.toISOString().split('T')[0] } },
]

function VykazTab({ task, timeEntries: initialEntries, timeData, onTimeUpdate, userId, userName }: {
  task: Task
  timeEntries: TimeTrackingEntry[]
  timeData: { estimated: number; actual: number }
  onTimeUpdate: (actualMinutes: number, entries: TimeTrackingEntry[]) => void
  userId: string
  userName: string
}) {
  const { userRole } = useAccountantUser()
  const isAdmin = userRole === 'admin'
  const rate = task.hourly_rate || 0

  // Local entries state (synced from props)
  const [entries, setEntries] = useState<TimeTrackingEntry[]>(initialEntries)
  useEffect(() => { setEntries(initialEntries) }, [initialEntries])

  // Form state
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0])
  const [selectedMinutes, setSelectedMinutes] = useState(0)
  const [customMinutes, setCustomMinutes] = useState('')
  const [description, setDescription] = useState('')
  const [inTariff, setInTariff] = useState(false)
  const [prepaidProjectId, setPrepaidProjectId] = useState<string | null>(null)
  const [prepaidProjects, setPrepaidProjects] = useState<Array<{
    id: string; title: string; status: string
    total_budget?: number; consumed_amount?: number
  }>>([])
  const [saving, setSaving] = useState(false)

  // Timer (collapsible)
  const [showTimer, setShowTimer] = useState(false)
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerStart, setTimerStart] = useState<number | null>(null)
  const [timerElapsed, setTimerElapsed] = useState(0)

  // Fetch prepaid projects for this company
  useEffect(() => {
    if (!task.company_id) return
    fetch(`/api/prepaid-projects?company_id=${task.company_id}&status=active,sent`, {
      headers: { 'x-user-id': userId },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.projects) setPrepaidProjects(data.projects) })
      .catch(() => {})
  }, [task.company_id, userId])

  // Auto-set inTariff=false when prepaid project selected
  useEffect(() => {
    if (prepaidProjectId) setInTariff(false)
  }, [prepaidProjectId])

  // Timer interval
  useEffect(() => {
    if (!timerRunning || !timerStart) return
    const interval = setInterval(() => {
      setTimerElapsed(Math.floor((Date.now() - timerStart) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [timerRunning, timerStart])

  // Calculations
  const totalMinutes = entries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0)
  const billableMinutes = entries.filter(e => e.billable).reduce((sum, e) => sum + (e.duration_minutes || 0), 0)
  const totalCost = Math.round((billableMinutes / 60) * rate)

  const formatDur = (mins: number) => {
    if (mins === 0) return '0 min'
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return h > 0 ? (m > 0 ? `${h}h ${m}min` : `${h}h`) : `${m} min`
  }

  const formatTimerTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const selectedProject = prepaidProjects.find(p => p.id === prepaidProjectId)

  const refreshEntries = async () => {
    try {
      const res = await fetch(`/api/tasks/${task.id}`, { headers: { 'x-user-id': userId } })
      if (res.ok) {
        const data = await res.json()
        if (data.task?.time_entries) {
          const mapped: TimeTrackingEntry[] = data.task.time_entries.map((te: any) => ({
            id: te.id, task_id: te.task_id || task.id, user_id: te.user_id,
            user_name: te.user_name || '', started_at: te.started_at || te.date,
            stopped_at: te.stopped_at || te.date, duration_minutes: te.duration_minutes || te.minutes,
            note: te.note || te.description || '', billable: te.billable !== false,
            created_at: te.created_at,
          }))
          setEntries(mapped)
          const total = mapped.reduce((s: number, e) => s + (e.duration_minutes || 0), 0)
          onTimeUpdate(total, mapped)
        }
      }
    } catch { /* ignore */ }
  }

  const handleSave = async () => {
    const mins = selectedMinutes || parseInt(customMinutes) || 0
    if (mins <= 0) { toast.error('Zadejte čas'); return }
    if (!description.trim()) { toast.error('Zadejte popis práce'); return }

    setSaving(true)
    try {
      const res = await fetch('/api/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId, 'x-user-name': userName || 'Ucetni' },
        body: JSON.stringify({
          task_id: task.id,
          company_id: task.company_id,
          company_name: task.company_name,
          date: selectedDate,
          minutes: mins,
          description: description.trim(),
          billable: !inTariff,
          in_tariff: inTariff,
          prepaid_project_id: prepaidProjectId,
        }),
      })
      if (res.ok) {
        toast.success(`Zalogováno ${formatDur(mins)}`)
        setDescription('')
        setSelectedMinutes(0)
        setCustomMinutes('')
        await refreshEntries()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Chyba při ukládání')
      }
    } catch {
      toast.error('Chyba při ukládání')
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Smazat záznam?')) return
    try {
      const res = await fetch(`/api/time-entries?id=${id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': userId },
      })
      if (res.ok) {
        toast.success('Záznam smazán')
        await refreshEntries()
      }
    } catch {
      toast.error('Chyba při mazání')
    }
  }

  const handleTimerStart = () => {
    setTimerRunning(true)
    setTimerStart(Date.now())
    setTimerElapsed(0)
  }

  const handleTimerStop = () => {
    setTimerRunning(false)
    const mins = Math.max(1, Math.round(timerElapsed / 60))
    setSelectedMinutes(mins)
    setCustomMinutes('')
    setTimerElapsed(0)
    setTimerStart(null)
    toast.info(`Stopky: ${formatDur(mins)} — zadejte popis a uložte`)
  }

  return (
    <div className="space-y-4">
      {/* Section A: Přehled fakturace */}
      <Card className="rounded-xl">
        <CardContent className="p-4">
          <h3 className="text-xs font-semibold uppercase text-gray-400 dark:text-gray-500 mb-3">Přehled</h3>
          <div className={`grid ${isAdmin ? 'grid-cols-3' : 'grid-cols-1'} gap-4 mb-2`}>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Odpracováno</div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">{formatDur(totalMinutes)}</div>
            </div>
            {isAdmin && (
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">K fakturaci</div>
                <div className="text-lg font-bold text-purple-700 dark:text-purple-400">{formatDur(billableMinutes)}</div>
              </div>
            )}
            {isAdmin && rate > 0 && (
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Sazba</div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">{rate.toLocaleString('cs-CZ')} Kč/h</div>
              </div>
            )}
          </div>
          {isAdmin && rate > 0 && totalCost > 0 && (
            <div className="pt-2 border-t text-sm">
              <span className="text-gray-500 dark:text-gray-400">Částka k fakturaci: </span>
              <span className="font-bold text-lg text-purple-700 dark:text-purple-400">{totalCost.toLocaleString('cs-CZ')} Kč</span>
            </div>
          )}
          {/* Prepaid project progress */}
          {isAdmin && selectedProject && selectedProject.total_budget && selectedProject.total_budget > 0 && (
            <div className="mt-3 pt-3 border-t">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-500 dark:text-gray-400">
                  Projekt: <span className="font-medium text-gray-900 dark:text-white">{selectedProject.title}</span>
                </span>
                <span className="text-xs text-gray-400">
                  {Math.round(((selectedProject.consumed_amount || 0) / selectedProject.total_budget) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(100, ((selectedProject.consumed_amount || 0) / selectedProject.total_budget) * 100)}%` }}
                />
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Čerpáno: {(selectedProject.consumed_amount || 0).toLocaleString('cs-CZ')} / {selectedProject.total_budget.toLocaleString('cs-CZ')} Kč
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section B: Přidat záznam (always visible form) */}
      <Card className="rounded-xl border-purple-200 dark:border-purple-800">
        <CardContent className="p-4 space-y-3">
          <h3 className="text-xs font-semibold uppercase text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Přidat záznam
          </h3>

          {/* Date selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400 w-16 shrink-0">Datum:</span>
            <div className="flex gap-1 flex-wrap">
              {VYKAZ_DATE_OPTIONS.map(opt => (
                <button
                  key={opt.label}
                  onClick={() => setSelectedDate(opt.value())}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    selectedDate === opt.value()
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-purple-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-2 py-1 border border-gray-200 dark:border-gray-700 rounded text-xs bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              />
            </div>
          </div>

          {/* Time quick-pick */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400 w-16 shrink-0">Čas:</span>
            <div className="flex gap-1 flex-wrap">
              {VYKAZ_QUICK_TIMES.map(t => (
                <button
                  key={t.minutes}
                  onClick={() => { setSelectedMinutes(t.minutes); setCustomMinutes('') }}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    selectedMinutes === t.minutes
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-purple-300'
                  }`}
                >
                  {t.label}
                </button>
              ))}
              <Input
                type="number"
                placeholder="min"
                value={customMinutes}
                onChange={(e) => { setCustomMinutes(e.target.value); setSelectedMinutes(0) }}
                className="w-16 h-7 text-xs"
                min={1}
                max={480}
              />
            </div>
          </div>

          {/* Description */}
          <div className="flex items-start gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400 w-16 shrink-0 pt-1.5">Popis:</span>
            <Input
              placeholder="Co jste dělali..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="flex-1"
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
          </div>

          {/* Prepaid project selector */}
          {prepaidProjects.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400 w-16 shrink-0">Projekt:</span>
              <select
                value={prepaidProjectId || ''}
                onChange={e => setPrepaidProjectId(e.target.value || null)}
                className="flex-1 px-3 py-1.5 text-xs border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">-- Bez projektu --</option>
                {prepaidProjects.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>
          )}

          {/* Tariff toggle + Save */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-3">
              {prepaidProjectId ? (
                <span className="text-xs text-purple-600 dark:text-purple-400 italic">
                  Předplacený projekt — automaticky k fakturaci
                </span>
              ) : (
                <>
                  <button
                    onClick={() => setInTariff(false)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      !inTariff
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700'
                        : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    K fakturaci
                  </button>
                  <button
                    onClick={() => setInTariff(true)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      inTariff
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-400 dark:border-gray-600'
                        : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    V tarifu
                  </button>
                </>
              )}
            </div>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-purple-600 hover:bg-purple-700"
              size="sm"
            >
              {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Clock className="h-4 w-4 mr-1" />}
              Uložit
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Section C: Záznamy práce (table) */}
      <Card className="rounded-xl">
        <CardContent className="p-0">
          {entries.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Timer className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Zatím žádné záznamy o práci</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 dark:bg-gray-800/50 text-xs text-gray-500 uppercase">
                    <th className="text-left p-3 font-medium">Kdy</th>
                    <th className="text-left p-3 font-medium">Kdo</th>
                    <th className="text-right p-3 font-medium">Čas</th>
                    <th className="text-left p-3 font-medium">Co dělal</th>
                    {isAdmin && rate > 0 && <th className="text-right p-3 font-medium">Kč</th>}
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {entries.map(entry => {
                    const mins = entry.duration_minutes || 0
                    const cost = entry.billable ? Math.round((mins / 60) * rate) : 0
                    return (
                      <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 group">
                        <td className="p-3 text-gray-500" suppressHydrationWarning>
                          {new Date(entry.stopped_at || entry.started_at || entry.created_at).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' })}
                        </td>
                        <td className="p-3 text-gray-600 dark:text-gray-300 text-xs">{entry.user_name || '—'}</td>
                        <td className="p-3 text-right font-semibold text-purple-700 dark:text-purple-400">{formatDur(mins)}</td>
                        <td className="p-3 text-gray-600 dark:text-gray-300 max-w-[200px] truncate">{entry.note || '—'}</td>
                        {isAdmin && rate > 0 && (
                          <td className="p-3 text-right">
                            {entry.billable ? (
                              <span className="font-semibold">{cost.toLocaleString('cs-CZ')}</span>
                            ) : (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-gray-400 dark:text-gray-500">tarif</Badge>
                            )}
                          </td>
                        )}
                        <td className="p-1">
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 bg-gray-50 dark:bg-gray-800/50 font-semibold">
                    <td className="p-3">CELKEM</td>
                    <td className="p-3"></td>
                    <td className="p-3 text-right text-purple-700 dark:text-purple-400">{formatDur(totalMinutes)}</td>
                    <td className="p-3 text-gray-500 text-xs">{entries.length} záznamů</td>
                    {isAdmin && rate > 0 && <td className="p-3 text-right text-lg">{totalCost.toLocaleString('cs-CZ')} Kč</td>}
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section D: Stopky (collapsible, defaultně zavřené) */}
      <div className="border rounded-xl dark:border-gray-700">
        <button
          onClick={() => setShowTimer(!showTimer)}
          className="w-full px-4 py-2.5 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          {showTimer ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <Timer className="h-4 w-4" />
          Stopky (volitelné)
          {timerRunning && (
            <span className="ml-auto text-purple-600 dark:text-purple-400 font-mono font-semibold animate-pulse">
              {formatTimerTime(timerElapsed)}
            </span>
          )}
        </button>
        {showTimer && (
          <div className="px-4 pb-3 flex items-center gap-3">
            {!timerRunning ? (
              <Button size="sm" variant="outline" onClick={handleTimerStart} className="gap-1.5">
                <Play className="h-3.5 w-3.5" /> Spustit
              </Button>
            ) : (
              <>
                <span className="font-mono text-2xl text-purple-700 dark:text-purple-400 font-bold">
                  {formatTimerTime(timerElapsed)}
                </span>
                <Button size="sm" variant="destructive" onClick={handleTimerStop} className="gap-1.5">
                  <Square className="h-3.5 w-3.5" /> Zastavit
                </Button>
              </>
            )}
            <span className="text-xs text-gray-400 dark:text-gray-500">
              Po zastavení se čas vyplní do formuláře výše
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
