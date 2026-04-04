import { supabaseAdmin } from '@/lib/supabase-admin'

const STAFF_ROLES = ['junior', 'senior', 'accountant', 'admin', 'assistant', 'manager']

export function isStaffRole(role: string | null): boolean {
  return !!role && STAFF_ROLES.includes(role)
}

export async function getUserCompanyIds(userId: string): Promise<string[]> {
  const { data } = await supabaseAdmin
    .from('companies')
    .select('id')
    .eq('owner_id', userId)
    .is('deleted_at', null)

  return (data ?? []).map(c => c.id)
}

export async function canAccessCompany(
  userId: string,
  userRole: string | null,
  companyId: string,
  impersonateCompany: string | null
): Promise<boolean> {
  if (isStaffRole(userRole)) return true
  const ids = await getUserCompanyIds(userId)
  return ids.includes(companyId)
}
