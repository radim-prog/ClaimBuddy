import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getDatabaseConfig } from '@/lib/database-config'

export const dynamic = 'force-dynamic'

export async function GET() {
  const checks: Record<string, { status: string; message?: string }> = {}

  try {
    const config = getDatabaseConfig()
    checks.database_config = {
      status: config.usingDedicatedClaimsDatabase ? 'ok' : 'warning',
      message: config.usingDedicatedClaimsDatabase
        ? 'Dedicated claims database configured'
        : 'Using fallback database configuration',
    }
  } catch (err) {
    checks.database_config = { status: 'error', message: (err as Error).message }
  }

  try {
    const { count, error } = await supabaseAdmin
      .from('companies')
      .select('*', { count: 'exact', head: true })
    if (error) throw error
    checks.companies = { status: 'ok', message: `${count} companies` }
  } catch (err) {
    checks.companies = { status: 'error', message: (err as Error).message }
  }

  for (const [table, label] of [
    ['insurance_cases', 'cases'],
    ['documents', 'documents'],
    ['chats', 'chats'],
    ['tasks', 'tasks'],
  ] as const) {
    try {
      const { count, error } = await supabaseAdmin
        .from(table)
        .select('*', { count: 'exact', head: true })
      if (error) throw error
      checks[label] = { status: 'ok', message: `${count} rows` }
    } catch (err) {
      checks[label] = { status: 'error', message: (err as Error).message }
    }
  }

  const allOk = Object.values(checks).every(c => c.status === 'ok' || c.status === 'warning')

  return NextResponse.json(
    {
      status: allOk ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      checks,
    },
    { status: allOk ? 200 : 503 }
  )
}
