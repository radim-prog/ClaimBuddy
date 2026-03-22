'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Camera,
  FileText,
  Landmark,
  Receipt,
  Loader2,
  RefreshCw,
  Download,
  Eye,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useClientUser } from '@/lib/contexts/client-user-context'
import { DocumentComments } from '@/components/documents/document-comments'
import { ScanOverlay } from '@/components/client/action-hub/scan-overlay'
import { CollapsibleSection } from '@/components/collapsible-section'
import { BankTab } from '@/components/client/documents/bank-tab'
import { UpsellBanner } from '@/components/client/upsell-banner'
import { isNativePlatform } from '@/lib/platform'
import { takePhoto } from '@/lib/native-camera'
import { toast } from 'sonner'
import { Suspense } from 'react'
import { useUrlFilters } from '@/lib/hooks/use-url-filters'

export default function DocumentsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-32"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}>
      <DocumentsPageInner />
    </Suspense>
  )
}

function DocumentsPageInner() {
  const [showScanOverlay, setShowScanOverlay] = useState(false)
  const [nativeCameraFile, setNativeCameraFile] = useState<File | null>(null)
  const [bankExpanded, setBankExpanded] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('documents-bank-expanded') === 'true'
    }
    return false
  })

  const toggleBank = useCallback(() => {
    setBankExpanded(prev => {
      const next = !prev
      localStorage.setItem('documents-bank-expanded', String(next))
      return next
    })
  }, [])

  const { visibleCompanies, selectedCompanyId } = useClientUser()
  const companyId = selectedCompanyId || visibleCompanies[0]?.id || ''

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display">Doklady</h1>
        <p className="text-muted-foreground">Nahrajte doklady a spravujte bankovní výpisy</p>
      </div>

      <UpsellBanner message="Nahráváte doklady sami? S profesionální účetní ušetříte čas a vyhnete se chybám." />

      {/* Action buttons */}
      <div className={cn('grid gap-3', isNativePlatform() ? 'grid-cols-3' : 'grid-cols-2')}>
        {isNativePlatform() && (
          <button
            onClick={async () => {
              try {
                const photoUri = await takePhoto()
                if (photoUri) {
                  const response = await fetch(photoUri)
                  const blob = await response.blob()
                  const file = new File([blob], `doklad-${Date.now()}.jpg`, { type: 'image/jpeg' })
                  setNativeCameraFile(file)
                  setShowScanOverlay(true)
                }
              } catch {
                toast.error('Nepodařilo se otevřít kameru')
              }
            }}
            className="action-btn h-14 flex items-center justify-center gap-3 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-base"
          >
            <Camera className="h-5 w-5 flex-shrink-0" />
            Vyfotit doklad
          </button>
        )}
        <button
          onClick={() => { setNativeCameraFile(null); setShowScanOverlay(true) }}
          className="action-btn h-14 flex items-center justify-center gap-3 px-5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-base"
        >
          <Camera className="h-5 w-5 flex-shrink-0" />
          Nahrát doklad
        </button>
        <a
          href="/client/invoices"
          className="action-btn h-14 flex items-center justify-center gap-3 px-5 border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium text-base rounded-xl transition-colors"
        >
          <Receipt className="h-5 w-5 flex-shrink-0" />
          Vystavit fakturu
          <ChevronRight className="h-4 w-4 flex-shrink-0" />
        </a>
      </div>

      {/* Document list - always visible */}
      <DocumentListTab />

      {/* Bank section - prominent with callout */}
      {!bankExpanded && (
        <button
          onClick={toggleBank}
          className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors text-left"
        >
          <Landmark className="h-5 w-5 text-blue-600 shrink-0" />
          <div className="flex-1">
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Bankovní výpisy</span>
            <span className="text-xs text-blue-600/70 dark:text-blue-400/70 ml-2">Nahrávejte výpisy a párujte transakce</span>
          </div>
          <ChevronRight className="h-4 w-4 text-blue-400" />
        </button>
      )}
      <CollapsibleSection
        id="documents-bank"
        label="Bankovní výpisy"
        icon={Landmark}
        expanded={bankExpanded}
        onToggle={toggleBank}
        variant="bordered"
      >
        <BankTab />
      </CollapsibleSection>

      {/* Overlays */}
      <ScanOverlay
        open={showScanOverlay}
        companyId={companyId}
        companies={visibleCompanies}
        onClose={() => { setShowScanOverlay(false); setNativeCameraFile(null) }}
        initialFile={nativeCameraFile}
      />
    </div>
  )
}


