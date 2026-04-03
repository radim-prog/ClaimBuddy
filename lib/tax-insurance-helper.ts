import type { TaxAnnualConfigRow } from '@/lib/types/tax'

export function getInsuranceResult(
  config: Partial<TaxAnnualConfigRow> | null,
  autoCalc: { socialDue: number; healthDue: number } | null
): { socialDue: number; healthDue: number; isManual: { social: boolean; health: boolean } } {
  const socialManual = config?.social_manual_calculated != null
  const healthManual = config?.health_manual_calculated != null

  return {
    socialDue: socialManual
      ? (config!.social_manual_calculated! - (config!.social_advances_paid || 0))
      : (autoCalc?.socialDue ?? 0),
    healthDue: healthManual
      ? (config!.health_manual_calculated! - (config!.health_advances_paid || 0))
      : (autoCalc?.healthDue ?? 0),
    isManual: { social: socialManual, health: healthManual },
  }
}
