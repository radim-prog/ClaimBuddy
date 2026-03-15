import { NextRequest, NextResponse } from 'next/server'
import { getDohodaExplanation, getDohodaInfoContent } from '@/lib/dohodari-info'
import type { DohodaType } from '@/lib/types/dohodari'

export const dynamic = 'force-dynamic'

// GET — educational info about DPP/DPC
// ?type=dpp&gross=8000&prohlaseni=false (optional query params for personalized explanation)
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const typ = searchParams.get('type') as DohodaType | null
    const gross = Number(searchParams.get('gross') || 0)

    // If specific params provided, return personalized explanation
    if (typ && gross > 0) {
      const explanation = getDohodaExplanation({
        type: typ,
        monthlyGross: gross,
        hasTaxDeclaration: searchParams.get('prohlaseni') === 'true',
        isStudent: searchParams.get('student') === 'true',
        hasOtherEmployer: searchParams.get('other_employer') === 'true',
      })
      return NextResponse.json({ explanation })
    }

    // Otherwise, return general info content
    const info = getDohodaInfoContent()
    return NextResponse.json({ info })
  } catch (error) {
    console.error('Dohodari info error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
