import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { Case, User } from '@/types';
import { CASE_STATUSES } from './constants';
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  format,
  differenceInDays,
  isWithinInterval,
} from 'date-fns';

export interface AnalyticsData {
  stats: {
    totalCases: number;
    activeCases: number;
    resolvedCases: number;
    totalRevenue: number;
    avgResolutionTime: number;
    conversionRate: number;
    trends: {
      casesChange: TrendData;
      revenueChange: TrendData;
      avgTimeChange: TrendData;
    };
  };
  charts: {
    casesOverTime: Array<{
      month: string;
      created: number;
      resolved: number;
      active: number;
    }>;
    revenueOverTime: Array<{
      month: string;
      revenue: number;
    }>;
    casesByStatus: Array<{
      name: string;
      value: number;
      color: string;
    }>;
    casesByInsurance: Array<{
      company: string;
      count: number;
    }>;
    agentPerformance: Array<{
      name: string;
      resolved: number;
      avgTime: number;
    }>;
  };
  topLists: {
    topAgents: Array<{
      id: string;
      name: string;
      resolvedCases: number;
      avgResolutionTime: number;
      rating: number;
    }>;
    recentActivity: Array<{
      id: string;
      type: string;
      title: string;
      description: string;
      timestamp: Date;
      user?: string;
    }>;
    highValueCases: Array<{
      id: string;
      caseNumber: string;
      claimAmount: number;
      status: string;
      assignedTo?: string;
      createdAt: Date;
    }>;
  };
}

export interface TrendData {
  value: number;
  isPositive: boolean;
  percentage: number;
}

export interface DateRangeOption {
  label: string;
  value: string;
  getDates: () => { start: Date; end: Date };
}

export const DATE_RANGES: DateRangeOption[] = [
  {
    label: 'Posledních 7 dní',
    value: '7d',
    getDates: () => ({
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      end: new Date(),
    }),
  },
  {
    label: 'Posledních 30 dní',
    value: '30d',
    getDates: () => ({
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date(),
    }),
  },
  {
    label: 'Posledních 3 měsíce',
    value: '3m',
    getDates: () => ({
      start: subMonths(new Date(), 3),
      end: new Date(),
    }),
  },
  {
    label: 'Posledních 6 měsíců',
    value: '6m',
    getDates: () => ({
      start: subMonths(new Date(), 6),
      end: new Date(),
    }),
  },
  {
    label: 'Poslední rok',
    value: '1y',
    getDates: () => ({
      start: subMonths(new Date(), 12),
      end: new Date(),
    }),
  },
];

export function calculateTrend(current: number, previous: number): TrendData {
  if (previous === 0) {
    return {
      value: current,
      isPositive: current > 0,
      percentage: current > 0 ? 100 : 0,
    };
  }

  const difference = current - previous;
  const percentage = (difference / previous) * 100;

  return {
    value: difference,
    isPositive: difference >= 0,
    percentage: Math.abs(percentage),
  };
}

function toDate(timestamp: any): Date {
  if (timestamp instanceof Date) return timestamp;
  if (timestamp?.toDate) return timestamp.toDate();
  if (timestamp?.seconds) return new Date(timestamp.seconds * 1000);
  return new Date(timestamp);
}

