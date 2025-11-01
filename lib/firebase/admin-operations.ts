import { adminDb } from './admin';
import { Case, User, CaseTimeline } from '@/types';
import { USER_ROLES } from '../constants';

/**
 * Log activity for audit trail
 */
export async function logActivity(
  userId: string,
  action: string,
  targetId: string,
  targetType: 'case' | 'user' | 'payment' | 'document',
  details?: Record<string, any>
) {
  try {
    await adminDb.collection('activityLog').add({
      userId,
      action,
      targetId,
      targetType,
      details: details || {},
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
    // Don't throw - logging failures shouldn't break the main operation
  }
}

/**
 * Get statistics for a specific user (agent)
 */
export async function getUserStats(userId: string) {
  try {
    const casesSnapshot = await adminDb
      .collection('cases')
      .where('assignedTo', '==', userId)
      .get();

    const cases = casesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Case));

    const totalCases = cases.length;
    const activeCases = cases.filter(c =>
      !['resolved', 'closed'].includes(c.status)
    ).length;
    const resolvedCases = cases.filter(c => c.status === 'resolved').length;
    const closedCases = cases.filter(c => c.status === 'closed').length;

    // Calculate average resolution time (in days)
    const resolvedWithTime = cases.filter(c => c.closedAt && c.createdAt);
    const avgResolutionTime = resolvedWithTime.length > 0
      ? resolvedWithTime.reduce((acc, c) => {
          const created = c.createdAt instanceof Date ? c.createdAt : new Date(c.createdAt);
          const closed = c.closedAt instanceof Date ? c.closedAt : new Date(c.closedAt);
          return acc + (closed.getTime() - created.getTime());
        }, 0) / resolvedWithTime.length / (1000 * 60 * 60 * 24) // Convert to days
      : 0;

    return {
      totalCases,
      activeCases,
      resolvedCases,
      closedCases,
      avgResolutionTime: Math.round(avgResolutionTime * 10) / 10, // Round to 1 decimal
    };
  } catch (error) {
    console.error('Failed to get user stats:', error);
    throw error;
  }
}

/**
 * Get case with all related details
 */
export async function getCaseWithDetails(caseId: string) {
  try {
    const caseDoc = await adminDb.collection('cases').doc(caseId).get();
    if (!caseDoc.exists) {
      return null;
    }

    const caseData = { id: caseDoc.id, ...caseDoc.data() } as Case;

    // Get user data
    let userData = null;
    if (caseData.userId) {
      const userDoc = await adminDb.collection('users').doc(caseData.userId).get();
      if (userDoc.exists) {
        userData = { id: userDoc.id, ...userDoc.data() } as User;
      }
    }

    // Get assigned agent data
    let agentData = null;
    if (caseData.assignedTo) {
      const agentDoc = await adminDb.collection('users').doc(caseData.assignedTo).get();
      if (agentDoc.exists) {
        agentData = { id: agentDoc.id, ...agentDoc.data() } as User;
      }
    }

    // Count messages
    const messagesSnapshot = await adminDb
      .collection('messages')
      .where('caseId', '==', caseId)
      .get();
    const messageCount = messagesSnapshot.size;

    // Count documents
    const documentsSnapshot = await adminDb
      .collection('documents')
      .where('caseId', '==', caseId)
      .get();
    const documentCount = documentsSnapshot.size;

    return {
      ...caseData,
      user: userData,
      agent: agentData,
      messageCount,
      documentCount,
    };
  } catch (error) {
    console.error('Failed to get case with details:', error);
    throw error;
  }
}

/**
 * Reassign all cases from one user to another
 */
