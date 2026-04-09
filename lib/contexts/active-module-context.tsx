'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { IS_CLAIMS_ONLY_PRODUCT } from '@/lib/product-config'

type ActiveModule = 'accounting' | 'claims'

type ActiveModuleContextType = {
  activeModule: ActiveModule
  setActiveModule: (module: ActiveModule) => void
}

const ActiveModuleContext = createContext<ActiveModuleContextType | null>(null)

const STORAGE_KEY = 'active-module'

function deriveModuleFromPath(pathname: string): ActiveModule | null {
  if (pathname.startsWith('/accountant/claims')) return 'claims'
  if (pathname.startsWith('/client/claims')) return 'claims'
  if (pathname.startsWith('/accountant')) return 'accounting'
  return null
}

/** Detect claims hostname (claims.zajcon.cz) */
function isClaimsHostname(): boolean {
  if (typeof window === 'undefined') return false
  return window.location.hostname === 'claims.zajcon.cz'
}

export function ActiveModuleProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [fallbackModule, setFallbackModule] = useState<ActiveModule>(
    IS_CLAIMS_ONLY_PRODUCT ? 'claims' : 'accounting'
  )

  useEffect(() => {
    // claims.zajcon.cz → always force claims module
    if (IS_CLAIMS_ONLY_PRODUCT || isClaimsHostname()) {
      setFallbackModule('claims')
      return
    }
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'accounting' || stored === 'claims') {
      setFallbackModule(stored)
    }
  }, [])

  const activeModule = (IS_CLAIMS_ONLY_PRODUCT || isClaimsHostname())
    ? 'claims'
    : (deriveModuleFromPath(pathname) ?? fallbackModule)

  const setActiveModule = (module: ActiveModule) => {
    const nextModule = IS_CLAIMS_ONLY_PRODUCT ? 'claims' : module
    setFallbackModule(nextModule)
    localStorage.setItem(STORAGE_KEY, nextModule)
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
