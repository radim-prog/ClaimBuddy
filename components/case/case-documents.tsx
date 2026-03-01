'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
  FileText, File, FileSpreadsheet, FileImage,
  Plus, ExternalLink, Calendar, Eye, EyeOff, History,
} from 'lucide-react'
import { CaseDocument, CaseDocumentCategory, CASE_DOCUMENT_CATEGORIES } from '@/lib/types/project'
import { DocumentVersionHistory } from '@/components/case/document-version-history'
import { toast } from 'sonner'

interface CaseDocumentsProps {
  projectId: string
  readOnly?: boolean
  apiBasePath?: string
}

export function CaseDocuments({ projectId, readOnly = false, apiBasePath }: CaseDocumentsProps) {
  const [documents, setDocuments] = useState<CaseDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [name, setName] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [category, setCategory] = useState<CaseDocumentCategory>('other')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [versionDocId, setVersionDocId] = useState<string | null>(null)

  useEffect(() => {
    const url = apiBasePath
      ? `${apiBasePath}/${projectId}/documents`
      : `/api/projects/${projectId}/documents`
    fetch(url)
      .then(r => r.json())
      .then(data => setDocuments(data.documents || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [projectId, apiBasePath])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          file_url: fileUrl.trim() || undefined,
          category,
          description: description.trim() || undefined,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setDocuments([data.document, ...documents])
        setName('')
        setFileUrl('')
        setCategory('other')
        setDescription('')
        setDialogOpen(false)
        toast.success('Dokument přidán')
      }
    } catch {
      toast.error('Chyba při ukládání')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleClientVisible = async (docId: string, currentVisible: boolean) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/documents/${docId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_visible: !currentVisible }),
      })
      if (res.ok) {
        setDocuments(prev => prev.map(d =>
          d.id === docId ? { ...d, client_visible: !currentVisible } : d
        ))
        toast.success(!currentVisible ? 'Dokument zviditelněn pro klienta' : 'Dokument skryt pro klienta')
      } else {
        toast.error('Chyba při změně viditelnosti')
      }
    } catch {
      toast.error('Chyba při změně viditelnosti')
    }
  }

  const getCategoryBadge = (cat: CaseDocumentCategory) => {
    const def = CASE_DOCUMENT_CATEGORIES.find(c => c.value === cat)
    return (
      <Badge className={def?.color || 'bg-gray-100 text-gray-800'}>
        {def?.label || cat}
      </Badge>
    )
  }

  const getFileIcon = (fileType?: string) => {
    if (!fileType) return <File className="h-8 w-8 text-muted-foreground" />
    if (fileType.includes('pdf')) return <FileText className="h-8 w-8 text-red-500" />
    if (fileType.includes('image')) return <FileImage className="h-8 w-8 text-blue-500" />
    if (fileType.includes('sheet') || fileType.includes('excel')) return <FileSpreadsheet className="h-8 w-8 text-green-500" />
    return <File className="h-8 w-8 text-muted-foreground" />
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Načítání...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span>Dokumenty spisu</span>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            {!readOnly && (
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Přidat dokument
                </Button>
              </DialogTrigger>
            )}
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nový dokument</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Název dokumentu *</label>
                  <Input
                    placeholder="Např. Smlouva o účetních službách"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Kategorie</label>
                  <Select value={category} onValueChange={(v) => setCategory(v as CaseDocumentCategory)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Vyberte kategorii" />
                    </SelectTrigger>
                    <SelectContent>
                      {CASE_DOCUMENT_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">URL souboru</label>
                  <Input
                    placeholder="https://..."
                    value={fileUrl}
                    onChange={(e) => setFileUrl(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Popis</label>
                  <Textarea
                    placeholder="Volitelný popis dokumentu"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={submitting || !name.trim()}>
                    {submitting ? 'Ukládání...' : 'Uložit'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Zrušit
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="grid grid-cols-1 gap-3">
            {documents.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                Zatím žádné dokumenty
              </div>
            ) : (
              documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="shrink-0">
                    {getFileIcon(doc.file_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-medium text-sm truncate">{doc.name}</h4>
                      {getCategoryBadge(doc.category)}
                      {doc.version > 1 && (
                        <Badge variant="outline" className="text-xs">v{doc.version}</Badge>
                      )}
                      {!readOnly && (
                        <button
                          onClick={() => setVersionDocId(doc.id)}
                          className="p-0.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                          title="Historie verzí"
                        >
                          <History className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    {doc.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {doc.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(doc.created_at).toLocaleDateString('cs-CZ')}
                      </span>
                      {doc.uploaded_by_name && <span>{doc.uploaded_by_name}</span>}
                      {doc.file_size_bytes && <span>{formatFileSize(doc.file_size_bytes)}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!readOnly && (
                      <button
                        onClick={() => toggleClientVisible(doc.id, doc.client_visible === true)}
                        className={`p-1.5 rounded hover:bg-muted transition-colors ${
                          doc.client_visible === true ? 'text-blue-500' : 'text-muted-foreground'
                        }`}
                        title={doc.client_visible === true ? 'Viditelné pro klienta' : 'Skryté pro klienta'}
                      >
                        {doc.client_visible === true ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                    )}
                    {doc.file_url && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>

      {/* Version History Dialog */}
      {versionDocId && (
        <DocumentVersionHistory
          projectId={projectId}
          documentId={versionDocId}
          open={!!versionDocId}
          onOpenChange={(open) => !open && setVersionDocId(null)}
          onVersionAdded={() => {
            // Refresh documents list
            const url = apiBasePath
              ? `${apiBasePath}/${projectId}/documents`
              : `/api/projects/${projectId}/documents`
            fetch(url)
              .then(r => r.json())
              .then(data => setDocuments(data.documents || []))
              .catch(() => {})
          }}
        />
      )}
    </Card>
  )
}
