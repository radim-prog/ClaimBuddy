'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Search,
  Upload,
  FolderPlus,
  RefreshCw,
  ChevronLeft,
  LayoutGrid,
  List,
  Download,
  ExternalLink,
  FileText,
  Image,
  FileSpreadsheet,
  File,
  Clock,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { PeriodFilter } from '@/components/drive/period-filter'
import { FolderCard } from '@/components/drive/folder-card'
import type { DocumentFolder, DriveFile, FileViewMode } from '@/lib/types/drive'

// ============================================
// PROPS
// ============================================

type FileBrowserProps = {
  companyId: string
  companyName: string
}

// ============================================
// HELPERS
// ============================================

function formatFileSize(bytes: number | null): string {
  if (bytes === null || bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const size = bytes / Math.pow(k, i)
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('cs-CZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function getMimeIcon(mime: string | null) {
  if (!mime) return File
  if (mime.includes('pdf')) return FileText
  if (mime.startsWith('image/')) return Image
  if (
    mime.includes('spreadsheet') ||
    mime.includes('excel') ||
    mime.includes('csv')
  )
    return FileSpreadsheet
  if (mime.includes('document') || mime.includes('text')) return FileText
  return File
}

function getMimeLabel(mime: string | null): string {
  if (!mime) return 'Soubor'
  if (mime.includes('pdf')) return 'PDF'
  if (mime.includes('png')) return 'PNG'
  if (mime.includes('jpeg') || mime.includes('jpg')) return 'JPEG'
  if (mime.includes('spreadsheet') || mime.includes('excel')) return 'Excel'
  if (mime.includes('csv')) return 'CSV'
  if (mime.includes('document') || mime.includes('word')) return 'Word'
  if (mime.includes('text/plain')) return 'Text'
  return 'Soubor'
}

// ============================================
// SKELETON COMPONENTS
// ============================================

function FolderSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-gray-200 dark:bg-gray-700" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          <div className="h-3 bg-gray-100 dark:bg-gray-700/50 rounded w-1/2" />
        </div>
      </div>
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
        >
          <div className="h-8 w-8 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="w-16 h-4 bg-gray-100 dark:bg-gray-700/50 rounded" />
          <div className="w-20 h-4 bg-gray-100 dark:bg-gray-700/50 rounded" />
        </div>
      ))}
    </div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================

