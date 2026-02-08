import { NextRequest, NextResponse } from 'next/server'
import { getUserById, updateUser, deleteUser, getAllUsers } from '@/lib/user-store'
import { hashPassword } from '@/lib/auth'
import { getDefaultPermissions } from '@/lib/permissions'
import type { UserRole } from '@/lib/auth'
import type { UserPermissions } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userRole = request.headers.get('x-user-role')
  if (userRole !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  try {
    const user = await getUserById(id)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      login_name: user.login_name,
      permissions: user.permissions,
      created_at: user.created_at,
      updated_at: user.updated_at,
    })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userRole = request.headers.get('x-user-role')
  if (userRole !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  try {
    const body = await request.json()
    const { name, email, loginName, role, newPassword, permissions } = body as {
      name?: string
      email?: string
      loginName?: string
      role?: UserRole
      newPassword?: string
      permissions?: UserPermissions
    }

    // Check: cannot demote the last admin
    if (role && role !== 'admin') {
      const users = await getAllUsers()
      const admins = users.filter(u => u.role === 'admin')
      const isCurrentlyAdmin = admins.some(a => a.id === id)
      if (isCurrentlyAdmin && admins.length <= 1) {
        return NextResponse.json(
          { error: 'Nelze změnit roli posledního administrátora' },
          { status: 400 }
        )
      }
    }

    const updates: Record<string, unknown> = {}
    if (name) updates.name = name
    if (email) updates.email = email
    if (loginName) updates.login_name = loginName
    if (role) {
      updates.role = role
      // Auto-apply role preset if no custom permissions given
      if (!permissions) {
        updates.permissions = getDefaultPermissions(role)
      }
    }
    if (permissions) updates.permissions = permissions
    if (newPassword) {
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: 'Heslo musí mít alespoň 6 znaků' },
          { status: 400 }
        )
      }
      updates.password_hash = await hashPassword(newPassword)
    }

    const user = await updateUser(id, updates)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUserId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')

  if (userRole !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  // Cannot delete self
  if (id === currentUserId) {
    return NextResponse.json(
      { error: 'Nelze smazat vlastní účet' },
      { status: 400 }
    )
  }

  try {
    await deleteUser(id)
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 })
  }
}
