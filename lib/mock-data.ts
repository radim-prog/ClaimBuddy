// Mock data pro testování UI (než napojíme backend)

import { TaskTimelineEvent } from '@/lib/types/tasks'

export const mockUsers = [
  {
    id: 'user-1-client',
    email: 'karel@example.com',
    name: 'Karel Novák',
    role: 'client' as const,
    phone_number: '+420777123456',
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'user-2-accountant',
    email: 'jana@ucetni.cz',
    name: 'Jana Svobodová',
    role: 'accountant' as const,
    phone_number: '+420777654321',
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'user-3-accountant',
    email: 'petr@ucetni.cz',
    name: 'Petr Novotný',
    role: 'accountant' as const,
    phone_number: '+420777888999',
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'user-4-assistant',
    email: 'marie@ucetni.cz',
    name: 'Marie Dvořáková',
    role: 'assistant' as const,
    phone_number: '+420777111222',
    created_at: '2025-01-01T00:00:00Z',
  },
]

export const mockCompanies = [
  {
    id: 'company-1',
    owner_id: 'user-1-client',
    assigned_accountant_id: 'user-2-accountant',
    name: 'ABC s.r.o.',
    ico: '12345678',
    dic: 'CZ12345678',
    legal_form: 's.r.o.' as const,
    vat_payer: true,
    street: 'Hlavní 123',
    city: 'Praha',
    zip: '110 00',
    bank_account: '123456789/0100',
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'company-2',
    owner_id: 'user-1-client',
    assigned_accountant_id: 'user-2-accountant',
    name: 'XYZ OSVČ',
    ico: '87654321',
    dic: 'CZ87654321',
    legal_form: 'OSVČ' as const,
    vat_payer: false,
    street: 'Vedlejší 456',
    city: 'Brno',
    zip: '602 00',
    bank_account: '987654321/0100',
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'company-3',
    owner_id: 'user-1-client',
    assigned_accountant_id: 'user-2-accountant',
    name: 'DEF s.r.o.',
    ico: '11223344',
    dic: 'CZ11223344',
    legal_form: 's.r.o.' as const,
    vat_payer: true,
    street: 'Nová 789',
    city: 'Ostrava',
    zip: '700 00',
    bank_account: '111222333/0100',
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'company-4',
    owner_id: 'user-1-client',
    assigned_accountant_id: 'user-2-accountant',
    name: 'GHI Trading',
    ico: '55667788',
    dic: 'CZ55667788',
    legal_form: 's.r.o.' as const,
    vat_payer: true,
    street: 'Obchodní 1',
    city: 'Plzeň',
    zip: '301 00',
    bank_account: '444555666/0100',
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'company-5',
    owner_id: 'user-1-client',
    assigned_accountant_id: 'user-2-accountant',
    name: 'JKL Consulting',
    ico: '99887766',
    dic: 'CZ99887766',
    legal_form: 's.r.o.' as const,
    vat_payer: false,
    street: 'Poradenská 10',
    city: 'Liberec',
    zip: '460 00',
    bank_account: '777888999/0100',
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'company-6',
    owner_id: 'user-1-client',
    assigned_accountant_id: 'user-2-accountant',
    name: 'MNO Services s.r.o.',
    ico: '22334455',
    dic: 'CZ22334455',
    legal_form: 's.r.o.' as const,
    vat_payer: true,
    street: 'Služební 20',
    city: 'České Budějovice',
    zip: '370 00',
    bank_account: '123123123/0100',
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'company-7',
    owner_id: 'user-1-client',
    assigned_accountant_id: 'user-2-accountant',
    name: 'PQR Development',
    ico: '66778899',
    dic: 'CZ66778899',
    legal_form: 's.r.o.' as const,
    vat_payer: true,
    street: 'Developerská 5',
    city: 'Hradec Králové',
    zip: '500 00',
    bank_account: '456456456/0100',
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'company-8',
    owner_id: 'user-1-client',
    assigned_accountant_id: 'user-2-accountant',
    name: 'STU Marketing OSVČ',
    ico: '33445566',
    dic: 'CZ33445566',
    legal_form: 'OSVČ' as const,
    vat_payer: false,
    street: 'Marketingová 15',
    city: 'Olomouc',
    zip: '779 00',
    bank_account: '789789789/0100',
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'company-9',
    owner_id: 'user-1-client',
    assigned_accountant_id: 'user-2-accountant',
    name: 'VWX Logistics s.r.o.',
    ico: '77889900',
    dic: 'CZ77889900',
    legal_form: 's.r.o.' as const,
    vat_payer: true,
    street: 'Logistická 50',
    city: 'Pardubice',
    zip: '530 00',
    bank_account: '321321321/0100',
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'company-10',
    owner_id: 'user-1-client',
    assigned_accountant_id: 'user-2-accountant',
    name: 'YZ Tech s.r.o.',
    ico: '44556677',
    dic: 'CZ44556677',
    legal_form: 's.r.o.' as const,
    vat_payer: true,
    street: 'Technická 100',
    city: 'Zlín',
    zip: '760 00',
    bank_account: '654654654/0100',
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'company-11',
    owner_id: 'user-1-client',
    assigned_accountant_id: 'user-2-accountant',
    name: 'BCD Finance',
    ico: '88990011',
    dic: 'CZ88990011',
    legal_form: 's.r.o.' as const,
    vat_payer: true,
    street: 'Finanční 25',
    city: 'Karlovy Vary',
    zip: '360 00',
    bank_account: '147147147/0100',
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'company-12',
    owner_id: 'user-1-client',
    assigned_accountant_id: 'user-2-accountant',
    name: 'EFG Elektro OSVČ',
    ico: '55443322',
    dic: 'CZ55443322',
    legal_form: 'OSVČ' as const,
    vat_payer: false,
    street: 'Elektrická 8',
    city: 'Jihlava',
    zip: '586 00',
    bank_account: '258258258/0100',
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'company-13',
    owner_id: 'user-1-client',
    assigned_accountant_id: 'user-2-accountant',
    name: 'HIJ Construction s.r.o.',
    ico: '11009988',
    dic: 'CZ11009988',
    legal_form: 's.r.o.' as const,
    vat_payer: true,
    street: 'Stavební 30',
    city: 'Ústí nad Labem',
    zip: '400 00',
    bank_account: '369369369/0100',
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'company-14',
    owner_id: 'user-1-client',
    assigned_accountant_id: 'user-2-accountant',
    name: 'KLM Restaurant',
    ico: '22118877',
    dic: 'CZ22118877',
    legal_form: 's.r.o.' as const,
    vat_payer: true,
    street: 'Restaurační 12',
    city: 'Třebíč',
    zip: '674 00',
    bank_account: '741741741/0100',
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'company-15',
    owner_id: 'user-1-client',
    assigned_accountant_id: 'user-2-accountant',
    name: 'NOP Media OSVČ',
    ico: '66554433',
    dic: 'CZ66554433',
    legal_form: 'OSVČ' as const,
    vat_payer: false,
    street: 'Mediální 7',
    city: 'Havířov',
    zip: '736 00',
    bank_account: '852852852/0100',
    created_at: '2025-01-01T00:00:00Z',
  },
]