export function FileBrowser({ companyId, companyName }: FileBrowserProps) {
  // --- State ---
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [currentFolderName, setCurrentFolderName] = useState<string>('')
  const [folders, setFolders] = useState<DocumentFolder[]>([])
  const [files, setFiles] = useState<DriveFile[]>([])
  const [recentFiles, setRecentFiles] = useState<DriveFile[]>([])
  const [loading, setLoading] = useState(true)
  const [filesLoading, setFilesLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [year, setYear] = useState<number | null>(new Date().getFullYear())
  const [month, setMonth] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<FileViewMode>('list')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // --- Fetch folders (root) ---
  const fetchFolders = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/drive/folders?companyId=${companyId}`)
      if (!res.ok) throw new Error('Failed to fetch folders')
      const data = await res.json()
      setFolders(data.folders || [])
      setRecentFiles(data.recentFiles || [])
    } catch (err) {
      console.error('Error fetching folders:', err)
    } finally {
      setLoading(false)
    }
  }, [companyId])

  // --- Fetch files for a folder ---
  const fetchFiles = useCallback(
    async (folderId: string) => {
      try {
        setFilesLoading(true)
        const params = new URLSearchParams({ companyId })
        if (year !== null) params.set('year', String(year))
        if (month !== null) params.set('month', String(month))
        if (search.trim()) params.set('search', search.trim())

        const res = await fetch(
          `/api/drive/folders/${folderId}?${params.toString()}`
        )
        if (!res.ok) throw new Error('Failed to fetch files')
        const data = await res.json()
        setFiles(data.files || [])
      } catch (err) {
        console.error('Error fetching files:', err)
        setFiles([])
      } finally {
        setFilesLoading(false)
      }
    },
    [companyId, year, month, search]
  )

  // --- Effects ---
  useEffect(() => {
    fetchFolders()
  }, [fetchFolders])

  useEffect(() => {
    if (currentFolderId) {
      fetchFiles(currentFolderId)
    }
  }, [currentFolderId, fetchFiles])

  // --- Handlers ---
  const handleFolderClick = (folder: DocumentFolder) => {
    setCurrentFolderId(folder.id)
    setCurrentFolderName(folder.name)
    setFiles([])
  }

  const handleBack = () => {
    setCurrentFolderId(null)
    setCurrentFolderName('')
    setFiles([])
    setSearch('')
  }

  const handleSync = async () => {
    try {
      setSyncing(true)
      await fetch(`/api/drive/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId }),
      })
      // Refresh current view
      if (currentFolderId) {
        await fetchFiles(currentFolderId)
      } else {
        await fetchFolders()
      }
    } catch (err) {
      console.error('Sync error:', err)
    } finally {
      setSyncing(false)
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (!selectedFiles || selectedFiles.length === 0) return

    // Basic upload — POST to /api/drive/upload
    const formData = new FormData()
    formData.append('companyId', companyId)
    if (currentFolderId) formData.append('folderId', currentFolderId)
    if (year !== null) formData.append('fiscalYear', String(year))
    if (month !== null) formData.append('periodMonth', String(month))

    for (let i = 0; i < selectedFiles.length; i++) {
      formData.append('files', selectedFiles[i])
    }

    try {
      await fetch('/api/drive/upload', { method: 'POST', body: formData })
      // Refresh
      if (currentFolderId) {
        await fetchFiles(currentFolderId)
      } else {
        await fetchFolders()
      }
    } catch (err) {
      console.error('Upload error:', err)
    }

    // Reset input
    e.target.value = ''
  }

  // --- File table row ---
  const FileRow = ({ file }: { file: DriveFile }) => {
    const MimeIcon = getMimeIcon(file.mime_type)
    return (
      <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors group">
        <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-gray-100 dark:bg-gray-700/50 shrink-0">
          <MimeIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {file.name}
          </p>
        </div>
        <div className="hidden sm:block">
          <Badge
            variant="outline"
            className="text-[10px] text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600"
          >
            {getMimeLabel(file.mime_type)}
          </Badge>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400 w-16 text-right shrink-0">
          {formatFileSize(file.size_bytes)}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400 w-24 text-right shrink-0 hidden md:block">
          {formatDate(file.drive_modified_at || file.created_at)}
        </span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          {file.web_view_link && (
            <a
              href={file.web_view_link}
              target="_blank"
              rel="noopener noreferrer"
              title="Otevrit v Google Drive"
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-lg"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </a>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg"
            title="Stahnout"
            onClick={() => {
              if (file.web_view_link) {
                window.open(file.web_view_link, '_blank')
              }
            }}
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    )
  }

  // ============================================
  // RENDER: Root view (folders)
  // ============================================

  if (!currentFolderId) {
    return (
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <PeriodFilter
            year={year}
            month={month}
            onYearChange={setYear}
            onMonthChange={setMonth}
          />
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Hledat..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 rounded-lg text-sm"
            />
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg border-gray-200 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-200 dark:hover:border-purple-800 transition-colors"
              onClick={handleUploadClick}
            >
              <Upload className="h-4 w-4 mr-1.5" />
              Nahrat
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg border-gray-200 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-200 dark:hover:border-purple-800 transition-colors"
            >
              <FolderPlus className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Slozka</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg border-gray-200 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-200 dark:hover:border-purple-800 transition-colors"
              onClick={handleSync}
              disabled={syncing}
            >
              <RefreshCw
                className={`h-4 w-4 mr-1.5 ${syncing ? 'animate-spin' : ''}`}
              />
              <span className="hidden sm:inline">Synchronizovat</span>
            </Button>
          </div>
        </div>

        {/* Folders grid */}
        <div>
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
            Slozky
          </h2>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <FolderSkeleton key={i} />
              ))}
            </div>
          ) : folders.length === 0 ? (
            <div className="text-center py-12 text-gray-400 dark:text-gray-500">
              <FolderPlus className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Zadne slozky</p>
              <p className="text-xs mt-1">
                Slozky se vytvorit automaticky po synchronizaci s Google Drive
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {folders
                .filter((f) =>
                  search.trim()
                    ? f.name
                        .toLowerCase()
                        .includes(search.trim().toLowerCase())
                    : true
                )
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((folder) => (
                  <FolderCard
                    key={folder.id}
                    folder={folder}
                    onClick={() => handleFolderClick(folder)}
                  />
                ))}
            </div>
          )}
        </div>

        {/* Recent files */}
        {!loading && recentFiles.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Posledni nahrane
            </h2>
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
              <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {recentFiles.slice(0, 10).map((file) => (
                  <FileRow key={file.id} file={file} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ============================================
  // RENDER: Folder view (files)
  // ============================================

  return (
    <div className="space-y-4">
      {/* Header with back button */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          onClick={handleBack}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Zpet
        </Button>
        <div className="h-5 w-px bg-gray-200 dark:bg-gray-700" />
        <h2 className="text-sm font-medium text-gray-900 dark:text-white">
          {currentFolderName}
        </h2>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <PeriodFilter
          year={year}
          month={month}
          onYearChange={setYear}
          onMonthChange={setMonth}
        />
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Hledat soubory..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 rounded-lg text-sm"
          />
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg border-gray-200 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-200 dark:hover:border-purple-800 transition-colors"
            onClick={handleUploadClick}
          >
            <Upload className="h-4 w-4 mr-1.5" />
            Nahrat
          </Button>

          {/* View mode toggle */}
          <div className="flex items-center rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
              title="Mrizka"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 transition-colors ${
                viewMode === 'list'
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
              title="Seznam"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Files */}
      {filesLoading ? (
        <TableSkeleton />
      ) : files.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">
          <File className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Zadne soubory</p>
          <p className="text-xs mt-1">
            Nahrajte soubory nebo synchronizujte s Google Drive
          </p>
        </div>
      ) : viewMode === 'list' ? (
        /* List view */
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
          {/* Table header */}
          <div className="flex items-center gap-3 px-3 py-2 border-b border-gray-100 dark:border-gray-700/50 text-xs text-gray-500 dark:text-gray-400 font-medium">
            <div className="h-8 w-8 shrink-0" />
            <div className="flex-1">Nazev</div>
            <div className="hidden sm:block w-16">Typ</div>
            <div className="w-16 text-right">Velikost</div>
            <div className="w-24 text-right hidden md:block">Datum</div>
            <div className="w-16 shrink-0" />
          </div>
          {/* Rows */}
          <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {files.map((file) => (
              <FileRow key={file.id} file={file} />
            ))}
          </div>
        </div>
      ) : (
        /* Grid view */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {files.map((file) => {
            const MimeIcon = getMimeIcon(file.mime_type)
            return (
              <div
                key={file.id}
                className="group rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 transition-all hover:shadow-md hover:border-purple-300 dark:hover:border-purple-600 cursor-pointer"
              >
                <div className="flex items-center justify-center h-16 rounded-lg bg-gray-50 dark:bg-gray-700/30 mb-2">
                  <MimeIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                  {file.name}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">
                    {formatFileSize(file.size_bytes)}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">
                    {formatDate(file.drive_modified_at || file.created_at)}
                  </span>
                </div>
                {/* Grid hover actions */}
                <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {file.web_view_link && (
                    <a
                      href={file.web_view_link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </a>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded"
                    onClick={() => {
                      if (file.web_view_link) {
                        window.open(file.web_view_link, '_blank')
                      }
                    }}
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
