'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { fireTaskConfetti } from '@/components/gtd/confetti'
import { DailyProgressRing } from '@/components/gtd/progress-ring'
import { GamificationStats } from '@/components/gtd/gamification-stats'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  CheckCircle2,
  Circle,
  Clock,
  Building2,
  Calendar,
  Zap,
  Plus,
  Search,
  Flame,
  TrendingUp,
  PlayCircle,
  LayoutGrid,
  List,
  Columns3,
  GripVertical,
  Archive,
  Banknote,
  Play,
  Timer,
  ChevronDown,
  ChevronUp,
  Coffee,
  FolderKanban,
  Loader2,
  Inbox,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useAccountantUser } from '@/lib/contexts/accountant-user-context'

import { CompanyCombobox } from '@/components/ui/company-combobox'
import type { TaskStatus } from '@/lib/types/tasks'

// Task type for this page (subset of full Task type)
interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  created_by: string
  created_by_name: string
  assigned_to?: string
  assigned_to_name?: string
  company_id: string
  company_name: string
  project_id?: string
  project_name?: string
  phase_id?: string
  phase_name?: string
  is_project: boolean
  is_next_action?: boolean
  is_waiting_for: boolean
  is_blocked?: boolean
  due_date: string
  due_time?: string
  completed_at?: string
  estimated_minutes?: number
  actual_minutes?: number
  is_billable: boolean
  gtd_is_quick_action?: boolean
  gtd_context?: string[]
  gtd_energy_level?: 'low' | 'medium' | 'high'
  progress_percentage?: number
  parent_project_id?: string
  // R-Tasks scoring
  score_money?: 0 | 1 | 2 | 3
  score_fire?: 0 | 1 | 2 | 3
  score_time?: 0 | 1 | 2 | 3
  score_distance?: 0 | 1 | 2
  score_personal?: 0 | 1
  created_at: string
  updated_at: string
}
type CategoryId = 'active' | 'waiting' | 'someday' | 'archive'
type SortBy = 'deadline' | 'priority' | 'client' | 'score'
type ViewMode = 'cards' | 'list' | 'kanban'
type KanbanColumnId = 'inbox' | 'accepted' | 'in_progress' | 'waiting_client' | 'waiting_for' | 'to_invoice'
type ScorePriority = 'high' | 'medium' | 'low'

interface CategoryConfig {
  id: CategoryId
  label: string
  icon: typeof PlayCircle
  color: string
  bgColor: string
}

