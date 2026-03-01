'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ExternalLink, Upload, Clock, User } from 'lucide-react'
import { toast } from 'sonner'
import type { CaseDocument } from '@/lib/types/project'

interface DocumentVersionHistoryProps {
  projectId: string
  documentId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onVersionAdded: () => void
}

export function DocumentVersionHistory({ projectId, documentId, open, onOpenChange, onVersionAdded }: DocumentVersionHistoryProps) {
  const [versions, setVersions] = useState<CaseDocument[]>([])
  const [loading, setLoading] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [newFileUrl, setNewFileUrl] = useState('')
  const [changeSummary, setChangeSummary] = useState('')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (open && documentId) {
      setLoading(true)
      fetch(`/api/projects/${projectId}/documents/${documentId}/versions`)
        .then(r => r.json())
        .then(data => setVersions(data.versions || []))
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [open, projectId, documentId])

  const handleUploadNewVersion = async () => {
    if (!newFileUrl.trim()) return
    setUploading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/documents/${documentId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_url: newFileUrl.trim(),
          change_summary: changeSummary.trim() || undefined,
        }),
      })
      if (res.ok) {
        toast.success('Nová verze nahrána')
        setNewFileUrl('')
        setChangeSummary('')
        setShowUpload(false)
        onVersionAdded()
        // Refresh versions
        const data = await fetch(`/api/projects/${projectId}/documents/${documentId}/versions`).then(r => r.json())
        setVersions(data.versions || [])
      }
    } catch {
      toast.error('Chyba při nahrávání')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Historie verzí
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-4 text-muted-foreground">Načítání...</div>
        ) : (
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-3">
              {/* Upload new version */}
              {!showUpload ? (
                <Button variant="outline" size="sm" className="w-full" onClick={() => setShowUpload(true)}>
                  <Upload className="h-4 w-4 mr-1" /> Nahrát novou verzi
                </Button>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="p-3 space-y-2">
                    <Input
                      placeholder="URL nového souboru"
                      value={newFileUrl}
                      onChange={(e) => setNewFileUrl(e.target.value)}
                    />
                    <Textarea
                      placeholder="Co se změnilo? (volitelné)"
                      value={changeSummary}
                      onChange={(e) => setChangeSummary(e.target.value)}
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleUploadNewVersion} disabled={uploading || !newFileUrl.trim()}>
                        {uploading ? 'Nahrávání...' : 'Nahrát'}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setShowUpload(false)}>Zrušit</Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Version list */}
              {versions.map((v, i) => (
                <div
                  key={v.id}
                  className={`p-3 border rounded-lg text-sm ${v.is_current_version ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={v.is_current_version ? 'default' : 'outline'} className="text-xs">
                        v{v.version}
                      </Badge>
                      {v.is_current_version && (
                        <Badge variant="secondary" className="text-xs">Aktuální</Badge>
                      )}
                    </div>
                    {v.file_url && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={v.file_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    )}
                  </div>
                  {v.change_summary && (
                    <p className="text-muted-foreground mb-1">{v.change_summary}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {v.uploaded_by_name && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" /> {v.uploaded_by_name}
                      </span>
                    )}
                    <span>{new Date(v.created_at).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))}

              {versions.length === 0 && (
                <div className="text-center text-muted-foreground py-4">
                  Pouze jedna verze
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  )
}
