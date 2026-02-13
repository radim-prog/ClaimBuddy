import { NextRequest, NextResponse } from 'next/server'
import { getActivities, getReminders, addReminder } from '@/lib/activity-store-db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    const [activities, reminders] = await Promise.all([
      getActivities(limit),
      getReminders(limit),
    ])

    return NextResponse.json({
      activities,
      reminders,
    })
  } catch (error) {
    console.error('Activities API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { company_id, company_name, period, type, channel, sent_by, notes } = body

    if (!company_id || !company_name || !period) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const reminder = await addReminder({
      company_id,
      company_name,
      period,
      type: type || 'missing_docs',
      channel: channel || 'email',
      sent_by: sent_by || request.headers.get('x-user-name') || 'Účetní',
      notes,
    })

    return NextResponse.json({ reminder })
  } catch (error) {
    console.error('Activities POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