interface Document {
  id: string
  company_id: string
  period: string
  type: string
  file_name: string
  file_size_bytes: number
  status: string
  ocr_status?: string
  uploaded_at: string
  storage_path: string | null
}

const typeLabels: Record<string, { label: string; icon: typeof FileText }> = {
  bank_statement: { label: 'Bankovní výpis', icon: Landmark },
  expense_invoice: { label: 'Nákladový doklad', icon: Receipt },
  income_invoice: { label: 'Příjmová faktura', icon: FileText },
  invoice: { label: 'Faktura', icon: Receipt },
  receipt: { label: 'Účtenka', icon: Receipt },
}

const statusColors: Record<string, string> = {
  uploaded: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  draft: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  submitted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
}

const statusLabels: Record<string, string> = {
  uploaded: 'Nahráno',
  uploaded_only: 'Čeká na zpracování',
  approved: 'Schváleno',
  rejected: 'Zamítnuto',
  pending: 'Čeká',
  draft: 'Nepotvrzeno',
  submitted: 'Odesláno',
}

function formatSize(bytes: number): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

type ListFilter = 'all' | 'draft' | 'submitted' | 'approved'

function DocumentListTab() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const { filters: urlFilters, setFilter: setUrlParam } = useUrlFilters({ filter: 'all' })
  const filter = urlFilters.filter as ListFilter

  const fetchDocs = async () => {
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
  }

  useEffect(() => { fetchDocs() }, [])

  const filtered = documents.filter(doc => {
    if (filter === 'all') return true
    const docStatus = doc.ocr_status || doc.status
    return docStatus === filter
  })

  const draftCount = documents.filter(d => (d.ocr_status || d.status) === 'draft').length

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {(['all', 'draft', 'submitted', 'approved'] as const).map(f => (
          <button
            key={f}
            onClick={() => setUrlParam('filter', f)}
            className={cn(
              'filter-pill',
              filter === f ? 'filter-pill-active' : 'filter-pill-inactive'
            )}
          >
            {f === 'all' ? 'Vše' : f === 'draft' ? `Nepotvrzeno (${draftCount})` : f === 'submitted' ? 'Odesláno' : 'Schváleno'}
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
            <Button onClick={() => setShowScanOverlay(true)} size="sm">
              <Camera className="mr-1.5 h-4 w-4" />
              Nahrát první doklad
            </Button>
          </CardContent>
        </Card>
      )}

      {filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map(doc => {
            const typeInfo = typeLabels[doc.type] || { label: doc.type, icon: FileText }
            const Icon = typeInfo.icon
            const isSelected = selectedDoc?.id === doc.id
            const docStatus = doc.ocr_status || doc.status

            return (
              <Card
                key={doc.id}
                className={cn(
                  'rounded-2xl cursor-pointer transition-colors',
                  isSelected ? 'ring-2 ring-blue-500' : 'hover:bg-muted/50',
                  docStatus === 'draft' && 'border-amber-300 dark:border-amber-700'
                )}
                onClick={() => setSelectedDoc(isSelected ? null : doc)}
              >
                <CardContent className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg shrink-0">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.file_name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{typeInfo.label}</span>
                        {doc.period && <><span>·</span><span>{doc.period}</span></>}
                        {doc.file_size_bytes > 0 && <><span>·</span><span>{formatSize(doc.file_size_bytes)}</span></>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {doc.storage_path && (
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => window.open(`/api/documents/${doc.id}/download?inline=true`, '_blank')}
                            className="p-1 text-muted-foreground hover:text-blue-600 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            title="Náhled"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={async () => {
                              const res = await fetch(`/api/documents/${doc.id}/download`)
                              if (res.ok) {
                                const data = await res.json()
                                const a = document.createElement('a')
                                a.href = data.url
                                a.download = data.file_name || doc.file_name
                                a.click()
                              }
                            }}
                            className="p-1 text-muted-foreground hover:text-blue-600 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            title="Stáhnout"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                      <Badge className={cn('rounded-md', statusColors[docStatus] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300')}>
                        {statusLabels[docStatus] || docStatus}
                      </Badge>
                      <span className="text-xs text-muted-foreground hidden sm:inline">
                        {new Date(doc.uploaded_at).toLocaleDateString('cs-CZ')}
                      </span>
                      <ChevronRight className={cn('h-4 w-4 text-muted-foreground transition-transform', isSelected && 'rotate-90')} />
                    </div>
                  </div>
                </CardContent>

                {isSelected && (
                  <div className="px-4 pb-4 border-t border-border/50" onClick={(e) => e.stopPropagation()}>
                    <div className="pt-4">
                      <DocumentComments documentId={doc.id} userRole="client" />
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

