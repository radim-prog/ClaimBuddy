import { NextRequest } from 'next/server';
import { requireAdminOrAgent, errorResponse, successResponse } from '@/lib/api-helpers';
import { adminDb } from '@/lib/firebase/admin';
import { analyticsQuerySchema } from '@/lib/validations/admin';
import { Case, Payment } from '@/types';
import { CASE_STATUSES, PAYMENT_STATUS } from '@/lib/constants';

export async function GET(request: NextRequest) {
  try {
    await requireAdminOrAgent(request);

    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      dateFrom: searchParams.get('dateFrom'),
      dateTo: searchParams.get('dateTo'),
      agentId: searchParams.get('agentId'),
    };

    // Validate query params
    const validatedParams = analyticsQuerySchema.parse(queryParams);

    // Fetch all cases (with filters if provided)
    let casesQuery = adminDb.collection('cases');

    if (validatedParams.agentId) {
      casesQuery = casesQuery.where('assignedTo', '==', validatedParams.agentId) as any;
    }

    const casesSnapshot = await casesQuery.get();
    let cases = casesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Case[];

    // Apply date filters (client-side)
    if (validatedParams.dateFrom) {
      const fromDate = new Date(validatedParams.dateFrom);
      cases = cases.filter(c => {
        const createdAt = c.createdAt instanceof Date ? c.createdAt : new Date(c.createdAt);
        return createdAt >= fromDate;
      });
    }

    if (validatedParams.dateTo) {
      const toDate = new Date(validatedParams.dateTo);
      cases = cases.filter(c => {
        const createdAt = c.createdAt instanceof Date ? c.createdAt : new Date(c.createdAt);
        return createdAt <= toDate;
      });
    }

    // Fetch payments
    const paymentsSnapshot = await adminDb.collection('payments').get();
    const payments = paymentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Payment[];

    // Calculate statistics
    const totalCases = cases.length;
    const activeCases = cases.filter(c =>
      !['resolved', 'closed'].includes(c.status)
    ).length;
    const resolvedCases = cases.filter(c => c.status === CASE_STATUSES.RESOLVED).length;
    const closedCases = cases.filter(c => c.status === CASE_STATUSES.CLOSED).length;

    // Calculate revenue
    const completedPayments = payments.filter(p => p.status === PAYMENT_STATUS.COMPLETED);
    const totalRevenue = completedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const pendingPayments = payments.filter(p => p.status === PAYMENT_STATUS.PENDING).length;

    // Calculate average resolution time (in days)
    const resolvedWithTime = cases.filter(c => c.closedAt && c.createdAt);
    const avgResolutionTime = resolvedWithTime.length > 0
      ? resolvedWithTime.reduce((acc, c) => {
          const created = c.createdAt instanceof Date ? c.createdAt : new Date(c.createdAt);
          const closed = c.closedAt instanceof Date ? c.closedAt : new Date(c.closedAt!);
          return acc + (closed.getTime() - created.getTime());
        }, 0) / resolvedWithTime.length / (1000 * 60 * 60 * 24)
      : 0;

    // Cases by status
    const casesByStatus = Object.values(CASE_STATUSES).map(status => ({
      status,
      count: cases.filter(c => c.status === status).length,
    }));

    // Cases by insurance type
    const insuranceTypes = [...new Set(cases.map(c => c.insuranceType))];
    const casesByInsurance = insuranceTypes.map(type => ({
      type,
      count: cases.filter(c => c.insuranceType === type).length,
    }));

    // Cases over time (grouped by month)
    const casesOverTime = cases.reduce((acc, c) => {
      const date = c.createdAt instanceof Date ? c.createdAt : new Date(c.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      acc[monthKey] = (acc[monthKey] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const casesOverTimeArray = Object.entries(casesOverTime)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Revenue over time
    const revenueOverTime = completedPayments.reduce((acc, p) => {
      const date = p.paidAt instanceof Date ? p.paidAt : (p.paidAt ? new Date(p.paidAt) : new Date());
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      acc[monthKey] = (acc[monthKey] || 0) + (p.amount || 0);
      return acc;
    }, {} as Record<string, number>);

    const revenueOverTimeArray = Object.entries(revenueOverTime)
      .map(([month, revenue]) => ({ month, revenue }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Top agents by performance
    const agentIds = [...new Set(cases.map(c => c.assignedTo).filter(Boolean))];
    const agentPerformance = await Promise.all(
      agentIds.map(async (agentId) => {
        const agentCases = cases.filter(c => c.assignedTo === agentId);
        const agentResolved = agentCases.filter(c => c.status === CASE_STATUSES.RESOLVED || c.status === CASE_STATUSES.CLOSED).length;

        // Get agent name
        let agentName = 'Unknown';
        try {
          const agentDoc = await adminDb.collection('users').doc(agentId as string).get();
          if (agentDoc.exists) {
            agentName = agentDoc.data()?.name || 'Unknown';
          }
        } catch (error) {
          console.error('Error fetching agent name:', error);
        }

        return {
          agentId,
          agentName,
          totalCases: agentCases.length,
          resolvedCases: agentResolved,
          resolutionRate: agentCases.length > 0 ? (agentResolved / agentCases.length) * 100 : 0,
        };
      })
    );

    // Sort by resolution rate
    agentPerformance.sort((a, b) => b.resolutionRate - a.resolutionRate);

    // Recent activity (last 10 cases)
    const recentCases = cases
      .sort((a, b) => {
        const dateA = a.updatedAt instanceof Date ? a.updatedAt : new Date(a.updatedAt);
        const dateB = b.updatedAt instanceof Date ? b.updatedAt : new Date(b.updatedAt);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 10);

    // High value cases (top 10 by claim amount)
    const highValueCases = cases
      .filter(c => c.claimAmount > 0)
      .sort((a, b) => (b.claimAmount || 0) - (a.claimAmount || 0))
      .slice(0, 10);

    return successResponse({
      stats: {
        totalCases,
        activeCases,
        resolvedCases,
        closedCases,
        totalRevenue,
        pendingPayments,
        avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
      },
      charts: {
        casesOverTime: casesOverTimeArray,
        revenueOverTime: revenueOverTimeArray,
        casesByStatus,
        casesByInsurance,
        agentPerformance: agentPerformance.slice(0, 10), // Top 10 agents
      },
      recentActivity: recentCases,
      highValueCases,
    });
  } catch (error: any) {
    console.error('Error fetching analytics:', error);
    if (error.message === 'Unauthorized' || error.message === 'Admin or Agent access required') {
      return errorResponse(error.message, 403);
    }
    return errorResponse('Chyba při načítání analytických dat', 500);
  }
}
