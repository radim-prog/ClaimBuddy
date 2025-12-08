'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FileText, CheckCircle, XCircle, Clock, ChevronDown, ChevronRight, AlertCircle, Calendar, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  id: string
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
  missing: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-300' },
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
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchData()
  }, [companyId])

  async function fetchData() {
    try {
      const companyRes = await fetch(`/api/accountant/companies/${companyId}`)
      if (!companyRes.ok) throw new Error('Failed to fetch company')
      const companyData = await companyRes.json()
      setCompany(companyData.company)
      setClosures(companyData.closures || [])

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
      fetchData()
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
      fetchData()
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

  const toggleMonth = (period: string) => {
    const newExpanded = new Set(expandedMonths)
    if (newExpanded.has(period)) {
      newExpanded.delete(period)
    } else {
      newExpanded.add(period)
    }
    setExpandedMonths(newExpanded)
  }

  const getMonthName = (period: string) => {
    const [year, month] = period.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1)
    return date.toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' })
  }

  const getDeadline = (period: string) => {
    const [year, month] = period.split('-').map(Number)
    const deadline = new Date(year, month, 15)
    return deadline
  }

  const getDaysUntilDeadline = (period: string) => {
    const deadline = getDeadline(period)
    const now = new Date()
    const diff = deadline.getTime() - now.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const getCategoryStatus = (closure: MonthlyClosure, category: 'bank' | 'expense' | 'income') => {
    if (category === 'bank') return closure.bank_statement_status
    if (category === 'expense') return closure.expense_documents_status
    return closure.income_invoices_status
  }

  const getCategoryLabel = (category: 'bank' | 'expense' | 'income') => {
    if (category === 'bank') return 'Výpis z účtu'
    if (category === 'expense') return 'Náklady'
    return 'Příjmy'
  }

  const getCategoryIcon = (status: string) => {
    if (status === 'approved') return <CheckCircle className="h-5 w-5 text-green-600" />
    if (status === 'uploaded') return <Clock className="h-5 w-5 text-yellow-600" />
    if (status === 'missing') return <XCircle className="h-5 w-5 text-red-600" />
    return <AlertCircle className="h-5 w-5 text-gray-400" />
  }

  // Quick stats
  const totalMonths = closures.length
  const completedMonths = closures.filter(c =>
    c.bank_statement_status === 'approved' &&
    c.expense_documents_status === 'approved' &&
    c.income_invoices_status === 'approved'
  ).length
  const pendingMonths = closures.filter(c => {
    const hasUploaded = [c.bank_statement_status, c.expense_documents_status, c.income_invoices_status].includes('uploaded')
    const allApproved = [c.bank_statement_status, c.expense_documents_status, c.income_invoices_status].every(s => s === 'approved')
    return hasUploaded && !allApproved
  }).length

  const upcomingDeadlines = closures
    .filter(c => {
      const days = getDaysUntilDeadline(c.period)
      const hasMissing = [c.bank_statement_status, c.expense_documents_status, c.income_invoices_status].includes('missing')
      return days <= 7 && hasMissing
    })
    .sort((a, b) => getDaysUntilDeadline(a.period) - getDaysUntilDeadline(b.period))

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

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Uzavřeno</p>
                <p className="text-2xl font-bold text-green-600">{completedMonths}/{totalMonths}</p>
              </div>
              <CheckCircle className="h-10 w-10 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Čeká na schválení</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingMonths}</p>
              </div>
              <Clock className="h-10 w-10 text-yellow-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Urgentní</p>
                <p className="text-2xl font-bold text-red-600">{upcomingDeadlines.length}</p>
              </div>
              <AlertCircle className="h-10 w-10 text-red-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Dokumenty</p>
                <p className="text-2xl font-bold text-blue-600">{documents.length}</p>
              </div>
              <FileText className="h-10 w-10 text-blue-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Closures Accordion */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Měsíční uzávěrky 2025</CardTitle>
          <CardDescription>Klikněte na měsíc pro zobrazení detailu</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {closures.map((closure) => {
            const isExpanded = expandedMonths.has(closure.period)
            const allApproved =
              closure.bank_statement_status === 'approved' &&
              closure.expense_documents_status === 'approved' &&
              closure.income_invoices_status === 'approved'

            const anyMissing =
              closure.bank_statement_status === 'missing' ||
              closure.expense_documents_status === 'missing' ||
              closure.income_invoices_status === 'missing'

            const daysUntil = getDaysUntilDeadline(closure.period)
            const deadline = getDeadline(closure.period)

            const borderColor = allApproved ? 'border-green-300' :
              anyMissing && daysUntil < 0 ? 'border-red-500' :
              anyMissing && daysUntil <= 7 ? 'border-orange-400' :
              anyMissing ? 'border-yellow-300' :
              'border-blue-300'

            const bgColor = allApproved ? 'bg-green-50' :
              anyMissing && daysUntil < 0 ? 'bg-red-50' :
              anyMissing && daysUntil <= 7 ? 'bg-orange-50' :
              anyMissing ? 'bg-yellow-50' :
              'bg-blue-50'

            return (
              <div key={closure.period} className={`border-2 ${borderColor} ${bgColor} rounded-lg overflow-hidden`}>
                {/* Month Header - Clickable */}
                <div
                  className="p-4 cursor-pointer hover:bg-opacity-75 transition-colors"
                  onClick={() => toggleMonth(closure.period)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-gray-600" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-600" />
                      )}
                      <Calendar className="h-5 w-5 text-gray-600" />
                      <h3 className="font-semibold text-lg">{getMonthName(closure.period)}</h3>

                      {allApproved && (
                        <Badge className="bg-green-600 text-white">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Uzavřeno
                        </Badge>
                      )}
                      {anyMissing && daysUntil < 0 && (
                        <Badge className="bg-red-600 text-white animate-pulse">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          PO TERMÍNU!
                        </Badge>
                      )}
                      {anyMissing && daysUntil >= 0 && daysUntil <= 7 && (
                        <Badge className="bg-orange-500 text-white">
                          <Clock className="h-3 w-3 mr-1" />
                          Zbývá {daysUntil} dní
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Category Status Pills */}
                      {(['bank', 'expense', 'income'] as const).map((cat) => {
                        const status = getCategoryStatus(closure, cat)
                        const icon = getCategoryIcon(status)
                        return (
                          <div key={cat} className="flex items-center gap-1">
                            {icon}
                          </div>
                        )
                      })}

                      <div className="text-sm text-gray-600 ml-2">
                        Termín: {deadline.toLocaleDateString('cs-CZ')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t-2 border-gray-200 bg-white">
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Bank Statement */}
                      {(['bank', 'expense', 'income'] as const).map((cat) => {
                        const status = getCategoryStatus(closure, cat)
                        const label = getCategoryLabel(cat)
                        const icon = getCategoryIcon(status)
                        const colors = statusColors[status as keyof typeof statusColors] || statusColors.pending

                        return (
                          <div key={cat} className={`p-4 rounded-lg border-2 ${colors.border} ${colors.bg}`}>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                {icon}
                                <span className="font-semibold text-sm">{label}</span>
                              </div>
                              <Badge className={`${colors.bg} ${colors.text} text-xs`}>
                                {status === 'approved' ? 'Schváleno' :
                                  status === 'uploaded' ? 'Čeká' :
                                  status === 'missing' ? 'Chybí' : 'Neznámý'}
                              </Badge>
                            </div>

                            {status === 'missing' && (
                              <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                                <Upload className="h-4 w-4 mr-1" />
                                Nahrát
                              </Button>
                            )}

                            {status === 'uploaded' && (
                              <div className="space-y-2">
                                <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 text-white">
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Schválit
                                </Button>
                                <Button size="sm" variant="outline" className="w-full">
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Zamítnout
                                </Button>
                              </div>
                            )}

                            {status === 'approved' && (
                              <div className="text-center text-sm text-green-700">
                                ✓ Dokument schválen
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* Documents for this month */}
                    <div className="mt-4">
                      <h4 className="font-semibold text-sm mb-2 text-gray-700">Dokumenty pro tento měsíc:</h4>
                      <div className="text-sm text-gray-500">
                        <em>Zatím nejsou k dispozici - implementace přiřazení dokumentů k měsícům probíhá...</em>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Global Documents */}
      <Card>
        <CardHeader>
          <CardTitle>Globální dokumenty</CardTitle>
          <CardDescription>Dokumenty nepřiřazené ke konkrétnímu měsíci (smlouvy, různé)</CardDescription>
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
