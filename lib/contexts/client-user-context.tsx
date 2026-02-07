'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react'

type Company = {
  id: string
  name: string
  ico: string
  dic?: string
  legal_form: string
  vat_payer: boolean
  has_employees: boolean
  status: string
  address?: string
}

type ClosureStatus = 'missing' | 'uploaded' | 'approved'

type MonthClosure = {
  company_id: string
  period: string
  bank_statement_status: ClosureStatus
  expense_documents_status: ClosureStatus
  income_invoices_status: ClosureStatus
}

type ClientUserContextType = {
  userName: string
  userInitials: string
  companies: Company[]
  closures: MonthClosure[]
  loading: boolean
  error: string | null
  refetch: () => void
}

const ClientUserContext = createContext<ClientUserContextType | undefined>(undefined)

export function ClientUserProvider({ children }: { children: ReactNode }) {
  const [userName, setUserName] = useState('Klient')
  const [userInitials, setUserInitials] = useState('K')
  const [companies, setCompanies] = useState<Company[]>([])
  const [closures, setClosures] = useState<MonthClosure[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/client/companies?demo=true')
      if (!response.ok) throw new Error('Failed to fetch companies')
      const data = await response.json()

      setCompanies(data.companies || [])
      setClosures(data.closures || [])

      // Demo user name
      if (data.user_name) {
        setUserName(data.user_name)
        const initials = data.user_name
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()
        setUserInitials(initials)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const value = useMemo(() => ({
    userName,
    userInitials,
    companies,
    closures,
    loading,
    error,
    refetch: fetchData,
  }), [userName, userInitials, companies, closures, loading, error])

  return (
    <ClientUserContext.Provider value={value}>
      {children}
    </ClientUserContext.Provider>
  )
}

export function useClientUser() {
  const context = useContext(ClientUserContext)
  if (context === undefined) {
    throw new Error('useClientUser must be used within a ClientUserProvider')
  }
  return context
}
