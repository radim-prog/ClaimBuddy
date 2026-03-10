// Client Health Score types

export type HealthGrade = 'A' | 'B' | 'C' | 'D'

export type HealthScoreBreakdown = {
  documents: number    // 0-100, weight 30%
  payments: number     // 0-100, weight 25%
  communication: number // 0-100, weight 20%
  cooperation: number  // 0-100, weight 15%
  stability: number    // 0-100, weight 10%
}

export type CompanyHealthScore = {
  company_id: string
  score: number | null  // null = insufficient data
  grade: HealthGrade | null
  breakdown: HealthScoreBreakdown | null
  updated_at: string | null
  months_of_data: number
}

export const HEALTH_SCORE_WEIGHTS = {
  documents: 0.30,
  payments: 0.25,
  communication: 0.20,
  cooperation: 0.15,
  stability: 0.10,
} as const

export const MIN_MONTHS_FOR_SCORE = 3

export function getHealthGrade(score: number): HealthGrade {
  if (score >= 80) return 'A'
  if (score >= 60) return 'B'
  if (score >= 40) return 'C'
  return 'D'
}

export function getHealthGradeLabel(grade: HealthGrade): string {
  const labels: Record<HealthGrade, string> = {
    A: 'Vzorový klient',
    B: 'Normální',
    C: 'Potřebuje pozornost',
    D: 'Riziko odchodu',
  }
  return labels[grade]
}

export function getHealthGradeColor(grade: HealthGrade): { bg: string; text: string; border: string } {
  const colors: Record<HealthGrade, { bg: string; text: string; border: string }> = {
    A: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', border: 'border-green-200 dark:border-green-800' },
    B: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' },
    C: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', border: 'border-yellow-200 dark:border-yellow-800' },
    D: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-800' },
  }
  return colors[grade]
}

export const DIMENSION_LABELS: Record<keyof HealthScoreBreakdown, string> = {
  documents: 'Doklady',
  payments: 'Platby',
  communication: 'Komunikace',
  cooperation: 'Spolupráce',
  stability: 'Stabilita',
}
