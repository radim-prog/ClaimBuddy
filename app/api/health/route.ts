import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const checks: Record<string, { status: string; message?: string }> = {}

  // Check Supabase connection
  try {
    const { count, error } = await supabaseAdmin
      .from('companies')
      .select('*', { count: 'exact', head: true })
    if (error) throw error
    checks.supabase = { status: 'ok', message: `${count} companies` }
  } catch (err) {
    checks.supabase = { status: 'error', message: (err as Error).message }
  }

  const allOk = Object.values(checks).every(c => c.status === 'ok')

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
