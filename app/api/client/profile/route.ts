import { NextRequest, NextResponse } from 'next/server'
import { getUserById, updateUser } from '@/lib/user-store'
import { hashPassword, verifyPassword } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await getUserById(userId)
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    login_name: user.login_name,
  })
}

export async function PATCH(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { name, email, current_password, new_password } = body

    const user = await getUserById(userId)
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const updates: Record<string, string> = {}

    if (name && name.trim()) updates.name = name.trim()
    if (email && email.trim()) updates.email = email.trim()

    if (new_password) {
      if (!current_password) {
        return NextResponse.json({ error: 'Zadejte současné heslo' }, { status: 400 })
      }
      const valid = await verifyPassword(current_password, user.password_hash)
      if (!valid) {
        return NextResponse.json({ error: 'Nesprávné současné heslo' }, { status: 400 })
      }
      if (new_password.length < 6) {
        return NextResponse.json({ error: 'Heslo musí mít alespoň 6 znaků' }, { status: 400 })
      }
      updates.password_hash = await hashPassword(new_password)
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Žádné změny' }, { status: 400 })
    }

    const updated = await updateUser(userId, updates as any)
    return NextResponse.json({
      id: updated?.id,
      name: updated?.name,
      email: updated?.email,
    })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Chyba při ukládání' }, { status: 500 })
  }
}