export async function getAnalyticsData(
  dateRange: string = '30d'
): Promise<AnalyticsData> {
  // Get date range
  const rangeOption = DATE_RANGES.find((r) => r.value === dateRange);
  const { start: startDate, end: endDate } = rangeOption
    ? rangeOption.getDates()
    : DATE_RANGES[1].getDates();

  // Fetch all cases
  const casesRef = collection(db, 'cases');
  const casesSnap = await getDocs(casesRef);
  const allCases: Case[] = casesSnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Case[];

  // Filter cases by date range
  const casesInRange = allCases.filter((c) => {
    const createdAt = toDate(c.createdAt);
    return isWithinInterval(createdAt, { start: startDate, end: endDate });
  });

  // Calculate stats
  const totalCases = casesInRange.length;
  const activeCases = casesInRange.filter((c) =>
    [
      CASE_STATUSES.NEW,
      CASE_STATUSES.IN_PROGRESS,
      CASE_STATUSES.WAITING_FOR_CLIENT,
      CASE_STATUSES.WAITING_FOR_INSURANCE,
    ].includes(c.status as any)
  ).length;
  const resolvedCases = casesInRange.filter(
    (c) => c.status === CASE_STATUSES.RESOLVED
  ).length;

  // Calculate revenue (15% of resolved claims)
  const totalRevenue = casesInRange
    .filter((c) => c.status === CASE_STATUSES.RESOLVED)
    .reduce((sum, c) => sum + c.claimAmount * 0.15, 0);

  // Calculate average resolution time
  const resolvedCasesWithClosedDate = casesInRange.filter(
    (c) => c.status === CASE_STATUSES.RESOLVED && c.closedAt
  );
  const avgResolutionTime =
    resolvedCasesWithClosedDate.length > 0
      ? resolvedCasesWithClosedDate.reduce((sum, c) => {
          const created = toDate(c.createdAt);
          const closed = toDate(c.closedAt!);
          return sum + differenceInDays(closed, created);
        }, 0) / resolvedCasesWithClosedDate.length
      : 0;

  // Calculate conversion rate
  const conversionRate =
    totalCases > 0 ? (resolvedCases / totalCases) * 100 : 0;

  // Calculate trends (compare with previous period)
  const periodLength =
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
  const prevStartDate = new Date(
    startDate.getTime() - periodLength * 24 * 60 * 60 * 1000
  );
  const prevEndDate = startDate;

  const prevCases = allCases.filter((c) => {
    const createdAt = toDate(c.createdAt);
    return isWithinInterval(createdAt, {
      start: prevStartDate,
      end: prevEndDate,
    });
  });

  const prevTotalCases = prevCases.length;
  const prevRevenue = prevCases
    .filter((c) => c.status === CASE_STATUSES.RESOLVED)
    .reduce((sum, c) => sum + c.claimAmount * 0.15, 0);

  const prevResolvedCases = prevCases.filter(
    (c) => c.status === CASE_STATUSES.RESOLVED && c.closedAt
  );
  const prevAvgResolutionTime =
    prevResolvedCases.length > 0
      ? prevResolvedCases.reduce((sum, c) => {
          const created = toDate(c.createdAt);
          const closed = toDate(c.closedAt!);
          return sum + differenceInDays(closed, created);
        }, 0) / prevResolvedCases.length
      : 0;

  // Generate charts data
  const casesOverTime = generateCasesOverTime(allCases);
  const revenueOverTime = generateRevenueOverTime(allCases);
  const casesByStatus = generateCasesByStatus(casesInRange);
  const casesByInsurance = generateCasesByInsurance(casesInRange);
  const agentPerformance = await generateAgentPerformance(casesInRange);

  // Generate top lists
  const topAgents = await generateTopAgents(allCases);
  const recentActivity = generateRecentActivity(casesInRange);
  const highValueCases = generateHighValueCases(casesInRange);

  return {
    stats: {
      totalCases,
      activeCases,
      resolvedCases,
      totalRevenue,
      avgResolutionTime: Math.round(avgResolutionTime),
      conversionRate: Math.round(conversionRate),
      trends: {
        casesChange: calculateTrend(totalCases, prevTotalCases),
        revenueChange: calculateTrend(totalRevenue, prevRevenue),
        avgTimeChange: calculateTrend(
          avgResolutionTime,
          prevAvgResolutionTime
        ),
      },
    },
    charts: {
      casesOverTime,
      revenueOverTime,
      casesByStatus,
      casesByInsurance,
      agentPerformance,
    },
    topLists: {
      topAgents,
      recentActivity,
      highValueCases,
    },
  };
}

