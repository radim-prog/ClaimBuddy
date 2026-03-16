import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

// GET - List all folder templates
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabaseAdmin
    .from('document_folder_templates')
    .select('*')
    .order('sort_order')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ templates: data || [] })
}

// POST - Create a new folder template (admin only) + provision to all companies
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userRole = request.headers.get('x-user-role')
  if (userRole !== 'admin') {
    return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { name, icon, has_period_filter, sort_order } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    // Generate slug
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    // Get max sort_order if not provided
    let order = sort_order
    if (order === undefined || order === null) {
      const { data: maxRow } = await supabaseAdmin
        .from('document_folder_templates')
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1)
        .single()
      order = (maxRow?.sort_order ?? 0) + 10
    }

    // Insert template
    const { data: template, error } = await supabaseAdmin
      .from('document_folder_templates')
      .insert({
        name: name.trim(),
        slug,
        icon: icon || 'folder',
        entity_types: ['osvc', 'sro', 'as'],
        is_mandatory: false,
        sort_order: order,
        has_period_filter: has_period_filter ?? true,
        auto_ocr: false,
      })
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Provision this folder to ALL existing companies
    const { data: companies } = await supabaseAdmin
      .from('companies')
      .select('id')
      .is('deleted_at', null)

    if (companies && companies.length > 0) {
      const foldersToInsert = companies.map((c) => ({
        company_id: c.id,
        template_id: template.id,
        name: template.name,
        slug: template.slug,
        icon: template.icon,
        is_system: true,
        is_custom: false,
        has_period_filter: template.has_period_filter,
        sort_order: template.sort_order,
        client_visible: true,
      }))

      // Batch insert (ignore conflicts — company might already have this template)
      await supabaseAdmin
        .from('document_folders')
        .upsert(foldersToInsert, { onConflict: 'company_id,template_id', ignoreDuplicates: true })
    }

    return NextResponse.json({ template, provisioned: companies?.length ?? 0 }, { status: 201 })
  } catch (error) {
    console.error('Folder templates POST error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE - Remove a folder template (admin only)
export async function DELETE(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userRole = request.headers.get('x-user-role')
  if (userRole !== 'admin') {
    return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('id')
    if (!templateId) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    // Delete all company folders created from this template
    await supabaseAdmin
      .from('document_folders')
      .delete()
      .eq('template_id', templateId)

    // Delete the template
    const { error } = await supabaseAdmin
      .from('document_folder_templates')
      .delete()
      .eq('id', templateId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Folder templates DELETE error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
