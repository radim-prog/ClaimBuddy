// --- Folder Templates ---

export type FolderTemplate = {
  id: string
  name: string
  slug: string
  icon: string
  entity_types: string[] // 'osvc' | 'sro' | 'as'
  is_mandatory: boolean
  sort_order: number
  has_period_filter: boolean
  auto_ocr: boolean
  created_at: string
}

// --- Document Folders ---

export type DocumentFolder = {
  id: string
  company_id: string
  template_id: string | null
  parent_id: string | null
  name: string
  slug: string
  icon: string
  is_system: boolean
  is_custom: boolean
  has_period_filter: boolean
  sort_order: number
  client_visible: boolean
  google_drive_id: string | null
  file_count: number
  total_size_bytes: number
  created_at: string
  updated_at: string
}

// --- Drive Files ---

export type DriveFile = {
  id: string
  company_id: string
  folder_id: string
  name: string
  mime_type: string | null
  size_bytes: number | null
  fiscal_year: number | null
  period_month: number | null
  project_id: string | null
  client_visible: boolean | null
  google_drive_id: string | null
  md5_checksum: string | null
  drive_modified_at: string | null
  web_view_link: string | null
  storage_path: string | null
  cached_at: string | null
  document_id: string | null
  sync_status: 'pending' | 'synced' | 'uploading' | 'error'
  sync_error: string | null
  starred: boolean
  tags: string[]
  created_at: string
  updated_at: string
}

// --- Drive Sync State ---

export type DriveSyncState = {
  id: string
  company_id: string
  changes_page_token: string | null
  last_full_sync_at: string | null
  last_incremental_sync_at: string | null
  sync_status: 'never_synced' | 'syncing' | 'synced' | 'error'
  sync_error: string | null
  total_folders: number
  total_files: number
  total_size_bytes: number
  created_at: string
  updated_at: string
}

// --- Company Drive Mapping ---

export type DriveCompanyMapping = {
  company_id: string
  company_name: string
  google_drive_folder_id: string | null
  sync_status: DriveSyncState['sync_status'] | null
  last_sync_at: string | null
  total_files: number
}

// --- File Browser State ---

export type FileViewMode = 'grid' | 'list'

export type FileSortField = 'name' | 'size_bytes' | 'drive_modified_at' | 'created_at' | 'fiscal_year'

export type FileSortConfig = {
  field: FileSortField
  dir: 'asc' | 'desc'
}

export type PeriodFilter = {
  year: number | null
  month: number | null
}

export type FileFilters = {
  period: PeriodFilter
  projectId: string | null
  includeProjectFiles: boolean
  search: string
  mimeType: string | null
  starred: boolean | null
}

export type BreadcrumbItem = {
  id: string | null // null = root
  name: string
  slug: string
}

export type FileBrowserState = {
  currentFolderId: string | null
  breadcrumb: BreadcrumbItem[]
  viewMode: FileViewMode
  sort: FileSortConfig
  filters: FileFilters
}

// --- API Response Types ---

export type FolderTreeItem = DocumentFolder & {
  children?: FolderTreeItem[]
}

export type FolderContentsResponse = {
  folder: DocumentFolder
  files: DriveFile[]
  pagination: {
    page: number
    perPage: number
    total: number
    totalPages: number
  }
}

export type HubStats = {
  files: {
    total: number
    recent: number // last 7 days
  }
  documents: {
    total: number
    pending: number
  }
  work: {
    hours_this_month: number
    open_tasks: number
  }
  company: {
    entity_type: string
    vat_payer: boolean
  }
  projects: {
    active: number
    cases: number
  }
  attention: {
    total: number
    items: Array<{ type: string; message: string; severity: 'high' | 'medium' | 'low' }>
  }
}

// --- Upload Types ---

export type UploadProgress = {
  fileId: string
  fileName: string
  progress: number // 0-100
  status: 'queued' | 'uploading' | 'processing' | 'done' | 'error'
  error?: string
}

export type UploadRequest = {
  folderId: string
  file: File
  fiscalYear?: number
  periodMonth?: number
  projectId?: string
  clientVisible?: boolean
}

// --- Sync Types ---

export type SyncResult = {
  added: number
  updated: number
  deleted: number
  errors: number
  duration_ms: number
}
