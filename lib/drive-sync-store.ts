import { supabaseAdmin } from '@/lib/supabase-admin'
import type {
  DocumentFolder,
  DriveFile,
  DriveSyncState,
  FolderTemplate,
  FolderTreeItem,
  FolderContentsResponse,
  FileSortConfig,
  PeriodFilter,
  SyncResult,
  DriveCompanyMapping,
} from '@/lib/types/drive'
import * as gdrive from '@/lib/google-drive'

const DRIVE_CACHE_BUCKET = 'drive-cache'

// ============================================================
// FOLDER OPERATIONS
// ============================================================

// --- Init company folders from template ---

export async function initCompanyFolders(
  companyId: string,
  entityType: string
): Promise<DocumentFolder[]> {
  // Get templates matching entity type
  const { data: templates, error: tErr } = await supabaseAdmin
    .from('document_folder_templates')
    .select('*')
    .contains('entity_types', [entityType])
    .order('sort_order')

  if (tErr) throw new Error(`Get templates failed: ${tErr.message}`)

  // Check existing folders
  const { data: existing } = await supabaseAdmin
    .from('document_folders')
    .select('template_id')
    .eq('company_id', companyId)

  const existingTemplateIds = new Set((existing || []).map((f) => f.template_id))

  // Insert missing folders
  const toInsert = (templates || [])
    .filter((t) => !existingTemplateIds.has(t.id))
    .map((t: FolderTemplate) => ({
      company_id: companyId,
      template_id: t.id,
      name: t.name,
      slug: t.slug,
      icon: t.icon,
      is_system: true,
      is_custom: false,
      has_period_filter: t.has_period_filter,
      sort_order: t.sort_order,
      client_visible: true,
    }))

  if (toInsert.length === 0) return []

  const { data, error } = await supabaseAdmin
    .from('document_folders')
    .insert(toInsert)
    .select('*')

  if (error) throw new Error(`Init folders failed: ${error.message}`)
  return data as DocumentFolder[]
}

// --- Get folder tree ---

export async function getFolderTree(companyId: string): Promise<FolderTreeItem[]> {
  const { data, error } = await supabaseAdmin
    .from('document_folders')
    .select('*')
    .eq('company_id', companyId)
    .order('sort_order')

  if (error) throw new Error(`Get folder tree failed: ${error.message}`)

  const folders = (data || []) as DocumentFolder[]

  // Build tree (parent_id based)
  const rootFolders: FolderTreeItem[] = []
  const childMap = new Map<string, FolderTreeItem[]>()

  for (const f of folders) {
    const item: FolderTreeItem = { ...f }
    if (!f.parent_id) {
      rootFolders.push(item)
    } else {
      if (!childMap.has(f.parent_id)) childMap.set(f.parent_id, [])
      childMap.get(f.parent_id)!.push(item)
    }
  }

  // Attach children
  for (const root of rootFolders) {
    root.children = childMap.get(root.id) || []
  }

  return rootFolders
}

// --- Create custom folder ---

export async function createFolder(
  companyId: string,
  name: string,
  parentId?: string,
  opts?: { icon?: string; clientVisible?: boolean; hasPeriodFilter?: boolean }
): Promise<DocumentFolder> {
  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  const { data, error } = await supabaseAdmin
    .from('document_folders')
    .insert({
      company_id: companyId,
      parent_id: parentId || null,
      name,
      slug,
      icon: opts?.icon || 'folder',
      is_system: false,
      is_custom: true,
      has_period_filter: opts?.hasPeriodFilter ?? true,
      sort_order: 99,
      client_visible: opts?.clientVisible ?? true,
    })
    .select('*')
    .single()

  if (error) throw new Error(`Create folder failed: ${error.message}`)
  return data as DocumentFolder
}

// --- Update folder ---

export async function updateFolder(
  folderId: string,
  updates: Partial<Pick<DocumentFolder, 'name' | 'icon' | 'client_visible' | 'sort_order'>>
): Promise<DocumentFolder> {
  const { data, error } = await supabaseAdmin
    .from('document_folders')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', folderId)
    .select('*')
    .single()

  if (error) throw new Error(`Update folder failed: ${error.message}`)
  return data as DocumentFolder
}

