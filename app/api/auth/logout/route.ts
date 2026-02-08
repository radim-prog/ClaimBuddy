import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { COOKIE_NAME } from '@/lib/auth'

export async function POST() {
  cookies().delete(COOKIE_NAME)
  return NextResponse.redirect(new URL('/auth/login', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3003'))
}

// Also support GET for simple logout links
export async function GET(request: Request) {
  cookies().delete(COOKIE_NAME)
  const url = new URL('/auth/login', request.url)
  return NextResponse.redirect(url)
}
