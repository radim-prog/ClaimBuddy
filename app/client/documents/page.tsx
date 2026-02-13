'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText, Upload, Landmark, Receipt, RefreshCw } from 'lucide-react'
import Link from 'next/link'

interface Document {
  id: string
  company_id: string
  period: string
  type: string
  file_name: string
  file_size_bytes: number
  status: string
  uploaded_at: string
}

const typeLabels: Record<string, { label: string; icon: typeof FileText }> = {
  bank_statement: { label: 'Výpis z banky', icon: Landmark },
  expense_invoice: { label: 'Nákladový doklad', icon: Receipt },
  income_invoice: { label: 'Příjmová faktura', icon: FileText },
}

const statusColors: Record<string, string> = {
  uploaded: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
}

const statusLabels: Record<string, string> = {
  uploaded: 'Nahráno',
  approved: 'Schváleno',
  rejected: 'Zamítnuto',
  pending: 'Čeká',
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Moje dokumenty</h1>
          <p className="text-muted-foreground">Přehled nahraných dokladů</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchDocs}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Obnovit
          </Button>
          <Button asChild size="sm">
            <Link href="/client/upload">
              <Upload className="h-4 w-4 mr-2" />
              Nahrát nový
            </Link>
          </Button>
        </div>
      </div>

      {loading && documents.length === 0 && (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      )}

      {!loading && documents.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground mb-4">Zatím nemáte žádné nahrané dokumenty</p>
            <Button asChild>
              <Link href="/client/upload">
                <Upload className="h-4 w-4 mr-2" />
                Nahrát první doklad
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {documents.length > 0 && (
        <div className="space-y-2">
          {documents.map(doc => {
            const typeInfo = typeLabels[doc.type] || { label: doc.type, icon: FileText }
            const Icon = typeInfo.icon
            return (
              <Card key={doc.id}>
                <CardContent className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg shrink-0">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.file_name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{typeInfo.label}</span>
                        <span>·</span>
                        <span>{doc.period}</span>
                        <span>·</span>
                        <span>{formatSize(doc.file_size_bytes)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge className={statusColors[doc.status] || 'bg-gray-100 text-gray-800'}>
                        {statusLabels[doc.status] || doc.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(doc.uploaded_at).toLocaleDateString('cs-CZ')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
