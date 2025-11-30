'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Building2, FileText, TrendingUp, AlertCircle, ImageIcon, Download } from 'lucide-react'

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
        <TabsList>
          <TabsTrigger value="overview">Přehled</TabsTrigger>
          <TabsTrigger value="closures">Měsíční uzávěrky</TabsTrigger>
          <TabsTrigger value="documents">Dokumenty</TabsTrigger>
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
                <CardTitle>Aktuální stav</CardTitle>
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
        </TabsContent>

        {/* Měsíční uzávěrky */}
        <TabsContent value="closures" className="space-y-4">
          {closures.length > 0 ? (
            closures.map((closure) => (
              <Card key={closure.id}>
                <CardHeader>
                  <CardTitle className="text-lg">Období: {closure.period}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Statusy dokladů:</p>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-sm">Výpis z účtu:</span>
                          <Badge className={statusColors[closure.bank_statement_status as keyof typeof statusColors]}>
                            {closure.bank_statement_status}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Výdajové faktury:</span>
                          <Badge className={statusColors[closure.expense_invoices_status as keyof typeof statusColors]}>
                            {closure.expense_invoices_status}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Účtenky:</span>
                          <Badge className={statusColors[closure.receipts_status as keyof typeof statusColors]}>
                            {closure.receipts_status}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Příjmové faktury:</span>
                          <Badge className={statusColors[closure.income_invoices_status as keyof typeof statusColors]}>
                            {closure.income_invoices_status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    {closure.vat_payable !== null && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Finanční údaje:</p>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-sm">DPH k úhradě:</span>
                            <span className="font-medium">{closure.vat_payable.toLocaleString()} Kč</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Daň z příjmu:</span>
                            <span className="font-medium">{closure.income_tax_accrued?.toLocaleString()} Kč</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Žádné měsíční uzávěrky</p>
              </CardContent>
            </Card>
          )}
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
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {documents.map((doc) => (
                    <div key={doc.id} className="group relative rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-all hover:shadow-lg">
                      {/* Náhled */}
                      <div className="aspect-square bg-gray-100 relative">
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
                            className="bg-white hover:bg-gray-100"
                            onClick={() => doc.file_url && window.open(doc.file_url, '_blank')}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Otevřít
                          </Button>
                        </div>
                      </div>

                      {/* Informace pod obrázkem */}
                      <div className="p-2 bg-white">
                        <p className="text-xs font-medium text-gray-900 truncate" title={doc.file_name}>
                          {doc.file_name}
                        </p>
                        {doc.description && (
                          <p className="text-xs text-gray-500 truncate mt-0.5" title={doc.description}>
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