// --- Delete custom folder ---

export async function deleteFolder(folderId: string): Promise<void> {
  // Only allow deleting custom folders
  const { data: folder } = await supabaseAdmin
    .from('document_folders')
    .select('is_custom')
    .eq('id', folderId)
    .single()

  if (!folder?.is_custom) {
    throw new Error('Cannot delete system folder')
  }

  const { error } = await supabaseAdmin
    .from('document_folders')
    .delete()
    .eq('id', folderId)

  if (error) throw new Error(`Delete folder failed: ${error.message}`)
}

// ============================================================
// FILE OPERATIONS
// ============================================================

// --- Get folder contents (files) with filters ---

export async function getFolderFiles(
  folderId: string,
  opts: {
    period?: PeriodFilter
    projectId?: string | null
    includeProjectFiles?: boolean
    search?: string
    page?: number
    perPage?: number
    sort?: FileSortConfig
  } = {}
): Promise<FolderContentsResponse> {
  const page = opts.page ?? 1
  const perPage = Math.min(opts.perPage ?? 50, 100)
  const offset = (page - 1) * perPage

  // Get folder info
  const { data: folder, error: fErr } = await supabaseAdmin
    .from('document_folders')
    .select('*')
    .eq('id', folderId)
    .single()

  if (fErr || !folder) throw new Error(`Folder not found: ${fErr?.message}`)

  // Build query
  let query = supabaseAdmin
    .from('drive_files')
    .select('*', { count: 'exact' })
    .eq('folder_id', folderId)

  // Period filter
  if (opts.period?.year) {
    query = query.eq('fiscal_year', opts.period.year)
  }
  if (opts.period?.month) {
    query = query.eq('period_month', opts.period.month)
  }

  // Project filter logic:
  // - If projectId specified: show only project files
  // - If includeProjectFiles = false (default): exclude project files from period view
  if (opts.projectId) {
    query = query.eq('project_id', opts.projectId)
  } else if (!opts.includeProjectFiles) {
    query = query.is('project_id', null)
  }

  // Search
  if (opts.search) {
    const s = opts.search.replace(/[%_]/g, '')
    if (s) {
      query = query.ilike('name', `%${s}%`)
    }
  }

  // Sort
  const sortField = opts.sort?.field || 'created_at'
  const ascending = opts.sort?.dir === 'asc'
  query = query.order(sortField, { ascending }).range(offset, offset + perPage - 1)

  const { data, error, count } = await query

  if (error) throw new Error(`Get files failed: ${error.message}`)

  const total = count ?? 0

  return {
    folder: folder as DocumentFolder,
    files: (data || []) as DriveFile[],
    pagination: {
      page,
      perPage,
      total,
      totalPages: Math.ceil(total / perPage),
    },
  }
}

// --- Upsert drive file ---

export async function upsertDriveFile(
  file: Partial<DriveFile> & { company_id: string; folder_id: string; name: string }
): Promise<DriveFile> {
  const now = new Date().toISOString()
  const record = { ...file, updated_at: now }

  // If google_drive_id exists, upsert by it
  if (file.google_drive_id) {
    const { data, error } = await supabaseAdmin
      .from('drive_files')
      .upsert(record, { onConflict: 'company_id,google_drive_id' })
      .select('*')
      .single()

    if (error) throw new Error(`Upsert file failed: ${error.message}`)
    return data as DriveFile
  }

  // Otherwise insert new
  const { data, error } = await supabaseAdmin
    .from('drive_files')
    .insert(record)
    .select('*')
    .single()

  if (error) throw new Error(`Insert file failed: ${error.message}`)
  return data as DriveFile
}

// --- Get file by ID ---

export async function getFileById(fileId: string): Promise<DriveFile | null> {
  const { data, error } = await supabaseAdmin
    .from('drive_files')
    .select('*')
    .eq('id', fileId)
    .single()

  if (error) return null
  return data as DriveFile
}

// --- Update file ---

