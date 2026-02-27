'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { useAttentionSummary, type AttentionCounts, type AttentionTotals, type CompanyAttention } from '@/lib/hooks/use-attention-summary'

type AttentionContextType = {
  byCompany: Map<string, AttentionCounts>
  companiesList: CompanyAttention[]
  totals: AttentionTotals
  loading: boolean
  getCompanyAttention: (companyId: string) => AttentionCounts
  refresh: () => void
}

const AttentionContext = createContext<AttentionContextType | undefined>(undefined)

export function AttentionProvider({ children }: { children: ReactNode }) {
  const attention = useAttentionSummary(60_000)
  return (
    <AttentionContext.Provider value={attention}>
      {children}
    </AttentionContext.Provider>
  )
}

export function useAttention() {
  const context = useContext(AttentionContext)
  if (context === undefined) {
    throw new Error('useAttention must be used within AttentionProvider')
  }
  return context
}
