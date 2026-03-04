import { NextRequest } from 'next/server';
import path from 'path';
import { mkdir, writeFile } from 'fs/promises';
import { errorResponse, successResponse } from '@/lib/api-helpers';
import { requireAdminRequest } from '@/lib/admin-auth';
import { addNotionCaseDocument, listNotionCaseDocuments } from '@/lib/notion';

const ALLOWED_EXTENSIONS = new Set(['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'txt']);
const MAX_FILE_BYTES = 10 * 1024 * 1024;

function sanitizeFileName(name: string) {
  const cleaned = name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  return cleaned || 'soubor';
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const unauthorized = requireAdminRequest(request);
  if (unauthorized) return unauthorized;

  try {
    const documents = await listNotionCaseDocuments(params.id);
    return successResponse({ documents });
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to load documents', 500);
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const unauthorized = requireAdminRequest(request);
  if (unauthorized) return unauthorized;

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return errorResponse('Soubor chybí', 400);
    }

    if (file.size <= 0 || file.size > MAX_FILE_BYTES) {
      return errorResponse('Soubor je příliš velký (max 10 MB)', 400);
    }

    const originalName = sanitizeFileName(file.name || 'soubor');
    const ext = originalName.includes('.') ? originalName.split('.').pop()?.toLowerCase() || '' : '';

    if (!ext || !ALLOWED_EXTENSIONS.has(ext)) {
      return errorResponse('Nepodporovaný typ souboru', 400);
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const baseDir = path.join(process.cwd(), 'public', 'uploads', 'cases', params.id);
    await mkdir(baseDir, { recursive: true });

    const finalName = `${Date.now()}-${originalName}`;
    const absolutePath = path.join(baseDir, finalName);
    await writeFile(absolutePath, bytes);

    const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
    const publicUrl = `${appUrl}/uploads/cases/${params.id}/${finalName}`;

    const updated = await addNotionCaseDocument(params.id, {
      name: originalName,
      url: publicUrl,
      size: file.size,
      uploadedBy: 'admin',
    });

    return successResponse({ url: publicUrl, case: updated, documents: updated.documents || [] }, 201);
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to upload document', 500);
  }
}
