import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

// GET version chain for a document
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id: projectId, docId } = await params

    // Get the current document to find the chain root
    const { data: currentDoc } = await supabaseAdmin
      .from('case_documents')
      .select('id, parent_document_id')
      .eq('id', docId)
      .eq('project_id', projectId)
      .single()

    if (!currentDoc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Find the root of the chain
    let rootId = currentDoc.parent_document_id || currentDoc.id

    // Traverse up to find the true root (max 20 iterations for safety)
    let iterations = 0
    while (rootId && iterations < 20) {
      const { data: parent } = await supabaseAdmin
        .from('case_documents')
        .select('id, parent_document_id')
        .eq('id', rootId)
        .single()

      if (!parent || !parent.parent_document_id) break
      rootId = parent.parent_document_id
      iterations++
    }

    // Get all versions in the chain
    // First get documents where parent_document_id = rootId OR id = rootId
    const { data: versions, error } = await supabaseAdmin
      .from('case_documents')
      .select('*')
      .eq('project_id', projectId)
      .or(`id.eq.${rootId},parent_document_id.eq.${rootId}`)
      .order('version', { ascending: false })

    // Also get documents that are children of children (recursive chain)
    // For simplicity, get all docs with same project_id that share the root
    const allVersionIds = new Set([rootId])
    const { data: allDocs } = await supabaseAdmin
      .from('case_documents')
      .select('id, parent_document_id, version, name, file_url, file_type, file_size_bytes, category, description, uploaded_by_name, change_summary, is_current_version, created_at')
      .eq('project_id', projectId)
      .not('parent_document_id', 'is', null)

    // Build chain
    const chainDocs = [
      ...(versions || []),
      ...(allDocs || []).filter(d => {
        if (allVersionIds.has(d.parent_document_id!)) {
          allVersionIds.add(d.id)
          return true
        }
        return false
      }),
    ]

    // Deduplicate
    const uniqueVersions = Array.from(new Map(chainDocs.map(d => [d.id, d])).values())
      .sort((a, b) => (b.version || 1) - (a.version || 1))

    return NextResponse.json({ versions: uniqueVersions })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Upload new version of a document
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  const userId = request.headers.get('x-user-id')
  const userName = request.headers.get('x-user-name')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id: projectId, docId } = await params
    const body = await request.json()

    // Get current document
    const { data: currentDoc } = await supabaseAdmin
      .from('case_documents')
      .select('*')
      .eq('id', docId)
      .eq('project_id', projectId)
      .single()

    if (!currentDoc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Mark current as not current
    await supabaseAdmin
      .from('case_documents')
      .update({ is_current_version: false })
      .eq('id', docId)

    // Create new version
    const newVersion = (currentDoc.version || 1) + 1
    const rootId = currentDoc.parent_document_id || currentDoc.id

    const { data: newDoc, error } = await supabaseAdmin
      .from('case_documents')
      .insert({
        project_id: projectId,
        name: body.name || currentDoc.name,
        file_url: body.file_url || currentDoc.file_url,
        file_type: body.file_type || currentDoc.file_type,
        file_size_bytes: body.file_size_bytes || currentDoc.file_size_bytes,
        category: currentDoc.category,
        version: newVersion,
        description: body.description || currentDoc.description,
        uploaded_by: userId,
        uploaded_by_name: userName || 'Unknown',
        parent_document_id: rootId,
        is_current_version: true,
        client_visible: currentDoc.client_visible,
        change_summary: body.change_summary || null,
      })
      .select()
      .single()

    if (error) {
      // Rollback current version flag
      await supabaseAdmin
        .from('case_documents')
        .update({ is_current_version: true })
        .eq('id', docId)
      return NextResponse.json({ error: 'Failed to create version' }, { status: 500 })
    }

    // Log the change
    await supabaseAdmin.from('case_document_changes').insert({
      document_id: newDoc.id,
      changed_by: userId,
      changed_by_name: userName || 'Unknown',
      change_type: 'replaced',
      old_values: { version: currentDoc.version, file_url: currentDoc.file_url },
      new_values: { version: newVersion, file_url: body.file_url },
      change_summary: body.change_summary || `Nová verze v${newVersion}`,
    })

    return NextResponse.json({ document: newDoc }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
