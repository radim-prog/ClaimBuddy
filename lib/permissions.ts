import type { UserRole } from '@/lib/auth'

// ============================================
// PERMISSION TYPES
// ============================================

export type Permission =
  | 'dashboard'
  | 'matrix_view'
  | 'matrix_edit'
  | 'clients_view'
  | 'clients_edit'
  | 'messages'
  | 'documents_approve'
  | 'reports'
  | 'admin_access'
  | 'users_manage'
  | 'settings'

export type UserPermissions = Record<Permission, boolean>

export const ALL_PERMISSIONS: Permission[] = [
  'dashboard',
  'matrix_view',
  'matrix_edit',
  'clients_view',
  'clients_edit',
  'messages',
  'documents_approve',
  'reports',
  'admin_access',
  'users_manage',
  'settings',
]

// ============================================
// PERMISSION DEFINITIONS (for UI)
// ============================================

export interface PermissionDefinition {
  key: Permission
  label: string
  description: string
  group: string
}

export const PERMISSION_GROUPS = ['Zobrazení', 'Editace', 'Administrace'] as const

export const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  // Zobrazení
  { key: 'dashboard', label: 'Dashboard', description: 'Přístup k hlavnímu přehledu', group: 'Zobrazení' },
  { key: 'matrix_view', label: 'Matice - zobrazení', description: 'Zobrazení matice uzávěrek', group: 'Zobrazení' },
  { key: 'clients_view', label: 'Klienti - zobrazení', description: 'Zobrazení seznamu klientů', group: 'Zobrazení' },
  // Editace
  { key: 'matrix_edit', label: 'Matice - editace', description: 'Změna stavů v matici uzávěrek', group: 'Editace' },
  { key: 'clients_edit', label: 'Klienti - editace', description: 'Úpravy klientských údajů', group: 'Editace' },
  { key: 'messages', label: 'Zprávy', description: 'Odesílání zpráv klientům', group: 'Editace' },
  { key: 'documents_approve', label: 'Doklady - schvalování', description: 'Schvalování nahraných dokladů', group: 'Editace' },
  { key: 'reports', label: 'Reporty', description: 'Generování a export reportů', group: 'Editace' },
  // Administrace
  { key: 'admin_access', label: 'Admin sekce', description: 'Přístup do administrace', group: 'Administrace' },
  { key: 'users_manage', label: 'Správa uživatelů', description: 'Vytváření a editace uživatelů', group: 'Administrace' },
  { key: 'settings', label: 'Nastavení', description: 'Přístup k nastavení aplikace', group: 'Administrace' },
]

// ============================================
// ROLE PRESETS
// ============================================

const ALL_TRUE: UserPermissions = {
  dashboard: true, matrix_view: true, matrix_edit: true,
  clients_view: true, clients_edit: true, messages: true,
  documents_approve: true, reports: true, admin_access: true,
  users_manage: true, settings: true,
}

const ALL_FALSE: UserPermissions = {
  dashboard: false, matrix_view: false, matrix_edit: false,
  clients_view: false, clients_edit: false, messages: false,
  documents_approve: false, reports: false, admin_access: false,
  users_manage: false, settings: false,
}

export const ROLE_PRESETS: Record<UserRole, UserPermissions> = {
  admin: { ...ALL_TRUE },
  accountant: {
    ...ALL_FALSE,
    dashboard: true, matrix_view: true, matrix_edit: true,
    clients_view: true, clients_edit: true, messages: true,
    documents_approve: true, reports: true,
  },
  assistant: {
    ...ALL_FALSE,
    dashboard: true, matrix_view: true, clients_view: true,
  },
  client: { ...ALL_FALSE },
}

// ============================================
// HELPERS
// ============================================

export function getDefaultPermissions(role: UserRole): UserPermissions {
  return { ...ROLE_PRESETS[role] }
}

export function hasPermission(permissions: UserPermissions | undefined | null, perm: Permission): boolean {
  if (!permissions) return false
  return permissions[perm] === true
}
