'use client'

import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react'
import type { UserRole } from '@/lib/auth'
import type { UserPermissions } from '@/lib/permissions'

type AccountantUserContextType = {
  userId: string
  userName: string
  userEmail: string
  userInitials: string
  userRole: UserRole
  permissions: UserPermissions | null
  loading: boolean
}

const AccountantUserContext = createContext<AccountantUserContextType | undefined>(undefined)

export function AccountantUserProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState('')
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [userInitials, setUserInitials] = useState('')
  const [userRole, setUserRole] = useState<UserRole>('accountant')
  const [permissions, setPermissions] = useState<UserPermissions | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me')
        if (!res.ok) return
        const data = await res.json()

        setUserId(data.id)
        setUserName(data.name)
        setUserEmail(data.email || '')
        setUserRole(data.role)
        setPermissions(data.permissions)

        const initials = data.name
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()
        setUserInitials(initials)
      } catch (err) {
        console.error('Failed to fetch accountant user:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  const value = useMemo(() => ({
    userId,
    userName,
    userEmail,
    userInitials,
    userRole,
    permissions,
    loading,
  }), [userId, userName, userEmail, userInitials, userRole, permissions, loading])

  return (
    <AccountantUserContext.Provider value={value}>
      {children}
    </AccountantUserContext.Provider>
  )
}

export function useAccountantUser() {
  const context = useContext(AccountantUserContext)
  if (context === undefined) {
    throw new Error('useAccountantUser must be used within an AccountantUserProvider')
  }
  return context
}
