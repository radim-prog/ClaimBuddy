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
  userModules: string[]
  firmId: string | null
  isSystemAdmin: boolean
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
  const [userModules, setUserModules] = useState<string[]>(['accounting'])
  const [firmId, setFirmId] = useState<string | null>(null)
  const [isSystemAdmin, setIsSystemAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me')
        if (!res.ok) {
          if (res.status === 401) {
            window.location.href = '/auth/login?reason=session_expired'
            return
          }
          return
        }
        const data = await res.json()

        setUserId(data.id)
        setUserName(data.name)
        setUserEmail(data.email || '')
        setUserRole(data.role)
        setPermissions(data.permissions)
        setUserModules(data.modules || ['accounting'])
        setFirmId(data.firm_id || null)
        setIsSystemAdmin(data.is_system_admin || false)

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

  const value = useMemo(() => ({
    userId,
    userName,
    userEmail,
    userInitials,
    userRole,
    permissions,
    userModules,
    firmId,
    isSystemAdmin,
    loading,
  }), [userId, userName, userEmail, userInitials, userRole, permissions, userModules, firmId, isSystemAdmin, loading])

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
