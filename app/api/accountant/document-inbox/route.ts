import { NextRequest, NextResponse } from 'next/server'
import { isStaffRole } from '@/lib/access-check'
import {
  getDocumentInbox,
  createDocumentInbox,
  toggleDocumentInbox,
  regenerateInboxSlug,
  getDocumentInboxItems,
  updateDocumentInboxItemStatus,
} from '@/lib/document-inbox-store'

export const dynamic = 'force-dynamic'

// GET: Get inbox + items for a company
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('company_id')
    const status = searchParams.get('status') || undefined

    if (!companyId) {
      return NextResponse.json({ error: 'Missing company_id' }, { status: 400 })
    }

    const inbox = await getDocumentInbox(companyId)
    const items = inbox ? await getDocumentInboxItems(companyId, status) : []

    return NextResponse.json({ inbox, items })
  } catch (error) {
    console.error('[AccountantDocInbox] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Create inbox / regenerate slug / toggle / update item status
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await request.json()
    const { action, company_id, inbox_id, item_id, status: itemStatus } = body

    switch (action) {
      case 'create': {
        if (!company_id) return NextResponse.json({ error: 'Missing company_id' }, { status: 400 })
        const existing = await getDocumentInbox(company_id)
        if (existing) return NextResponse.json({ inbox: existing })
        const inbox = await createDocumentInbox(company_id)
        return NextResponse.json({ inbox })
      }

      case 'regenerate': {
        if (!company_id) return NextResponse.json({ error: 'Missing company_id' }, { status: 400 })
        const inbox = await regenerateInboxSlug(company_id)
        return NextResponse.json({ inbox })
      }

      case 'toggle': {
        if (!inbox_id) return NextResponse.json({ error: 'Missing inbox_id' }, { status: 400 })
        const isActive = body.is_active ?? false
        await toggleDocumentInbox(inbox_id, isActive)
        return NextResponse.json({ success: true })
      }

      case 'update_item': {
        if (!item_id || !itemStatus) {
          return NextResponse.json({ error: 'Missing item_id or status' }, { status: 400 })
        }
        const validStatuses = ['processing', 'imported', 'failed', 'ignored']
        if (!validStatuses.includes(itemStatus)) {
          return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
        }
        await updateDocumentInboxItemStatus(item_id, itemStatus, {
          processed_by: userId,
          document_id: body.document_id,
        })
        return NextResponse.json({ success: true })
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('[AccountantDocInbox] POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
