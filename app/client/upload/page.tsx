'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { DocumentUpload } from '@/components/client/DocumentUpload'
import { useClientUser } from '@/lib/contexts/client-user-context'
import { toast } from 'sonner'
import {
  Landmark,
  Receipt,
  FileText,
  Camera,
  Upload,
} from 'lucide-react'

const monthNames = [
  'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
  'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'
]

type DocType = 'bank_statement' | 'expense_invoice' | 'income_invoice'

const docTypes: { value: DocType; label: string; icon: typeof Landmark }[] = [
  { value: 'bank_statement', label: 'Výpis z banky', icon: Landmark },
  { value: 'expense_invoice', label: 'Nákladové doklady', icon: Receipt },
  { value: 'income_invoice', label: 'Příjmové faktury', icon: FileText },
]

export default function UploadPageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64">Načítání...</div>}>
      <UploadPage />
    </Suspense>
  )
}

function UploadPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { companies, loading } = useClientUser()

  const [selectedCompany, setSelectedCompany] = useState<string>('')
  const [selectedPeriod, setSelectedPeriod] = useState<string>('')
  const [selectedType, setSelectedType] = useState<DocType | ''>('')

  // Pre-fill from query params or auto-select
  useEffect(() => {
    if (companies.length === 0) return

    const companyParam = searchParams.get('company')
    const periodParam = searchParams.get('period')

    // Auto-select company if only 1 or from param
    if (companyParam && companies.find(c => c.id === companyParam)) {
      setSelectedCompany(companyParam)
    } else if (companies.length === 1) {
      setSelectedCompany(companies[0].id)
    }

    // Auto-select period
    if (periodParam) {
      setSelectedPeriod(periodParam)
    } else {
      const now = new Date()
      setSelectedPeriod(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
    }
  }, [companies, searchParams])

  // Generate periods (last 12 months)
  const periods = []
  for (let i = 0; i < 12; i++) {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const month = monthNames[date.getMonth()]
    const year = date.getFullYear()
    periods.push({ value: period, label: `${month} ${year}` })
  }

  const handleUploadComplete = () => {
    toast.success('Doklady nahrány!')
    setTimeout(() => router.push('/client/dashboard'), 1500)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (companies.length === 0) {
    return (
      <div className="text-center py-12">
        <Upload className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
        <p className="text-gray-500 dark:text-gray-400">Nemáte žádné firmy. Kontaktujte svého účetního.</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nahrát doklady</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Nahrajte faktury, účtenky a výpisy z účtu
        </p>
      </div>

      {/* Company & Period selectors */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Company - only show if multiple */}
            {companies.length > 1 && (
              <div className="space-y-2">
                <Label>Firma</Label>
                <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                  <SelectTrigger>
                    <SelectValue placeholder="Vyberte firmu" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Period */}
            <div className="space-y-2">
              <Label>Období</Label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Vyberte období" />
                </SelectTrigger>
                <SelectContent>
                  {periods.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document type buttons */}
      {selectedCompany && selectedPeriod && (
        <div>
          <Label className="mb-3 block">Typ dokumentu</Label>
          <div className="grid grid-cols-3 gap-3">
            {docTypes.map(dt => {
              const Icon = dt.icon
              const isSelected = selectedType === dt.value
              return (
                <button
                  key={dt.value}
                  onClick={() => setSelectedType(dt.value)}
                  className={`
                    flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all text-center
                    ${isSelected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-400'
                    }
                  `}
                >
                  <Icon className={`h-6 w-6 ${isSelected ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                  <span className="text-xs font-medium">{dt.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Upload zone */}
      {selectedCompany && selectedPeriod && selectedType && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nahrát soubory</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DocumentUpload
              companyId={selectedCompany}
              period={selectedPeriod}
              documentType={selectedType}
              onUploadComplete={handleUploadComplete}
            />

            {/* Mobile camera button */}
            <div className="md:hidden">
              <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-lg cursor-pointer bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-950/40 transition-colors">
                <Camera className="h-5 w-5" />
                <span className="font-medium">Vyfotit doklad</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    // This triggers the native camera on mobile
                    // The file will be handled by the DocumentUpload dropzone
                    // For now, just show a toast
                    if (e.target.files?.[0]) {
                      toast.info('Pro nahrání fotografií použijte oblast výše (přetáhněte nebo klikněte)')
                    }
                  }}
                />
              </label>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
