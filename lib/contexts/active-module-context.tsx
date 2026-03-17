'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'

type ActiveModule = 'accounting' | 'claims'

type ActiveModuleContextType = {
  activeModule: ActiveModule
  setActiveModule: (module: ActiveModule) => void
}

const ActiveModuleContext = createContext<ActiveModuleContextType | null>(null)

const STORAGE_KEY = 'active-module'

function deriveModuleFromPath(pathname: string): ActiveModule | null {
  if (pathname.startsWith('/accountant/claims')) return 'claims'
  if (pathname.startsWith('/accountant')) return 'accounting'
  return null
}

export function ActiveModuleProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [fallbackModule, setFallbackModule] = useState<ActiveModule>('accounting')

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'accounting' || stored === 'claims') {
      setFallbackModule(stored)
    }
  }, [])

  const activeModule = deriveModuleFromPath(pathname) ?? fallbackModule

  const setActiveModule = (module: ActiveModule) => {
    setFallbackModule(module)
    localStorage.setItem(STORAGE_KEY, module)
  }

  return (
    <ActiveModuleContext.Provider value={{ activeModule, setActiveModule }}>
      {children}
    </ActiveModuleContext.Provider>
  )
}

export function useActiveModule() {
  const ctx = useContext(ActiveModuleContext)
  if (!ctx) throw new Error('useActiveModule must be used within ActiveModuleProvider')
  return ctx
}
