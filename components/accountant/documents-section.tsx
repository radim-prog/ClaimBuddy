'use client'

import { useState } from 'react'
import { Upload, FileText, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DocumentRegisterTab } from './documents/document-register-tab'
import { UploadDialog } from './documents/upload-dialog'
import { BankExtractPanel } from './bank-extract-panel'

interface DocumentsSectionProps {
  companyId: string
  companyName?: string
  vatPayer?: boolean
}

type TabId = 'documents' | 'bank-extract'

export function DocumentsSection({ companyId }: DocumentsSectionProps) {
  const [uploadOpen, setUploadOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [activeTab, setActiveTab] = useState<TabId>('documents')

  return (
    <div className="space-y-3">
      {/* Tab navigation */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          <button
            onClick={() => setActiveTab('documents')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${
              activeTab === 'documents'
                ? 'bg-background shadow-sm font-medium'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            Dokumenty
          </button>
          <button
            onClick={() => setActiveTab('bank-extract')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${
              activeTab === 'bank-extract'
                ? 'bg-background shadow-sm font-medium'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            Vytezit vypis
          </button>
        </div>

        {activeTab === 'documents' && (
          <Button variant="outline" size="sm" onClick={() => setUploadOpen(true)}>
            <Upload className="h-4 w-4 mr-1" />
            Nahrat dokument
          </Button>
        )}
      </div>

      {/* Tab content */}
      {activeTab === 'documents' && (
        <>
          <DocumentRegisterTab key={refreshKey} companyId={companyId} />
          <UploadDialog
            open={uploadOpen}
            onOpenChange={setUploadOpen}
            companyId={companyId}
            onUploaded={() => setRefreshKey(k => k + 1)}
          />
        </>
      )}

      {activeTab === 'bank-extract' && (
        <BankExtractPanel companyId={companyId} />
      )}
    </div>
  )
}
