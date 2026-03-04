import { NextRequest } from 'next/server';
import { z } from 'zod';
import { errorResponse, successResponse } from '@/lib/api-helpers';
import { NOTION_CASE_STATUSES, getNotionCaseById, updateNotionCaseStatus } from '@/lib/notion';
import { requireAdminRequest } from '@/lib/admin-auth';
import { notifyCaseStatusChanged } from '@/lib/notifications';

const statusSchema = z.object({
  status: z.enum(NOTION_CASE_STATUSES),
});

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const unauthorized = requireAdminRequest(request);
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = statusSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse('Invalid status payload', 400);
    }

    const updated = await updateNotionCaseStatus(params.id, parsed.data.status);
    void notifyCaseStatusChanged({
      email: updated.email || '',
      fullName: updated.fullName || 'kliente',
      caseNumber: updated.caseNumber || updated.id,
      status: parsed.data.status,
    }).catch(() => undefined);

    const fresh = await getNotionCaseById(params.id);
    return successResponse({ case: fresh });
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to update case status', 500);
  }
}
