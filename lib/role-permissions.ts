export const ROLE_HIERARCHY: Record<string, number> = {
  client: 0,
  junior: 1,
  senior: 2,
  accountant: 3,
  assistant: 3,
  admin: 4,
}

export const ROLE_LABELS: Record<string, string> = {
  client: 'Klient',
  junior: 'Junior účetní',
  senior: 'Senior účetní',
  accountant: 'Účetní',
  assistant: 'Asistent',
  admin: 'Administrátor',
}

export const ROLE_COLORS: Record<string, string> = {
  client: 'bg-gray-100 text-gray-700',
  junior: 'bg-sky-100 text-sky-700',
  senior: 'bg-indigo-100 text-indigo-700',
  accountant: 'bg-blue-100 text-blue-800',
  assistant: 'bg-teal-100 text-teal-700',
  admin: 'bg-purple-100 text-purple-800',
}

// Actions that junior accountants cannot perform; senior/accountant/admin can
export const JUNIOR_RESTRICTED = [
  'delete_document',
  'approve_closure',
  'manage_billing',
  'access_admin',
  'manage_users',
  'export_data',
] as const

export function canPerformAction(role: string, action: string): boolean {
  if (role === 'admin') return true
  if (JUNIOR_RESTRICTED.includes(action as (typeof JUNIOR_RESTRICTED)[number]) && role === 'junior') return false
  return (ROLE_HIERARCHY[role] ?? 0) >= 1 // staff
}

export function hasMinimumRole(userRole: string, requiredRole: string): boolean {
  return (ROLE_HIERARCHY[userRole] ?? 0) >= (ROLE_HIERARCHY[requiredRole] ?? 99)
}