export async function updateFile(
  fileId: string,
  updates: Partial<Pick<DriveFile, 'name' | 'folder_id' | 'fiscal_year' | 'period_month' | 'project_id' | 'client_visible' | 'starred' | 'tags'>>
): Promise<DriveFile> {
  const { data, error } = await supabaseAdmin
    .from('drive_files')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', fileId)
    .select('*')
    .single()

  if (error) throw new Error(`Update file failed: ${error.message}`)
  return data as DriveFile
}

// --- Delete file ---

export async function deleteFile(fileId: string): Promise<void> {
  const file = await getFileById(fileId)
  if (!file) throw new Error('File not found')

  // Delete from storage cache
  if (file.storage_path) {
    await supabaseAdmin.storage.from(DRIVE_CACHE_BUCKET).remove([file.storage_path])
  }

  // Trash in Google Drive
  if (file.google_drive_id) {
    try {
      await gdrive.trashFile(file.google_drive_id)
    } catch {
      // Continue even if Drive delete fails (file may not exist)
    }
  }

  // Delete from DB
  const { error } = await supabaseAdmin
    .from('drive_files')
    .delete()
    .eq('id', fileId)

  if (error) throw new Error(`Delete file failed: ${error.message}`)

  // Update folder file count
  await updateFolderStats(file.folder_id)
}

// --- Get recent files across all folders for a company ---

export async function getRecentFiles(
  companyId: string,
  limit: number = 10
): Promise<DriveFile[]> {
  const { data, error } = await supabaseAdmin
    .from('drive_files')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(`Get recent files failed: ${error.message}`)
  return (data || []) as DriveFile[]
}

// ============================================================
// STORAGE CACHE (Supabase Storage <-> Google Drive)
// ============================================================

// --- Cache file from Drive to Supabase Storage ---

export async function cacheFileToStorage(
  fileId: string
): Promise<string> {
  const file = await getFileById(fileId)
  if (!file) throw new Error('File not found')
  if (!file.google_drive_id) throw new Error('No Drive file ID')

  // Download from Drive
  const stream = await gdrive.downloadFile(file.google_drive_id)

  // Collect into buffer
  const chunks: Buffer[] = []
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk))
  }
  const buffer = Buffer.concat(chunks)

  // Upload to Supabase Storage
  const storagePath = `${file.company_id}/${file.folder_id}/${file.id}/${file.name}`

  const { error: uploadError } = await supabaseAdmin.storage
    .from(DRIVE_CACHE_BUCKET)
    .upload(storagePath, buffer, {
      contentType: file.mime_type || 'application/octet-stream',
      upsert: true,
    })

  if (uploadError) throw new Error(`Cache to storage failed: ${uploadError.message}`)

  // Update file record
  await supabaseAdmin
    .from('drive_files')
    .update({
      storage_path: storagePath,
      cached_at: new Date().toISOString(),
      sync_status: 'synced',
    })
    .eq('id', fileId)

  return storagePath
}

// --- Get download URL from storage cache ---

export async function getStorageDownloadUrl(
  fileId: string,
  expiresIn: number = 3600
): Promise<string | null> {
  const file = await getFileById(fileId)
  if (!file?.storage_path) return null

  const { data } = await supabaseAdmin.storage
    .from(DRIVE_CACHE_BUCKET)
    .createSignedUrl(file.storage_path, expiresIn)

  return data?.signedUrl || null
}

// --- Upload new file (app -> Storage -> Drive) ---

