'use client'

import { useState } from 'react'
import { Briefcase, Clock, CreditCard, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'
import { useAccountantUser } from '@/lib/contexts/accountant-user-context'

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

type PrepaidStatusCardProps = {
  project: PrepaidProject
  onStatusChange?: (id: string, status: string) => void
  onOverride?: (id: string, override: string | null, reason: string) => void
  showActions?: boolean
}

export function PrepaidStatusCard({ project, onStatusChange, onOverride, showActions = true }: PrepaidStatusCardProps) {
  const { userRole } = useAccountantUser()
  const isAdmin = userRole === 'admin'
  const [expanded, setExpanded] = useState(false)
  const [overrideReason, setOverrideReason] = useState('')

  const consumedPct = project.total_budget > 0
    ? Math.round((project.consumed_amount / project.total_budget) * 100)
    : 0

  const progressColor = consumedPct >= 100
    ? 'bg-red-500'
    : consumedPct >= 80
    ? 'bg-orange-500'
    : 'bg-green-500'

  const statusLabels: Record<string, { label: string; color: string }> = {
    draft: { label: 'Koncept', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
    sent: { label: 'Odesláno', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
    active: { label: 'Aktivní', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
    completed: { label: 'Dokončeno', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
    cancelled: { label: 'Zrušeno', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  }

  const paymentLabels: Record<string, { label: string; color: string }> = {
    pending: { label: 'Nezaplaceno', color: 'text-red-600 dark:text-red-400' },
    paid: { label: 'Zaplaceno', color: 'text-green-600 dark:text-green-400' },
    partial: { label: 'Částečně', color: 'text-orange-600 dark:text-orange-400' },
    waived: { label: 'Odpuštěno', color: 'text-gray-500 dark:text-gray-400' },
  }

  const st = statusLabels[project.status] || statusLabels.draft
  const pt = paymentLabels[project.payment_status] || paymentLabels.pending

  const formatHours = (h: number) => {
    const hrs = Math.floor(h)
    const mins = Math.round((h - hrs) * 60)
    if (hrs === 0) return `${mins}min`
    if (mins === 0) return `${hrs}h`
    return `${hrs}h ${mins}m`
  }

  return (
    <div className="bg-white dark:bg-gray-800 border rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Briefcase className="h-4 w-4 text-purple-500 shrink-0" />
            <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">{project.title}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
            {project.billing_override && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                {project.billing_override === 'free' ? 'Zdarma' : 'V tarifu'}
              </span>
            )}
          </div>
          {project.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">{project.description}</p>
          )}
        </div>
        <button onClick={() => setExpanded(!expanded)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-gray-500 dark:text-gray-400">
            Spotřebováno: {formatHours(project.consumed_hours)} / {formatHours(project.estimated_hours)}
          </span>
          <span className={`font-medium ${consumedPct >= 100 ? 'text-red-600 dark:text-red-400' : consumedPct >= 80 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>
            {consumedPct}%
          </span>
        </div>
        <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${progressColor}`}
            style={{ width: `${Math.min(consumedPct, 100)}%` }}
          />
        </div>
      </div>

      {/* Summary row — financial details only for admin */}
      {isAdmin && (
        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {project.consumed_amount.toLocaleString('cs-CZ')} / {project.total_budget.toLocaleString('cs-CZ')} Kč
          </span>
          <span className={`flex items-center gap-1 ${pt.color}`}>
            <CreditCard className="h-3 w-3" />
            {pt.label}
          </span>
          {consumedPct >= 80 && consumedPct < 100 && (
            <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
              <AlertTriangle className="h-3 w-3" />
              Blíží se limit
            </span>
          )}
          {consumedPct >= 100 && (
            <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-3 w-3" />
              Rozpočet vyčerpán
            </span>
          )}
        </div>
      )}

      {/* Action buttons — admin only */}
      {showActions && isAdmin && (
        <div className="flex flex-wrap gap-2">
          {project.status === 'draft' && onStatusChange && (
            <>
              <button
                onClick={() => onStatusChange(project.id, 'sent')}
                className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Odeslat klientovi
              </button>
              <button
                onClick={() => onStatusChange(project.id, 'active')}
                className="px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Aktivovat
              </button>
            </>
          )}
          {project.status === 'sent' && onStatusChange && (
            <button
              onClick={() => onStatusChange(project.id, 'active')}
              className="px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              Aktivovat (zaplaceno)
            </button>
          )}
          {project.status === 'active' && onStatusChange && (
            <button
              onClick={() => onStatusChange(project.id, 'completed')}
              className="px-3 py-1.5 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              Dokončit
            </button>
          )}
        </div>
      )}

      {/* Expanded details — admin only */}
      {expanded && isAdmin && (
        <div className="border-t dark:border-gray-700 pt-3 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Sazba:</span>
              <span className="ml-1 text-gray-900 dark:text-white">{project.hourly_rate.toLocaleString('cs-CZ')} Kč/h</span>
            </div>
            {project.travel_cost > 0 && (
              <div>
                <span className="text-gray-500 dark:text-gray-400">Cestovné:</span>
                <span className="ml-1 text-gray-900 dark:text-white">{project.travel_cost.toLocaleString('cs-CZ')} Kč</span>
              </div>
            )}
            {project.other_costs > 0 && (
              <div>
                <span className="text-gray-500 dark:text-gray-400">Ostatní:</span>
                <span className="ml-1 text-gray-900 dark:text-white">{project.other_costs.toLocaleString('cs-CZ')} Kč</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