// Generovat monthly_closures pro každou firmu × 12 měsíců
const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
const statusOptions = ['missing', 'uploaded', 'approved'] as const

export const mockMonthlyClosures = mockCompanies.flatMap((company, companyIndex) =>
  months.map((month, monthIndex) => {
    // Strategicky nastavit statusy aby Master Matice vypadala zajímavě
    let status: typeof statusOptions[number]
    if (monthIndex < 3) {
      status = 'approved' // Leden-Březen = schváleno
    } else if (monthIndex < 6) {
      status = 'uploaded' // Duben-Červen = nahráno
    } else {
      // Červenec-Prosinec = mix (závisí na firmě)
      status = companyIndex % 3 === 0 ? 'missing' : companyIndex % 3 === 1 ? 'uploaded' : 'approved'
    }

    return {
      id: `closure-${company.id}-2025-${month}`,
      company_id: company.id,
      period: `2025-${month}`,
      status: 'open' as const,
      bank_statement_status: status,
      expense_documents_status: status, // Sloučené: faktury + účtenky
      income_invoices_status: status,
      vat_payable: status === 'approved' ? Math.floor(Math.random() * 50000) : null,
      income_tax_accrued: status === 'approved' ? Math.floor(Math.random() * 15000) : null,
      social_insurance: status === 'approved' && company.legal_form === 'OSVČ' ? 2500 : null,
      health_insurance: status === 'approved' && company.legal_form === 'OSVČ' ? 2000 : null,
      reminder_count: status === 'missing' ? Math.floor(Math.random() * 3) : 0,
      last_reminder_sent_at: status === 'missing' ? '2025-01-20T10:00:00Z' : null,
      notes: null,
      created_at: `2025-${month}-01T00:00:00Z`,
      updated_at: `2025-${month}-15T00:00:00Z`,
    }
  })
)

// Mock documents (30 ukázkových dokumentů)
const documentTypes = ['receipt', 'bank_statement', 'expense_invoice', 'income_invoice'] as const
const fileExamples = {
  receipt: ['uctenka-potraviny.jpg', 'uctenka-benzin.jpg', 'uctenka-kancelare.pdf'],
  bank_statement: ['vypis-leden.pdf', 'vypis-unor.pdf', 'vypis-brezen.pdf'],
  expense_invoice: ['faktura-dodavatel.pdf', 'faktura-sluzby.pdf', 'faktura-material.pdf'],
  income_invoice: ['faktura-odberatel.pdf', 'faktura-zakaznik.pdf', 'faktura-prodej.pdf'],
}

