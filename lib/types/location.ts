// ============================================
// LOCATION - TypeScript Types
// ============================================

export interface Location {
  id: string
  name: string
  icon?: string
  user_id?: string
  is_default: boolean
  created_at: string
}

export interface CreateLocationInput {
  name: string
  icon?: string
}
