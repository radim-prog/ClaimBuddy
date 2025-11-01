import { NextRequest } from 'next/server';
import { errorResponse, successResponse, requireAdminOrAgent } from '@/lib/api-helpers';
import { assignCase, unassignCase } from '@/lib/firebase/admin-helpers';
import { z } from 'zod';

const assignCaseSchema = z.object({
  agentId: z.string().min(1, 'Agent ID is required'),
});

/**
 * POST /api/admin/cases/[id]/assign
 * Přiřadí případ agentovi
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Authenticate and verify admin/agent role
    const user = await requireAdminOrAgent(request);

    // Validate request body
    const body = await request.json();
    const validation = assignCaseSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(validation.error.errors[0].message, 400);
    }

    const { agentId } = validation.data;

    // Assign case
    const result = await assignCase(params.id, agentId, user.uid);

    if (!result.success) {
      return errorResponse(result.error || 'Failed to assign case', 500);
    }

    return successResponse({
      message: 'Case assigned successfully',
      caseId: params.id,
      agentId,
    });
  } catch (error: any) {
    console.error('POST /api/admin/cases/[id]/assign error:', error);

    // Handle specific errors
    if (error.message === 'Unauthorized' || error.message === 'Admin or Agent access required') {
      return errorResponse(error.message, 403);
    }

    return errorResponse(error.message || 'Internal server error', 500);
  }
}

/**
 * DELETE /api/admin/cases/[id]/assign
 * Odebere přiřazení případu
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Authenticate and verify admin/agent role
    const user = await requireAdminOrAgent(request);

    // Unassign case
    const result = await unassignCase(params.id, user.uid);

    if (!result.success) {
      return errorResponse(result.error || 'Failed to unassign case', 500);
    }

    return successResponse({
      message: 'Case unassigned successfully',
      caseId: params.id,
    });
  } catch (error: any) {
    console.error('DELETE /api/admin/cases/[id]/assign error:', error);

    // Handle specific errors
    if (error.message === 'Unauthorized' || error.message === 'Admin or Agent access required') {
      return errorResponse(error.message, 403);
    }

    return errorResponse(error.message || 'Internal server error', 500);
  }
}
