'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Search, Clock, Building2, Calendar } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { UnifiedTaskDetail } from '@/components/work-preview/unified-task-detail'
import { useAccountantUser } from '@/lib/contexts/accountant-user-context'
import { cn } from '@/lib/utils'

interface TaskListItem {
  id: string
  title: string
  status: string
  company_name: string
  due_date?: string
  is_project?: boolean
  total_score?: number
  score_money?: number
  score_fire?: number
  score_time?: number
  score_distance?: number
  score_personal?: number
}

const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    pending: 'Ceka', accepted: 'Prijato', in_progress: 'Probiha',
    waiting_for: 'Ceka na', completed: 'Dokonceno', someday_maybe: 'Nekdy/Mozna',
    awaiting_approval: 'Ke schvaleni', draft: 'Koncept',
  }
  return map[status] || status
}

const getStatusDot = (status: string) => {
  const map: Record<string, string> = {
    completed: 'bg-green-500', in_progress: 'bg-blue-500', waiting_for: 'bg-yellow-500',
    accepted: 'bg-purple-500', awaiting_approval: 'bg-indigo-500', pending: 'bg-gray-400',
  }
  return map[status] || 'bg-gray-400'
}

export default function WorkPreviewPage() {
  const { userId, userName } = useAccountantUser()
  const [tasks, setTasks] = useState<TaskListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (!userId) return
    fetch('/api/tasks?page_size=50', {
      headers: { 'x-user-id': userId },
    })
      .then(r => r.json())
      .then(data => setTasks(data.tasks || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [userId])

  // Filter tasks by search
  const filteredTasks = tasks.filter(t => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return t.title.toLowerCase().includes(q) || t.company_name.toLowerCase().includes(q)
  })

  // Sort: in_progress first, then accepted, pending, rest
  const statusOrder: Record<string, number> = { in_progress: 0, accepted: 1, pending: 2, waiting_for: 3, awaiting_approval: 4 }
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const oa = statusOrder[a.status] ?? 10
    const ob = statusOrder[b.status] ?? 10
    return oa - ob
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  // If task is selected, show unified detail
  if (selectedTaskId) {
    return (
      <div className="max-w-5xl mx-auto">
        <UnifiedTaskDetail
          taskId={selectedTaskId}
          userId={userId}
          userName={userName}
          onBack={() => setSelectedTaskId(null)}
        />
      </div>
    )
  }

  // Task selector
  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold font-display text-gray-900 dark:text-white">
            Pracovni pohled
          </h1>
          <Badge variant="outline" className="text-xs">DEMO v2</Badge>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Vyberte ukol pro zobrazeni kompletniho detailu
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Hledat ukol nebo klienta..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-9 rounded-xl"
        />
      </div>

      {/* Task list */}
      <div className="space-y-2">
        {sortedTasks.length === 0 ? (
          <Card className="rounded-xl">
            <CardContent className="p-8 text-center text-gray-500">
              {searchQuery ? 'Zadne ukoly odpovidajici hledani' : 'Zatim nemata zadne ukoly'}
            </CardContent>
          </Card>
        ) : sortedTasks.map(task => {
          const score = (task.score_money || 0) + (task.score_fire || 0) + (task.score_time || 0) + (task.score_distance || 0) + (task.score_personal || 0)
          return (
            <Card
              key={task.id}
              className="rounded-xl cursor-pointer hover:border-purple-300 hover:shadow-md transition-all group"
              onClick={() => setSelectedTaskId(task.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={cn("w-2.5 h-2.5 rounded-full mt-1.5 shrink-0", getStatusDot(task.status))} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors">
                        {task.title}
                      </h3>
                      {task.is_project && <Badge variant="outline" className="text-[10px] shrink-0 bg-purple-50 text-purple-600 border-purple-200">Projekt</Badge>}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{task.company_name}</span>
                      {task.due_date && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(task.due_date).toLocaleDateString('cs-CZ')}</span>}
                      <span>{getStatusLabel(task.status)}</span>
                    </div>
                  </div>
                  {score > 0 && (
                    <Badge variant="outline" className={cn("text-xs shrink-0", score >= 9 ? 'bg-red-50 text-red-600 border-red-200' : score >= 6 ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-green-50 text-green-600 border-green-200')}>
                      {score}/12
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
