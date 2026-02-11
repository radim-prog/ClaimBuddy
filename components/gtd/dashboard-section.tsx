'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Zap,
  ArrowRight,
  Clock,
  Inbox,
  FolderKanban,
  MapPin,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

type Task = {
  id: string
  title: string
  status: string
  company_name?: string
  due_date?: string
  gtd_is_quick_action?: boolean
  is_next_action?: boolean
  location_id?: string
  score_money?: number
  score_fire?: number
  score_time?: number
  score_distance?: number
  score_personal?: number
}

type Project = {
  id: string
  title: string
  status: string
  progress_percentage: number
  company_id?: string
}

type Location = {
  id: string
  name: string
  icon: string
}

type SectionKey = 'quickActions' | 'nextActions' | 'waitingFor' | 'inbox' | 'projects' | 'locations'

export function GtdDashboardSection() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [collapsed, setCollapsed] = useState<Record<SectionKey, boolean>>({
    quickActions: false,
    nextActions: false,
    waitingFor: false,
    inbox: false,
    projects: false,
    locations: false,
  })

  useEffect(() => {
    Promise.all([
      fetch('/api/tasks?page_size=200').then(r => r.json()),
      fetch('/api/projects?status=active').then(r => r.json()),
      fetch('/api/locations').then(r => r.json()),
    ]).then(([tasksData, projectsData, locationsData]) => {
      setTasks(tasksData.tasks || [])
      setProjects(projectsData.projects || [])
      setLocations(locationsData.locations || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const toggle = (key: SectionKey) => {
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }))
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        ))}
      </div>
    )
  }

  // Categorize tasks
  const quickActions = tasks.filter(t => t.gtd_is_quick_action && t.status !== 'completed' && t.status !== 'cancelled')
  const nextActions = tasks.filter(t => t.is_next_action && t.status !== 'completed' && t.status !== 'cancelled')
  const waitingFor = tasks.filter(t => t.status === 'waiting_for' || t.status === 'waiting_client')
  const inboxTasks = tasks.filter(t => t.status === 'pending')
  const activeProjects = projects.filter(p => p.status === 'active')

  // Count quick tasks per location
  const locationCounts: Record<string, number> = {}
  quickActions.forEach(t => {
    if (t.location_id) {
      locationCounts[t.location_id] = (locationCounts[t.location_id] || 0) + 1
    }
  })

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">GTD Overview</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Quick Actions */}
        <SectionCard
          title="Udělej teď"
          icon={<Zap className="h-5 w-5 text-yellow-600" />}
          count={quickActions.length}
          collapsed={collapsed.quickActions}
          onToggle={() => toggle('quickActions')}
          color="border-yellow-200 dark:border-yellow-800"
        >
          {quickActions.slice(0, 5).map(task => (
            <TaskItem key={task.id} task={task} />
          ))}
          {quickActions.length > 5 && (
            <Link href="/accountant/tasks?gtd_is_quick_action=true" className="text-xs text-purple-600 hover:underline">
              + {quickActions.length - 5} dalších
            </Link>
          )}
        </SectionCard>

        {/* Next Actions */}
        <SectionCard
          title="Příští akce"
          icon={<ArrowRight className="h-5 w-5 text-blue-600" />}
          count={nextActions.length}
          collapsed={collapsed.nextActions}
          onToggle={() => toggle('nextActions')}
          color="border-blue-200 dark:border-blue-800"
        >
          {nextActions.slice(0, 5).map(task => (
            <TaskItem key={task.id} task={task} />
          ))}
        </SectionCard>

        {/* Waiting For */}
        <SectionCard
          title="Čeká na"
          icon={<Clock className="h-5 w-5 text-orange-600" />}
          count={waitingFor.length}
          collapsed={collapsed.waitingFor}
          onToggle={() => toggle('waitingFor')}
          color="border-orange-200 dark:border-orange-800"
        >
          {waitingFor.slice(0, 5).map(task => (
            <TaskItem key={task.id} task={task} />
          ))}
        </SectionCard>

        {/* Inbox */}
        <SectionCard
          title="Inbox"
          icon={<Inbox className="h-5 w-5 text-purple-600" />}
          count={inboxTasks.length}
          collapsed={collapsed.inbox}
          onToggle={() => toggle('inbox')}
          color="border-purple-200 dark:border-purple-800"
        >
          {inboxTasks.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground">
                {inboxTasks.length} {inboxTasks.length === 1 ? 'úkol čeká' : 'úkolů čeká'} na zpracování
              </p>
              <Button asChild size="sm" className="w-full mt-2">
                <Link href="/accountant/tasks/clarify">Zpracovat Inbox</Link>
              </Button>
            </>
          ) : (
            <p className="text-sm text-green-600">Inbox je prázdný</p>
          )}
        </SectionCard>

        {/* Projects */}
        <SectionCard
          title="Projekty"
          icon={<FolderKanban className="h-5 w-5 text-indigo-600" />}
          count={activeProjects.length}
          collapsed={collapsed.projects}
          onToggle={() => toggle('projects')}
          color="border-indigo-200 dark:border-indigo-800"
        >
          {activeProjects.slice(0, 5).map(project => (
            <Link key={project.id} href={`/accountant/projects/${project.id}`} className="block py-1">
              <div className="flex items-center justify-between text-sm">
                <span className="truncate">{project.title}</span>
                <span className="text-xs text-muted-foreground ml-2">{project.progress_percentage}%</span>
              </div>
              <Progress value={project.progress_percentage} className="h-1.5 mt-1" />
            </Link>
          ))}
          {activeProjects.length === 0 && (
            <p className="text-sm text-muted-foreground">Žádné aktivní projekty</p>
          )}
        </SectionCard>

        {/* Locations */}
        <SectionCard
          title="Lokace"
          icon={<MapPin className="h-5 w-5 text-green-600" />}
          count={Object.values(locationCounts).reduce((a, b) => a + b, 0)}
          collapsed={collapsed.locations}
          onToggle={() => toggle('locations')}
          color="border-green-200 dark:border-green-800"
        >
          <div className="grid grid-cols-2 gap-2">
            {locations.map(loc => (
              <Link
                key={loc.id}
                href={`/accountant/tasks?location_id=${loc.id}`}
                className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
              >
                <span>{loc.name}</span>
                {(locationCounts[loc.id] || 0) > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {locationCounts[loc.id]}
                  </Badge>
                )}
              </Link>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  )
}

