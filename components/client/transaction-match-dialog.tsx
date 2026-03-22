'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { X, FileText, Search, CheckCircle2, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import type { BankTransaction } from './transaction-list'

interface TransactionMatchDialogProps {
  transaction: BankTransaction
  companyId: string
  onMatch: (transactionId: string, documentId: string | null, invoiceId: string | null) => void
  onClose: () => void
}

interface DocOption {
  id: string
  type: 'document' | 'invoice'
  label: string
  date: string
  amount: number
  variable_symbol?: string
}

export function TransactionMatchDialog({
  transaction,
  companyId,
  onMatch,
  onClose,
}: TransactionMatchDialogProps) {
  const [options, setOptions] = useState<DocOption[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchOptions = async () => {
      setLoading(true)
      try {
        // Fetch documents
        const [docsRes, invsRes] = await Promise.all([
          fetch(`/api/client/documents?company_id=${companyId}`),
          fetch(`/api/client/invoices`),
        ])

        const docsData = docsRes.ok ? await docsRes.json() : { documents: [] }
        const invsData = invsRes.ok ? await invsRes.json() : { invoices: [] }

        const docOptions: DocOption[] = (docsData.documents || []).map((d: any) => ({
          id: d.id,
          type: 'document' as const,
          label: d.supplier_name || d.file_name || 'Dokument',
          date: d.uploaded_at || d.created_at || '',
          amount: d.ocr_data?.total_amount || d.ocr_data?.total_with_vat || 0,
          variable_symbol: d.ocr_data?.variable_symbol,
        }))

        const invOptions: DocOption[] = (invsData.invoices || []).map((i: any) => ({
          id: i.id,
          type: 'invoice' as const,
          label: `${i.invoice_number} — ${i.partner_name || 'Neuvedeno'}`,
          date: i.issue_date || '',
          amount: i.amount || i.total_with_vat || 0,
          variable_symbol: i.variable_symbol,
        }))

        setOptions([...docOptions, ...invOptions])
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    fetchOptions()
  }, [companyId])

  const filtered = options.filter(o => {
    if (!search) return true
    const s = search.toLowerCase()
    return (
      o.label.toLowerCase().includes(s) ||
      o.variable_symbol?.includes(s) ||
      String(o.amount).includes(s)
    )
  })

  const handleSelect = (option: DocOption) => {
    if (option.type === 'document') {
      onMatch(transaction.id, option.id, null)
    } else {
      onMatch(transaction.id, null, option.id)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-background rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="font-semibold">Přiřadit doklad</h3>
            <p className="text-sm text-muted-foreground">
              {transaction.counterparty_name || 'Transakce'} —{' '}
              {Math.abs(transaction.amount).toLocaleString('cs-CZ')} Kč
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Hledat podle názvu, VS nebo částky..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Options list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              Žádné doklady k přiřazení
            </p>
          ) : (
            filtered.map(option => (
              <button
                key={`${option.type}-${option.id}`}
                onClick={() => handleSelect(option)}
                className="w-full text-left p-3 rounded-lg border hover:bg-muted/50 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{option.label}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-[10px] px-1">
                        {option.type === 'document' ? 'Doklad' : 'Faktura'}
                      </Badge>
                      {option.date && (
                        <span>{new Date(option.date).toLocaleDateString('cs-CZ')}</span>
                      )}
                      {option.variable_symbol && <span>VS: {option.variable_symbol}</span>}
                    </div>
                  </div>
                  <span className="text-sm font-medium shrink-0">
                    {option.amount.toLocaleString('cs-CZ')} Kč
                  </span>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Unmatch option */}
        <div className="p-4 border-t">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onMatch(transaction.id, null, null)}
          >
            Zrušit přiřazení
          </Button>
        </div>
      </div>
    </div>
  )
}
