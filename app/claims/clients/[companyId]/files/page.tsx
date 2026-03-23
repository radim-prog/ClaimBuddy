'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  ArrowLeft,
  Loader2,
  Upload,
  FolderOpen,
  FileText,
  Image,
  File,
  Download,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ClaimsFile {
  id: string
  filename: string
  file_url: string
  file_size: number | null
  mime_type: string | null
  uploaded_at: string
  uploaded_by: string | null
}

function formatFileSize(bytes: number | null): string {
  if (bytes === null || bytes === undefined) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('cs-CZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() ?? ''
}

function FileTypeIcon({ filename, mimeType }: { filename: string; mimeType: string | null }) {
  const ext = getExtension(filename)
  const mime = mimeType ?? ''

  if (ext === 'pdf' || mime === 'application/pdf') {
    return <FileText className="h-5 w-5 text-red-500 flex-shrink-0" />
  }
  if (
    ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext) ||
    mime.startsWith('image/')
  ) {
    return <Image className="h-5 w-5 text-green-500 flex-shrink-0" />
  }
  if (['doc', 'docx', 'odt', 'rtf'].includes(ext)) {
    return <FileText className="h-5 w-5 text-blue-500 flex-shrink-0" />
  }
  if (['xls', 'xlsx', 'ods', 'csv'].includes(ext)) {
    return <FileText className="h-5 w-5 text-emerald-500 flex-shrink-0" />
  }
  return <File className="h-5 w-5 text-gray-400 flex-shrink-0" />
}

export default function CompanyFilesPage() {
  const params = useParams()
  const companyId = params?.companyId as string

  const [files, setFiles] = useState<ClaimsFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function fetchFiles() {
    try {
      const res = await fetch(`/api/claims/files?company_id=${companyId}`)
      if (res.status === 404) {
        setFiles([])
        return
      }
      if (!res.ok) throw new Error('Chyba při načítání souborů')
      const data = await res.json()
      setFiles(data.files ?? data ?? [])
    } catch (err) {
      toast.error('Nepodařilo se načíst soubory')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (companyId) fetchFiles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    // Reset input so the same file can be re-uploaded if needed
    e.target.value = ''

    const formData = new FormData()
    formData.append('file', file)
    formData.append('company_id', companyId)

    setUploading(true)
    try {
      const res = await fetch(`/api/claims/files?company_id=${companyId}`, {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error ?? 'Nahrávání se nezdařilo')
      }
      toast.success('Soubor byl úspěšně nahrán')
      await fetchFiles()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Chyba při nahrávání')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(file: ClaimsFile) {
    if (!window.confirm(`Opravdu chcete smazat soubor „${file.filename}"?`)) return

    setDeletingId(file.id)
    try {
      const res = await fetch(`/api/claims/files/${file.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error ?? 'Smazání se nezdařilo')
      }
      toast.success('Soubor byl smazán')
      setFiles(prev => prev.filter(f => f.id !== file.id))
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Chyba při mazání souboru')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/claims/clients/${companyId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Soubory klienta</h1>
            <p className="text-sm text-muted-foreground">Dokumenty a přílohy pojistných případů</p>
          </div>
        </div>

        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {uploading ? 'Nahrávám…' : 'Nahrát soubor'}
        </Button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleUpload}
          accept="*/*"
        />
      </div>

      {/* Content */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium text-foreground">
            Soubory
            {!loading && files.length > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({files.length})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : files.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FolderOpen className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">Žádné soubory</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Nahrajte první soubor pomocí tlačítka výše
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {files.map(file => (
                <div
                  key={file.id}
                  className="flex items-center gap-4 py-3 group"
                >
                  {/* Icon */}
                  <FileTypeIcon filename={file.filename} mimeType={file.mime_type} />

                  {/* Name + meta */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {file.filename}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatFileSize(file.file_size)}
                      {file.uploaded_by && (
                        <>
                          {' · '}
                          {file.uploaded_by}
                        </>
                      )}
                      {' · '}
                      {formatDate(file.uploaded_at)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                      title="Stáhnout"
                      className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    >
                      <a href={file.file_url} download={file.filename} target="_blank" rel="noreferrer">
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      title="Smazat"
                      disabled={deletingId === file.id}
                      onClick={() => handleDelete(file)}
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      {deletingId === file.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
