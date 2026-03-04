import { NextRequest, NextResponse } from 'next/server';
import { errorResponse } from '@/lib/api-helpers';

export const ADMIN_COOKIE_NAME = 'pojistna-pomoc-admin-session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function getAdminPassword() {
  return process.env.ADMIN_PANEL_PASSWORD || process.env.ADMIN_API_KEY || '';
}

function getSessionToken() {
  return process.env.ADMIN_SESSION_TOKEN || process.env.ADMIN_API_KEY || process.env.ADMIN_PANEL_PASSWORD || '';
}

export function validateAdminPassword(password: string) {
  const expected = getAdminPassword();
  return Boolean(expected) && password === expected;
}

export function isValidAdminSessionToken(token: string | undefined) {
  const expected = getSessionToken();
  return Boolean(expected) && token === expected;
}

export function setAdminSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: getSessionToken(),
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function clearAdminSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

export function requireAdminRequest(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!isValidAdminSessionToken(token)) {
    return errorResponse('Unauthorized', 401);
  }
  return null;
}
