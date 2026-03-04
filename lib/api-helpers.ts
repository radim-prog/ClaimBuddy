import { NextRequest } from 'next/server';

export function getClientIp(request: NextRequest) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

export function errorResponse(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export function successResponse(data: any, status = 200) {
  return Response.json(data, { status });
}

export function isAdminRequest(request: NextRequest) {
  const key = process.env.ADMIN_API_KEY;
  if (!key) return false;
  const provided = request.headers.get('x-admin-key');
  return provided === key;
}