export const mockDocuments = Array.from({ length: 30 }, (_, index) => {
  const companyIndex = index % 5 // Rozdělit mezi prvních 5 firem
  const companyId = `company-${companyIndex + 1}`
  const monthIndex = Math.floor(index / 5) % 6 // Dokumenty pro leden-červen
  const period = `2025-0${monthIndex + 1}`
  const typeIndex = index % 4
  const type = documentTypes[typeIndex]
  const fileIndex = index % 3
  const fileName = fileExamples[type][fileIndex]

  const descriptions = [
    'Faktura za nákup kancelářských potřeb',
    'Bankovní výpis za běžný účet',
    'Účtenka z obchodní večeře s klientem',
    'Faktura za webhosting a doménu',
    'Účtenka za PHM - služební cesta',
    'Faktura za dodávku zboží',
    'Výpis z firemní kreditní karty',
    'Účtenka za ubytování - konference',
    'Faktura za grafické práce',
    'Bankovní výpis - spořící účet',
  ]

  const isPdf = fileName.endsWith('.pdf')
  const imageCategories = ['receipt', 'business', 'food', 'tech']
  const imageCategory = imageCategories[index % 4]

  return {
    id: `doc-${index + 1}`,
    company_id: companyId,
    period,
    type,
    file_name: fileName,
    file_url: `https://example.com/doc${index + 1}.${isPdf ? 'pdf' : 'jpg'}`,
    thumbnail_url: isPdf
      ? `https://placehold.co/400x300/e0e0e0/666?text=PDF+Document&font=roboto`
      : `https://images.unsplash.com/photo-${1600000000000 + index * 100000}?w=400&h=300&fit=crop&q=80&auto=format&auto=compress&sig=${imageCategory}${index}`,
    description: descriptions[index % descriptions.length],
    file_size_bytes: Math.floor(Math.random() * 2000000) + 100000,
    google_drive_file_id: `drive-id-${index + 1}`,
    mime_type: isPdf ? 'application/pdf' : 'image/jpeg',
    upload_source: 'web' as const,
    uploaded_by: 'user-1-client',
    uploaded_at: `2025-0${monthIndex + 1}-${String(index % 28 + 1).padStart(2, '0')}T${String(index % 24).padStart(2, '0')}:00:00Z`,
    ocr_processed: index % 3 === 0,
    ocr_status: index % 3 === 0 ? 'completed' : 'pending',
    ocr_data: index % 3 === 0 ? {
      extracted_text: `Mock OCR data for ${fileName}`,
      parsed_fields: {
        date: `2025-0${monthIndex + 1}-15`,
        total_amount: Math.floor(Math.random() * 10000) + 100,
        supplier_name: 'Mock Supplier',
        confidence: 0.85 + Math.random() * 0.15,
      },
    } : null,
    status: index % 4 === 0 ? 'approved' : index % 4 === 1 ? 'uploaded' : 'pending',
    reviewed_by: index % 4 === 0 ? 'user-2-accountant' : null,
    reviewed_at: index % 4 === 0 ? `2025-0${monthIndex + 1}-20T10:00:00Z` : null,
    rejection_reason: null,
    deleted_at: null,
  }
})

// Task types with GTD methodology
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low'
export type TaskStatus = 'pending' | 'accepted' | 'in_progress' | 'waiting_for' | 'completed' | 'someday_maybe'
export type GTDContext = '@email' | '@telefon' | '@pocitac' | '@kancelar' | '@meeting' | '@anywhere'
export type EnergyLevel = 'high' | 'medium' | 'low'

export interface Task {
  id: string
  title: string
  description: string

  // Task vs Project
  is_project: boolean
  project_outcome?: string
  parent_project_id?: string

  // Workflow
  status: TaskStatus
  priority: TaskPriority

  // Assignment
  created_by: string
  created_by_name: string
  assigned_to?: string
  assigned_to_name?: string

  // Waiting for
  is_waiting_for: boolean
  waiting_for_who?: string
  waiting_for_what?: string

  // Deadline
  due_date: string
  due_time?: string

  // Client relationship
  company_id: string
  company_name: string

  // GTD Specific
  gtd_context?: GTDContext[]
  gtd_energy_level?: EnergyLevel
  gtd_is_quick_action?: boolean  // < 2 min

  // Time tracking
  estimated_minutes?: number
  actual_minutes?: number

  // Billing
  is_billable: boolean
  hourly_rate?: number

  // Metadata
  tags?: string[]
  progress_percentage?: number

  // Timestamps
  created_at: string
  updated_at: string
  completed_at?: string
}

