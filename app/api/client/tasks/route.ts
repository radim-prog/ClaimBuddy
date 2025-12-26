import { NextRequest, NextResponse } from 'next/server'
import { mockTasks, Task } from '@/lib/mock-data'

// Calculate R-Tasks total score
const calculateTaskScore = (task: Task): number => {
  return (task.score_money || 0) +
         (task.score_fire || 0) +
         (task.score_time || 0) +
         (task.score_distance || 0) +
         (task.score_personal || 0)
}

// Derive priority level from R-Tasks score
type ScorePriority = 'high' | 'medium' | 'low'
const getScorePriority = (task: Task): ScorePriority => {
  const score = calculateTaskScore(task)
  if (score >= 9) return 'high'
  if (score >= 6) return 'medium'
  return 'low'
}

// GET /api/client/tasks - Get tasks for client's companies (sanitized view)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const companyId = searchParams.get('companyId')

  // TODO: Get actual client's companies from session
  // For now, we'll filter by companyId if provided

  let tasks = mockTasks

  if (companyId) {
    tasks = tasks.filter(t => t.company_id === companyId)
  }

  // Sanitize tasks for client view - only show relevant info
  const clientTasks = tasks.map(task => {
    const scorePriority = getScorePriority(task)
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      score: calculateTaskScore(task),
      priority: scorePriority,
      due_date: task.due_date,
      created_at: task.created_at,
      // Don't expose internal notes, assignee details, billing info etc.
      status_label: getStatusLabel(task.status),
      priority_label: getPriorityLabel(scorePriority),
    }
  })

  // Group by status for easier display
  const byStatus = {
    active: clientTasks.filter(t => ['pending', 'accepted', 'in_progress'].includes(t.status)),
    waiting: clientTasks.filter(t => t.status === 'waiting_for'),
    completed: clientTasks.filter(t => t.status === 'completed').slice(0, 5), // Last 5 completed
  }

  return NextResponse.json({
    tasks: clientTasks,
    byStatus,
    stats: {
      total: clientTasks.length,
      active: byStatus.active.length,
      waiting: byStatus.waiting.length,
      completed: clientTasks.filter(t => t.status === 'completed').length,
    }
  })
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Čeká na zpracování',
    accepted: 'Přijato',
    in_progress: 'Zpracovává se',
    waiting_for: 'Čeká na podklady',
    completed: 'Dokončeno',
    someday_maybe: 'Naplánováno',
  }
  return labels[status] || status
}

function getPriorityLabel(priority: ScorePriority): string {
  const labels: Record<ScorePriority, string> = {
    high: 'Vysoká',
    medium: 'Střední',
    low: 'Nízká',
  }
  return labels[priority] || priority
}
