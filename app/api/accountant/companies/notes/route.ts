import { NextRequest, NextResponse } from 'next/server'
import {
  getCompanyNotes,
  createCompanyNote,
  deleteCompanyNote,
} from '@/lib/company-graph-store'
import { getFirmId, verifyCompanyAccess } from '@/lib/firm-scope'

export const dynamic = 'force-dynamic'

/**
 * GET /api/accountant/companies/notes?company_id=X
 * Returns notes for a specific company
 */
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const companyId = request.nextUrl.searchParams.get('company_id')
  if (!companyId) {
    return NextResponse.json({ error: 'company_id is required' }, { status: 400 })
  }

  const firmId = getFirmId(request)
  if (!(await verifyCompanyAccess(companyId, firmId))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const notes = await getCompanyNotes(companyId)
    return NextResponse.json({ notes })
  } catch (error) {
    console.error('[notes/GET]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/accountant/companies/notes
 * Create a new note for a company
 */
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userName = request.headers.get('x-user-name')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { company_id, content, tags, mentions } = body

    if (!company_id) {
      return NextResponse.json({ error: 'company_id is required' }, { status: 400 })
    }
    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'content is required' }, { status: 400 })
    }

    const firmId = getFirmId(request)
    if (!(await verifyCompanyAccess(company_id, firmId))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const note = await createCompanyNote({
      company_id,
      author_id: userId,
      author_name: userName || 'Unknown',
      content: content.trim(),
      tags: tags || [],
      mentions: mentions || [],
    })

    return NextResponse.json({ note }, { status: 201 })
  } catch (error) {
    console.error('[notes/POST]', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * DELETE /api/accountant/companies/notes?id=X
 * Delete a note (only author can delete)
 */
export async function DELETE(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const noteId = request.nextUrl.searchParams.get('id')
  if (!noteId) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  try {
    await deleteCompanyNote(noteId, userId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[notes/DELETE]', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
