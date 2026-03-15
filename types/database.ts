
// Database types for Supabase PostgreSQL

export type UserRole = 'client' | 'accountant' | 'admin';

export type DocumentStatus = 'missing' | 'uploaded' | 'approved' | 'rejected';

export type ClosureStatus = 'open' | 'pending_review' | 'closed';

export type PaymentStatus = 'unpaid' | 'paid' | 'overdue' | 'partial';

export type TaskStatus = 'open' | 'in_progress' | 'completed' | 'cancelled';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type VatPeriod = 'monthly' | 'quarterly' | null;

export type HealthInsuranceCompany =
  | 'vzp'      // 111 - VZP
  | 'vozp'     // 201 - VOZP
  | 'cpzp'     // 205 - ČPZP
  | 'ozp'      // 207 - OZP
  | 'zpmv'     // 211 - ZP MV
  | 'rbp'      // 213 - RBP
  | 'zpma'     // 217 - ZP M-A
  | null;

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
  owner_id: string; // FK → users/{id}
  assigned_accountant_id: string; // FK → users/{id}
  name: string;
  group_name?: string; // Skupina/vlastník pro sdružení firem (např. "Novák" pro všechny Novákovy firmy)
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

  // Zdravotní pojištění (pro OSVČ)
  health_insurance_company?: HealthInsuranceCompany;

  // Datová schránka - přístupové údaje (pouze pro účetní, zabezpečené)
  data_box?: {
    id: string;           // ID datové schránky
    login?: string;       // Přihlašovací jméno (šifrované)
    password?: string;    // Heslo (šifrované)
  };

  // Zaměstnanci
  has_employees: boolean;
  employee_count?: number;

  pohoda_id?: string;
  google_drive_folder_id?: string;
  billing_settings: {
    monthly_fee: number;
    invoice_due_day: number; // 1-31
    invoice_maturity: number; // dny splatnosti
  };
  created_at: string;
  updated_at: string;
}

// Monthly Closure - KLÍČOVÁ KOLEKCE pro matrici
export interface MonthlyClosure {
  id: string; // period ('2025-01')
  company_id: string; // parent collection
  period: string; // 'YYYY-MM' (duplicate for querying)
  status: ClosureStatus;

  // Statusy podkladů
  bank_statement_status: DocumentStatus;
  bank_statement_uploaded_at?: string;
  bank_statement_file_url?: string;

  expense_documents_status: DocumentStatus; // Sloučené: výdajové faktury + účtenky
  expense_documents_count: number;

  income_invoices_status: DocumentStatus;
  income_invoices_count: number;

  // Finanční data (vypočítané)
  vat_payable?: number; // DPH k odvedení
  vat_due_date?: string;
  income_tax_accrued: number; // Akruální daň z příjmů
  social_insurance_estimate?: number;
  health_insurance_estimate?: number;

  // Uzavření
  closed_at?: string;
  closed_by?: string; // FK → users/{id}

  // Urgence
  last_reminder_sent_at?: string;
  reminder_count: number;

  created_at: string;
  updated_at: string;
}

// Document
export interface Document {
  id: string;
  company_id: string; // parent collection
  period: string; // 'YYYY-MM'
  type: 'bank_statement' | 'receipt' | 'expense_invoice' | 'contract' | 'other';
  file_name: string;
  file_url: string; // Supabase Storage or Google Drive URL
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
  reviewed_at?: string;
  rejection_reason?: string;

  // Soft locking
  locked_by?: string; // FK → users/{id}
  locked_at?: string;

  uploaded_by: string; // FK → users/{id}
  uploaded_at: string;
  upload_source: 'web' | 'mobile' | 'whatsapp' | 'api';
}

// Invoice
export interface Invoice {
  id: string;
  company_id: string; // parent collection
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
  created_by: string; // FK → users/{id}
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

// Task - úkolový systém
export interface Task {
  id: string;
  title: string;
  description?: string;
  company_id?: string; // FK → companies/{id}
  assigned_to: string; // FK → users/{id}
  created_by: string; // FK → users/{id}
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
  type: 'google_drive' | 'supabase_storage';
}

// Chat
export interface Chat {
  id: string;
  type: 'company_chat' | 'task_chat';
  company_id?: string; // FK → companies/{id}
  task_id?: string; // FK → tasks/{id}
  participants: string[]; // FK → users/{id}[]
  last_message_at: string;
  last_message_preview: string;
  created_at: string;
}

// Chat Message
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
  read_at?: string;
  created_at: string;
}

// WhatsApp Message
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

  created_at: string;
}

// Payment Match
export interface PaymentMatch {
  id: string;
  company_id: string; // parent collection
  bank_statement_id: string; // FK → documents/{id}
  invoice_id?: string; // FK → invoices/{id}

  // Data z výpisu
  transaction_date: string;
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
  reviewed_at?: string;

  created_at: string;
}

// Reminder
export interface Reminder {
  id: string;
  company_id: string; // FK → companies/{id}
  period: string; // 'YYYY-MM'
  type: 'sms' | 'email';
  recipient: string; // email nebo tel.
  subject: string;
  message: string;
  sent_at: string;
  delivered: boolean;
  delivery_status?: string;
  created_by: string; // FK → users/{id}
}

// Database type for Supabase typed client
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User
        Insert: Omit<User, 'created_at' | 'last_login_at'>
        Update: Partial<Omit<User, 'id' | 'created_at'>>
      }
      companies: {
        Row: Company
        Insert: Omit<Company, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Company, 'id' | 'created_at'>>
      }
      monthly_closures: {
        Row: MonthlyClosure
        Insert: Omit<MonthlyClosure, 'created_at' | 'updated_at'>
        Update: Partial<Omit<MonthlyClosure, 'id' | 'created_at'>>
      }
      documents: {
        Row: Document
        Insert: Omit<Document, 'uploaded_at'>
        Update: Partial<Omit<Document, 'id' | 'uploaded_at'>>
      }
      invoices: {
        Row: Invoice
        Insert: Omit<Invoice, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Invoice, 'id' | 'created_at'>>
      }
      tasks: {
        Row: Task
        Insert: Omit<Task, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Task, 'id' | 'created_at'>>
      }
      chats: {
        Row: Chat
        Insert: Omit<Chat, 'created_at'>
        Update: Partial<Omit<Chat, 'id' | 'created_at'>>
      }
      chat_messages: {
        Row: ChatMessage
        Insert: Omit<ChatMessage, 'created_at'>
        Update: Partial<Omit<ChatMessage, 'id' | 'created_at'>>
      }
      whatsapp_messages: {
        Row: WhatsAppMessage
        Insert: Omit<WhatsAppMessage, 'created_at'>
        Update: Partial<Omit<WhatsAppMessage, 'id' | 'created_at'>>
      }
      payment_matches: {
        Row: PaymentMatch
        Insert: Omit<PaymentMatch, 'created_at'>
        Update: Partial<Omit<PaymentMatch, 'id' | 'created_at'>>
      }
      reminders: {
        Row: Reminder
        Insert: Omit<Reminder, 'sent_at'>
        Update: Partial<Omit<Reminder, 'id'>>
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}
