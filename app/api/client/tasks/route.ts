import { NextRequest, NextResponse } from 'next/server'
import { mockTasks } from '@/lib/mock-data'

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
  const clientTasks = tasks.map(task => ({
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    due_date: task.due_date,
    created_at: task.created_at,
    // Don't expose internal notes, assignee details, billing info etc.
    status_label: getStatusLabel(task.status),
    priority_label: getPriorityLabel(task.priority),
  }))

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

function getPriorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    critical: 'Kritická',
    high: 'Vysoká',
    medium: 'Střední',
    low: 'Nízká',
  }
  return labels[priority] || priority
}
