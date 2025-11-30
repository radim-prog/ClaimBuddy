import { NextResponse } from 'next/server'

// DEMO MODE - Simulates document rejection (no real data changes)
export async function POST(
  request: Request,
  { params }: { params: { documentId: string } }
) {
  try {
    const { documentId } = params
    const body = await request.json()
    const { reason } = body

    if (!reason) {
      return NextResponse.json({ error: 'Reason is required' }, { status: 400 })
    }

    // In demo mode, just return success
    // In real app, this would update Supabase
    console.log(`[DEMO] Document ${documentId} rejected with reason: ${reason}`)

    return NextResponse.json({
      success: true,
      message: `Dokument ${documentId} byl zamítnut (demo režim)`
    })
  } catch (error) {
    console.error('Reject API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
