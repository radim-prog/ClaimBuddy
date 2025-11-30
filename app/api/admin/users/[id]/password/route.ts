import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@/lib/supabase-server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// PATCH /api/admin/users/[id]/password - Reset user password
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()

    // Check if current user is admin
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })
    }

    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', authUser.id)
      .single()

    if (currentUser?.role !== 'admin') {
      return NextResponse.json({ error: 'Nemáte oprávnění' }, { status: 403 })
    }

    const body = await request.json()
    const { password } = body

    if (!password || password.length < 3) {
      return NextResponse.json(
        { error: 'Heslo musí mít alespoň 3 znaky' },
        { status: 400 }
      )
    }

    // Check if user exists
    const { data: targetUser } = await supabase
      .from('users')
      .select('id, name')
      .eq('id', params.id)
      .single()

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Uživatel nenalezen' },
        { status: 404 }
      )
    }

    // Use admin client to update password
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      params.id,
      { password }
    )

    if (updateError) {
      console.error('Password update error:', updateError)
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Heslo pro uživatele ${targetUser.name} bylo změněno`
    })
  } catch (error: any) {
    console.error('PATCH password error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
