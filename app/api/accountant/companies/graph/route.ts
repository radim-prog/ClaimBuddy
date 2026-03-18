import { NextRequest, NextResponse } from 'next/server'
import {
  getCompanyGraphData,
  createOwnership,
  updateOwnership,
  deleteOwnership,
  updateCompanyType,
} from '@/lib/company-graph-store'
import { getFirmId } from '@/lib/firm-scope'

export const dynamic = 'force-dynamic'

/**
 * GET /api/accountant/companies/graph
 * Returns full graph data: companies (nodes) + ownership (edges) + user layout
 */
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const firmId = getFirmId(request)
    const graphData = await getCompanyGraphData(userId, firmId)

    return NextResponse.json(graphData)
  } catch (error) {
    console.error('[graph/GET]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/accountant/companies/graph
 * Actions: create_ownership, update_ownership, delete_ownership, update_type
 */
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const staffRoles = ['admin', 'accountant', 'senior', 'assistant']
  if (!userRole || !staffRoles.includes(userRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'create_ownership': {
        const { parent_company_id, child_company_id, share_percentage, relationship_type, notes } = body
        if (!parent_company_id || !child_company_id) {
          return NextResponse.json({ error: 'parent_company_id and child_company_id are required' }, { status: 400 })
        }
        if (parent_company_id === child_company_id) {
          return NextResponse.json({ error: 'Company cannot own itself' }, { status: 400 })
        }
        const ownership = await createOwnership({
          parent_company_id,
          child_company_id,
          share_percentage,
          relationship_type,
          notes,
          created_by: userId,
        })
        return NextResponse.json({ ownership })
      }

      case 'update_ownership': {
        const { ownership_id, share_percentage, relationship_type, notes } = body
        if (!ownership_id) {
          return NextResponse.json({ error: 'ownership_id is required' }, { status: 400 })
        }
        const ownership = await updateOwnership(ownership_id, {
          share_percentage,
          relationship_type,
          notes,
        })
        return NextResponse.json({ ownership })
      }

      case 'delete_ownership': {
        const { ownership_id } = body
        if (!ownership_id) {
          return NextResponse.json({ error: 'ownership_id is required' }, { status: 400 })
        }
        await deleteOwnership(ownership_id)
        return NextResponse.json({ success: true })
      }

      case 'update_type': {
        const { company_id, company_type } = body
        if (!company_id || !company_type) {
          return NextResponse.json({ error: 'company_id and company_type are required' }, { status: 400 })
        }
        await updateCompanyType(company_id, company_type)
        return NextResponse.json({ success: true })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('[graph/POST]', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
