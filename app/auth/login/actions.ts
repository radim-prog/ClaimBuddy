'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

export async function login(formData: FormData) {
  const username = formData.get('username') as string
  const password = formData.get('password') as string

  if (!username || !password) {
    return { error: 'Jméno a heslo jsou povinné' }
  }

  // Use service role for user lookup (bypasses RLS)
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Find user by name to get their internal email
  const { data: userData, error: userError } = await adminSupabase
    .from('users')
    .select('email')
    .eq('name', username)
    .single()

  if (userError || !userData) {
    return { error: 'Neplatné jméno nebo heslo' }
  }

  // Use regular client for auth
  const supabase = createServerClient()

  // Login with internal email
  const { data, error } = await supabase.auth.signInWithPassword({
    email: userData.email,
    password,
  })

  if (error) {
    console.error('Login error:', error)
    return { error: 'Neplatné jméno nebo heslo' }
  }

  if (!data.user) {
    return { error: 'Přihlášení selhalo' }
  }

  // Get user role (we already have it from the first query, just fetch again to be sure)
  const { data: roleData, error: roleError } = await supabase
    .from('users')
    .select('role')
    .eq('id', data.user.id)
    .single()

  // Redirect podle role
  const role = roleData?.role || 'client'

  revalidatePath('/', 'layout')

  if (role === 'accountant' || role === 'admin') {
    redirect('/accountant/dashboard')
  } else {
    redirect('/client/dashboard')
  }
}

export async function logout() {
  const supabase = createServerClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Logout error:', error)
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}
