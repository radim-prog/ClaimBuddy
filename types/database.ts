// Database types for Supabase

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
  created_at: string;
  last_login_at?: string;
  notification_preferences: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
}

// Company
export interface Company {
  id: string;
  owner_id: string; // FK → users.id
  assigned_accountant_id: string; // FK → users.id
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
    invoice_due_day: number; // 1-31 (den v měsíci)
    invoice_maturity: number; // dny splatnosti
  };
  created_at: string;
  updated_at: string;
}

// Monthly Closure - klíčová entita pro "matrici"
export interface MonthlyClosure {
  id: string;
  company_id: string; // FK → companies.id
  period: string; // 'YYYY-MM' (např. '2025-01')
  status: ClosureStatus;

  // Statusy jednotlivých podkladů
  bank_statement_status: DocumentStatus;
  bank_statement_uploaded_at?: string;
  bank_statement_file_url?: string;

  expense_invoices_status: DocumentStatus;
  expense_invoices_count: number;

  receipts_status: DocumentStatus;
  receipts_count: number;

  income_invoices_status: DocumentStatus;
  income_invoices_count: number;

  // Finanční data (vypočítané)
  vat_payable?: number; // DPH k odvedení
  vat_due_date?: string;
  income_tax_accrued: number; // Akruální daň z příjmů za měsíc
  social_insurance_estimate?: number; // Odhad sociálního pojištění
  health_insurance_estimate?: number; // Odhad zdravotního pojištění

  // Uzavření měsíce
  closed_at?: string;
  closed_by?: string; // FK → users.id (účetní)

  // Urgence
  last_reminder_sent_at?: string;
  reminder_count: number;

  created_at: string;
  updated_at: string;
}

// Document
export interface Document {
  id: string;
  company_id: string; // FK → companies.id
  period: string; // 'YYYY-MM'
  type: 'bank_statement' | 'receipt' | 'expense_invoice' | 'contract' | 'other';
  file_name: string;
  file_url: string; // URL v Google Drive nebo Firebase Storage
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
  reviewed_by?: string; // FK → users.id
  reviewed_at?: string;
  rejection_reason?: string;

  uploaded_by: string; // FK → users.id
  uploaded_at: string;
  upload_source: 'web' | 'mobile' | 'whatsapp' | 'api';
}

// Invoice
export interface Invoice {
  id: string;
  company_id: string; // FK → companies.id
  type: 'income' | 'expense';
  invoice_number: string;
  variable_symbol?: string;
  issue_date: string;
  due_date: string;

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
  paid_at?: string;
  paid_amount?: number;

  // Integrace
  pohoda_id?: string;
  google_drive_file_id?: string;

  // AI generování
  generated_by_ai?: boolean;
  ai_prompt?: string;

  created_at: string;
  created_by: string; // FK → users.id
  updated_at: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  vat_rate: number; // 0, 12, 21
  total_without_vat: number;
  total_with_vat: number;
}

// Task - úkolový systém (náhrada Notion/Slack)
export interface Task {
  id: string;
  title: string;
  description?: string;
  company_id?: string; // FK → companies.id (může být i obecný úkol)
  assigned_to: string; // FK → users.id
  created_by: string; // FK → users.id
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string;
  completed_at?: string;

  // Zdroj úkolu
  source: 'manual' | 'whatsapp' | 'chat' | 'ai_generated';
  whatsapp_message_id?: string;

  // Přílohy
  attachments: Attachment[];

  created_at: string;
  updated_at: string;
}

export interface Attachment {
  name: string;
  url: string;
  type: 'google_drive' | 'firebase_storage';
}

// Chat - komunikace k úkolům nebo obecně ke klientovi
export interface Chat {
  id: string;
  type: 'company_chat' | 'task_chat';
  company_id?: string; // FK → companies.id
  task_id?: string; // FK → tasks.id
  participants: string[]; // FK → users.id[]
  last_message_at: string;
  last_message_preview: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  chat_id: string; // FK → chats.id
  sender_id: string; // FK → users.id
  sender_name: string;
  sender_type: 'client' | 'accountant' | 'ai';
  text: string;

  // AI info
  ai_generated?: boolean;
  ai_model?: string;
  ai_confidence?: number;

  attachments?: Attachment[];

  read: boolean;
  read_at?: string;
  created_at: string;
}

// WhatsApp Message - log všech WhatsApp zpráv
export interface WhatsAppMessage {
  id: string;
  whatsapp_message_id: string; // ID z WhatsApp API
  from_phone: string;
  to_phone: string;
  company_id?: string; // FK → companies.id (pokud se podaří identifikovat)
  message_type: 'text' | 'image' | 'document' | 'audio';
  text?: string;
  media_url?: string;

  // Zpracování AI
  ai_processed: boolean;
  ai_extracted_intent?: string; // "urgentní úkol", "dotaz na fakturu", atd.

  // Vytvoření úkolu
  task_created?: boolean;
  task_id?: string; // FK → tasks.id

  created_at: string;
}

// Payment Matching - párování plateb (výpisy × faktury)
export interface PaymentMatch {
  id: string;
  company_id: string; // FK → companies.id
  bank_statement_id: string; // FK → documents.id
  invoice_id?: string; // FK → invoices.id

  // Data z výpisu
  transaction_date: string;
  amount: number;
  variable_symbol?: string;
  account_name?: string;

  // Matching
  matched: boolean;
  matched_by: 'ai' | 'manual';
  confidence?: number; // AI confidence score

  // Review
  reviewed: boolean;
  reviewed_by?: string; // FK → users.id
  reviewed_at?: string;

  created_at: string;
}

// Reminder - log urgencí
export interface Reminder {
  id: string;
  company_id: string; // FK → companies.id
  period: string; // 'YYYY-MM'
  type: 'sms' | 'email';
  recipient: string; // email nebo tel. číslo
  subject: string;
  message: string;
  sent_at: string;
  delivered: boolean;
  delivery_status?: string;
  created_by: string; // FK → users.id
}
