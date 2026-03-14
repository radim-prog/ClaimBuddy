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
