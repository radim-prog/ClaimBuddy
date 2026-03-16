'use client'

import { useState, useRef } from 'react'
import { Loader2, Upload, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { BankTransaction } from '@/components/client/transaction-list'

interface TransactionQuickUploadProps {
  transaction: BankTransaction
  companyId: string
  onUploaded: () => void
  onClose: () => void
}

export function TransactionQuickUpload({
  transaction,
  companyId,
  onUploaded,
  onClose,
}: TransactionQuickUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'uploading' | 'matching' | 'done' | 'manual'>('idle')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setUploading(true)
    setStatus('uploading')

    try {
      // 1. Upload the document
      const formData = new FormData()
      formData.append('file', file)
      formData.append('companyId', companyId)
      formData.append('type', 'expense_invoice')
      formData.append('period', transaction.transaction_date?.substring(0, 7) || '')

      const uploadRes = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadRes.ok) {
        const err = await uploadRes.json()
        throw new Error(err.error || 'Upload selhal')
      }

      // 2. Trigger auto-match for this company
      setStatus('matching')
      const matchRes = await fetch('/api/client/bank-transactions/auto-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: companyId }),
      })

      if (matchRes.ok) {
        const matchData = await matchRes.json()
        if (matchData.matched > 0) {
          setStatus('done')
          toast.success('Doklad nahrán a spárován')
          onUploaded()
          return
        }
      }

      // If no auto-match found, suggest manual matching
      setStatus('manual')
      toast.info('Doklad nahrán — párování nebylo nalezeno, zkuste ruční přiřazení')
      onUploaded()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload selhal')
      setStatus('idle')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-background rounded-xl p-6 w-full max-w-sm shadow-xl animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
            e.target.value = ''
          }}
        />

        <h3 className="text-sm font-bold mb-1">Nahrát doklad k transakci</h3>
        <p className="text-xs text-muted-foreground mb-4">
          {transaction.counterparty_name || transaction.description} ·{' '}
          {Math.abs(transaction.amount).toLocaleString('cs-CZ')} Kč
        </p>

        {status === 'idle' && (
          <Button
            className="w-full"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-4 h-4 mr-2" />
            Vybrat soubor (PDF, JPG, PNG)
          </Button>
        )}

        {status === 'uploading' && (
          <div className="text-center py-4">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
            <p className="text-sm">Nahrávám doklad...</p>
          </div>
        )}

        {status === 'matching' && (
          <div className="text-center py-4">
            <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-2" />
            <p className="text-sm">Párování s transakcí...</p>
          </div>
        )}

        {status === 'done' && (
          <div className="text-center py-4">
            <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-green-700">Spárováno!</p>
          </div>
        )}

        {status === 'manual' && (
          <div className="text-center py-4">
            <AlertCircle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
            <p className="text-sm">Doklad nahrán, ale nebyl automaticky spárován.</p>
            <p className="text-xs text-muted-foreground mt-1">Zkuste ruční přiřazení.</p>
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Zavřít
          </Button>
        </div>
      </div>
    </div>
  )
}
