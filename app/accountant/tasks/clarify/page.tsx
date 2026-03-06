'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle,
  Clock,
  Trash2,
  Archive,
  ArrowLeft,
  PartyPopper,
  Users,
  CalendarDays,
  ChevronDown,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { ScoringWizard } from '@/components/gtd/scoring-wizard'
import { fireTaskConfetti, fireInboxClearedConfetti } from '@/components/gtd/confetti'
import { toast } from 'sonner'
import { useAccountantUser } from '@/lib/contexts/accountant-user-context'

type Task = {
  id: string
  title: string
  description?: string
  company_name?: string
  due_date?: string
  estimated_minutes?: number
}

type Priority = 'high' | 'medium' | 'low'

const PRIORITY_SCORES: Record<Priority, { total_score: number; score_fire: number; score_money: number; score_time: number; score_distance: number; score_personal: number }> = {
  high: { total_score: 10, score_fire: 3, score_money: 2, score_time: 2, score_distance: 2, score_personal: 1 },
  medium: { total_score: 7, score_fire: 2, score_money: 1, score_time: 2, score_distance: 1, score_personal: 1 },
  low: { total_score: 3, score_fire: 1, score_money: 0, score_time: 1, score_distance: 1, score_personal: 0 },
}

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bgColor: string }> = {
  high: { label: 'Vysoká', color: 'text-red-700 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30 border-red-300' },
  medium: { label: 'Střední', color: 'text-yellow-700 dark:text-yellow-400', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300' },
  low: { label: 'Nízká', color: 'text-green-700 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/30 border-green-300' },
}

function getDefaultDeadline(): string {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  return d.toISOString().split('T')[0]
}

export default function ClarifyPage() {
  const router = useRouter()
  const { userId, userName } = useAccountantUser()
  const [tasks, setTasks] = useState<Task[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [allDone, setAllDone] = useState(false)
  const [saving, setSaving] = useState(false)

  // "Udělám" expanded state
  const [showDetails, setShowDetails] = useState(false)
  const [dueDate, setDueDate] = useState(getDefaultDeadline())
  const [priority, setPriority] = useState<Priority>('medium')
  const [showDelegate, setShowDelegate] = useState(false)
  const [assignedTo, setAssignedTo] = useState<string | null>(null)
  const [showScoring, setShowScoring] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Users for delegation
  const [users, setUsers] = useState<{ id: string; full_name: string }[]>([])

  useEffect(() => {
    Promise.all([
      fetch('/api/tasks?status=pending,clarifying&page_size=100').then(r => r.json()),
      fetch('/api/accountant/users').then(r => r.json()),
    ]).then(([tasksData, usersData]) => {
      const loadedTasks = tasksData.tasks || []
      setTasks(loadedTasks)
      setUsers(usersData.users || [])
      if (!loadedTasks.length) {
        setAllDone(true)
      } else if (loadedTasks[0]?.due_date) {
        setDueDate(loadedTasks[0].due_date)
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const currentTask = tasks[currentIndex]
  const totalTasks = tasks.length
  const processedCount = currentIndex

  const resetStateForTask = (task?: Task) => {
    setShowDetails(false)
    setDueDate(task?.due_date || getDefaultDeadline())
    setPriority('medium')
    setShowDelegate(false)
    setAssignedTo(null)
    setShowScoring(false)
    setConfirmDelete(false)
  }

  const nextTask = () => {
    if (currentIndex + 1 >= totalTasks) {
      setAllDone(true)
      fireInboxClearedConfetti()
    } else {
      const nextIdx = currentIndex + 1
      resetStateForTask(tasks[nextIdx])
      setCurrentIndex(nextIdx)
    }
  }

  const updateTask = async (taskId: string, updates: Record<string, unknown>) => {
    if (!userId) throw new Error('missing user')
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
        'x-user-name': userName || 'Ucetni',
      },
      body: JSON.stringify(updates),
    })
  }

  // Action handlers
  const handlePostpone = async () => {
    if (!currentTask || saving) return
    setSaving(true)
    await updateTask(currentTask.id, { status: 'someday_maybe' })
    toast.success('Odlozeno na pozdeji')
    setSaving(false)
    nextTask()
  }

  const handleArchive = async () => {
    if (!currentTask || saving) return
    setSaving(true)
    await updateTask(currentTask.id, { status: 'cancelled', tags: ['reference'] })
    toast.success('Archivovano jako reference')
    setSaving(false)
    nextTask()
  }

  const handleDeleteClick = () => {
    setConfirmDelete(true)
  }

  const handleDeleteConfirm = async () => {
    if (!currentTask || saving) return
    setSaving(true)
    setConfirmDelete(false)
    await updateTask(currentTask.id, { status: 'cancelled', completed_at: new Date().toISOString() })
    toast.success('Ukol oznacen jako zruseny')
    setSaving(false)
    nextTask()
  }

  const handleAcceptQuick = async () => {
    if (!currentTask || saving) return
    setSaving(true)
    const scores = PRIORITY_SCORES[priority]
    const isDelegated = !!assignedTo
    await updateTask(currentTask.id, {
      status: isDelegated ? 'waiting_for' : 'accepted',
      is_waiting_for: isDelegated,
      waiting_for_who: isDelegated ? assignedTo : null,
      ...scores,
      due_date: dueDate || null,
      assigned_to: assignedTo,
    })
    fireTaskConfetti()
    toast.success(isDelegated ? 'Úkol delegován' : 'Úkol přijat')
    setSaving(false)
    nextTask()
  }

  const handleScoringComplete = async (result: {
    score_money: number
    score_fire: number
    score_time: number
    score_distance: number
    score_personal: number
    total_score: number
    priority: string
  }) => {
    if (!currentTask || saving) return
    setSaving(true)
    const isDelegated = !!assignedTo
    const { priority: _p, ...scores } = result
    await updateTask(currentTask.id, {
      status: isDelegated ? 'waiting_for' : 'accepted',
      is_waiting_for: isDelegated,
      waiting_for_who: isDelegated ? assignedTo : null,
      ...scores,
      due_date: dueDate || null,
      assigned_to: assignedTo,
    })
    fireTaskConfetti()
    toast.success(`Úkol ohodnocen: ${result.total_score}/12`)
    setSaving(false)
    nextTask()
  }

  const handleGoBack = () => {
    router.push('/accountant/work')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    )
  }

  if (allDone) {
    return (
      <div className="max-w-lg mx-auto text-center py-20 space-y-6">
        <PartyPopper className="h-16 w-16 mx-auto text-purple-600" />
        <h2 className="text-2xl font-bold font-display">Inbox je prázdný!</h2>
        <p className="text-muted-foreground">
          Zpracováno {processedCount} {processedCount === 1 ? 'úkol' : processedCount < 5 ? 'úkoly' : 'úkolů'}.
        </p>
        <Button onClick={handleGoBack}>
          Zpět na úkoly
        </Button>
      </div>
    )
  }

  if (!currentTask) return null

  const progressPercent = totalTasks > 0 ? (processedCount / totalTasks) * 100 : 0

  // Scoring wizard mode
  if (showScoring) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setShowScoring(false)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Zpět
          </Button>
          <span className="text-sm text-muted-foreground">
            Detailní hodnocení
          </span>
        </div>
        <ScoringWizard
          onComplete={handleScoringComplete}
          onCancel={() => setShowScoring(false)}
        />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={handleGoBack}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Úkoly
        </Button>
        <span className="text-sm text-muted-foreground">
          Úkol {processedCount + 1} z {totalTasks}
        </span>
      </div>

      {/* Progress */}
      <Progress value={progressPercent} className="h-2" />

      {/* Current task card */}
      <Card className="border-2 border-purple-200 dark:border-purple-800">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs">Inbox</Badge>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {currentTask.estimated_minutes && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {currentTask.estimated_minutes >= 60 ? `${Math.round(currentTask.estimated_minutes / 60)} hod` : `${currentTask.estimated_minutes} min`}
                </span>
              )}
              {currentTask.company_name && <span>{currentTask.company_name}</span>}
            </div>
          </div>
          <CardTitle className="text-xl">{currentTask.title}</CardTitle>
        </CardHeader>
        {(currentTask.description || currentTask.due_date) && (
          <CardContent className="pt-0 space-y-1">
            {currentTask.description && <p className="text-sm text-muted-foreground">{currentTask.description}</p>}
            {currentTask.due_date && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                Termín: {new Date(currentTask.due_date).toLocaleDateString('cs-CZ')}
              </p>
            )}
          </CardContent>
        )}
      </Card>

      {/* Action question */}
      <h3 className="text-lg font-semibold font-display text-center">Co s tímto úkolem?</h3>

      {/* 4 action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setShowDetails(!showDetails)}
          disabled={saving}
          className={`p-4 rounded-xl border-2 transition-all text-center ${
            showDetails
              ? 'border-green-500 bg-green-50 dark:bg-green-900/20 ring-2 ring-green-200'
              : 'border-green-200 dark:border-green-700 hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
          }`}
        >
          <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
          <span className="font-medium block">Udělám</span>
          <span className="text-xs text-muted-foreground">Přijmu a nastavím detaily</span>
        </button>

        <button
          onClick={handlePostpone}
          disabled={saving}
          className="p-4 rounded-xl border-2 border-purple-200 dark:border-purple-700 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all text-center"
        >
          <Clock className="h-8 w-8 mx-auto mb-2 text-purple-600" />
          <span className="font-medium block">Odložit</span>
          <span className="text-xs text-muted-foreground">Vrátím se k tomu později</span>
        </button>

        <button
          onClick={handleArchive}
          disabled={saving}
          className="p-4 rounded-xl border-2 border-blue-200 dark:border-blue-700 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-center"
        >
          <Archive className="h-8 w-8 mx-auto mb-2 text-blue-600" />
          <span className="font-medium block">Archivovat</span>
          <span className="text-xs text-muted-foreground">Uložit jako referenci</span>
        </button>

        <button
          onClick={handleDeleteClick}
          disabled={saving}
          className="p-4 rounded-xl border-2 border-red-200 dark:border-red-700 hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-center"
        >
          <Trash2 className="h-8 w-8 mx-auto mb-2 text-red-600" />
          <span className="font-medium block">Zrusit ukol</span>
          <span className="text-xs text-muted-foreground">Skryt z aktivniho prehledu</span>
        </button>
      </div>

      {/* Delete confirmation */}
      {confirmDelete && (
        <Card className="border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20 animate-in slide-in-from-top-2 duration-200">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800 dark:text-red-300">Opravdu oznacit tento ukol jako zruseny?</p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">Data zustanou ulozena pro historii.</p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="destructive" onClick={handleDeleteConfirm} disabled={saving}>
                    {saving ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Trash2 className="h-3 w-3 mr-1" />}
                    Ano, zrusit
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setConfirmDelete(false)}>
                    Zrušit
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inline details when "Udělám" is selected */}
      {showDetails && (
        <Card className="border-green-200 dark:border-green-800 animate-in slide-in-from-top-2 duration-200">
          <CardContent className="pt-6 space-y-5">
            {/* Deadline */}
            <div>
              <label className="text-sm font-medium flex items-center gap-2 mb-2">
                <CalendarDays className="h-4 w-4 text-gray-500" />
                Termín dokončení
              </label>
              <Input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="max-w-xs"
              />
            </div>

            {/* Priority - 3 buttons */}
            <div>
              <label className="text-sm font-medium block mb-2">Priorita</label>
              <div className="flex gap-2">
                {(['high', 'medium', 'low'] as Priority[]).map(p => {
                  const config = PRIORITY_CONFIG[p]
                  const isSelected = priority === p
                  return (
                    <button
                      key={p}
                      onClick={() => setPriority(p)}
                      className={`flex-1 py-2.5 px-3 rounded-lg border-2 text-sm font-medium transition-all ${
                        isSelected
                          ? `${config.bgColor} ${config.color} ring-2 ring-offset-1`
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 text-gray-600 dark:text-gray-400'
                      }`}
                      style={isSelected ? { '--tw-ring-color': 'currentColor', '--tw-ring-opacity': '0.3' } as React.CSSProperties : undefined}
                    >
                      {config.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Delegate toggle */}
            <div>
              <button
                onClick={() => setShowDelegate(!showDelegate)}
                className="text-sm font-medium flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-purple-600 transition-colors"
              >
                <Users className="h-4 w-4" />
                Delegovat na kolegu
                <ChevronDown className={`h-4 w-4 transition-transform ${showDelegate ? 'rotate-180' : ''}`} />
              </button>
              {showDelegate && (
                <div className="mt-2 grid gap-1.5 pl-6">
                  <button
                    onClick={() => setAssignedTo(null)}
                    className={`text-left py-1.5 px-3 rounded-lg text-sm transition-colors ${
                      !assignedTo ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    Udělám sám
                  </button>
                  {users.map(user => (
                    <button
                      key={user.id}
                      onClick={() => setAssignedTo(user.id)}
                      className={`text-left py-1.5 px-3 rounded-lg text-sm transition-colors ${
                        assignedTo === user.id ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      {user.full_name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2 border-t">
              <Button
                onClick={handleAcceptQuick}
                disabled={saving}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                Potvrdit a pokračovat
              </Button>
              <button
                onClick={() => setShowScoring(true)}
                className="text-xs text-muted-foreground hover:text-purple-600 underline underline-offset-2 transition-colors whitespace-nowrap"
              >
                Detailní hodnocení
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Saving indicator */}
      {saving && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Ukládám...
        </div>
      )}
    </div>
  )
}
