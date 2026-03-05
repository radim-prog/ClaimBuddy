'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface TaskItem {
  id: string
  title: string
  status: string
  priority?: string
  due_date?: string | null
  assigned_to?: string | null
}

interface TasksPanelProps {
  projectId: string
}

export function TasksPanel({ projectId }: TasksPanelProps) {
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [loading, setLoading] = useState(true)
  const [newTitle, setNewTitle] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    fetch(`/api/projects/${projectId}/tasks`, {
      headers: { 'x-user-id': 'radim' },
    })
      .then(r => r.json())
      .then(data => setTasks(data.tasks || []))
      .catch(() => toast.error('Nepodařilo se načíst úkoly'))
      .finally(() => setLoading(false))
  }, [projectId])

  const toggleTask = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'next_action' : 'completed'
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-id': 'radim' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
      }
    } catch {
      toast.error('Chyba při změně stavu')
    }
  }

  const addTask = async () => {
    if (!newTitle.trim()) return
    setAdding(true)
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': 'radim' },
        body: JSON.stringify({
          title: newTitle,
          project_id: projectId,
          status: 'next_action',
          priority: 'medium',
        }),
      })
      const data = await res.json()
      if (res.ok && data.task) {
        setTasks(prev => [data.task, ...prev])
        setNewTitle('')
        toast.success('Úkol přidán')
      }
    } catch {
      toast.error('Chyba při přidávání')
    } finally {
      setAdding(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
  }

  const pending = tasks.filter(t => t.status !== 'completed' && t.status !== 'someday_maybe')
  const completed = tasks.filter(t => t.status === 'completed')

  return (
    <div className="space-y-6">
      {/* Inline add */}
      <div className="flex gap-2">
        <Input
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          placeholder="Nový úkol..."
          onKeyDown={e => e.key === 'Enter' && addTask()}
          className="flex-1"
        />
        <Button onClick={addTask} disabled={adding || !newTitle.trim()} className="bg-blue-600 hover:bg-blue-700">
          {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        </Button>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="rounded-xl shadow-soft border-red-200">
          <CardContent className="p-6">
            <h3 className="font-bold font-display text-red-700 mb-4">Nedokončené ({pending.length})</h3>
            <div className="space-y-2">
              {pending.length === 0 && (
                <div className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">Všechno hotovo!</div>
              )}
              {pending.map(task => (
                <div
                  key={task.id}
                  className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => toggleTask(task.id, task.status)}
                >
                  <input type="checkbox" checked={false} readOnly className="mt-1" />
                  <div className="flex-1">
                    <div className="font-medium">{task.title}</div>
                    <div className="flex gap-2 mt-1">
                      <Badge className={task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-orange-500' : 'bg-gray-400'}>
                        {task.priority || 'N/A'}
                      </Badge>
                      {task.due_date && (
                        <div className="text-xs text-gray-600 dark:text-gray-300" suppressHydrationWarning>
                          {new Date(task.due_date).toLocaleDateString('cs-CZ')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-soft border-green-200">
          <CardContent className="p-6">
            <h3 className="font-bold font-display text-green-700 mb-4">Dokončené ({completed.length})</h3>
            <div className="space-y-2">
              {completed.length === 0 && (
                <div className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">Zatím nic</div>
              )}
              {completed.map(task => (
                <div
                  key={task.id}
                  className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg opacity-60 hover:opacity-100 cursor-pointer"
                  onClick={() => toggleTask(task.id, task.status)}
                >
                  <input type="checkbox" checked={true} readOnly className="mt-1" />
                  <div className="flex-1">
                    <div className="font-medium line-through">{task.title}</div>
                    <Badge className="bg-gray-400 mt-1">{task.priority || 'N/A'}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
