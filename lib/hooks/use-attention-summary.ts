'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

export type AttentionCounts = {
  unread_messages: number
  active_notifications: number
  missing_documents: number
  pending_uploads: number
  active_tasks: number
  total: number
}

export type AttentionTotals = AttentionCounts & {
  companies_needing_attention: number
}

export type CompanyAttention = AttentionCounts & {
  company_id: string
  company_name: string
}

const EMPTY_COUNTS: AttentionCounts = {
  unread_messages: 0,
  active_notifications: 0,
  missing_documents: 0,
  pending_uploads: 0,
  active_tasks: 0,
  total: 0,
}

const EMPTY_TOTALS: AttentionTotals = {
  ...EMPTY_COUNTS,
  companies_needing_attention: 0,
}

export function useAttentionSummary(pollInterval = 60_000) {
  const [byCompany, setByCompany] = useState<Map<string, AttentionCounts>>(new Map())
  const [companiesList, setCompaniesList] = useState<CompanyAttention[]>([])
  const [totals, setTotals] = useState<AttentionTotals>(EMPTY_TOTALS)
  const [loading, setLoading] = useState(true)
  const mountedRef = useRef(true)

  const fetchAttention = useCallback(async () => {
    try {
      const res = await fetch('/api/accountant/attention')
      if (!res.ok) return
      const data = await res.json()
      if (!mountedRef.current) return

      const map = new Map<string, AttentionCounts>()
      for (const company of data.companies || []) {
        map.set(company.company_id, {
          unread_messages: company.unread_messages,
          active_notifications: company.active_notifications,
          missing_documents: company.missing_documents,
          pending_uploads: company.pending_uploads,
          active_tasks: company.active_tasks,
          total: company.total,
        })
      }

      setByCompany(map)
      setCompaniesList(data.companies || [])
      setTotals(data.totals || EMPTY_TOTALS)
    } catch {
      // Silently ignore - attention badges are non-critical
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    fetchAttention()
    const interval = setInterval(fetchAttention, pollInterval)
    return () => {
      mountedRef.current = false
      clearInterval(interval)
    }
  }, [fetchAttention, pollInterval])

  const getCompanyAttention = useCallback(
    (companyId: string): AttentionCounts => byCompany.get(companyId) || EMPTY_COUNTS,
    [byCompany]
  )

  return { byCompany, companiesList, totals, loading, getCompanyAttention, refresh: fetchAttention }
}
