'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckCircle2, Clock, AlertTriangle, Building2, Calendar } from 'lucide-react'
import { mockTasks } from '@/lib/mock-data'

export default function TasksPage() {
  const [tasks] = useState(mockTasks)

  // Sort function by deadline (overdue first, then by due date)
  const sortByDeadline = (a: typeof tasks[0], b: typeof tasks[0]) => {
    const dateA = new Date(a.due_date)
    const dateB = new Date(b.due_date)
    const now = new Date()

    const isOverdueA = dateA < now
    const isOverdueB = dateB < now

    // Overdue tasks first
    if (isOverdueA && !isOverdueB) return -1
    if (!isOverdueA && isOverdueB) return 1

    // Within same category (both overdue or both not), sort by date (soonest/most overdue first)
    return dateA.getTime() - dateB.getTime()
  }

  const pendingTasks = tasks.filter(t => t.status === 'pending').sort(sortByDeadline)
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').sort(sortByDeadline)
  const completedTasks = tasks.filter(t => t.status === 'completed').sort(sortByDeadline)

  const priorityColors = {
    high: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
    medium: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
    low: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  }

  const priorityLabels = {
    high: 'Vysoká',
    medium: 'Střední',
    low: 'Nízká',
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const isDueSoon = (dueDate: string) => {
    const due = new Date(dueDate)
    const now = new Date()
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays <= 3 && diffDays >= 0
  }

  const isOverdue = (dueDate: string) => {
    const due = new Date(dueDate)
    const now = new Date()
    return due < now
  }

  const TaskCard = ({ task }: { task: typeof tasks[0] }) => {
    const colors = priorityColors[task.priority]
    const dueSoon = isDueSoon(task.due_date)
    const overdue = isOverdue(task.due_date)

    return (
      <Card className={`hover:shadow-lg transition-shadow ${dueSoon || overdue ? 'border-2 ' + colors.border : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg mb-2">{task.title}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Building2 className="h-4 w-4" />
                <span>{task.company_name}</span>
              </div>
            </div>
            <Badge className={`${colors.bg} ${colors.text}`}>
              {priorityLabels[task.priority]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-700">{task.description}</p>

          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className={overdue ? 'text-red-600 font-semibold' : dueSoon ? 'text-orange-600 font-semibold' : 'text-gray-600'}>
              Termín: {formatDate(task.due_date)}
              {overdue && ' (po termínu!)'}
              {dueSoon && !overdue && ' (brzy!)'}
            </span>
          </div>

          <div className="flex gap-2 pt-2">
            {task.status === 'pending' && (
              <>
                <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" variant="default">
                  Začít pracovat
                </Button>
                <Button size="sm" variant="outline" className="text-orange-600 border-orange-300 hover:bg-orange-50 hover:text-orange-700 font-medium">
                  Urgovat klienta
                </Button>
              </>
            )}
            {task.status === 'in_progress' && (
              <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Označit jako hotovo
              </Button>
            )}
            {task.status === 'completed' && (
              <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
                <CheckCircle2 className="h-4 w-4" />
                Dokončeno
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Úkoly</h1>
        <p className="mt-2 text-gray-600">
          Přehled všech úkolů a připomínek ({pendingTasks.length} čekajících)
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Čekající</p>
                <p className="text-2xl font-bold text-gray-900">{pendingTasks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Rozpracované</p>
                <p className="text-2xl font-bold text-gray-900">{inProgressTasks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Dokončené</p>
                <p className="text-2xl font-bold text-gray-900">{completedTasks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Tabs */}
      <Tabs defaultValue="pending">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="pending">
            Čekající ({pendingTasks.length})
          </TabsTrigger>
          <TabsTrigger value="in_progress">
            Rozpracované ({inProgressTasks.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Dokončené ({completedTasks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4 mt-6">
          {pendingTasks.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Clock className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Žádné čekající úkoly</h3>
                <p className="text-gray-600">Skvělá práce! Máte hotovo.</p>
              </CardContent>
            </Card>
          ) : (
            pendingTasks.map(task => <TaskCard key={task.id} task={task} />)
          )}
        </TabsContent>

        <TabsContent value="in_progress" className="space-y-4 mt-6">
          {inProgressTasks.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertTriangle className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Žádné rozpracované úkoly</h3>
                <p className="text-gray-600">Začněte pracovat na čekajících úkolech</p>
              </CardContent>
            </Card>
          ) : (
            inProgressTasks.map(task => <TaskCard key={task.id} task={task} />)
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4 mt-6">
          {completedTasks.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Žádné dokončené úkoly</h3>
                <p className="text-gray-600">Dokončené úkoly se zobrazí zde</p>
              </CardContent>
            </Card>
          ) : (
            completedTasks.map(task => <TaskCard key={task.id} task={task} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
