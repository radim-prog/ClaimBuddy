'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Building2, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import Link from 'next/link'

type Company = {
  id: string
  name: string
  ico: string
  dic: string
  legal_form: string
  vat_payer: boolean
  currentMonthStatus: {
    period: string
    missing_count: number
    missing_types: string[]
    all_uploaded: boolean
  }
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/client/companies')
      .then(res => res.json())
      .then(data => {
        setCompanies(data.companies || [])
        setLoading(false)
      })
      .catch(error => {
        console.error('Error loading companies:', error)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Načítám firmy...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Moje firmy</h1>
        <p className="mt-2 text-gray-600">Přehled všech vašich firem a jejich stavu</p>
      </div>

      {companies.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Žádné firmy</h3>
            <p className="text-gray-600">Zatím nemáte přiřazené žádné firmy</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <Card key={company.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-lg">{company.name}</CardTitle>
                  </div>
                  {company.currentMonthStatus.all_uploaded ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Základní info */}
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">IČ:</span>
                    <span className="font-medium">{company.ico}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">DIČ:</span>
                    <span className="font-medium">{company.dic}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Právní forma:</span>
                    <Badge variant="outline">{company.legal_form}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">DPH:</span>
                    <Badge variant={company.vat_payer ? 'default' : 'secondary'}>
                      {company.vat_payer ? 'Plátce' : 'Neplátce'}
                    </Badge>
                  </div>
                </div>

                {/* Aktuální měsíc */}
                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">
                      {company.currentMonthStatus.period}
                    </span>
                  </div>

                  {company.currentMonthStatus.all_uploaded ? (
                    <div className="text-sm text-green-700 bg-green-50 p-2 rounded">
                      ✓ Všechny dokumenty nahrány
                    </div>
                  ) : (
                    <div className="text-sm space-y-1">
                      <div className="text-orange-700 font-medium">
                        Chybí {company.currentMonthStatus.missing_count} {company.currentMonthStatus.missing_count === 1 ? 'dokument' : 'dokumenty'}:
                      </div>
                      <ul className="text-gray-600 text-xs space-y-0.5 ml-4">
                        {company.currentMonthStatus.missing_types.map((type, idx) => (
                          <li key={idx}>• {type}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Tlačítka */}
                <div className="pt-2 flex gap-2">
                  <Link href={`/client/companies/${company.id}`} className="flex-1">
                    <Button variant="outline" className="w-full text-sm">
                      Detail
                    </Button>
                  </Link>
                  <Link href="/client/upload" className="flex-1">
                    <Button className="w-full text-sm bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold">
                      Nahrát
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
