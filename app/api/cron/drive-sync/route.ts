import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { syncCompanyIncremental } from '@/lib/drive-sync-store'
import { verifyCronAuth } from '@/lib/cron-auth'

export const dynamic = 'force-dynamic'

// POST - Cron job: incremental sync for all mapped companies
export async function POST(request: NextRequest) {
  const authError = verifyCronAuth(request)
  if (authError) return authError

  try {
    // Get all companies with a mapped Google Drive folder
    const { data: companies, error: queryError } = await supabaseAdmin
      .from('companies')
      .select('id, name')
      .not('google_drive_folder_id', 'is', null)

    if (queryError) {
      throw new Error(`Query companies failed: ${queryError.message}`)
    }

    const results: Array<{
      companyId: string
      companyName: string
      result?: { added: number; updated: number; deleted: number; errors: number; duration_ms: number }
      error?: string
    }> = []

    let synced = 0
    let failed = 0

    for (const company of companies || []) {
      try {
        const result = await syncCompanyIncremental(company.id)
        results.push({ companyId: company.id, companyName: company.name, result })
        synced++
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        results.push({ companyId: company.id, companyName: company.name, error: message })
        failed++
      }
    }

    return NextResponse.json({
      results,
      total: (companies || []).length,
      synced,
      failed,
    })
  } catch (error) {
    console.error('Cron drive-sync error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
