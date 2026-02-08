import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

// Calculate R-Tasks total score
const calculateTaskScore = (task: any): number => {
  return (task.score_money || 0) +
         (task.score_fire || 0) +
         (task.score_time || 0) +
         (task.score_distance || 0) +
         (task.score_personal || 0)
}

type ScorePriority = 'high' | 'medium' | 'low'
const getScorePriority = (task: any): ScorePriority => {
  const score = calculateTaskScore(task)
  if (score >= 9) return 'high'
  if (score >= 6) return 'medium'
  return 'low'
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')

    let query = supabaseAdmin
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })

    if (companyId) {
      query = query.eq('company_id', companyId)
    }

    const { data, error } = await query

    if (error) throw new Error(`Failed to fetch tasks: ${error.message}`)

    const tasks = data ?? []

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
        status_label: getStatusLabel(task.status),
        priority_label: getPriorityLabel(scorePriority),
      }
    })

    const byStatus = {
      active: clientTasks.filter(t => ['pending', 'accepted', 'in_progress'].includes(t.status)),
      waiting: clientTasks.filter(t => t.status === 'waiting_for'),
      completed: clientTasks.filter(t => t.status === 'completed').slice(0, 5),
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
  } catch (error) {
    console.error('Client tasks API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
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
