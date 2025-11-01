import { NextRequest } from 'next/server';
import { requireAdminOrAgent, errorResponse, successResponse } from '@/lib/api-helpers';
import { updateCaseStatusSchema } from '@/lib/validations/admin';
import { updateCaseStatus } from '@/lib/firebase/admin-operations';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAdminOrAgent(request);
    const caseId = params.id;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateCaseStatusSchema.parse(body);

    // Update case status
    await updateCaseStatus(
      caseId,
      validatedData.status,
      user.id,
      user.name,
      validatedData.reason,
      validatedData.internalNote
    );

    return successResponse({
      message: 'Status případu byl úspěšně aktualizován',
      caseId,
      status: validatedData.status,
    });
  } catch (error: any) {
    console.error('Error updating case status:', error);
    if (error.message === 'Unauthorized' || error.message === 'Admin or Agent access required') {
      return errorResponse(error.message, 403);
    }
    if (error.name === 'ZodError') {
      return errorResponse('Neplatná data', 400);
    }
    return errorResponse('Chyba při aktualizaci stavu případu', 500);
  }
}
