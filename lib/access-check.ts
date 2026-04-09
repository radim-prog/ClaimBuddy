import { supabaseAdmin } from '@/lib/supabase-admin'

const STAFF_ROLES = ['junior', 'senior', 'accountant', 'admin', 'assistant', 'manager']

export function isStaffRole(role: string | null): boolean {
  return !!role && STAFF_ROLES.includes(role)
}

function uniqIds(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.filter((value): value is string => !!value)))
}

export async function getUserCompanyIds(userId: string): Promise<string[]> {
  const [{ data: ownedCompanies, error: ownedError }, { data: memberships, error: membershipError }] = await Promise.all([
    supabaseAdmin
      .from('companies')
      .select('id')
      .eq('owner_id', userId)
      .is('deleted_at', null),
    supabaseAdmin
      .from('client_users')
      .select('company_id')
      .eq('user_id', userId),
  ])

  if (ownedError) {
    throw new Error(`Failed to resolve owned companies: ${ownedError.message}`)
  }

  if (membershipError) {
    throw new Error(`Failed to resolve client memberships: ${membershipError.message}`)
  }

  const companyIds = uniqIds([
    ...(ownedCompanies ?? []).map((company) => company.id),
    ...(memberships ?? []).map((membership) => membership.company_id),
  ])

  if (companyIds.length === 0) {
    return []
  }

  const { data: activeCompanies, error: activeError } = await supabaseAdmin
    .from('companies')
    .select('id')
    .in('id', companyIds)
    .is('deleted_at', null)

  if (activeError) {
    throw new Error(`Failed to resolve active companies: ${activeError.message}`)
  }

  return (activeCompanies ?? []).map((company) => company.id)
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
