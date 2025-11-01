import { NextRequest } from 'next/server';
import { requireAdminOrAgent, errorResponse, successResponse } from '@/lib/api-helpers';
import { addInternalNoteSchema } from '@/lib/validations/admin';
import { getCaseInternalNotes, addCaseInternalNote } from '@/lib/firebase/admin-operations';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminOrAgent(request);
    const caseId = params.id;

    const notes = await getCaseInternalNotes(caseId);

    return successResponse({
      notes,
      total: notes.length,
    });
  } catch (error: any) {
    console.error('Error fetching internal notes:', error);
    if (error.message === 'Unauthorized' || error.message === 'Admin or Agent access required') {
      return errorResponse(error.message, 403);
    }
    return errorResponse('Chyba při načítání interních poznámek', 500);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAdminOrAgent(request);
    const caseId = params.id;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = addInternalNoteSchema.parse(body);

    // Add internal note
    const result = await addCaseInternalNote(
      caseId,
      validatedData.content,
      user.id,
      user.name
    );

    return successResponse({
      message: 'Interní poznámka byla úspěšně přidána',
      noteId: result.id,
    }, 201);
  } catch (error: any) {
    console.error('Error adding internal note:', error);
    if (error.message === 'Unauthorized' || error.message === 'Admin or Agent access required') {
      return errorResponse(error.message, 403);
    }
    if (error.name === 'ZodError') {
      return errorResponse('Neplatná data', 400);
    }
    return errorResponse('Chyba při přidávání interní poznámky', 500);
  }
}