function generateCasesOverTime(cases: Case[]) {
  const months: Record<string, { created: number; resolved: number }> = {};

  // Get last 12 months
  for (let i = 11; i >= 0; i--) {
    const date = subMonths(new Date(), i);
    const monthKey = format(date, 'MMM yyyy');
    months[monthKey] = { created: 0, resolved: 0 };
  }

  // Count cases by month
  cases.forEach((c) => {
    const createdAt = toDate(c.createdAt);
    const monthKey = format(createdAt, 'MMM yyyy');

    if (months[monthKey]) {
      months[monthKey].created++;
    }

    if (c.status === CASE_STATUSES.RESOLVED && c.closedAt) {
      const closedAt = toDate(c.closedAt);
      const closedMonthKey = format(closedAt, 'MMM yyyy');
      if (months[closedMonthKey]) {
        months[closedMonthKey].resolved++;
      }
    }
  });

  return Object.entries(months).map(([month, data]) => ({
    month,
    created: data.created,
    resolved: data.resolved,
    active: data.created - data.resolved,
  }));
}

function generateRevenueOverTime(cases: Case[]) {
  const months: Record<string, number> = {};

  // Get last 6 months
  for (let i = 5; i >= 0; i--) {
    const date = subMonths(new Date(), i);
    const monthKey = format(date, 'MMM yyyy');
    months[monthKey] = 0;
  }

  // Sum revenue by month
  cases
    .filter((c) => c.status === CASE_STATUSES.RESOLVED)
    .forEach((c) => {
      const createdAt = toDate(c.createdAt);
      const monthKey = format(createdAt, 'MMM yyyy');

      if (months[monthKey] !== undefined) {
        months[monthKey] += c.claimAmount * 0.15;
      }
    });

  return Object.entries(months).map(([month, revenue]) => ({
    month,
    revenue: Math.round(revenue),
  }));
}

function generateCasesByStatus(cases: Case[]) {
  const statusColors: Record<string, string> = {
    [CASE_STATUSES.NEW]: '#3B82F6',
    [CASE_STATUSES.IN_PROGRESS]: '#F59E0B',
    [CASE_STATUSES.WAITING_FOR_CLIENT]: '#EAB308',
    [CASE_STATUSES.WAITING_FOR_INSURANCE]: '#F97316',
    [CASE_STATUSES.RESOLVED]: '#10B981',
    [CASE_STATUSES.CLOSED]: '#6B7280',
  };

  const statusLabels: Record<string, string> = {
    [CASE_STATUSES.NEW]: 'Nový',
    [CASE_STATUSES.IN_PROGRESS]: 'Zpracovává se',
    [CASE_STATUSES.WAITING_FOR_CLIENT]: 'Čeká na klienta',
    [CASE_STATUSES.WAITING_FOR_INSURANCE]: 'Čeká na pojišťovnu',
    [CASE_STATUSES.RESOLVED]: 'Vyřešeno',
    [CASE_STATUSES.CLOSED]: 'Uzavřeno',
  };

  const statusCounts: Record<string, number> = {};

  cases.forEach((c) => {
    statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
  });

  return Object.entries(statusCounts).map(([status, count]) => ({
    name: statusLabels[status] || status,
    value: count,
    color: statusColors[status] || '#6B7280',
  }));
}

function generateCasesByInsurance(cases: Case[]) {
  const insuranceCounts: Record<string, number> = {};

  cases.forEach((c) => {
    insuranceCounts[c.insuranceCompany] =
      (insuranceCounts[c.insuranceCompany] || 0) + 1;
  });

  return Object.entries(insuranceCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([company, count]) => ({
      company,
      count,
    }));
}

