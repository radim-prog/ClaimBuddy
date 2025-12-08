'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  Calendar,
  Zap,
  Users,
  FolderKanban,
  Lightbulb,
  Plus,
  Search,
  Filter,
  Mail,
  Phone,
  Monitor,
  MapPin,
  Coffee,
  Flame,
  Battery,
  BatteryMedium,
  BatteryLow,
  TrendingUp,
  PlayCircle,
  LayoutGrid,
  List,
  Columns3,
} from 'lucide-react'
import { mockTasks, Task, TaskPriority, GTDContext, EnergyLevel } from '@/lib/mock-data'
import Link from 'next/link'

type GTDCategory = 'all' | 'quick' | 'urgent' | 'waiting' | 'next' | 'projects' | 'someday'
type SortBy = 'deadline' | 'priority' | 'created' | 'client'
type ViewMode = 'cards' | 'list' | 'kanban'

export default function TasksPage() {
  const [tasks] = useState<Task[]>(mockTasks)
  const [activeCategory, setActiveCategory] = useState<GTDCategory>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('cards')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPriority, setFilterPriority] = useState<TaskPriority | 'all'>('all')
  const [filterContext, setFilterContext] = useState<GTDContext | 'all'>('all')
  const [filterEnergy, setFilterEnergy] = useState<EnergyLevel | 'all'>('all')
  const [sortBy, setSortBy] = useState<SortBy>('deadline')

  // Helper functions
  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date()
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

    if (days < 0) return `Po termínu (${Math.abs(days)} dní)${time}`
    if (days === 0) return `Dnes${time}`
    if (days === 1) return `Zítra${time}`
    if (days <= 7) return `Za ${days} dní${time}`
    return new Date(dueDate).toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric' }) + time
  }

  // Filter tasks by GTD category
  const filterByCategory = (tasks: Task[]): Task[] => {
    switch (activeCategory) {
      case 'quick':
        return tasks.filter(t => t.gtd_is_quick_action && t.status !== 'completed')
      case 'urgent':
        return tasks.filter(t =>
          (isOverdue(t.due_date) || isUrgent(t.due_date)) &&
          t.status !== 'completed' &&
          t.status !== 'someday_maybe'
        )
      case 'waiting':
        return tasks.filter(t => t.status === 'waiting_for')
      case 'next':
        return tasks.filter(t =>
          (t.status === 'accepted' || t.status === 'pending') &&
          !t.is_project &&
          !t.gtd_is_quick_action &&
          !isOverdue(t.due_date) &&
          !isUrgent(t.due_date)
        )
      case 'projects':
        return tasks.filter(t => t.is_project && t.status !== 'completed')
      case 'someday':
        return tasks.filter(t => t.status === 'someday_maybe')
      default:
        return tasks.filter(t => t.status !== 'completed')
    }
  }

  // Apply filters and sorting
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = filterByCategory(tasks)

    // Search
    if (searchQuery) {
      filtered = filtered.filter(t =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.company_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Priority filter
    if (filterPriority !== 'all') {
      filtered = filtered.filter(t => t.priority === filterPriority)
    }

    // Context filter
    if (filterContext !== 'all') {
      filtered = filtered.filter(t => t.gtd_context?.includes(filterContext))
    }

    // Energy filter
    if (filterEnergy !== 'all') {
      filtered = filtered.filter(t => t.gtd_energy_level === filterEnergy)
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'deadline':
          const dateA = new Date(a.due_date)
          const dateB = new Date(b.due_date)
          const isOverdueA = dateA < new Date()
          const isOverdueB = dateB < new Date()
          if (isOverdueA && !isOverdueB) return -1
          if (!isOverdueA && isOverdueB) return 1
          return dateA.getTime() - dateB.getTime()
        case 'priority':
          const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
          return priorityOrder[a.priority] - priorityOrder[b.priority]
        case 'created':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'client':
          return a.company_name.localeCompare(b.company_name, 'cs')
        default:
          return 0
      }
    })

    return filtered
  }, [tasks, activeCategory, searchQuery, filterPriority, filterContext, filterEnergy, sortBy])

  // Stats calculation
  const stats = useMemo(() => {
    const allActive = tasks.filter(t => t.status !== 'completed' && t.status !== 'someday_maybe')
    const urgent = tasks.filter(t =>
      (isOverdue(t.due_date) || isUrgent(t.due_date)) &&
      t.status !== 'completed'
    )
    const waiting = tasks.filter(t => t.status === 'waiting_for')
    const completedToday = tasks.filter(t =>
      t.completed_at &&
      new Date(t.completed_at).toDateString() === new Date().toDateString()
    )

    return {
      total: allActive.length,
      urgent: urgent.length,
      waiting: waiting.length,
      completedToday: completedToday.length,
    }
  }, [tasks])

  // Priority colors
  const priorityConfig = {
    critical: {
      bg: 'bg-red-100',
      text: 'text-red-700',
      border: 'border-red-300',
      label: 'Kritická',
      icon: Flame
    },
    high: {
      bg: 'bg-orange-100',
      text: 'text-orange-700',
      border: 'border-orange-300',
      label: 'Vysoká',
      icon: AlertTriangle
    },
    medium: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-700',
      border: 'border-yellow-300',
      label: 'Střední',
      icon: TrendingUp
    },
    low: {
      bg: 'bg-green-100',
      text: 'text-green-700',
      border: 'border-green-300',
      label: 'Nízká',
      icon: Coffee
    },
  }

  // Context icons
  const contextIcons: Record<GTDContext, any> = {
    '@email': Mail,
    '@telefon': Phone,
    '@pocitac': Monitor,
    '@kancelar': Building2,
    '@meeting': Users,
    '@anywhere': MapPin,
  }

  // Energy icons
  const energyIcons = {
    high: Battery,
    medium: BatteryMedium,
    low: BatteryLow,
  }

  // GTD Categories config
  const categoryConfig = {
    all: { label: 'Vše', icon: FolderKanban, color: 'text-gray-700' },
    quick: { label: 'Rychlé akce', icon: Zap, color: 'text-purple-700' },
    urgent: { label: 'Urgentní', icon: Flame, color: 'text-red-700' },
    waiting: { label: 'Waiting For', icon: Clock, color: 'text-blue-700' },
    next: { label: 'Next Actions', icon: PlayCircle, color: 'text-green-700' },
    projects: { label: 'Projekty', icon: FolderKanban, color: 'text-indigo-700' },
    someday: { label: 'Someday/Maybe', icon: Lightbulb, color: 'text-gray-500' },
  }

  const TaskCard = ({ task }: { task: Task }) => {
    const priorityStyle = priorityConfig[task.priority]
    const overdue = isOverdue(task.due_date)
    const urgent = isUrgent(task.due_date)
    const PriorityIcon = priorityStyle.icon

    return (
      <Card className={`hover:shadow-lg transition-shadow ${
        overdue || urgent ? `border-2 ${priorityStyle.border}` : ''
      }`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                {task.is_project && (
                  <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-300">
                    <FolderKanban className="h-3 w-3 mr-1" />
                    Projekt
                  </Badge>
                )}
                {task.gtd_is_quick_action && (
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
                    <Zap className="h-3 w-3 mr-1" />
                    &lt; 2 min
                  </Badge>
                )}
              </div>
              <CardTitle className="text-lg mb-2 line-clamp-2">{task.title}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Building2 className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{task.company_name}</span>
              </div>
            </div>
            <Badge className={`${priorityStyle.bg} ${priorityStyle.text} flex items-center gap-1 flex-shrink-0`}>
              <PriorityIcon className="h-3 w-3" />
              {priorityStyle.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-700 line-clamp-2">{task.description}</p>

          {/* Waiting for info */}
          {task.is_waiting_for && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-blue-900 mb-1">Čeká na:</p>
              <p className="text-xs text-blue-700">
                {task.waiting_for_who} - {task.waiting_for_what}
              </p>
            </div>
          )}

          {/* Progress bar for projects */}
          {task.is_project && task.progress_percentage !== undefined && (
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-600">Pokrok</span>
                <span className="font-semibold text-indigo-600">
                  {task.progress_percentage}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all"
                  style={{ width: `${task.progress_percentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Deadline */}
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
            <span className={
              overdue ? 'text-red-600 font-semibold' :
              urgent ? 'text-orange-600 font-semibold' :
              'text-gray-600'
            }>
              {getDeadlineText(task.due_date, task.due_time)}
            </span>
          </div>

          {/* Context & Energy */}
          <div className="flex items-center gap-2 flex-wrap">
            {task.gtd_context?.map((ctx) => {
              const ContextIcon = contextIcons[ctx]
              return (
                <Badge key={ctx} variant="outline" className="text-xs">
                  <ContextIcon className="h-3 w-3 mr-1" />
                  {ctx}
                </Badge>
              )
            })}
            {task.gtd_energy_level && (
              <Badge variant="outline" className="text-xs">
                {energyIcons[task.gtd_energy_level] &&
                  (() => {
                    const EnergyIcon = energyIcons[task.gtd_energy_level]
                    return <EnergyIcon className="h-3 w-3 mr-1" />
                  })()
                }
                {task.gtd_energy_level === 'high' && 'Vysoká energie'}
                {task.gtd_energy_level === 'medium' && 'Střední energie'}
                {task.gtd_energy_level === 'low' && 'Nízká energie'}
              </Badge>
            )}
          </div>

          {/* Time tracking */}
          {task.estimated_minutes && (
            <div className="text-xs text-gray-600 flex items-center gap-2">
              <Clock className="h-3 w-3" />
              Odhadovaný čas: {task.estimated_minutes} min
              {task.actual_minutes && ` | Skutečný: ${task.actual_minutes} min`}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Link href={`/accountant/tasks/${task.id}`} className="flex-1">
              <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white" variant="default">
                Detail
              </Button>
            </Link>
            {task.status !== 'in_progress' && task.status !== 'waiting_for' && (
              <Button size="sm" variant="outline" className="text-green-600 border-green-300 hover:bg-green-50">
                <CheckCircle2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Správa úkolů</h1>
            <p className="mt-2 text-gray-600">
              GTD metodika pro efektivní správu práce
            </p>
          </div>
          <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            <Plus className="mr-2 h-5 w-5" />
            Nový úkol
          </Button>
        </div>

        {/* GTD Info Box - MOVED TO TOP */}
        <Card className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">GTD Metodika</h4>
                <p className="text-sm text-gray-700 mb-2">
                  Getting Things Done (GTD) vám pomáhá efektivně řídit úkoly podle kontextu a energie.
                </p>
                <ul className="text-xs text-gray-600 space-y-1 ml-4 list-disc">
                  <li><strong>Rychlé akce:</strong> Úkoly kratší než 2 minuty - udělejte okamžitě</li>
                  <li><strong>Urgentní:</strong> Deadline dnes nebo zítra - prioritizujte</li>
                  <li><strong>Waiting For:</strong> Čeká na někoho jiného - sledujte</li>
                  <li><strong>Next Actions:</strong> Připravené k práci - začněte podle kontextu</li>
                  <li><strong>Projekty:</strong> Dlouhodobé úkoly s více kroky</li>
                  <li><strong>Someday/Maybe:</strong> Nápady na budoucnost - revize později</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FolderKanban className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Celkem úkolů</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-100 rounded-lg">
                  <Flame className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Urgentní</p>
                  <p className="text-2xl font-bold text-red-600">{stats.urgent}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Čekající</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.waiting}</p>
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
                  <p className="text-sm text-gray-600">Dokončeno dnes</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completedToday}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <Input
                placeholder="Hledat úkoly podle názvu, popisu nebo klienta..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Select value={filterPriority} onValueChange={(v) => setFilterPriority(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Priorita" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Všechny priority</SelectItem>
                  <SelectItem value="critical">Kritická</SelectItem>
                  <SelectItem value="high">Vysoká</SelectItem>
                  <SelectItem value="medium">Střední</SelectItem>
                  <SelectItem value="low">Nízká</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterContext} onValueChange={(v) => setFilterContext(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Kontext" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Všechny kontexty</SelectItem>
                  <SelectItem value="@email">@email</SelectItem>
                  <SelectItem value="@telefon">@telefon</SelectItem>
                  <SelectItem value="@pocitac">@počítač</SelectItem>
                  <SelectItem value="@kancelar">@kancelář</SelectItem>
                  <SelectItem value="@meeting">@meeting</SelectItem>
                  <SelectItem value="@anywhere">@anywhere</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterEnergy} onValueChange={(v) => setFilterEnergy(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Energie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Všechny úrovně</SelectItem>
                  <SelectItem value="high">Vysoká energie</SelectItem>
                  <SelectItem value="medium">Střední energie</SelectItem>
                  <SelectItem value="low">Nízká energie</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
                <SelectTrigger>
                  <SelectValue placeholder="Řadit podle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deadline">Deadline</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                  <SelectItem value="created">Datum vytvoření</SelectItem>
                  <SelectItem value="client">Jména klienta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Mode Selector */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
          <Button
            variant={viewMode === 'cards' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('cards')}
            className={viewMode === 'cards' ? 'bg-white shadow' : ''}
          >
            <LayoutGrid className="h-4 w-4 mr-2" />
            Karty
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? 'bg-white shadow' : ''}
          >
            <List className="h-4 w-4 mr-2" />
            Seznam
          </Button>
          <Button
            variant={viewMode === 'kanban' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('kanban')}
            className={viewMode === 'kanban' ? 'bg-white shadow' : ''}
          >
            <Columns3 className="h-4 w-4 mr-2" />
            Kanban
          </Button>
        </div>
        <div className="text-sm text-gray-600">
          Zobrazeno: <strong>{filteredAndSortedTasks.length}</strong> úkolů
        </div>
      </div>

      {/* GTD Category Tabs */}
      <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as GTDCategory)}>
        <TabsList className="grid w-full grid-cols-7 mb-6">
          {Object.entries(categoryConfig).map(([key, config]) => {
            const Icon = config.icon
            const count = filterByCategory(tasks).length
            return (
              <TabsTrigger key={key} value={key} className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${config.color}`} />
                <span className="hidden lg:inline">{config.label}</span>
                <span className="lg:hidden">{config.label.split(' ')[0]}</span>
                <Badge variant="secondary" className="ml-1">
                  {count}
                </Badge>
              </TabsTrigger>
            )
          })}
        </TabsList>

        {/* Task Lists */}
        {Object.keys(categoryConfig).map((category) => (
          <TabsContent key={category} value={category} className="space-y-4">
            {filteredAndSortedTasks.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FolderKanban className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Žádné úkoly v této kategorii
                  </h3>
                  <p className="text-gray-600">
                    {searchQuery || filterPriority !== 'all' || filterContext !== 'all' || filterEnergy !== 'all'
                      ? 'Zkuste změnit filtry'
                      : 'V této kategorii zatím nejsou žádné úkoly'}
                  </p>
                </CardContent>
              </Card>
            ) : viewMode === 'cards' ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredAndSortedTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            ) : viewMode === 'list' ? (
              <div className="space-y-2">
                {filteredAndSortedTasks.map((task) => {
                  const priorityStyle = priorityConfig[task.priority]
                  const overdue = isOverdue(task.due_date)
                  const urgent = isUrgent(task.due_date)
                  const PriorityIcon = priorityStyle.icon

                  return (
                    <Link key={task.id} href={`/accountant/tasks/${task.id}`}>
                      <Card className={`hover:shadow-md transition-all cursor-pointer ${
                        overdue || urgent ? `border-l-4 ${priorityStyle.border}` : ''
                      }`}>
                        <CardContent className="py-3 px-4">
                          <div className="flex items-center gap-4">
                            {/* Priority Icon */}
                            <div className={`p-2 rounded-lg ${priorityStyle.bg} flex-shrink-0`}>
                              <PriorityIcon className={`h-4 w-4 ${priorityStyle.text}`} />
                            </div>

                            {/* Task Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-gray-900 truncate">{task.title}</h4>
                                {task.is_project && (
                                  <Badge variant="outline" className="bg-indigo-50 text-indigo-700 text-xs">
                                    <FolderKanban className="h-3 w-3 mr-1" />
                                    Projekt
                                  </Badge>
                                )}
                                {task.gtd_is_quick_action && (
                                  <Badge variant="outline" className="bg-purple-50 text-purple-700 text-xs">
                                    <Zap className="h-3 w-3 mr-1" />
                                    &lt; 2 min
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 truncate mt-1">{task.description}</p>
                            </div>

                            {/* Company */}
                            <div className="hidden md:flex items-center gap-2 text-sm text-gray-600 flex-shrink-0">
                              <Building2 className="h-4 w-4" />
                              <span className="truncate max-w-[150px]">{task.company_name}</span>
                            </div>

                            {/* Deadline */}
                            <div className="flex items-center gap-2 text-sm flex-shrink-0 min-w-[120px]">
                              <Calendar className="h-4 w-4 text-gray-500" />
                              <span className={
                                overdue ? 'text-red-600 font-semibold' :
                                urgent ? 'text-orange-600 font-semibold' :
                                'text-gray-600'
                              }>
                                {getDeadlineText(task.due_date, task.due_time)}
                              </span>
                            </div>

                            {/* Complete Button */}
                            {task.status !== 'in_progress' && task.status !== 'waiting_for' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 border-green-300 hover:bg-green-50 flex-shrink-0"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                }}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  )
                })}
              </div>
            ) : (
              // Kanban View
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {['accepted', 'in_progress', 'waiting_for', 'completed'].map((status) => (
                  <div key={status} className="bg-gray-100 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      {status === 'accepted' && '📋 K práci'}
                      {status === 'in_progress' && '⚡ Probíhá'}
                      {status === 'waiting_for' && '⏳ Čeká na'}
                      {status === 'completed' && '✅ Hotovo'}
                    </h3>
                    <div className="space-y-2">
                      {filteredAndSortedTasks
                        .filter((task) => task.status === status)
                        .map((task) => {
                          const priorityStyle = priorityConfig[task.priority]
                          const overdue = isOverdue(task.due_date)
                          const urgent = isUrgent(task.due_date)

                          return (
                            <Link key={task.id} href={`/accountant/tasks/${task.id}`}>
                              <Card className={`hover:shadow-md transition-all cursor-pointer ${
                                overdue || urgent ? `border-l-4 ${priorityStyle.border}` : ''
                              }`}>
                                <CardContent className="p-3">
                                  <div className="space-y-2">
                                    <div>
                                      <h4 className="font-semibold text-sm text-gray-900 line-clamp-2">
                                        {task.title}
                                      </h4>
                                      <p className="text-xs text-gray-600 mt-1">
                                        {task.company_name}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs">
                                      <Calendar className="h-3 w-3" />
                                      <span className={
                                        overdue ? 'text-red-600 font-semibold' :
                                        urgent ? 'text-orange-600 font-semibold' :
                                        'text-gray-600'
                                      }>
                                        {getDaysUntilDue(task.due_date) === 0 ? 'Dnes' :
                                         getDaysUntilDue(task.due_date) === 1 ? 'Zítra' :
                                         getDaysUntilDue(task.due_date) < 0 ? `Po termínu` :
                                         `${getDaysUntilDue(task.due_date)}d`}
                                      </span>
                                    </div>
                                    <Badge className={`${priorityStyle.bg} ${priorityStyle.text} text-xs w-full justify-center`}>
                                      {priorityStyle.label}
                                    </Badge>
                                  </div>
                                </CardContent>
                              </Card>
                            </Link>
                          )
                        })}
                      {filteredAndSortedTasks.filter((task) => task.status === status).length === 0 && (
                        <p className="text-xs text-gray-500 text-center py-4">Žádné úkoly</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

    </div>
  )
}
