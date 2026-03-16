import { NextRequest, NextResponse } from 'next/server'
import { getUserById } from '@/lib/user-store'

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

    const impersonateCompany = request.headers.get('x-impersonate-company') || null

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      login_name: user.login_name,
      permissions: user.permissions,
      modules: user.modules || ['accounting'],
      impersonate_company: impersonateCompany,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