const CATEGORIES: CategoryConfig[] = [
  { id: 'active', label: 'Aktivní', icon: PlayCircle, color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200' },
  { id: 'waiting', label: 'Čeká', icon: Clock, color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200' },
  { id: 'someday', label: 'Někdy/Možná', icon: Coffee, color: 'text-purple-600', bgColor: 'bg-purple-50 border-purple-200' },
  { id: 'archive', label: 'Archiv', icon: Archive, color: 'text-gray-600 dark:text-gray-400', bgColor: 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700' },
]

const CATEGORY_STORAGE_KEY = 'ucetni-task-categories'
const QUICK_ACTION_STORAGE_KEY = 'ucetni-quick-action-threshold'

const QUICK_ACTION_OPTIONS = [
  { value: 2, label: '2 min' },
  { value: 5, label: '5 min' },
  { value: 10, label: '10 min' },
  { value: 15, label: '15 min' },
  { value: 20, label: '20 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 hod' },
  { value: 120, label: '2 hod' },
  { value: 180, label: '3 hod' },
]

const kanbanColumns: { id: KanbanColumnId; title: string; emoji: string; statuses: string[] }[] = [
  { id: 'inbox', title: 'Inbox', emoji: '📥', statuses: ['pending', 'clarifying'] },
  { id: 'accepted', title: 'K práci', emoji: '📋', statuses: ['accepted'] },
  { id: 'in_progress', title: 'Probíhá', emoji: '⚡', statuses: ['in_progress'] },
  { id: 'waiting_client', title: 'Čeká na klienta', emoji: '⏳', statuses: ['waiting_client'] },
  { id: 'waiting_for', title: 'Čeká interně', emoji: '👥', statuses: ['waiting_for'] },
  { id: 'to_invoice', title: 'K fakturaci', emoji: '💰', statuses: ['completed'] },
]

// R-Tasks score calculation
const calculateTaskScore = (task: Task): number => {
  const effectiveFire = task.score_fire || 1
  return (task.score_money || 0) + effectiveFire + (task.score_time || 0) + (task.score_distance || 0) + (task.score_personal || 0)
}

const getScorePriority = (task: Task): ScorePriority => {
  const score = calculateTaskScore(task)
  if (score >= 9) return 'high'
  if (score >= 6) return 'medium'
  return 'low'
}

const priorityConfig: Record<ScorePriority, { bg: string; text: string; label: string }> = {
  high: { bg: 'bg-red-100', text: 'text-red-700 dark:text-red-400', label: 'Vysoká' },
  medium: { bg: 'bg-yellow-100', text: 'text-yellow-700 dark:text-yellow-400', label: 'Střední' },
  low: { bg: 'bg-green-100', text: 'text-green-700 dark:text-green-400', label: 'Nízká' },
}

// Draggable Kanban Card
function DraggableKanbanCard({ task, isOverdue, isUrgent, getDaysUntilDue, onComplete, onStartTimer }: {
  task: Task
  isOverdue: (date: string) => boolean
  isUrgent: (date: string) => boolean
  getDaysUntilDue: (date: string) => number
  onComplete: (taskId: string, e: React.MouseEvent) => void
  onStartTimer: (taskId: string, e: React.MouseEvent) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }
  const priorityStyle = priorityConfig[getScorePriority(task)]
  const overdue = isOverdue(task.due_date)
  const urgent = isUrgent(task.due_date)

  const getCardClassName = () => {
    if (overdue) return 'border-l-4 border-l-red-500 bg-red-50 dark:bg-red-900/20'
    if (urgent) return 'border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-900/20'
    return ''
  }

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={`card-hover transition-all duration-200 cursor-grab active:cursor-grabbing rounded-xl ${getCardClassName()} ${isDragging ? 'shadow-xl ring-2 ring-purple-400' : ''}`}>
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <div {...attributes} {...listeners} className="mt-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
              <GripVertical className="h-4 w-4" />
            </div>
            <div className="flex-1 space-y-2">
              <Link href={`/accountant/tasks/${task.id}`}>
                <h4 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2 hover:text-blue-600">{task.title}</h4>
              </Link>
              <p className="text-xs text-gray-600 dark:text-gray-400">{task.company_name}</p>
              <div className="flex items-center gap-1 text-xs">
                <Calendar className="h-3 w-3" />
                <span className={overdue ? 'text-red-600 font-semibold' : urgent ? 'text-orange-600 font-semibold' : 'text-gray-600 dark:text-gray-400'}>
                  {getDaysUntilDue(task.due_date) === 0 ? 'Dnes' : getDaysUntilDue(task.due_date) === 1 ? 'Zítra' : getDaysUntilDue(task.due_date) < 0 ? `Po termínu` : `${getDaysUntilDue(task.due_date)}d`}
                </span>
              </div>
              <div className="flex items-center gap-1 pt-1">
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-blue-600 hover:bg-blue-50" onClick={(e) => onStartTimer(task.id, e)} title="Spustit časovač">
                  <Play className="h-3.5 w-3.5" />
                </Button>
                {task.status !== 'completed' && (
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20" onClick={(e) => onComplete(task.id, e)} title="Dokončit">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function TasksPage() {
  const { userId } = useAccountantUser()
  const [tasks, setTasks] = useState<Task[]>([])
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<Set<CategoryId>>(new Set(['active']))
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterClient, setFilterClient] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<ScorePriority | 'all'>('all')
  const [filterProjectScope, setFilterProjectScope] = useState<'all' | 'project' | 'free'>('all')
  const [sortBy, setSortBy] = useState<SortBy>('score')
  const [showFilters, setShowFilters] = useState(false)
  const [activeTimerId, setActiveTimerId] = useState<string | null>(null)
  const [quickActionThreshold, setQuickActionThreshold] = useState<number>(2)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null)
  const [showNewTask, setShowNewTask] = useState(false)
  const [newTaskLoading, setNewTaskLoading] = useState(false)
  const [newTaskForm, setNewTaskForm] = useState({ title: '', description: '', company_id: '', due_date: new Date().toISOString().split('T')[0], estimated_minutes: 30, priority: 'medium' as 'high' | 'medium' | 'low' })

  const PRIORITY_SCORES: Record<'high' | 'medium' | 'low', { score_fire: number; score_money: number; score_time: number; score_distance: number; score_personal: number }> = {
    high: { score_fire: 3, score_money: 2, score_time: 2, score_distance: 2, score_personal: 1 },
    medium: { score_fire: 2, score_money: 1, score_time: 2, score_distance: 1, score_personal: 1 },
    low: { score_fire: 1, score_money: 0, score_time: 1, score_distance: 1, score_personal: 0 },
  }

  const handleCreateTask = async () => {
    if (!newTaskForm.title.trim()) { toast.error('Název úkolu je povinný'); return }
    setNewTaskLoading(true)
    try {
      const scores = PRIORITY_SCORES[newTaskForm.priority]
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTaskForm.title.trim(),
          description: newTaskForm.description.trim() || undefined,
          company_id: newTaskForm.company_id && newTaskForm.company_id !== 'all' ? newTaskForm.company_id : undefined,
          company_name: newTaskForm.company_id && newTaskForm.company_id !== 'all' ? (companies.find(c => c.id === newTaskForm.company_id)?.name || '') : '',
          due_date: newTaskForm.due_date,
          estimated_minutes: newTaskForm.estimated_minutes,
          status: 'accepted',
          is_project: false,
          is_billable: false,
          ...scores,
        }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Chyba') }
      const { task } = await res.json()
      setTasks(prev => [task, ...prev])
      setShowNewTask(false)
      setNewTaskForm({ title: '', description: '', company_id: '', due_date: new Date().toISOString().split('T')[0], estimated_minutes: 30, priority: 'medium' })
      toast.success('Úkol vytvořen')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Nepodařilo se vytvořit úkol')
    } finally {
      setNewTaskLoading(false)
    }
  }

  // Load saved preferences
  useEffect(() => {
    const savedThreshold = localStorage.getItem(QUICK_ACTION_STORAGE_KEY)
    if (savedThreshold) {
      const value = parseInt(savedThreshold, 10)
      if (!isNaN(value) && QUICK_ACTION_OPTIONS.some(opt => opt.value === value)) {
        setQuickActionThreshold(value)
      }
    }
    const savedCategories = localStorage.getItem(CATEGORY_STORAGE_KEY)
    if (savedCategories) {
      try {
        const parsed = JSON.parse(savedCategories)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSelectedCategories(new Set(parsed as CategoryId[]))
        }
      } catch { /* ignore */ }
    }
  }, [])

  // Fetch tasks and companies
  useEffect(() => {
    async function loadData() {
      if (!userId) return
      setLoading(true)
      setError(null)
      try {
        // Fetch tasks
        const statuses = ['pending', 'clarifying', 'accepted', 'in_progress', 'waiting_client', 'waiting_for', 'awaiting_approval', 'completed']
        const tasksRes = await fetch(`/api/tasks?status=${statuses.join(',')}&page_size=200`, {
          headers: { 'x-user-id': userId }
        })
        if (!tasksRes.ok) throw new Error('Failed to load tasks')
        const tasksData = await tasksRes.json()
        setTasks(tasksData.tasks || [])
        // Fetch companies
        const companiesRes = await fetch('/api/accountant/companies', {
          headers: { 'x-user-id': userId }
        })
        if (!companiesRes.ok) throw new Error('Failed to load companies')
        const companiesData = await companiesRes.json()
        setCompanies(companiesData.companies?.map((c: any) => ({ id: c.id, name: c.name })) || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        toast.error('Nepodařilo se načíst data')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [userId])

  const handleQuickActionThresholdChange = (value: string) => {
    const numValue = parseInt(value, 10)
    setQuickActionThreshold(numValue)
    localStorage.setItem(QUICK_ACTION_STORAGE_KEY, value)
  }

  const toggleCategory = (categoryId: CategoryId) => {
    setSelectedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        if (newSet.size > 1) newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(Array.from(newSet)))
      return newSet
    })
  }

  const selectAllWithoutArchive = () => {
    const newSet = new Set<CategoryId>(['active', 'waiting', 'someday'])
    setSelectedCategories(newSet)
    localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(Array.from(newSet)))
  }

  const selectAll = () => {
    const newSet = new Set<CategoryId>(['active', 'waiting', 'someday', 'archive'])
    setSelectedCategories(newSet)
    localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(Array.from(newSet)))
  }

  const selectOnlyActive = () => {
    const newSet = new Set<CategoryId>(['active'])
    setSelectedCategories(newSet)
    localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(Array.from(newSet)))
  }

  const isQuickAction = (task: Task): boolean => {
    if (task.estimated_minutes && task.estimated_minutes <= quickActionThreshold) return true
    return task.gtd_is_quick_action || false
  }

  // Helper functions
  const isOverdue = (dueDate: string) => {
    const due = new Date(dueDate)
    due.setHours(23, 59, 59, 999)
    return due < new Date()
  }

  const isToday = (dueDate: string) => {
    const due = new Date(dueDate)
    const today = new Date()
    return due.toDateString() === today.toDateString()
  }

  const isUrgent = (dueDate: string) => {
    const due = new Date(dueDate)
    const now = new Date()
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays <= 2 && diffDays >= 0
  }

  const getDaysUntilDue = (dueDate: string): number => {
    const due = new Date(dueDate)
    const now = new Date()
    return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  }

  const getDeadlineText = (dueDate: string, dueTime?: string): string => {
    const days = getDaysUntilDue(dueDate)
    const time = dueTime ? ` v ${dueTime.substring(0, 5)}` : ''
    if (days < 0) return `Po termínu (${Math.abs(days)} dní)`
    if (days === 0) return `Dnes${time}`
    if (days === 1) return `Zítra${time}`
    if (days <= 7) return `Za ${days} dní`
    return new Date(dueDate).toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit' })
  }

  const archivedStatuses = ['completed', 'invoiced', 'cancelled']
  const waitingStatuses = ['waiting_for', 'waiting_client']

  const filterByCategories = (tasks: Task[]): Task[] => {
    return tasks.filter(t => {
      const isArchived = archivedStatuses.includes(t.status)
      const isWaiting = waitingStatuses.includes(t.status)
      const isSomeday = t.status === 'someday_maybe'
      const isActive = !isArchived && !isWaiting && !isSomeday
      if (selectedCategories.has('archive') && isArchived) return true
      if (selectedCategories.has('waiting') && isWaiting) return true
      if (selectedCategories.has('someday') && isSomeday) return true
      if (selectedCategories.has('active') && isActive) return true
      return false
    })
  }

  // Apply filters and sorting
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = filterByCategories(tasks)
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(t => t.title.toLowerCase().includes(query) || t.company_name.toLowerCase().includes(query))
    }
    if (filterClient !== 'all') {
      filtered = filtered.filter(t => t.company_id === filterClient)
    }
    if (filterPriority !== 'all') {
      filtered = filtered.filter(t => getScorePriority(t) === filterPriority)
    }
    if (filterProjectScope !== 'all') {
      filtered = filtered.filter(t => filterProjectScope === 'project' ? !!t.project_id : !t.project_id)
    }
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'deadline':
          const dateA = new Date(a.due_date)
          const dateB = new Date(b.due_date)
          const isOverdueA = isOverdue(a.due_date)
          const isOverdueB = isOverdue(b.due_date)
          if (isOverdueA && !isOverdueB) return -1
          if (!isOverdueA && isOverdueB) return 1
          return dateA.getTime() - dateB.getTime()
        case 'priority':
          const priorityOrder: Record<ScorePriority, number> = { high: 0, medium: 1, low: 2 }
          return priorityOrder[getScorePriority(a)] - priorityOrder[getScorePriority(b)]
        case 'client':
          return a.company_name.localeCompare(b.company_name, 'cs')
        case 'score':
          return calculateTaskScore(b) - calculateTaskScore(a)
        default:
          return 0
      }
    })
    return filtered
  }, [tasks, selectedCategories, searchQuery, filterClient, filterPriority, filterProjectScope, sortBy])

  // Stats
  const urgencyStats = useMemo(() => {
    const activeTasks = tasks.filter(t => !archivedStatuses.includes(t.status) && !waitingStatuses.includes(t.status) && t.status !== 'someday_maybe')
    return {
      overdue: activeTasks.filter(t => isOverdue(t.due_date)),
      today: activeTasks.filter(t => isToday(t.due_date) && !isOverdue(t.due_date)),
      quickActions: activeTasks.filter(t => isQuickAction(t) && !waitingStatuses.includes(t.status) && !isOverdue(t.due_date)).sort((a, b) => calculateTaskScore(b) - calculateTaskScore(a)),
      waiting: tasks.filter(t => waitingStatuses.includes(t.status)).length,
      toInvoice: tasks.filter(t => t.status === 'completed').length,
      total: activeTasks.length,
    }
  }, [tasks, quickActionThreshold])

  const categoryCounts = useMemo(() => ({
    active: tasks.filter(t => !archivedStatuses.includes(t.status) && !waitingStatuses.includes(t.status) && t.status !== 'someday_maybe').length,
    waiting: tasks.filter(t => waitingStatuses.includes(t.status)).length,
    someday: tasks.filter(t => t.status === 'someday_maybe').length,
    archive: tasks.filter(t => archivedStatuses.includes(t.status)).length,
  }), [tasks])

  // DnD sensors
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  // Handle drag end with optimistic update + API call
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)
    if (!over || !userId) return
    const taskId = active.id as string
    const overId = over.id as string
    const currentTask = tasks.find(t => t.id === taskId)
    const targetColumn = kanbanColumns.find(col => col.id === overId)
    let newStatus: TaskStatus | null = null
    if (targetColumn) {
      newStatus = getStatusForColumn(targetColumn.id)
    } else {
      const overTask = tasks.find(t => t.id === overId)
      if (overTask) {
        const targetColumnId = getColumnForStatus(overTask.status)
        newStatus = targetColumnId ? getStatusForColumn(targetColumnId) : overTask.status
      }
    }
    if (!newStatus || newStatus === currentTask?.status) return
    // Optimistic update
    setTasks(prev => prev.map(task => task.id === taskId ? { ...task, status: newStatus as TaskStatus, updated_at: new Date().toISOString(), completed_at: newStatus === 'completed' ? new Date().toISOString() : task.completed_at, is_waiting_for: newStatus === 'waiting_for' || newStatus === 'waiting_client' } : task))
    // API call
    setUpdatingTaskId(taskId)
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        body: JSON.stringify({ status: newStatus })
      })
      if (!response.ok) throw new Error()
    } catch {
      toast.error('Nepodařilo se aktualizovat úkol')
      // Rollback
      if (currentTask) {
        setTasks(prev => prev.map(task => task.id === taskId ? currentTask : task))
      }
    } finally {
      setUpdatingTaskId(null)
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id)
    setActiveTask(task || null)
  }

  // Auto-switch from Kanban when viewing only archive
  useEffect(() => {
    if (selectedCategories.size === 1 && selectedCategories.has('archive') && viewMode === 'kanban') {
      setViewMode('list')
    }
  }, [selectedCategories, viewMode])

  const handleCompleteTask = async (taskId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!userId) return
    const currentTask = tasks.find(t => t.id === taskId)
    // Optimistic update
    setTasks(prev => prev.map(task => task.id === taskId ? { ...task, status: 'completed', completed_at: new Date().toISOString(), updated_at: new Date().toISOString() } : task))
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        body: JSON.stringify({ status: 'completed' })
      })
      if (!response.ok) throw new Error()
      fireTaskConfetti()
    } catch {
      toast.error('Nepodařilo se dokončit úkol')
      if (currentTask) {
        setTasks(prev => prev.map(task => task.id === taskId ? currentTask : task))
      }
    }
  }

  const handleStartTimer = (taskId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setTasks(prev => prev.map(task => task.id === taskId && task.status !== 'in_progress' ? { ...task, status: 'in_progress', updated_at: new Date().toISOString() } : task))
    setActiveTimerId(taskId)
  }

  const getTasksForColumn = (columnId: KanbanColumnId) => {
    const column = kanbanColumns.find(c => c.id === columnId)
    if (!column) return []
    return filteredAndSortedTasks.filter(task => column.statuses.includes(task.status))
  }

  const getColumnForStatus = (status: string): KanbanColumnId | null => {
    const column = kanbanColumns.find(c => c.statuses.includes(status))
    return column?.id || null
  }

  const getStatusForColumn = (columnId: KanbanColumnId): TaskStatus => {
    switch (columnId) {
      case 'inbox': return 'pending'
      case 'accepted': return 'accepted'
      case 'in_progress': return 'in_progress'
      case 'waiting_client': return 'waiting_client'
      case 'waiting_for': return 'waiting_for'
      case 'to_invoice': return 'completed'
      default: return 'pending'
    }
  }

  // Task Row Component
  const TaskRow = ({ task, showClient = true }: { task: Task; showClient?: boolean }) => {
    const priorityStyle = priorityConfig[getScorePriority(task)]
    const taskScore = calculateTaskScore(task)
    const overdue = isOverdue(task.due_date)
    const urgent = isUrgent(task.due_date)
    const isTimerActive = activeTimerId === task.id

    const getRowClassName = () => {
      if (overdue) return 'bg-red-100 border-l-4 border-l-red-500'
      if (urgent) return 'bg-amber-100 border-l-4 border-l-amber-500'
      return ''
    }

    return (
      <div className={`flex items-center gap-3 py-2.5 px-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-800/50 transition-colors ${getRowClassName()}`}>
        {task.status !== 'completed' ? (
          <button onClick={(e) => handleCompleteTask(task.id, e)} className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 flex items-center justify-center transition-colors flex-shrink-0">
            <CheckCircle2 className="h-3 w-3 text-transparent hover:text-green-500" />
          </button>
        ) : (
          <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <Link href={`/accountant/tasks/${task.id}`} className="block">
            <span className="flex items-center gap-2">
              <span className={`font-medium text-gray-900 dark:text-white truncate ${task.status === 'completed' ? 'line-through text-gray-500 dark:text-gray-400' : ''}`}>{task.title}</span>
              {(task.status === 'pending' || task.status === 'clarifying') && <Badge variant="outline" className="bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs py-0 h-5 flex-shrink-0"><Inbox className="h-3 w-3 mr-0.5" />Inbox</Badge>}
              {(task.status === 'waiting_for' || task.status === 'waiting_client') && <Badge variant="outline" className="bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs py-0 h-5 flex-shrink-0"><Users className="h-3 w-3 mr-0.5" />{task.status === 'waiting_client' ? 'Čeká klient' : 'Delegováno'}</Badge>}
              {task.status === 'in_progress' && <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs py-0 h-5 flex-shrink-0"><Play className="h-3 w-3 mr-0.5" />Probíhá</Badge>}
              {task.is_next_action && <Badge className="bg-blue-500 text-white text-xs py-0 h-5 flex-shrink-0"><Zap className="h-3 w-3 mr-0.5" />Next</Badge>}
              {isQuickAction(task) && !task.is_next_action && <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs py-0 h-5 flex-shrink-0"><Zap className="h-3 w-3 mr-0.5" />{quickActionThreshold >= 60 ? `${quickActionThreshold / 60}h` : `${quickActionThreshold}min`}</Badge>}
              {task.is_project && <Badge variant="outline" className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs py-0 h-5 flex-shrink-0"><FolderKanban className="h-3 w-3 mr-0.5" />Projekt</Badge>}
            </span>
          </Link>
          {showClient && <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5"><span>{task.company_name}</span></div>}
        </div>
        <div className={`text-sm flex-shrink-0 min-w-[80px] text-right ${overdue ? 'text-red-600 font-semibold' : urgent ? 'text-orange-600 font-semibold' : 'text-gray-600 dark:text-gray-400'}`}>
          {getDeadlineText(task.due_date, task.due_time)}
        </div>
        <Badge className={`${priorityStyle.bg} ${priorityStyle.text} text-xs py-0 h-5 px-2 justify-center flex-shrink-0 font-medium`} title={`R-Tasks skóre: ${taskScore}/12`}>{taskScore} • {priorityStyle.label}</Badge>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button size="sm" variant="ghost" className={`h-7 w-7 p-0 ${isTimerActive ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'}`} onClick={(e) => handleStartTimer(task.id, e)} title={isTimerActive ? 'Časovač běží' : 'Spustit časovač'}>
            {isTimerActive ? <Timer className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    )
  }

  // Task Card Component
  const TaskCard = ({ task }: { task: Task }) => {
    const priorityStyle = priorityConfig[getScorePriority(task)]
    const taskScore = calculateTaskScore(task)
    const overdue = isOverdue(task.due_date)
    const urgent = isUrgent(task.due_date)
    const isTimerActive = activeTimerId === task.id

    const getCardClassName = () => {
      if (overdue) return 'border-l-4 border-l-red-500 bg-red-50 dark:bg-red-900/20'
      if (urgent) return 'border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-900/20'
      return ''
    }

    return (
      <Card className={`card-hover transition-all duration-200 rounded-xl ${getCardClassName()}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              {isQuickAction(task) && <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs"><Zap className="h-3 w-3 mr-1" />{quickActionThreshold >= 60 ? `${quickActionThreshold / 60} hod` : `${quickActionThreshold} min`}</Badge>}
              {task.is_project && <Badge variant="outline" className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs"><FolderKanban className="h-3 w-3 mr-1" />Projekt</Badge>}
            </div>
            <Badge className={`${priorityStyle.bg} ${priorityStyle.text} text-xs font-medium`} title={`R-Tasks skóre: ${taskScore}/12`}>{taskScore} • {priorityStyle.label}</Badge>
          </div>
          <Link href={`/accountant/tasks/${task.id}`}><h4 className="font-semibold text-gray-900 dark:text-white line-clamp-2 hover:text-blue-600 mb-2">{task.title}</h4></Link>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-2"><Building2 className="h-4 w-4 flex-shrink-0" /><span className="truncate">{task.company_name}</span></div>
          <div className="flex items-center gap-2 text-sm mb-3"><Calendar className="h-4 w-4 text-gray-400" /><span className={overdue ? 'text-red-600 font-semibold' : urgent ? 'text-orange-600 font-semibold' : 'text-gray-600 dark:text-gray-400'}>{getDeadlineText(task.due_date, task.due_time)}</span></div>
          <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
            <Button size="sm" variant="ghost" className={`flex-1 ${isTimerActive ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'}`} onClick={(e) => handleStartTimer(task.id, e)}>{isTimerActive ? <Timer className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}{isTimerActive ? 'Běží' : 'Začít'}</Button>
            {task.status !== 'completed' && <Button size="sm" variant="ghost" className="flex-1 text-green-600 hover:bg-green-50 dark:bg-green-900/20" onClick={(e) => handleCompleteTask(task.id, e)}><CheckCircle2 className="h-4 w-4 mr-1" />Hotovo</Button>}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Render task content
  const renderTaskContent = () => {
    if (loading) {
      return (
        <Card><CardContent className="py-12 text-center">
          <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Načítání úkolů...</p>
        </CardContent></Card>
      )
    }
    if (error) {
      return (
        <Card><CardContent className="py-12 text-center">
          <div className="text-red-500 mb-2">Chyba při načítání</div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Zkusit znovu</Button>
        </CardContent></Card>
      )
    }
    if (filteredAndSortedTasks.length === 0) {
      return (
        <Card><CardContent className="py-12 text-center">
          <FolderKanban className="mx-auto h-12 w-12 text-gray-400 mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Žádné úkoly</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">{searchQuery || filterClient !== 'all' || filterPriority !== 'all' ? 'Zkuste změnit filtry' : 'V této kategorii zatím nejsou žádné úkoly'}</p>
        </CardContent></Card>
      )
    }
    if (viewMode === 'list') {
      return <Card><CardContent className="p-0">{filteredAndSortedTasks.map(task => <TaskRow key={task.id} task={task} />)}</CardContent></Card>
    }
    if (viewMode === 'cards') {
      return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{filteredAndSortedTasks.map(task => <TaskCard key={task.id} task={task} />)}</div>
    }
    // Kanban view
    return (
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {kanbanColumns.map(column => {
            const columnTasks = getTasksForColumn(column.id)
            return (
              <div key={column.id} className="bg-gray-100 dark:bg-gray-700 rounded-xl p-3 min-h-[300px]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm text-gray-900 dark:text-white">{column.emoji} {column.title}</h3>
                  <Badge variant="secondary" className="h-5 px-1.5">{columnTasks.length}</Badge>
                </div>
                <SortableContext items={columnTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {columnTasks.map(task => <DraggableKanbanCard key={task.id} task={task} isOverdue={isOverdue} isUrgent={isUrgent} getDaysUntilDue={getDaysUntilDue} onComplete={handleCompleteTask} onStartTimer={handleStartTimer} />)}
                    {columnTasks.length === 0 && <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">Přetáhněte sem</div>}
                  </div>
                </SortableContext>
              </div>
            )
          })}
        </div>
        <DragOverlay>
          {activeTask && <Card className="shadow-xl ring-2 ring-purple-400 w-56 rounded-xl"><CardContent className="p-3"><h4 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2">{activeTask.title}</h4><p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{activeTask.company_name}</p></CardContent></Card>}
        </DragOverlay>
      </DndContext>
    )
  }

  return (
    <div className="max-w-7xl">
      {/* Gamifikace - progress ring + stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <DailyProgressRing />
        <GamificationStats />
      </div>

      {/* Zpracovat inbox button */}
      {(() => {
        const inboxCount = tasks.filter(t => t.status === 'pending' || t.status === 'clarifying').length
        return inboxCount > 0 ? (
          <div className="mb-4">
            <Link href="/accountant/tasks/clarify">
              <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl">
                <Zap className="h-4 w-4 mr-2" />
                Zpracovat inbox
                <Badge className="ml-2 bg-white/20 text-white border-0 text-xs">{inboxCount}</Badge>
              </Button>
            </Link>
          </div>
        ) : null
      })()}

      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Hledat úkoly..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-9 rounded-xl" />
        </div>
        <CompanyCombobox
          companies={companies}
          value={filterClient}
          onValueChange={setFilterClient}
          placeholder="Všichni klienti"
          allowNone
          noneLabel="Všichni klienti"
          triggerClassName="w-[200px] h-9 rounded-xl"
        />
        <Button variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters)} className="h-9 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-700">Filtry{showFilters ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />}</Button>
        <Button size="sm" className="h-9 rounded-xl bg-purple-600 hover:bg-purple-700" asChild><Link href="/accountant/work/new"><Plus className="h-4 w-4 mr-1" />Nový úkol</Link></Button>
      </div>

      {/* Expandable Filters */}
      {showFilters && (
        <Card className="mb-4 rounded-xl shadow-soft-sm"><CardContent className="py-3 px-4">
          <div className="flex flex-wrap items-center gap-3">
            <Select value={filterPriority} onValueChange={(v) => setFilterPriority(v as ScorePriority | 'all')}>
              <SelectTrigger className="w-[160px] h-8"><SelectValue placeholder="Priorita" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Všechny priority</SelectItem>
                <SelectItem value="high">Vysoká (9-12)</SelectItem>
                <SelectItem value="medium">Střední (6-8)</SelectItem>
                <SelectItem value="low">Nízká (0-5)</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterProjectScope} onValueChange={(v) => setFilterProjectScope(v as 'all' | 'project' | 'free')}>
              <SelectTrigger className="w-[160px] h-8"><SelectValue placeholder="Zdroj" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Všechny úkoly</SelectItem>
                <SelectItem value="project">Z projektů</SelectItem>
                <SelectItem value="free">Volné úkoly</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
              <SelectTrigger className="w-[140px] h-8"><SelectValue placeholder="Řadit" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="score">Podle score</SelectItem>
                <SelectItem value="deadline">Podle termínu</SelectItem>
                <SelectItem value="priority">Podle priority</SelectItem>
                <SelectItem value="client">Podle klienta</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-purple-600" />
              <Select value={quickActionThreshold.toString()} onValueChange={handleQuickActionThresholdChange}>
                <SelectTrigger className="w-[100px] h-8"><SelectValue /></SelectTrigger>
                <SelectContent>{QUICK_ACTION_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value.toString()}>{opt.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-4 ml-auto text-sm text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-1"><Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />Čeká: <strong>{urgencyStats.waiting}</strong></span>
              <span className="flex items-center gap-1"><Banknote className="h-4 w-4 text-green-600 dark:text-green-400" />K fakturaci: <strong>{urgencyStats.toInvoice}</strong></span>
            </div>
          </div>
        </CardContent></Card>
      )}

      {/* Category Filter & View Mode */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            {CATEGORIES.map(category => {
              const Icon = category.icon
              const isSelected = selectedCategories.has(category.id)
              return (
                <button key={category.id} onClick={() => toggleCategory(category.id)} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-200 ${isSelected ? `${category.bgColor} shadow-sm ring-1 ring-inset` : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`} style={isSelected ? { '--tw-ring-color': 'currentColor', '--tw-ring-opacity': '0.2' } as React.CSSProperties : undefined}>
                  {isSelected ? <CheckCircle2 className={`h-4 w-4 ${category.color}`} /> : <Circle className="h-4 w-4 text-gray-300 dark:text-gray-500" />}
                  <Icon className={`h-4 w-4 ${isSelected ? category.color : 'text-gray-400'}`} />
                  <span className={`text-xs font-medium ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>{category.label}</span>
                  <span className={`text-[10px] font-medium ${isSelected ? 'opacity-70' : 'opacity-50'}`}>{categoryCounts[category.id]}</span>
                </button>
              )
            })}
            <div className="flex items-center gap-1 ml-2 border-l border-gray-200 dark:border-gray-700 pl-2">
              <Button variant="ghost" size="sm" onClick={selectOnlyActive} className="h-7 px-2 text-xs rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Aktivní</Button>
              <Button variant="ghost" size="sm" onClick={selectAllWithoutArchive} className="h-7 px-2 text-xs rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Bez archivu</Button>
              <Button variant="ghost" size="sm" onClick={selectAll} className="h-7 px-2 text-xs rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Vše</Button>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            <Button variant="ghost" size="sm" onClick={() => setViewMode('list')} className={`h-7 px-2 rounded-lg transition-all duration-200 ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}><List className="h-4 w-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => setViewMode('cards')} className={`h-7 px-2 rounded-lg transition-all duration-200 ${viewMode === 'cards' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}><LayoutGrid className="h-4 w-4" /></Button>
            {!(selectedCategories.size === 1 && selectedCategories.has('archive')) && <Button variant="ghost" size="sm" onClick={() => setViewMode('kanban')} className={`h-7 px-2 rounded-lg transition-all duration-200 ${viewMode === 'kanban' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}><Columns3 className="h-4 w-4" /></Button>}
          </div>
        </div>
        <div className="mt-2">{renderTaskContent()}</div>
      </div>

      {/* New Task Dialog */}
      <Dialog open={showNewTask} onOpenChange={setShowNewTask}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-purple-600" />Nový úkol</DialogTitle>
            <DialogDescription>Vytvořte nový úkol. Bude rovnou připraven k práci.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="task-title">Název *</Label>
              <Input id="task-title" value={newTaskForm.title} onChange={e => setNewTaskForm(p => ({ ...p, title: e.target.value }))} placeholder="Co je potřeba udělat?" disabled={newTaskLoading} autoFocus />
            </div>
            <div>
              <Label htmlFor="task-desc">Popis</Label>
              <Textarea id="task-desc" value={newTaskForm.description} onChange={e => setNewTaskForm(p => ({ ...p, description: e.target.value }))} placeholder="Volitelný popis..." rows={2} disabled={newTaskLoading} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Klient</Label>
                <CompanyCombobox
                  companies={companies}
                  value={newTaskForm.company_id}
                  onValueChange={v => setNewTaskForm(p => ({ ...p, company_id: v }))}
                  placeholder="Vyberte klienta"
                  allowNone
                  noneLabel="Bez klienta"
                  triggerClassName="w-full"
                />
              </div>
              <div>
                <Label htmlFor="task-due">Termín dokončení</Label>
                <Input id="task-due" type="date" value={newTaskForm.due_date} onChange={e => setNewTaskForm(p => ({ ...p, due_date: e.target.value }))} disabled={newTaskLoading} />
              </div>
            </div>
            <div>
              <Label>Odhadovaný čas</Label>
              <Select value={String(newTaskForm.estimated_minutes)} onValueChange={v => setNewTaskForm(p => ({ ...p, estimated_minutes: parseInt(v) }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {QUICK_ACTION_OPTIONS.map(opt => <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priorita</Label>
              <div className="flex gap-2 mt-1">
                {([['high', 'Vysoká', 'bg-red-100 text-red-700 border-red-300'], ['medium', 'Střední', 'bg-yellow-100 text-yellow-700 border-yellow-300'], ['low', 'Nízká', 'bg-green-100 text-green-700 border-green-300']] as const).map(([val, label, colors]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setNewTaskForm(p => ({ ...p, priority: val }))}
                    className={`flex-1 py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all ${
                      newTaskForm.priority === val
                        ? `${colors} ring-2 ring-offset-1`
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 text-gray-500 dark:text-gray-400'
                    }`}
                    style={newTaskForm.priority === val ? { '--tw-ring-color': 'currentColor', '--tw-ring-opacity': '0.3' } as React.CSSProperties : undefined}
                    disabled={newTaskLoading}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewTask(false)} disabled={newTaskLoading}>Zrušit</Button>
            <Button className="bg-purple-600 hover:bg-purple-700 rounded-xl" onClick={handleCreateTask} disabled={newTaskLoading}>
              {newTaskLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Vytvářím...</> : 'Vytvořit úkol'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
