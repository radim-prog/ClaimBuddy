import { NextRequest } from 'next/server';
import { adminAuth } from './firebase/admin';

export async function getAuthUser(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return { user: null, error: 'Unauthorized' };
    }

    const token = authHeader.substring(7);
    const decodedToken = await adminAuth.verifyIdToken(token);

    return { user: decodedToken, error: null };
  } catch (error) {
    console.error('Auth error:', error);
    return { user: null, error: 'Unauthorized' };
  }
}

export function errorResponse(message: string, status: number = 400) {
  return Response.json({ error: message }, { status });
}

export function successResponse(data: any, status: number = 200) {
  return Response.json(data, { status });
}
