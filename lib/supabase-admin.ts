import { createClient } from '@supabase/supabase-js'
import { requireDatabaseConfig } from '@/lib/database-config'

const config = requireDatabaseConfig()

// Shared Supabase admin client (service_role key - bypasses RLS)
// Used by all server-side store modules
export const supabaseAdmin = createClient(
  config.url,
  config.serviceRoleKey
)
