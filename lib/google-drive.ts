import { google, drive_v3 } from 'googleapis'

// --- OAuth2 singleton with auto-refresh ---

let driveInstance: drive_v3.Drive | null = null

function getDriveClient(): drive_v3.Drive {
  if (driveInstance) return driveInstance

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  })

  driveInstance = google.drive({ version: 'v3', auth: oauth2Client })
  return driveInstance
}

// --- Types ---

export type DriveFileInfo = {
  id: string
  name: string
  mimeType: string
  size: number
  md5Checksum: string | null
  modifiedTime: string
  webViewLink: string | null
  parents: string[]
}

export type DriveFolderInfo = {
  id: string
  name: string
  mimeType: string
}

const FOLDER_MIME = 'application/vnd.google-apps.folder'

const FILE_FIELDS = 'id, name, mimeType, size, md5Checksum, modifiedTime, webViewLink, parents'

// Shared drive support flags (KLIENTI folder is in a shared drive)
const SHARED_DRIVE_OPTS = {
  supportsAllDrives: true,
  includeItemsFromAllDrives: true,
}

// --- List folder contents ---

export async function listFolder(
  folderId: string,
  pageToken?: string,
  pageSize: number = 100
): Promise<{ files: DriveFileInfo[]; nextPageToken: string | null }> {
  const drive = getDriveClient()
  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: `nextPageToken, files(${FILE_FIELDS})`,
    pageSize,
    pageToken: pageToken || undefined,
    orderBy: 'name',
    ...SHARED_DRIVE_OPTS,
  })

  const files = (res.data.files || []).map(mapDriveFile)
  return { files, nextPageToken: res.data.nextPageToken || null }
}

// --- List all files in folder (handles pagination) ---

export async function listFolderAll(folderId: string): Promise<DriveFileInfo[]> {
  const allFiles: DriveFileInfo[] = []
  let pageToken: string | null = null

  do {
    const result = await listFolder(folderId, pageToken || undefined)
    allFiles.push(...result.files)
    pageToken = result.nextPageToken
  } while (pageToken)

  return allFiles
}

// --- List folder recursive (full tree) ---

export async function listFolderRecursive(
  folderId: string
): Promise<{ folders: DriveFolderInfo[]; files: DriveFileInfo[] }> {
  const allFolders: DriveFolderInfo[] = []
  const allFiles: DriveFileInfo[] = []

  async function traverse(parentId: string) {
    const items = await listFolderAll(parentId)
    for (const item of items) {
      if (item.mimeType === FOLDER_MIME) {
        allFolders.push({ id: item.id, name: item.name, mimeType: item.mimeType })
        await traverse(item.id)
      } else {
        allFiles.push(item)
      }
    }
  }

  await traverse(folderId)
  return { folders: allFolders, files: allFiles }
}

// --- Get file metadata ---

export async function getFileMetadata(fileId: string): Promise<DriveFileInfo> {
  const drive = getDriveClient()
  const res = await drive.files.get({
    fileId,
    fields: FILE_FIELDS,
    ...SHARED_DRIVE_OPTS,
  })
  return mapDriveFile(res.data)
}

// --- Download file as stream ---

export async function downloadFile(fileId: string): Promise<NodeJS.ReadableStream> {
  const drive = getDriveClient()
  const res = await drive.files.get(
    { fileId, alt: 'media', ...SHARED_DRIVE_OPTS },
    { responseType: 'stream' }
  )
  return res.data as unknown as NodeJS.ReadableStream
}

// --- Upload file ---

export async function uploadFile(
  folderId: string,
  name: string,
  content: Buffer | NodeJS.ReadableStream,
  mimeType: string
): Promise<DriveFileInfo> {
  const drive = getDriveClient()
  const res = await drive.files.create({
    requestBody: {
      name,
      parents: [folderId],
    },
    media: {
      mimeType,
      body: content,
    },
    fields: FILE_FIELDS,
    ...SHARED_DRIVE_OPTS,
  })
  return mapDriveFile(res.data)
}

// --- Create folder ---

export async function createDriveFolder(
  parentId: string,
  name: string
): Promise<DriveFolderInfo> {
  const drive = getDriveClient()
  const res = await drive.files.create({
    requestBody: {
      name,
      mimeType: FOLDER_MIME,
      parents: [parentId],
    },
    fields: 'id, name, mimeType',
    ...SHARED_DRIVE_OPTS,
  })
  return {
    id: res.data.id!,
    name: res.data.name!,
    mimeType: res.data.mimeType!,
  }
}

// --- Move file ---

export async function moveFile(fileId: string, newParentId: string): Promise<void> {
  const drive = getDriveClient()
  const file = await drive.files.get({ fileId, fields: 'parents', ...SHARED_DRIVE_OPTS })
  const previousParents = (file.data.parents || []).join(',')

  await drive.files.update({
    fileId,
    addParents: newParentId,
    removeParents: previousParents,
    ...SHARED_DRIVE_OPTS,
  })
}

// --- Rename file ---

export async function renameFile(fileId: string, newName: string): Promise<void> {
  const drive = getDriveClient()
  await drive.files.update({
    fileId,
    requestBody: { name: newName },
    ...SHARED_DRIVE_OPTS,
  })
}

// --- Delete file (move to trash) ---

export async function trashFile(fileId: string): Promise<void> {
  const drive = getDriveClient()
  await drive.files.update({
    fileId,
    requestBody: { trashed: true },
    ...SHARED_DRIVE_OPTS,
  })
}

// --- Copy file ---

export async function copyFile(
  fileId: string,
  newName?: string,
  newParentId?: string
): Promise<DriveFileInfo> {
  const drive = getDriveClient()
  const requestBody: Record<string, unknown> = {}
  if (newName) requestBody.name = newName
  if (newParentId) requestBody.parents = [newParentId]

  const res = await drive.files.copy({
    fileId,
    requestBody,
    fields: FILE_FIELDS,
    ...SHARED_DRIVE_OPTS,
  })
  return mapDriveFile(res.data)
}

// --- Changes API (incremental sync) ---

export async function getStartPageToken(): Promise<string> {
  const drive = getDriveClient()
  const res = await drive.changes.getStartPageToken({ ...SHARED_DRIVE_OPTS })
  return res.data.startPageToken!
}

export type DriveChange = {
  fileId: string
  removed: boolean
  file: DriveFileInfo | null
}

export async function getChanges(
  pageToken: string
): Promise<{ changes: DriveChange[]; newStartPageToken: string | null; nextPageToken: string | null }> {
  const drive = getDriveClient()
  const res = await drive.changes.list({
    pageToken,
    fields: `nextPageToken, newStartPageToken, changes(fileId, removed, file(${FILE_FIELDS}))`,
    pageSize: 100,
    includeRemoved: true,
    ...SHARED_DRIVE_OPTS,
  })

  const changes: DriveChange[] = (res.data.changes || []).map((c) => ({
    fileId: c.fileId!,
    removed: c.removed || false,
    file: c.file ? mapDriveFile(c.file) : null,
  }))

  return {
    changes,
    newStartPageToken: res.data.newStartPageToken || null,
    nextPageToken: res.data.nextPageToken || null,
  }
}

// --- Helper: map Google API response to our type ---

function mapDriveFile(data: drive_v3.Schema$File): DriveFileInfo {
  return {
    id: data.id!,
    name: data.name!,
    mimeType: data.mimeType!,
    size: Number(data.size) || 0,
    md5Checksum: data.md5Checksum || null,
    modifiedTime: data.modifiedTime || '',
    webViewLink: data.webViewLink || null,
    parents: data.parents || [],
  }
}
