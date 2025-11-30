import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Check if any admin exists in Auth (not just in users table)
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    const adminInAuth = authUsers?.users?.some(u =>
      u.email === 'radim@internal.local' || u.user_metadata?.name === 'Radim'
    )

    if (adminInAuth) {
      return NextResponse.json(
        { error: 'Admin už existuje v Auth' },
        { status: 400 }
      )
    }

    // Clean up orphaned user record if exists
    await supabase
      .from('users')
      .delete()
      .eq('email', 'radim@internal.local')

    // Create auth user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: 'radim@internal.local',
      password: 'admin',
      email_confirm: true,
      user_metadata: {
        name: 'Radim'
      }
    })

    if (authError || !authUser.user) {
      console.error('Auth error:', authError)
      return NextResponse.json(
        { error: authError?.message || 'Chyba při vytváření auth uživatele' },
        { status: 500 }
      )
    }

    // Create user record
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: authUser.user.id,
        email: 'radim@internal.local',
        name: 'Radim',
        role: 'admin'
      })

    if (userError) {
      console.error('User error:', userError)
      return NextResponse.json(
        { error: userError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authUser.user.id,
        name: 'Radim',
        email: 'radim@internal.local'
      }
    })
  } catch (error: any) {
    console.error('Setup error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
