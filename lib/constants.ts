export const CASE_STATUSES = {
  NEW: 'new',
  IN_PROGRESS: 'in_progress',
  WAITING_FOR_CLIENT: 'waiting_for_client',
  WAITING_FOR_INSURANCE: 'waiting_for_insurance',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
} as const;

export type CaseStatus = (typeof CASE_STATUSES)[keyof typeof CASE_STATUSES];

export const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  [CASE_STATUSES.NEW]: 'Nový',
  [CASE_STATUSES.IN_PROGRESS]: 'Zpracovává se',
  [CASE_STATUSES.WAITING_FOR_CLIENT]: 'Čeká na klienta',
  [CASE_STATUSES.WAITING_FOR_INSURANCE]: 'Čeká na pojišťovnu',
  [CASE_STATUSES.RESOLVED]: 'Vyřešeno',
  [CASE_STATUSES.CLOSED]: 'Uzavřeno',
};

export const CASE_STATUS_COLORS: Record<CaseStatus, 'default' | 'warning' | 'success' | 'info'> = {
  [CASE_STATUSES.NEW]: 'info',
  [CASE_STATUSES.IN_PROGRESS]: 'warning',
  [CASE_STATUSES.WAITING_FOR_CLIENT]: 'warning',
  [CASE_STATUSES.WAITING_FOR_INSURANCE]: 'warning',
  [CASE_STATUSES.RESOLVED]: 'success',
  [CASE_STATUSES.CLOSED]: 'default',
};

export const INSURANCE_TYPES = {
  POV: 'pov',
  PROPERTY: 'property',
  HEALTH: 'health',
  TRAVEL: 'travel',
  LIABILITY: 'liability',
  LIFE: 'life',
  OTHER: 'other',
} as const;

export type InsuranceType = (typeof INSURANCE_TYPES)[keyof typeof INSURANCE_TYPES];

export const INSURANCE_TYPE_LABELS: Record<InsuranceType, string> = {
  [INSURANCE_TYPES.POV]: 'Povinné ručení (POV)',
  [INSURANCE_TYPES.PROPERTY]: 'Pojištění majetku',
  [INSURANCE_TYPES.HEALTH]: 'Zdravotní pojištění',
  [INSURANCE_TYPES.TRAVEL]: 'Cestovní pojištění',
  [INSURANCE_TYPES.LIABILITY]: 'Pojištění odpovědnosti',
  [INSURANCE_TYPES.LIFE]: 'Životní pojištění',
  [INSURANCE_TYPES.OTHER]: 'Jiné',
};

export const FILE_TYPES_ALLOWED = {
  'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
};

export const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
export const MAX_FILES_PER_CASE = 20;

export const USER_ROLES = {
  CLIENT: 'client',
  ADMIN: 'admin',
  AGENT: 'agent',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const PAYMENT_TYPES = {
  FIXED: 'fixed',
  SUCCESS_FEE: 'success_fee',
} as const;

export type PaymentType = (typeof PAYMENT_TYPES)[keyof typeof PAYMENT_TYPES];

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

export const MESSAGE_TYPES = {
  CLIENT: 'client',
  ADMIN: 'admin',
  SYSTEM: 'system',
  AI: 'ai',
} as const;

export type MessageType = (typeof MESSAGE_TYPES)[keyof typeof MESSAGE_TYPES];

export const INSURANCE_COMPANIES = [
  'Allianz pojišťovna',
  'Kooperativa pojišťovna',
  'Česká pojišťovna',
  'ČSOB Pojišťovna',
  'Generali Česká pojišťovna',
  'UNIQA pojišťovna',
  'Direct pojišťovna',
  'Slavia pojišťovna',
  'Colonnade pojišťovna',
  'Jiná',
];

export const PRICING = {
  FIXED_FEE: 2500, // 2,500 Kč
  SUCCESS_FEE_PERCENTAGE: 15, // 15%
  MIN_CLAIM_AMOUNT: 5000, // 5,000 Kč minimální nárokovaná částka
};

export const AI_CONFIG = {
  MODEL: 'gemini-2.0-flash-exp',
  MAX_TOKENS: 2048,
  TEMPERATURE: 0.7,
};

export const SUPPORT_EMAIL = 'podpora@claimbuddy.cz';
export const SUPPORT_PHONE = '+420 123 456 789';

export const ITEMS_PER_PAGE = 10;
