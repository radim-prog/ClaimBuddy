import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@/lib/supabase-server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// DELETE /api/admin/users/[id] - Delete user
export async function DELETE(
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

    // Prevent deleting yourself
    if (authUser.id === params.id) {
      return NextResponse.json(
        { error: 'Nemůžete smazat sám sebe' },
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

    // Use admin client to delete auth user
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Delete from users table (will cascade to related data if configured)
    const { error: dbError } = await supabase
      .from('users')
      .delete()
      .eq('id', params.id)

    if (dbError) {
      console.error('Database delete error:', dbError)
      return NextResponse.json(
        { error: dbError.message },
        { status: 500 }
      )
    }

    // Delete auth user
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(params.id)

    if (authError) {
      console.error('Auth delete error:', authError)
      // User record already deleted from DB, but auth deletion failed
      // This is not critical, just log it
      console.warn(`Auth user ${params.id} could not be deleted, but DB record was removed`)
    }

    return NextResponse.json({
      success: true,
      message: `Uživatel ${targetUser.name} byl smazán`
    })
  } catch (error: any) {
    console.error('DELETE user error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
