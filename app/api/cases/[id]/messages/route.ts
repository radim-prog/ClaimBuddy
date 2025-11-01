import { NextRequest } from 'next/server';
import { getAuthUser, errorResponse, successResponse } from '@/lib/api-helpers';
import { getCase, sendMessage, getMessages } from '@/lib/firebase/firestore';
import { messageSchema } from '@/lib/validations';
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

    const { messages, error } = await getMessages(params.id);

    if (error) {
      return errorResponse(error, 500);
    }

    return successResponse({ messages });
  } catch (error: any) {
    console.error('GET /api/cases/[id]/messages error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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
    if (!userData) {
      return errorResponse('User not found', 404);
    }

    const isAdmin = userData.role === USER_ROLES.ADMIN || userData.role === USER_ROLES.AGENT;
    const isOwner = caseData.userId === user.uid;

    if (!isAdmin && !isOwner) {
      return errorResponse('Forbidden', 403);
    }

    const body = await request.json();

    // Validace
    const validation = messageSchema.safeParse({ ...body, caseId: params.id });
    if (!validation.success) {
      return errorResponse(validation.error.errors[0].message, 400);
    }

    const { id, error } = await sendMessage(
      params.id,
      user.uid,
      userData.name,
      userData.role,
      validation.data.content,
      validation.data.attachments
    );

    if (error) {
      return errorResponse(error, 500);
    }

    return successResponse({ id, message: 'Message sent successfully' }, 201);
  } catch (error: any) {
    console.error('POST /api/cases/[id]/messages error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
