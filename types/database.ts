import { Timestamp } from "firebase/firestore";

// User roles
export type UserRole = "client" | "accountant" | "admin";

// User
export interface User {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Timestamp;
  lastLoginAt?: Timestamp;
  phoneNumber?: string;
  avatarUrl?: string;
  notificationPreferences: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
}

// Company
export interface Company {
  id: string;
  name: string;
  ico: string;
  dic?: string;
  vatPayer: boolean;
  vatPeriod: "monthly" | "quarterly" | null;
  legalForm: "sro" | "fyzicka_osoba" | "as" | "vos";
  address: {
    street: string;
    city: string;
    zip: string;
  };
  email: string;
  phone: string;
  pohodaId?: string;
  googleDriveFolderId?: string;
  ownerId: string; // userId
  assignedAccountantId: string; // userId
  createdAt: Timestamp;
  updatedAt: Timestamp;
  billingSettings: {
    monthlyFee: number;
    invoiceDueDay: number;
    invoiceMaturity: number;
  };
}

// Document status
export type DocumentStatus = "missing" | "uploaded" | "approved" | "rejected";

// Monthly Closure
export interface MonthlyClosure {
  id: string;
  companyId: string;
  period: string; // "2025-10"
  documents: {
    bankStatement: {
      required: boolean;
      status: DocumentStatus;
      uploadedAt?: Timestamp;
      fileUrl?: string;
      googleDriveFileId?: string;
    };
    expenseInvoices: {
      required: boolean;
      status: DocumentStatus;
      count: number;
      fileUrls: string[];
    };
    receipts: {
      required: boolean;
      status: DocumentStatus;
      count: number;
      fileUrls: string[];
    };
    incomeInvoices: {
      required: boolean;
      status: DocumentStatus;
      count: number;
    };
  };
  financials: {
    vatPayable?: number;
    vatDueDate?: Timestamp;
    incomeTaxAccrued: number;
    socialInsuranceEstimate?: number;
    healthInsuranceEstimate?: number;
  };
  closedAt?: Timestamp;
  closedBy?: string;
  status: "open" | "pending_review" | "closed";
  lastReminderSentAt?: Timestamp;
  reminderCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Invoice
export interface Invoice {
  id: string;
  type: "income" | "expense";
  issuedBy?: {
    companyId: string;
    companyName: string;
  };
  issuedTo?: {
    companyId: string;
    companyName: string;
  };
  invoiceNumber: string;
  variableSymbol?: string;
  issueDate: Timestamp;
  dueDate: Timestamp;
  partner: {
    name: string;
    ico?: string;
    dic?: string;
    address: string;
  };
  items: InvoiceItem[];
  totalWithoutVat: number;
  totalVat: number;
  totalWithVat: number;
  paymentStatus: "unpaid" | "paid" | "overdue" | "partial";
  paidAt?: Timestamp;
  paidAmount?: number;
  pohodaId?: string;
  googleDriveFileId?: string;
  createdAt: Timestamp;
  createdBy: string;
  updatedAt: Timestamp;
  generatedByAI?: boolean;
  aiPrompt?: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  totalWithoutVat: number;
  totalWithVat: number;
}

// Document
export interface Document {
  id: string;
  companyId: string;
  period: string;
  type: "bank_statement" | "receipt" | "expense_invoice" | "contract" | "other";
  fileName: string;
  fileUrl: string;
  googleDriveFileId?: string;
  mimeType: string;
  fileSizeBytes: number;
  ocrProcessed: boolean;
  ocrData?: {
    extractedText: string;
    parsedFields: Record<string, any>;
    confidence: number;
  };
  status: DocumentStatus;
  reviewedBy?: string;
  reviewedAt?: Timestamp;
  rejectionReason?: string;
  uploadedBy: string;
  uploadedAt: Timestamp;
  uploadSource: "web" | "mobile" | "whatsapp" | "api";
}

// Task
export interface Task {
  id: string;
  title: string;
  description?: string;
  companyId?: string;
  assignedTo: string;
  createdBy: string;
  status: "open" | "in_progress" | "completed" | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  dueDate?: Timestamp;
  completedAt?: Timestamp;
  source: "manual" | "whatsapp" | "chat" | "ai_generated";
  whatsappMessageId?: string;
  attachments: Attachment[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Attachment {
  name: string;
  url: string;
  type: "google_drive" | "firebase_storage";
}

// Chat
export interface Chat {
  id: string;
  type: "company_chat" | "task_chat";
  companyId?: string;
  taskId?: string;
  participants: string[];
  lastMessageAt: Timestamp;
  lastMessagePreview: string;
  createdAt: Timestamp;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderType: "client" | "accountant" | "ai";
  text: string;
  aiGenerated?: boolean;
  aiModel?: string;
  aiConfidence?: number;
  attachments?: Attachment[];
  read: boolean;
  readAt?: Timestamp;
  createdAt: Timestamp;
}
