import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getDohody } from '@/lib/dohodari-store-db'
import type { DohodaStatus } from '@/lib/types/dohodari'

export const dynamic = 'force-dynamic'

async function getCompanyIds(userId: string, impersonateCompany: string | null): Promise<string[]> {
  if (impersonateCompany) return [impersonateCompany]
  const { data } = await supabaseAdmin
    .from('companies')
    .select('id')
    .eq('owner_id', userId)
    .is('deleted_at', null)
  return (data ?? []).map((c: any) => c.id)
}

// GET — list agreements for client's company
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const companyIds = await getCompanyIds(userId, request.headers.get('x-impersonate-company'))
    if (companyIds.length === 0) return NextResponse.json({ dohody: [] })

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as DohodaStatus | null
    const typ = searchParams.get('typ') as 'dpp' | 'dpc' | null

    const dohody = await getDohody(companyIds[0], {
      status: status || undefined,
      typ: typ || undefined,
    })

    return NextResponse.json({ dohody })
  } catch (error) {
    console.error('Client dohodari list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
