'use client'

import { Task, getEscalationLevel, URGENCY_CONFIG } from '@/lib/mock-data'
import { Badge } from '@/components/ui/badge'
import { Bell, AlertTriangle, ArrowUpCircle } from 'lucide-react'

interface UrgencyBadgeProps {
  task: Task
  showDetails?: boolean
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Zobrazuje badge s informacemi o urgenci/eskalaci úkolu
 */
export function UrgencyBadge({ task, showDetails = false, size = 'md' }: UrgencyBadgeProps) {
  const escalationLevel = getEscalationLevel(task)

  // Pokud není žádná urgence ani eskalace, nezobrazovat
  if (escalationLevel === 0 && !task.urgency_count) {
    return null
  }

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5',
  }

  const iconSize = {
    sm: 12,
    md: 14,
    lg: 16,
  }

  // Eskalováno na manažera
  if (escalationLevel === 3) {
    const tooltipText = `Eskalováno na manažera${task.escalation_reason ? `: ${task.escalation_reason}` : ''}`
    return (
      <Badge
        variant="destructive"
        className={`${sizeClasses[size]} bg-purple-600 hover:bg-purple-700 flex items-center gap-1 cursor-help`}
        title={tooltipText}
      >
        <ArrowUpCircle size={iconSize[size]} />
        {showDetails ? 'Eskalováno' : ''}
      </Badge>
    )
  }

  // Dosažen limit urgencí - připraveno k eskalaci
  if (escalationLevel === 2) {
    const tooltipText = `Urgováno ${task.urgency_count}× - doporučeno eskalovat na manažera`
    return (
      <Badge
        variant="destructive"
        className={`${sizeClasses[size]} bg-red-600 hover:bg-red-700 flex items-center gap-1 animate-pulse cursor-help`}
        title={tooltipText}
      >
        <AlertTriangle size={iconSize[size]} />
        {showDetails ? `${task.urgency_count}× urgováno` : task.urgency_count}
      </Badge>
    )
  }

  // Urgováno 1-2×
  if (escalationLevel === 1 || task.urgency_count) {
    const remainingUrgencies = URGENCY_CONFIG.MAX_URGENCIES_BEFORE_ESCALATION - (task.urgency_count || 0)
    const tooltipText = `Urgováno ${task.urgency_count}×, zbývá ${remainingUrgencies} do eskalace`
    return (
      <Badge
        variant="outline"
        className={`${sizeClasses[size]} border-amber-500 text-amber-600 bg-amber-50 flex items-center gap-1 cursor-help`}
        title={tooltipText}
      >
        <Bell size={iconSize[size]} />
        {showDetails ? `Urgováno ${task.urgency_count}×` : task.urgency_count}
      </Badge>
    )
  }

  return null
}

/**
 * Kompaktní verze pro seznam úkolů
 */
export function UrgencyIndicator({ task }: { task: Task }) {
  const escalationLevel = getEscalationLevel(task)

  if (escalationLevel === 0 && !task.urgency_count) {
    return null
  }

  if (escalationLevel === 3) {
    return <span title="Eskalováno na manažera" className="cursor-help">⬆️</span>
  }

  if (escalationLevel === 2) {
    return <span title={`Urgováno ${task.urgency_count}× - k eskalaci`} className="animate-pulse cursor-help">🔔</span>
  }

  if (task.urgency_count) {
    return <span title={`Urgováno ${task.urgency_count}×`} className="cursor-help">🔔</span>
  }

  return null
}
