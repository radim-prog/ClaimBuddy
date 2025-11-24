'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Building2, FileText, Upload, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const months = [
  'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
  'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'
]

type Company = {
  id: string
  name: string
  ico: string
  legal_form: string
  vat_payer: boolean
  currentMonthStatus: {
    period: string
    missing_count: number
    missing_types: string[]
    all_uploaded: boolean
  }
}

type ApiResponse = {
  companies: Company[]
  stats: {
    total_companies: number
    companies_with_missing_docs: number
    total_missing_docs: number
  }
  current_period: string
}

export default function ClientDashboard() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/client/companies')
        if (!response.ok) {
          throw new Error('Failed to fetch companies')
        }
        const json = await response.json()
        setData(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Načítám vaše firmy...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">
              Nepodařilo se načíst data: {error || 'Neznámá chyba'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  const { companies, stats } = data
  const totalCompanies = stats.total_companies
  const missingDocumentsCount = stats.total_missing_docs

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
          {companies.map((company) => {
            const hasMissing = company.currentMonthStatus.missing_count > 0

            return (
              <Card key={company.id} className={hasMissing ? 'border-red-200' : ''}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{company.name}</span>
                    {hasMissing && (
                      <span className="flex items-center justify-center w-6 h-6 bg-red-100 rounded-full">
                        <span className="text-red-600 text-xs font-bold">{company.currentMonthStatus.missing_count}</span>
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
                        <div>
                          <div>Chybí {company.currentMonthStatus.missing_count} dokumentů:</div>
                          <ul className="mt-1 list-disc list-inside text-xs">
                            {company.currentMonthStatus.missing_types.map((type, i) => (
                              <li key={i}>{type}</li>
                            ))}
                          </ul>
                        </div>
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
