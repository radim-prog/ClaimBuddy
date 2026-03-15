import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { generatePohodaXmlFromDocuments, type ExtractedDocumentForExport } from '@/lib/pohoda-xml'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const { companyId } = await params

  const searchParams = req.nextUrl.searchParams
  const ids = searchParams.get('ids')
  const period = searchParams.get('period')

  if (!ids && !period) {
    return NextResponse.json({ error: 'Missing ids or period parameter' }, { status: 400 })
  }

  // Build query
  let query = supabaseAdmin
    .from('documents')
    .select('id, document_number, variable_symbol, constant_symbol, date_issued, date_due, date_tax, supplier_name, supplier_ico, supplier_dic, total_without_vat, total_vat, total_with_vat, currency, payment_type, ocr_data')
    .eq('company_id', companyId)
    .in('status', ['extracted', 'approved'])

  if (ids) {
    query = query.in('id', ids.split(','))
  }
  if (period) {
    query = query.eq('period', period)
  }

  const { data: docs, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!docs || docs.length === 0) {
    return NextResponse.json({ error: 'No documents found' }, { status: 404 })
  }

  // Fetch company info for myIdentity
  const { data: company } = await supabaseAdmin
    .from('companies')
    .select('name, ico, dic, address')
    .eq('id', companyId)
    .single()

  // Map documents to export format
  const exportDocs: ExtractedDocumentForExport[] = docs.map(doc => {
    const ocrData = doc.ocr_data as Record<string, any> | null
    const supplier = ocrData?.supplier as Record<string, any> | undefined

    return {
      id: doc.id,
      document_number: doc.document_number,
      variable_symbol: doc.variable_symbol,
      constant_symbol: doc.constant_symbol,
      date_issued: doc.date_issued,
      date_due: doc.date_due,
      date_tax: doc.date_tax,
      supplier_name: doc.supplier_name || supplier?.name || null,
      supplier_ico: doc.supplier_ico || supplier?.ico || null,
      supplier_dic: doc.supplier_dic || supplier?.dic || null,
      supplier_address: supplier?.address || null,
      supplier_bank_account: supplier?.bank_account || null,
      total_without_vat: doc.total_without_vat,
      total_vat: doc.total_vat,
      total_with_vat: doc.total_with_vat,
      currency: doc.currency || 'CZK',
      payment_type: doc.payment_type,
      items: (ocrData?.items as any[])?.map(item => ({
        description: item.description || '',
        quantity: Number(item.quantity) || 1,
        unit: item.unit || 'ks',
        unit_price: Number(item.unit_price) || 0,
        vat_rate: item.vat_rate ?? 0,
        total_without_vat: Number(item.total_without_vat || item.total_price || 0),
        total_with_vat: Number(item.total_with_vat || item.total_price || 0),
      })) || [],
    }
  })

  const clientCompany = company ? {
    name: company.name,
    ico: company.ico,
    dic: company.dic || undefined,
    address: typeof company.address === 'string'
      ? company.address
      : company.address
        ? `${company.address.street || ''}, ${company.address.zip || ''} ${company.address.city || ''}`.trim()
        : undefined,
  } : undefined

  const xml = generatePohodaXmlFromDocuments(exportDocs, clientCompany)
  const fileName = period
    ? `pohoda-prijate-${period}.xml`
    : `pohoda-prijate-${new Date().toISOString().slice(0, 10)}.xml`

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    },
  })
}
