import { supabaseAdmin } from '@/lib/supabase-admin'
import { getDefaultPermissions, hasPermission, type Permission, type UserPermissions } from '@/lib/permissions'
import type { UserRole } from '@/lib/auth'

/**
 * Get effective permissions for a user.
 * Reads from DB; falls back to role preset if no custom permissions stored.
 */
export async function getUserPermissions(userId: string): Promise<{ permissions: UserPermissions; role: UserRole }> {
  const { data } = await supabaseAdmin
    .from('users')
    .select('role, permissions')
    .eq('id', userId)
    .single()

  if (!data) {
    return { permissions: getDefaultPermissions('client'), role: 'client' }
  }

  const role = (data.role || 'client') as UserRole
  const permissions = data.permissions || getDefaultPermissions(role)

  return { permissions, role }
}

/**
 * Check if user has a specific permission.
 */
export async function checkPermission(userId: string, perm: Permission): Promise<boolean> {
  const { permissions } = await getUserPermissions(userId)
  return hasPermission(permissions, perm)
}
