import { NextRequest } from 'next/server';
import { requireAdminRequest } from '@/lib/admin-auth';
import { errorResponse } from '@/lib/api-helpers';
import { listNotionCasesForAdmin } from '@/lib/notion';

function escapeCsv(value: string) {
  const text = String(value ?? '');
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export async function GET(request: NextRequest) {
  const unauthorized = requireAdminRequest(request);
  if (unauthorized) return unauthorized;

  try {
    const status = request.nextUrl.searchParams.get('status') || undefined;
    const items = (await listNotionCasesForAdmin(500, status)) as any[];

    const headers = [
      'id',
      'caseNumber',
      'fullName',
      'email',
      'phone',
      'status',
      'priority',
      'assignee',
      'claimAmount',
      'incidentDate',
      'insuranceCompany',
      'createdTime',
    ];

    const rows = items.map((item) =>
      [
        item.id,
        item.caseNumber,
        item.fullName,
        item.email,
        item.phone,
        item.status,
        item.priority,
        item.assignee,
        item.claimAmount,
        item.incidentDate,
        item.insuranceCompany,
        item.createdTime,
      ]
        .map((value) => escapeCsv(String(value ?? '')))
        .join(','),
    );

    const csv = [headers.join(','), ...rows].join('\n');

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="pojistna-pomoc-cases-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to export cases', 500);
  }
}
