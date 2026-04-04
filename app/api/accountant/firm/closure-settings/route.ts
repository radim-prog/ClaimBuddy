import { NextRequest, NextResponse } from 'next/server'
import { getFirmId } from '@/lib/firm-scope'
import { getFirmById, updateFirm } from '@/lib/tenant-store'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const firmId = getFirmId(request)
  if (!firmId) {
    return NextResponse.json({ require_manager_approval: false })
  }

  const firm = await getFirmById(firmId)
  const workflow = (firm as any)?.settings?.closure_workflow || {}

  return NextResponse.json({
    require_manager_approval: workflow.require_manager_approval ?? false,
  })
}

export async function PUT(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (userRole !== 'admin' && userRole !== 'manager') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const firmId = getFirmId(request)
  if (!firmId) {
    return NextResponse.json({ error: 'No firm context' }, { status: 400 })
  }

  const body = await request.json()
  const { require_manager_approval } = body

  const firm = await getFirmById(firmId)
  const currentSettings = (firm as any)?.settings || {}
  const updatedSettings = {
    ...currentSettings,
    closure_workflow: {
      ...(currentSettings.closure_workflow || {}),
      require_manager_approval: !!require_manager_approval,
    },
  }

  await updateFirm(firmId, { settings: updatedSettings })

  return NextResponse.json({ success: true })
}
