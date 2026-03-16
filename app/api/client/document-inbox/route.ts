import { NextRequest, NextResponse } from 'next/server'
import { canAccessCompany } from '@/lib/access-check'
import { getDocumentInbox, getDocumentInboxItems } from '@/lib/document-inbox-store'

export const dynamic = 'force-dynamic'

// GET: Client read-only — see their inbox email + recent items
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('company_id')

    if (!companyId) {
      return NextResponse.json({ error: 'Missing company_id' }, { status: 400 })
    }

    const userRole = request.headers.get('x-user-role')
    const impersonate = request.headers.get('x-impersonate-company')
    if (!(await canAccessCompany(userId, userRole, companyId, impersonate))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const inbox = await getDocumentInbox(companyId)
    if (!inbox) {
      return NextResponse.json({ inbox: null, items: [] })
    }

    const items = await getDocumentInboxItems(companyId, undefined, 20)

    return NextResponse.json({
      inbox: {
        email_address: inbox.email_address,
        is_active: inbox.is_active,
      },
      items: items.map(i => ({
        id: i.id,
        filename: i.filename,
        from_name: i.from_name,
        subject: i.subject,
        received_at: i.received_at,
        status: i.status,
        created_at: i.created_at,
      })),
    })
  } catch (error) {
    console.error('[ClientDocInbox] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
