import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Chráněné routes
  const protectedPaths = ['/dashboard', '/admin'];
  const isProtectedPath = protectedPaths.some((path) => pathname.startsWith(path));

  if (isProtectedPath) {
    // V production bychom zde kontrolovali Firebase session cookie
    // Pro development pouze kontrolujeme přítomnost auth tokenu v cookies
    const token = request.cookies.get('__session');

    if (!token) {
      // Redirect na login
      const url = new URL('/login', request.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
  }

  // Admin routes - kontrola role
  if (pathname.startsWith('/admin')) {
    // V production bychom zde ověřovali admin roli z Firebase session
    // Pro development předpokládáme že middleware na úrovni API to ošetří
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};
