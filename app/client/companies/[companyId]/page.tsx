'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Building2,
  FileText,
  AlertCircle,
  ImageIcon,
  Download,
  MessageCircle,
  CalendarDays,
  ClipboardList
} from 'lucide-react'
import { TaskStatusSection } from '@/components/client/task-status-section'
import { MessagesSection } from '@/components/client/messages-section'
import { DeadlineCalendar } from '@/components/client/deadline-calendar'

interface Company {
  id: string
  name: string
  ico: string
  dic: string
  vat_payer: boolean
  legal_form: string
  street: string
  city: string
  zip: string
  bank_account: string
}

interface MonthlyClosure {
  id: string
  period: string
  status: string
  bank_statement_status: string
  expense_documents_status: string
  income_invoices_status: string
  vat_payable: number | null
  income_tax_accrued: number | null
}

interface Document {
  id: string
  company_id: string
  period: string
  type: string
  file_name: string
  thumbnail_url?: string
  description?: string
  file_url?: string
  uploaded_at: string
  status: string
  file_size_bytes: number
}

export default function CompanyDetailPage() {
  const params = useParams()
  const companyId = params.companyId as string
  const [company, setCompany] = useState<Company | null>(null)
  const [closures, setClosures] = useState<MonthlyClosure[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`/api/accountant/companies/${companyId}`).then(res => res.json()),
      fetch(`/api/documents?companyId=${companyId}`).then(res => res.json())
    ])
      .then(([companyData, docsData]) => {
        setCompany(companyData.company)
        setClosures(companyData.closures || [])
        setDocuments(docsData.documents || [])
        setLoading(false)
      })
      .catch(error => {
        console.error('Error loading company:', error)
        setLoading(false)
      })
  }, [companyId])

  if (loading) {
    return <div className="flex items-center justify-center h-96">Načítání...</div>
  }

  if (!company) {
    return <div className="flex items-center justify-center h-96">Firma nenalezena</div>
  }

  const statusColors = {
    missing: 'bg-red-100 text-red-800',
    uploaded: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            {company.name}
          </h1>
          <p className="text-muted-foreground mt-1">
            IČ: {company.ico} | DIČ: {company.dic}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant={company.vat_payer ? 'default' : 'secondary'}>
            {company.vat_payer ? 'Plátce DPH' : 'Neplátce DPH'}
          </Badge>
          <Badge variant="outline">{company.legal_form}</Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="overview" className="flex items-center gap-1">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Přehled</span>
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-1">
            <ClipboardList className="h-4 w-4" />
            <span className="hidden sm:inline">Stav</span>
          </TabsTrigger>
          <TabsTrigger value="deadlines" className="flex items-center gap-1">
            <CalendarDays className="h-4 w-4" />
            <span className="hidden sm:inline">Termíny</span>
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center gap-1">
            <MessageCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Zprávy</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Dokumenty</span>
          </TabsTrigger>
        </TabsList>

        {/* Přehled */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Kontaktní údaje</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Adresa</p>
                  <p className="font-medium">{company.street}, {company.city}, {company.zip}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Bankovní účet</p>
                  <p className="font-medium">{company.bank_account}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Aktuální stav dokladů</CardTitle>
              </CardHeader>
              <CardContent>
                {closures.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Poslední období: {closures[0].period}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className={`px-2 py-1 rounded text-xs ${statusColors[closures[0].bank_statement_status as keyof typeof statusColors]}`}>
                        Výpis z účtu
                      </div>
                      <div className={`px-2 py-1 rounded text-xs ${statusColors[closures[0].expense_documents_status as keyof typeof statusColors]}`}>
                        Nákladové doklady
                      </div>
                      <div className={`px-2 py-1 rounded text-xs ${statusColors[closures[0].income_invoices_status as keyof typeof statusColors]}`}>
                        Příjmové faktury
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Žádná data k zobrazení</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick summary of tasks and deadlines */}
          <div className="grid gap-6 md:grid-cols-2">
            <TaskStatusSection companyId={companyId} />
            <DeadlineCalendar companyId={companyId} companyName={company.name} />
          </div>
        </TabsContent>

        {/* Stav zpracování - úkoly */}
        <TabsContent value="tasks" className="space-y-4">
          <TaskStatusSection companyId={companyId} />

          {/* Měsíční uzávěrky */}
          <Card>
            <CardHeader>
              <CardTitle>Měsíční uzávěrky</CardTitle>
              <CardDescription>Stav zpracování účetních období</CardDescription>
            </CardHeader>
            <CardContent>
              {closures.length > 0 ? (
                <div className="space-y-4">
                  {closures.map((closure) => (
                    <div key={closure.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">Období: {closure.period}</h4>
                        {closure.vat_payable !== null && (
                          <Badge variant="outline">
                            DPH: {closure.vat_payable.toLocaleString()} Kč
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className={`px-3 py-2 rounded text-xs text-center ${statusColors[closure.bank_statement_status as keyof typeof statusColors]}`}>
                          <div className="font-medium">Výpis z účtu</div>
                          <div className="capitalize">{closure.bank_statement_status}</div>
                        </div>
                        <div className={`px-3 py-2 rounded text-xs text-center ${statusColors[closure.expense_documents_status as keyof typeof statusColors]}`}>
                          <div className="font-medium">Náklady</div>
                          <div className="capitalize">{closure.expense_documents_status}</div>
                        </div>
                        <div className={`px-3 py-2 rounded text-xs text-center ${statusColors[closure.income_invoices_status as keyof typeof statusColors]}`}>
                          <div className="font-medium">Příjmy</div>
                          <div className="capitalize">{closure.income_invoices_status}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Žádné měsíční uzávěrky</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Kalendář termínů */}
        <TabsContent value="deadlines" className="space-y-4">
          <DeadlineCalendar companyId={companyId} companyName={company.name} />
        </TabsContent>

        {/* Zprávy */}
        <TabsContent value="messages" className="space-y-4">
          <MessagesSection companyId={companyId} companyName={company.name} />
        </TabsContent>

        {/* Dokumenty - Galerie */}
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Galerie dokumentů ({documents.length})
              </CardTitle>
              <CardDescription>Všechny nahrané dokumenty a fotky pro tuto firmu</CardDescription>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <div className="py-8 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Zatím žádné nahrané dokumenty</p>
                  <Button className="mt-4" asChild>
                    <a href="/client/upload">Nahrát první dokument</a>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {documents.map((doc) => (
                    <div key={doc.id} className="group relative rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 transition-all hover:shadow-lg">
                      {/* Náhled */}
                      <div className="aspect-square bg-gray-100 dark:bg-gray-700 relative">
                        {doc.thumbnail_url ? (
                          <img
                            src={doc.thumbnail_url}
                            alt={doc.file_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FileText className="h-12 w-12 text-gray-400" />
                          </div>
                        )}
                        {/* Overlay s informacemi při hoveru */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700"
                            onClick={() => doc.file_url && window.open(doc.file_url, '_blank')}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Otevřít
                          </Button>
                        </div>
                      </div>

                      {/* Informace pod obrázkem */}
                      <div className="p-2 bg-white dark:bg-gray-800">
                        <p className="text-xs font-medium text-gray-900 dark:text-white truncate" title={doc.file_name}>
                          {doc.file_name}
                        </p>
                        {doc.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5" title={doc.description}>
                            {doc.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-gray-400">{doc.period}</span>
                          <Badge
                            variant={doc.status === 'approved' ? 'default' : doc.status === 'uploaded' ? 'secondary' : 'outline'}
                            className="text-xs py-0"
                          >
                            {doc.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
