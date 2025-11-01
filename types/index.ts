import {
  CaseStatus,
  InsuranceType,
  UserRole,
  PaymentType,
  PaymentStatus,
  MessageType,
} from '@/lib/constants';

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  address?: string;
  city?: string;
  zipCode?: string;
  createdAt: Date;
  updatedAt: Date;
  emailVerified?: boolean;
  photoURL?: string;
}

export interface Case {
  id: string;
  userId: string;
  caseNumber: string;
  status: CaseStatus;
  insuranceType: InsuranceType;
  insuranceCompany: string;
  policyNumber?: string;
  incidentDate: string;
  incidentLocation: string;
  incidentDescription: string;
  claimAmount: number;
  policeReportNumber?: string;
  assignedTo?: string;
  assignedToName?: string;
  assignedAt?: Date;
  assignedBy?: string;
  internalNotes?: string;
  resolution?: string;
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
  documents: Document[];
  paymentId?: string;
  paymentStatus?: PaymentStatus;
}

export interface Document {
  id: string;
  caseId: string;
  name: string;
  type: string;
  size: number;
  url: string;
  storagePath: string;
  uploadedBy: string;
  uploadedAt: Date;
  metadata?: {
    extractedData?: OCRData;
  };
}

export interface OCRData {
  invoiceNumber?: string;
  date?: string;
  amount?: number;
  vendor?: string;
  items?: Array<{
    description: string;
    quantity?: number;
    price?: number;
  }>;
  confidence?: number;
}

export interface Message {
  id: string;
  caseId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  type: MessageType;
  content: string;
  attachments?: string[];
  read: boolean;
  createdAt: Date;
}

export interface Payment {
  id: string;
  caseId: string;
  userId: string;
  amount: number;
  type: PaymentType;
  status: PaymentStatus;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIConversation {
  id: string;
  userId: string;
  caseId?: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardStats {
  totalCases: number;
  activeCases: number;
  resolvedCases: number;
  pendingPayments: number;
  totalRevenue: number;
  avgResolutionTime: number;
  casesThisMonth: number;
  revenueThisMonth: number;
}

export interface CaseTimeline {
  id: string;
  caseId: string;
  type: 'status_change' | 'message' | 'document_upload' | 'payment' | 'assignment' | 'note';
  title: string;
  description: string;
  userId?: string;
  userName?: string;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'case_update' | 'new_message' | 'payment_required' | 'case_resolved' | 'general';
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: Date;
}

export interface UserSettings {
  userId: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  marketingEmails: boolean;
  hasSeenWelcomeWizard?: boolean;
  updatedAt: Date;
}
