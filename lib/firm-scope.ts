import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * Firm-level data isolation utilities.
 * Each user belongs to a firm (firm_id). API routes use these helpers
 * to scope queries to the user's firm, ensuring data isolation.
 */

/** Extract firm_id from request headers (set by middleware) */
export function getFirmId(request: NextRequest): string | null {
  return request.headers.get('x-firm-id') || null
}

/** Apply firm scope to a Supabase query builder. Returns the query with .eq('firm_id', firmId) if firmId is set. */
export function scopeToFirm<T extends { eq: (col: string, val: string) => T }>(query: T, firmId: string | null): T {
  if (!firmId) return query
  return query.eq('firm_id', firmId)
}

/** Get all company IDs belonging to a firm */
export async function getFirmCompanyIds(firmId: string): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from('companies')
    .select('id')
    .eq('firm_id', firmId)
    .is('deleted_at', null)

  if (error) {
    console.error('getFirmCompanyIds error:', error.message)
    return []
  }
  return (data ?? []).map(c => c.id)
}

/** Check if user is a tenant admin (admin with firm_id) */
export function isTenantAdmin(request: NextRequest): boolean {
  const role = request.headers.get('x-user-role')
  const firmId = request.headers.get('x-firm-id')
  return role === 'admin' && !!firmId
}

/** Check if user is a super admin (admin without firm_id — platform-level) */
export function isSuperAdmin(request: NextRequest): boolean {
  const role = request.headers.get('x-user-role')
  const firmId = request.headers.get('x-firm-id')
  return role === 'admin' && !firmId
}

/** Verify that a company belongs to the user's firm. Returns true if access is allowed. */
export async function verifyCompanyAccess(companyId: string, firmId: string | null): Promise<boolean> {
  // No firm scope = unrestricted (legacy single-tenant mode)
  if (!firmId) return true

  const { data, error } = await supabaseAdmin
    .from('companies')
    .select('id')
    .eq('id', companyId)
    .eq('firm_id', firmId)
    .single()

  if (error || !data) return false
  return true
}
