import { NextRequest, NextResponse } from 'next/server'
import { getAllUsers, createUser } from '@/lib/user-store'
import { hashPassword } from '@/lib/auth'
import { getDefaultPermissions } from '@/lib/permissions'
import { getFirmId } from '@/lib/firm-scope'
import type { UserRole } from '@/lib/auth'
import type { UserPermissions } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const userRole = request.headers.get('x-user-role')
  if (userRole !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const firmId = getFirmId(request)
    const users = await getAllUsers(firmId)
    return NextResponse.json({ users })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const userRole = request.headers.get('x-user-role')
  if (userRole !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { name, email, loginName, role, password, permissions, compensationType, compensationAmount } = body as {
      name: string
      email: string
      loginName: string
      role: UserRole
      password: string
      permissions?: UserPermissions
      compensationType?: 'hourly' | 'monthly'
      compensationAmount?: number
    }

    // Validation
    if (!name || !email || !loginName || !role || !password) {
      return NextResponse.json(
        { error: 'Všechna pole jsou povinná (name, email, loginName, role, password)' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Heslo musí mít alespoň 6 znaků' },
        { status: 400 }
      )
    }

    if (!['client', 'accountant', 'admin', 'assistant'].includes(role)) {
      return NextResponse.json(
        { error: 'Neplatná role' },
        { status: 400 }
      )
    }

    const passwordHash = await hashPassword(password)
    const userPermissions = permissions ?? getDefaultPermissions(role)

    const user = await createUser({
      name,
      email,
      login_name: loginName,
      role,
      password_hash: passwordHash,
      permissions: userPermissions,
      compensation_type: compensationType,
      compensation_amount: compensationAmount,
    })

    return NextResponse.json(user, { status: 201 })
  } catch (e) {
    const msg = (e as Error).message
    if (msg.includes('duplicate key') || msg.includes('unique')) {
      return NextResponse.json(
        { error: 'Uživatel s tímto přihlašovacím jménem nebo emailem již existuje' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
