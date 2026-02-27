'use client'

import { useState, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface BankStatementUploadProps {
  companyId: string
  onUploadComplete: (result: {
    inserted: number
    matched: number
    unmatched: number
    tax_impact: number
    vat_impact: number
  }) => void
}

export function BankStatementUpload({ companyId, onUploadComplete }: BankStatementUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<{
    inserted: number
    matched: number
    tax_impact: number
    vat_impact: number
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (file: File) => {
    setUploading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('companyId', companyId)

      const res = await fetch('/api/client/bank-statements/extract', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Upload selhal')
      }

      const data = await res.json()
      setResult({
        inserted: data.inserted,
        matched: data.matched,
        tax_impact: data.tax_impact,
        vat_impact: data.vat_impact,
      })
      onUploadComplete(data)
      toast.success(`Zpracováno ${data.inserted} transakcí`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Zpracování selhalo')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.csv,.xml"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleUpload(file)
            e.target.value = ''
          }}
        />

        {uploading ? (
          <div className="text-center py-8">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-3" />
            <p className="text-sm font-medium">Zpracovávám bankovní výpis...</p>
            <p className="text-xs text-muted-foreground mt-1">
              Extrakce transakcí a automatické párování
            </p>
          </div>
        ) : result ? (
          <div className="text-center py-6">
            <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto mb-3" />
            <p className="text-sm font-medium mb-3">Výpis zpracován</p>
            <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto text-sm">
              <div className="bg-muted rounded-lg p-2">
                <p className="text-muted-foreground text-xs">Transakcí</p>
                <p className="font-bold">{result.inserted}</p>
              </div>
              <div className="bg-muted rounded-lg p-2">
                <p className="text-muted-foreground text-xs">Spárováno</p>
                <p className="font-bold text-green-600">{result.matched}</p>
              </div>
              {(result.tax_impact > 0 || result.vat_impact > 0) && (
                <div className="col-span-2 bg-red-50 dark:bg-red-950/30 rounded-lg p-2">
                  <p className="text-xs text-red-600 dark:text-red-400">Daňový dopad nespárovaných</p>
                  <p className="font-bold text-red-700 dark:text-red-300">
                    {(result.tax_impact + result.vat_impact).toLocaleString('cs-CZ')} Kč
                  </p>
                </div>
              )}
            </div>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setResult(null)
                fileInputRef.current?.click()
              }}
            >
              Nahrát další výpis
            </Button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors"
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <Upload className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-sm font-medium">Nahrát bankovní výpis</p>
              <p className="text-xs text-muted-foreground mt-1">PDF, CSV nebo XML</p>
            </div>
          </button>
        )}
      </CardContent>
    </Card>
  )
}
