import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { setAdminSessionCookie, validateAdminPassword } from '@/lib/admin-auth';

const loginSchema = z.object({
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: 'Invalid payload' }, { status: 400 });
  }

  if (!validateAdminPassword(parsed.data.password)) {
    return Response.json({ error: 'Neplatné heslo' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  setAdminSessionCookie(response);
  return response;
}
