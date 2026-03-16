import { NextResponse } from 'next/server'
import { getInsuranceCompanies } from '@/lib/insurance-store'

export const dynamic = 'force-dynamic'

// GET /api/claims/companies — public endpoint (no auth required)
// Returns list of active insurance companies for the public intake form
export async function GET() {
  try {
    const companies = await getInsuranceCompanies(true)

    // Return only essential fields for the public form (no internal data)
    const publicCompanies = companies.map(c => ({
      id: c.id,
      name: c.name,
      logo_path: c.logo_path,
    }))

    return NextResponse.json(
      { companies: publicCompanies },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    )
  } catch (error) {
    console.error('[Claims companies] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
