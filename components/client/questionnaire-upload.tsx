'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, X, FileText, Loader2, Paperclip } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Attachment {
  id: string
  file_name: string
  file_size: number
  mime_type: string
  created_at: string
}

interface QuestionnaireUploadProps {
  questionnaireId: string
  sectionId: string
  companyId: string
  readOnly?: boolean
}

const MAX_FILES = 5
const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB
const ACCEPTED = 'image/*,application/pdf,.doc,.docx,.xls,.xlsx'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} kB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function FileIcon({ mimeType }: { mimeType: string }) {
  return <FileText className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
}

export function QuestionnaireUpload({
  questionnaireId,
  sectionId,
  companyId,
  readOnly = false,
}: QuestionnaireUploadProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [loadingDelete, setLoadingDelete] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load existing attachments on mount
  useEffect(() => {
    const fetchAttachments = async () => {
      try {
        const res = await fetch(
          `/api/client/tax-questionnaire/upload?questionnaire_id=${questionnaireId}&section_id=${sectionId}&company_id=${companyId}`
        )
        if (!res.ok) return
        const data = await res.json()
        setAttachments(data.attachments ?? [])
      } catch {
        // Silently ignore — non-critical
      }
    }
    fetchAttachments()
  }, [questionnaireId, sectionId, companyId])

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files)
      if (!fileArray.length) return

      const remaining = MAX_FILES - attachments.length
      if (remaining <= 0) {
        toast.error(`Maximální počet souborů na sekci je ${MAX_FILES}`)
        return
      }

      const toUpload = fileArray.slice(0, remaining)
      if (fileArray.length > remaining) {
        toast.warning(`Nahrávám pouze ${remaining} soubor(ů) — dosažen limit ${MAX_FILES}`)
      }

      for (const file of toUpload) {
        if (file.size > MAX_SIZE_BYTES) {
          toast.error(`${file.name}: soubor přesahuje limit 10 MB`)
          continue
        }

        setUploading(true)
        try {
          const formData = new FormData()
          formData.append('file', file)
          formData.append('questionnaire_id', questionnaireId)
          formData.append('section_id', sectionId)
          formData.append('company_id', companyId)

          const res = await fetch('/api/client/tax-questionnaire/upload', {
            method: 'POST',
            body: formData,
          })

          if (!res.ok) {
            const err = await res.json().catch(() => ({}))
            throw new Error(err.error || `Chyba nahrávání (${res.status})`)
          }

          const data = await res.json()
          setAttachments(prev => [...prev, data.attachment])
          toast.success(`${file.name} nahráno`)
        } catch (err) {
          toast.error(err instanceof Error ? err.message : 'Nahrávání se nezdařilo')
        } finally {
          setUploading(false)
        }
      }
    },
    [attachments.length, questionnaireId, sectionId, companyId]
  )

  const handleDelete = async (attachment: Attachment) => {
    setLoadingDelete(attachment.id)
    try {
      const res = await fetch(
        `/api/client/tax-questionnaire/upload?id=${attachment.id}&company_id=${companyId}`,
        { method: 'DELETE' }
      )
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Smazání se nezdařilo')
      }
      setAttachments(prev => prev.filter(a => a.id !== attachment.id))
      toast.success('Soubor odstraněn')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Smazání se nezdařilo')
    } finally {
      setLoadingDelete(null)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (!readOnly) handleFiles(e.dataTransfer.files)
  }

  const canUploadMore = attachments.length < MAX_FILES && !readOnly

  return (
    <div className="mt-3 space-y-2">
      {/* Existing attachment chips */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {attachments.map(att => (
            <div
              key={att.id}
              className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded-md text-xs max-w-[200px] group"
            >
              <FileIcon mimeType={att.mime_type} />
              <span className="truncate flex-1 min-w-0" title={att.file_name}>
                {att.file_name}
              </span>
              <span className="text-muted-foreground/60 flex-shrink-0">
                {formatBytes(att.file_size)}
              </span>
              {!readOnly && (
                <button
                  onClick={() => handleDelete(att)}
                  disabled={loadingDelete === att.id}
                  className="ml-0.5 flex-shrink-0 text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-50"
                  aria-label={`Odstranit ${att.file_name}`}
                >
                  {loadingDelete === att.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <X className="h-3 w-3" />
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Drop zone / upload trigger */}
      {canUploadMore && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={cn(
            'relative border border-dashed rounded-lg px-3 py-2.5 transition-colors',
            dragOver
              ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/30'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED}
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handleFiles(e.target.files)
              e.target.value = ''
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin flex-shrink-0" />
            ) : (
              <Paperclip className="h-3.5 w-3.5 flex-shrink-0" />
            )}
            <span>
              {uploading
                ? 'Nahrávám...'
                : dragOver
                ? 'Přetáhněte soubory sem'
                : `Přiložit dokument${attachments.length > 0 ? ` (${attachments.length}/${MAX_FILES})` : ''}`}
            </span>
            {!uploading && (
              <span className="ml-auto text-muted-foreground/50">PDF, obr., Word, Excel · max 10 MB</span>
            )}
          </button>
        </div>
      )}

      {/* At-limit notice */}
      {!readOnly && attachments.length >= MAX_FILES && (
        <p className="text-xs text-muted-foreground">
          Dosažen limit {MAX_FILES} souborů pro tuto sekci.
        </p>
      )}
    </div>
  )
}
