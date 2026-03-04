'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Plus,
  Search,
  Inbox,
  List,
  Columns3,
  Flame,
  Trophy,
  CheckCircle,
  Loader2,
  FolderKanban,
  CheckSquare,
  LayoutGrid,
} from 'lucide-react'
import { PrioritySwimlanes, WorkItem } from '@/components/gtd/priority-swimlanes'

type ViewMode = 'inbox' | 'list' | 'kanban'
type TypeFilter = 'all' | 'tasks' | 'projects'

type TaskFromAPI = {
  id: string
  title: string
  status: string
  is_project?: boolean
  due_date?: string
  company_name?: string
  assigned_to_name?: string
  is_next_action?: boolean
  total_score?: number
  score_money?: number
  score_fire?: number
  score_time?: number
  score_distance?: number
  score_personal?: number
  priority?: string
  progress_percentage?: number
  completed_at?: string
  updated_at?: string
}

type ProjectFromAPI = {
  id: string
  title: string
  status: string
  due_date?: string
  company_id?: string
  progress_percentage?: number
  score_money?: number
  score_fire?: number
  score_time?: number
  score_distance?: number
  score_personal?: number
}

function derivePriority(item: TaskFromAPI | ProjectFromAPI): 'high' | 'medium' | 'low' {
  const score = (item.score_money || 0) + (item.score_fire || 0) + (item.score_time || 0) + (item.score_distance || 0) + (item.score_personal || 0)
  if (score >= 9) return 'high'
  if (score >= 6) return 'medium'
  return 'low'
}

function calculateStreak(tasks: TaskFromAPI[]): number {
  const completedDates = new Set<string>()
  for (const t of tasks) {
    if (t.status === 'completed' && t.completed_at) {
      completedDates.add(t.completed_at.slice(0, 10))
    }
  }
  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    if (completedDates.has(dateStr)) {
      streak++
    } else if (i === 0) {
      continue
    } else {
      break
    }
  }
  return streak
}

