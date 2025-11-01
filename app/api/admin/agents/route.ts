import { NextRequest } from 'next/server';
import { errorResponse, successResponse, requireAdminOrAgent } from '@/lib/api-helpers';
import { getAvailableAgents } from '@/lib/firebase/admin-helpers';

/**
 * GET /api/admin/agents
 * Vrátí seznam všech agentů/adminů s jejich statistikami
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate and verify admin/agent role
    await requireAdminOrAgent(request);

    // Get all agents with stats
    const agents = await getAvailableAgents();

    return successResponse({
      agents,
      total: agents.length,
    });
  } catch (error: any) {
    console.error('GET /api/admin/agents error:', error);

    // Handle specific errors
    if (error.message === 'Unauthorized' || error.message === 'Admin or Agent access required') {
      return errorResponse(error.message, 403);
    }

    return errorResponse(error.message || 'Internal server error', 500);
  }
}
