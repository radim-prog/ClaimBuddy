import { NextRequest } from 'next/server';
import { requireAdmin, errorResponse, successResponse } from '@/lib/api-helpers';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { getUserStats } from '@/lib/firebase/admin-operations';
import { z } from 'zod';

const updateUserSchema = z.object({
  role: z.enum(['client', 'agent', 'admin'] as const).optional(),
  status: z.enum(['active', 'inactive'] as const).optional(),
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
});

// PATCH /api/admin/users/[id] - Update user
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await requireAdmin(request);
    const userId = params.id;

    // Cannot modify yourself
    if (currentUser.uid === userId) {
      return errorResponse('Nemůžete upravovat vlastní účet', 400);
    }

    const body = await request.json();
    const validation = updateUserSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(validation.error.errors[0].message, 400);
    }

    const updates = validation.data;

    // Get user document
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return errorResponse('Uživatel nenalezen', 404);
    }

    const updateData: any = {
      ...updates,
      updatedAt: new Date(),
    };

    // Update Firestore
    await adminDb.collection('users').doc(userId).update(updateData);

    // If deactivating, disable in Auth
    if (updates.status === 'inactive') {
      await adminAuth.updateUser(userId, { disabled: true });

      // TODO: Reassign cases if user has any
      const casesSnapshot = await adminDb
        .collection('cases')
        .where('assignedTo', '==', userId)
        .get();

      if (!casesSnapshot.empty) {
        console.log(`User ${userId} has ${casesSnapshot.size} assigned cases that need reassignment`);
        // In production, you'd reassign these cases to another agent
      }
    } else if (updates.status === 'active') {
      await adminAuth.updateUser(userId, { disabled: false });
    }

    return successResponse({
      message: 'Uživatel byl aktualizován',
      userId,
    });
  } catch (error: any) {
    console.error('PATCH /api/admin/users/[id] error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

// DELETE /api/admin/users/[id] - Deactivate user (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await requireAdmin(request);
    const userId = params.id;

    // Cannot delete yourself
    if (currentUser.uid === userId) {
      return errorResponse('Nemůžete deaktivovat vlastní účet', 400);
    }

    // Get user document
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return errorResponse('Uživatel nenalezen', 404);
    }

    // Soft delete - just deactivate
    await adminDb.collection('users').doc(userId).update({
      status: 'inactive',
      updatedAt: new Date(),
    });

    await adminAuth.updateUser(userId, { disabled: true });

    // Check for assigned cases
    const casesSnapshot = await adminDb
      .collection('cases')
      .where('assignedTo', '==', userId)
      .get();

    const assignedCasesCount = casesSnapshot.size;

    return successResponse({
      message: 'Uživatel byl deaktivován',
      userId,
      assignedCasesCount,
      warning: assignedCasesCount > 0 ? 'Uživatel měl přiřazené případy, je třeba je přeřadit' : null,
    });
  } catch (error: any) {
    console.error('DELETE /api/admin/users/[id] error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

// GET /api/admin/users/[id] - Get single user with stats
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin(request);
    const userId = params.id;

    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return errorResponse('Uživatel nenalezen', 404);
    }

    const userData = userDoc.data();

    // Get user's cases
    const casesSnapshot = await adminDb
      .collection('cases')
      .where('userId', '==', userId)
      .get();

    const cases = casesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Get assigned cases (if agent)
    let assignedCases: any[] = [];
    if (userData?.role === 'agent' || userData?.role === 'admin') {
      const assignedSnapshot = await adminDb
        .collection('cases')
        .where('assignedTo', '==', userId)
        .get();

      assignedCases = assignedSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    }

    // Get detailed stats if agent
    let stats = null;
    if (userData?.role === 'agent') {
      try {
        stats = await getUserStats(userId);
      } catch (error) {
        console.error('Error fetching agent stats:', error);
      }
    }

    return successResponse({
      user: {
        id: userId,
        ...userData,
        createdAt: userData?.createdAt?.toDate?.()?.toISOString(),
        updatedAt: userData?.updatedAt?.toDate?.()?.toISOString(),
        lastLoginAt: userData?.lastLoginAt?.toDate?.()?.toISOString(),
      },
      casesCount: cases.length,
      assignedCasesCount: assignedCases.length,
      cases: cases.slice(0, 5), // Last 5 cases
      assignedCases: assignedCases.slice(0, 5),
      stats,
    });
  } catch (error: any) {
    console.error('GET /api/admin/users/[id] error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
