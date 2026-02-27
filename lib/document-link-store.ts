import { supabaseAdmin } from '@/lib/supabase-admin'
import type {
  DocumentLink,
  DocumentLinkWithDocument,
  DocumentLinkWithEntity,
  CreateDocumentLinkInput,
  DocumentComment,
  CreateDocumentCommentInput,
  UpdateDocumentCommentInput,
  CommentAuthorRole,
  LinkEntityType,
  DocumentLinkType,
} from '@/lib/types/document-links'

// ============================================
// Document Links
// ============================================

export async function createDocumentLink(
  input: CreateDocumentLinkInput,
  userId: string,
  userName: string
): Promise<DocumentLink> {
  const { data, error } = await supabaseAdmin
    .from('document_links')
    .insert({
      document_id: input.document_id,
      entity_type: input.entity_type,
      entity_id: input.entity_id,
      link_type: input.link_type || 'reference',
      note: input.note || null,
      created_by: userId,
      created_by_name: userName,
    })
    .select('*')
    .single()

  if (error) throw new Error(`Failed to create document link: ${error.message}`)
  return mapLinkRow(data)
}

export async function deleteDocumentLink(linkId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('document_links')
    .delete()
    .eq('id', linkId)

  if (error) throw new Error(`Failed to delete document link: ${error.message}`)
}

export async function getLinksForDocument(documentId: string): Promise<DocumentLinkWithEntity[]> {
  const { data, error } = await supabaseAdmin
    .from('document_links')
    .select('*')
    .eq('document_id', documentId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to get links for document: ${error.message}`)

  const links = (data ?? []).map(mapLinkRow)

  // Fetch entity labels for each link
  const enriched: DocumentLinkWithEntity[] = []
  for (const link of links) {
    const entityInfo = await getEntityLabel(link.entity_type, link.entity_id)
    enriched.push({
      ...link,
      entity_label: entityInfo.label,
      entity_status: entityInfo.status,
    })
  }

  return enriched
}

export async function getLinksForEntity(
  entityType: LinkEntityType,
  entityId: string
): Promise<DocumentLinkWithDocument[]> {
  const { data, error } = await supabaseAdmin
    .from('document_links')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to get links for entity: ${error.message}`)

  const links = (data ?? []).map(mapLinkRow)

  // Fetch document info for each link
  const enriched: DocumentLinkWithDocument[] = []
  for (const link of links) {
    const { data: doc } = await supabaseAdmin
      .from('documents')
      .select('id, file_name, type, status, supplier_name, total_with_vat, date_issued, period, accounting_number')
      .eq('id', link.document_id)
      .single()

    if (doc) {
      enriched.push({
        ...link,
        document: {
          id: doc.id,
          file_name: doc.file_name,
          type: doc.type,
          status: doc.status,
          supplier_name: doc.supplier_name,
          total_with_vat: doc.total_with_vat,
          date_issued: doc.date_issued,
          period: doc.period,
          accounting_number: doc.accounting_number,
        },
      })
    }
  }

  return enriched
}

export async function bulkCreateLinks(
  documentIds: string[],
  entityType: LinkEntityType,
  entityId: string,
  linkType: DocumentLinkType = 'reference',
  userId: string,
  userName: string
): Promise<DocumentLink[]> {
  const rows = documentIds.map(docId => ({
    document_id: docId,
    entity_type: entityType,
    entity_id: entityId,
    link_type: linkType,
    created_by: userId,
    created_by_name: userName,
  }))

  const { data, error } = await supabaseAdmin
    .from('document_links')
    .upsert(rows, { onConflict: 'document_id,entity_type,entity_id', ignoreDuplicates: true })
    .select('*')

  if (error) throw new Error(`Failed to bulk create links: ${error.message}`)
  return (data ?? []).map(mapLinkRow)
}

// ============================================
// Document Comments
// ============================================

export async function addComment(
  input: CreateDocumentCommentInput,
  userId: string,
  userName: string,
  role: CommentAuthorRole
): Promise<DocumentComment> {
  const { data, error } = await supabaseAdmin
    .from('document_comments')
    .insert({
      document_id: input.document_id,
      content: input.content,
      is_internal: input.is_internal ?? false,
      author_id: userId,
      author_name: userName,
      author_role: role,
    })
    .select('*')
    .single()

  if (error) throw new Error(`Failed to add comment: ${error.message}`)
  return mapCommentRow(data)
}