export async function uploadNewFile(
  companyId: string,
  folderId: string,
  fileName: string,
  fileBuffer: Buffer,
  mimeType: string,
  opts?: {
    fiscalYear?: number
    periodMonth?: number
    projectId?: string
    clientVisible?: boolean
  }
): Promise<DriveFile> {
  // 1. Insert file record
  const file = await upsertDriveFile({
    company_id: companyId,
    folder_id: folderId,
    name: fileName,
    mime_type: mimeType,
    size_bytes: fileBuffer.length,
    fiscal_year: opts?.fiscalYear ?? null,
    period_month: opts?.periodMonth ?? null,
    project_id: opts?.projectId ?? null,
    client_visible: opts?.clientVisible ?? null,
    sync_status: 'uploading',
    starred: false,
    tags: [],
  })

  // 2. Upload to Supabase Storage
  const storagePath = `${companyId}/${folderId}/${file.id}/${fileName}`
  const { error: storageErr } = await supabaseAdmin.storage
    .from(DRIVE_CACHE_BUCKET)
    .upload(storagePath, fileBuffer, {
      contentType: mimeType,
      upsert: true,
    })

  if (storageErr) {
    // Clean up file record on failure
    await supabaseAdmin.from('drive_files').delete().eq('id', file.id)
    throw new Error(`Upload to storage failed: ${storageErr.message}`)
  }

  // 3. Upload to Google Drive (async - try but don't fail)
  let driveFileId: string | null = null
  let webViewLink: string | null = null
  let md5: string | null = null

  // Get folder's Drive ID for upload destination
  const { data: folder } = await supabaseAdmin
    .from('document_folders')
    .select('google_drive_id')
    .eq('id', folderId)
    .single()

  if (folder?.google_drive_id) {
    try {
      const driveFile = await gdrive.uploadFile(
        folder.google_drive_id,
        fileName,
        fileBuffer,
        mimeType
      )
      driveFileId = driveFile.id
      webViewLink = driveFile.webViewLink
      md5 = driveFile.md5Checksum
    } catch {
      // Drive upload failed - file stays only in Storage
    }
  }

  // 4. Update file record with storage + drive info
  const { data: updated, error: updateErr } = await supabaseAdmin
    .from('drive_files')
    .update({
      storage_path: storagePath,
      cached_at: new Date().toISOString(),
      google_drive_id: driveFileId,
      web_view_link: webViewLink,
      md5_checksum: md5,
      sync_status: driveFileId ? 'synced' : 'pending',
      updated_at: new Date().toISOString(),
    })
    .eq('id', file.id)
    .select('*')
    .single()

  if (updateErr) throw new Error(`Update file record failed: ${updateErr.message}`)

  // 5. Update folder stats
  await updateFolderStats(folderId)

  return updated as DriveFile
}

// ============================================================
// SYNC ENGINE
// ============================================================

// --- Full sync from Drive ---

export async function syncCompanyFull(companyId: string): Promise<SyncResult> {
  const start = Date.now()
  let added = 0, updated = 0, deleted = 0, errors = 0

  // Get company's Drive folder
  const { data: company } = await supabaseAdmin
    .from('companies')
    .select('google_drive_folder_id')
    .eq('id', companyId)
    .single()

  if (!company?.google_drive_folder_id) {
    throw new Error('Company has no Google Drive folder mapped')
  }

  // Update sync state
  await upsertSyncState(companyId, { sync_status: 'syncing' })

  try {
    // List all Drive files
    const { files: driveFiles } = await gdrive.listFolderRecursive(company.google_drive_folder_id)

    // Get existing files in DB
    const { data: dbFiles } = await supabaseAdmin
      .from('drive_files')
      .select('id, google_drive_id, md5_checksum')
      .eq('company_id', companyId)

    const dbMap = new Map((dbFiles || []).map((f) => [f.google_drive_id, f]))

    // Get default folder (Ostatni doklady) for unmatched files
    const { data: defaultFolder } = await supabaseAdmin
      .from('document_folders')
      .select('id')
      .eq('company_id', companyId)
      .eq('slug', 'ostatni')
      .single()

    const defaultFolderId = defaultFolder?.id
    if (!defaultFolderId) {
      throw new Error('Default folder (ostatni) not found. Init company folders first.')
    }

    // Upsert files
    for (const df of driveFiles) {
      try {
        const existing = dbMap.get(df.id)
        if (existing) {
          // Update if changed
          if (existing.md5_checksum !== df.md5Checksum) {
            await supabaseAdmin
              .from('drive_files')
              .update({
                name: df.name,
                mime_type: df.mimeType,
                size_bytes: df.size,
                md5_checksum: df.md5Checksum,
                drive_modified_at: df.modifiedTime,
                web_view_link: df.webViewLink,
                sync_status: 'synced',
                updated_at: new Date().toISOString(),
              })
              .eq('id', existing.id)
            updated++
          }
          dbMap.delete(df.id) // Mark as seen
        } else {
          // New file
          await supabaseAdmin.from('drive_files').insert({
            company_id: companyId,
            folder_id: defaultFolderId,
            name: df.name,
            mime_type: df.mimeType,
            size_bytes: df.size,
            google_drive_id: df.id,
            md5_checksum: df.md5Checksum,
            drive_modified_at: df.modifiedTime,
            web_view_link: df.webViewLink,
            sync_status: 'synced',
          })
          added++
        }
      } catch {
        errors++
      }
    }

    // Files in DB but not in Drive = deleted
    for (const [, remaining] of dbMap) {
      if (remaining.google_drive_id) {
        await supabaseAdmin.from('drive_files').delete().eq('id', remaining.id)
        deleted++
      }
    }

    // Get start page token for future incremental syncs
    const pageToken = await gdrive.getStartPageToken()

    // Update sync state
    await upsertSyncState(companyId, {
      sync_status: 'synced',
      sync_error: null,
      last_full_sync_at: new Date().toISOString(),
      changes_page_token: pageToken,
      total_files: driveFiles.length,
      total_size_bytes: driveFiles.reduce((sum, f) => sum + f.size, 0),
    })

    // Update folder stats
    await updateAllFolderStats(companyId)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    await upsertSyncState(companyId, { sync_status: 'error', sync_error: msg })
    throw err
  }

  return { added, updated, deleted, errors, duration_ms: Date.now() - start }
}

