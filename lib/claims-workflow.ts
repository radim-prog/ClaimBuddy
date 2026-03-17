import { supabaseAdmin } from '@/lib/supabase-admin'
import { addCaseEvent } from '@/lib/insurance-store'

// Claims workflow statuses — superset of InsuranceCaseStatus
export type ClaimsWorkflowStatus =
  | 'draft'
  | 'submitted'
  | 'awaiting_payment'
  | 'paid'
  | 'in_analysis'
  | 'in_consultation'
  | 'awaiting_poa'
  | 'poa_signed'
  | 'representing'
  | 'awaiting_response'
  | 'resolved'
  | 'closed'

export const WORKFLOW_STATUS_LABELS: Record<ClaimsWorkflowStatus, string> = {
  draft: 'Rozpracováno',
  submitted: 'Odesláno',
  awaiting_payment: 'Čeká na platbu',
  paid: 'Zaplaceno',
  in_analysis: 'V analýze',
  in_consultation: 'Konzultace',
  awaiting_poa: 'Čeká na plnou moc',
  poa_signed: 'Plná moc podepsána',
  representing: 'Zastupování',
  awaiting_response: 'Čeká na pojišťovnu',
  resolved: 'Vyřešeno',
  closed: 'Uzavřeno',
}

// Allowed transitions: current_status → [allowed_next_statuses]
const TRANSITIONS: Record<ClaimsWorkflowStatus, ClaimsWorkflowStatus[]> = {
  draft: ['submitted'],
  submitted: ['awaiting_payment', 'in_analysis', 'closed'],
  awaiting_payment: ['paid', 'closed'],
  paid: ['in_analysis', 'in_consultation', 'awaiting_poa'],
  in_analysis: ['in_consultation', 'awaiting_poa', 'representing', 'awaiting_response', 'resolved', 'closed'],
  in_consultation: ['in_analysis', 'awaiting_poa', 'representing', 'awaiting_response', 'resolved', 'closed'],
  awaiting_poa: ['poa_signed', 'closed'],
  poa_signed: ['representing', 'awaiting_response'],
  representing: ['awaiting_response', 'resolved', 'closed'],
  awaiting_response: ['representing', 'in_analysis', 'resolved', 'closed'],
  resolved: ['closed'],
  closed: [],
}

/**
 * Check if a status transition is allowed.
 */
export function canTransition(current: string, next: string): boolean {
  const allowed = TRANSITIONS[current as ClaimsWorkflowStatus]
  if (!allowed) return false
  return allowed.includes(next as ClaimsWorkflowStatus)
}

/**
 * Transition a case to a new workflow status.
 * Validates the transition, updates the DB, and logs a timeline event.
 */
export async function transitionCase(
  caseId: string,
  nextStatus: ClaimsWorkflowStatus,
  userId: string
): Promise<void> {
  // Get current status
  const { data: caseData, error: fetchErr } = await supabaseAdmin
    .from('insurance_cases')
    .select('status')
    .eq('id', caseId)
    .single()

  if (fetchErr || !caseData) {
    throw new Error(`Case ${caseId} not found`)
  }

  const currentStatus = caseData.status as string

  if (!canTransition(currentStatus, nextStatus)) {
    throw new Error(
      `Invalid transition: ${currentStatus} → ${nextStatus}. Allowed: ${(TRANSITIONS[currentStatus as ClaimsWorkflowStatus] || []).join(', ') || 'none'}`
    )
  }

  // Update status
  const { error: updateErr } = await supabaseAdmin
    .from('insurance_cases')
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq('id', caseId)

  if (updateErr) {
    throw new Error(`Failed to update case status: ${updateErr.message}`)
  }

  // Log timeline event
  const fromLabel = WORKFLOW_STATUS_LABELS[currentStatus as ClaimsWorkflowStatus] || currentStatus
  const toLabel = WORKFLOW_STATUS_LABELS[nextStatus] || nextStatus

  await addCaseEvent({
    case_id: caseId,
    event_type: 'status_change',
    actor: userId,
    description: `Stav změněn: ${fromLabel} → ${toLabel}`,
    metadata: { from: currentStatus, to: nextStatus },
  })
}