export async function reassignUserCases(fromUserId: string, toUserId: string) {
  try {
    const casesSnapshot = await adminDb
      .collection('cases')
      .where('assignedTo', '==', fromUserId)
      .get();

    if (casesSnapshot.empty) {
      return { reassignedCount: 0 };
    }

    // Get the new agent's name
    const toUserDoc = await adminDb.collection('users').doc(toUserId).get();
    const toUserName = toUserDoc.exists ? toUserDoc.data()?.name : 'Unknown';

    const batch = adminDb.batch();
    let reassignedCount = 0;

    for (const doc of casesSnapshot.docs) {
      batch.update(doc.ref, {
        assignedTo: toUserId,
        assignedToName: toUserName,
        updatedAt: new Date(),
      });

      // Add timeline event
      const timelineRef = adminDb.collection('caseTimeline').doc();
      batch.set(timelineRef, {
        caseId: doc.id,
        type: 'assignment',
        title: 'Případ přeřazen',
        description: `Případ byl přeřazen na ${toUserName}`,
        userId: toUserId,
        userName: toUserName,
        createdAt: new Date(),
        metadata: {
          fromUserId,
          toUserId,
        },
      });

      reassignedCount++;
    }

    await batch.commit();

    // Log activity
    await logActivity(
      toUserId,
      'reassign_cases',
      fromUserId,
      'user',
      { reassignedCount }
    );

    return { reassignedCount };
  } catch (error) {
    console.error('Failed to reassign user cases:', error);
    throw error;
  }
}

/**
 * Get internal notes for a case
 */
export async function getCaseInternalNotes(caseId: string) {
  try {
    const notesSnapshot = await adminDb
      .collection('internalNotes')
      .where('caseId', '==', caseId)
      .orderBy('createdAt', 'desc')
      .get();

    return notesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Failed to get internal notes:', error);
    throw error;
  }
}

/**
 * Add internal note to a case
 */
export async function addCaseInternalNote(
  caseId: string,
  content: string,
  createdBy: string,
  createdByName: string
) {
  try {
    const noteRef = await adminDb.collection('internalNotes').add({
      caseId,
      content,
      createdBy,
      createdByName,
      createdAt: new Date(),
      type: 'internal',
    });

    // Add timeline event
    await adminDb.collection('caseTimeline').add({
      caseId,
      type: 'note',
      title: 'Interní poznámka přidána',
      description: `${createdByName} přidal/a interní poznámku`,
      userId: createdBy,
      userName: createdByName,
      createdAt: new Date(),
    } as CaseTimeline);

    return { id: noteRef.id };
  } catch (error) {
    console.error('Failed to add internal note:', error);
    throw error;
  }
}

/**
 * Update case status with timeline event
 */
export async function updateCaseStatus(
  caseId: string,
  status: string,
  userId: string,
  userName: string,
  reason?: string,
  internalNote?: string
) {
  try {
    const batch = adminDb.batch();

    // Update case
    const caseRef = adminDb.collection('cases').doc(caseId);
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (status === 'resolved' || status === 'closed') {
      updateData.closedAt = new Date();
      if (reason) {
        updateData.resolution = reason;
      }
    }

    batch.update(caseRef, updateData);

    // Add timeline event
    const timelineRef = adminDb.collection('caseTimeline').doc();
    batch.set(timelineRef, {
      caseId,
      type: 'status_change',
      title: 'Změna stavu',
      description: reason || `Status změněn na ${status}`,
      userId,
      userName,
      createdAt: new Date(),
      metadata: {
        oldStatus: status, // We'd need to fetch this if we want the old status
        newStatus: status,
        reason,
      },
    } as CaseTimeline);

    // Add internal note if provided
    if (internalNote) {
      const noteRef = adminDb.collection('internalNotes').doc();
      batch.set(noteRef, {
        caseId,
        content: internalNote,
        createdBy: userId,
        createdByName: userName,
        createdAt: new Date(),
        type: 'internal',
      });
    }

    await batch.commit();

    // Log activity
    await logActivity(userId, 'update_case_status', caseId, 'case', {
      status,
      reason,
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to update case status:', error);
    throw error;
  }
}
