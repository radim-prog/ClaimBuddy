import { NextRequest } from 'next/server';
import { requireAdmin, errorResponse, successResponse } from '@/lib/api-helpers';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { USER_ROLES, UserRole } from '@/lib/constants';
import { getUserStats } from '@/lib/firebase/admin-operations';
import { z } from 'zod';

const createUserSchema = z.object({
  name: z.string().min(2, 'Jméno musí mít alespoň 2 znaky'),
  email: z.string().email('Neplatný email'),
  phone: z.string().optional(),
  role: z.enum(['client', 'agent', 'admin'] as const),
});

// GET /api/admin/users - List all users with filters
export async function GET(request: NextRequest) {
  try {
    const user = await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const roleFilter = searchParams.get('role') as UserRole | null;
    const statusFilter = searchParams.get('status'); // 'active' | 'inactive'
    const searchQuery = searchParams.get('search')?.toLowerCase();

    let query = adminDb.collection('users');

    // Filter by role
    if (roleFilter && Object.values(USER_ROLES).includes(roleFilter)) {
      query = query.where('role', '==', roleFilter) as any;
    }

    const snapshot = await query.get();

    let users = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        lastLoginAt: data.lastLoginAt?.toDate?.()?.toISOString(),
      };
    });

    // Get cases count for each user
    const casesSnapshot = await adminDb.collection('cases').get();
    const casesByUser: Record<string, number> = {};
    casesSnapshot.docs.forEach(doc => {
      const userId = doc.data().userId;
      casesByUser[userId] = (casesByUser[userId] || 0) + 1;
    });

    // Add casesCount and stats to users
    const usersWithStats = await Promise.all(
      users.map(async (u) => {
        const baseUser = {
          ...u,
          casesCount: casesByUser[u.id] || 0,
          status: u.status || 'active',
        };

        // Add detailed stats for agents
        if (u.role === USER_ROLES.AGENT) {
          try {
            const stats = await getUserStats(u.id);
            return { ...baseUser, stats };
          } catch (error) {
            console.error('Error fetching agent stats:', error);
          }
        }

        return baseUser;
      })
    );

    users = usersWithStats;

    // Filter by status
    if (statusFilter) {
      users = users.filter(u => u.status === statusFilter);
    }

    // Search filter
    if (searchQuery) {
      users = users.filter(u =>
        u.name?.toLowerCase().includes(searchQuery) ||
        u.email?.toLowerCase().includes(searchQuery)
      );
    }

    return successResponse({ users });
  } catch (error: any) {
    console.error('GET /api/admin/users error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

// POST /api/admin/users - Create new agent/admin
export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin(request);

    const body = await request.json();
    const validation = createUserSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(validation.error.errors[0].message, 400);
    }

    const { name, email, phone, role } = validation.data;

    // Check if user already exists
    const existingUser = await adminAuth.getUserByEmail(email).catch(() => null);
    if (existingUser) {
      return errorResponse('Uživatel s tímto emailem již existuje', 400);
    }

    // Create user in Firebase Auth
    const authUser = await adminAuth.createUser({
      email,
      emailVerified: false,
      disabled: false,
    });

    // Generate random password and send email
    const tempPassword = Math.random().toString(36).slice(-8) + 'Aa1!';
    await adminAuth.updateUser(authUser.uid, {
      password: tempPassword,
    });

    // Create user in Firestore
    const userData = {
      email,
      name,
      phone: phone || '',
      role,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      emailVerified: false,
    };

    await adminDb.collection('users').doc(authUser.uid).set(userData);

    // TODO: Send invitation email with tempPassword
    // This would be done via email service (e.g., SendGrid, Resend)
    console.log(`Created user ${email} with temp password: ${tempPassword}`);

    return successResponse({
      id: authUser.uid,
      message: 'Uživatel byl vytvořen',
      // In production, don't return password!
      // tempPassword,
    }, 201);
  } catch (error: any) {
    console.error('POST /api/admin/users error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
