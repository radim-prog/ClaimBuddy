import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/**
 * GET /api/extraction/clients
 * List clients with their document extraction stats
 */
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const filter = new URL(request.url).searchParams.get('filter') || 'all'

  try {
    // Get all active companies
    const { data: companies } = await supabaseAdmin
      .from('companies')
      .select('id, name, ico')
      .neq('status', 'inactive')
      .order('name')

    if (!companies) {
      return NextResponse.json({ clients: [] })
    }

    // Get document counts per company
    const { data: documents } = await supabaseAdmin
      .from('documents')
      .select('id, company_id, ocr_processed, ocr_status, status')
      .is('deleted_at', null)

    const docs = documents || []

    const clients = companies.map(company => {
      const companyDocs = docs.filter(d => d.company_id === company.id)
      const uploaded = companyDocs.filter(d => d.status === 'uploaded' && !d.ocr_processed).length
      const extracted = companyDocs.filter(d => d.ocr_processed && d.status !== 'approved').length
      const approved = companyDocs.filter(d => d.status === 'approved').length
      const errors = companyDocs.filter(d => d.ocr_status === 'error').length
      const total = companyDocs.length

      return {
        id: company.id,
        name: company.name,
        ico: company.ico,
        total,
        uploaded,
        extracted,
        approved,
        errors,
      }
    })

    // Apply filter
    let filtered = clients
    if (filter === 'unextracted') {
      filtered = clients.filter(c => c.uploaded > 0)
    } else if (filter === 'unapproved') {
      filtered = clients.filter(c => c.extracted > 0)
    } else if (filter === 'errors') {
      filtered = clients.filter(c => c.errors > 0)
    } else if (filter === 'has_docs') {
      filtered = clients.filter(c => c.total > 0)
    }

    return NextResponse.json({ clients: filtered })
  } catch (error) {
    console.error('[Extraction Clients] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
  }
}
