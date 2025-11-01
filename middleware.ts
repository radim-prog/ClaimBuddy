import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protected routes
  const protectedPaths = ['/dashboard', '/cases', '/settings', '/admin'];
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));

  if (!isProtectedPath) {
    return NextResponse.next();
  }

  // Check for Firebase Auth token in Authorization header or cookie
  const authHeader = request.headers.get('authorization');
  const sessionCookie = request.cookies.get('session')?.value;

  // For now, allow access if coming from /login or /register (temporary)
  // In production, implement proper Firebase Admin SDK verification
  const referer = request.headers.get('referer') || '';
  if (referer.includes('/login') || referer.includes('/register')) {
    return NextResponse.next();
  }

  // If no auth token, redirect to login
  if (!authHeader && !sessionCookie) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/cases/:path*', '/settings/:path*', '/admin/:path*'],
};
