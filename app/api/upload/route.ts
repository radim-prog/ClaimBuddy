import { NextRequest } from 'next/server';
import { getAuthUser, errorResponse, successResponse } from '@/lib/api-helpers';
import { uploadFile } from '@/lib/firebase/storage';
import { MAX_FILE_SIZE } from '@/lib/constants';

// Magic bytes pro různé file types
const MAGIC_BYTES: Record<string, number[][]> = {
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
  'image/jpeg': [[0xFF, 0xD8, 0xFF]], // JPEG
  'image/png': [[0x89, 0x50, 0x4E, 0x47]], // PNG
  'image/gif': [[0x47, 0x49, 0x46, 0x38]], // GIF8
  'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF (WebP)
  // MS Word (.doc)
  'application/msword': [[0xD0, 0xCF, 0x11, 0xE0]],
  // MS Word (.docx) - ZIP format
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [[0x50, 0x4B, 0x03, 0x04]],
  // Excel (.xls)
  'application/vnd.ms-excel': [[0xD0, 0xCF, 0x11, 0xE0]],
  // Excel (.xlsx) - ZIP format
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [[0x50, 0x4B, 0x03, 0x04]],
};

function validateMagicBytes(buffer: ArrayBuffer, declaredType: string): boolean {
  const bytes = new Uint8Array(buffer);
  const signatures = MAGIC_BYTES[declaredType];

  if (!signatures) {
    // Unknown type, allow (frontend already validated)
    return true;
  }

  // Check if file starts with any of the valid signatures
  return signatures.some(signature => {
    return signature.every((byte, index) => bytes[index] === byte);
  });
}

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
      return errorResponse('Invalid file type', 400);
    }

    // SERVER-SIDE MIME VALIDATION - Magic bytes check
    const fileBuffer = await file.arrayBuffer();
    if (!validateMagicBytes(fileBuffer, file.type)) {
      return errorResponse(
        'File content does not match declared type. Possible malware or corrupted file.',
        400
      );
    }

    // SECURITY: Verify case ownership
    const { getCase } = await import('@/lib/firebase/firestore');
    const caseData = await getCase(caseId);

    if (!caseData) {
      return errorResponse('Case not found', 404);
    }

    if (caseData.userId !== user.uid) {
      return errorResponse('You do not have permission to upload to this case', 403);
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
      message: 'File uploaded successfully',
    }, 201);
  } catch (error: any) {
    console.error('POST /api/upload error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