function SectionCard({
  title,
  icon,
  count,
  collapsed,
  onToggle,
  color,
  children,
}: {
  title: string
  icon: React.ReactNode
  count: number
  collapsed: boolean
  onToggle: () => void
  color: string
  children: React.ReactNode
}) {
  return (
    <Card className={`border ${color}`}>
      <CardHeader className="pb-2 cursor-pointer" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {count > 0 && (
              <Badge variant="secondary" className="text-xs">{count}</Badge>
            )}
          </div>
          {collapsed ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </CardHeader>
      {!collapsed && (
        <CardContent className="pt-0 space-y-2">
          {children}
        </CardContent>
      )}
    </Card>
  )
}

function TaskItem({ task }: { task: Task }) {
  const totalScore = (task.score_money || 0) + (task.score_fire || 0) + (task.score_time || 0) + (task.score_distance || 0) + (task.score_personal || 0)

  return (
    <Link
      href={`/accountant/tasks/${task.id}`}
      className="flex items-center justify-between py-1 text-sm hover:text-purple-600 transition-colors"
    >
      <span className="truncate">{task.title}</span>
      <div className="flex items-center gap-1 ml-2 flex-shrink-0">
        {task.company_name && (
          <span className="text-xs text-muted-foreground">{task.company_name}</span>
        )}
        {totalScore > 0 && (
          <Badge
            variant="outline"
            className={`text-xs ${
              totalScore >= 9 ? 'border-red-300 text-red-600' :
              totalScore >= 6 ? 'border-yellow-300 text-yellow-600' :
              'border-green-300 text-green-600'
            }`}
          >
            {totalScore}
          </Badge>
        )}
      </div>
    </Link>
  )
}
