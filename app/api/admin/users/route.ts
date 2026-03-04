import { NextRequest } from 'next/server';
import { requireAdminRequest } from '@/lib/admin-auth';
import { errorResponse, successResponse } from '@/lib/api-helpers';
import { listNotionCasesForAdmin } from '@/lib/notion';

export async function GET(request: NextRequest) {
  const unauthorized = requireAdminRequest(request);
  if (unauthorized) return unauthorized;

  try {
    const items = (await listNotionCasesForAdmin(500)) as any[];
    const counters = new Map<string, { id: string; name: string; caseCount: number }>();

    for (const item of items) {
      const name = (item.assignee || '').trim();
      if (!name) continue;

      const existing = counters.get(name) || { id: name.toLowerCase().replace(/\s+/g, '-'), name, caseCount: 0 };
      existing.caseCount += 1;
      counters.set(name, existing);
    }

    return successResponse({ users: Array.from(counters.values()).sort((a, b) => b.caseCount - a.caseCount) });
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to load users', 500);
  }
}
