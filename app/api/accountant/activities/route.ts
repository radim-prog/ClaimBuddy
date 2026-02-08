import { NextResponse } from 'next/server'
import { getActivities, getReminders } from '@/lib/activity-store-db'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
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
