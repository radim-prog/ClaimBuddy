'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle,
  BookOpen,
  Clock,
  Trash2,
  Zap,
  FolderKanban,
  Users,
  Calendar,
  ArrowLeft,
  PartyPopper,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { ScoringWizard } from '@/components/gtd/scoring-wizard'
import { toast } from 'sonner'

type Task = {
  id: string
  title: string
  description?: string
  company_name?: string
}

type ClarifyStep = 'actionable' | 'two_minute' | 'is_project' | 'delegate' | 'deadline' | 'scoring' | 'done'

export default function ClarifyPage() {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [step, setStep] = useState<ClarifyStep>('actionable')
  const [loading, setLoading] = useState(true)
  const [allDone, setAllDone] = useState(false)

  // Collected data for current task
  const [assignedTo, setAssignedTo] = useState<string | null>(null)
  const [dueDate, setDueDate] = useState('')
  const [timerActive, setTimerActive] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(120)

  // Users for delegate step
  const [users, setUsers] = useState<{ id: string; full_name: string }[]>([])

  useEffect(() => {
    Promise.all([
      fetch('/api/tasks?status=pending&page_size=100').then(r => r.json()),
      fetch('/api/accountant/users').then(r => r.json()),
    ]).then(([tasksData, usersData]) => {
      setTasks(tasksData.tasks || [])
      setUsers(usersData.users || [])
      if (!tasksData.tasks?.length) setAllDone(true)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  // 2-minute timer
  useEffect(() => {
    if (!timerActive || timerSeconds <= 0) return
    const interval = setInterval(() => {
      setTimerSeconds(s => {
        if (s <= 1) {
          setTimerActive(false)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [timerActive, timerSeconds])

  const currentTask = tasks[currentIndex]
  const totalTasks = tasks.length
  const processedCount = currentIndex

  const updateTask = async (taskId: string, updates: Record<string, unknown>) => {
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
  }

  const deleteTask = async (taskId: string) => {
    await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
  }

  const nextTask = () => {
    setStep('actionable')
    setAssignedTo(null)
    setDueDate('')
    setTimerActive(false)
    setTimerSeconds(120)

    if (currentIndex + 1 >= totalTasks) {
      setAllDone(true)
    } else {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const handleActionable = async (actionable: string) => {
    if (!currentTask) return

    switch (actionable) {
      case 'yes':
        setStep('two_minute')
        break
      case 'reference':
        await updateTask(currentTask.id, { status: 'cancelled', tags: ['reference'] })
        toast.success('Uloženo jako Reference')
        nextTask()
        break
      case 'someday':
        await updateTask(currentTask.id, { status: 'someday_maybe' })
        toast.success('Přesunuto do Někdy/Možná')
        nextTask()
        break
      case 'delete':
        await deleteTask(currentTask.id)
        toast.success('Smazáno')
        nextTask()
        break
    }
  }

  const handleTwoMinute = (quick: boolean) => {
    if (quick) {
      setTimerActive(true)
      setTimerSeconds(120)
    } else {
      setStep('is_project')
    }
  }

  const handleTimerComplete = async () => {
    if (!currentTask) return
    await updateTask(currentTask.id, {
      status: 'completed',
      gtd_is_quick_action: true,
    })
    toast.success('Hotovo!')
    nextTask()
  }

  const handleIsProject = (isProject: boolean) => {
    if (isProject) {
      router.push(`/accountant/projects/new?from_task=${currentTask?.id}`)
    } else {
      setStep('delegate')
    }
  }

  const handleDelegate = (delegate: boolean) => {
    if (!delegate) {
      setStep('deadline')
    } else {
      // Show user selection - handled in render
    }
  }

  const handleDeadline = () => {
    setStep('scoring')
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
    if (!currentTask) return
    await updateTask(currentTask.id, {
      status: 'accepted',
      ...result,
      assigned_to: assignedTo,
      due_date: dueDate || null,
    })
    toast.success(`Úkol ohodnocen: ${result.total_score}/12`)
    nextTask()
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
        <h2 className="text-2xl font-bold">Inbox je prázdný!</h2>
        <p className="text-muted-foreground">
          Zpracoval jsi {processedCount} {processedCount === 1 ? 'úkol' : processedCount < 5 ? 'úkoly' : 'úkolů'}.
        </p>
        <Button onClick={() => router.push('/accountant/tasks')}>
          Zpět na úkoly
        </Button>
      </div>
    )
  }

  if (!currentTask) return null

  const progressPercent = totalTasks > 0 ? (processedCount / totalTasks) * 100 : 0

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.push('/accountant/tasks')}>
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
            {currentTask.company_name && (
              <span className="text-xs text-muted-foreground">{currentTask.company_name}</span>
            )}
          </div>
          <CardTitle className="text-xl">{currentTask.title}</CardTitle>
        </CardHeader>
        {currentTask.description && (
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground">{currentTask.description}</p>
          </CardContent>
        )}
      </Card>

      {/* Steps */}
      {step === 'actionable' && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-center">Je to actionable? Můžeš s tím něco udělat?</h3>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => handleActionable('yes')} className="p-4 rounded-lg border-2 border-green-200 hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all text-center">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <span className="font-medium">Ano</span>
            </button>
            <button onClick={() => handleActionable('reference')} className="p-4 rounded-lg border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-center">
              <BookOpen className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <span className="font-medium">Reference</span>
            </button>
            <button onClick={() => handleActionable('someday')} className="p-4 rounded-lg border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all text-center">
              <Clock className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <span className="font-medium">Někdy/Možná</span>
            </button>
            <button onClick={() => handleActionable('delete')} className="p-4 rounded-lg border-2 border-red-200 hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-center">
              <Trash2 className="h-8 w-8 mx-auto mb-2 text-red-600" />
              <span className="font-medium">Smazat</span>
            </button>
          </div>
        </div>
      )}

      {step === 'two_minute' && !timerActive && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-center">Zabere to méně než 2 minuty?</h3>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => handleTwoMinute(true)} className="p-4 rounded-lg border-2 border-green-200 hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all text-center">
              <Zap className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <span className="font-medium">Ano – udělám hned</span>
            </button>
            <button onClick={() => handleTwoMinute(false)} className="p-4 rounded-lg border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-center">
              <Clock className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <span className="font-medium">Ne – zabere to víc</span>
            </button>
          </div>
        </div>
      )}

      {step === 'two_minute' && timerActive && (
        <div className="space-y-4 text-center">
          <h3 className="text-lg font-semibold">Udělej to HNED!</h3>
          <div className="text-6xl font-mono font-bold text-purple-600">
            {Math.floor(timerSeconds / 60)}:{String(timerSeconds % 60).padStart(2, '0')}
          </div>
          <Progress value={((120 - timerSeconds) / 120) * 100} className="h-3" />
          <div className="flex gap-3 justify-center">
            <Button onClick={handleTimerComplete} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="h-4 w-4 mr-1" /> Hotovo!
            </Button>
            <Button variant="outline" onClick={() => { setTimerActive(false); setStep('is_project') }}>
              Přeskočit
            </Button>
          </div>
        </div>
      )}

      {step === 'is_project' && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-center">Je to projekt (více kroků)?</h3>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => handleIsProject(true)} className="p-4 rounded-lg border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all text-center">
              <FolderKanban className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <span className="font-medium">Ano – vytvořit projekt</span>
            </button>
            <button onClick={() => handleIsProject(false)} className="p-4 rounded-lg border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-center">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <span className="font-medium">Ne – jeden úkol</span>
            </button>
          </div>
        </div>
      )}

      {step === 'delegate' && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-center">Můžeš to delegovat?</h3>
          {!assignedTo ? (
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => handleDelegate(false)} className="p-4 rounded-lg border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-center">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <span className="font-medium">Ne, udělám sám</span>
              </button>
              <button onClick={() => setAssignedTo('selecting')} className="p-4 rounded-lg border-2 border-orange-200 hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all text-center">
                <Users className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                <span className="font-medium">Ano – vybrat komu</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">Vyber komu delegovat:</p>
              <div className="grid gap-2">
                {users.map(user => (
                  <button
                    key={user.id}
                    onClick={() => { setAssignedTo(user.id); setStep('deadline') }}
                    className="p-3 rounded-lg border hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all text-left"
                  >
                    {user.full_name}
                  </button>
                ))}
              </div>
              <Button variant="ghost" onClick={() => setAssignedTo(null)}>Zpět</Button>
            </div>
          )}
        </div>
      )}

      {step === 'deadline' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-center">Kdy to má být hotové?</h3>
          <div className="max-w-xs mx-auto space-y-3">
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="text-center"
            />
            <Button onClick={handleDeadline} className="w-full">
              {dueDate ? 'Pokračovat' : 'Bez deadlinu'}
            </Button>
          </div>
        </div>
      )}

      {step === 'scoring' && (
        <ScoringWizard
          onComplete={handleScoringComplete}
          onCancel={() => setStep('deadline')}
        />
      )}
    </div>
  )
}
