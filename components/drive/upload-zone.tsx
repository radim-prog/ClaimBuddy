'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, FileUp, CheckCircle2, AlertCircle, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { UploadProgress } from '@/lib/types/drive'

type UploadZoneProps = {
  companyId: string
  folderId: string
  onUploadComplete: () => void
  defaultYear?: number
  defaultMonth?: number
}

const CZECH_MONTHS = [
  'Leden', 'Unor', 'Brezen', 'Duben', 'Kveten', 'Cerven',
  'Cervenec', 'Srpen', 'Zari', 'Rijen', 'Listopad', 'Prosinec',
]

function getYearOptions(): number[] {
  const currentYear = new Date().getFullYear()
  const years: number[] = []
  for (let y = currentYear; y >= 2020; y--) {
    years.push(y)
  }
  return years
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const value = bytes / Math.pow(k, i)
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

type QueuedFile = {
  id: string
  file: File
}

export function UploadZone({
  companyId,
  folderId,
  onUploadComplete,
  defaultYear,
  defaultMonth,
}: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [queuedFiles, setQueuedFiles] = useState<QueuedFile[]>([])
  const [uploads, setUploads] = useState<UploadProgress[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [fiscalYear, setFiscalYear] = useState<number | null>(defaultYear ?? null)
  const [periodMonth, setPeriodMonth] = useState<number | null>(defaultMonth ?? null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dragCounter = useRef(0)

  // --- Drag & Drop handlers ---

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current++
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true)
    }
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current--
    if (dragCounter.current === 0) {
      setIsDragging(false)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const addFiles = useCallback((files: FileList | File[]) => {
    const newQueued: QueuedFile[] = Array.from(files).map((file) => ({
      id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
      file,
    }))
    setQueuedFiles((prev) => [...prev, ...newQueued])
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
      dragCounter.current = 0
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files)
      }
    },
    [addFiles]
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        addFiles(e.target.files)
      }
      // Reset input value so same file can be re-selected
      e.target.value = ''
    },
    [addFiles]
  )

  const removeQueuedFile = useCallback((id: string) => {
    setQueuedFiles((prev) => prev.filter((f) => f.id !== id))
  }, [])

  // --- Upload logic ---

  const uploadFile = async (qf: QueuedFile): Promise<boolean> => {
    const uploadId = qf.id

    // Mark as uploading
    setUploads((prev) => [
      ...prev,
      {
        fileId: uploadId,
        fileName: qf.file.name,
        progress: 0,
        status: 'uploading',
      },
    ])

    try {
      const formData = new FormData()
      formData.append('file', qf.file)
      formData.append('companyId', companyId)
      formData.append('folderId', folderId)
      if (fiscalYear !== null) formData.append('fiscalYear', String(fiscalYear))
      if (periodMonth !== null) formData.append('periodMonth', String(periodMonth))

      // Simulate progress (XHR would be needed for real progress)
      setUploads((prev) =>
        prev.map((u) =>
          u.fileId === uploadId ? { ...u, progress: 30 } : u
        )
      )

      const res = await fetch('/api/drive/files/upload', {
        method: 'POST',
        body: formData,
      })

      setUploads((prev) =>
        prev.map((u) =>
          u.fileId === uploadId ? { ...u, progress: 80 } : u
        )
      )

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Chyba nahravani' }))
        throw new Error(err.error || `HTTP ${res.status}`)
      }

      setUploads((prev) =>
        prev.map((u) =>
          u.fileId === uploadId
            ? { ...u, progress: 100, status: 'done' }
            : u
        )
      )

      return true
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Neznama chyba'
      setUploads((prev) =>
        prev.map((u) =>
          u.fileId === uploadId
            ? { ...u, status: 'error', error: message }
            : u
        )
      )
      return false
    }
  }

  const handleUpload = async () => {
    if (queuedFiles.length === 0) return
    setIsUploading(true)
    setUploads([])

    let successCount = 0
    let errorCount = 0

    for (const qf of queuedFiles) {
      const ok = await uploadFile(qf)
      if (ok) successCount++
      else errorCount++
    }

    setIsUploading(false)
    setQueuedFiles([])

    if (successCount > 0 && errorCount === 0) {
      toast.success(`Uspesne nahrano ${successCount} soubor${successCount > 1 ? 'u' : ''}`)
    } else if (successCount > 0 && errorCount > 0) {
      toast.warning(`Nahrano ${successCount}, selhalo ${errorCount} soubor${errorCount > 1 ? 'u' : ''}`)
    } else {
      toast.error('Vsechna nahrani selhala')
    }

    onUploadComplete()
  }

  const hasQueue = queuedFiles.length > 0
  const hasUploads = uploads.length > 0

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        className={cn(
          'relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 transition-all cursor-pointer',
          'hover:border-purple-400 hover:bg-purple-50/50 dark:hover:bg-purple-950/20',
          isDragging
            ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30 scale-[1.01]'
            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900'
        )}
      >
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-full transition-colors',
            isDragging
              ? 'bg-purple-200 dark:bg-purple-800'
              : 'bg-gray-100 dark:bg-gray-800'
          )}
        >
          <Upload
            className={cn(
              'h-6 w-6 transition-colors',
              isDragging ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400'
            )}
          />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Pretahnete soubory sem nebo kliknete
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            PDF, obrazky, dokumenty
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          aria-label="Vybrat soubory k nahrani"
        />
      </div>

      {/* Queued files + metadata form */}
      {hasQueue && !isUploading && (
        <div className="space-y-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
          {/* File list */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Soubory k nahrani ({queuedFiles.length})
            </p>
            {queuedFiles.map((qf) => (
              <div
                key={qf.id}
                className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 dark:bg-gray-800 px-3 py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileUp className="h-4 w-4 shrink-0 text-purple-500" />
                  <span className="truncate text-sm text-gray-700 dark:text-gray-300">
                    {qf.file.name}
                  </span>
                  <span className="shrink-0 text-xs text-gray-400">
                    {formatFileSize(qf.file.size)}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeQueuedFile(qf.id)
                  }}
                  className="shrink-0 rounded p-1 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  aria-label={`Odebrat ${qf.file.name}`}
                >
                  <X className="h-3.5 w-3.5 text-gray-400" />
                </button>
              </div>
            ))}
          </div>

          {/* Metadata form */}
          <div className="flex flex-wrap items-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Ucetni rok</Label>
              <Select
                value={fiscalYear !== null ? String(fiscalYear) : 'none'}
                onValueChange={(val) =>
                  setFiscalYear(val === 'none' ? null : Number(val))
                }
              >
                <SelectTrigger className="w-[120px] h-9 rounded-lg text-sm border-gray-200 dark:border-gray-700">
                  <SelectValue placeholder="Rok" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Neuvedeno</SelectItem>
                  {getYearOptions().map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Mesic</Label>
              <Select
                value={periodMonth !== null ? String(periodMonth) : 'none'}
                onValueChange={(val) =>
                  setPeriodMonth(val === 'none' ? null : Number(val))
                }
              >
                <SelectTrigger className="w-[140px] h-9 rounded-lg text-sm border-gray-200 dark:border-gray-700">
                  <SelectValue placeholder="Mesic" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Neuvedeno</SelectItem>
                  {CZECH_MONTHS.map((name, idx) => (
                    <SelectItem key={idx + 1} value={String(idx + 1)}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleUpload}
              size="sm"
              className="ml-auto"
            >
              <Upload className="mr-2 h-4 w-4" />
              Nahrat {queuedFiles.length > 1 ? `(${queuedFiles.length})` : ''}
            </Button>
          </div>
        </div>
      )}

      {/* Upload progress */}
      {hasUploads && (
        <div className="space-y-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Prubeh nahravani
          </p>
          {uploads.map((u) => (
            <div key={u.fileId} className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {u.status === 'done' ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                  ) : u.status === 'error' ? (
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                  ) : (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-purple-500" />
                  )}
                  <span className="truncate text-sm text-gray-700 dark:text-gray-300">
                    {u.fileName}
                  </span>
                </div>
                <span
                  className={cn(
                    'shrink-0 text-xs font-medium',
                    u.status === 'done' && 'text-green-600',
                    u.status === 'error' && 'text-red-600',
                    u.status === 'uploading' && 'text-purple-600'
                  )}
                >
                  {u.status === 'done'
                    ? 'Hotovo'
                    : u.status === 'error'
                      ? 'Chyba'
                      : `${u.progress}%`}
                </span>
              </div>
              <Progress
                value={u.progress}
                className={cn(
                  'h-1.5',
                  u.status === 'error' && '[&>div]:bg-red-500',
                  u.status === 'done' && '[&>div]:bg-green-500',
                  (u.status === 'uploading' || u.status === 'processing') &&
                    '[&>div]:bg-purple-500'
                )}
              />
              {u.status === 'error' && u.error && (
                <p className="text-xs text-red-500">{u.error}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