export async function getComments(
  documentId: string,
  includeInternal: boolean
): Promise<DocumentComment[]> {
  let query = supabaseAdmin
    .from('document_comments')
    .select('*')
    .eq('document_id', documentId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  if (!includeInternal) {
    query = query.eq('is_internal', false)
  }

  const { data, error } = await query

  if (error) throw new Error(`Failed to get comments: ${error.message}`)
  return (data ?? []).map(mapCommentRow)
}

export async function updateComment(
  commentId: string,
  input: UpdateDocumentCommentInput,
  userId: string
): Promise<DocumentComment> {
  // Verify ownership
  const { data: existing } = await supabaseAdmin
    .from('document_comments')
    .select('author_id')
    .eq('id', commentId)
    .single()

  if (!existing || existing.author_id !== userId) {
    throw new Error('Not authorized to update this comment')
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }
  if (input.content !== undefined) updates.content = input.content
  if (input.is_internal !== undefined) updates.is_internal = input.is_internal

  const { data, error } = await supabaseAdmin
    .from('document_comments')
    .update(updates)
    .eq('id', commentId)
    .select('*')
    .single()

  if (error) throw new Error(`Failed to update comment: ${error.message}`)
  return mapCommentRow(data)
}

export async function softDeleteComment(
  commentId: string,
  userId: string
): Promise<void> {
  // Verify ownership
  const { data: existing } = await supabaseAdmin
    .from('document_comments')
    .select('author_id')
    .eq('id', commentId)
    .single()

  if (!existing || existing.author_id !== userId) {
    throw new Error('Not authorized to delete this comment')
  }

  const { error } = await supabaseAdmin
    .from('document_comments')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', commentId)

  if (error) throw new Error(`Failed to delete comment: ${error.message}`)
}

// ============================================
// Helpers
// ============================================

async function getEntityLabel(
  entityType: LinkEntityType,
  entityId: string
): Promise<{ label: string; status: string | null }> {
  switch (entityType) {
    case 'task': {
      const { data } = await supabaseAdmin
        .from('tasks')
        .select('title, status')
        .eq('id', entityId)
        .single()
      return { label: data?.title || 'Úkol', status: data?.status || null }
    }
    case 'project': {
      const { data } = await supabaseAdmin
        .from('projects')
        .select('title, status')
        .eq('id', entityId)
        .single()
      return { label: data?.title || 'Projekt', status: data?.status || null }
    }
    case 'vat_return': {
      const { data } = await supabaseAdmin
        .from('vat_returns')
        .select('period, type, status')
        .eq('id', entityId)
        .single()
      return {
        label: data ? `${data.type} ${data.period}` : 'DPH přiznání',
        status: data?.status || null,
      }
    }
    case 'closure': {
      const { data } = await supabaseAdmin
        .from('closures')
        .select('period, status')
        .eq('id', entityId)
        .single()
      return {
        label: data ? `Uzávěrka ${data.period}` : 'Uzávěrka',
        status: data?.status || null,
      }
    }
    default:
      return { label: entityType, status: null }
  }
}

function mapLinkRow(row: Record<string, unknown>): DocumentLink {
  return {
    id: row.id as string,
    document_id: row.document_id as string,
    entity_type: row.entity_type as LinkEntityType,
    entity_id: row.entity_id as string,
    link_type: row.link_type as DocumentLinkType,
    note: row.note as string | null,
    created_by: row.created_by as string,
    created_by_name: row.created_by_name as string | null,
    created_at: row.created_at as string,
  }
}

function mapCommentRow(row: Record<string, unknown>): DocumentComment {
  return {
    id: row.id as string,
    document_id: row.document_id as string,
    content: row.content as string,
    is_internal: row.is_internal as boolean,
    author_id: row.author_id as string,
    author_name: row.author_name as string,
    author_role: row.author_role as CommentAuthorRole,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string | null,
  }
}
