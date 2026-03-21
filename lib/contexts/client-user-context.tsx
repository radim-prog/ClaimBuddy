'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react'

type Company = {
  id: string
  name: string
  ico: string
  dic?: string
  legal_form: string
  vat_payer: boolean
  vat_period?: 'monthly' | 'quarterly' | null
  has_employees: boolean
  status: string
  address?: string
  managing_director?: string | null
  portal_sections?: Record<string, boolean>
  has_accountant?: boolean
  accountant_name?: string | null
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
  userId: string
  userName: string
  userInitials: string
  companies: Company[]
  closures: MonthClosure[]
  loading: boolean
  error: string | null
  refetch: () => void
  selectedCompanyId: string
  setSelectedCompanyId: (id: string) => void
  selectedCompany: Company | undefined
  userModules: string[]
}

const ClientUserContext = createContext<ClientUserContextType | undefined>(undefined)

const STORAGE_KEY = 'selected_company_id'

export function ClientUserProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState('')
  const [userName, setUserName] = useState('Klient')
  const [userInitials, setUserInitials] = useState('K')
  const [companies, setCompanies] = useState<Company[]>([])
  const [closures, setClosures] = useState<MonthClosure[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCompanyId, setSelectedCompanyIdState] = useState('')
  const [userModules, setUserModules] = useState<string[]>(['accounting'])

  const setSelectedCompanyId = useCallback((id: string) => {
    setSelectedCompanyIdState(id)
    try {
      localStorage.setItem(STORAGE_KEY, id)
    } catch {}
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [response, meResponse] = await Promise.all([
        fetch('/api/client/companies'),
        fetch('/api/auth/me'),
      ])
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/auth/login?reason=session_expired'
          return
        }
        throw new Error('Failed to fetch companies')
      }
      const data = await response.json()

      // Load user modules from /api/auth/me
      if (meResponse.ok) {
        const meData = await meResponse.json()
        setUserModules(meData.modules || ['accounting'])
      }

      const companiesList: Company[] = data.companies || []
      setCompanies(companiesList)
      setClosures(data.closures || [])
      if (data.user_id) setUserId(data.user_id)

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

      // Initialize selected company from localStorage or default to first
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved && companiesList.some(c => c.id === saved)) {
        setSelectedCompanyIdState(saved)
      } else if (companiesList.length > 0) {
        setSelectedCompanyIdState(companiesList[0].id)
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

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetch('/api/auth/me').then(res => {
          if (res.status === 401) {
            window.location.href = '/auth/login?reason=session_expired'
          }
        }).catch(() => {})
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  const selectedCompany = useMemo(
    () => companies.find(c => c.id === selectedCompanyId),
    [companies, selectedCompanyId]
  )

  const value = useMemo(() => ({
    userId,
    userName,
    userInitials,
    companies,
    closures,
    loading,
    error,
    refetch: fetchData,
    selectedCompanyId,
    setSelectedCompanyId,
    selectedCompany,
    userModules,
  }), [userId, userName, userInitials, companies, closures, loading, error, selectedCompanyId, setSelectedCompanyId, selectedCompany, userModules])

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
