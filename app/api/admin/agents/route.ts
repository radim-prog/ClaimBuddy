import { NextRequest } from 'next/server';
import { requireAdminRequest } from '@/lib/admin-auth';
import { errorResponse, successResponse } from '@/lib/api-helpers';
import { listNotionCasesForAdmin } from '@/lib/notion';

export async function GET(request: NextRequest) {
  const unauthorized = requireAdminRequest(request);
  if (unauthorized) return unauthorized;

  try {
    const items = (await listNotionCasesForAdmin(300)) as any[];
    const agents = Array.from(new Set(items.map((i) => (i.assignee || '').trim()).filter(Boolean))).sort();
    return successResponse({ agents });
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to load agents', 500);
  }
}
