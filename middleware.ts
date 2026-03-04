import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Notion mode: no auth gating in middleware.
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
