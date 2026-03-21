'use client'
import { createContext, useContext, useState, useEffect } from 'react'

type ExtractionMode = { advanced: boolean; toggle: () => void }
const ExtractionModeContext = createContext<ExtractionMode>({ advanced: false, toggle: () => {} })

export function ExtractionModeProvider({ children }: { children: React.ReactNode }) {
  const [advanced, setAdvanced] = useState(false)
  useEffect(() => {
    setAdvanced(localStorage.getItem('extraction-advanced-mode') === 'true')
  }, [])
  const toggle = () => {
    const next = !advanced
    setAdvanced(next)
    localStorage.setItem('extraction-advanced-mode', String(next))
  }
  return (
    <ExtractionModeContext.Provider value={{ advanced, toggle }}>
      {children}
    </ExtractionModeContext.Provider>
  )
}
export const useExtractionMode = () => useContext(ExtractionModeContext)
