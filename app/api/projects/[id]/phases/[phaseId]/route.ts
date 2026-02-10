import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function PUT(req: NextRequest, { params }: { params: { id: string; phaseId: string } }) {
  const body = await req.json()
  const updates: Record<string, unknown> = {}
  for (const key of ['title', 'description', 'position', 'status', 'due_date']) {
    if (body[key] !== undefined) updates[key] = body[key]
  }

  const { data, error } = await supabaseAdmin
    .from('project_phases')
    .update(updates)
    .eq('id', params.phaseId)
    .eq('project_id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ phase: data })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string; phaseId: string } }) {
  const { error } = await supabaseAdmin
    .from('project_phases')
    .delete()
    .eq('id', params.phaseId)
    .eq('project_id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
