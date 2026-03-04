import { NextRequest } from 'next/server';
import { z } from 'zod';
import { errorResponse, successResponse } from '@/lib/api-helpers';
import { requireAdminRequest } from '@/lib/admin-auth';
import { addNotionCaseNote, listNotionCaseNotes } from '@/lib/notion';

const messageSchema = z.object({
  message: z.string().min(2).max(1500),
});

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const unauthorized = requireAdminRequest(request);
  if (unauthorized) return unauthorized;

  try {
    const notes = await listNotionCaseNotes(params.id);
    return successResponse({ messages: notes });
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to load messages', 500);
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const unauthorized = requireAdminRequest(request);
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = messageSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse('Invalid message payload', 400);
    }

    const updated = await addNotionCaseNote(params.id, parsed.data.message, 'admin');
    return successResponse({ case: updated, messages: updated.notes || [] }, 201);
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to save message', 500);
  }
}
