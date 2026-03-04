import { NextRequest } from 'next/server';
import { requireAdminRequest } from '@/lib/admin-auth';
import { errorResponse, successResponse } from '@/lib/api-helpers';
import { listNotionCasesForAdmin } from '@/lib/notion';

export async function GET(request: NextRequest) {
  const unauthorized = requireAdminRequest(request);
  if (unauthorized) return unauthorized;

  try {
    const cases = await listNotionCasesForAdmin(40);
    const activity = (cases as any[])
      .flatMap((item) => (item.activity || []).map((a: any) => ({ ...a, caseId: item.id, caseNumber: item.caseNumber })))
      .sort((a, b) => (a.at < b.at ? 1 : -1))
      .slice(0, 120);

    return successResponse({ activity });
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to load activity', 500);
  }
}
