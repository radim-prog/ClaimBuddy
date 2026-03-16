'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { authenticate, getRedirectPath, COOKIE_NAME, TOKEN_MAX_AGE } from '@/lib/auth'

export async function login(formData: FormData) {
  const username = formData.get('username') as string
  const password = formData.get('password') as string

  if (!username || !password) {
    return { error: 'Jméno a heslo jsou povinné' }
  }

  let result: Awaited<ReturnType<typeof authenticate>>

  try {
    result = await authenticate(username, password)
  } catch (err) {
    // authenticate() throws for status issues (pending_verification, inactive)
    return { error: err instanceof Error ? err.message : 'Přihlášení selhalo' }
  }

  if (!result) {
    return { error: 'Neplatné jméno nebo heslo' }
  }

  cookies().set(COOKIE_NAME, result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: TOKEN_MAX_AGE,
    path: '/',
  })

  redirect(getRedirectPath(result.user.role))
}

export async function logout() {
  cookies().delete(COOKIE_NAME)
  redirect('/')
}
