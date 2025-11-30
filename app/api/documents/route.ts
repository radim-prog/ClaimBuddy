import { NextResponse } from 'next/server'
import { mockDocuments } from '@/lib/mock-data'

// DEMO MODE - Using mock data instead of Supabase
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')
    const period = searchParams.get('period')

    // Filter documents based on query params
    let filteredDocuments = mockDocuments.filter(d => !d.deleted_at)

    if (companyId) {
      filteredDocuments = filteredDocuments.filter(d => d.company_id === companyId)
    }

    if (period) {
      filteredDocuments = filteredDocuments.filter(d => d.period === period)
    }

    // Sort by upload date (newest first)
    filteredDocuments.sort((a, b) =>
      new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
    )

    return NextResponse.json({
      documents: filteredDocuments,
      count: filteredDocuments.length,
    })
  } catch (error) {
    console.error('Documents API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
