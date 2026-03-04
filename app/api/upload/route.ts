import { NextRequest } from 'next/server';
import { errorResponse } from '@/lib/api-helpers';

export async function POST(request: NextRequest) {
  const caseId = request.nextUrl.searchParams.get('caseId');
  if (!caseId) {
    return errorResponse('Použij /api/admin/cases/{id}/documents nebo předej caseId query param.', 400);
  }

  return errorResponse('Použij /api/admin/cases/{id}/documents pro upload dokumentů.', 400);
}

export async function GET() {
  return errorResponse('Použij /api/admin/cases/{id}/documents.', 400);
}
