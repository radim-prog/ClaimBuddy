import { supabaseAdmin } from '@/lib/supabase-admin'

interface ErrorLogEntry {
  level?: 'error' | 'warn' | 'info'
  message: string
  stack?: string | null
  digest?: string | null
  url?: string | null
  source?: string | null
  user_id?: string | null
  metadata?: Record<string, unknown>
}

export async function logError(entry: ErrorLogEntry): Promise<void> {
  try {
    await supabaseAdmin.from('error_logs').insert({
      level: entry.level || 'error',
      message: entry.message.slice(0, 2000),
      stack: entry.stack?.slice(0, 5000) || null,
      digest: entry.digest || null,
      url: entry.url || null,
      source: entry.source || null,
      user_id: entry.user_id || null,
      metadata: entry.metadata || {},
    })
  } catch {
    console.error('[error-logger] Failed to write to Supabase:', entry.message)
  }
}
