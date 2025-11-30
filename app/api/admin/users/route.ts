import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@/lib/supabase-server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// GET /api/admin/users - List all users
export async function GET() {
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

    // Get all users
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, role, created_at, last_login_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Users fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ users })
  } catch (error: any) {
    console.error('GET users error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/admin/users - Create new user
export async function POST(request: Request) {
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
    const { name, password, role } = body

    if (!name || !password || !role) {
      return NextResponse.json(
        { error: 'Jméno, heslo a role jsou povinné' },
        { status: 400 }
      )
    }

    if (!['client', 'accountant', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Neplatná role' },
        { status: 400 }
      )
    }

    // Check if user with this name already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('name', name)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'Uživatel s tímto jménem už existuje' },
        { status: 400 }
      )
    }

    // Use admin client to create auth user
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Generate internal email from name
    const email = `${name.toLowerCase().replace(/\s+/g, '')}@internal.local`

    // Create auth user
    const { data: newAuthUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name
      }
    })

    if (authError || !newAuthUser.user) {
      console.error('Auth error:', authError)
      return NextResponse.json(
        { error: authError?.message || 'Chyba při vytváření auth uživatele' },
        { status: 500 }
      )
    }

    // Create user record
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        id: newAuthUser.user.id,
        email,
        name,
        role
      })
      .select()
      .single()

    if (userError) {
      console.error('User error:', userError)
      // Try to delete auth user if database insert fails
      await supabaseAdmin.auth.admin.deleteUser(newAuthUser.user.id)
      return NextResponse.json(
        { error: userError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      user: newUser
    })
  } catch (error: any) {
    console.error('POST user error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
