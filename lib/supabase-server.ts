import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'
import { requireDatabaseConfig } from '@/lib/database-config'

export const createServerClient = () => {
  const cookieStore = cookies()
  const config = requireDatabaseConfig()

  return createSupabaseServerClient<Database>(
    config.url,
    config.anonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set(name, value, options)
          } catch (error) {
            // Handle case where set is called from Server Component
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.delete(name)
          } catch (error) {
            // Handle case where remove is called from Server Component
          }
        },
      },
    }
  )
}
