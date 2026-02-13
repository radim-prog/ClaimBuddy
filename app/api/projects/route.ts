import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const companyId = searchParams.get('company_id')
  const status = searchParams.get('status')

  let query = supabaseAdmin.from('projects').select('*').order('updated_at', { ascending: false })

  if (companyId) query = query.eq('company_id', companyId)
  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ projects: data })
}

export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { title, description, outcome, company_id, owner_id, due_date, estimated_hours, tags, phases } = body

  if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })

  const { data: project, error } = await supabaseAdmin
    .from('projects')
    .insert({ title, description, outcome, company_id, owner_id, due_date, estimated_hours, tags })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Create phases if provided
  if (phases?.length && project) {
    const phaseRows = phases.map((p: { title: string; description?: string }, i: number) => ({
      project_id: project.id,
      title: p.title,
      description: p.description || null,
      position: i,
    }))
    await supabaseAdmin.from('project_phases').insert(phaseRows)
  }

  return NextResponse.json({ project }, { status: 201 })
}
