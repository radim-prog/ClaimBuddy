import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { data: tasks, error } = await supabaseAdmin
    .from('tasks')
    .select('*')
    .eq('project_id', params.id)
    .order('phase_id')
    .order('position_in_phase')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Group by phase
  const byPhase: Record<string, typeof tasks> = {}
  const noPhase: typeof tasks = []
  for (const task of tasks || []) {
    if (task.phase_id) {
      if (!byPhase[task.phase_id]) byPhase[task.phase_id] = []
      byPhase[task.phase_id].push(task)
    } else {
      noPhase.push(task)
    }
  }

  return NextResponse.json({ tasks: tasks || [], byPhase, unassigned: noPhase })
}