// --- Incremental sync via Changes API ---

export async function syncCompanyIncremental(companyId: string): Promise<SyncResult> {
  const start = Date.now()
  let added = 0, updated = 0, deleted = 0, errors = 0

  const { data: syncState } = await supabaseAdmin
    .from('drive_sync_state')
    .select('changes_page_token')
    .eq('company_id', companyId)
    .single()

  if (!syncState?.changes_page_token) {
    // No token = need full sync first
    return syncCompanyFull(companyId)
  }

  await upsertSyncState(companyId, { sync_status: 'syncing' })

  try {
    let pageToken: string | null = syncState.changes_page_token
    let newToken: string | null = null

    while (pageToken) {
      const result = await gdrive.getChanges(pageToken)

      for (const change of result.changes) {
        try {
          if (change.removed) {
            // File removed
            const { data: existing } = await supabaseAdmin
              .from('drive_files')
              .select('id')
              .eq('company_id', companyId)
              .eq('google_drive_id', change.fileId)
              .single()

            if (existing) {
              await supabaseAdmin.from('drive_files').delete().eq('id', existing.id)
              deleted++
            }
          } else if (change.file) {
            // File added or modified
            const { data: existing } = await supabaseAdmin
              .from('drive_files')
              .select('id, folder_id')
              .eq('company_id', companyId)
              .eq('google_drive_id', change.fileId)
              .single()

            if (existing) {
              await supabaseAdmin
                .from('drive_files')
                .update({
                  name: change.file.name,
                  mime_type: change.file.mimeType,
                  size_bytes: change.file.size,
                  md5_checksum: change.file.md5Checksum,
                  drive_modified_at: change.file.modifiedTime,
                  web_view_link: change.file.webViewLink,
                  sync_status: 'synced',
                  updated_at: new Date().toISOString(),
                })
                .eq('id', existing.id)
              updated++
            } else {
              // New file — get default folder
              const { data: defaultFolder } = await supabaseAdmin
                .from('document_folders')
                .select('id')
                .eq('company_id', companyId)
                .eq('slug', 'ostatni')
                .single()

              if (defaultFolder) {
                await supabaseAdmin.from('drive_files').insert({
                  company_id: companyId,
                  folder_id: defaultFolder.id,
                  name: change.file.name,
                  mime_type: change.file.mimeType,
                  size_bytes: change.file.size,
                  google_drive_id: change.file.id,
                  md5_checksum: change.file.md5Checksum,
                  drive_modified_at: change.file.modifiedTime,
                  web_view_link: change.file.webViewLink,
                  sync_status: 'synced',
                })
                added++
              }
            }
          }
        } catch {
          errors++
        }
      }

      if (result.newStartPageToken) newToken = result.newStartPageToken
      pageToken = result.nextPageToken
    }

    await upsertSyncState(companyId, {
      sync_status: 'synced',
      sync_error: null,
      last_incremental_sync_at: new Date().toISOString(),
      changes_page_token: newToken || syncState.changes_page_token,
    })

    await updateAllFolderStats(companyId)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    await upsertSyncState(companyId, { sync_status: 'error', sync_error: msg })
    throw err
  }

  return { added, updated, deleted, errors, duration_ms: Date.now() - start }
}

