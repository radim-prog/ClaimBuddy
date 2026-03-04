import { NextRequest } from 'next/server';
import { getNotionCaseById } from '@/lib/notion';
import { errorResponse, successResponse } from '@/lib/api-helpers';
import { requireAdminRequest } from '@/lib/admin-auth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const unauthorized = requireAdminRequest(request);
  if (unauthorized) return unauthorized;

  try {
    const item = await getNotionCaseById(params.id);
    return successResponse({ case: item });
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to load case', 500);
  }
}
