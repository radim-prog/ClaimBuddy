import { NextRequest } from 'next/server';
import { z } from 'zod';
import { errorResponse, successResponse } from '@/lib/api-helpers';
import { requireAdminRequest } from '@/lib/admin-auth';
import {
  NOTION_CASE_PRIORITIES,
  getNotionCaseById,
  updateNotionCaseAssignment,
  updateNotionCasePriority,
} from '@/lib/notion';

const assignSchema = z.object({
  assignee: z.string().max(100).optional(),
  priority: z.enum(NOTION_CASE_PRIORITIES).optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const unauthorized = requireAdminRequest(request);
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = assignSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse('Invalid assign payload', 400);
    }

    if (typeof parsed.data.assignee === 'string') {
      await updateNotionCaseAssignment(params.id, parsed.data.assignee, 'admin');
    }

    if (parsed.data.priority) {
      await updateNotionCasePriority(params.id, parsed.data.priority, 'admin');
    }

    const fresh = await getNotionCaseById(params.id);
    return successResponse({ case: fresh });
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to update assignment', 500);
  }
}
