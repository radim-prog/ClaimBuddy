import { Timestamp } from 'firebase/firestore';

// Database types for Firebase Firestore

export type UserRole = 'client' | 'accountant' | 'admin';

export type DocumentStatus = 'missing' | 'uploaded' | 'approved' | 'rejected';

export type ClosureStatus = 'open' | 'pending_review' | 'closed';

export type PaymentStatus = 'unpaid' | 'paid' | 'overdue' | 'partial';

export type TaskStatus = 'open' | 'in_progress' | 'completed' | 'cancelled';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type VatPeriod = 'monthly' | 'quarterly' | null;

export type LegalForm = 'sro' | 'fyzicka_osoba' | 'as' | 'vos';

// User
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone_number?: string;
  avatar_url?: string;
  created_at: Timestamp;
  last_login_at?: Timestamp;
  notification_preferences: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
}

// Company
export interface Company {
  id: string;
  owner_id: string; // FK → users/{id}
  assigned_accountant_id: string; // FK → users/{id}
  name: string;
  ico: string;
  dic?: string;
  vat_payer: boolean;
  vat_period: VatPeriod;
  legal_form: LegalForm;
  address: {
    street: string;
    city: string;
    zip: string;
  };
  email: string;
  phone: string;
  pohoda_id?: string;
  google_drive_folder_id?: string;
  billing_settings: {
    monthly_fee: number;
    invoice_due_day: number; // 1-31
    invoice_maturity: number; // dny splatnosti
  };
  created_at: Timestamp;
  updated_at: Timestamp;
}

// Monthly Closure - KLÍČOVÁ KOLEKCE pro matrici
// Firestore path: /companies/{companyId}/monthly_closures/{period}
export interface MonthlyClosure {
  id: string; // period ('2025-01')
  company_id: string; // parent collection
  period: string; // 'YYYY-MM' (duplicate for querying)
  status: ClosureStatus;

  // Statusy podkladů
  bank_statement_status: DocumentStatus;
  bank_statement_uploaded_at?: Timestamp;
  bank_statement_file_url?: string;

  expense_invoices_status: DocumentStatus;
  expense_invoices_count: number;

  receipts_status: DocumentStatus;
  receipts_count: number;

  income_invoices_status: DocumentStatus;
  income_invoices_count: number;

  // Finanční data (vypočítané)
  vat_payable?: number; // DPH k odvedení
  vat_due_date?: Timestamp;
  income_tax_accrued: number; // Akruální daň z příjmů
  social_insurance_estimate?: number;
  health_insurance_estimate?: number;

  // Uzavření
  closed_at?: Timestamp;
  closed_by?: string; // FK → users/{id}

  // Urgence
  last_reminder_sent_at?: Timestamp;
  reminder_count: number;

  created_at: Timestamp;
  updated_at: Timestamp;
}

// Document
// Firestore path: /companies/{companyId}/documents/{documentId}
export interface Document {
  id: string;
  company_id: string; // parent collection
  period: string; // 'YYYY-MM'
  type: 'bank_statement' | 'receipt' | 'expense_invoice' | 'contract' | 'other';
  file_name: string;
  file_url: string; // Firebase Storage URL
  google_drive_file_id?: string;
  mime_type: string;
  file_size_bytes: number;

  // OCR data
  ocr_processed: boolean;
  ocr_data?: {
    extracted_text: string;
    parsed_fields: Record<string, any>;
    confidence: number;
  };

  status: DocumentStatus;
  reviewed_by?: string; // FK → users/{id}
  reviewed_at?: Timestamp;
  rejection_reason?: string;

  uploaded_by: string; // FK → users/{id}
  uploaded_at: Timestamp;
  upload_source: 'web' | 'mobile' | 'whatsapp' | 'api';
}

// Invoice
// Firestore path: /companies/{companyId}/invoices/{invoiceId}
export interface Invoice {
  id: string;
  company_id: string; // parent collection
  type: 'income' | 'expense';
  invoice_number: string;
  variable_symbol?: string;
  issue_date: Timestamp;
  due_date: Timestamp;

