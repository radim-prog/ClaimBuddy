import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ADMIN_COOKIE_NAME, isValidAdminSessionToken } from '@/lib/admin-auth';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const sessionToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const isAuthenticated = isValidAdminSessionToken(sessionToken);

  const isAdminPage = pathname.startsWith('/admin');
  const isAdminLoginPage = pathname === '/admin/login';
  const isAdminApi = pathname.startsWith('/api/admin');
  const isAdminAuthApi = pathname.startsWith('/api/admin/auth/');

  if (isAdminPage && !isAdminLoginPage && !isAuthenticated) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/admin/login';
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminApi && !isAdminAuthApi && !isAuthenticated) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
