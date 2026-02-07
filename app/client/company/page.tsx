'use client'

import { Building2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useClientUser } from '@/lib/contexts/client-user-context'

export default function CompanyPage() {
  const { companies, loading } = useClientUser()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Moje firma</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">Informace o vašich firmách</p>
      </div>

      {companies.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <Building2 className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">Žádné firmy</p>
              <p className="mt-1 text-sm">Kontaktujte svého účetního.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {companies.map((company) => (
            <Card key={company.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  {company.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400">IČO</dt>
                    <dd className="font-medium text-gray-900 dark:text-white">{company.ico}</dd>
                  </div>
                  {company.dic && (
                    <div>
                      <dt className="text-gray-500 dark:text-gray-400">DIČ</dt>
                      <dd className="font-medium text-gray-900 dark:text-white">{company.dic}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400">Právní forma</dt>
                    <dd className="font-medium text-gray-900 dark:text-white">{company.legal_form}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400">Plátce DPH</dt>
                    <dd className="font-medium text-gray-900 dark:text-white">{company.vat_payer ? 'Ano' : 'Ne'}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400">Zaměstnanci</dt>
                    <dd className="font-medium text-gray-900 dark:text-white">{company.has_employees ? 'Ano' : 'Ne'}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400">Status</dt>
                    <dd className="font-medium text-gray-900 dark:text-white">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        company.status === 'active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        {company.status === 'active' ? 'Aktivní' : 'Neaktivní'}
                      </span>
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
