import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

// GET /api/claims/check-contact?email=...&phone=...
// Non-blocking hint for the intake form — checks if contact already exists
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const email = searchParams.get('email')?.toLowerCase().trim()
  const phone = searchParams.get('phone')?.replace(/\s+/g, '').trim()

  if (!email && !phone) {
    return NextResponse.json({ exists: false })
  }

  try {
    if (email) {
      // Check users table
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', email)
        .limit(1)
        .single()

      if (user) {
        return NextResponse.json({ exists: true })
      }

      // Check companies table
      const { data: company } = await supabaseAdmin
        .from('companies')
        .select('id')
        .eq('email', email)
        .is('deleted_at', null)
        .limit(1)
        .single()

      if (company) {
        return NextResponse.json({ exists: true })
      }
    }

    if (phone) {
      // Check companies table by phone
      const { data: company } = await supabaseAdmin
        .from('companies')
        .select('id')
        .eq('phone', phone)
        .is('deleted_at', null)
        .limit(1)
        .single()

      if (company) {
        return NextResponse.json({ exists: true })
      }
    }

    return NextResponse.json({ exists: false })
  } catch {
    return NextResponse.json({ exists: false })
  }
}
