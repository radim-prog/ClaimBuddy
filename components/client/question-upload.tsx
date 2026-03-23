'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { FileText, Loader2, Paperclip, X } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Attachment {
  id: string
  file_name: string
  file_size: number
  mime_type: string
}

interface QuestionUploadProps {
  questionnaireId: string
  questionId: string
  companyId: string
  hint: string
  accept?: string
  readOnly?: boolean
}

const MAX_FILES = 3
const MAX_SIZE_BYTES = 10 * 1024 * 1024

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} kB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function QuestionUpload({
  questionnaireId,
  questionId,
  companyId,
  hint,
  accept = 'image/*,application/pdf',
  readOnly = false,
}: QuestionUploadProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [uploading, setUploading] = useState(false)
  const [loadingDelete, setLoadingDelete] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchAttachments = async () => {
      try {
        const res = await fetch(
          `/api/client/tax-questionnaire/upload?questionnaire_id=${questionnaireId}&section_id=${questionId}&company_id=${companyId}`
        )
        if (!res.ok) return
        const data = await res.json()
        setAttachments(data.attachments ?? [])
      } catch { /* silent */ }
    }
    fetchAttachments()
  }, [questionnaireId, questionId, companyId])

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files)
      if (!fileArray.length) return
      const remaining = MAX_FILES - attachments.length
      if (remaining <= 0) {
        toast.error(`Max ${MAX_FILES} souborů`)
        return
      }
      const toUpload = fileArray.slice(0, remaining)
      for (const file of toUpload) {
        if (file.size > MAX_SIZE_BYTES) {
          toast.error(`${file.name}: max 10 MB`)
          continue
        }
        setUploading(true)
        try {
          const formData = new FormData()
          formData.append('file', file)
          formData.append('questionnaire_id', questionnaireId)
          formData.append('section_id', questionId)
          formData.append('company_id', companyId)
          const res = await fetch('/api/client/tax-questionnaire/upload', {
            method: 'POST',
            body: formData,
          })
          if (!res.ok) throw new Error('Nahrávání se nezdařilo')
          const data = await res.json()
          setAttachments(prev => [...prev, data.attachment])
        } catch (err) {
          toast.error(err instanceof Error ? err.message : 'Chyba nahrávání')
        } finally {
          setUploading(false)
        }
      }
    },
    [attachments.length, questionnaireId, questionId, companyId]
  )

  const handleDelete = async (att: Attachment) => {
    setLoadingDelete(att.id)
    try {
      const res = await fetch(
        `/api/client/tax-questionnaire/upload?id=${att.id}&company_id=${companyId}`,
        { method: 'DELETE' }
      )
      if (!res.ok) throw new Error('Smazání se nezdařilo')
      setAttachments(prev => prev.filter(a => a.id !== att.id))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Chyba')
    } finally {
      setLoadingDelete(null)
    }
  }

  return (
    <div className="mt-1 space-y-1">
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {attachments.map(att => (
            <div key={att.id} className="flex items-center gap-1 px-1.5 py-0.5 bg-muted rounded text-xs">
              <FileText className="h-2.5 w-2.5 text-muted-foreground" />
              <span className="truncate max-w-[120px]">{att.file_name}</span>
              <span className="text-muted-foreground/60">{formatBytes(att.file_size)}</span>
              {!readOnly && (
                <button
                  onClick={() => handleDelete(att)}
                  disabled={loadingDelete === att.id}
                  className="ml-0.5 text-muted-foreground hover:text-red-500 disabled:opacity-50"
                >
                  {loadingDelete === att.id ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <X className="h-2.5 w-2.5" />}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {!readOnly && attachments.length < MAX_FILES && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple
            className="hidden"
            onChange={e => { if (e.target.files) handleFiles(e.target.files); e.target.value = '' }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Paperclip className="h-3 w-3" />}
            <span>{uploading ? 'Nahrávám...' : hint}</span>
          </button>
        </>
      )}
    </div>
  )
}
