/**
 * Maps tax questionnaire responses → tax_annual_config fields.
 * Called when questionnaire status changes to 'completed'.
 *
 * Mapping logic:
 * - deduction_children (ChildEntry[]) → children_count, children_names
 * - deduction_spouse → spouse_deduction (boolean flag)
 * - deduction_disability → disability_deduction
 * - deduction_ztp → ztp_deduction
 * - ded_donation → has_donation
 * - ded_mortgage → has_mortgage_interest
 * - ded_pension → has_pension_savings
 * - ded_life_insurance → has_life_insurance
 * - ded_union → has_union_fees
 * - advance_income_tax → has_income_tax_advances
 * - advance_flat_tax → has_flat_tax
 * - si_variable_symbol → social_insurance_vs
 * - si_secondary_activity → is_secondary_activity
 * - hi_company → health_insurance_code
 * - Income flags → income source booleans
 */

import { supabaseAdmin } from '@/lib/supabase-admin'
import type { QuestionnaireResponses, ChildEntry } from '@/lib/tax-questionnaire-def'

interface TaxConfigFromQuestionnaire {
  // Children
  children_count: number
  children_data: ChildEntry[]
  // Deductions (slevy)
  has_spouse_deduction: boolean
  spouse_name: string | null
  spouse_birth_number: string | null
  has_disability_deduction: boolean
  has_ztp_deduction: boolean
  // Deductible items (odčitatelné)
  has_donation: boolean
  has_mortgage_interest: boolean
  has_pension_savings: boolean
  has_life_insurance: boolean
  has_union_fees: boolean
  has_exam_fees: boolean
  has_research_deduction: boolean
  has_education_deduction: boolean
  // Advances
  has_income_tax_advances: boolean
  has_flat_tax: boolean
  // Insurance
  social_insurance_vs: string | null
  is_secondary_activity: boolean
  has_sickness_insurance: boolean
  health_insurance_code: string | null
  hi_secondary_activity: boolean
  // Income sources
  has_employment_income: boolean
  has_business_income: boolean
  has_capital_income: boolean
  has_rent_income: boolean
  has_property_sale_income: boolean
  has_securities_income: boolean
  has_trading_income: boolean
  // Additional
  has_business_change: boolean
  has_flat_mode: boolean
  has_activity_change: boolean
  // Metadata
  questionnaire_synced_at: string
}

function toBool(val: unknown): boolean {
  return val === true || val === 'yes' || val === 'true'
}

function toStr(val: unknown): string | null {
  if (typeof val === 'string' && val.trim()) return val.trim()
  return null
}

export function mapResponsesToTaxConfig(responses: QuestionnaireResponses): TaxConfigFromQuestionnaire {
  const children = Array.isArray(responses.deduction_children_list)
    ? responses.deduction_children_list as ChildEntry[]
    : []

  return {
    // Children
    children_count: toBool(responses.deduction_children) ? children.length : 0,
    children_data: toBool(responses.deduction_children) ? children : [],

    // Deductions (slevy na dani)
    has_spouse_deduction: toBool(responses.deduction_spouse),
    spouse_name: toBool(responses.deduction_spouse) ? toStr(responses.deduction_spouse_name) : null,
    spouse_birth_number: toBool(responses.deduction_spouse) ? toStr(responses.deduction_spouse_bn) : null,
    has_disability_deduction: toBool(responses.deduction_disability),
    has_ztp_deduction: toBool(responses.deduction_ztp),

    // Odčitatelné položky
    has_donation: toBool(responses.ded_donation),
    has_mortgage_interest: toBool(responses.ded_mortgage),
    has_pension_savings: toBool(responses.ded_pension),
    has_life_insurance: toBool(responses.ded_life_insurance),
    has_union_fees: toBool(responses.ded_union),
    has_exam_fees: toBool(responses.ded_exam),
    has_research_deduction: toBool(responses.ded_research),
    has_education_deduction: toBool(responses.ded_education),

    // Zálohy
    has_income_tax_advances: toBool(responses.advance_income_tax),
    has_flat_tax: toBool(responses.advance_flat_tax),

    // Pojištění
    social_insurance_vs: toStr(responses.si_variable_symbol),
    is_secondary_activity: toBool(responses.si_secondary_activity),
    has_sickness_insurance: toBool(responses.si_sickness_insurance),
    health_insurance_code: toStr(responses.hi_company),
    hi_secondary_activity: toBool(responses.hi_secondary_activity),

    // Zdroje příjmů
    has_employment_income: toBool(responses.income_employment),
    has_business_income: toBool(responses.income_business),
    has_capital_income: toBool(responses.income_capital),
    has_rent_income: toBool(responses.income_rent),
    has_property_sale_income: toBool(responses.income_property_sale),
    has_securities_income: toBool(responses.income_securities),
    has_trading_income: toBool(responses.income_trading),

    // Doplňující
    has_business_change: toBool(responses.add_business_change),
    has_flat_mode: toBool(responses.add_flat_mode),
    has_activity_change: toBool(responses.add_activity_change),

    // Metadata
    questionnaire_synced_at: new Date().toISOString(),
  }
}

/**
 * Sync questionnaire responses to tax_annual_config.
 * Called when questionnaire is completed (status = 'completed').
 * Upserts into tax_annual_config on (company_id, year).
 */
export async function syncQuestionnaireToTaxConfig(
  companyId: string,
  year: number,
  responses: QuestionnaireResponses,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const config = mapResponsesToTaxConfig(responses)

    const { error } = await supabaseAdmin
      .from('tax_annual_config')
      .upsert({
        company_id: companyId,
        year,
        ...config,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'company_id,year' })

    if (error) {
      console.error('[Questionnaire→Tax] Sync error:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error('[Questionnaire→Tax] Unexpected error:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
