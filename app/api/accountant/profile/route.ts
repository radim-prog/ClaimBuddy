import { NextRequest, NextResponse } from 'next/server'
import { getUserById, updateUser } from '@/lib/user-store'
import { hashPassword, verifyPassword } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await getUserById(userId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: (user as any).phone || '',
      ic: (user as any).ic || '',
      address: (user as any).address || '',
    })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, email, phone, ic, address, currentPassword, newPassword } = body as {
      name?: string
      email?: string
      phone?: string
      ic?: string
      address?: string
      currentPassword?: string
      newPassword?: string
    }

    const updates: Record<string, unknown> = {}
    if (name) updates.name = name
    if (email) updates.email = email
    if (phone !== undefined) updates.phone = phone
    if (ic !== undefined) updates.ic = ic
    if (address !== undefined) updates.address = address

    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Zadejte současné heslo' }, { status: 400 })
      }
      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'Nové heslo musí mít alespoň 6 znaků' }, { status: 400 })
      }

      const user = await getUserById(userId)
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      const valid = await verifyPassword(currentPassword, user.password_hash)
      if (!valid) {
        return NextResponse.json({ error: 'Nesprávné současné heslo' }, { status: 403 })
      }

      updates.password_hash = await hashPassword(newPassword)
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Žádné změny' }, { status: 400 })
    }

    const user = await updateUser(userId, updates)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: (user as any).phone || '',
      ic: (user as any).ic || '',
      address: (user as any).address || '',
    })
  } catch (e) {
    const msg = (e as Error).message
    if (msg.includes('duplicate key') || msg.includes('unique')) {
      return NextResponse.json({ error: 'Email je již použit jiným účtem' }, { status: 409 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
