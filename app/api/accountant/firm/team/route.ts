import { NextRequest, NextResponse } from 'next/server'
import { getFirmId, isTenantAdmin } from '@/lib/firm-scope'
import { getFirmUsers, checkFirmUserLimit, assignUserToFirm } from '@/lib/tenant-store'
import { createUser } from '@/lib/user-store'
import { hashPassword } from '@/lib/auth'
import { getDefaultPermissions } from '@/lib/permissions'
import type { UserRole } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET — list firm team members
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const firmId = getFirmId(request)
  if (!firmId) return NextResponse.json({ error: 'No firm assigned' }, { status: 400 })

  const users = await getFirmUsers(firmId)
  return NextResponse.json({ users })
}

// POST — add a new team member
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isTenantAdmin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const firmId = getFirmId(request)
  if (!firmId) return NextResponse.json({ error: 'No firm assigned' }, { status: 400 })

  // Check plan limit
  const limitCheck = await checkFirmUserLimit(firmId)
  if (!limitCheck.allowed) {
    return NextResponse.json({
      error: `Limit uživatelů dosažen (${limitCheck.current}/${limitCheck.limit}). Upgradujte plán.`,
    }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { name, email, loginName, role, password, compensationType, compensationAmount } = body as {
      name: string
      email: string
      loginName: string
      role: UserRole
      password: string
      compensationType?: 'hourly' | 'monthly'
      compensationAmount?: number
    }

    if (!name || !email || !loginName || !password) {
      return NextResponse.json({ error: 'Všechna pole jsou povinná' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Heslo musí mít alespoň 6 znaků' }, { status: 400 })
    }

    const allowedRoles: UserRole[] = ['accountant', 'assistant']
    const safeRole = allowedRoles.includes(role) ? role : 'accountant'

    const passwordHash = await hashPassword(password)
    const permissions = getDefaultPermissions(safeRole)

    const user = await createUser({
      name,
      email,
      login_name: loginName,
      role: safeRole,
      password_hash: passwordHash,
      permissions,
      compensation_type: compensationType,
      compensation_amount: compensationAmount,
      firm_id: firmId,
    })

    return NextResponse.json({ user }, { status: 201 })
  } catch (e) {
    const msg = (e as Error).message
    if (msg.includes('duplicate key') || msg.includes('unique')) {
      return NextResponse.json({ error: 'Uživatel s tímto přihlašovacím jménem nebo emailem již existuje' }, { status: 409 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
