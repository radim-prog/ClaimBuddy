import { NextRequest } from 'next/server';
import { getAuthUser, errorResponse, successResponse } from '@/lib/api-helpers';
import { getCase, updateCase, deleteCase } from '@/lib/firebase/firestore';
import { updateCaseSchema } from '@/lib/validations';
import { getUserData } from '@/lib/firebase/auth';
import { USER_ROLES } from '@/lib/constants';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, error: authError } = await getAuthUser(request);
    if (authError || !user) {
      return errorResponse('Unauthorized', 401);
    }

    const caseData = await getCase(params.id);
    if (!caseData) {
      return errorResponse('Case not found', 404);
    }

    // Zkontroluj oprávnění
    const userData = await getUserData(user.uid);
    const isAdmin = userData?.role === USER_ROLES.ADMIN || userData?.role === USER_ROLES.AGENT;
    const isOwner = caseData.userId === user.uid;

    if (!isAdmin && !isOwner) {
      return errorResponse('Forbidden', 403);
    }

    return successResponse({ case: caseData });
  } catch (error: any) {
    console.error('GET /api/cases/[id] error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, error: authError } = await getAuthUser(request);
    if (authError || !user) {
      return errorResponse('Unauthorized', 401);
    }

    const caseData = await getCase(params.id);
    if (!caseData) {
      return errorResponse('Case not found', 404);
    }

    // Pouze admini můžou updatovat případy
    const userData = await getUserData(user.uid);
    const isAdmin = userData?.role === USER_ROLES.ADMIN || userData?.role === USER_ROLES.AGENT;

    if (!isAdmin && caseData.userId !== user.uid) {
      return errorResponse('Forbidden', 403);
    }

    const body = await request.json();

    // Validace
    const validation = updateCaseSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse(validation.error.errors[0].message, 400);
    }

    const { error } = await updateCase(params.id, validation.data);

    if (error) {
      return errorResponse(error, 500);
    }

    return successResponse({ message: 'Case updated successfully' });
  } catch (error: any) {
    console.error('PATCH /api/cases/[id] error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, error: authError } = await getAuthUser(request);
    if (authError || !user) {
      return errorResponse('Unauthorized', 401);
    }

    const caseData = await getCase(params.id);
    if (!caseData) {
      return errorResponse('Case not found', 404);
    }

    // Pouze admini nebo vlastník můžou smazat případ
    const userData = await getUserData(user.uid);
    const isAdmin = userData?.role === USER_ROLES.ADMIN;
    const isOwner = caseData.userId === user.uid;

    if (!isAdmin && !isOwner) {
      return errorResponse('Forbidden', 403);
    }

    const { error } = await deleteCase(params.id);

    if (error) {
      return errorResponse(error, 500);
    }

    return successResponse({ message: 'Case deleted successfully' });
  } catch (error: any) {
    console.error('DELETE /api/cases/[id] error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
