import { NextRequest, NextResponse } from 'next/server'
import { getFileById, updateFile, deleteFile, getStorageDownloadUrl } from '@/lib/drive-sync-store'
import { supabaseAdmin } from '@/lib/supabase-admin'
import * as gdrive from '@/lib/google-drive'
import { getDriveClientForFirm } from '@/lib/google-drive-firm'

export const dynamic = 'force-dynamic'

// GET - Get file details + signed download URL
export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { fileId } = params
    const file = await getFileById(fileId)

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Generate a signed download URL (1 hour expiry)
    const downloadUrl = await getStorageDownloadUrl(fileId, 3600)

    return NextResponse.json({ file, downloadUrl })
  } catch (error) {
    console.error('Get file error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// PATCH - Update file metadata (name, folder, fiscal year, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { fileId } = params
    const body = await request.json()

    const file = await getFileById(fileId)
    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const { name, folderId, fiscalYear, periodMonth, projectId, clientVisible, starred, tags } = body

    // Get per-firma Drive client
    const firmId = request.headers.get('x-firm-id')
    let dc: Awaited<ReturnType<typeof getDriveClientForFirm>>['drive'] | undefined
    if (firmId) {
      const result = await getDriveClientForFirm(firmId)
      dc = result.drive || undefined
    }

    // Sync rename to Google Drive if applicable
    if (name && name !== file.name && file.google_drive_id) {
      try {
        await gdrive.renameFile(file.google_drive_id, name, dc || undefined)
      } catch (driveErr) {
        console.error('Drive rename failed (continuing):', driveErr)
      }
    }

    // Sync move to Google Drive if folder changed
    if (folderId && folderId !== file.folder_id && file.google_drive_id) {
      try {
        const { data: newFolder } = await supabaseAdmin
          .from('document_folders')
          .select('google_drive_id')
          .eq('id', folderId)
          .single()

        if (newFolder?.google_drive_id) {
          await gdrive.moveFile(file.google_drive_id, newFolder.google_drive_id, dc || undefined)
        }
      } catch (driveErr) {
        console.error('Drive move failed (continuing):', driveErr)
      }
    }

    // Build DB update payload (only include fields that were sent)
    const updates: Record<string, unknown> = {}
    if (name !== undefined) updates.name = name
    if (folderId !== undefined) updates.folder_id = folderId
    if (fiscalYear !== undefined) updates.fiscal_year = fiscalYear
    if (periodMonth !== undefined) updates.period_month = periodMonth
    if (projectId !== undefined) updates.project_id = projectId
    if (clientVisible !== undefined) updates.client_visible = clientVisible
    if (starred !== undefined) updates.starred = starred
    if (tags !== undefined) updates.tags = tags

    const updated = await updateFile(fileId, updates as Parameters<typeof updateFile>[1])

    return NextResponse.json({ file: updated })
  } catch (error) {
    console.error('Update file error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE - Delete file (storage + Drive + DB)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { fileId } = params
    await deleteFile(fileId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete file error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
