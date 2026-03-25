'use client'

import { useState, useCallback, useRef } from 'react'
import { Upload, Download, Save, FileText, Loader2, AlertCircle, CheckCircle2, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Transaction {
  date: string
  amount: number
  variable_symbol?: string | null
  constant_symbol?: string | null
  counterparty_name?: string | null
  counterparty_account?: string | null
  counterparty_bank_code?: string | null
  description?: string | null
}

interface ExtractResult {
  transactions: Transaction[]
  xml: string
  document_id?: string
  stats: {
    total: number
    receipts: number
    expenses: number
    total_receipts: number
    total_expenses: number
  }
}

interface BankExtractPanelProps {
  companyId: string
}

export function BankExtractPanel({ companyId }: BankExtractPanelProps) {
  const [result, setResult] = useState<ExtractResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [currentFile, setCurrentFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExtract = useCallback(async (file: File) => {
    setLoading(true)
    setError(null)
    setResult(null)
    setFileName(file.name)
    setCurrentFile(file)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('companyId', companyId)
      formData.append('mode', 'extract_only')

      const res = await fetch('/api/accountant/bank-statements/extract-to-xml', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || `HTTP ${res.status}`)
      }

      const data: ExtractResult = await res.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extraction failed')
    } finally {
      setLoading(false)
    }
  }, [companyId])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleExtract(file)
  }, [handleExtract])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleExtract(file)
  }, [handleExtract])

  const handleDownloadXml = useCallback(() => {
    if (!result?.xml) return
    const blob = new Blob([result.xml], { type: 'application/xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bv-${companyId}-${new Date().toISOString().slice(0, 7)}.xml`
    a.click()
    URL.revokeObjectURL(url)
  }, [result, companyId])

  const handleSave = useCallback(async () => {
    if (!currentFile) return
    setSaving(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', currentFile)
      formData.append('companyId', companyId)
      formData.append('mode', 'extract_and_save')

      const res = await fetch('/api/accountant/bank-statements/extract-to-xml', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || `HTTP ${res.status}`)
      }

      const data: ExtractResult = await res.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }, [companyId, currentFile])

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      {!result && !loading && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${dragOver
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
            }
          `}
        >
          <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm font-medium">
            Přetahnete sem bankovni vypis
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            PDF, CSV, MT940 (max 10 MB)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.csv,.sta,.mt940,.jpg,.jpeg,.png"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 mx-auto mb-3 animate-spin text-primary" />
            <p className="text-sm font-medium">Zpracovavam vypis...</p>
            <p className="text-xs text-muted-foreground mt-1">{fileName}</p>
            <p className="text-xs text-muted-foreground mt-1">
              OCR rozpoznavani muze trvat 10-30 sekund
            </p>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {error && (
        <Card className="border-destructive/50">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive">Chyba zpracovani</p>
                <p className="text-xs text-muted-foreground mt-1">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => { setError(null); setResult(null); setFileName(null) }}
                >
                  Zkusit znovu
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <CardContent className="py-3 px-4">
                <p className="text-xs text-muted-foreground">Transakci</p>
                <p className="text-lg font-semibold">{result.stats.total}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3 px-4">
                <p className="text-xs text-muted-foreground">Prijmy</p>
                <p className="text-lg font-semibold text-green-600">
                  {result.stats.receipts}
                </p>
                <p className="text-xs text-green-600">{formatAmount(result.stats.total_receipts)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3 px-4">
                <p className="text-xs text-muted-foreground">Vydaje</p>
                <p className="text-lg font-semibold text-red-600">
                  {result.stats.expenses}
                </p>
                <p className="text-xs text-red-600">{formatAmount(result.stats.total_expenses)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3 px-4">
                <p className="text-xs text-muted-foreground">Bilance</p>
                <p className="text-lg font-semibold">
                  {formatAmount(result.stats.total_receipts + result.stats.total_expenses)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button onClick={handleDownloadXml} size="sm">
              <Download className="h-4 w-4 mr-1" />
              Stahnout XML pro Pohodu
            </Button>
            {!result.document_id && (
              <Button onClick={handleSave} variant="outline" size="sm" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                Ulozit do dokumentu
              </Button>
            )}
            {result.document_id && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Ulozeno
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setResult(null); setFileName(null); setError(null) }}
            >
              Novy vypis
            </Button>
          </div>

          {/* Transaction table */}
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Transakce ({result.transactions.length})
                {fileName && <span className="text-muted-foreground font-normal">— {fileName}</span>}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="max-h-[400px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Datum</TableHead>
                      <TableHead className="text-right w-[120px]">Castka</TableHead>
                      <TableHead className="w-[100px]">VS</TableHead>
                      <TableHead>Popis</TableHead>
                      <TableHead>Protiucet</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.transactions.map((tx, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs">{tx.date}</TableCell>
                        <TableCell className={`text-right text-xs font-mono ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatAmount(tx.amount)}
                        </TableCell>
                        <TableCell className="text-xs font-mono">{tx.variable_symbol || '—'}</TableCell>
                        <TableCell className="text-xs max-w-[200px] truncate">
                          {tx.description || tx.counterparty_name || '—'}
                        </TableCell>
                        <TableCell className="text-xs font-mono">
                          {tx.counterparty_account
                            ? `${tx.counterparty_account}${tx.counterparty_bank_code ? '/' + tx.counterparty_bank_code : ''}`
                            : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
