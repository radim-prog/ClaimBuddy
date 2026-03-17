'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

type ActiveModule = 'accounting' | 'claims'

type ActiveModuleContextType = {
  activeModule: ActiveModule
  setActiveModule: (module: ActiveModule) => void
}

const ActiveModuleContext = createContext<ActiveModuleContextType | null>(null)

const STORAGE_KEY = 'active-module'

export function ActiveModuleProvider({ children }: { children: ReactNode }) {
  const [activeModule, setActiveModuleState] = useState<ActiveModule>('accounting')

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'accounting' || stored === 'claims') {
      setActiveModuleState(stored)
    }
  }, [])

  const setActiveModule = (module: ActiveModule) => {
    setActiveModuleState(module)
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