  // Partner (dodavatel/odběratel)
  partner: {
    name: string;
    ico?: string;
    dic?: string;
    address: string;
  };

  // Položky faktury
  items: InvoiceItem[];

  // Částky
  total_without_vat: number;
  total_vat: number;
  total_with_vat: number;

  // Platba
  payment_status: PaymentStatus;
  paid_at?: Timestamp;
  paid_amount?: number;

  // Integrace
  pohoda_id?: string;
  google_drive_file_id?: string;

  // AI generování
  generated_by_ai?: boolean;
  ai_prompt?: string;

  created_at: Timestamp;
  created_by: string; // FK → users/{id}
  updated_at: Timestamp;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  vat_rate: number; // 0, 12, 21
  total_without_vat: number;
  total_with_vat: number;
}

// Task - úkolový systém
// Firestore path: /tasks/{taskId}
export interface Task {
  id: string;
  title: string;
  description?: string;
  company_id?: string; // FK → companies/{id}
  assigned_to: string; // FK → users/{id}
  created_by: string; // FK → users/{id}
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: Timestamp;
  completed_at?: Timestamp;

  // Zdroj úkolu
  source: 'manual' | 'whatsapp' | 'chat' | 'ai_generated';
  whatsapp_message_id?: string;

  // Přílohy
  attachments: Attachment[];

  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Attachment {
  name: string;
  url: string;
  type: 'google_drive' | 'firebase_storage';
}

// Chat
// Firestore path: /chats/{chatId}
export interface Chat {
  id: string;
  type: 'company_chat' | 'task_chat';
  company_id?: string; // FK → companies/{id}
  task_id?: string; // FK → tasks/{id}
  participants: string[]; // FK → users/{id}[]
  last_message_at: Timestamp;
  last_message_preview: string;
  created_at: Timestamp;
}

// Chat Message
// Firestore path: /chats/{chatId}/messages/{messageId}
export interface ChatMessage {
  id: string;
  chat_id: string; // parent collection
  sender_id: string; // FK → users/{id}
  sender_name: string;
  sender_type: 'client' | 'accountant' | 'ai';
  text: string;

  // AI info
  ai_generated?: boolean;
  ai_model?: string;
  ai_confidence?: number;

  attachments?: Attachment[];

  read: boolean;
  read_at?: Timestamp;
  created_at: Timestamp;
}

// WhatsApp Message
// Firestore path: /whatsapp_messages/{messageId}
export interface WhatsAppMessage {
  id: string;
  whatsapp_message_id: string; // ID z WhatsApp API
  from_phone: string;
  to_phone: string;
  company_id?: string; // FK → companies/{id}
  message_type: 'text' | 'image' | 'document' | 'audio';
  text?: string;
  media_url?: string;

  // Zpracování AI
  ai_processed: boolean;
  ai_extracted_intent?: string;

  // Vytvoření úkolu
  task_created?: boolean;
  task_id?: string; // FK → tasks/{id}

  created_at: Timestamp;
}

// Payment Match
// Firestore path: /companies/{companyId}/payment_matches/{matchId}
export interface PaymentMatch {
  id: string;
  company_id: string; // parent collection
  bank_statement_id: string; // FK → documents/{id}
  invoice_id?: string; // FK → invoices/{id}

  // Data z výpisu
  transaction_date: Timestamp;
  amount: number;
  variable_symbol?: string;
  account_name?: string;

  // Matching
  matched: boolean;
  matched_by: 'ai' | 'manual';
  confidence?: number;

  // Review
  reviewed: boolean;
  reviewed_by?: string; // FK → users/{id}
  reviewed_at?: Timestamp;

  created_at: Timestamp;
}

// Reminder
// Firestore path: /reminders/{reminderId}
export interface Reminder {
  id: string;
  company_id: string; // FK → companies/{id}
  period: string; // 'YYYY-MM'
  type: 'sms' | 'email';
  recipient: string; // email nebo tel.
  subject: string;
  message: string;
  sent_at: Timestamp;
  delivered: boolean;
  delivery_status?: string;
  created_by: string; // FK → users/{id}
}
