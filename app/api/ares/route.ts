import { NextRequest, NextResponse } from 'next/server'
import { lookupByIco, searchByName, validateIco } from '@/lib/ares'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const ico = searchParams.get('ico')
  const search = searchParams.get('search')

  try {
    if (ico) {
      // Lookup by IČO
      if (!validateIco(ico)) {
        return NextResponse.json({ error: 'Neplatné IČO (musí být 8 číslic s platným kontrolním součtem)' }, { status: 400 })
      }

      const result = await lookupByIco(ico)
      if (!result) {
        return NextResponse.json({ error: 'Firma nenalezena v ARES' }, { status: 404 })
      }

      return NextResponse.json(result)
    }

    if (search) {
      if (search.trim().length < 2) {
        return NextResponse.json({ error: 'Hledaný výraz musí mít alespoň 2 znaky' }, { status: 400 })
      }

      const results = await searchByName(search.trim(), 10)
      return NextResponse.json({ results })
    }

    return NextResponse.json({ error: 'Zadejte parametr ico nebo search' }, { status: 400 })
  } catch (error) {
    console.error('ARES API proxy error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Chyba při komunikaci s ARES' },
      { status: 502 }
    )
  }
}
