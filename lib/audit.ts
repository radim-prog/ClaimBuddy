import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest } from 'next/server'

export type AuditAction =
  | 'closure_status_changed'
  | 'closure_approved'
  | 'closure_bulk_review'
  | 'user_login'
  | 'user_logout'
  | 'company_updated'
  | 'document_uploaded'
  | 'document_deleted'
  | 'settings_changed'

interface AuditParams {
  userId: string
  action: AuditAction | string
  tableName: string
  recordId?: string
  oldValues?: Record<string, unknown>
  newValues?: Record<string, unknown>
  request?: NextRequest
}

export async function logAudit(params: AuditParams): Promise<void> {
  try {
    await supabaseAdmin.from('audit_log').insert({
      user_id: params.userId,
      action: params.action,
      table_name: params.tableName,
      record_id: params.recordId || null,
      old_values: params.oldValues || null,
      new_values: params.newValues || null,
      ip_address: params.request?.headers.get('x-forwarded-for')?.split(',')[0] || null,
      user_agent: params.request?.headers.get('user-agent') || null,
      created_at: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[Audit] Log failed:', err)
    // Never throw — audit failures must not block business logic
  }
}
