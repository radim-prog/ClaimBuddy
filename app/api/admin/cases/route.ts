import { NextRequest } from 'next/server';
import { requireAdminOrAgent, errorResponse, successResponse } from '@/lib/api-helpers';
import { adminDb } from '@/lib/firebase/admin';
import { casesListQuerySchema } from '@/lib/validations/admin';
import { Case, User } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAdminOrAgent(request);

    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      status: searchParams.get('status'),
      agentId: searchParams.get('agentId'),
      search: searchParams.get('search'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
    };

    // Validate query params
    const validatedParams = casesListQuerySchema.parse(queryParams);

    // Build Firestore query
    let query = adminDb.collection('cases').orderBy(
      validatedParams.sortBy,
      validatedParams.sortOrder
    );

    // Apply filters
    if (validatedParams.status) {
      query = adminDb
        .collection('cases')
        .where('status', '==', validatedParams.status)
        .orderBy(validatedParams.sortBy, validatedParams.sortOrder);
    }

    if (validatedParams.agentId) {
      query = adminDb
        .collection('cases')
        .where('assignedTo', '==', validatedParams.agentId)
        .orderBy(validatedParams.sortBy, validatedParams.sortOrder);
    }

    // Execute query
    const snapshot = await query.get();
    let cases = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Case[];

    // Apply search filter (client-side since Firestore doesn't support full-text search)
    if (validatedParams.search) {
      const searchLower = validatedParams.search.toLowerCase();
      cases = cases.filter(c =>
        c.caseNumber?.toLowerCase().includes(searchLower) ||
        c.insuranceCompany?.toLowerCase().includes(searchLower) ||
        c.incidentDescription?.toLowerCase().includes(searchLower) ||
        c.policyNumber?.toLowerCase().includes(searchLower)
      );
    }

    const total = cases.length;

    // Paginate
    const startIndex = (validatedParams.page - 1) * validatedParams.limit;
    const endIndex = startIndex + validatedParams.limit;
    const paginatedCases = cases.slice(startIndex, endIndex);

    // Fetch user data for each case
    const casesWithUserData = await Promise.all(
      paginatedCases.map(async (caseItem) => {
        let userData = null;
        if (caseItem.userId) {
          try {
            const userDoc = await adminDb.collection('users').doc(caseItem.userId).get();
            if (userDoc.exists) {
              userData = {
                id: userDoc.id,
                name: userDoc.data()?.name,
                email: userDoc.data()?.email,
                phone: userDoc.data()?.phone,
              };
            }
          } catch (error) {
            console.error('Error fetching user data:', error);
          }
        }

        return {
          ...caseItem,
          user: userData,
        };
      })
    );

    return successResponse({
      cases: casesWithUserData,
      pagination: {
        total,
        page: validatedParams.page,
        limit: validatedParams.limit,
        pages: Math.ceil(total / validatedParams.limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching cases:', error);
    if (error.message === 'Unauthorized' || error.message === 'Admin or Agent access required') {
      return errorResponse(error.message, 403);
    }
    return errorResponse('Chyba při načítání případů', 500);
  }
}
