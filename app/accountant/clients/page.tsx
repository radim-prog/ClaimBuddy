'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Building2, Search, AlertCircle, CheckCircle, Mail, Phone } from 'lucide-react'
import Link from 'next/link'

type Company = {
  id: string
  name: string
  ico: string
  dic: string
  legal_form: string
  vat_payer: boolean
  owner_id: string
}

type MonthlyClosure = {
  id: string
  company_id: string
  period: string
  bank_statement_status: string
  expense_documents_status: string
  income_invoices_status: string
}

export default function ClientsPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [closures, setClosures] = useState<MonthlyClosure[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetch('/api/accountant/matrix')
      .then(res => res.json())
      .then(data => {
        setCompanies(data.companies || [])
        setClosures(data.closures || [])
        setLoading(false)
      })
      .catch(error => {
        console.error('Error loading clients:', error)
        setLoading(false)
      })
  }, [])

  const getCurrentMonthStatus = (companyId: string) => {
    const currentPeriod = '2025-11'
    const closure = closures.find(c => c.company_id === companyId && c.period === currentPeriod)

    if (!closure) return { status: 'unknown', missingCount: 0 }

    const missing = [
      closure.bank_statement_status === 'missing',
      closure.expense_documents_status === 'missing',
      closure.income_invoices_status === 'missing',
    ].filter(Boolean).length

    const allApproved = [
      closure.bank_statement_status,
      closure.expense_documents_status,
      closure.income_invoices_status,
    ].every(s => s === 'approved')

    return {
      status: allApproved ? 'complete' : missing > 0 ? 'missing' : 'uploaded',
      missingCount: missing,
    }
  }

  const filteredCompanies = companies
    .filter(company =>
      company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.ico.includes(searchQuery) ||
      company.dic.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      // Get status for both companies
      const statusA = getCurrentMonthStatus(a.id).status
      const statusB = getCurrentMonthStatus(b.id).status

      // Separate into categories: 'missing' (red) vs others (green/yellow)
      const isRedA = statusA === 'missing'
      const isRedB = statusB === 'missing'

      // Red clients first
      if (isRedA && !isRedB) return -1
      if (!isRedA && isRedB) return 1

      // Within same category, sort alphabetically by name
      return a.name.localeCompare(b.name, 'cs')
    })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Načítám klienty...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Klienti</h1>
        <p className="mt-2 text-gray-600">Přehled všech vašich klientů ({companies.length})</p>
      </div>

      {/* Search bar */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-gray-400" />
            <Input
              placeholder="Hledat podle názvu, IČ nebo DIČ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Clients list */}
      <div className="space-y-4">
        {filteredCompanies.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Žádní klienti</h3>
              <p className="text-gray-600">
                {searchQuery
                  ? 'Nenalezeny žádné výsledky pro tento dotaz'
                  : 'Zatím nemáte žádné přiřazené klienty'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredCompanies.map((company) => {
            const monthStatus = getCurrentMonthStatus(company.id)
            const statusIcon =
              monthStatus.status === 'complete' ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : monthStatus.status === 'missing' ? (
                <AlertCircle className="h-5 w-5 text-red-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              )

            const statusText =
              monthStatus.status === 'complete'
                ? 'Vše OK'
                : monthStatus.status === 'missing'
                ? `Chybí ${monthStatus.missingCount} dokumenty`
                : 'Čeká na schválení'

            return (
              <Card key={company.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Building2 className="h-6 w-6 text-purple-600" />
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">
                            {company.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            IČ: {company.ico} | DIČ: {company.dic}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mb-4">
                        <Badge variant="outline">{company.legal_form}</Badge>
                        <Badge className={company.vat_payer ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-500 text-white'}>
                          {company.vat_payer ? 'Plátce DPH' : 'Neplátce DPH'}
                        </Badge>
                        <div className="flex items-center gap-2 text-sm">
                          {statusIcon}
                          <span
                            className={
                              monthStatus.status === 'complete'
                                ? 'text-green-700 font-medium'
                                : monthStatus.status === 'missing'
                                ? 'text-red-700 font-medium'
                                : 'text-yellow-700 font-medium'
                            }
                          >
                            {statusText}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          <span>kontakt@{company.name.toLowerCase().replace(/\s+/g, '')}.cz</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          <span>+420 777 {Math.floor(Math.random() * 900 + 100)} {Math.floor(Math.random() * 900 + 100)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Link href={`/accountant/clients/${company.id}`}>
                        <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                          Detail
                        </Button>
                      </Link>
                      {monthStatus.status === 'missing' && (
                        <Button size="sm" variant="outline" className="w-full text-orange-600 border-orange-300 hover:bg-orange-50">
                          Urgovat
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
