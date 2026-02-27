'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  FileText,
  Search,
  Paperclip,
  X,
  Loader2,
} from 'lucide-react'

type Document = {
  id: string
  company_id: string
  period: string
  type: string
  file_name: string
  file_size_bytes: number
  status: string
  uploaded_at: string
  supplier_name?: string
  total_with_vat?: number
  accounting_number?: string
}

type DocumentPickerProps = {
  companyId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (documentIds: string[]) => void
  excludeIds?: string[]
  title?: string
}

const DOC_TYPE_LABELS: Record<string, string> = {
  bank_statement: 'Výpis',
  expense_invoice: 'Náklad',
  income_invoice: 'Příjem',
  receipt: 'Pokladní',
  other: 'Ostatní',
}

const DOC_STATUS_COLORS: Record<string, string> = {
  uploaded: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

export function DocumentPicker({
  companyId,
  open,
  onOpenChange,
  onSelect,
  excludeIds = [],
  title = 'Vybrat dokumenty',
}: DocumentPickerProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString())
  const [selected, setSelected] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!open || !companyId) return
    setLoading(true)
    setSelected(new Set())
    fetch(`/api/accountant/companies/${companyId}/documents?year=${yearFilter}`)
      .then(r => r.json())
      .then(data => {
        setDocuments(data.documents || [])
      })
      .catch(() => setDocuments([]))
      .finally(() => setLoading(false))
  }, [open, companyId, yearFilter])

  const filtered = documents.filter(doc => {
    if (excludeIds.includes(doc.id)) return false
    if (typeFilter !== 'all' && doc.type !== typeFilter) return false
    if (search) {
      const s = search.toLowerCase()
      return (
        doc.file_name.toLowerCase().includes(s) ||
        (doc.supplier_name || '').toLowerCase().includes(s) ||
        (doc.accounting_number || '').toLowerCase().includes(s) ||
        doc.period.includes(s)
      )
    }
    return true
  })

  const toggleDoc = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleConfirm = () => {
    onSelect(Array.from(selected))
    onOpenChange(false)
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Paperclip className="h-5 w-5 text-purple-600" />
            {title}
          </DialogTitle>
          <DialogDescription>
            Vyberte dokumenty k pripojeni. Vybrano: {selected.size}
          </DialogDescription>
        </DialogHeader>

        {/* Filters */}
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Hledat (nazev, dodavatel, cislo)..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-32 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Vse</SelectItem>
              <SelectItem value="bank_statement">Vypisy</SelectItem>
              <SelectItem value="expense_invoice">Naklady</SelectItem>
              <SelectItem value="income_invoice">Prijmy</SelectItem>
              <SelectItem value="receipt">Pokladni</SelectItem>
              <SelectItem value="other">Ostatni</SelectItem>
            </SelectContent>
          </Select>
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="w-20 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2026, 2025, 2024].map(y => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Document list */}
        <div className="flex-1 overflow-y-auto min-h-0 border rounded-lg divide-y">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              Zadne dokumenty
            </div>
          ) : (
            filtered.map(doc => (
              <label
                key={doc.id}
                className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
              >
                <Checkbox
                  checked={selected.has(doc.id)}
                  onCheckedChange={() => toggleDoc(doc.id)}
                />
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{doc.file_name}</div>
                  <div className="text-xs text-muted-foreground flex gap-2">
                    <span>{doc.period}</span>
                    {doc.supplier_name && <span>{doc.supplier_name}</span>}
                    {doc.total_with_vat != null && <span>{doc.total_with_vat.toLocaleString('cs-CZ')} Kc</span>}
                    <span>{formatSize(doc.file_size_bytes)}</span>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] shrink-0">
                  {DOC_TYPE_LABELS[doc.type] || doc.type}
                </Badge>
                <Badge className={`text-[10px] shrink-0 ${DOC_STATUS_COLORS[doc.status] || 'bg-gray-100 text-gray-600'}`}>
                  {doc.status}
                </Badge>
              </label>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Zrusit</Button>
          <Button
            onClick={handleConfirm}
            disabled={selected.size === 0}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Paperclip className="h-4 w-4 mr-1" />
            Pripojit {selected.size > 0 ? `(${selected.size})` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
