import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { data, error } = await supabaseAdmin
    .from('project_phases')
    .select('*')
    .eq('project_id', params.id)
    .order('position')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ phases: data })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  if (!body.title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })

  // Auto-set position to max+1
  const { data: existing } = await supabaseAdmin
    .from('project_phases')
    .select('position')
    .eq('project_id', params.id)
    .order('position', { ascending: false })
    .limit(1)

  const nextPosition = existing?.length ? (existing[0].position + 1) : 0

  const { data, error } = await supabaseAdmin
    .from('project_phases')
    .insert({
      project_id: params.id,
      title: body.title,
      description: body.description || null,
      position: body.position ?? nextPosition,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ phase: data }, { status: 201 })
}
