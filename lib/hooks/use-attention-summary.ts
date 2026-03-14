'use client'

import { useState, useCallback, useMemo } from 'react'
import { useCachedFetch } from './use-cached-fetch'

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

type AttentionData = {
  companies: CompanyAttention[]
  totals: AttentionTotals
}

export function useAttentionSummary(pollInterval = 90_000) {
  const fetcher = useCallback(async (): Promise<AttentionData> => {
    const res = await fetch('/api/accountant/attention')
    if (!res.ok) throw new Error('fetch failed')
    return await res.json()
  }, [])

  const { data, loading, refresh } = useCachedFetch<AttentionData>(
    'attention-summary',
    fetcher,
    { pollInterval }
  )

  const companiesList = data?.companies ?? []
  const totals = data?.totals ?? EMPTY_TOTALS

  const byCompany = useMemo(() => {
    const map = new Map<string, AttentionCounts>()
    for (const company of companiesList) {
      map.set(company.company_id, {
        unread_messages: company.unread_messages,
        active_notifications: company.active_notifications,
        missing_documents: company.missing_documents,
        pending_uploads: company.pending_uploads,
        active_tasks: company.active_tasks,
        total: company.total,
      })
    }
    return map
  }, [companiesList])

  const getCompanyAttention = useCallback(
    (companyId: string): AttentionCounts => byCompany.get(companyId) || EMPTY_COUNTS,
    [byCompany]
  )

  return { byCompany, companiesList, totals, loading, getCompanyAttention, refresh }
}
