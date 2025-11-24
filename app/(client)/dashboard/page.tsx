'use client'

import Link from 'next/link'
import { mockCompanies, mockMonthlyClosures } from '@/lib/mock-data'
import { Building2, FileText, Upload, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Pro demo používáme mock data - v reálné aplikaci by se získávaly podle přihlášeného uživatele
const userId = 'user-1-client'
const userCompanies = mockCompanies.filter(c => c.owner_id === userId)

const months = [
  'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
  'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'
]

function getCompanyMissingDocuments(companyId: string) {
  const closures = mockMonthlyClosures.filter(c => c.company_id === companyId)
  return closures.filter(c => {
    return (
      c.bank_statement_status === 'missing' ||
      c.expense_invoices_status === 'missing' ||
      c.receipts_status === 'missing' ||
      c.income_invoices_status === 'missing'
    )
  })
}

export default function ClientDashboard() {
  const totalCompanies = userCompanies.length

  // Spočítat celkový počet chybějících dokumentů
  const missingDocumentsCount = userCompanies.reduce((total, company) => {
    return total + getCompanyMissingDocuments(company.id).length
  }, 0)

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Vítejte zpět!</h1>
        <p className="mt-2 text-gray-600">
          Přehled vašich firem a aktuálních úkolů
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Moje firmy</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCompanies}</div>
            <p className="text-xs text-muted-foreground">
              Aktivních subjektů
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chybějící dokumenty</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{missingDocumentsCount}</div>
            <p className="text-xs text-muted-foreground">
              Nutné nahrát
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktuální měsíc</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{months[new Date().getMonth()]}</div>
            <p className="text-xs text-muted-foreground">
              {new Date().getFullYear()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Urgent Actions */}
      {missingDocumentsCount > 0 && (
        <Card className="mb-8 border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center text-red-900">
              <AlertCircle className="mr-2 h-5 w-5" />
              Vyžaduje pozornost
            </CardTitle>
            <CardDescription className="text-red-700">
              Některé dokumenty stále chybí. Prosím nahrajte je co nejdříve.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="bg-red-600 hover:bg-red-700">
              <Link href="/client/upload">
                <Upload className="mr-2 h-4 w-4" />
                Nahrát dokumenty
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Companies List */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Moje firmy</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userCompanies.map((company) => {
            const missingDocs = getCompanyMissingDocuments(company.id)
            const hasMissing = missingDocs.length > 0

            return (
              <Card key={company.id} className={hasMissing ? 'border-red-200' : ''}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{company.name}</span>
                    {hasMissing && (
                      <span className="flex items-center justify-center w-6 h-6 bg-red-100 rounded-full">
                        <span className="text-red-600 text-xs font-bold">{missingDocs.length}</span>
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>
                    IČO: {company.ico}
                    {company.vat_payer && ' • Plátce DPH'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">
                      <strong>Právní forma:</strong> {company.legal_form}
                    </div>
                    {hasMissing && (
                      <div className="text-sm text-red-600 flex items-start">
                        <AlertCircle className="mr-1 h-4 w-4 flex-shrink-0 mt-0.5" />
                        <span>Chybí {missingDocs.length} měsíčních uzávěrek</span>
                      </div>
                    )}
                    <Button
                      asChild
                      variant={hasMissing ? "default" : "outline"}
                      className={`w-full mt-4 ${hasMissing ? 'bg-red-600 hover:bg-red-700' : ''}`}
                    >
                      <Link href={`/client/companies/${company.id}`}>
                        Zobrazit detail
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Rychlé akce</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button asChild variant="outline" size="lg" className="h-auto py-6">
            <Link href="/client/upload" className="flex flex-col items-center">
              <Upload className="h-8 w-8 mb-2" />
              <span className="text-lg font-semibold">Nahrát dokumenty</span>
              <span className="text-sm text-gray-500">Faktury, účtenky, výpisy</span>
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-auto py-6">
            <Link href="/client/documents" className="flex flex-col items-center">
              <FileText className="h-8 w-8 mb-2" />
              <span className="text-lg font-semibold">Zobrazit dokumenty</span>
              <span className="text-sm text-gray-500">Všechny nahrané soubory</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