// Mock tasks pro účetní s GTD kategoriemi
export const mockTasks: Task[] = [
  // QUICK ACTIONS (< 2 min)
  {
    id: 'task-1',
    title: 'Zaslat připomínku emailem',
    description: 'Poslat automatický email klientovi ABC s.r.o. o chybějícím výpisu',
    is_project: false,
    status: 'pending',
    priority: 'high',
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    assigned_to: 'user-2-accountant',
    assigned_to_name: 'Jana Svobodová',
    is_waiting_for: false,
    due_date: '2025-12-07',
    due_time: '14:00',
    company_id: 'company-1',
    company_name: 'ABC s.r.o.',
    gtd_context: ['@email'],
    gtd_energy_level: 'low',
    gtd_is_quick_action: true,
    estimated_minutes: 2,
    is_billable: false,
    tags: ['email', 'urgence'],
    created_at: '2025-12-06T10:00:00Z',
    updated_at: '2025-12-06T10:00:00Z',
  },
  {
    id: 'task-2',
    title: 'Zavolat klientovi - potvrzení schůzky',
    description: 'Rychlý telefonát klientovi XYZ OSVČ pro potvrzení zítřejší schůzky',
    is_project: false,
    status: 'pending',
    priority: 'medium',
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    assigned_to: 'user-2-accountant',
    assigned_to_name: 'Jana Svobodová',
    is_waiting_for: false,
    due_date: '2025-12-07',
    due_time: '10:00',
    company_id: 'company-2',
    company_name: 'XYZ OSVČ',
    gtd_context: ['@telefon'],
    gtd_energy_level: 'low',
    gtd_is_quick_action: true,
    estimated_minutes: 2,
    is_billable: false,
    tags: ['telefon', 'schuzka'],
    created_at: '2025-12-06T09:00:00Z',
    updated_at: '2025-12-06T09:00:00Z',
  },

  // URGENTNÍ (overdue nebo deadline dnes/zítra)
  {
    id: 'task-3',
    title: 'DPH přiznání - listopad 2025',
    description: 'URGENTNÍ: Podat DPH přiznání za listopad do 25.12. Deadline blíží!',
    is_project: false,
    status: 'in_progress',
    priority: 'critical',
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    assigned_to: 'user-2-accountant',
    assigned_to_name: 'Jana Svobodová',
    is_waiting_for: false,
    due_date: '2025-12-08',
    due_time: '23:59',
    company_id: 'company-4',
    company_name: 'GHI Trading',
    gtd_context: ['@pocitac', '@kancelar'],
    gtd_energy_level: 'high',
    gtd_is_quick_action: false,
    estimated_minutes: 120,
    actual_minutes: 45,
    is_billable: true,
    hourly_rate: 1200,
    tags: ['dph', 'deadline', 'urgentni'],
    progress_percentage: 40,
    created_at: '2025-12-01T08:00:00Z',
    updated_at: '2025-12-06T14:30:00Z',
  },
  {
    id: 'task-4',
    title: 'Chybí bankovní výpis - poslední den!',
    description: 'Klient dosud nenahrál výpis za listopad. Deadline dnes!',
    is_project: false,
    status: 'pending',
    priority: 'critical',
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    assigned_to: 'user-2-accountant',
    assigned_to_name: 'Jana Svobodová',
    is_waiting_for: false,
    due_date: '2025-12-07',
    due_time: '17:00',
    company_id: 'company-1',
    company_name: 'ABC s.r.o.',
    gtd_context: ['@email', '@telefon'],
    gtd_energy_level: 'medium',
    gtd_is_quick_action: false,
    estimated_minutes: 15,
    is_billable: false,
    tags: ['urgence', 'dokumenty'],
    created_at: '2025-12-05T10:00:00Z',
    updated_at: '2025-12-07T09:00:00Z',
  },

  // WAITING FOR
  {
    id: 'task-5',
    title: 'Čeká na podpis smlouvy od klienta',
    description: 'Smlouva o vedení účetnictví zaslána klientovi 3.12., čeká na podpis a vrácení',
    is_project: false,
    status: 'waiting_for',
    priority: 'high',
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    assigned_to: 'user-2-accountant',
    assigned_to_name: 'Jana Svobodová',
    is_waiting_for: true,
    waiting_for_who: 'Petr Svoboda (TechSolutions)',
    waiting_for_what: 'Podepsaná smlouva o vedení účetnictví',
    due_date: '2025-12-10',
    company_id: 'company-3',
    company_name: 'DEF s.r.o.',
    gtd_context: ['@anywhere'],
    gtd_energy_level: 'low',
    gtd_is_quick_action: false,
    estimated_minutes: 5,
    is_billable: false,
    tags: ['smlouva', 'waiting'],
    created_at: '2025-12-03T11:00:00Z',
    updated_at: '2025-12-03T11:00:00Z',
  },
  {
    id: 'task-6',
    title: 'Čeká na údaje z Pohody',
    description: 'Požádáno klienta o export dat z účetního systému Pohoda. Čeká na dodání.',
    is_project: false,
    status: 'waiting_for',
    priority: 'medium',
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    assigned_to: 'user-2-accountant',
    assigned_to_name: 'Jana Svobodová',
    is_waiting_for: true,
    waiting_for_who: 'Eva Malá (Green Energy)',
    waiting_for_what: 'Export dat z Pohoda za Q4 2025',
    due_date: '2025-12-12',
    company_id: 'company-5',
    company_name: 'JKL Consulting',
    gtd_context: ['@anywhere'],
    gtd_energy_level: 'low',
    gtd_is_quick_action: false,
    estimated_minutes: 10,
    is_billable: true,
    hourly_rate: 800,
    tags: ['pohoda', 'export', 'waiting'],
    created_at: '2025-12-04T14:00:00Z',
    updated_at: '2025-12-04T14:00:00Z',
  },

  // NEXT ACTIONS
  {
    id: 'task-7',
    title: 'Schválit výdajové faktury',
    description: '5 faktur čeká na kontrolu a schválení v systému',
    is_project: false,
    status: 'accepted',
    priority: 'high',
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    assigned_to: 'user-2-accountant',
    assigned_to_name: 'Jana Svobodová',
    is_waiting_for: false,
    due_date: '2025-12-09',
    due_time: '15:00',
    company_id: 'company-3',
    company_name: 'DEF s.r.o.',
    gtd_context: ['@pocitac'],
    gtd_energy_level: 'medium',
    gtd_is_quick_action: false,
    estimated_minutes: 30,
    is_billable: true,
    hourly_rate: 1000,
    tags: ['faktury', 'kontrola'],
    created_at: '2025-12-05T09:15:00Z',
    updated_at: '2025-12-06T10:00:00Z',
  },
  {
    id: 'task-8',
    title: 'Zkontrolovat příjmové faktury',
    description: 'Ověřit správnost 3 nových příjmových faktur a zaúčtovat',
    is_project: false,
    status: 'accepted',
    priority: 'medium',
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    assigned_to: 'user-2-accountant',
    assigned_to_name: 'Jana Svobodová',
    is_waiting_for: false,
    due_date: '2025-12-11',
    company_id: 'company-5',
    company_name: 'JKL Consulting',
    gtd_context: ['@pocitac'],
    gtd_energy_level: 'medium',
    gtd_is_quick_action: false,
    estimated_minutes: 45,
    is_billable: true,
    hourly_rate: 1000,
    tags: ['faktury', 'kontrola'],
    created_at: '2025-12-06T16:20:00Z',
    updated_at: '2025-12-06T16:20:00Z',
  },
  {
    id: 'task-9',
    title: 'Připravit podklady pro roční závěrku',
    description: 'Sběr a kontrola všech dokumentů potřebných pro roční závěrku 2025',
    is_project: false,
    status: 'accepted',
    priority: 'medium',
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    assigned_to: 'user-2-accountant',
    assigned_to_name: 'Jana Svobodová',
    is_waiting_for: false,
    due_date: '2025-12-20',
    company_id: 'company-9',
    company_name: 'VWX Logistics s.r.o.',
    gtd_context: ['@pocitac', '@kancelar'],
    gtd_energy_level: 'high',
    gtd_is_quick_action: false,
    estimated_minutes: 180,
    is_billable: true,
    hourly_rate: 1200,
    tags: ['rocni-uzaverka', 'podklady'],
    created_at: '2025-12-02T15:00:00Z',
    updated_at: '2025-12-02T15:00:00Z',
  },

  // PROJEKTY
  {
    id: 'task-10',
    title: 'PROJEKT: Implementace nového účetního systému',
    description: 'Dlouhodobý projekt migrace klienta na nový účetní systém Money S5',
    is_project: true,
    project_outcome: 'Klient plně migrován na Money S5, školení dokončeno, první měsíc zpracován v novém systému',
    status: 'in_progress',
    priority: 'high',
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    assigned_to: 'user-2-accountant',
    assigned_to_name: 'Jana Svobodová',
    is_waiting_for: false,
    due_date: '2025-12-31',
    company_id: 'company-6',
    company_name: 'MNO Services s.r.o.',
    gtd_context: ['@pocitac', '@meeting', '@kancelar'],
    gtd_energy_level: 'high',
    gtd_is_quick_action: false,
    estimated_minutes: 600,
    actual_minutes: 240,
    is_billable: true,
    hourly_rate: 1500,
    tags: ['projekt', 'migrace', 'skoleni'],
    progress_percentage: 40,
    created_at: '2025-11-15T09:00:00Z',
    updated_at: '2025-12-06T17:00:00Z',
  },
  {
    id: 'task-11',
    title: 'PROJEKT: Příprava na daňovou kontrolu',
    description: 'Kompletní příprava klienta na očekávanou daňovou kontrolu',
    is_project: true,
    project_outcome: 'Všechny dokumenty připraveny, nesrovnalosti vyřešeny, klient připraven na kontrolu',
    status: 'in_progress',
    priority: 'critical',
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    assigned_to: 'user-2-accountant',
    assigned_to_name: 'Jana Svobodová',
    is_waiting_for: false,
    due_date: '2025-12-15',
    company_id: 'company-7',
    company_name: 'PQR Development',
    gtd_context: ['@pocitac', '@kancelar'],
    gtd_energy_level: 'high',
    gtd_is_quick_action: false,
    estimated_minutes: 480,
    actual_minutes: 120,
    is_billable: true,
    hourly_rate: 1800,
    tags: ['projekt', 'kontrola', 'urgentni'],
    progress_percentage: 25,
    created_at: '2025-11-20T10:00:00Z',
    updated_at: '2025-12-05T16:00:00Z',
  },

  // SOMEDAY/MAYBE
  {
    id: 'task-12',
    title: 'Zvážit automatizaci exportů',
    description: 'Prozkoumat možnosti automatického exportu dat z Pohody pro klienty',
    is_project: false,
    status: 'someday_maybe',
    priority: 'low',
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    assigned_to: 'user-2-accountant',
    assigned_to_name: 'Jana Svobodová',
    is_waiting_for: false,
    due_date: '2026-01-31',
    company_id: 'company-1',
    company_name: 'ABC s.r.o.',
    gtd_context: ['@pocitac'],
    gtd_energy_level: 'medium',
    gtd_is_quick_action: false,
    estimated_minutes: 120,
    is_billable: false,
    tags: ['automatizace', 'vylepseni'],
    created_at: '2025-11-10T12:00:00Z',
    updated_at: '2025-11-10T12:00:00Z',
  },
  {
    id: 'task-13',
    title: 'Napsat blogpost o DPH změnách 2026',
    description: 'Připravit článek pro klienty o připravovaných změnách v DPH legislativě',
    is_project: false,
    status: 'someday_maybe',
    priority: 'low',
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    assigned_to: 'user-2-accountant',
    assigned_to_name: 'Jana Svobodová',
    is_waiting_for: false,
    due_date: '2026-02-28',
    company_id: 'company-2',
    company_name: 'XYZ OSVČ',
    gtd_context: ['@pocitac'],
    gtd_energy_level: 'medium',
    gtd_is_quick_action: false,
    estimated_minutes: 90,
    is_billable: false,
    tags: ['content', 'blog'],
    created_at: '2025-11-15T14:00:00Z',
    updated_at: '2025-11-15T14:00:00Z',
  },

  // COMPLETED (dokončené dnes)
  {
    id: 'task-14',
    title: 'Zaúčtovat mzdy - listopad',
    description: 'Zpracovat mzdové podklady a zaúčtovat',
    is_project: false,
    status: 'completed',
    priority: 'medium',
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    assigned_to: 'user-2-accountant',
    assigned_to_name: 'Jana Svobodová',
    is_waiting_for: false,
    due_date: '2025-12-06',
    company_id: 'company-1',
    company_name: 'ABC s.r.o.',
    gtd_context: ['@pocitac'],
    gtd_energy_level: 'high',
    gtd_is_quick_action: false,
    estimated_minutes: 60,
    actual_minutes: 55,
    is_billable: true,
    hourly_rate: 1200,
    tags: ['mzdy', 'dokonceno'],
    progress_percentage: 100,
    created_at: '2025-12-01T08:00:00Z',
    updated_at: '2025-12-06T14:00:00Z',
    completed_at: '2025-12-06T14:00:00Z',
  },
  {
    id: 'task-15',
    title: 'Měsíční uzávěrka - listopad',
    description: 'Dokončit měsíční uzávěrku za listopad 2025',
    is_project: false,
    status: 'completed',
    priority: 'medium',
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    assigned_to: 'user-2-accountant',
    assigned_to_name: 'Jana Svobodová',
    is_waiting_for: false,
    due_date: '2025-12-05',
    company_id: 'company-7',
    company_name: 'PQR Development',
    gtd_context: ['@pocitac', '@kancelar'],
    gtd_energy_level: 'high',
    gtd_is_quick_action: false,
    estimated_minutes: 90,
    actual_minutes: 95,
    is_billable: true,
    hourly_rate: 1200,
    tags: ['uzaverka', 'dokonceno'],
    progress_percentage: 100,
    created_at: '2025-12-01T09:00:00Z',
    updated_at: '2025-12-06T11:30:00Z',
    completed_at: '2025-12-06T11:30:00Z',
  },
]

