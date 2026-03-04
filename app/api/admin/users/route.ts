import { errorResponse } from '@/lib/api-helpers';

export async function GET() {
  return errorResponse('Endpoint disabled in Notion mode', 501);
}

export async function POST() {
  return errorResponse('Endpoint disabled in Notion mode', 501);
}

export async function PATCH() {
  return errorResponse('Endpoint disabled in Notion mode', 501);
}

export async function PUT() {
  return errorResponse('Endpoint disabled in Notion mode', 501);
}

export async function DELETE() {
  return errorResponse('Endpoint disabled in Notion mode', 501);
}
