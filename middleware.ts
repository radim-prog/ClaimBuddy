import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// NOTE: Firebase Admin cannot be used in Edge Runtime (middleware)
// Token verification is done in API routes which run in Node.js runtime

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes - no auth needed
  const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/legal'];
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Protected routes - check for auth token
  const authHeader = request.headers.get('authorization');
  const sessionCookie = request.cookies.get('session')?.value ||
                        request.cookies.get('__session')?.value;

  const token = authHeader?.substring(7) || sessionCookie;

  if (!token) {
    // No token - redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Token exists - let the request through
  // Actual token verification happens in API routes (Node.js runtime with Firebase Admin)
  // Admin RBAC is checked client-side via AuthProvider
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
