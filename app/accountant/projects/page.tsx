'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  FolderKanban,
  Calendar,
  Search,
  Plus,
  Filter,
  X,
  CheckCircle,
  Clock,
  PauseCircle,
  AlertCircle,
} from 'lucide-react'

type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'review' | 'completed' | 'cancelled'

type Project = {
  id: string
  title: string
  description?: string
  outcome?: string
  status: ProjectStatus
  company_id?: string
  owner_id?: string
  due_date?: string
  estimated_hours?: number
  actual_hours?: number
  progress_percentage: number
  tags?: string[]
  created_at: string
  updated_at: string
  completed_at?: string
}

// Status configuration - simplified
const STATUS_CONFIG: Record<ProjectStatus, { label: string; borderColor: string; textColor: string; bgColor: string }> = {
  planning: { label: 'Plánování', borderColor: 'border-l-blue-500', textColor: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-50' },
  active: { label: 'Aktivní', borderColor: 'border-l-green-500', textColor: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-50 dark:bg-green-900/20' },
  on_hold: { label: 'Pozastaveno', borderColor: 'border-l-yellow-500', textColor: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-50 dark:bg-yellow-900/20' },
  review: { label: 'K review', borderColor: 'border-l-purple-500', textColor: 'text-purple-600', bgColor: 'bg-purple-50' },
  completed: { label: 'Dokončeno', borderColor: 'border-l-gray-400', textColor: 'text-gray-500 dark:text-gray-400', bgColor: 'bg-gray-50 dark:bg-gray-800/50' },
  cancelled: { label: 'Zrušeno', borderColor: 'border-l-red-500', textColor: 'text-red-500', bgColor: 'bg-red-50 dark:bg-red-900/20' },
}

function getDaysUntilDeadline(dateString: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const deadline = new Date(dateString)
  deadline.setHours(0, 0, 0, 0)
  return Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function formatDeadline(dateString: string): string {
  const days = getDaysUntilDeadline(dateString)
  if (days < 0) return `${Math.abs(days)} dní po termínu`
  if (days === 0) return 'Dnes'
  if (days === 1) return 'Zítra'
  if (days <= 7) return `Za ${days} dní`
  return new Date(dateString).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short' })
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filterStatus, setFilterStatus] = useState<ProjectStatus | 'all'>('all')

  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then(data => setProjects(data.projects || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Filter projects
  const filteredProjects = useMemo(() => {
    let filtered = [...projects]

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(query)
      )
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(p => p.status === filterStatus)
    }

    // Sort: active first, then by deadline
    filtered.sort((a, b) => {
      const statusOrder: Record<ProjectStatus, number> = {
        active: 0,
        review: 1,
        on_hold: 2,
        planning: 3,
        completed: 4,
        cancelled: 5,
      }
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status]
      }
      const aDate = a.due_date ? new Date(a.due_date).getTime() : Infinity
      const bDate = b.due_date ? new Date(b.due_date).getTime() : Infinity
      return aDate - bDate
    })

    return filtered
  }, [projects, searchQuery, filterStatus])

  const activeFiltersCount = filterStatus !== 'all' ? 1 : 0

  const clearFilters = () => {
    setFilterStatus('all')
  }

  // Count by status for quick info
  const activeCount = projects.filter(p => p.status === 'active').length
  const reviewCount = projects.filter(p => p.status === 'review').length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Projekty</h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              {projects.length} projektů • {activeCount} aktivních
              {reviewCount > 0 && ` • ${reviewCount} k review`}
            </p>
          </div>
          <Button asChild className="bg-purple-600 hover:bg-purple-700">
            <Link href="/accountant/projects/new">
              <Plus className="mr-2 h-4 w-4" />
              Nový projekt
            </Link>
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Search className="h-5 w-5 text-gray-400" />
              <Input
                placeholder="Hledat podle názvu projektu nebo klienta..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
            </div>
            <Button
              variant={showFilters ? 'default' : 'outline'}
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? 'bg-purple-600 hover:bg-purple-700' : ''}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtry
              {activeFiltersCount > 0 && (
                <Badge className="ml-2 bg-white dark:bg-gray-800 text-purple-600">{activeFiltersCount}</Badge>
              )}
            </Button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t dark:border-gray-700">
              <div className="flex flex-wrap gap-4">
                {/* Status */}
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Stav</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as ProjectStatus | 'all')}
                    className="px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="all">Všechny stavy</option>
                    <option value="active">Aktivní</option>
                    <option value="planning">Plánování</option>
                    <option value="on_hold">Pozastaveno</option>
                    <option value="review">K review</option>
                    <option value="completed">Dokončeno</option>
                  </select>
                </div>

                {/* Clear */}
                {activeFiltersCount > 0 && (
                  <div className="flex items-end">
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      <X className="h-4 w-4 mr-1" />
                      Zrušit filtry
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results info */}
      {(searchQuery || activeFiltersCount > 0) && (
        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Zobrazeno {filteredProjects.length} z {projects.length} projektů
        </div>
      )}

      {/* Projects list */}
      <div className="space-y-3">
        {filteredProjects.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FolderKanban className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Žádné projekty</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchQuery || activeFiltersCount > 0
                  ? 'Nenalezeny žádné výsledky pro tyto filtry'
                  : 'Zatím nemáte žádné projekty'}
              </p>
              {activeFiltersCount > 0 && (
                <Button variant="outline" className="mt-4" onClick={clearFilters}>
                  Zrušit filtry
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredProjects.map((project) => {
            const config = STATUS_CONFIG[project.status]
            const daysUntil = project.due_date ? getDaysUntilDeadline(project.due_date) : null
            const isOverdue = daysUntil !== null && daysUntil < 0
            const isUrgent = daysUntil !== null && daysUntil >= 0 && daysUntil <= 3
            const progress = project.progress_percentage || 0

            return (
              <Link key={project.id} href={`/accountant/projects/${project.id}`}>
                <Card className={`hover:shadow-md transition-all cursor-pointer border-l-4 ${config.borderColor}`}>
                  <CardContent className="py-3 px-4">
                    <div className="grid grid-cols-12 gap-4 items-center">

                      {/* Project name */}
                      <div className="col-span-5 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {project.title}
                        </h3>
                        {project.outcome && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{project.outcome}</p>
                        )}
                      </div>

                      {/* Status */}
                      <div className="col-span-2 flex items-center gap-1.5">
                        <Badge className={`${config.bgColor} ${config.textColor} text-xs`}>
                          {config.label}
                        </Badge>
                      </div>

                      {/* Progress */}
                      <div className="col-span-2 text-sm">
                        <div className="flex items-center gap-2">
                          {progress === 100 ? (
                            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                          ) : (
                            <Clock className="h-4 w-4 text-gray-400" />
                          )}
                          <span className="text-gray-700 dark:text-gray-200">{progress}%</span>
                        </div>
                        {progress > 0 && progress < 100 && (
                          <div className="mt-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-purple-500 rounded-full"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Deadline */}
                      <div className="col-span-2 text-right">
                        {project.due_date ? (
                          <div className={`flex items-center justify-end gap-1 text-sm font-medium ${
                            isOverdue ? 'text-red-600 dark:text-red-400' : isUrgent ? 'text-orange-600 dark:text-orange-400' : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDeadline(project.due_date)}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Bez termínu</span>
                        )}
                      </div>

                      {/* Alert indicator */}
                      <div className="col-span-1 text-right">
                        {isOverdue && <AlertCircle className="h-5 w-5 text-red-500 inline" />}
                        {!isOverdue && isUrgent && <Clock className="h-5 w-5 text-orange-500 inline" />}
                        {project.status === 'on_hold' && <PauseCircle className="h-5 w-5 text-yellow-500 inline" />}
                      </div>

                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
