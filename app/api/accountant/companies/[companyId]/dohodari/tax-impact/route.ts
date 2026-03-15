import { NextRequest, NextResponse } from 'next/server'
import { isStaffRole } from '@/lib/access-check'
import { calculateTaxImpact } from '@/lib/types/dohodari'
import type { DohodaType } from '@/lib/types/dohodari'

export const dynamic = 'force-dynamic'

// GET — calculate tax impact comparison HPP vs DPP/DPC
export async function GET(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { searchParams } = new URL(request.url)
    const typ = (searchParams.get('typ') || 'dpp') as DohodaType
    const gross = Number(searchParams.get('gross') || 0)
    const prohlaseni = searchParams.get('prohlaseni') === 'true'
    const student = searchParams.get('student') === 'true'
    const children = Number(searchParams.get('children') || 0)

    if (gross <= 0) {
      return NextResponse.json({ error: 'gross must be > 0' }, { status: 400 })
    }

    const impact = calculateTaxImpact({ typ, gross, prohlaseni, student, children_count: children })

    return NextResponse.json({ impact })
  } catch (error) {
    console.error('Tax impact error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
