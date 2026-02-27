'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { PrepaidCalculator } from './prepaid-calculator'
import { PrepaidStatusCard } from './prepaid-status-card'
import { toast } from 'sonner'

type PrepaidProject = {
  id: string
  title: string
  description?: string | null
  estimated_hours: number
  hourly_rate: number
  travel_cost: number
  other_costs: number
  total_budget: number
  consumed_hours: number
  consumed_amount: number
  payment_status: string
  paid_amount: number
  status: string
  billing_override?: string | null
  override_reason?: string | null
  created_at: string
}

type PrepaidProjectsSectionProps = {
  companyId: string
  companyName: string
  defaultHourlyRate?: number
  refreshTrigger?: number
}

export function PrepaidProjectsSection({ companyId, companyName, defaultHourlyRate, refreshTrigger }: PrepaidProjectsSectionProps) {
  const [projects, setProjects] = useState<PrepaidProject[]>([])
  const [loading, setLoading] = useState(true)
  const [showCalculator, setShowCalculator] = useState(false)

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch(`/api/prepaid-projects?company_id=${companyId}`)
      if (res.ok) {
        const data = await res.json()
        setProjects(data.projects || [])
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [companyId])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects, refreshTrigger])

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/prepaid-projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          ...(status === 'active' ? { payment_status: 'paid' } : {}),
        }),
      })

      if (!res.ok) throw new Error('Failed to update')

      toast.success('Status aktualizován')
      fetchProjects()
    } catch {
      toast.error('Chyba při aktualizaci')
    }
  }

  const handleOverride = async (id: string, override: string | null, reason: string) => {
    try {
      const res = await fetch(`/api/prepaid-projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billing_override: override,
          override_reason: reason || null,
        }),
      })

      if (!res.ok) throw new Error('Failed to update')

      toast.success('Override nastaven')
      fetchProjects()
    } catch {
      toast.error('Chyba při nastavení override')
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      </div>
    )
  }

  const activeProjects = projects.filter(p => !['cancelled', 'completed'].includes(p.status))
  const archivedProjects = projects.filter(p => ['cancelled', 'completed'].includes(p.status))

  return (
    <div className="space-y-4">
      {/* Active projects */}
      {activeProjects.length > 0 && (
        <div className="space-y-3">
          {activeProjects.map(project => (
            <PrepaidStatusCard
              key={project.id}
              project={project}
              onStatusChange={handleStatusChange}
              onOverride={handleOverride}
            />
          ))}
        </div>
      )}

      {activeProjects.length === 0 && !showCalculator && (
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
          Žádné aktivní předplacené projekty
        </p>
      )}

      {/* Calculator */}
      {showCalculator ? (
        <PrepaidCalculator
          companyId={companyId}
          companyName={companyName}
          defaultHourlyRate={defaultHourlyRate}
          onCreated={() => {
            setShowCalculator(false)
            fetchProjects()
            toast.success('Kalkulace vytvořena')
          }}
          onCancel={() => setShowCalculator(false)}
        />
      ) : (
        <button
          onClick={() => setShowCalculator(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/10 rounded-xl border border-dashed border-purple-300 dark:border-purple-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nový prepaid projekt
        </button>
      )}

      {/* Archived */}
      {archivedProjects.length > 0 && (
        <details className="text-sm">
          <summary className="text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
            Archivované ({archivedProjects.length})
          </summary>
          <div className="space-y-3 mt-3">
            {archivedProjects.map(project => (
              <PrepaidStatusCard
                key={project.id}
                project={project}
                showActions={false}
              />
            ))}
          </div>
        </details>
      )}
    </div>
  )
}
