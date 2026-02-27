import { NextRequest, NextResponse } from 'next/server'
import { searchDocuments } from '@/lib/document-store'
import type { DocumentFilters, SortConfig } from '@/lib/types/document-register'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { companyId } = params
  const { searchParams } = new URL(request.url)

  const filters: DocumentFilters = {
    search: searchParams.get('q') || '',
    types: searchParams.getAll('type').filter(Boolean) as DocumentFilters['types'],
    statuses: searchParams.getAll('status').filter(Boolean) as DocumentFilters['statuses'],
    dateFrom: searchParams.get('date_from') || null,
    dateTo: searchParams.get('date_to') || null,
    amountMin: searchParams.get('amount_min') ? Number(searchParams.get('amount_min')) : null,
    amountMax: searchParams.get('amount_max') ? Number(searchParams.get('amount_max')) : null,
    period: searchParams.get('period') || null,
  }

  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const perPage = Math.min(100, Math.max(1, Number(searchParams.get('per_page')) || 50))

  const sort: SortConfig = {
    field: searchParams.get('sort_by') || 'uploaded_at',
    dir: (searchParams.get('sort_dir') === 'asc' ? 'asc' : 'desc'),
  }

  try {
    const result = await searchDocuments(companyId, filters, page, perPage, sort)
    return NextResponse.json(result)
  } catch (err) {
    console.error('Document search error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
