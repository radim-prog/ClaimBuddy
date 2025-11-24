'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { DocumentUpload } from '@/components/client/DocumentUpload'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

type Company = {
  id: string
  name: string
  ico: string
}

export default function UploadPage() {
  const router = useRouter()
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedCompany, setSelectedCompany] = useState<string>('')
  const [selectedPeriod, setSelectedPeriod] = useState<string>('')
  const [selectedType, setSelectedType] = useState<'bank_statement' | 'receipt' | 'expense_invoice' | 'income_invoice'>('receipt')

  useEffect(() => {
    async function fetchCompanies() {
      try {
        const response = await fetch('/api/client/companies')
        if (!response.ok) throw new Error('Failed to fetch companies')
        const data = await response.json()
        setCompanies(data.companies)

        // Auto-select first company
        if (data.companies.length > 0) {
          setSelectedCompany(data.companies[0].id)
        }

        // Auto-select current period
        const currentPeriod = new Date().toISOString().slice(0, 7) // YYYY-MM
        setSelectedPeriod(currentPeriod)
      } catch (error) {
        console.error('Error fetching companies:', error)
        toast.error('Nepodařilo se načíst firmy')
      } finally {
        setLoading(false)
      }
    }

    fetchCompanies()
  }, [])

  // Generate periods (last 12 months)
  const periods = []
  for (let i = 0; i < 12; i++) {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    const period = date.toISOString().slice(0, 7)
    const monthNames = ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen', 'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec']
    const month = monthNames[date.getMonth()]
    const year = date.getFullYear()
    periods.push({ value: period, label: `${month} ${year}` })
  }

  const documentTypes = [
    { value: 'bank_statement', label: 'Výpis z banky' },
    { value: 'expense_invoice', label: 'Výdajová faktura' },
    { value: 'income_invoice', label: 'Příjmová faktura' },
    { value: 'receipt', label: 'Účtenka' },
  ]

  const handleUploadComplete = () => {
    toast.success('Všechny soubory byly úspěšně nahrány!')
    setTimeout(() => {
      router.push('/client/dashboard')
    }, 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Načítám...</p>
        </div>
      </div>
    )
  }

  if (companies.length === 0) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              Nemáte žádné firmy. Prosím kontaktujte svého účetního.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Nahrát dokumenty</h1>
        <p className="mt-2 text-gray-600">
          Nahrajte faktury, účtenky a výpisy z účtu pro měsíční uzávěrku
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Vyberte detaily</CardTitle>
          <CardDescription>
            Zvolte firmu, období a typ dokumentu
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company">Firma</Label>
              <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                <SelectTrigger id="company">
                  <SelectValue placeholder="Vyberte firmu" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map(company => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="period">Období</Label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger id="period">
                  <SelectValue placeholder="Vyberte období" />
                </SelectTrigger>
                <SelectContent>
                  {periods.map(period => (
                    <SelectItem key={period.value} value={period.value}>
                      {period.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Typ dokumentu</Label>
              <Select value={selectedType} onValueChange={(v: any) => setSelectedType(v)}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Vyberte typ" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedCompany && selectedPeriod && selectedType && (
        <Card>
          <CardHeader>
            <CardTitle>Upload souborů</CardTitle>
            <CardDescription>
              Přetáhněte soubory nebo klikněte pro výběr
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DocumentUpload
              companyId={selectedCompany}
              period={selectedPeriod}
              documentType={selectedType}
              onUploadComplete={handleUploadComplete}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
