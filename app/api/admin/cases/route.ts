import { NextRequest } from 'next/server';
import { listNotionCasesForAdmin } from '@/lib/notion';
import { errorResponse, successResponse } from '@/lib/api-helpers';
import { requireAdminRequest } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  const unauthorized = requireAdminRequest(request);
  if (unauthorized) return unauthorized;

  try {
    const status = request.nextUrl.searchParams.get('status') || undefined;
    const priority = request.nextUrl.searchParams.get('priority') || undefined;
    const q = request.nextUrl.searchParams.get('q') || undefined;
    const limitRaw = request.nextUrl.searchParams.get('limit') || '100';
    const limit = Math.min(200, Math.max(1, Number(limitRaw) || 100));

    const cases = await listNotionCasesForAdmin(limit, status, q, priority);
    return successResponse({ cases });
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to load admin cases', 500);
  }
}
