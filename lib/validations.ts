import { z } from 'zod'

// ============================================
// REGISTRATION
// ============================================

export const registerSchema = z.object({
  name: z.string().min(1, 'Jméno je povinné').max(200),
  email: z.string().email('Neplatný formát emailu').max(320),
  password: z.string().min(8, 'Heslo musí mít alespoň 8 znaků').max(128),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Hesla se neshodují',
  path: ['confirmPassword'],
})

// ============================================
// BANK STATEMENT CONFIRM
// ============================================

export const bankStatementConfirmSchema = z.object({
  company_id: z.string().uuid('Neplatné company_id'),
  period: z.string().regex(/^\d{4}-\d{2}$/, 'Formát období: YYYY-MM'),
  categories: z.record(z.string().uuid(), z.string()).optional(),
})

// ============================================
// SIGNING CREATE
// ============================================

const signerSchema = z.object({
  name: z.string().min(1, 'Jméno podepisujícího je povinné').max(200),
  email: z.string().email('Neplatný email podepisujícího'),
  phone: z.string().max(20).optional(),
  role: z.enum(['sign', 'approve', 'witness']).optional(),
  order: z.number().int().min(0).optional(),
})

export const signingCreateSchema = z.object({
  companyId: z.string().uuid('Neplatné companyId'),
  documentName: z.string().min(1, 'Název dokumentu je povinný').max(500),
  documentType: z.string().max(50).optional(),
  signatureType: z.enum(['simple', 'advanced', 'qualified']).optional(),
  templateId: z.string().uuid().optional().nullable(),
  signers: z.array(signerSchema).min(1, 'Alespoň jeden podepisující'),
  fileBase64: z.string().optional(),
  fileName: z.string().max(500).optional(),
  note: z.string().max(2000).optional().nullable(),
})

// ============================================
// BILLING CONFIG PATCH
// ============================================

export const billingConfigPatchSchema = z.object({
  action: z.enum(['activate', 'pause', 'cancel', 'update']),
  monthly_fee_czk: z.number().min(0).optional(),
  notes: z.string().max(2000).optional(),
})

// ============================================
// MARKETPLACE REGISTER
// ============================================

export const marketplaceRegisterSchema = z.object({
  company_id: z.string().uuid().optional().nullable(),
  name: z.string().min(1, 'Název je povinný').max(300),
  ico: z.string().regex(/^\d{8}$/, 'IČO musí mít 8 číslic'),
  dic: z.string().max(15).optional().nullable(),
  legal_form: z.string().max(50).optional().nullable(),
  email: z.string().email('Neplatný email'),
  phone: z.string().max(20).optional().nullable(),
  website: z.string().url().max(500).optional().nullable().or(z.literal('')),
  street: z.string().max(200).optional().nullable(),
  city: z.string().min(1, 'Město je povinné').max(100),
  zip: z.string().max(10).optional().nullable(),
  region: z.string().max(100).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  specializations: z.array(z.string()).optional(),
  capacity_status: z.enum(['accepting', 'limited', 'full']).optional(),
  min_price: z.number().min(0).optional().nullable(),
  max_price: z.number().min(0).optional().nullable(),
  services: z.array(z.string()).optional(),
})

// ============================================
// INSURANCE CLAIMS — CASES
// ============================================

export const createCaseSchema = z.object({
  company_id: z.string().uuid().optional().nullable(),
  assigned_to: z.string().uuid().optional().nullable(),
  policy_number: z.string().max(100).optional().nullable(),
  claim_number: z.string().max(100).optional().nullable(),
  insurance_company_id: z.string().uuid().optional().nullable(),
  insurance_type: z.enum(['auto', 'property', 'life', 'liability', 'travel', 'industrial', 'other']),
  event_date: z.string().optional().nullable(),
  event_description: z.string().max(5000).optional().nullable(),
  event_location: z.string().max(500).optional().nullable(),
  claimed_amount: z.number().min(0).optional().nullable(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  deadline: z.string().optional().nullable(),
  note: z.string().max(5000).optional().nullable(),
  tags: z.array(z.string()).optional(),
})

export const updateCaseSchema = z.object({
  assigned_to: z.string().uuid().optional().nullable(),
  policy_number: z.string().max(100).optional().nullable(),
  claim_number: z.string().max(100).optional().nullable(),
  insurance_company_id: z.string().uuid().optional().nullable(),
  insurance_type: z.enum(['auto', 'property', 'life', 'liability', 'travel', 'industrial', 'other']).optional(),
  event_date: z.string().optional().nullable(),
  event_description: z.string().max(5000).optional().nullable(),
  event_location: z.string().max(500).optional().nullable(),
  claimed_amount: z.number().min(0).optional().nullable(),
  approved_amount: z.number().min(0).optional().nullable(),
  status: z.enum(['new', 'gathering_docs', 'submitted', 'under_review', 'additional_info', 'partially_approved', 'approved', 'rejected', 'appealed', 'closed', 'cancelled']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  deadline: z.string().optional().nullable(),
  note: z.string().max(5000).optional().nullable(),
  tags: z.array(z.string()).optional(),
})

// ============================================
// INSURANCE CLAIMS — DOCUMENTS
// ============================================

export const addCaseDocumentSchema = z.object({
  name: z.string().min(1, 'Název dokumentu je povinný').max(500),
  file_path: z.string().min(1, 'Cesta k souboru je povinná'),
  file_size: z.number().int().min(0).optional(),
  mime_type: z.string().max(100).optional(),
  document_type: z.enum(['claim_report', 'photo', 'expert_report', 'correspondence', 'decision', 'invoice', 'power_of_attorney', 'police_report', 'medical_report', 'other']),
  note: z.string().max(2000).optional().nullable(),
})

// ============================================
// INSURANCE CLAIMS — EVENTS
// ============================================

export const addCaseEventSchema = z.object({
  event_type: z.string().min(1).max(100),
  description: z.string().min(1, 'Popis je povinný').max(5000),
  metadata: z.record(z.unknown()).optional(),
})

// ============================================
// INSURANCE CLAIMS — PAYMENTS
// ============================================

export const addCasePaymentSchema = z.object({
  amount: z.number().min(0.01, 'Částka musí být kladná'),
  payment_type: z.enum(['partial', 'full', 'advance', 'refund']),
  payment_date: z.string().min(1, 'Datum platby je povinné'),
  reference: z.string().max(200).optional().nullable(),
  note: z.string().max(2000).optional().nullable(),
})

// ============================================
// HELPER
// ============================================

/** Format Zod errors into a single user-facing message */
export function formatZodErrors(error: z.ZodError): string {
  return error.issues.map(i => i.message).join(', ')
}
