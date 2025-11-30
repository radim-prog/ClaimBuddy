import { NextResponse } from 'next/server'

// DEMO MODE - Simulates document approval (no real data changes)
export async function POST(
  request: Request,
  { params }: { params: { documentId: string } }
) {
  try {
    const { documentId } = params

    // In demo mode, just return success
    // In real app, this would update Supabase
    console.log(`[DEMO] Document ${documentId} approved`)

    return NextResponse.json({
      success: true,
      message: `Dokument ${documentId} byl schválen (demo režim)`
    })
  } catch (error) {
    console.error('Approve API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
