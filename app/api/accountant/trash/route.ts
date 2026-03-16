import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isStaffRole } from '@/lib/access-check'
import { checkFeatureAccess } from '@/lib/plan-gate'

export const dynamic = 'force-dynamic'

type ResourceType = 'documents' | 'invoices' | 'tasks' | 'projects' | 'invoice_partners'

const VALID_TYPES: ResourceType[] = ['documents', 'invoices', 'tasks', 'projects', 'invoice_partners']

const TYPE_LABELS: Record<ResourceType, string> = {
  documents: 'Dokumenty',
  invoices: 'Faktury',
  tasks: 'Úkoly',
  projects: 'Projekty',
  invoice_partners: 'Partneři',
}

// GET — list deleted items across resource types
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userRole = request.headers.get('x-user-role')
  if (!isStaffRole(userRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Plan gate
  const gate = await checkFeatureAccess(userId, 'trash_restore')
  if (!gate.allowed) {
    return NextResponse.json({ error: gate.reason, requiredTier: gate.requiredTier }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const typeFilter = searchParams.get('type') as ResourceType | null
    const companyId = searchParams.get('company_id')
    const limit = Math.min(Number(searchParams.get('limit')) || 50, 200)

    const items: Array<{
      id: string
      type: ResourceType
      type_label: string
      name: string
      company_id: string | null
      company_name: string | null
      deleted_at: string
      deleted_by: string | null
      metadata: Record<string, unknown>
    }> = []

    const types = typeFilter ? [typeFilter] : VALID_TYPES

    for (const type of types) {
      if (!VALID_TYPES.includes(type)) continue

      const fetched = await fetchDeletedItems(type, companyId, Math.ceil(limit / types.length))
      items.push(...fetched)
    }

    // Sort by deleted_at descending
    items.sort((a, b) => new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime())

    // Get retention settings
    const { data: globalSettings } = await supabaseAdmin
      .from('trash_settings')
      .select('retention_days')
      .is('company_id', null)
      .single()

    const retentionDays = globalSettings?.retention_days || 30

    return NextResponse.json({
      items: items.slice(0, limit),
      total: items.length,
      retention_days: retentionDays,
    })
  } catch (error) {
    console.error('[Trash GET]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST — restore a deleted item
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userRole = request.headers.get('x-user-role')
  if (!isStaffRole(userRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const gate = await checkFeatureAccess(userId, 'trash_restore')
  if (!gate.allowed) {
    return NextResponse.json({ error: gate.reason, requiredTier: gate.requiredTier }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { id, type } = body as { id: string; type: ResourceType }

    if (!id || !type || !VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: 'id and valid type required' }, { status: 400 })
    }

    const table = type as string

    if (type === 'projects') {
      // Projects use status='deleted' pattern + deleted_at
      const { error } = await supabaseAdmin
        .from(table)
        .update({
          deleted_at: null,
          deleted_by: null,
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .not('deleted_at', 'is', null)

      if (error) {
        console.error('[Trash restore]', error)
        return NextResponse.json({ error: 'Failed to restore' }, { status: 500 })
      }
    } else if (type === 'tasks') {
      // Tasks: clear deleted_at and set status back to 'todo'
      const { error } = await supabaseAdmin
        .from(table)
        .update({
          deleted_at: null,
          deleted_by: null,
          status: 'todo',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .not('deleted_at', 'is', null)

      if (error) {
        console.error('[Trash restore]', error)
        return NextResponse.json({ error: 'Failed to restore' }, { status: 500 })
      }
    } else {
      // Standard: clear deleted_at
      const { error } = await supabaseAdmin
        .from(table)
        .update({
          deleted_at: null,
          deleted_by: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .not('deleted_at', 'is', null)

      if (error) {
        console.error('[Trash restore]', error)
        return NextResponse.json({ error: 'Failed to restore' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, message: `${TYPE_LABELS[type]} obnoven(a)` })
  } catch (error) {
    console.error('[Trash POST]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE — permanently delete an item
export async function DELETE(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userRole = request.headers.get('x-user-role')
  if (userRole !== 'admin') {
    return NextResponse.json({ error: 'Only admin can permanently delete' }, { status: 403 })
  }

  const gate = await checkFeatureAccess(userId, 'trash_restore')
  if (!gate.allowed) {
    return NextResponse.json({ error: gate.reason, requiredTier: gate.requiredTier }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type') as ResourceType | null

    if (!id || !type || !VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: 'id and valid type required' }, { status: 400 })
    }

    // Only delete items that are already in trash
    const { error } = await supabaseAdmin
      .from(type as string)
      .delete()
      .eq('id', id)
      .not('deleted_at', 'is', null)

    if (error) {
      console.error('[Trash DELETE]', error)
      return NextResponse.json({ error: 'Failed to delete permanently' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Trash DELETE]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH — update retention settings
export async function PATCH(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userRole = request.headers.get('x-user-role')
  if (userRole !== 'admin') {
    return NextResponse.json({ error: 'Only admin can change trash settings' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { retention_days } = body

    if (![30, 60, 90].includes(retention_days)) {
      return NextResponse.json({ error: 'retention_days must be 30, 60, or 90' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('trash_settings')
      .upsert({
        company_id: null, // global setting
        retention_days,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'company_id' })

    if (error) {
      console.error('[Trash PATCH]', error)
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
    }

    return NextResponse.json({ success: true, retention_days })
  } catch (error) {
    console.error('[Trash PATCH]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================
// Helpers
// ============================================

async function fetchDeletedItems(
  type: ResourceType,
  companyId: string | null,
  limit: number
): Promise<Array<{
  id: string
  type: ResourceType
  type_label: string
  name: string
  company_id: string | null
  company_name: string | null
  deleted_at: string
  deleted_by: string | null
  metadata: Record<string, unknown>
}>> {
  switch (type) {
    case 'documents': {
      let q = supabaseAdmin
        .from('documents')
        .select('id, file_name, company_id, deleted_at, deleted_by, type, ocr_status, companies(name)')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false })
        .limit(limit)
      if (companyId) q = q.eq('company_id', companyId)

      const { data } = await q
      return (data || []).map((d: any) => ({
        id: d.id,
        type: 'documents',
        type_label: 'Dokument',
        name: d.file_name || 'Bez názvu',
        company_id: d.company_id,
        company_name: d.companies?.name || null,
        deleted_at: d.deleted_at,
        deleted_by: d.deleted_by,
        metadata: { doc_type: d.type, ocr_status: d.ocr_status },
      }))
    }

    case 'invoices': {
      let q = supabaseAdmin
        .from('invoices')
        .select('id, invoice_number, partner, company_id, deleted_at, deleted_by, type, total_with_vat, companies(name)')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false })
        .limit(limit)
      if (companyId) q = q.eq('company_id', companyId)

      const { data } = await q
      return (data || []).map((i: any) => ({
        id: i.id,
        type: 'invoices',
        type_label: 'Faktura',
        name: `${i.invoice_number || 'Bez čísla'} — ${i.partner || ''}`,
        company_id: i.company_id,
        company_name: i.companies?.name || null,
        deleted_at: i.deleted_at,
        deleted_by: i.deleted_by,
        metadata: { invoice_type: i.type, total: i.total_with_vat },
      }))
    }

    case 'tasks': {
      let q = supabaseAdmin
        .from('tasks')
        .select('id, title, company_id, deleted_at, deleted_by, priority, companies(name)')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false })
        .limit(limit)
      if (companyId) q = q.eq('company_id', companyId)

      const { data } = await q
      return (data || []).map((t: any) => ({
        id: t.id,
        type: 'tasks',
        type_label: 'Úkol',
        name: t.title || 'Bez názvu',
        company_id: t.company_id,
        company_name: t.companies?.name || null,
        deleted_at: t.deleted_at,
        deleted_by: t.deleted_by,
        metadata: { priority: t.priority },
      }))
    }

    case 'projects': {
      let q = supabaseAdmin
        .from('projects')
        .select('id, name, company_id, deleted_at, deleted_by, companies(name)')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false })
        .limit(limit)
      if (companyId) q = q.eq('company_id', companyId)

      const { data } = await q
      return (data || []).map((p: any) => ({
        id: p.id,
        type: 'projects',
        type_label: 'Projekt',
        name: p.name || 'Bez názvu',
        company_id: p.company_id,
        company_name: p.companies?.name || null,
        deleted_at: p.deleted_at,
        deleted_by: p.deleted_by,
        metadata: {},
      }))
    }

    case 'invoice_partners': {
      let q = supabaseAdmin
        .from('invoice_partners')
        .select('id, name, ico, company_id, deleted_at, deleted_by, companies(name)')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false })
        .limit(limit)
      if (companyId) q = q.eq('company_id', companyId)

      const { data } = await q
      return (data || []).map((p: any) => ({
        id: p.id,
        type: 'invoice_partners',
        type_label: 'Partner',
        name: `${p.name || 'Bez názvu'} (${p.ico || '—'})`,
        company_id: p.company_id,
        company_name: p.companies?.name || null,
        deleted_at: p.deleted_at,
        deleted_by: p.deleted_by,
        metadata: { ico: p.ico },
      }))
    }

    default:
      return []
  }
}
