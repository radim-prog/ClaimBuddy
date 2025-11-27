'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase-server'

export async function register(formData: FormData) {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  // Validace
  if (!name || !email || !password || !confirmPassword) {
    return { error: 'Všechna pole jsou povinná' }
  }

  if (password !== confirmPassword) {
    return { error: 'Hesla se neshodují' }
  }

  if (password.length < 6) {
    return { error: 'Heslo musí mít alespoň 6 znaků' }
  }

  const supabase = createServerClient()

  // Registrace pomocí Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
    },
  })

  if (authError) {
    console.error('Signup error:', authError)
    return { error: authError.message }
  }

  if (!authData.user) {
    return { error: 'Registrace selhala' }
  }

  // Vytvořit záznam v users tabulce
  const { error: userError } = await supabase
    .from('users')
    .insert({
      id: authData.user.id,
      email: authData.user.email!,
      name,
      role: 'client', // Default role je client
      phone_number: null,
    })

  if (userError) {
    console.error('User insert error:', userError)
    // Pokud už existuje (např. z triggeru), to je OK
    if (userError.code !== '23505') { // duplicate key error
      return { error: 'Nepodařilo se vytvořit uživatelský profil' }
    }
  }

  // Automaticky přihlásit
  revalidatePath('/', 'layout')

  // Redirect na client dashboard
  redirect('/client/dashboard')
}