async function generateAgentPerformance(cases: Case[]) {
  // Get all agents
  const usersRef = collection(db, 'users');
  const agentsQuery = query(usersRef, where('role', '==', 'agent'));
  const agentsSnap = await getDocs(agentsQuery);
  const agents = agentsSnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as User[];

  // Calculate performance per agent
  const performance = agents.map((agent) => {
    const agentCases = cases.filter((c) => c.assignedTo === agent.id);
    const resolvedCases = agentCases.filter(
      (c) => c.status === CASE_STATUSES.RESOLVED && c.closedAt
    );

    const avgTime =
      resolvedCases.length > 0
        ? resolvedCases.reduce((sum, c) => {
            const created = toDate(c.createdAt);
            const closed = toDate(c.closedAt!);
            return sum + differenceInDays(closed, created);
          }, 0) / resolvedCases.length
        : 0;

    return {
      name: agent.name,
      resolved: resolvedCases.length,
      avgTime: Math.round(avgTime),
    };
  });

  return performance.sort((a, b) => b.resolved - a.resolved);
}

async function generateTopAgents(cases: Case[]) {
  // Get all agents
  const usersRef = collection(db, 'users');
  const agentsQuery = query(usersRef, where('role', '==', 'agent'));
  const agentsSnap = await getDocs(agentsQuery);
  const agents = agentsSnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as User[];

  // Calculate performance per agent
  const performance = agents.map((agent) => {
    const agentCases = cases.filter((c) => c.assignedTo === agent.id);
    const resolvedCases = agentCases.filter(
      (c) => c.status === CASE_STATUSES.RESOLVED && c.closedAt
    );

    const avgTime =
      resolvedCases.length > 0
        ? resolvedCases.reduce((sum, c) => {
            const created = toDate(c.createdAt);
            const closed = toDate(c.closedAt!);
            return sum + differenceInDays(closed, created);
          }, 0) / resolvedCases.length
        : 0;

    // Calculate rating (lower avg time = better rating)
    const rating =
      resolvedCases.length > 0
        ? Math.min(5, Math.max(1, 5 - avgTime / 10))
        : 0;

    return {
      id: agent.id,
      name: agent.name,
      resolvedCases: resolvedCases.length,
      avgResolutionTime: Math.round(avgTime),
      rating: Math.round(rating * 10) / 10,
    };
  });

  return performance.sort((a, b) => b.resolvedCases - a.resolvedCases).slice(0, 5);
}

function generateRecentActivity(cases: Case[]) {
  const activities: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    timestamp: Date;
    user?: string;
  }> = [];

  // Get recently created cases
  cases
    .sort((a, b) => toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime())
    .slice(0, 5)
    .forEach((c) => {
      activities.push({
        id: c.id,
        type: 'case_created',
        title: 'Nový případ vytvořen',
        description: `Případ #${c.caseNumber} - ${c.insuranceCompany}`,
        timestamp: toDate(c.createdAt),
      });
    });

  // Get recently resolved cases
  cases
    .filter((c) => c.status === CASE_STATUSES.RESOLVED && c.closedAt)
    .sort((a, b) => toDate(b.closedAt!).getTime() - toDate(a.closedAt!).getTime())
    .slice(0, 5)
    .forEach((c) => {
      activities.push({
        id: c.id,
        type: 'case_resolved',
        title: 'Případ vyřešen',
        description: `Případ #${c.caseNumber} - ${new Intl.NumberFormat('cs-CZ', {
          style: 'currency',
          currency: 'CZK',
        }).format(c.claimAmount)}`,
        timestamp: toDate(c.closedAt!),
      });
    });

  return activities
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 10);
}

function generateHighValueCases(cases: Case[]) {
  return cases
    .filter((c) => c.status !== CASE_STATUSES.CLOSED)
    .sort((a, b) => b.claimAmount - a.claimAmount)
    .slice(0, 5)
    .map((c) => ({
      id: c.id,
      caseNumber: c.caseNumber,
      claimAmount: c.claimAmount,
      status: c.status,
      assignedTo: c.assignedToName,
      createdAt: toDate(c.createdAt),
    }));
}