// ============================================
// TASK TIMELINE EVENTS (Mock)
// ============================================

export const mockTaskTimelineEvents: TaskTimelineEvent[] = [
  // Task 14 - Completed today (Zaúčtovat mzdy)
  {
    id: 'timeline-event-1',
    company_id: 'company-1',
    task_id: 'task-14',
    event_type: 'task_created',
    event_data: {
      task_title: 'Zaúčtovat mzdy - listopad',
      priority: 'medium',
      is_project: false,
      assigned_to_name: 'Jana Svobodová',
      due_date: '2025-12-06',
      estimated_minutes: 60,
      is_billable: true,
    },
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    created_at: '2025-12-01T08:00:00Z',
    display_title: 'Jana Svobodová vytvořila úkol: Zaúčtovat mzdy - listopad',
    display_icon: 'Plus',
    display_color: 'blue',
  },
  {
    id: 'timeline-event-2',
    company_id: 'company-1',
    task_id: 'task-14',
    event_type: 'task_started',
    event_data: {
      task_title: 'Zaúčtovat mzdy - listopad',
      started_by_name: 'Jana Svobodová',
      estimated_minutes: 60,
    },
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    created_at: '2025-12-06T13:00:00Z',
    display_title: 'Jana Svobodová začala pracovat na: Zaúčtovat mzdy - listopad',
    display_icon: 'Play',
    display_color: 'blue',
  },
  {
    id: 'timeline-event-3',
    company_id: 'company-1',
    task_id: 'task-14',
    event_type: 'task_completed',
    event_data: {
      task_title: 'Zaúčtovat mzdy - listopad',
      completed_by_name: 'Jana Svobodová',
      actual_minutes: 55,
      estimated_minutes: 60,
      billable_amount: 1100, // 55min * 1200 Kč/hod
      is_billable: true,
      time_difference: -5,
    },
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    created_at: '2025-12-06T14:00:00Z',
    display_title: 'Jana Svobodová dokončila úkol: Zaúčtovat mzdy - listopad (0.9h, 1 100 Kč)',
    display_icon: 'CheckSquare',
    display_color: 'green',
  },

  // Task 15 - Completed today (Měsíční uzávěrka)
  {
    id: 'timeline-event-4',
    company_id: 'company-7',
    task_id: 'task-15',
    event_type: 'task_created',
    event_data: {
      task_title: 'Měsíční uzávěrka - listopad',
      priority: 'medium',
      is_project: false,
      assigned_to_name: 'Jana Svobodová',
      due_date: '2025-12-05',
      estimated_minutes: 90,
      is_billable: true,
    },
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    created_at: '2025-12-01T09:00:00Z',
    display_title: 'Jana Svobodová vytvořila úkol: Měsíční uzávěrka - listopad',
    display_icon: 'Plus',
    display_color: 'blue',
  },
  {
    id: 'timeline-event-5',
    company_id: 'company-7',
    task_id: 'task-15',
    event_type: 'task_completed',
    event_data: {
      task_title: 'Měsíční uzávěrka - listopad',
      completed_by_name: 'Jana Svobodová',
      actual_minutes: 95,
      estimated_minutes: 90,
      billable_amount: 1900, // 95min * 1200 Kč/hod
      is_billable: true,
      time_difference: 5,
    },
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    created_at: '2025-12-06T11:30:00Z',
    display_title: 'Jana Svobodová dokončila úkol: Měsíční uzávěrka - listopad (1.6h, 1 900 Kč)',
    display_icon: 'CheckSquare',
    display_color: 'green',
  },

  // Task 1 - In Progress (Poslat email klientovi)
  {
    id: 'timeline-event-6',
    company_id: 'company-1',
    task_id: 'task-1',
    event_type: 'task_created',
    event_data: {
      task_title: 'Poslat email klientovi ohledně chybějících dokladů',
      priority: 'high',
      is_project: false,
      assigned_to_name: 'Jana Svobodová',
      due_date: '2025-12-07',
      estimated_minutes: 10,
      is_billable: true,
    },
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    created_at: '2025-12-06T09:00:00Z',
    display_title: 'Jana Svobodová vytvořila úkol: Poslat email klientovi ohledně chybějících dokladů',
    display_icon: 'Plus',
    display_color: 'blue',
  },
  {
    id: 'timeline-event-7',
    company_id: 'company-1',
    task_id: 'task-1',
    event_type: 'task_started',
    event_data: {
      task_title: 'Poslat email klientovi ohledně chybějících dokladů',
      started_by_name: 'Jana Svobodová',
      estimated_minutes: 10,
    },
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    created_at: '2025-12-07T08:15:00Z',
    display_title: 'Jana Svobodová začala pracovat na: Poslat email klientovi ohledně chybějících dokladů',
    display_icon: 'Play',
    display_color: 'blue',
  },

  // Task 10 - Project milestone (Implementace účetního systému)
  {
    id: 'timeline-event-8',
    company_id: 'company-6',
    project_id: 'task-10',
    event_type: 'project_created',
    event_data: {
      project_title: 'PROJEKT: Implementace nového účetního systému',
      priority: 'high',
      is_project: true,
      assigned_to_name: 'Jana Svobodová',
      due_date: '2025-12-31',
      estimated_minutes: 600,
      is_billable: true,
    },
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    created_at: '2025-11-15T09:00:00Z',
    display_title: 'Jana Svobodová vytvořila projekt: PROJEKT: Implementace nového účetního systému',
    display_icon: 'FolderPlus',
    display_color: 'purple',
  },
  {
    id: 'timeline-event-9',
    company_id: 'company-6',
    project_id: 'task-10',
    event_type: 'project_milestone',
    event_data: {
      project_title: 'PROJEKT: Implementace nového účetního systému',
      milestone_name: 'Instalace a základní konfigurace',
      progress_percentage: 20,
      actual_hours: 2,
      estimated_hours: 10,
    },
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    created_at: '2025-11-22T16:00:00Z',
    display_title: 'Jana Svobodová dokončila milestone "Instalace a základní konfigurace" (20%)',
    display_icon: 'Trophy',
    display_color: 'purple',
  },
  {
    id: 'timeline-event-10',
    company_id: 'company-6',
    project_id: 'task-10',
    event_type: 'project_milestone',
    event_data: {
      project_title: 'PROJEKT: Implementace nového účetního systému',
      milestone_name: 'Školení zaměstnanců',
      progress_percentage: 40,
      actual_hours: 4,
      estimated_hours: 10,
    },
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    created_at: '2025-12-06T17:00:00Z',
    display_title: 'Jana Svobodová dokončila milestone "Školení zaměstnanců" (40%)',
    display_icon: 'Trophy',
    display_color: 'purple',
  },

  // Time logged events
  {
    id: 'timeline-event-11',
    company_id: 'company-6',
    task_id: 'task-10',
    event_type: 'time_logged',
    event_data: {
      task_title: 'PROJEKT: Implementace nového účetního systému',
      logged_by_name: 'Jana Svobodová',
      duration_minutes: 120,
      note: 'Školení zaměstnanců - základní práce se systémem',
      billable: true,
      billable_amount: 3000, // 2h * 1500 Kč/hod
      started_at: '2025-12-06T14:00:00Z',
      stopped_at: '2025-12-06T16:00:00Z',
    },
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    created_at: '2025-12-06T16:00:00Z',
    display_title: 'Jana Svobodová zalogovala 2h k úkolu: PROJEKT: Implementace nového účetního systému (3 000 Kč)',
    display_icon: 'Clock',
    display_color: 'blue',
  },

  // Task delegation example
  {
    id: 'timeline-event-12',
    company_id: 'company-2',
    task_id: 'task-3',
    event_type: 'task_created',
    event_data: {
      task_title: 'Zkontrolovat bankovní výpisy',
      priority: 'medium',
      is_project: false,
      assigned_to_name: 'Jana Svobodová',
      due_date: '2025-12-08',
      estimated_minutes: 20,
      is_billable: true,
    },
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    created_at: '2025-12-05T14:00:00Z',
    display_title: 'Jana Svobodová vytvořila úkol: Zkontrolovat bankovní výpisy',
    display_icon: 'Plus',
    display_color: 'blue',
  },

  // Invoice generated for project
  {
    id: 'timeline-event-13',
    company_id: 'company-6',
    task_id: 'task-10',
    event_type: 'invoice_generated',
    event_data: {
      task_title: 'PROJEKT: Implementace nového účetního systému',
      invoice_period: '2025-11',
      total_hours: 4,
      hourly_rate: 1500,
      total_amount: 6000,
      invoice_id: 'invoice-1',
    },
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    created_at: '2025-11-30T23:00:00Z',
    display_title: 'Jana Svobodová vygenerovala fakturu: PROJEKT: Implementace nového účetního systému - 2025-11 (4h, 6 000 Kč)',
    display_icon: 'DollarSign',
    display_color: 'green',
  },

  // Task assigned to someone else
  {
    id: 'timeline-event-14',
    company_id: 'company-4',
    task_id: 'task-6',
    event_type: 'task_created',
    event_data: {
      task_title: 'Připravit podklady pro DPH',
      priority: 'high',
      is_project: false,
      assigned_to_name: 'Jana Svobodová',
      due_date: '2025-12-10',
      estimated_minutes: 60,
      is_billable: true,
    },
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    created_at: '2025-12-03T11:00:00Z',
    display_title: 'Jana Svobodová vytvořila úkol: Připravit podklady pro DPH',
    display_icon: 'Plus',
    display_color: 'blue',
  },
  {
    id: 'timeline-event-15',
    company_id: 'company-4',
    task_id: 'task-6',
    event_type: 'task_accepted',
    event_data: {
      task_title: 'Připravit podklady pro DPH',
      accepted_by_name: 'Jana Svobodová',
    },
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    created_at: '2025-12-03T11:15:00Z',
    display_title: 'Jana Svobodová přijala úkol: Připravit podklady pro DPH',
    display_icon: 'CheckCircle',
    display_color: 'green',
  },
]

// Helper funkce pro získání dat
export function getCompaniesByAccountant(accountantId: string) {
  return mockCompanies.filter(c => c.assigned_accountant_id === accountantId)
}

export function getClosuresByCompany(companyId: string) {
  return mockMonthlyClosures.filter(c => c.company_id === companyId)
}

export function getDocumentsByCompany(companyId: string, period?: string) {
  return mockDocuments.filter(d =>
    d.company_id === companyId && (!period || d.period === period)
  )
}

export function getTaskTimelineByCompany(companyId: string) {
  return mockTaskTimelineEvents.filter(e => e.company_id === companyId)
}

export function getAllTimelineEvents(companyId: string) {
  // Combine task timeline events with other potential timeline events
  // For now, just return task events sorted by date
  return mockTaskTimelineEvents
    .filter(e => e.company_id === companyId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}
