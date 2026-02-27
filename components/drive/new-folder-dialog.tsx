'use client'

import { useState } from 'react'
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
  FolderPlus,
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

type NewFolderDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyId: string
  parentId?: string
  onCreated: () => void
}

const ICON_OPTIONS = [
  { value: 'folder', label: 'Složka', icon: Folder },
  { value: 'file-text', label: 'Dokument', icon: FileText },
  { value: 'archive', label: 'Archiv', icon: Archive },
  { value: 'briefcase', label: 'Obchodní', icon: Briefcase },
  { value: 'book-open', label: 'Kniha', icon: BookOpen },
  { value: 'receipt', label: 'Účtenky', icon: Receipt },
  { value: 'file-spreadsheet', label: 'Tabulky', icon: FileSpreadsheet },
  { value: 'shield', label: 'Pojištění', icon: Shield },
] as const

export function NewFolderDialog({
  open,
  onOpenChange,
  companyId,
  parentId,
  onCreated,
}: NewFolderDialogProps) {
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('folder')
  const [clientVisible, setClientVisible] = useState(true)
  const [hasPeriodFilter, setHasPeriodFilter] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const resetForm = () => {
    setName('')
    setIcon('folder')
    setClientVisible(true)
    setHasPeriodFilter(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedName = name.trim()
    if (!trimmedName) {
      toast.error('Zadejte název složky')
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch('/api/drive/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          name: trimmedName,
          icon,
          clientVisible,
          hasPeriodFilter,
          parentId: parentId ?? null,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Nepodařilo se vytvořit složku')
      }

      toast.success(`Složka "${trimmedName}" byla vytvořena`)
      resetForm()
      onCreated()
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Nepodařilo se vytvořit složku')
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      resetForm()
    }
    onOpenChange(value)
  }

  const SelectedIcon = ICON_OPTIONS.find((o) => o.value === icon)?.icon ?? Folder

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5 text-purple-600" />
            Nová složka
          </DialogTitle>
          <DialogDescription>
            Vytvořte vlastní složku pro organizaci dokumentů.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-1">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="folder-name">Název složky *</Label>
            <Input
              id="folder-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Např. Smlouvy 2026"
              disabled={submitting}
              autoFocus
            />
          </div>

          {/* Icon */}
          <div className="space-y-2">
            <Label htmlFor="folder-icon">Ikona</Label>
            <Select value={icon} onValueChange={setIcon} disabled={submitting}>
              <SelectTrigger id="folder-icon">
                <div className="flex items-center gap-2">
                  <SelectedIcon className="h-4 w-4 text-purple-500" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                {ICON_OPTIONS.map((opt) => {
                  const IconComp = opt.icon
                  return (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <IconComp className="h-4 w-4 text-purple-500" />
                        {opt.label}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Checkboxes */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Checkbox
                id="client-visible"
                checked={clientVisible}
                onCheckedChange={(checked) => setClientVisible(checked === true)}
                disabled={submitting}
              />
              <Label
                htmlFor="client-visible"
                className="text-sm font-normal cursor-pointer"
              >
                Viditelná pro klienta
              </Label>
            </div>

            <div className="flex items-center gap-3">
              <Checkbox
                id="has-period-filter"
                checked={hasPeriodFilter}
                onCheckedChange={(checked) => setHasPeriodFilter(checked === true)}
                disabled={submitting}
              />
              <Label
                htmlFor="has-period-filter"
                className="text-sm font-normal cursor-pointer"
              >
                Filtrování podle období (rok/měsíc)
              </Label>
            </div>
          </div>

          {/* Footer */}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={submitting}
            >
              Zrušit
            </Button>
            <Button type="submit" disabled={submitting || !name.trim()}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  Vytvářím...
                </>
              ) : (
                <>
                  <FolderPlus className="h-4 w-4 mr-1.5" />
                  Vytvořit složku
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
