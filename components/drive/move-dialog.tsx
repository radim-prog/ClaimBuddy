'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Folder,
  FileText,
  Archive,
  Briefcase,
  BookOpen,
  Receipt,
  FileSpreadsheet,
  Shield,
  Loader2,
  MoveRight,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import type { DocumentFolder } from '@/lib/types/drive'

type MoveDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  fileId: string
  currentFolderId: string
  companyId: string
  onMoved: () => void
}

const ICON_MAP: Record<string, typeof Folder> = {
  'folder': Folder,
  'file-text': FileText,
  'archive': Archive,
  'briefcase': Briefcase,
  'book-open': BookOpen,
  'receipt': Receipt,
  'file-spreadsheet': FileSpreadsheet,
  'shield': Shield,
}

function getFolderIcon(iconName: string) {
  return ICON_MAP[iconName] ?? Folder
}

export function MoveDialog({
  open,
  onOpenChange,
  fileId,
  currentFolderId,
  companyId,
  onMoved,
}: MoveDialogProps) {
  const [folders, setFolders] = useState<DocumentFolder[]>([])
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [moving, setMoving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchFolders = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/drive/folders?companyId=${encodeURIComponent(companyId)}`)
      if (!res.ok) {
        throw new Error('Nepodařilo se načíst složky')
      }
      const data = await res.json()
      // API may return { folders: [...] } or array directly
      const folderList: DocumentFolder[] = Array.isArray(data) ? data : data.folders ?? []
      setFolders(folderList)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Nepodařilo se načíst složky'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [companyId])

  useEffect(() => {
    if (open) {
      setSelectedFolderId(null)
      fetchFolders()
    }
  }, [open, fetchFolders])

  const handleMove = async () => {
    if (!selectedFolderId) return

    setMoving(true)

    try {
      const res = await fetch(`/api/drive/files/${encodeURIComponent(fileId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId: selectedFolderId }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Nepodařilo se přesunout soubor')
      }

      const targetFolder = folders.find((f) => f.id === selectedFolderId)
      toast.success(`Soubor přesunut do "${targetFolder?.name ?? 'složky'}"`)
      onMoved()
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Nepodařilo se přesunout soubor')
    } finally {
      setMoving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MoveRight className="h-5 w-5 text-purple-600" />
            Přesunout soubor
          </DialogTitle>
          <DialogDescription>
            Vyberte cílovou složku pro přesunutí souboru.
          </DialogDescription>
        </DialogHeader>

        <div className="pt-1">
          {/* Folder list */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
              <span className="ml-2 text-sm text-muted-foreground">Načítám složky...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-sm text-red-500 dark:text-red-400 mb-3">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchFolders}>
                Zkusit znovu
              </Button>
            </div>
          ) : folders.length === 0 ? (
            <div className="text-center py-8">
              <Folder className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-muted-foreground">Žádné složky k dispozici</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[320px]">
              <div className="space-y-1 pr-3">
                {folders.map((folder) => {
                  const isCurrent = folder.id === currentFolderId
                  const isSelected = folder.id === selectedFolderId
                  const IconComp = getFolderIcon(folder.icon)

                  return (
                    <button
                      key={folder.id}
                      type="button"
                      disabled={isCurrent || moving}
                      onClick={() => setSelectedFolderId(folder.id)}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left
                        transition-colors
                        ${isCurrent
                          ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                          : isSelected
                            ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 ring-1 ring-purple-300 dark:ring-purple-600'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800/60 text-foreground cursor-pointer'
                        }
                      `}
                    >
                      <IconComp
                        className={`h-4 w-4 shrink-0 ${
                          isCurrent
                            ? 'text-gray-400 dark:text-gray-500'
                            : isSelected
                              ? 'text-purple-500'
                              : 'text-purple-400'
                        }`}
                      />
                      <span className="truncate flex-1">{folder.name}</span>
                      {isCurrent && (
                        <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
                          aktuální
                        </span>
                      )}
                      {isSelected && !isCurrent && (
                        <Check className="h-4 w-4 text-purple-500 shrink-0" />
                      )}
                    </button>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={moving}
          >
            Zrušit
          </Button>
          <Button
            onClick={handleMove}
            disabled={moving || !selectedFolderId}
          >
            {moving ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                Přesouvám...
              </>
            ) : (
              <>
                <MoveRight className="h-4 w-4 mr-1.5" />
                Přesunout
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
