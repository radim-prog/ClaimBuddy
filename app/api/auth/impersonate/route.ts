import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

const IMPERSONATE_COOKIE = 'impersonate_company'
const MAX_AGE = 3600 // 1 hour

export async function POST(request: NextRequest) {
  const userRole = request.headers.get('x-user-role')
  if (!userRole || !['accountant', 'admin', 'assistant'].includes(userRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { companyId } = await request.json()
  if (!companyId) {
    return NextResponse.json({ error: 'companyId is required' }, { status: 400 })
  }

  // Verify company exists
  const { data: company, error } = await supabaseAdmin
    .from('companies')
    .select('id, name')
    .eq('id', companyId)
    .is('deleted_at', null)
    .single()

  if (error || !company) {
    return NextResponse.json({ error: 'Company not found' }, { status: 404 })
  }

  // Set cookie (NOT httpOnly so client JS can read it)
  cookies().set(IMPERSONATE_COOKIE, companyId, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MAX_AGE,
    path: '/',
  })

  return NextResponse.json({
    success: true,
    company: { id: company.id, name: company.name },
    redirect: '/client/dashboard',
  })
}

export async function DELETE() {
  cookies().delete(IMPERSONATE_COOKIE)
  return NextResponse.json({ success: true })
}
