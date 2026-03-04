import { errorResponse } from '@/lib/api-helpers';

export async function POST() {
  return errorResponse('OCR is disabled in Notion mode', 501);
}
