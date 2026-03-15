/**
 * Shared extraction types and labels — safe to import from client components
 */

export type ExtractionStep =
  | 'queued'
  | 'downloading'
  | 'ocr'
  | 'ai_extraction'
  | 'ai_verification'
  | 'saving'
  | 'completed'
  | 'error'

export const STEP_LABELS: Record<ExtractionStep, string> = {
  queued: 'Ve frontě',
  downloading: 'Stahování souboru',
  ocr: 'OCR zpracování',
  ai_extraction: 'AI extrakce dat',
  ai_verification: 'AI kontrolní ověření',
  saving: 'Ukládání výsledků',
  completed: 'Hotovo',
  error: 'Chyba',
}

export const STEP_ESTIMATES: Record<ExtractionStep, string> = {
  queued: '',
  downloading: '~2-5s',
  ocr: '~10-15s',
  ai_extraction: '~5-10s',
  ai_verification: '~3-5s',
  saving: '~1-2s',
  completed: '',
  error: '',
}

export type ExtractionPriority = 'high' | 'normal' | 'low'

export type ExtractionJobStatus =
  | 'queued'
  | 'processing'
  | 'completed'
  | 'error'
  | 'timeout'

export interface StepRecord {
  step: ExtractionStep
  startedAt: number
  completedAt?: number
}
