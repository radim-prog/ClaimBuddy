'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { UserCheck, Loader2 } from 'lucide-react'
import { useClientUser } from '@/lib/contexts/client-user-context'

const CONTRACT_LABELS: Record<string, string> = {
  hpp: 'HPP',
  dpp: 'DPP',
  dpc: 'DPČ',
}

type Employee = {
  id: string
  first_name: string
  last_name: string
  position: string
  contract_type: string
  employment_start: string
  employment_end?: string | null
  active: boolean
}

export default function ClientEmployeesPage() {
  const { selectedCompanyId } = useClientUser()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!selectedCompanyId) return
    setLoading(true)
    fetch(`/api/client/employees?company_id=${selectedCompanyId}`)
      .then(r => r.json())
      .then(data => setEmployees(data.employees || []))
      .catch(() => setEmployees([]))
      .finally(() => setLoading(false))
  }, [selectedCompanyId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
      </div>
    )
  }

  const activeCount = employees.filter(e => e.active).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-gray-900 dark:text-white flex items-center gap-2">
          <UserCheck className="h-6 w-6 text-purple-600" />
          Zaměstnanci
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {activeCount} aktivních z {employees.length} celkem
        </p>
      </div>

      {employees.length === 0 ? (
        <Card className="rounded-xl">
          <CardContent className="py-12 text-center text-muted-foreground">
            Žádní zaměstnanci k zobrazení
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-xl">
          <CardContent className="pt-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="pb-2 pr-4">Jméno</th>
                    <th className="pb-2 pr-4">Pozice</th>
                    <th className="pb-2 pr-4">Smlouva</th>
                    <th className="pb-2 pr-4">Nástup</th>
                    <th className="pb-2">Stav</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map(emp => (
                    <tr key={emp.id} className={`border-b border-border/50 last:border-0 ${!emp.active ? 'opacity-50' : ''}`}>
                      <td className="py-2.5 pr-4 font-medium">
                        {emp.last_name} {emp.first_name}
                      </td>
                      <td className="py-2.5 pr-4 text-muted-foreground">{emp.position || '—'}</td>
                      <td className="py-2.5 pr-4">
                        <Badge variant="outline" className="text-xs">
                          {CONTRACT_LABELS[emp.contract_type] || emp.contract_type}
                        </Badge>
                      </td>
                      <td className="py-2.5 pr-4 text-muted-foreground">
                        {new Date(emp.employment_start).toLocaleDateString('cs')}
                      </td>
                      <td className="py-2.5">
                        {emp.active ? (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs">Aktivní</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-gray-500">
                            Ukončen {emp.employment_end ? new Date(emp.employment_end).toLocaleDateString('cs') : ''}
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
