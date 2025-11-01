import { NextRequest } from 'next/server';
import { getAuthUser, errorResponse, successResponse } from '@/lib/api-helpers';
import { uploadFile } from '@/lib/firebase/storage';
import { MAX_FILE_SIZE } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser(request);
    if (authError || !user) {
      return errorResponse('Unauthorized', 401);
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const caseId = formData.get('caseId') as string;

    if (!file) {
      return errorResponse('No file provided', 400);
    }

    if (!caseId) {
      return errorResponse('Case ID is required', 400);
    }

    // Validace velikosti
    if (file.size > MAX_FILE_SIZE) {
      return errorResponse(`File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024} MB`, 400);
    }

    // Validace typu
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (!allowedTypes.includes(file.type)) {
      return errorResponse('Unsupported file type', 400);
    }

    // Upload souboru
    const path = `cases/${caseId}/documents`;
    const { url, storagePath, error } = await uploadFile(file, path);

    if (error) {
      return errorResponse(error, 500);
    }

    return successResponse({
      url,
      storagePath,
      name: file.name,
      type: file.type,
      size: file.size,
    }, 201);
  } catch (error: any) {
    console.error('POST /api/upload error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
