'use client'

import { useState } from 'react'
import {
  Eye,
  Download,
  ExternalLink,
  Pencil,
  FolderInput,
  Trash2,
  MoreHorizontal,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { DriveFile } from '@/lib/types/drive'

type FileActionsMenuProps = {
  file: DriveFile
  onPreview: () => void
  onDelete: () => void
  onMove?: () => void
  onRename?: () => void
}

export function FileActionsMenu({
  file,
  onPreview,
  onDelete,
  onMove,
  onRename,
}: FileActionsMenuProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)

  const downloadUrl = `/api/drive/files/${file.id}/download`

  const handleDeleteClick = () => {
    setConfirmOpen(true)
  }

  const handleConfirmDelete = () => {
    setConfirmOpen(false)
    onDelete()
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label={`Akce pro ${file.name}`}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-48">
          {/* Preview */}
          <DropdownMenuItem onClick={onPreview} className="cursor-pointer">
            <Eye className="mr-2 h-4 w-4 text-gray-500" />
            Nahled
          </DropdownMenuItem>

          {/* Download */}
          <DropdownMenuItem asChild className="cursor-pointer">
            <a href={downloadUrl} download>
              <Download className="mr-2 h-4 w-4 text-gray-500" />
              Stahnout
            </a>
          </DropdownMenuItem>

          {/* Open in Drive */}
          {file.web_view_link && (
            <DropdownMenuItem asChild className="cursor-pointer">
              <a
                href={file.web_view_link}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-2 h-4 w-4 text-gray-500" />
                Otevrit v Drive
              </a>
            </DropdownMenuItem>
          )}

          {/* Rename */}
          {onRename && (
            <DropdownMenuItem onClick={onRename} className="cursor-pointer">
              <Pencil className="mr-2 h-4 w-4 text-gray-500" />
              Prejmenovat
            </DropdownMenuItem>
          )}

          {/* Move */}
          {onMove && (
            <DropdownMenuItem onClick={onMove} className="cursor-pointer">
              <FolderInput className="mr-2 h-4 w-4 text-gray-500" />
              Presunout
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {/* Delete */}
          <DropdownMenuItem
            onClick={handleDeleteClick}
            className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/30"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Smazat
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete confirmation dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Smazat soubor</DialogTitle>
            <DialogDescription>
              Opravdu chcete smazat soubor{' '}
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {file.name}
              </span>
              ? Tuto akci nelze vzit zpet.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
            >
              Zrusit
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Smazat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
