import { NextRequest, NextResponse } from 'next/server'
import { getRaynetMappings, mapCompanyToRaynet, unmapCompanyRaynet } from '@/lib/raynet-store'

export const dynamic = 'force-dynamic'

// GET - List all companies with their Raynet mapping status
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const mappings = await getRaynetMappings()
    return NextResponse.json({ mappings })
  } catch (error) {
    console.error('Raynet map-company GET error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST - Map a company to a Raynet company
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { companyId, raynetCompanyId, raynetCompanyName } = body as {
      companyId?: string
      raynetCompanyId?: number
      raynetCompanyName?: string
    }

    if (!companyId || !raynetCompanyId) {
      return NextResponse.json(
        { error: 'companyId and raynetCompanyId are required' },
        { status: 400 }
      )
    }

    await mapCompanyToRaynet(companyId, raynetCompanyId, raynetCompanyName)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Raynet map-company POST error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE - Disconnect a company from Raynet
export async function DELETE(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { companyId } = body as { companyId?: string }

    if (!companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 })
    }

    await unmapCompanyRaynet(companyId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Raynet map-company DELETE error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
