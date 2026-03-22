'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Camera,
  FileText,
  Landmark,
  Receipt,
  Loader2,
  RefreshCw,
  Upload,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useClientUser } from '@/lib/contexts/client-user-context'
import { DocumentComments } from '@/components/documents/document-comments'
import { ScanOverlay } from '@/components/client/action-hub/scan-overlay'
import { BankTab } from '@/components/client/documents/bank-tab'
import { InvoicesList } from '@/components/client/documents/invoices-list'
import { DocumentRow, type DocumentRowData } from '@/components/client/documents/document-row'
import { InvoiceOverlay } from '@/components/client/action-hub/invoice-overlay'
import { isNativePlatform } from '@/lib/platform'
import { takePhoto } from '@/lib/native-camera'
import { toast } from 'sonner'
import { useUrlFilters } from '@/lib/hooks/use-url-filters'

export default function DocumentsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-32"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}>
      <DocumentsPageInner />
    </Suspense>
  )
}

type TabValue = 'documents' | 'invoices' | 'bank'

function DocumentsPageInner() {
  const [showScanOverlay, setShowScanOverlay] = useState(false)
  const [showInvoiceOverlay, setShowInvoiceOverlay] = useState(false)
  const [nativeCameraFile, setNativeCameraFile] = useState<File | null>(null)

  const { filters, setFilter } = useUrlFilters({ tab: 'documents', action: '' })
  const activeTab = (filters.tab || 'documents') as TabValue

  const { visibleCompanies, selectedCompanyId } = useClientUser()
  const companyId = selectedCompanyId || visibleCompanies[0]?.id || ''

  // Handle ?action=new query param for invoices tab
  useEffect(() => {
    if (filters.action === 'new' && activeTab === 'invoices') {
      setShowInvoiceOverlay(true)
      setFilter('action', '')
    }
  }, [filters.action, activeTab, setFilter])

  const handleTabChange = (value: string) => {
    setFilter('tab', value)
  }

  const openScan = (file?: File | null) => {
    setNativeCameraFile(file || null)
    setShowScanOverlay(true)
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold font-display">Doklady & Faktury</h1>
        <p className="text-muted-foreground">Nahrajte doklady, faktury a bankovní výpisy</p>
      </div>

      {/* 3 CTA buttons */}
      <div className={cn('grid gap-2', isNativePlatform() ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3')}>
        {isNativePlatform() && (
          <button
            onClick={async () => {
              try {
                const photoUri = await takePhoto()
                if (photoUri) {
                  const response = await fetch(photoUri)
                  const blob = await response.blob()
                  const file = new File([blob], `doklad-${Date.now()}.jpg`, { type: 'image/jpeg' })
                  openScan(file)
                }
              } catch {
                toast.error('Nepodařilo se otevřít kameru')
              }
            }}
            className="action-btn h-12 flex items-center justify-center gap-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm"
          >
            <Camera className="h-4 w-4 flex-shrink-0" />
            Vyfotit
          </button>
        )}
        <button
          onClick={() => { handleTabChange('documents'); openScan() }}
          className="action-btn h-12 flex items-center justify-center gap-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm"
        >
          <Upload className="h-4 w-4 flex-shrink-0" />
          Nahrát doklad
        </button>
        <button
          onClick={() => { handleTabChange('invoices'); setShowInvoiceOverlay(true) }}
          className="action-btn h-12 flex items-center justify-center gap-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm"
        >
          <Receipt className="h-4 w-4 flex-shrink-0" />
          Vystavit fakturu
        </button>
        <button
          onClick={() => handleTabChange('bank')}
          className="action-btn h-12 flex items-center justify-center gap-2 px-4 border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium text-sm rounded-xl transition-colors"
        >
          <Landmark className="h-4 w-4 flex-shrink-0" />
          Nahrát výpis
        </button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="documents" className="gap-1.5">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Nahrané</span> doklady
          </TabsTrigger>
          <TabsTrigger value="invoices" className="gap-1.5">
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">Vystavené</span> faktury
          </TabsTrigger>
          <TabsTrigger value="bank" className="gap-1.5">
            <Landmark className="h-4 w-4" />
            <span className="hidden sm:inline">Bankovní</span> výpisy
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="mt-4">
          <DocumentsTab onScan={() => openScan()} />
        </TabsContent>

        <TabsContent value="invoices" className="mt-4">
          <InvoicesList
            companyId={companyId}
            onNew={() => setShowInvoiceOverlay(true)}
          />
        </TabsContent>

        <TabsContent value="bank" className="mt-4">
          <BankTab />
        </TabsContent>
      </Tabs>

      {/* Overlays */}
      <ScanOverlay
        open={showScanOverlay}
        companyId={companyId}
        companies={visibleCompanies}
        onClose={() => { setShowScanOverlay(false); setNativeCameraFile(null) }}
        initialFile={nativeCameraFile}
      />

      <InvoiceOverlay
        open={showInvoiceOverlay}
        companyId={companyId}
        onClose={() => setShowInvoiceOverlay(false)}
      />
    </div>
  )
}


// ===== DOCUMENTS TAB =====

type ListFilter = 'all' | 'draft' | 'extracted' | 'client_verified' | 'approved'

function DocumentsTab({ onScan }: { onScan: () => void }) {
  const [documents, setDocuments] = useState<DocumentRowData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null)
  const { filters: urlFilters, setFilter: setUrlParam } = useUrlFilters({ docFilter: 'all' })
  const filter = urlFilters.docFilter as ListFilter

  const fetchDocs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/client/documents')
      if (res.ok) {
        const data = await res.json()
        setDocuments(data.documents || [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDocs() }, [fetchDocs])

  const filtered = documents.filter(doc => {
    if (filter === 'all') return true
    const docStatus = doc.ocr_status || doc.status
    return docStatus === filter
  })

  const draftCount = documents.filter(d => (d.ocr_status || d.status) === 'draft').length
  const extractedCount = documents.filter(d => (d.ocr_status || d.status) === 'extracted').length

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {([
          { key: 'all', label: 'Vše' },
          { key: 'draft', label: `Nepotvrzeno${draftCount > 0 ? ` (${draftCount})` : ''}` },
          { key: 'extracted', label: `Vytěženo${extractedCount > 0 ? ` (${extractedCount})` : ''}` },
          { key: 'client_verified', label: 'Ověřeno' },
          { key: 'approved', label: 'Schváleno' },
        ] as const).map(f => (
          <button
            key={f.key}
            onClick={() => setUrlParam('docFilter', f.key)}
            className={cn(
              'filter-pill',
              filter === f.key ? 'filter-pill-active' : 'filter-pill-inactive'
            )}
          >
            {f.label}
          </button>
        ))}
        <Button variant="outline" size="sm" onClick={fetchDocs} className="ml-auto">
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
        </Button>
      </div>

      {loading && documents.length === 0 && (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      )}

      {!loading && documents.length === 0 && (
        <Card className="rounded-2xl">
          <CardContent className="py-16 text-center">
            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
            <p className="font-semibold text-gray-900 dark:text-white mb-1">Zatím nemáte žádné dokumenty</p>
            <p className="text-sm text-muted-foreground mb-5">Nahrajte svůj první doklad — fotkou, scanem nebo PDF.</p>
            <Button onClick={onScan} size="sm">
              <Camera className="mr-1.5 h-4 w-4" />
              Nahrát první doklad
            </Button>
          </CardContent>
        </Card>
      )}

      {filtered.length > 0 && (
        <div className="space-y-1.5">
          {filtered.map(doc => {
            const isSelected = selectedDocId === doc.id

            return (
              <DocumentRow
                key={doc.id}
                doc={doc}
                selected={isSelected}
                expanded={isSelected}
                onClick={() => setSelectedDocId(isSelected ? null : doc.id)}
              >
                {/* Expanded: show extraction data + comments */}
                <div className="space-y-3">
                  {/* Extraction metadata */}
                  {(doc.supplier_name || doc.total_with_vat || doc.variable_symbol) && (
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {doc.supplier_name && (
                        <div>
                          <span className="text-xs text-muted-foreground">Dodavatel</span>
                          <p className="font-medium">{doc.supplier_name}</p>
                        </div>
                      )}
                      {doc.total_with_vat != null && doc.total_with_vat > 0 && (
                        <div>
                          <span className="text-xs text-muted-foreground">Částka</span>
                          <p className="font-medium">{doc.total_with_vat.toLocaleString('cs-CZ')} Kč</p>
                        </div>
                      )}
                      {doc.variable_symbol && (
                        <div>
                          <span className="text-xs text-muted-foreground">VS</span>
                          <p className="font-medium font-mono">{doc.variable_symbol}</p>
                        </div>
                      )}
                      {doc.date_issued && (
                        <div>
                          <span className="text-xs text-muted-foreground">Datum vystavení</span>
                          <p className="font-medium">{new Date(doc.date_issued).toLocaleDateString('cs-CZ')}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <DocumentComments documentId={doc.id} userRole="client" />
                </div>
              </DocumentRow>
            )
          })}
        </div>
      )}

      {filtered.length === 0 && documents.length > 0 && (
        <div className="text-center py-8 text-sm text-muted-foreground">
          Žádné doklady neodpovídají filtru
        </div>
      )}
    </div>
  )
}
