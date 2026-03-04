import { NextRequest } from 'next/server';
import { requireAdminRequest } from '@/lib/admin-auth';
import { errorResponse, successResponse } from '@/lib/api-helpers';
import { listNotionCasesForAdmin } from '@/lib/notion';

function normalize(value: string) {
  return value.toLowerCase().trim().replace(/\s+/g, '-');
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const unauthorized = requireAdminRequest(request);
  if (unauthorized) return unauthorized;

  try {
    const items = (await listNotionCasesForAdmin(500)) as any[];
    const userCases = items.filter((item) => normalize(item.assignee || '') === params.id);

    return successResponse({
      id: params.id,
      caseCount: userCases.length,
      cases: userCases,
    });
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to load user detail', 500);
  }
}
