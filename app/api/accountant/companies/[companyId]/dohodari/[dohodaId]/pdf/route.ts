import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { isStaffRole } from '@/lib/access-check'
import { getDohodaById, getVykazy } from '@/lib/dohodari-store-db'
import { supabaseAdmin } from '@/lib/supabase-admin'
import {
  DohodaPDF,
  VykazPracePDF,
  PotvrzeniPrijmuPDF,
} from '@/lib/pdf/dohoda-template'
import type { DohodaDocType } from '@/lib/types/dohodari'

export const dynamic = 'force-dynamic'

// GET — generate PDF for an agreement
// ?type=dohoda|vykaz_prace|potvrzeni_prijmu&period=YYYY-MM (for vykaz/potvrzeni)
export async function GET(
  request: NextRequest,
  { params }: { params: { companyId: string; dohodaId: string } }
) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { searchParams } = new URL(request.url)
    const docType = (searchParams.get('type') || 'dohoda') as DohodaDocType
    const period = searchParams.get('period') || undefined

    // Fetch the agreement with employee data
    const dohoda = await getDohodaById(params.dohodaId, params.companyId)
    if (!dohoda) return NextResponse.json({ error: 'Dohoda not found' }, { status: 404 })

    // Fetch company info
    const { data: company } = await supabaseAdmin
      .from('companies')
      .select('name, ico, dic, address, city, zip')
      .eq('id', params.companyId)
      .single()

    if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 })

    let pdfBuffer: Buffer

    if (docType === 'dohoda') {
      pdfBuffer = await renderToBuffer(
        DohodaPDF({ dohoda, company }) as any
      )
    } else if (docType === 'vykaz_prace' && period) {
      const vykazy = await getVykazy(params.dohodaId, {})
      const vykaz = vykazy.find(v => v.period === period)
      if (!vykaz) return NextResponse.json({ error: 'Vykaz not found for period' }, { status: 404 })

      pdfBuffer = await renderToBuffer(
        VykazPracePDF({ dohoda, company, vykaz }) as any
      )
    } else if (docType === 'potvrzeni_prijmu') {
      const vykazy = await getVykazy(params.dohodaId, {})
      pdfBuffer = await renderToBuffer(
        PotvrzeniPrijmuPDF({ dohoda, company, vykazy }) as any
      )
    } else {
      return NextResponse.json({ error: 'Invalid type or missing period' }, { status: 400 })
    }

    const fileName = `${docType}_${dohoda.employee?.last_name || 'doc'}_${period || 'all'}.pdf`

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${fileName}"`,
      },
    })
  } catch (error) {
    console.error('Dohodari PDF error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
