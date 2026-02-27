'use client'

import { useState } from 'react'
import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DocumentRegisterTab } from './documents/document-register-tab'
import { UploadDialog } from './documents/upload-dialog'

interface DocumentsSectionProps {
  companyId: string
  companyName?: string
  vatPayer?: boolean
}

export function DocumentsSection({ companyId }: DocumentsSectionProps) {
  const [uploadOpen, setUploadOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end">
        <Button variant="outline" size="sm" onClick={() => setUploadOpen(true)}>
          <Upload className="h-4 w-4 mr-1" />
          Nahrát dokument
        </Button>
      </div>

      <DocumentRegisterTab key={refreshKey} companyId={companyId} />

      <UploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        companyId={companyId}
        onUploaded={() => setRefreshKey(k => k + 1)}
      />
    </div>
  )
}
