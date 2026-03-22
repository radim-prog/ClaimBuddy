import { useMemo } from 'react'
import { getSubjectType, getSubjectTypeConfig, type SubjectType, type SubjectTypeConfig } from '@/lib/subject-type-config'

interface UseSubjectTypeInput {
  legalForm?: string | null
  expenseType?: string | null
}

interface UseSubjectTypeResult {
  subjectType: SubjectType
  config: SubjectTypeConfig
  isFlat: boolean
  isCorporate: boolean
  requiresExpenses: boolean
  requiresBankMatching: boolean
}

/**
 * Hook to get subject type configuration for a company.
 * Use in components that need to adapt behavior based on SRO/OSVČ/paušál.
 */
export function useSubjectType({ legalForm, expenseType }: UseSubjectTypeInput): UseSubjectTypeResult {
  return useMemo(() => {
    const subjectType = getSubjectType(legalForm || '', expenseType)
    const config = getSubjectTypeConfig(subjectType)

    return {
      subjectType,
      config,
      isFlat: subjectType === 'osvc_flat_rate',
      isCorporate: subjectType === 'sro',
      requiresExpenses: config.requiresExpenseTracking,
      requiresBankMatching: config.requiresBankMatching,
    }
  }, [legalForm, expenseType])
}
