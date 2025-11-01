import { NextRequest } from 'next/server';
import { getAuthUser, errorResponse, successResponse } from '@/lib/api-helpers';
import { createCase, getCases, getAllCases } from '@/lib/firebase/firestore';
import { createCaseSchema } from '@/lib/validations';
import { getUserData } from '@/lib/firebase/auth';
import { USER_ROLES } from '@/lib/constants';

export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser(request);
    if (authError || !user) {
      return errorResponse('Unauthorized', 401);
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const limit = parseInt(searchParams.get('limit') || '10');

    // Admini vidí všechny případy, klienti jen své
    const userData = await getUserData(user.uid);
    if (!userData) {
      return errorResponse('User not found', 404);
    }

    let result;
    if (userData.role === USER_ROLES.ADMIN || userData.role === USER_ROLES.AGENT) {
      result = await getAllCases({ status, limitCount: limit });
    } else {
      result = await getCases(user.uid, { status, limitCount: limit });
    }

    if (result.error) {
      return errorResponse(result.error, 500);
    }

    return successResponse({ cases: result.cases });
  } catch (error: any) {
    console.error('GET /api/cases error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser(request);
    if (authError || !user) {
      return errorResponse('Unauthorized', 401);
    }

    const body = await request.json();

    // Validace
    const validation = createCaseSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse(validation.error.errors[0].message, 400);
    }

    const { id, error } = await createCase(user.uid, validation.data);

    if (error) {
      return errorResponse(error, 500);
    }

    return successResponse({ id, message: 'Case created successfully' }, 201);
  } catch (error: any) {
    console.error('POST /api/cases error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
