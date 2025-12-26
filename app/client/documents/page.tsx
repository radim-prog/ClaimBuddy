'use client'

import { useEffect, useState } from 'react'
import { FileText, CheckCircle, XCircle, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

type Document = {
  id: string
  company_id: string
  period: string
  type: string
  file_name: string
  thumbnail_url?: string
  description?: string
  uploaded_at: string
  status: 'pending' | 'uploaded' | 'approved' | 'rejected'
  file_size_bytes: number
  rejection_reason?: string
}

type Company = {
  id: string
  name: string
}

const documentTypeLabels: Record<string, string> = {
  bank_statement: 'Výpis z banky',
  expense_invoice: 'Výdajová faktura',
  income_invoice: 'Příjmová faktura',
  receipt: 'Účtenka',
  other: 'Ostatní'
}

const statusColors = {
  pending: { bg: 'bg-gray-100', text: 'text-gray-700', icon: Clock },
  uploaded: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock },
  approved: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
  rejected: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCompany, setSelectedCompany] = useState<string>('all')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const companiesRes = await fetch('/api/client/companies')
      if (companiesRes.ok) {
        const data = await companiesRes.json()
        setCompanies(data.companies)
      }

      const docsRes = await fetch('/api/documents')
      if (docsRes.ok) {
        const data = await docsRes.json()
        setDocuments(data.documents)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredDocuments = selectedCompany === 'all'
    ? documents
    : documents.filter(d => d.company_id === selectedCompany)

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const statusLabels = {
    pending: 'Čeká na zpracování',
    uploaded: 'Čeká na schválení',
    approved: 'Schváleno',
    rejected: 'Zamítnuto'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Načítám dokumenty...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Moje dokumenty</h1>
        <p className="mt-2 text-gray-600">Přehled všech nahraných dokumentů</p>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Label htmlFor="company-filter" className="whitespace-nowrap">Filtrovat podle firmy:</Label>
            <Select value={selectedCompany} onValueChange={setSelectedCompany}>
              <SelectTrigger id="company-filter" className="max-w-xs">
                <SelectValue placeholder="Všechny firmy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Všechny firmy</SelectItem>
                {companies.map(company => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-sm text-gray-500">
              Zobrazeno: {filteredDocuments.length} dokumentů
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Žádné dokumenty</h3>
            <p className="text-gray-600">
              {selectedCompany === 'all'
                ? 'Zatím jste nenahrali žádné dokumenty'
                : 'Pro tuto firmu nejsou nahrány žádné dokumenty'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredDocuments.map((doc) => {
            const company = companies.find(c => c.id === doc.company_id)
            const colors = statusColors[doc.status] || statusColors.pending
            const StatusIcon = colors.icon

            return (
              <Card key={doc.id}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Náhled obrázku místo ikony */}
                    {doc.thumbnail_url ? (
                      <div className="flex-shrink-0">
                        <img
                          src={doc.thumbnail_url}
                          alt={doc.file_name}
                          className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200"
                          onError={(e) => {
                            // Fallback pokud obrázek selže
                            (e.target as HTMLImageElement).style.display = 'none'
                          }}
                        />
                      </div>
                    ) : (
                      <div className={`p-3 rounded-lg ${colors.bg} flex-shrink-0`}>
                        <FileText className={`h-6 w-6 ${colors.text}`} />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {doc.file_name}
                        </h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${colors.bg} ${colors.text}`}>
                          <StatusIcon className="h-3 w-3" />
                          {statusLabels[doc.status]}
                        </span>
                      </div>

                      {/* Popis dokumentu */}
                      {doc.description && (
                        <p className="text-sm text-gray-700 mb-2 italic">{doc.description}</p>
                      )}

                      <div className="text-sm text-gray-600 space-y-1">
                        <div>
                          <span className="font-medium">Firma:</span> {company?.name || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">Typ:</span> {documentTypeLabels[doc.type] || doc.type} •
                          <span className="font-medium ml-2">Období:</span> {doc.period} •
                          <span className="font-medium ml-2">Velikost:</span> {formatFileSize(doc.file_size_bytes)}
                        </div>
                        <div suppressHydrationWarning>
                          <span className="font-medium">Nahráno:</span> {new Date(doc.uploaded_at).toLocaleString('cs-CZ')}
                        </div>
                        {doc.status === 'rejected' && doc.rejection_reason && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                            <span className="font-medium">Důvod zamítnutí:</span> {doc.rejection_reason}
                          </div>
                        )}
                      </div>
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
