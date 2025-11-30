'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FileText, CheckCircle, XCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

type Company = {
  id: string
  name: string
  ico: string
  dic: string
  vat_payer: boolean
  legal_form: string
}

type Document = {
  id: string
  type: string
  file_name: string
  uploaded_at: string
  status: 'uploaded' | 'approved' | 'rejected'
  uploaded_by: string
  file_size_bytes: number
}

type MonthlyClosure = {
  period: string
  status: string
  bank_statement_status: string
  expense_documents_status: string
  income_invoices_status: string
}

const statusColors = {
  pending: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
  uploaded: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
  approved: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  rejected: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
}

const documentTypeLabels: Record<string, string> = {
  bank_statement: 'Výpis z banky',
  expense_invoice: 'Výdajová faktura',
  income_invoice: 'Příjmová faktura',
  receipt: 'Účtenka',
  other: 'Ostatní'
}

export default function ClientDetailPage() {
  const params = useParams()
  const companyId = params.companyId as string

  const [company, setCompany] = useState<Company | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [closures, setClosures] = useState<MonthlyClosure[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [companyId])

  async function fetchData() {
    try {
      // Fetch company details
      const companyRes = await fetch(`/api/accountant/companies/${companyId}`)
      if (!companyRes.ok) throw new Error('Failed to fetch company')
      const companyData = await companyRes.json()
      setCompany(companyData.company)
      setClosures(companyData.closures || [])

      // Fetch documents
      const docsRes = await fetch(`/api/documents?companyId=${companyId}`)
      if (!docsRes.ok) throw new Error('Failed to fetch documents')
      const docsData = await docsRes.json()
      setDocuments(docsData.documents)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  async function handleApprove(documentId: string) {
    try {
      const res = await fetch(`/api/documents/${documentId}/approve`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error('Failed to approve')
      toast.success('Dokument schválen')
      fetchData() // Refresh
    } catch (err) {
      toast.error('Nepodařilo se schválit dokument')
    }
  }

  async function handleReject(documentId: string) {
    try {
      const reason = prompt('Důvod zamítnutí:')
      if (!reason) return

      const res = await fetch(`/api/documents/${documentId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      })
      if (!res.ok) throw new Error('Failed to reject')
      toast.success('Dokument zamítnut')
      fetchData() // Refresh
    } catch (err) {
      toast.error('Nepodařilo se zamítnout dokument')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Načítám detail klienta...</p>
        </div>
      </div>
    )
  }

  if (error || !company) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <p className="text-sm text-red-700">Nepodařilo se načíst detail klienta: {error}</p>
      </div>
    )
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/accountant/dashboard">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zpět na Master Matici
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
        <p className="mt-2 text-gray-600">
          IČO: {company.ico} • DIČ: {company.dic || 'N/A'} •
          {company.vat_payer ? ' Plátce DPH' : ' Neplátce DPH'} •
          {company.legal_form}
        </p>
      </div>

      {/* Monthly Overview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Přehled měsíčních uzávěrek</CardTitle>
          <CardDescription>Stav dokumentů pro všechny měsíce</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {closures.slice(0, 12).map((closure) => {
              const allApproved =
                closure.bank_statement_status === 'approved' &&
                closure.expense_documents_status === 'approved' &&
                closure.income_invoices_status === 'approved'

              const anyMissing =
                closure.bank_statement_status === 'missing' ||
                closure.expense_documents_status === 'missing' ||
                closure.income_invoices_status === 'missing'

              return (
                <div
                  key={closure.period}
                  className={`p-4 rounded-lg border-2 ${
                    allApproved ? 'border-green-300 bg-green-50' :
                    anyMissing ? 'border-red-300 bg-red-50' :
                    'border-yellow-300 bg-yellow-50'
                  }`}
                >
                  <div className="font-semibold text-sm">{closure.period}</div>
                  <div className="text-xs text-gray-600 mt-1">
                    {allApproved ? '✓ Vše schváleno' :
                     anyMissing ? '✗ Chybí dokumenty' :
                     '⏳ Čeká na schválení'}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle>Dokumenty ({documents.length})</CardTitle>
          <CardDescription>Všechny nahrané dokumenty pro tohoto klienta</CardDescription>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="mx-auto h-12 w-12 mb-2 text-gray-400" />
              <p>Zatím žádné nahrané dokumenty</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => {
                const colors = statusColors[doc.status] || statusColors.pending
                return (
                  <div
                    key={doc.id}
                    className={`p-4 rounded-lg border-2 ${colors.border} ${colors.bg}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-gray-600" />
                          <span className="font-medium">{doc.file_name}</span>
                          <span className={`text-xs px-2 py-1 rounded ${colors.bg} ${colors.text}`}>
                            {doc.status === 'uploaded' ? 'Čeká' :
                             doc.status === 'approved' ? 'Schváleno' : 'Zamítnuto'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {documentTypeLabels[doc.type] || doc.type} •
                          {formatFileSize(doc.file_size_bytes)} •
                          {new Date(doc.uploaded_at).toLocaleDateString('cs-CZ')}
                        </div>
                      </div>

                      {doc.status === 'uploaded' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleApprove(doc.id)}
                          >
                            <CheckCircle className="mr-1 h-4 w-4" />
                            Schválit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(doc.id)}
                          >
                            <XCircle className="mr-1 h-4 w-4" />
                            Zamítnout
                          </Button>
                        </div>
                      )}

                      {doc.status === 'approved' && (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="h-5 w-5" />
                          <span className="text-sm font-medium">Schváleno</span>
                        </div>
                      )}

                      {doc.status === 'rejected' && (
                        <div className="flex items-center gap-2 text-red-600">
                          <XCircle className="h-5 w-5" />
                          <span className="text-sm font-medium">Zamítnuto</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
