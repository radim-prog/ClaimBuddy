import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createNotionCase, listNotionCases } from '@/lib/notion';
import { errorResponse, successResponse } from '@/lib/api-helpers';
import { notifyCaseCreated } from '@/lib/notifications';

const publicCaseSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  insuranceType: z.string().min(2),
  insuranceCompany: z.string().min(2),
  incidentDate: z.string().min(8),
  incidentLocation: z.string().min(2),
  incidentDescription: z.string().min(10),
  claimAmount: z.number().optional(),
});

export async function GET() {
  try {
    const cases = await listNotionCases(30);
    return successResponse({ cases });
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to load cases', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = publicCaseSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse(validation.error.errors[0].message, 400);
    }

    const created = await createNotionCase(validation.data);
    void notifyCaseCreated({
      email: validation.data.email,
      fullName: validation.data.fullName,
      caseNumber: created.caseNumber,
    }).catch(() => undefined);
    return successResponse({ id: created.id, caseNumber: created.caseNumber, notionUrl: created.url }, 201);
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to create case', 500);
  }
}
