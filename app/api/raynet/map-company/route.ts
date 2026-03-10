import { NextRequest, NextResponse } from 'next/server'
import {
  getRaynetMappings,
  mapCompanyToRaynet,
  unmapCompanyRaynet,
  mapGroupToRaynet,
  unmapGroupRaynet,
} from '@/lib/raynet-store'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

// GET - List all companies with their Raynet mapping status + groups
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const [mappings, { data: groups }] = await Promise.all([
      getRaynetMappings(),
      supabaseAdmin
        .from('company_groups')
        .select('group_name, billing_company_id'),
    ])

    return NextResponse.json({ mappings, groups: groups || [] })
  } catch (error) {
    console.error('Raynet map-company GET error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST - Map a company (or group) to a Raynet company
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { companyId, raynetCompanyId, raynetCompanyName, groupName } = body as {
      companyId?: string
      raynetCompanyId?: number
      raynetCompanyName?: string
      groupName?: string
    }

    if (!raynetCompanyId) {
      return NextResponse.json(
        { error: 'raynetCompanyId is required' },
        { status: 400 }
      )
    }

    if (groupName) {
      // Map entire group
      await mapGroupToRaynet(groupName, raynetCompanyId)
    } else if (companyId) {
      // Map single company
      await mapCompanyToRaynet(companyId, raynetCompanyId, raynetCompanyName)
    } else {
      return NextResponse.json(
        { error: 'companyId or groupName is required' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Raynet map-company POST error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE - Disconnect a company (or group) from Raynet
export async function DELETE(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { companyId, groupName } = body as { companyId?: string; groupName?: string }

    if (groupName) {
      await unmapGroupRaynet(groupName)
    } else if (companyId) {
      await unmapCompanyRaynet(companyId)
    } else {
      return NextResponse.json({ error: 'companyId or groupName is required' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Raynet map-company DELETE error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
