import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes - no auth needed
  const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/legal'];
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Protected routes - verify token
  const authHeader = request.headers.get('authorization');
  const sessionCookie = request.cookies.get('session')?.value ||
                        request.cookies.get('__session')?.value;

  try {
    // Get token from header or cookie
    const token = authHeader?.substring(7) || sessionCookie;

    if (!token) {
      throw new Error('No authentication token');
    }

    // Verify Firebase ID token
    const decodedToken = await adminAuth.verifyIdToken(token);

    // RBAC - Check admin routes
    if (pathname.startsWith('/admin')) {
      // Get user role from Firestore
      const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
      const userData = userDoc.data();

      if (userData?.role !== 'admin') {
        console.log(`Access denied: User ${decodedToken.uid} is not admin`);
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }

    // Add user ID to headers for API routes
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', decodedToken.uid);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

  } catch (error) {
    console.error('Auth middleware error:', error);

    // Redirect to login with return URL
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
