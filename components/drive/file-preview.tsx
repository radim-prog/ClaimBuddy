'use client'

import { useEffect, useCallback } from 'react'
import { X, Download, ExternalLink, FileText, Image, File } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { DriveFile } from '@/lib/types/drive'
import { cn } from '@/lib/utils'

type FilePreviewProps = {
  file: DriveFile
  onClose: () => void
}

// --- Helpers ---

function formatFileSize(bytes: number | null): string {
  if (bytes === null || bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const value = bytes / Math.pow(k, i)
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return 'neuvedeno'
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diffSec = Math.floor((now - date) / 1000)

  if (diffSec < 60) return 'prave ted'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `pred ${diffMin} min`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `pred ${diffHour} hod`
  const diffDay = Math.floor(diffHour / 24)
  if (diffDay < 30) return `pred ${diffDay} dny`
  const diffMonth = Math.floor(diffDay / 30)
  if (diffMonth < 12) return `pred ${diffMonth} mes.`
  return `pred ${Math.floor(diffMonth / 12)} r.`
}

const CZECH_MONTHS = [
  'Leden', 'Unor', 'Brezen', 'Duben', 'Kveten', 'Cerven',
  'Cervenec', 'Srpen', 'Zari', 'Rijen', 'Listopad', 'Prosinec',
]

function isPdf(mime: string | null): boolean {
  return !!mime && mime.includes('pdf')
}

function isImage(mime: string | null): boolean {
  return !!mime && mime.startsWith('image/')
}

function getFileIcon(mime: string | null) {
  if (isPdf(mime)) return FileText
  if (isImage(mime)) return Image
  return File
}

export function FilePreview({ file, onClose }: FilePreviewProps) {
  const downloadUrl = `/api/drive/files/${file.id}/download`
  const inlineUrl = `${downloadUrl}?inline=true`

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    // Prevent body scroll while panel is open
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [handleKeyDown])

  const FileIcon = getFileIcon(file.mime_type)

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={cn(
          'relative z-10 flex h-full w-full flex-col',
          'bg-white dark:bg-gray-900',
          'shadow-2xl',
          'sm:w-[480px] sm:rounded-l-xl',
          'animate-in slide-in-from-right duration-300'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <FileIcon className="h-5 w-5 shrink-0 text-purple-500" />
            <h2 className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
              {file.name}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="shrink-0 h-8 w-8"
            aria-label="Zavrit"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Preview content */}
        <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
          {isPdf(file.mime_type) ? (
            <iframe
              src={inlineUrl}
              className="h-full w-full border-0"
              title={`Nahled: ${file.name}`}
            />
          ) : isImage(file.mime_type) ? (
            <div className="flex h-full items-center justify-center p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={inlineUrl}
                alt={file.name}
                className="max-h-full max-w-full rounded-lg object-contain shadow-md"
              />
            </div>
          ) : (
            /* Fallback for unsupported file types */
            <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-purple-100 dark:bg-purple-900/30">
                <FileIcon className="h-10 w-10 text-purple-500" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Nahled neni k dispozici
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {file.mime_type ?? 'Neznamy typ souboru'}
                </p>
              </div>
              <a href={downloadUrl} download>
                <Button variant="default" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Stahnout soubor
                </Button>
              </a>
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 space-y-2">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
            <MetaRow label="Nazev" value={file.name} />
            <MetaRow label="Typ" value={file.mime_type ?? 'neuvedeno'} />
            <MetaRow label="Velikost" value={formatFileSize(file.size_bytes)} />
            <MetaRow
              label="Upraveno"
              value={formatRelativeTime(file.drive_modified_at ?? file.updated_at)}
            />
            {file.fiscal_year && (
              <MetaRow label="Rok" value={String(file.fiscal_year)} />
            )}
            {file.period_month && (
              <MetaRow
                label="Mesic"
                value={CZECH_MONTHS[file.period_month - 1] ?? String(file.period_month)}
              />
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 border-t border-gray-200 dark:border-gray-700 px-4 py-3">
          <a href={downloadUrl} download className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Stahnout
            </Button>
          </a>
          {file.web_view_link && (
            <a
              href={file.web_view_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <Button variant="outline" size="sm" className="w-full">
                <ExternalLink className="mr-2 h-4 w-4" />
                Otevrit v Drive
              </Button>
            </a>
          )}
          <Button variant="ghost" size="sm" onClick={onClose}>
            Zavrit
          </Button>
        </div>
      </div>
    </div>
  )
}

// --- Small helper component for metadata rows ---

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className="truncate text-gray-900 dark:text-gray-100">{value}</span>
    </>
  )
}
