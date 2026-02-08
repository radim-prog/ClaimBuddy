import { createClient } from '@supabase/supabase-js'

// Shared Supabase admin client (service_role key - bypasses RLS)
// Used by all server-side store modules
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
