import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

// GET /api/client/requests — list service requests for current user's company
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const companyId = request.headers.get('x-company-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    let query = supabaseAdmin
      .from('service_requests')
      .select('*, assigned_user:users!assigned_to(id, name)', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (companyId) {
      query = query.eq('company_id', companyId)
    }

    const { data, error, count } = await query

    if (error) throw error
    return NextResponse.json({ requests: data ?? [], count: count ?? 0 })
  } catch (error) {
    console.error('Service requests GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/client/requests — create a new service request
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const companyId = request.headers.get('x-company-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!companyId) return NextResponse.json({ error: 'No company selected' }, { status: 400 })

  try {
    const body = await request.json()
    const { type, priority, subject, description } = body

    if (!subject?.trim() || !description?.trim()) {
      return NextResponse.json({ error: 'Předmět a popis jsou povinné' }, { status: 400 })
    }

    const validTypes = ['general', 'documents', 'tax', 'payroll', 'invoice', 'consultation', 'urgent', 'other']
    const validPriorities = ['low', 'normal', 'high', 'urgent']

    const { data, error } = await supabaseAdmin
      .from('service_requests')
      .insert({
        company_id: companyId,
        user_id: userId,
        type: validTypes.includes(type) ? type : 'general',
        priority: validPriorities.includes(priority) ? priority : 'normal',
        subject: subject.trim(),
        description: description.trim(),
        status: 'new',
      })
      .select('*')
      .single()

    if (error) throw error
    return NextResponse.json({ request: data }, { status: 201 })
  } catch (error) {
    console.error('Service requests POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