export default function WorkPage() {
  const [tasks, setTasks] = useState<TaskFromAPI[]>([])
  const [projects, setProjects] = useState<ProjectFromAPI[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')

  useEffect(() => {
    Promise.all([
      fetch('/api/tasks?page_size=500').then(r => r.json()),
      fetch('/api/projects').then(r => r.json()),
    ])
      .then(([tasksData, projectsData]) => {
        setTasks(tasksData.tasks || [])
        setProjects(projectsData.projects || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Compute stats
  const inboxCount = useMemo(() =>
    tasks.filter(t => t.status === 'pending' && !t.is_project).length
  , [tasks])

  const todayStr = new Date().toISOString().slice(0, 10)
  const todayCompleted = useMemo(() =>
    tasks.filter(t => t.status === 'completed' && t.completed_at?.startsWith(todayStr)).length
  , [tasks, todayStr])

  const activeCount = useMemo(() =>
    tasks.filter(t => !['completed', 'cancelled', 'someday_maybe', 'invoiced'].includes(t.status) && !t.is_project).length
  , [tasks])

  const streak = useMemo(() => calculateStreak(tasks), [tasks])

  // Merge tasks and projects into WorkItems
  const workItems: WorkItem[] = useMemo(() => {
    const activeStatuses = ['pending', 'clarifying', 'accepted', 'in_progress', 'waiting_for', 'waiting_client', 'awaiting_approval']
    const projectStatuses = ['planning', 'active', 'on_hold', 'review']

    const taskItems: WorkItem[] = tasks
      .filter(t => activeStatuses.includes(t.status) && !t.is_project)
      .map(t => ({
        id: t.id,
        title: t.title,
        type: 'task' as const,
        status: t.status,
        priority: derivePriority(t),
        total_score: t.total_score,
        due_date: t.due_date,
        company_name: t.company_name,
        assigned_to_name: t.assigned_to_name,
        is_next_action: t.is_next_action,
        updated_at: t.updated_at,
      }))

    const projectItems: WorkItem[] = projects
      .filter(p => projectStatuses.includes(p.status))
      .map(p => ({
        id: p.id,
        title: p.title,
        type: 'project' as const,
        status: p.status,
        priority: derivePriority(p),
        total_score: (p.score_money || 0) + (p.score_fire || 0) + (p.score_time || 0) + (p.score_distance || 0) + (p.score_personal || 0),
        due_date: p.due_date,
        progress_percentage: p.progress_percentage,
        is_project: true,
      }))

    let combined = [...taskItems, ...projectItems]

    // Type filter
    if (typeFilter === 'tasks') {
      combined = combined.filter(i => i.type === 'task')
    } else if (typeFilter === 'projects') {
      combined = combined.filter(i => i.type === 'project' || i.is_project)
    }

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      combined = combined.filter(i => i.title.toLowerCase().includes(q) || i.company_name?.toLowerCase().includes(q))
    }

    return combined
  }, [tasks, projects, searchQuery, typeFilter])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold font-display text-gray-900 dark:text-white">Práce</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {workItems.length} aktivních položek
          </p>
        </div>
        <Button asChild className="bg-purple-600 hover:bg-purple-700">
          <Link href="/accountant/work/new">
            <Plus className="mr-2 h-4 w-4" />
            Nová práce
          </Link>
        </Button>
      </div>

      {/* Quick Stats inline */}
      <div className="flex items-center gap-4 mb-5 flex-wrap">
        <div className="flex items-center gap-1.5 text-sm">
          <Flame className={`h-4 w-4 ${streak > 0 ? 'text-orange-500' : 'text-gray-300'}`} />
          <span className="font-bold">{streak}</span>
          <span className="text-muted-foreground">streak</span>
        </div>
        <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />
        <div className="flex items-center gap-1.5 text-sm">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span className="font-bold">{todayCompleted}</span>
          <span className="text-muted-foreground">dnes</span>
        </div>
        <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />
        <div className="flex items-center gap-1.5 text-sm">
          <Trophy className="h-4 w-4 text-purple-500" />
          <span className="font-bold">{activeCount}</span>
          <span className="text-muted-foreground">aktivních</span>
        </div>
        {inboxCount > 0 && (
          <>
            <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />
            <Link
              href="/accountant/tasks/clarify"
              className="flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-400 hover:underline"
            >
              <Inbox className="h-4 w-4" />
              <span className="font-bold">{inboxCount}</span>
              <span>v inboxu</span>
            </Link>
          </>
        )}
      </div>

      {/* Search + View toggles */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center gap-2 flex-1 bg-white dark:bg-gray-900 border rounded-xl px-3 shadow-sm">
          <Search className="h-4 w-4 text-gray-400" />
          <Input
            placeholder="Hledat úkoly a projekty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-0 shadow-none focus-visible:ring-0 px-0"
          />
        </div>
        <div className="flex border rounded-lg overflow-hidden">
          {[
            { mode: 'all' as TypeFilter, icon: LayoutGrid, label: 'Vše' },
            { mode: 'tasks' as TypeFilter, icon: CheckSquare, label: 'Úkoly' },
            { mode: 'projects' as TypeFilter, icon: FolderKanban, label: 'Projekty' },
          ].map(v => (
            <button
              key={v.mode}
              onClick={() => setTypeFilter(v.mode)}
              className={`px-3 py-2 text-sm flex items-center gap-1.5 transition-colors ${
                typeFilter === v.mode
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              title={v.label}
            >
              <v.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{v.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {workItems.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-400 mb-4" />
            <h3 className="text-lg font-semibold font-display mb-2">
              {searchQuery ? 'Nic nenalezeno' : 'Všechno hotovo!'}
            </h3>
            <p className="text-muted-foreground">
              {searchQuery
                ? 'Zkuste jiný vyhledávací dotaz'
                : 'Žádné aktivní úkoly ani projekty. Skvělá práce!'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <PrioritySwimlanes items={workItems} />
      )}
    </div>
  )
}
