import { NextRequest, NextResponse } from 'next/server'
import { getFirmId, isTenantAdmin } from '@/lib/firm-scope'
import { removeUserFromFirm } from '@/lib/tenant-store'
import { updateUser, getUserById } from '@/lib/user-store'
import type { UserRole } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// PUT — update a team member
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const currentUserId = request.headers.get('x-user-id')
  if (!currentUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isTenantAdmin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const firmId = getFirmId(request)
  if (!firmId) return NextResponse.json({ error: 'No firm assigned' }, { status: 400 })

  const { userId } = await params

  // Verify user belongs to this firm
  const targetUser = await getUserById(userId)
  if (!targetUser || targetUser.firm_id !== firmId) {
    return NextResponse.json({ error: 'User not found in firm' }, { status: 404 })
  }

  try {
    const body = await request.json()
    const updates: Record<string, unknown> = {}

    if (body.name !== undefined) updates.name = body.name
    if (body.email !== undefined) updates.email = body.email
    if (body.role !== undefined) {
      const allowedRoles: UserRole[] = ['accountant', 'assistant']
      if (allowedRoles.includes(body.role)) updates.role = body.role
    }
    if (body.compensation_type !== undefined) updates.compensation_type = body.compensation_type
    if (body.compensation_amount !== undefined) updates.compensation_amount = body.compensation_amount

    const updated = await updateUser(userId, updates)
    if (!updated) {
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }

    return NextResponse.json({ user: updated })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

// DELETE — remove user from firm
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const currentUserId = request.headers.get('x-user-id')
  if (!currentUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isTenantAdmin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const firmId = getFirmId(request)
  if (!firmId) return NextResponse.json({ error: 'No firm assigned' }, { status: 400 })

  const { userId } = await params

  // Cannot remove yourself
  if (userId === currentUserId) {
    return NextResponse.json({ error: 'Nelze odebrat sám sebe' }, { status: 400 })
  }

  // Verify user belongs to this firm
  const targetUser = await getUserById(userId)
  if (!targetUser || targetUser.firm_id !== firmId) {
    return NextResponse.json({ error: 'User not found in firm' }, { status: 404 })
  }

  const success = await removeUserFromFirm(userId)
  if (!success) {
    return NextResponse.json({ error: 'Failed to remove user' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
