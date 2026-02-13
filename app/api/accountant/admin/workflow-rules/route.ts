import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

// GET - list workflow rules
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { data, error } = await supabaseAdmin
      .from('workflow_rules')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching workflow rules:', error)
      return NextResponse.json({ error: 'Failed to fetch workflow rules' }, { status: 500 })
    }

    return NextResponse.json({ rules: data || [] })
  } catch (error) {
    console.error('Workflow rules API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - create workflow rule
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!userRole || !['admin', 'accountant'].includes(userRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { company_id, company_name, document_type_id, action, approver_id, notify_on_upload, notify_on_approval } = body

    if (!company_id) {
      return NextResponse.json({ error: 'company_id is required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('workflow_rules')
      .insert({
        company_id,
        company_name: company_name || null,
        document_type_id: document_type_id || null,
        action: action || 'auto_approve',
        approver_id: approver_id || null,
        notify_on_upload: notify_on_upload !== false,
        notify_on_approval: notify_on_approval === true,
        is_active: true,
        created_by: userId,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating workflow rule:', error)
      return NextResponse.json({ error: 'Failed to create workflow rule' }, { status: 500 })
    }

    return NextResponse.json({ success: true, rule: data }, { status: 201 })
  } catch (error) {
    console.error('Workflow rules POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - update workflow rule
export async function PUT(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!userRole || !['admin', 'accountant'].includes(userRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    updates.updated_at = new Date().toISOString()

    const { data, error } = await supabaseAdmin
      .from('workflow_rules')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating workflow rule:', error)
      return NextResponse.json({ error: 'Failed to update workflow rule' }, { status: 500 })
    }

    return NextResponse.json({ success: true, rule: data })
  } catch (error) {
    console.error('Workflow rules PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - delete workflow rule
export async function DELETE(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!userRole || !['admin', 'accountant'].includes(userRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const ruleId = searchParams.get('id')

    if (!ruleId) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('workflow_rules')
      .delete()
      .eq('id', ruleId)

    if (error) {
      console.error('Error deleting workflow rule:', error)
      return NextResponse.json({ error: 'Failed to delete workflow rule' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Workflow rules DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
