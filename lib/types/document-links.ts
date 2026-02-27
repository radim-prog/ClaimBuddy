// ============================================
// Document Links & Comments - TypeScript Types
// ============================================

// --- Document Links (Junction Table) ---

export type LinkEntityType =
  | 'task'
  | 'project'
  | 'vat_return'
  | 'closure'

export type DocumentLinkType =
  | 'reference'
  | 'primary'
  | 'supporting'
  | 'output'

export interface DocumentLink {
  id: string
  document_id: string
  entity_type: LinkEntityType
  entity_id: string
  link_type: DocumentLinkType
  note: string | null
  created_by: string
  created_by_name: string | null
  created_at: string
}

export interface DocumentLinkWithDocument extends DocumentLink {
  document: {
    id: string
    file_name: string
    type: string
    status: string
    supplier_name: string | null
    total_with_vat: number | null
    date_issued: string | null
    period: string
    accounting_number: string | null
  }
}

export interface DocumentLinkWithEntity extends DocumentLink {
  entity_label: string
  entity_status: string | null
}

export interface CreateDocumentLinkInput {
  document_id: string
  entity_type: LinkEntityType
  entity_id: string
  link_type?: DocumentLinkType
  note?: string
}

// --- Document Comments ---

export type CommentAuthorRole = 'accountant' | 'client'

export interface DocumentComment {
  id: string
  document_id: string
  content: string
  is_internal: boolean
  author_id: string
  author_name: string
  author_role: CommentAuthorRole
  created_at: string
  updated_at: string | null
}

export interface CreateDocumentCommentInput {
  document_id: string
  content: string
  is_internal?: boolean
}

export interface UpdateDocumentCommentInput {
  content?: string
  is_internal?: boolean
}

// --- Labels ---

export const LINK_TYPE_LABELS: Record<DocumentLinkType, string> = {
  reference: 'Odkaz',
  primary: 'Hlavní doklad',
  supporting: 'Podpůrný doklad',
  output: 'Výstup',
}

export const ENTITY_TYPE_LABELS: Record<LinkEntityType, string> = {
  task: 'Úkol',
  project: 'Projekt / Spis',
  vat_return: 'DPH přiznání',
  closure: 'Uzávěrka',
}

export const LINK_TYPE_COLORS: Record<DocumentLinkType, { bg: string; text: string }> = {
  reference: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400' },
  primary: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400' },
  supporting: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400' },
  output: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400' },
}