// ============================================================
// COMPANY-DRIVE MAPPING
// ============================================================

export async function mapCompanyToDrive(
  companyId: string,
  driveFolderId: string
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('companies')
    .update({ google_drive_folder_id: driveFolderId })
    .eq('id', companyId)

  if (error) throw new Error(`Map company to Drive failed: ${error.message}`)
}

export async function getCompanyDriveMappings(): Promise<DriveCompanyMapping[]> {
  const { data, error } = await supabaseAdmin
    .from('companies')
    .select('id, name, google_drive_folder_id')
    .order('name')

  if (error) throw new Error(`Get mappings failed: ${error.message}`)

  // Get sync states
  const { data: syncStates } = await supabaseAdmin
    .from('drive_sync_state')
    .select('company_id, sync_status, last_full_sync_at, last_incremental_sync_at, total_files')

  const syncMap = new Map(
    (syncStates || []).map((s) => [s.company_id, s])
  )

  return (data || []).map((c) => {
    const sync = syncMap.get(c.id)
    return {
      company_id: c.id,
      company_name: c.name,
      google_drive_folder_id: c.google_drive_folder_id,
      sync_status: (sync?.sync_status as DriveSyncState['sync_status']) ?? null,
      last_sync_at: sync?.last_incremental_sync_at || sync?.last_full_sync_at || null,
      total_files: sync?.total_files ?? 0,
    }
  })
}

export async function unmapCompanyDrive(companyId: string): Promise<void> {
  // Clear the mapping on the company
  const { error } = await supabaseAdmin
    .from('companies')
    .update({ google_drive_folder_id: null })
    .eq('id', companyId)

  if (error) throw new Error(`Unmap company failed: ${error.message}`)

  // Remove sync state
  await supabaseAdmin
    .from('drive_sync_state')
    .delete()
    .eq('company_id', companyId)
}

// ============================================================
// SYNC STATE
// ============================================================

async function upsertSyncState(
  companyId: string,
  updates: Partial<Omit<DriveSyncState, 'id' | 'company_id' | 'created_at'>>
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('drive_sync_state')
    .upsert(
      { company_id: companyId, ...updates, updated_at: new Date().toISOString() },
      { onConflict: 'company_id' }
    )

  if (error) throw new Error(`Upsert sync state failed: ${error.message}`)
}

export async function getSyncState(companyId: string): Promise<DriveSyncState | null> {
  const { data } = await supabaseAdmin
    .from('drive_sync_state')
    .select('*')
    .eq('company_id', companyId)
    .single()

  return data as DriveSyncState | null
}

// ============================================================
// HELPERS
// ============================================================

async function updateFolderStats(folderId: string): Promise<void> {
  const { count } = await supabaseAdmin
    .from('drive_files')
    .select('*', { count: 'exact', head: true })
    .eq('folder_id', folderId)

  const { data: sizeData } = await supabaseAdmin
    .from('drive_files')
    .select('size_bytes')
    .eq('folder_id', folderId)

  const totalSize = (sizeData || []).reduce((sum, f) => sum + (Number(f.size_bytes) || 0), 0)

  await supabaseAdmin
    .from('document_folders')
    .update({
      file_count: count ?? 0,
      total_size_bytes: totalSize,
      updated_at: new Date().toISOString(),
    })
    .eq('id', folderId)
}

async function updateAllFolderStats(companyId: string): Promise<void> {
  const { data: folders } = await supabaseAdmin
    .from('document_folders')
    .select('id')
    .eq('company_id', companyId)

  for (const f of folders || []) {
    await updateFolderStats(f.id)
  }
}
