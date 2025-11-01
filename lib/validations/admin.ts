import { z } from 'zod';
import { CASE_STATUSES, USER_ROLES } from '../constants';

// Case status update schema
export const updateCaseStatusSchema = z.object({
  status: z.enum([
    CASE_STATUSES.NEW,
    CASE_STATUSES.IN_PROGRESS,
    CASE_STATUSES.WAITING_FOR_CLIENT,
    CASE_STATUSES.WAITING_FOR_INSURANCE,
    CASE_STATUSES.RESOLVED,
    CASE_STATUSES.CLOSED,
  ]),
  reason: z.string().optional(),
  internalNote: z.string().optional(),
});

// Internal note schema
export const addInternalNoteSchema = z.object({
  content: z.string().min(1, 'Obsah poznámky je povinný').max(5000, 'Poznámka je příliš dlouhá'),
});

// Create user schema
export const createUserSchema = z.object({
  name: z.string().min(1, 'Jméno je povinné'),
  email: z.string().email('Neplatný email'),
  role: z.enum([USER_ROLES.ADMIN, USER_ROLES.AGENT, USER_ROLES.CLIENT]),
  phone: z.string().optional(),
  password: z.string().min(6, 'Heslo musí mít alespoň 6 znaků').optional(),
});

// Update user schema
export const updateUserSchema = z.object({
  name: z.string().min(1, 'Jméno je povinné').optional(),
  role: z.enum([USER_ROLES.ADMIN, USER_ROLES.AGENT, USER_ROLES.CLIENT]).optional(),
  phone: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

// Export data schema
export const exportDataSchema = z.object({
  type: z.enum(['cases', 'users', 'analytics']),
  filters: z.object({
    status: z.string().optional(),
    agentId: z.string().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
  }).optional(),
});

// Analytics query schema
export const analyticsQuerySchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  agentId: z.string().optional(),
});

// Cases list query schema
export const casesListQuerySchema = z.object({
  status: z.string().optional(),
  agentId: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(25),
  sortBy: z.enum(['createdAt', 'updatedAt', 'claimAmount', 'caseNumber']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Users list query schema
export const usersListQuerySchema = z.object({
  role: z.string().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(25),
});

// Activity log query schema
export const activityLogQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  page: z.coerce.number().min(1).default(1),
  targetType: z.string().optional(),
  userId: z.string().optional(),
});

export type UpdateCaseStatusInput = z.infer<typeof updateCaseStatusSchema>;
export type AddInternalNoteInput = z.infer<typeof addInternalNoteSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ExportDataInput = z.infer<typeof exportDataSchema>;
export type AnalyticsQueryInput = z.infer<typeof analyticsQuerySchema>;
export type CasesListQueryInput = z.infer<typeof casesListQuerySchema>;
export type UsersListQueryInput = z.infer<typeof usersListQuerySchema>;
export type ActivityLogQueryInput = z.infer<typeof activityLogQuerySchema>;
