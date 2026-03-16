'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Plus,
  Search,
  Inbox,
  Flame,
  CheckCircle,
  Loader2,
  FolderKanban,
  CheckSquare,
  Trash2,
  ArrowRight,
} from 'lucide-react'
import { PrioritySwimlanes, WorkItem } from '@/components/gtd/priority-swimlanes'
import { useCachedFetch } from '@/lib/hooks/use-cached-fetch'

type TypeFilter = 'all' | 'inbox' | 'tasks' | 'projects'

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

function InboxList({ items, searchQuery, onAction }: {
  items: TaskFromAPI[]
  searchQuery: string
  onAction: (id: string, action: 'task' | 'project' | 'delete') => Promise<void>
}) {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (!searchQuery) return items
    const q = searchQuery.toLowerCase()
    return items.filter(t => t.title.toLowerCase().includes(q) || t.company_name?.toLowerCase().includes(q))
  }, [items, searchQuery])

  const handleAction = async (id: string, action: 'task' | 'project' | 'delete') => {
    if (action === 'delete' && confirmDelete !== id) {
      setConfirmDelete(id)
      return
    }
    setLoadingId(id)
    setConfirmDelete(null)
    await onAction(id, action)
    setLoadingId(null)
  }

  if (filtered.length === 0) {
    return (
      <div className="py-16 text-center">
        <Inbox className="h-12 w-12 text-green-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold font-display mb-1 text-gray-900 dark:text-white">
          {searchQuery ? 'Nic nenalezeno' : 'Inbox je prázdný'}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {searchQuery ? 'Zkuste jiný dotaz' : 'Žádné nezpracované položky.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-muted-foreground">{filtered.length} položek ke zpracování</p>
        <Link href="/accountant/tasks/clarify" className="text-xs text-purple-600 hover:underline flex items-center gap-1">
          Průvodce zpracováním <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      {filtered.map(item => (
        <div key={item.id} className="bg-white dark:bg-gray-900/60 rounded-xl border border-gray-200/80 dark:border-gray-700/60 shadow-soft-sm p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <Link href={`/accountant/work/${item.id}`} className="font-medium hover:underline text-sm">
                {item.title}
              </Link>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                {item.company_name && <span>{item.company_name}</span>}
                {item.due_date && (
                  <>
                    <span className="text-gray-300">·</span>
                    <span>Termín: {new Date(item.due_date).toLocaleDateString('cs-CZ')}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs border-green-200 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950/30"
                disabled={loadingId === item.id}
                onClick={() => handleAction(item.id, 'task')}
              >
                {loadingId === item.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckSquare className="h-3 w-3 mr-1" />}
                Úkol
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs border-violet-200 text-violet-700 hover:bg-violet-50 dark:border-violet-800 dark:text-violet-400 dark:hover:bg-violet-950/30"
                disabled={loadingId === item.id}
                onClick={() => handleAction(item.id, 'project')}
              >
                {loadingId === item.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <FolderKanban className="h-3 w-3 mr-1" />}
                Projekt
              </Button>
              <Button
                size="sm"
                variant="outline"
                className={`h-8 text-xs ${confirmDelete === item.id ? 'border-red-400 bg-red-50 text-red-700 dark:bg-red-950/30' : 'border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30'}`}
                disabled={loadingId === item.id}
                onClick={() => handleAction(item.id, 'delete')}
              >
                {loadingId === item.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3 mr-1" />}
                {confirmDelete === item.id ? 'Potvrdit' : 'Smazat'}
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function WorkPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>(() => {
    if (typeof window !== 'undefined') {
      const urlType = new URLSearchParams(window.location.search).get('type')
      if (urlType === 'projects' || urlType === 'all') return urlType
    }
    return 'tasks'
  })

  const fetchWorkData = useCallback(async () => {
    const [tasksData, projectsData] = await Promise.all([
      fetch('/api/tasks?page_size=500').then(r => r.json()),
      fetch('/api/projects').then(r => r.json()),
    ])
    return { tasks: (tasksData.tasks || []) as TaskFromAPI[], projects: (projectsData.projects || []) as ProjectFromAPI[] }
  }, [])

  const { data: workData, loading } = useCachedFetch('work-page', fetchWorkData)
  const tasks = workData?.tasks ?? []
  const projects = workData?.projects ?? []

  useEffect(() => {
    const syncFromUrl = () => {
      const urlType = new URLSearchParams(window.location.search).get('type')
      if (urlType === 'projects' || urlType === 'all') setTypeFilter(urlType)
    }
    window.addEventListener('popstate', syncFromUrl)
    syncFromUrl()
    return () => window.removeEventListener('popstate', syncFromUrl)
  }, [])

  const todayStr = new Date().toISOString().slice(0, 10)
  const activeStatuses = ['pending', 'clarifying', 'accepted', 'in_progress', 'waiting_for', 'waiting_client', 'awaiting_approval']
  const projectStatuses = ['planning', 'active', 'on_hold', 'review']

  const taskCount = useMemo(() => {
    return tasks.filter(t => !['completed', 'cancelled', 'someday_maybe', 'invoiced'].includes(t.status) && !t.is_project).length
  }, [tasks])

  const projectCount = useMemo(() => {
    const taskProjects = tasks.filter(t => t.is_project && activeStatuses.includes(t.status)).length
    const legacyProjects = projects.filter(p => projectStatuses.includes(p.status)).length
    return taskProjects + legacyProjects
  }, [tasks, projects])

  const inboxCount = useMemo(() => {
    return tasks.filter(t => t.status === 'pending' && !t.is_project).length
  }, [tasks])

  const todayCompleted = useMemo(() => {
    if (typeFilter === 'projects') return 0
    return tasks.filter(t => t.status === 'completed' && t.completed_at?.startsWith(todayStr) && !t.is_project).length
  }, [tasks, todayStr, typeFilter])

  const activeCount = typeFilter === 'projects' ? projectCount : taskCount

  const streak = useMemo(() => {
    if (typeFilter === 'projects') return 0
    return calculateStreak(tasks.filter(t => !t.is_project))
  }, [tasks, typeFilter])

  const inboxItems = useMemo(() => {
    return tasks.filter(t => t.status === 'pending' && !t.is_project)
  }, [tasks])

  const handleInboxAction = useCallback(async (id: string, action: 'task' | 'project' | 'delete') => {
    const updates: Record<string, unknown> = {}
    if (action === 'task') {
      updates.status = 'accepted'
    } else if (action === 'project') {
      updates.status = 'in_progress'
      updates.is_project = true
    } else {
      updates.status = 'cancelled'
    }
    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      // Trigger cache refresh
      window.dispatchEvent(new CustomEvent('cache-invalidate', { detail: 'work-page' }))
      window.location.reload()
    } catch { /* silent */ }
  }, [])

  const workItems: WorkItem[] = useMemo(() => {
    const taskItems: WorkItem[] = tasks
      .filter(t => activeStatuses.includes(t.status))
      .map(t => ({
        id: t.id,
        title: t.title,
        type: t.is_project ? 'project' as const : 'task' as const,
        is_project: t.is_project,
        status: t.status,
        priority: derivePriority(t),
        total_score: t.total_score,
        due_date: t.due_date,
        company_name: t.company_name,
        assigned_to_name: t.assigned_to_name,
        is_next_action: t.is_next_action,
        updated_at: t.updated_at,
        source: 'tasks' as const,
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
        source: 'projects' as const,
      }))

    let combined = [...taskItems, ...projectItems]

    if (typeFilter === 'tasks') {
      combined = combined.filter(i => i.type === 'task')
    } else if (typeFilter === 'projects') {
      combined = combined.filter(i => i.type === 'project' || i.is_project)
    }

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
    <div className="min-w-0 overflow-hidden space-y-4">
      {/* Header row: title + switcher + button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-semibold font-display tracking-tight text-gray-900 dark:text-white">Práce</h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
            <span>{activeCount} {typeFilter === 'projects' ? 'projektů' : 'aktivních'}</span>
            {typeFilter !== 'projects' && todayCompleted > 0 && (
              <>
                <span className="text-gray-300 dark:text-gray-600">·</span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                  {todayCompleted} dnes
                </span>
              </>
            )}
            {typeFilter !== 'projects' && streak > 0 && (
              <>
                <span className="text-gray-300 dark:text-gray-600">·</span>
                <span className="flex items-center gap-1">
                  <Flame className="h-3.5 w-3.5 text-orange-500" />
                  {streak}d série
                </span>
              </>
            )}
            {inboxCount > 0 && typeFilter !== 'projects' && typeFilter !== 'inbox' && (
              <>
                <span className="text-gray-300 dark:text-gray-600">·</span>
                <button
                  onClick={() => setTypeFilter('inbox')}
                  className="flex items-center gap-1 text-amber-600 dark:text-amber-400 hover:underline underline-offset-2"
                >
                  <Inbox className="h-3.5 w-3.5" />
                  {inboxCount} v inboxu
                </button>
              </>
            )}
          </div>
        </div>

        {/* Type switcher — same row, TabsList style */}
        <div className="inline-flex items-center rounded-lg bg-muted p-1">
          {[
            { mode: 'inbox' as TypeFilter, icon: Inbox, label: 'Inbox', count: inboxCount },
            { mode: 'tasks' as TypeFilter, icon: CheckSquare, label: 'Úkoly', count: taskCount },
            { mode: 'projects' as TypeFilter, icon: FolderKanban, label: 'Projekty', count: projectCount },
          ].map(v => (
            <button
              key={v.mode}
              onClick={() => setTypeFilter(v.mode)}
              className={`inline-flex items-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-all ${
                typeFilter === v.mode
                  ? 'bg-background text-foreground shadow-soft-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <v.icon className="h-4 w-4" />
              {v.label}
              <span className={`text-xs tabular-nums ${
                typeFilter === v.mode
                  ? 'text-purple-600 dark:text-purple-400 font-bold'
                  : v.mode === 'inbox' && v.count > 0
                    ? 'text-amber-600 dark:text-amber-400 font-bold'
                    : 'text-muted-foreground'
              }`}>
                {v.count}
              </span>
            </button>
          ))}
        </div>

        <Button asChild size="sm" className="bg-purple-600 hover:bg-purple-700 text-white shrink-0 self-start sm:self-auto">
          <Link href="/accountant/work/new">
            <Plus className="mr-1.5 h-4 w-4" />
            Nová práce
          </Link>
        </Button>
      </div>

      {/* Search bar */}
      <div className="bg-white dark:bg-gray-900/60 rounded-xl border border-gray-200/80 dark:border-gray-700/60 shadow-soft-sm p-3">
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/60 rounded-lg px-3">
          <Search className="h-4 w-4 text-gray-400 shrink-0" />
          <Input
            placeholder="Hledat úkoly a projekty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-0 shadow-none focus-visible:ring-0 px-0 h-9 text-sm bg-transparent"
          />
        </div>
      </div>

      {/* Content */}
      {typeFilter === 'inbox' ? (
        <InboxList items={inboxItems} searchQuery={searchQuery} onAction={handleInboxAction} />
      ) : workItems.length === 0 ? (
        <div className="py-16 text-center">
          <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold font-display mb-1 text-gray-900 dark:text-white">
            {searchQuery ? 'Nic nenalezeno' : 'Všechno hotovo!'}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {searchQuery
              ? 'Zkuste jiný vyhledávací dotaz'
              : 'Žádné aktivní úkoly ani projekty.'}
          </p>
        </div>
      ) : (
        <PrioritySwimlanes items={workItems} />
      )}
    </div>
  )
}
