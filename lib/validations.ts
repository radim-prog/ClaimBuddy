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
  monthly_fee: z.number().min(0).optional(),
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
// HELPER
// ============================================

/** Format Zod errors into a single user-facing message */
export function formatZodErrors(error: z.ZodError): string {
  return error.issues.map(i => i.message).join(', ')
}
