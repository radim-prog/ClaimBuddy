'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase-server'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email a heslo jsou povinné' }
  }

  const supabase = createServerClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('Login error:', error)
    return { error: error.message }
  }

  if (!data.user) {
    return { error: 'Přihlášení selhalo' }
  }

  // Získat user role z databáze
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', data.user.id)
    .single()

  if (userError) {
    console.error('User fetch error:', userError)
    // Pokud user nemá záznam v users tabulce, vytvoříme ho s default rolí
    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id: data.user.id,
        email: data.user.email!,
        name: data.user.user_metadata.name || data.user.email!.split('@')[0],
        role: 'client', // Default role
      })

    if (insertError) {
      console.error('User insert error:', insertError)
    }

    // Redirect na client dashboard jako fallback
    revalidatePath('/', 'layout')
    redirect('/client/dashboard')
  }

  // Redirect podle role
  const role = userData?.role || 'client'

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
  redirect('/auth/login')
}
