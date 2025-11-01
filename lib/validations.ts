import { z } from 'zod';
import { INSURANCE_TYPES, MAX_FILE_SIZE, CASE_STATUSES } from './constants';

// Auth schemas
export const registerSchema = z.object({
  email: z.string().email('Neplatná emailová adresa'),
  password: z
    .string()
    .min(8, 'Heslo musí mít alespoň 8 znaků')
    .regex(/[A-Z]/, 'Heslo musí obsahovat alespoň jedno velké písmeno')
    .regex(/[a-z]/, 'Heslo musí obsahovat alespoň jedno malé písmeno')
    .regex(/[0-9]/, 'Heslo musí obsahovat alespoň jedno číslo'),
  confirmPassword: z.string(),
  name: z.string().min(2, 'Jméno musí mít alespoň 2 znaky'),
  phone: z
    .string()
    .regex(/^(\+420)?[0-9]{9}$/, 'Neplatné telefonní číslo (formát: +420123456789 nebo 123456789)'),
  gdprConsent: z.boolean().refine((val) => val === true, {
    message: 'Musíte souhlasit se zpracováním osobních údajů',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Hesla se neshodují',
  path: ['confirmPassword'],
});

export const loginSchema = z.object({
  email: z.string().email('Neplatná emailová adresa'),
  password: z.string().min(1, 'Heslo je povinné'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Neplatná emailová adresa'),
});

export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Heslo musí mít alespoň 8 znaků')
    .regex(/[A-Z]/, 'Heslo musí obsahovat alespoň jedno velké písmeno')
    .regex(/[a-z]/, 'Heslo musí obsahovat alespoň jedno malé písmeno')
    .regex(/[0-9]/, 'Heslo musí obsahovat alespoň jedno číslo'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Hesla se neshodují',
  path: ['confirmPassword'],
});

// Case schemas
export const caseBasicInfoSchema = z.object({
  insuranceType: z.enum([
    INSURANCE_TYPES.POV,
    INSURANCE_TYPES.PROPERTY,
    INSURANCE_TYPES.HEALTH,
    INSURANCE_TYPES.TRAVEL,
    INSURANCE_TYPES.LIABILITY,
    INSURANCE_TYPES.LIFE,
    INSURANCE_TYPES.OTHER,
  ], {
    errorMap: () => ({ message: 'Vyberte typ pojištění' }),
  }),
  insuranceCompany: z.string().min(2, 'Název pojišťovny je povinný'),
  policyNumber: z.string().optional(),
});

export const caseIncidentSchema = z.object({
  incidentDate: z.string().min(1, 'Datum události je povinné'),
  incidentLocation: z.string().min(3, 'Místo události je povinné'),
  incidentDescription: z.string().min(20, 'Popis musí mít alespoň 20 znaků'),
  claimAmount: z.number().min(1000, 'Minimální částka je 1 000 Kč'),
  policeReportNumber: z.string().optional(),
});

export const createCaseSchema = caseBasicInfoSchema.merge(caseIncidentSchema);

export const updateCaseSchema = z.object({
  status: z.enum([
    CASE_STATUSES.NEW,
    CASE_STATUSES.IN_PROGRESS,
    CASE_STATUSES.WAITING_FOR_CLIENT,
    CASE_STATUSES.WAITING_FOR_INSURANCE,
    CASE_STATUSES.RESOLVED,
    CASE_STATUSES.CLOSED,
  ]).optional(),
  assignedTo: z.string().optional(),
  internalNotes: z.string().optional(),
  resolution: z.string().optional(),
});

// Message schemas
export const messageSchema = z.object({
  caseId: z.string().min(1, 'ID případu je povinné'),
  content: z.string().min(1, 'Zpráva nesmí být prázdná').max(2000, 'Zpráva je příliš dlouhá'),
  attachments: z.array(z.string()).optional(),
});

// File upload schemas
export const fileUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= MAX_FILE_SIZE, {
      message: `Soubor je příliš velký. Maximální velikost je ${MAX_FILE_SIZE / 1024 / 1024} MB`,
    })
    .refine(
      (file) => {
        const allowedTypes = [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/gif',
          'image/webp',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ];
        return allowedTypes.includes(file.type);
      },
      {
        message: 'Nepodporovaný typ souboru',
      }
    ),
});

// Settings schemas
export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Jméno musí mít alespoň 2 znaky'),
  phone: z
    .string()
    .regex(/^(\+420)?[0-9]{9}$/, 'Neplatné telefonní číslo'),
  address: z.string().optional(),
  city: z.string().optional(),
  zipCode: z.string().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Současné heslo je povinné'),
  newPassword: z
    .string()
    .min(8, 'Nové heslo musí mít alespoň 8 znaků')
    .regex(/[A-Z]/, 'Heslo musí obsahovat alespoň jedno velké písmeno')
    .regex(/[a-z]/, 'Heslo musí obsahovat alespoň jedno malé písmeno')
    .regex(/[0-9]/, 'Heslo musí obsahovat alespoň jedno číslo'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Hesla se neshodují',
  path: ['confirmPassword'],
});

// AI chat schemas
export const aiChatSchema = z.object({
  message: z.string().min(1, 'Zpráva nesmí být prázdná').max(1000, 'Zpráva je příliš dlouhá'),
  caseId: z.string().optional(),
  conversationHistory: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    })
  ).optional(),
});

// OCR schemas
export const ocrSchema = z.object({
  imageUrl: z.string().url('Neplatná URL adresa obrázku'),
});

// Payment schemas
export const createCheckoutSchema = z.object({
  caseId: z.string().min(1, 'ID případu je povinné'),
  amount: z.number().min(100, 'Minimální částka je 100 Kč'),
  type: z.enum(['fixed', 'success_fee']),
});

// Admin schemas
export const assignCaseSchema = z.object({
  caseId: z.string().min(1, 'ID případu je povinné'),
  userId: z.string().min(1, 'ID uživatele je povinné'),
});

export const updateUserRoleSchema = z.object({
  userId: z.string().min(1, 'ID uživatele je povinné'),
  role: z.enum(['client', 'admin', 'agent']),
});
