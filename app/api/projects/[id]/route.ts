import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = params

  const [projectRes, phasesRes, tasksRes] = await Promise.all([
    supabaseAdmin.from('projects').select('*').eq('id', id).single(),
    supabaseAdmin.from('project_phases').select('*').eq('project_id', id).order('position'),
    supabaseAdmin.from('tasks').select('id, title, status, assigned_to_name, due_date, is_next_action, phase_id, position_in_phase').eq('project_id', id),
  ])

  if (projectRes.error) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  return NextResponse.json({
    project: projectRes.data,
    phases: phasesRes.data || [],
    tasks: tasksRes.data || [],
  })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = params
  const body = await req.json()

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  const allowed = ['title', 'description', 'outcome', 'status', 'company_id', 'owner_id', 'due_date', 'estimated_hours', 'actual_hours', 'progress_percentage', 'tags', 'completed_at', 'is_case', 'case_type_id', 'case_opposing_party', 'case_reference', 'hourly_rate', 'score_money', 'score_fire', 'score_time', 'score_distance', 'score_personal']
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key]
  }

  if (body.status === 'completed' && !updates.completed_at) {
    updates.completed_at = new Date().toISOString()
  }

  const { data, error } = await supabaseAdmin.from('projects').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ project: data })
}

export async function PATCH(req: NextRequest, context: { params: { id: string } }) {
  return PUT(req, context)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = req.headers.get('x-user-id')
  const userRole = req.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (userRole !== 'admin' && userRole !== 'accountant') {
    return NextResponse.json({ error: 'Forbidden: only admin or accountant can delete projects' }, { status: 403 })
  }

  const { id } = params
  const { error } = await supabaseAdmin
    .from('projects')
    .update({ status: 'deleted', updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
