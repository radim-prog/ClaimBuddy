import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
import type { UserRole } from '@/lib/auth'
import type { UserPermissions } from '@/lib/permissions'

// ============================================
// TYPES
// ============================================

export interface StoredUser {
  id: string
  name: string
  email: string
  role: UserRole
  login_name: string
  password_hash: string
  permissions: UserPermissions
  compensation_type: 'hourly' | 'monthly'
  compensation_amount: number
  plan_tier: string
  stripe_customer_id: string | null
  status: string | null
  verification_token: string | null
  verification_token_expires: string | null
  reset_token: string | null
  reset_token_expires: string | null
  modules: string[]
  firm_id: string | null
  created_at: string
  updated_at: string
}

export type SafeUser = Omit<StoredUser, 'password_hash'>

// ============================================
// CRUD FUNCTIONS
// ============================================

export async function getAllUsers(firmId?: string | null): Promise<SafeUser[]> {
  let query = supabase
    .from('users')
    .select('id, name, email, role, login_name, permissions, compensation_type, compensation_amount, created_at, updated_at')
    .order('created_at', { ascending: true })

  if (firmId) {
    query = query.eq('firm_id', firmId)
  }

  const { data, error } = await query

  if (error) throw new Error(`Failed to fetch users: ${error.message}`)
  return (data ?? []) as SafeUser[]
}

export async function getUserById(id: string): Promise<StoredUser | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // not found
    throw new Error(`Failed to fetch user: ${error.message}`)
  }
  return data as StoredUser
}

export async function getUserByLoginName(loginName: string): Promise<StoredUser | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('login_name', loginName.toLowerCase().trim())
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // not found
    throw new Error(`Failed to fetch user: ${error.message}`)
  }
  return data as StoredUser
}

export async function createUser(userData: {
  name: string
  email: string
  login_name: string
  role: UserRole
  password_hash: string
  permissions: UserPermissions
  compensation_type?: 'hourly' | 'monthly'
  compensation_amount?: number
}): Promise<SafeUser> {
  const { data, error } = await supabase
    .from('users')
    .insert({
      ...userData,
      login_name: userData.login_name.toLowerCase().trim(),
    })
    .select('id, name, email, role, login_name, permissions, compensation_type, compensation_amount, created_at, updated_at')
    .single()

  if (error) throw new Error(`Failed to create user: ${error.message}`)
  return data as SafeUser
}

export async function updateUser(
  id: string,
  updates: Partial<{
    name: string
    email: string
    role: UserRole
    login_name: string
    password_hash: string
    permissions: UserPermissions
    compensation_type: 'hourly' | 'monthly'
    compensation_amount: number
  }>
): Promise<SafeUser | null> {
  const updateData: Record<string, unknown> = { ...updates, updated_at: new Date().toISOString() }
  if (updates.login_name) {
    updateData.login_name = updates.login_name.toLowerCase().trim()
  }

  const { data, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', id)
    .select('id, name, email, role, login_name, permissions, compensation_type, compensation_amount, created_at, updated_at')
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Failed to update user: ${error.message}`)
  }
  return data as SafeUser
}

export async function deleteUser(id: string): Promise<boolean> {
  // Check: cannot delete the last admin
  const { data: admins } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'admin')

  const adminCount = admins?.length ?? 0
  const isDeletingAdmin = admins?.some(a => a.id === id)

  if (isDeletingAdmin && adminCount <= 1) {
    throw new Error('Nelze smazat posledního administrátora')
  }

  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', id)

  if (error) throw new Error(`Failed to delete user: ${error.message}`)
  return true
}
