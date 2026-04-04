export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isStaffRole } from '@/lib/access-check'
import { getFirmId } from '@/lib/firm-scope'
import { getUserName } from '@/lib/request-utils'

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userRole = request.headers.get('x-user-role')
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const firmId = getFirmId(request)

  let query = supabaseAdmin
    .from('deadline_completions')
    .select('deadline_id, completed_by_name, completed_at')

  if (firmId) {
    query = query.eq('firm_id', firmId)
  } else {
    query = query.is('firm_id', null)
  }

  const { data, error } = await query

  if (error) {
    console.error('[Deadline completions GET]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

  const completions: Record<string, { at: string; by: string }> = {}
  for (const row of data || []) {
    completions[row.deadline_id] = { at: row.completed_at, by: row.completed_by_name }
  }

  return NextResponse.json({ completions })
}

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userRole = request.headers.get('x-user-role')
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const firmId = getFirmId(request)
  const userName = getUserName(request)

  try {
    const { deadline_id } = await request.json()
    if (!deadline_id) return NextResponse.json({ error: 'deadline_id required' }, { status: 400 })

    let existQuery = supabaseAdmin
      .from('deadline_completions')
      .select('id')
      .eq('deadline_id', deadline_id)

    if (firmId) {
      existQuery = existQuery.eq('firm_id', firmId)
    } else {
      existQuery = existQuery.is('firm_id', null)
    }

    const { data: existing } = await existQuery.maybeSingle()

    if (existing) {
      await supabaseAdmin.from('deadline_completions').delete().eq('id', existing.id)
      return NextResponse.json({ completed: false })
    }

    const { error } = await supabaseAdmin.from('deadline_completions').insert({
      deadline_id,
      completed_by: userId,
      completed_by_name: userName,
      firm_id: firmId,
    })

    if (error) {
      console.error('[Deadline completions POST]', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return NextResponse.json({ completed: true })
  } catch (err) {
    console.error('[Deadline completions POST]', err)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
