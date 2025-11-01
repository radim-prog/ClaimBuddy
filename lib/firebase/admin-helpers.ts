import { adminDb } from './admin';
import { FieldValue } from 'firebase-admin/firestore';
import { User } from '@/types';
import { USER_ROLES } from '@/lib/constants';

interface AgentStats {
  id: string;
  name: string;
  email: string;
  role: string;
  activeCasesCount: number;
  resolvedCasesCount: number;
  avgResolutionTime?: number;
}

/**
 * Přiřadí případ agentovi
 */
export async function assignCase(
  caseId: string,
  agentId: string,
  assignedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify agent exists and has correct role
    const agentDoc = await adminDb.collection('users').doc(agentId).get();
    if (!agentDoc.exists) {
      return { success: false, error: 'Agent not found' };
    }

    const agentData = agentDoc.data() as User;
    if (agentData.role !== USER_ROLES.AGENT && agentData.role !== USER_ROLES.ADMIN) {
      return { success: false, error: 'User is not an agent or admin' };
    }

    // Update case
    await adminDb.collection('cases').doc(caseId).update({
      assignedTo: agentId,
      assignedToName: agentData.name,
      assignedAt: FieldValue.serverTimestamp(),
      assignedBy,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Add timeline event
    await adminDb.collection('timeline').add({
      caseId,
      type: 'assignment',
      title: 'Případ přiřazen',
      description: `Případ byl přiřazen agentovi: ${agentData.name}`,
      userId: assignedBy,
      metadata: {
        agentId,
        agentName: agentData.name,
      },
      createdAt: FieldValue.serverTimestamp(),
    });

    // Create notification for agent
    await adminDb.collection('notifications').add({
      userId: agentId,
      type: 'case_update',
      title: 'Nový případ přiřazen',
      message: `Byl vám přiřazen nový případ`,
      link: `/admin/cases/${caseId}`,
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error assigning case:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Odebere přiřazení případu
 */
export async function unassignCase(
  caseId: string,
  unassignedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current case data to know who was assigned
    const caseDoc = await adminDb.collection('cases').doc(caseId).get();
    if (!caseDoc.exists) {
      return { success: false, error: 'Case not found' };
    }

    const caseData = caseDoc.data();
    const previousAgent = caseData?.assignedToName || 'neznámý agent';

    // Update case
    await adminDb.collection('cases').doc(caseId).update({
      assignedTo: FieldValue.delete(),
      assignedToName: FieldValue.delete(),
      assignedAt: FieldValue.delete(),
      assignedBy: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Add timeline event
    await adminDb.collection('timeline').add({
      caseId,
      type: 'assignment',
      title: 'Přiřazení odebráno',
      description: `Případ byl odebrán agentovi: ${previousAgent}`,
      userId: unassignedBy,
      metadata: {
        previousAgent,
      },
      createdAt: FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error unassigning case:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Získá statistiky agenta
 * PERFORMANCE FIX: Kombinuje 2 queries do 1 pro rychlejší načítání
 */
export async function getAgentStats(agentId: string): Promise<{
  activeCasesCount: number;
  resolvedCasesCount: number;
  avgResolutionTime?: number;
}> {
  try {
    // PERFORMANCE FIX: Fetch all cases for agent in single query instead of 2 separate queries
    const allCasesSnapshot = await adminDb
      .collection('cases')
      .where('assignedTo', '==', agentId)
      .get();

    let activeCasesCount = 0;
    let resolvedCasesCount = 0;
    let totalTime = 0;
    let validCases = 0;

    // Process all cases in single iteration
    allCasesSnapshot.forEach((doc) => {
      const data = doc.data();
      const status = data.status;

      // Count active vs resolved
      if (['new', 'in_progress', 'waiting_for_client', 'waiting_for_insurance'].includes(status)) {
        activeCasesCount++;
      } else if (['resolved', 'closed'].includes(status)) {
        resolvedCasesCount++;

        // Calculate resolution time for resolved cases
        if (data.createdAt && data.closedAt) {
          const created = data.createdAt.toDate();
          const closed = data.closedAt.toDate();
          totalTime += (closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24); // days
          validCases++;
        }
      }
    });

    const avgResolutionTime = validCases > 0 ? totalTime / validCases : undefined;

    return {
      activeCasesCount,
      resolvedCasesCount,
      avgResolutionTime,
    };
  } catch (error) {
    console.error('Error getting agent stats:', error);
    return {
      activeCasesCount: 0,
      resolvedCasesCount: 0,
    };
  }
}

/**
 * Získá seznam dostupných agentů seřazených podle workloadu
 * PERFORMANCE FIX: Batch fetch all cases once instead of N queries per agent
 */
export async function getAvailableAgents(): Promise<AgentStats[]> {
  try {
    // Get all users with agent or admin role
    const usersSnapshot = await adminDb
      .collection('users')
      .where('role', 'in', [USER_ROLES.AGENT, USER_ROLES.ADMIN])
      .get();

    // PERFORMANCE FIX: Fetch all assigned cases in single query
    const allCasesSnapshot = await adminDb
      .collection('cases')
      .where('assignedTo', '!=', null)
      .get();

    // Build stats map for all agents
    const agentStatsMap = new Map<string, {
      activeCasesCount: number;
      resolvedCasesCount: number;
      totalTime: number;
      validCases: number;
    }>();

    // Process all cases once
    allCasesSnapshot.forEach((doc) => {
      const data = doc.data();
      const agentId = data.assignedTo;
      if (!agentId) return;

      const stats = agentStatsMap.get(agentId) || {
        activeCasesCount: 0,
        resolvedCasesCount: 0,
        totalTime: 0,
        validCases: 0,
      };

      const status = data.status;

      // Count active vs resolved
      if (['new', 'in_progress', 'waiting_for_client', 'waiting_for_insurance'].includes(status)) {
        stats.activeCasesCount++;
      } else if (['resolved', 'closed'].includes(status)) {
        stats.resolvedCasesCount++;

        // Calculate resolution time for resolved cases
        if (data.createdAt && data.closedAt) {
          const created = data.createdAt.toDate();
          const closed = data.closedAt.toDate();
          stats.totalTime += (closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24); // days
          stats.validCases++;
        }
      }

      agentStatsMap.set(agentId, stats);
    });

    // Build agents array with stats
    const agents: AgentStats[] = usersSnapshot.docs.map(userDoc => {
      const userData = userDoc.data() as User;
      const stats = agentStatsMap.get(userDoc.id) || {
        activeCasesCount: 0,
        resolvedCasesCount: 0,
        totalTime: 0,
        validCases: 0,
      };

      return {
        id: userDoc.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        activeCasesCount: stats.activeCasesCount,
        resolvedCasesCount: stats.resolvedCasesCount,
        avgResolutionTime: stats.validCases > 0 ? stats.totalTime / stats.validCases : undefined,
      };
    });

    // Sort by workload (fewest active cases first)
    agents.sort((a, b) => a.activeCasesCount - b.activeCasesCount);

    return agents;
  } catch (error) {
    console.error('Error getting available agents:', error);
    return [];
  }
}
