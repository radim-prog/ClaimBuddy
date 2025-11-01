import { NextRequest } from 'next/server';
import { adminAuth, adminDb } from './firebase/admin';
import { User } from '@/types';
import { USER_ROLES } from './constants';

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

export async function authenticateRequest(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return { user: null, error: 'Unauthorized' };
    }

    const token = authHeader.substring(7);
    const decodedToken = await adminAuth.verifyIdToken(token);

    // Fetch user data from Firestore
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    if (!userDoc.exists) {
      return { user: null, error: 'User not found' };
    }

    const userData = userDoc.data() as User;

    return {
      user: {
        ...userData,
        uid: decodedToken.uid,
      },
      error: null
    };
  } catch (error) {
    console.error('Auth error:', error);
    return { user: null, error: 'Unauthorized' };
  }
}

export async function requireAdmin(request: NextRequest) {
  const { user, error } = await authenticateRequest(request);
  if (error || !user) {
    throw new Error('Unauthorized');
  }
  if (user.role !== USER_ROLES.ADMIN) {
    throw new Error('Admin access required');
  }
  return user;
}

export async function requireAdminOrAgent(request: NextRequest) {
  const { user, error } = await authenticateRequest(request);
  if (error || !user) {
    throw new Error('Unauthorized');
  }
  if (!['admin', 'agent'].includes(user.role)) {
    throw new Error('Admin or Agent access required');
  }
  return user;
}

export function errorResponse(message: string, status: number = 400) {
  return Response.json({ error: message }, { status });
}

export function successResponse(data: any, status: number = 200) {
  return Response.json(data, { status });
}
