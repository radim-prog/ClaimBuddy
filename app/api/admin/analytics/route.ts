import { NextRequest } from 'next/server';
import { requireAdminRequest } from '@/lib/admin-auth';
import { errorResponse, successResponse } from '@/lib/api-helpers';
import { getNotionCaseAnalytics } from '@/lib/notion';

export async function GET(request: NextRequest) {
  const unauthorized = requireAdminRequest(request);
  if (unauthorized) return unauthorized;

  try {
    const analytics = await getNotionCaseAnalytics();
    return successResponse(analytics);
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to load analytics', 500);
  }
}
