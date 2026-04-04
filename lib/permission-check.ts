import { supabaseAdmin } from '@/lib/supabase-admin'
import { getDefaultPermissions, hasPermission, type Permission, type UserPermissions } from '@/lib/permissions'
import type { UserRole } from '@/lib/auth'
import { getFirmById } from '@/lib/tenant-store'

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

/**
 * Check if user can set closure status to 'approved'.
 * When require_manager_approval is true, only manager/admin can approve.
 */
export async function canApproveClosures(userId: string, firmId: string | null): Promise<boolean> {
  const { permissions, role } = await getUserPermissions(userId)
  if (!hasPermission(permissions, 'documents_approve')) return false

  if (!firmId) return true

  const firm = await getFirmById(firmId)
  const requireManager = (firm as any)?.settings?.closure_workflow?.require_manager_approval ?? false

  if (!requireManager) return true

  return role === 'manager' || role === 'admin'
}
