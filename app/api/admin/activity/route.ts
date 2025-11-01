import { NextRequest } from 'next/server';
import { requireAdminOrAgent, errorResponse, successResponse } from '@/lib/api-helpers';
import { adminDb } from '@/lib/firebase/admin';
import { activityLogQuerySchema } from '@/lib/validations/admin';

interface ActivityLog {
  id: string;
  userId: string;
  userName?: string;
  action: string;
  targetId: string;
  targetType: 'case' | 'user' | 'payment' | 'document';
  details?: Record<string, any>;
  timestamp: Date;
}

export async function GET(request: NextRequest) {
  try {
    await requireAdminOrAgent(request);

    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      limit: searchParams.get('limit'),
      page: searchParams.get('page'),
      targetType: searchParams.get('targetType'),
      userId: searchParams.get('userId'),
    };

    // Validate query params
    const validatedParams = activityLogQuerySchema.parse(queryParams);

    // Build Firestore query
    let query = adminDb
      .collection('activityLog')
      .orderBy('timestamp', 'desc')
      .limit(validatedParams.limit * validatedParams.page);

    // Apply filters
    if (validatedParams.targetType) {
      query = adminDb
        .collection('activityLog')
        .where('targetType', '==', validatedParams.targetType)
        .orderBy('timestamp', 'desc')
        .limit(validatedParams.limit * validatedParams.page);
    }

    if (validatedParams.userId) {
      query = adminDb
        .collection('activityLog')
        .where('userId', '==', validatedParams.userId)
        .orderBy('timestamp', 'desc')
        .limit(validatedParams.limit * validatedParams.page);
    }

    const snapshot = await query.get();
    let activities = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as ActivityLog[];

    // Paginate (client-side since we're already limiting in Firestore)
    const startIndex = (validatedParams.page - 1) * validatedParams.limit;
    const endIndex = startIndex + validatedParams.limit;
    const paginatedActivities = activities.slice(startIndex, endIndex);

    // Fetch user names for activities
    const activitiesWithUserNames = await Promise.all(
      paginatedActivities.map(async (activity) => {
        if (!activity.userName && activity.userId) {
          try {
            const userDoc = await adminDb.collection('users').doc(activity.userId).get();
            if (userDoc.exists) {
              activity.userName = userDoc.data()?.name || 'Unknown';
            }
          } catch (error) {
            console.error('Error fetching user name:', error);
          }
        }
        return activity;
      })
    );

    // Format activity messages
    const formattedActivities = activitiesWithUserNames.map((activity) => {
      let message = '';

      switch (activity.action) {
        case 'create_case':
          message = `${activity.userName} vytvořil/a nový případ`;
          break;
        case 'update_case_status':
          message = `${activity.userName} změnil/a status případu na ${activity.details?.status}`;
          break;
        case 'assign_case':
          message = `${activity.userName} přiřadil/a případ`;
          break;
        case 'reassign_cases':
          message = `${activity.userName} přeřadil/a ${activity.details?.reassignedCount} případů`;
          break;
        case 'create_user':
          message = `${activity.userName} vytvořil/a uživatele (${activity.details?.role})`;
          break;
        case 'update_user':
          message = `${activity.userName} aktualizoval/a uživatele`;
          break;
        case 'deactivate_user':
          message = `${activity.userName} deaktivoval/a uživatele`;
          break;
        case 'upload_document':
          message = `${activity.userName} nahrál/a dokument`;
          break;
        case 'payment_completed':
          message = `${activity.userName} dokončil/a platbu`;
          break;
        default:
          message = `${activity.userName} provedl/a akci: ${activity.action}`;
      }

      return {
        ...activity,
        message,
      };
    });

    return successResponse({
      activities: formattedActivities,
      pagination: {
        page: validatedParams.page,
        limit: validatedParams.limit,
        hasMore: activities.length === validatedParams.limit * validatedParams.page,
      },
    });
  } catch (error: any) {
    console.error('Error fetching activity log:', error);
    if (error.message === 'Unauthorized' || error.message === 'Admin or Agent access required') {
      return errorResponse(error.message, 403);
    }
    return errorResponse('Chyba při načítání aktivity', 500);
  }
}
