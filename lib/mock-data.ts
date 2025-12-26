// Mock data pro testování UI (než napojíme backend)

import { TaskTimelineEvent } from '@/lib/types/tasks'

// ============================================
// HELPER FUNKCE PRO DYNAMICKÁ DATA
// ============================================

// Generuje datum relativně k dnešku
function getRelativeDate(daysOffset: number): string {
  const date = new Date()
  date.setDate(date.getDate() + daysOffset)
  return date.toISOString().split('T')[0] // YYYY-MM-DD
}

// Konstanty pro relativní data (použijeme v mockTasks)
export const MOCK_DATES = {
  // Po termínu
  OVERDUE_3_DAYS: getRelativeDate(-3),
  OVERDUE_2_DAYS: getRelativeDate(-2),
  OVERDUE_1_DAY: getRelativeDate(-1),
  // Aktuální
  TODAY: getRelativeDate(0),
  TOMORROW: getRelativeDate(1),
  IN_2_DAYS: getRelativeDate(2),
  IN_3_DAYS: getRelativeDate(3),
  IN_4_DAYS: getRelativeDate(4),
  // Budoucí
  IN_5_DAYS: getRelativeDate(5),
  IN_7_DAYS: getRelativeDate(7),
  IN_14_DAYS: getRelativeDate(14),
  IN_30_DAYS: getRelativeDate(30),
  END_OF_MONTH: (() => {
    const d = new Date()
    d.setMonth(d.getMonth() + 1, 0) // Poslední den aktuálního měsíce
    return d.toISOString().split('T')[0]
  })(),
  END_OF_NEXT_MONTH: (() => {
    const d = new Date()
    d.setMonth(d.getMonth() + 2, 0) // Poslední den příštího měsíce
    return d.toISOString().split('T')[0]
  })(),
}

// ============================================
// CENTRÁLNÍ KONFIGURACE MOCK DAT
// ============================================

// Aktuální období (pro fakturaci, uzávěrky atd.)
function getCurrentPeriod(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export const MOCK_CONFIG = {
  // Aktuální období (dynamicky generováno)
  CURRENT_PERIOD: getCurrentPeriod(),
  PREVIOUS_PERIOD: (() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })(),

  // Limity pro zobrazení
  COMPANIES_DROPDOWN_LIMIT: 10,      // Limit firem v dropdownu
  COMPANIES_CLIENT_VIEW_LIMIT: 3,     // Limit firem pro klientský pohled
  TASKS_PAGE_SIZE: 50,                // Počet úkolů na stránku
  RECENT_COMPLETED_LIMIT: 5,          // Počet nedávno dokončených úkolů

  // ID aktuálního uživatele (účetní)
  CURRENT_USER_ID: 'user-2-accountant',
  CURRENT_USER_NAME: 'Jana Svobodová',

  // Prahy pro quick actions (v minutách)
  QUICK_ACTION_THRESHOLD: 30,         // Úkoly pod 30 min = quick action
  GTD_DO_IT_NOW_THRESHOLD: 2,         // Úkoly pod 2 min = udělej hned

  // Prahy pro R-Tasks prioritu
  SCORE_HIGH_THRESHOLD: 9,            // Score >= 9 = vysoká priorita
  SCORE_MEDIUM_THRESHOLD: 6,          // Score >= 6 = střední priorita

  // Rok odkdy začínají data (pro year selector)
  DATA_START_YEAR: new Date().getFullYear(),  // Aktuální rok jako minimum
  CURRENT_YEAR: new Date().getFullYear(),
}
import { Employee, Deduction } from '@/lib/types/employee'
import { Asset } from '@/lib/types/asset'
import { Insurance } from '@/lib/types/insurance'
import { ClientOnboarding, ClientStatus, DEFAULT_ONBOARDING_STEPS } from '@/lib/types/onboarding'

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
    group_name: 'Novák',
    ico: '12345678',
    dic: 'CZ12345678',
    legal_form: 's.r.o.' as const,
    vat_payer: true,
    vat_period: 'monthly' as const,
    street: 'Hlavní 123',
    city: 'Praha',
    zip: '110 00',
    bank_account: '123456789/0100',
    has_employees: true,
    employee_count: 5,
    data_box: {
      id: 'abc1234',
      login: 'abc_sro',
      // heslo se nezobrazuje v mock datech
    },
    phone: '+420 777 123 456',
    email: 'info@abc-sro.cz',
    created_at: '2025-01-01T00:00:00Z',
    status: 'active' as ClientStatus,
    reliability_score: 2 as 0 | 1 | 2 | 3,  // 0=beznadějný, 1=problémový, 2=normální, 3=spolehlivý
    reliability_note: 'Občas pozdní dodání dokumentů',
  },
  {
    id: 'company-2',
    owner_id: 'user-1-client',
    assigned_accountant_id: 'user-2-accountant',
    name: 'XYZ OSVČ',
    group_name: 'Novák',
    ico: '87654321',
    dic: 'CZ87654321',
    legal_form: 'OSVČ' as const,
    vat_payer: false,
    vat_period: null,
    street: 'Vedlejší 456',
    city: 'Brno',
    zip: '602 00',
    bank_account: '987654321/0100',
    health_insurance_company: 'vzp' as const,
    has_employees: false,
    data_box: {
      id: 'xyz5678',
    },
    created_at: '2025-01-01T00:00:00Z',
    status: 'active' as ClientStatus,
    reliability_score: 3 as 0 | 1 | 2 | 3,  // Spolehlivý klient
  },
  {
    id: 'company-3',
    owner_id: 'user-1-client',
    assigned_accountant_id: 'user-2-accountant',
    name: 'DEF s.r.o.',
    group_name: 'Novák',
    ico: '11223344',
    dic: 'CZ11223344',
    legal_form: 's.r.o.' as const,
    vat_payer: true,
    vat_period: 'quarterly' as const,
    street: 'Nová 789',
    city: 'Ostrava',
    zip: '700 00',
    bank_account: '111222333/0100',
    has_employees: true,
    employee_count: 12,
    data_box: {
      id: 'def9012',
      login: 'def_sro',
    },
    created_at: '2025-01-01T00:00:00Z',
    status: 'active' as ClientStatus,
    reliability_score: 1 as 0 | 1 | 2 | 3,  // Problémový klient
    reliability_note: 'Opakovaně pozdě dodává dokumenty, nutno urgovat',
  },
  {
    id: 'company-4',
    owner_id: 'user-1-client',
    assigned_accountant_id: 'user-2-accountant',
    name: 'GHI Trading',
    group_name: 'Svoboda',
    ico: '55667788',
    dic: 'CZ55667788',
    legal_form: 's.r.o.' as const,
    vat_payer: true,
    vat_period: 'monthly' as const,
    street: 'Obchodní 1',
    city: 'Plzeň',
    zip: '301 00',
    bank_account: '444555666/0100',
    has_employees: false,
    data_box: {
      id: 'ghi3456',
    },
    created_at: '2025-01-01T00:00:00Z',
    status: 'active' as ClientStatus,
    reliability_score: 0 as 0 | 1 | 2 | 3,  // Beznadějný klient!
    reliability_note: 'Nereaguje na urgence, zvážit ukončení spolupráce',
  },
  {
    id: 'company-5',
    owner_id: 'user-1-client',
    assigned_accountant_id: 'user-2-accountant',
    name: 'JKL Consulting',
    group_name: 'Svoboda',
    ico: '99887766',
    dic: 'CZ99887766',
    legal_form: 's.r.o.' as const,
    vat_payer: false,
    vat_period: null,
    street: 'Poradenská 10',
    city: 'Liberec',
    zip: '460 00',
    bank_account: '777888999/0100',
    has_employees: false,
    created_at: '2025-01-01T00:00:00Z',
    status: 'active' as ClientStatus,
    reliability_score: 3 as 0 | 1 | 2 | 3,  // Spolehlivý
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
    vat_period: 'monthly' as const,
    street: 'Služební 20',
    city: 'České Budějovice',
    zip: '370 00',
    bank_account: '123123123/0100',
    has_employees: true,
    employee_count: 8,
    data_box: { id: 'mno7890' },
    created_at: '2025-01-01T00:00:00Z',
    status: 'active' as ClientStatus,
    reliability_score: 2 as 0 | 1 | 2 | 3,  // Normální
  },
  {
    id: 'company-7',
    owner_id: 'user-1-client',
    assigned_accountant_id: 'user-2-accountant',
    name: 'PQR Development',
    group_name: 'Horák',
    ico: '66778899',
    dic: 'CZ66778899',
    legal_form: 's.r.o.' as const,
    vat_payer: true,
    vat_period: 'quarterly' as const,
    street: 'Developerská 5',
    city: 'Hradec Králové',
    zip: '500 00',
    bank_account: '456456456/0100',
    has_employees: true,
    employee_count: 25,
    data_box: { id: 'pqr2345', login: 'pqr_dev' },
    created_at: '2025-01-01T00:00:00Z',
    status: 'active' as ClientStatus,
    reliability_score: 3 as 0 | 1 | 2 | 3,  // Spolehlivý
  },
  {
    id: 'company-8',
    owner_id: 'user-1-client',
    assigned_accountant_id: 'user-2-accountant',
    name: 'STU Marketing OSVČ',
    group_name: 'Horák',
    ico: '33445566',
    dic: 'CZ33445566',
    legal_form: 'OSVČ' as const,
    vat_payer: false,
    vat_period: null,
    street: 'Marketingová 15',
    city: 'Olomouc',
    zip: '779 00',
    bank_account: '789789789/0100',
    health_insurance_company: 'cpzp' as const,
    has_employees: false,
    created_at: '2025-01-01T00:00:00Z',
    status: 'active' as ClientStatus,
    reliability_score: 2 as 0 | 1 | 2 | 3,  // Normální
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
    vat_period: 'monthly' as const,
    street: 'Logistická 50',
    city: 'Pardubice',
    zip: '530 00',
    bank_account: '321321321/0100',
    has_employees: true,
    employee_count: 45,
    data_box: { id: 'vwx6789', login: 'vwx_log' },
    created_at: '2025-01-01T00:00:00Z',
    status: 'active' as ClientStatus,
    reliability_score: 1 as 0 | 1 | 2 | 3,  // Problémový
    reliability_note: 'Velká firma, ale pomalá reakce',
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
    vat_period: 'monthly' as const,
    street: 'Technická 100',
    city: 'Zlín',
    zip: '760 00',
    bank_account: '654654654/0100',
    has_employees: true,
    employee_count: 15,
    data_box: { id: 'yz01234' },
    created_at: '2025-01-01T00:00:00Z',
    status: 'active' as ClientStatus,
    reliability_score: 3 as 0 | 1 | 2 | 3,  // Spolehlivý
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
    vat_period: 'quarterly' as const,
    street: 'Finanční 25',
    city: 'Karlovy Vary',
    zip: '360 00',
    bank_account: '147147147/0100',
    has_employees: true,
    employee_count: 3,
    data_box: { id: 'bcd5678', login: 'bcd_finance', password: 'Heslo123!' },
    phone: '+420 353 222 111',
    email: 'info@bcdfinance.cz',
    created_at: '2025-01-01T00:00:00Z',
    status: 'active' as ClientStatus,
    reliability_score: 2 as 0 | 1 | 2 | 3,  // Normální
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
    vat_period: null,
    street: 'Elektrická 8',
    city: 'Jihlava',
    zip: '586 00',
    bank_account: '258258258/0100',
    health_insurance_company: 'ozp' as const,
    has_employees: false,
    created_at: '2025-01-01T00:00:00Z',
    status: 'active' as ClientStatus,
    reliability_score: 3 as 0 | 1 | 2 | 3,  // Spolehlivý
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
    vat_period: 'monthly' as const,
    street: 'Stavební 30',
    city: 'Ústí nad Labem',
    zip: '400 00',
    bank_account: '369369369/0100',
    has_employees: true,
    employee_count: 32,
    data_box: { id: 'hij9012', login: 'hij_con' },
    created_at: '2025-01-01T00:00:00Z',
    status: 'active' as ClientStatus,
    reliability_score: 2 as 0 | 1 | 2 | 3,  // Normální
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
    vat_period: 'quarterly' as const,
    street: 'Restaurační 12',
    city: 'Třebíč',
    zip: '674 00',
    bank_account: '741741741/0100',
    has_employees: true,
    employee_count: 6,
    data_box: { id: 'klm3456' },
    created_at: '2025-01-01T00:00:00Z',
    status: 'active' as ClientStatus,
    reliability_score: 3 as 0 | 1 | 2 | 3,  // Spolehlivý
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
    vat_period: null,
    street: 'Mediální 7',
    city: 'Havířov',
    zip: '736 00',
    bank_account: '852852852/0100',
    health_insurance_company: 'zpmv' as const,
    has_employees: false,
    data_box: { id: 'nop7890' },
    created_at: '2025-01-01T00:00:00Z',
    status: 'active' as ClientStatus,
    reliability_score: 2 as 0 | 1 | 2 | 3,  // Normální
  },
  // ===== KLIENTI V ONBOARDINGU =====
  {
    id: 'company-onb-1',
    owner_id: 'user-1-client',
    assigned_accountant_id: 'user-2-accountant',
    name: 'Fresh Start s.r.o.',
    ico: '99001122',
    legal_form: 's.r.o.' as const,
    vat_payer: false,
    vat_period: null,
    street: 'Nová 1',
    city: 'Praha',
    zip: '110 00',
    has_employees: false,
    created_at: '2025-12-10T00:00:00Z',
    status: 'onboarding' as ClientStatus,
    onboarding: {
      status: 'onboarding' as ClientStatus,
      started_at: '2025-12-10T00:00:00Z',
      last_activity_at: '2025-12-20T14:30:00Z',
      assigned_to: 'user-2-accountant',
      assigned_to_name: 'Jana Svobodová',
      priority: 'high' as const,
      is_new_company_setup: true,
      steps: DEFAULT_ONBOARDING_STEPS.map((step, i) => ({
        ...step,
        completed: i < 5, // Prvních 5 kroků hotovo
        completed_at: i < 5 ? '2025-12-15T10:00:00Z' : undefined,
        completed_by: i < 5 ? 'Jana Svobodová' : undefined,
        order: i,
      })),
      notes: [
        {
          id: 'note-1',
          content: 'Klient zakládá nové s.r.o., čekáme na výpis z OR.',
          created_at: '2025-12-12T09:00:00Z',
          created_by: 'user-2-accountant',
          created_by_name: 'Jana Svobodová',
        },
        {
          id: 'note-2',
          content: 'OR výpis doručen, pokračujeme s datovou schránkou.',
          created_at: '2025-12-18T11:30:00Z',
          created_by: 'user-2-accountant',
          created_by_name: 'Jana Svobodová',
        },
      ],
    },
  },
  {
    id: 'company-onb-2',
    owner_id: 'user-1-client',
    assigned_accountant_id: 'user-2-accountant',
    name: 'Kováčová Marie - OSVČ',
    ico: '88112233',
    legal_form: 'OSVČ' as const,
    vat_payer: false,
    vat_period: null,
    street: 'Řemeslnická 45',
    city: 'Brno',
    zip: '602 00',
    health_insurance_company: 'vzp' as const,
    has_employees: false,
    phone: '+420 604 555 666',
    email: 'marie.kovacova@email.cz',
    created_at: '2025-12-01T00:00:00Z',
    status: 'onboarding' as ClientStatus,
    onboarding: {
      status: 'onboarding' as ClientStatus,
      started_at: '2025-12-01T00:00:00Z',
      last_activity_at: '2025-12-15T16:00:00Z', // 8 dní bez aktivity - zaseklé!
      assigned_to: 'user-2-accountant',
      assigned_to_name: 'Jana Svobodová',
      priority: 'medium' as const,
      previous_accountant: 'Účetnictví Nováková',
      takeover_date: '2025-01-01',
      steps: DEFAULT_ONBOARDING_STEPS.map((step, i) => ({
        ...step,
        completed: i < 3, // Pouze 3 kroky hotovo
        completed_at: i < 3 ? '2025-12-10T10:00:00Z' : undefined,
        completed_by: i < 3 ? 'Jana Svobodová' : undefined,
        order: i,
      })),
      notes: [
        {
          id: 'note-3',
          content: 'Převzetí od Účetnictví Nováková. Klientka má zájem od ledna.',
          created_at: '2025-12-05T10:00:00Z',
          created_by: 'user-2-accountant',
          created_by_name: 'Jana Svobodová',
        },
      ],
    },
  },
]

// Mock zaměstnanci
export const mockEmployees: Employee[] = [
  // Zaměstnanci pro ABC s.r.o. (company-1) - 5 zaměstnanců
  {
    id: 'emp-1',
    company_id: 'company-1',
    first_name: 'Jan',
    last_name: 'Procházka',
    birth_date: '1985-03-15',
    personal_id: '850315/1234',
    email: 'jan.prochazka@abc-sro.cz',
    phone: '+420 777 111 222',
    address: 'Květná 45, 110 00 Praha 1',
    position: 'Programátor',
    employment_start: '2020-01-15',
    employment_end: null,
    contract_type: 'hpp',
    wage_type: 'fixed',
    base_salary: 55000,
    health_insurance: '111',
    social_insurance: true,
    tax_declaration: true,
    tax_bonus_children: 2,
    disability_level: 0,
    student: false,
    deductions: [],
    bank_account: '1234567890/0100',
    notes: 'Senior developer, team lead',
    created_at: '2020-01-15T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    active: true,
  },
  {
    id: 'emp-2',
    company_id: 'company-1',
    first_name: 'Marie',
    last_name: 'Dvořáková',
    birth_date: '1990-07-22',
    email: 'marie.dvorakova@abc-sro.cz',
    phone: '+420 777 222 333',
    position: 'Účetní',
    employment_start: '2021-03-01',
    employment_end: null,
    contract_type: 'hpp',
    wage_type: 'fixed',
    base_salary: 42000,
    health_insurance: '207',
    social_insurance: true,
    tax_declaration: true,
    tax_bonus_children: 1,
    disability_level: 0,
    student: false,
    deductions: [],
    bank_account: '9876543210/0300',
    created_at: '2021-03-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    active: true,
  },
  {
    id: 'emp-3',
    company_id: 'company-1',
    first_name: 'Petr',
    last_name: 'Horák',
    birth_date: '1978-11-08',
    email: 'petr.horak@abc-sro.cz',
    phone: '+420 777 333 444',
    position: 'Obchodní zástupce',
    employment_start: '2019-06-01',
    employment_end: null,
    contract_type: 'hpp',
    wage_type: 'fixed',
    base_salary: 38000,
    health_insurance: '111',
    social_insurance: true,
    tax_declaration: true,
    tax_bonus_children: 0,
    disability_level: 0,
    student: false,
    deductions: [
      {
        id: 'ded-1',
        type: 'exekuce',
        description: 'Exekuce - nesplacený úvěr',
        amount: 5000,
        is_percentage: false,
        priority: 1,
        creditor: 'Exekutorský úřad Praha 5',
        reference_number: '123 EX 456/2023',
        start_date: '2023-06-01',
        end_date: null,
        active: true,
      }
    ],
    bank_account: '5555666677/0800',
    notes: 'Má exekuci - srážka 5000 Kč měsíčně',
    created_at: '2019-06-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    active: true,
  },
  {
    id: 'emp-4',
    company_id: 'company-1',
    first_name: 'Lucie',
    last_name: 'Malá',
    birth_date: '1995-02-14',
    email: 'lucie.mala@abc-sro.cz',
    position: 'Asistentka',
    employment_start: '2024-01-15',
    employment_end: null,
    contract_type: 'hpp',
    wage_type: 'hourly',
    base_salary: 0,
    hourly_rate: 180,
    health_insurance: '205',
    social_insurance: true,
    tax_declaration: true,
    tax_bonus_children: 0,
    disability_level: 0,
    student: true,
    deductions: [],
    bank_account: '1111222233/0100',
    notes: 'Částečný úvazek, studentka VŠE',
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    active: true,
  },
  {
    id: 'emp-5',
    company_id: 'company-1',
    first_name: 'Tomáš',
    last_name: 'Veselý',
    birth_date: '1982-09-30',
    email: 'tomas.vesely@abc-sro.cz',
    phone: '+420 777 555 666',
    position: 'Skladník',
    employment_start: '2022-08-01',
    employment_end: null,
    contract_type: 'hpp',
    wage_type: 'fixed',
    base_salary: 32000,
    health_insurance: '211',
    social_insurance: true,
    tax_declaration: true,
    tax_bonus_children: 3,
    disability_level: 0,
    student: false,
    deductions: [
      {
        id: 'ded-2',
        type: 'alimenty',
        description: 'Výživné na 2 děti',
        amount: 6000,
        is_percentage: false,
        priority: 1,
        creditor: 'Jana Veselá',
        start_date: '2022-01-01',
        end_date: null,
        active: true,
      }
    ],
    bank_account: '7777888899/0600',
    notes: 'Platí alimenty 6000 Kč',
    created_at: '2022-08-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    active: true,
  },

  // Zaměstnanci pro BCD Finance (company-11) - 3 zaměstnanci
  {
    id: 'emp-11-1',
    company_id: 'company-11',
    first_name: 'Eva',
    last_name: 'Černá',
    birth_date: '1988-04-12',
    email: 'eva.cerna@bcdfinance.cz',
    phone: '+420 602 123 456',
    position: 'Finanční analytik',
    employment_start: '2021-02-01',
    employment_end: null,
    contract_type: 'hpp',
    wage_type: 'fixed',
    base_salary: 65000,
    health_insurance: '111',
    social_insurance: true,
    tax_declaration: true,
    tax_bonus_children: 1,
    disability_level: 0,
    student: false,
    deductions: [],
    bank_account: '9999000011/0100',
    created_at: '2021-02-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    active: true,
  },
  {
    id: 'emp-11-2',
    company_id: 'company-11',
    first_name: 'Martin',
    last_name: 'Svoboda',
    birth_date: '1975-12-03',
    email: 'martin.svoboda@bcdfinance.cz',
    phone: '+420 602 789 012',
    position: 'Vedoucí oddělení',
    employment_start: '2018-09-01',
    employment_end: null,
    contract_type: 'hpp',
    wage_type: 'fixed',
    base_salary: 85000,
    health_insurance: '207',
    social_insurance: true,
    tax_declaration: true,
    tax_bonus_children: 2,
    disability_level: 0,
    student: false,
    deductions: [
      {
        id: 'ded-11-1',
        type: 'insolvence',
        description: 'Osobní insolvence',
        amount: 30,
        is_percentage: true,
        priority: 1,
        creditor: 'Insolvenční správce',
        reference_number: 'KSOS 38 INS 12345/2022',
        start_date: '2022-06-01',
        end_date: '2027-06-01',
        active: true,
      }
    ],
    notes: 'V osobní insolvenci do 06/2027',
    created_at: '2018-09-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    active: true,
  },
  {
    id: 'emp-11-3',
    company_id: 'company-11',
    first_name: 'Kateřina',
    last_name: 'Nová',
    birth_date: '1992-06-28',
    position: 'Recepční',
    employment_start: '2024-03-01',
    employment_end: null,
    contract_type: 'dpc',
    wage_type: 'hourly',
    base_salary: 0,
    hourly_rate: 165,
    health_insurance: '111',
    social_insurance: true,
    tax_declaration: false,
    tax_bonus_children: 0,
    disability_level: 0,
    student: false,
    deductions: [],
    bank_account: '1234509876/0300',
    notes: 'DPČ - max 20h týdně',
    created_at: '2024-03-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    active: true,
  },
]

// Helper pro získání zaměstnanců firmy
export function getEmployeesByCompany(companyId: string): Employee[] {
  return mockEmployees.filter(e => e.company_id === companyId && e.active)
}

// Generovat monthly_closures pro každou firmu × 12 měsíců × roky (2025, 2026)
const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
const years = [2025, 2026]
const statusOptions = ['missing', 'uploaded', 'approved'] as const

// Aktuální datum pro výpočet stavů
const currentDate = new Date()
const currentYear = currentDate.getFullYear()
const currentMonth = currentDate.getMonth() // 0-indexed

export const mockMonthlyClosures = mockCompanies.flatMap((company, companyIndex) =>
  years.flatMap(year =>
    months.map((month, monthIndex) => {
      let bankStatus: typeof statusOptions[number]
      let expenseStatus: typeof statusOptions[number]
      let incomeStatus: typeof statusOptions[number]

      // Logika podle roku a měsíce
      if (year < currentYear) {
        // Minulé roky = vše schváleno
        bankStatus = 'approved'
        expenseStatus = 'approved'
        incomeStatus = 'approved'
      } else if (year === currentYear) {
        // Aktuální rok 2025
        if (monthIndex < currentMonth - 1) {
          // Měsíce dávno za námi = schváleno
          bankStatus = 'approved'
          expenseStatus = 'approved'
          incomeStatus = 'approved'
        } else if (monthIndex === currentMonth - 1) {
          // Minulý měsíc (listopad) = deadline 10.12. prošel - některé firmy mají problém
          if (companyIndex === 2) {
            // DEF s.r.o. - chybí výpis i náklady
            bankStatus = 'missing'
            expenseStatus = 'missing'
            incomeStatus = 'uploaded'
          } else if (companyIndex === 7) {
            // STU Marketing - chybí příjmy
            bankStatus = 'approved'
            expenseStatus = 'approved'
            incomeStatus = 'missing'
          } else if (companyIndex === 10) {
            // BCD Finance - vše nahráno, čeká na schválení
            bankStatus = 'uploaded'
            expenseStatus = 'uploaded'
            incomeStatus = 'uploaded'
          } else {
            bankStatus = 'approved'
            expenseStatus = 'approved'
            incomeStatus = 'approved'
          }
        } else if (monthIndex === currentMonth) {
          // Aktuální měsíc (prosinec) = aktuální práce, deadline 10.1.
          if (companyIndex === 0) {
            bankStatus = 'missing'
            expenseStatus = 'uploaded'
            incomeStatus = 'approved'
          } else if (companyIndex === 1) {
            bankStatus = 'approved'
            expenseStatus = 'missing'
            incomeStatus = 'missing'
          } else if (companyIndex === 3) {
            bankStatus = 'approved'
            expenseStatus = 'missing'
            incomeStatus = 'uploaded'
          } else if (companyIndex === 5) {
            bankStatus = 'missing'
            expenseStatus = 'approved'
            incomeStatus = 'approved'
          } else if (companyIndex === 6) {
            bankStatus = 'uploaded'
            expenseStatus = 'uploaded'
            incomeStatus = 'uploaded'
          } else if (companyIndex === 8) {
            bankStatus = 'approved'
            expenseStatus = 'uploaded'
            incomeStatus = 'uploaded'
          } else if (companyIndex === 10) {
            // BCD Finance - prosinec: chybí všechno
            bankStatus = 'missing'
            expenseStatus = 'missing'
            incomeStatus = 'missing'
          } else if (companyIndex === 11) {
            bankStatus = 'uploaded'
            expenseStatus = 'approved'
            incomeStatus = 'missing'
          } else if (companyIndex === 13) {
            bankStatus = 'uploaded'
            expenseStatus = 'uploaded'
            incomeStatus = 'uploaded'
          } else if (companyIndex < 10) {
            bankStatus = 'uploaded'
            expenseStatus = 'uploaded'
            incomeStatus = 'uploaded'
          } else {
            bankStatus = 'approved'
            expenseStatus = 'approved'
            incomeStatus = 'approved'
          }
        } else {
          // Budoucí měsíce v aktuálním roce = missing (ještě nezačalo)
          bankStatus = 'missing'
          expenseStatus = 'missing'
          incomeStatus = 'missing'
        }
      } else {
        // Budoucí rok 2026 = vše missing
        bankStatus = 'missing'
        expenseStatus = 'missing'
        incomeStatus = 'missing'
      }

      const status = bankStatus === 'missing' || expenseStatus === 'missing' || incomeStatus === 'missing'
        ? 'missing'
        : bankStatus === 'uploaded' || expenseStatus === 'uploaded' || incomeStatus === 'uploaded'
          ? 'uploaded'
          : 'approved'

      return {
        id: `closure-${company.id}-${year}-${month}`,
        company_id: company.id,
        period: `${year}-${month}`,
        status: 'open' as const,
        bank_statement_status: bankStatus,
        expense_documents_status: expenseStatus,
        income_invoices_status: incomeStatus,
        vat_payable: status === 'approved' ? Math.floor(Math.random() * 50000) : null,
        income_tax_accrued: status === 'approved' ? Math.floor(Math.random() * 15000) : null,
        social_insurance: status === 'approved' && company.legal_form === 'OSVČ' ? 2500 : null,
        health_insurance: status === 'approved' && company.legal_form === 'OSVČ' ? 2000 : null,
        reminder_count: status === 'missing' ? Math.floor(Math.random() * 3) : 0,
        last_reminder_sent_at: status === 'missing' ? `${year}-12-20T10:00:00Z` : null,
        notes: null,
        created_at: `${year}-${month}-01T00:00:00Z`,
        updated_at: `${year}-${month}-15T00:00:00Z`,
      }
    })
  )
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
export type TaskStatus =
  | 'pending'           // Inbox - nový, netříděný
  | 'clarifying'        // Inbox - vyžaduje upřesnění
  | 'accepted'          // K práci - přijato
  | 'in_progress'       // Probíhá - pracuje se
  | 'waiting_for'       // Čeká interně
  | 'waiting_client'    // Čeká na klienta
  | 'awaiting_approval' // Čeká na schválení manažerem
  | 'completed'         // Hotovo (schváleno)
  | 'invoiced'          // Vyfakturováno
  | 'cancelled'         // Zrušeno
  | 'someday_maybe'     // Někdy/Možná

export type TaskType = 'base' | 'bonus'
export type GTDContext = '@email' | '@telefon' | '@pocitac' | '@kancelar' | '@meeting' | '@anywhere'
export type EnergyLevel = 'high' | 'medium' | 'low'

// ============================================
// TIME LOGGING
// ============================================
export type ActivityType = 'task' | 'general' | 'admin' | 'meeting' | 'call' | 'email'

export interface TimeLog {
  id: string
  task_id?: string       // Optional - null for non-task time
  user_id: string
  user_name: string
  client_id?: string     // For non-task time logs
  client_name?: string
  activity_type: ActivityType
  date: string           // YYYY-MM-DD
  minutes: number
  description: string
  is_billable: boolean
  created_at: string
}

// ============================================
// USER TASK SETTINGS (WIP limits, quality)
// ============================================
export interface UserTaskSettings {
  user_id: string
  user_name: string

  // WIP Limits (nastavuje admin)
  max_wip_total: number       // Max rozpracovaných celkem
  max_wip_bonus: number       // Max rozpracovaných BONUS úkolů
  can_claim_bonus: boolean    // Může claimovat bonus úkoly?

  // Quality Score (skrytý, počítá systém)
  quality_score: number       // 0-100, účetní nevidí
  quality_factors: {
    on_time_rate: number      // % úkolů dokončených včas
    no_rejection_rate: number // % úkolů bez vrácení
    estimate_accuracy: number // Přesnost odhadů
  }

  // Monthly Stats
  current_month: string       // YYYY-MM
  monthly_base_required: number
  monthly_base_completed: number
  monthly_bonus_points: number
  monthly_bonus_cashed_out: boolean
}

// ============================================
// TASK APPROVAL
// ============================================
export interface TaskApproval {
  id: string
  task_id: string
  action: 'approved' | 'rejected'
  by_user_id: string
  by_user_name: string
  comment?: string
  created_at: string
}

// ============================================
// SYSTEM SETTINGS (admin configurable)
// ============================================
export interface TaskSystemSettings {
  monthly_cutoff_day: number        // Default: 5
  approval_deadline_hours: number   // Default: 24
  min_quality_for_bonus: number     // Default: 80
  points_to_currency_rate: number   // Default: 1 (1 bod = 1 Kč)
}

// ============================================
// CLIENT REQUESTS (požadavky od klientů)
// ============================================
export type ClientRequestStatus = 'new' | 'reviewed' | 'in_progress' | 'completed' | 'rejected'
export type ClientRequestPriority = 'low' | 'normal' | 'high' | 'urgent'
export type ClientRequestCategory = 'accounting' | 'tax' | 'payroll' | 'consulting' | 'documents' | 'other'

export interface ClientRequest {
  id: string
  client_id: string
  client_name: string

  // Request details
  title: string
  description: string
  category: ClientRequestCategory
  priority: ClientRequestPriority
  status: ClientRequestStatus

  // Attachments (file URLs)
  attachments?: string[]

  // Assignment
  assigned_to?: string      // user_id
  assigned_to_name?: string

  // Related task (if request was converted to task)
  related_task_id?: string

  // Dates
  requested_by_date?: string  // Client's requested deadline
  created_at: string
  updated_at: string
  resolved_at?: string

  // Communication
  internal_notes?: string     // Not visible to client
  response_to_client?: string // Visible to client
}

// ============================================
// PROJECT (kontejner pro fáze a úkoly)
// ============================================
export type ProjectType = 'recurring' | 'one_time' | 'ongoing'
export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'review' | 'completed' | 'cancelled'

export interface Project {
  id: string
  title: string
  description?: string
  outcome: string                    // GTD: Požadovaný výsledek

  // Vztah ke klientovi
  company_id: string
  company_name: string

  // Typ projektu
  project_type: ProjectType

  // Pro opakující se projekty
  recurrence?: {
    pattern: 'monthly' | 'quarterly' | 'yearly'
    period_label: string             // "12/2024", "Q4/2024", "2024"
    template_id?: string
  }

  // Časové rozpětí
  start_date?: string
  target_date: string
  actual_end_date?: string

  // Stav
  status: ProjectStatus

  // Vlastnictví
  owner_id: string
  owner_name: string
  team_ids: string[]
  team_names: string[]

  // GTD
  next_action_id?: string
  is_someday_maybe: boolean

  // Priority (dědí se do úkolů projektu)
  priority?: 0 | 1 | 2 | 3  // 0=low, 1=normal, 2=high, 3=critical

  // Finance
  is_billable: boolean
  budget_hours?: number
  hourly_rate?: number

  // Počítané hodnoty
  total_tasks?: number
  completed_tasks?: number
  progress_percent?: number

  // Tracking
  created_at: string
  updated_at: string
}

// ============================================
// PHASE (fáze v projektu)
// ============================================
export type PhaseStatus = 'pending' | 'active' | 'completed'

export interface Phase {
  id: string
  project_id: string

  title: string
  description?: string
  position: number                   // Pořadí v projektu (1, 2, 3...)

  // Stav
  status: PhaseStatus

  // Časový rámec (volitelný)
  start_date?: string
  target_date?: string

  // Počítané hodnoty
  total_tasks?: number
  completed_tasks?: number
  progress_percent?: number

  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  title: string
  description: string

  // === HIERARCHIE (volitelné - NULL = volný úkol) ===
  project_id?: string               // ID projektu
  project_name?: string
  phase_id?: string                 // ID fáze v projektu
  phase_name?: string
  position_in_phase?: number        // Pořadí ve fázi

  // === ZÁVISLOSTI ===
  depends_on_task_ids?: string[]    // Úkoly které musí být hotové první
  is_blocked?: boolean              // Computed: má nesplněné závislosti?

  // === GTD FLAGS ===
  is_next_action?: boolean          // Toto je Next Action projektu

  // === LEGACY (zpětná kompatibilita) ===
  is_project: boolean               // DEPRECATED: použij Project entitu
  project_outcome?: string          // DEPRECATED
  parent_project_id?: string        // DEPRECATED: použij project_id

  // Workflow
  status: TaskStatus

  // === GAMIFICATION: Task Type ===
  task_type?: TaskType            // 'base' (default) | 'bonus'
  points_value?: number           // Bodová hodnota (jen pro bonus, nastavuje admin)

  // === GAMIFICATION: Claim (pro bonus úkoly) ===
  claimed_by?: string             // User ID kdo si claimnul
  claimed_by_name?: string
  claimed_at?: string

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

  // === GAMIFICATION: Time Tracking ===
  estimated_minutes?: number      // Odhad při vytvoření (LOCKED po vytvoření)
  estimate_locked?: boolean       // true = nelze měnit estimate (default: true po vytvoření)
  actual_minutes?: number         // Skutečný čas (vyplní se před uzavřením)

  // Billing
  is_billable: boolean
  hourly_rate?: number

  // Metadata
  tags?: string[]
  progress_percentage?: number

  // R-Tasks Scoring System (0-12 total)
  score_money?: 0 | 1 | 2 | 3        // 0 = <5k, 1 = 5k+, 2 = 15k+, 3 = 50k+ Kč
  score_fire?: 0 | 1 | 2 | 3         // 0 = Easy, 1 = Normal, 2 = High, 3 = Critical
  score_time?: 0 | 1 | 2 | 3         // 0 = den+, 1 = 2-4h, 2 = <1h, 3 = <30min
  score_distance?: 0 | 1 | 2         // 0 = Daleko, 1 = Lokálně, 2 = PC
  score_personal?: 0 | 1             // 0 = Poor, 1 = Good

  // === GAMIFICATION: Approval ===
  approved_by?: string
  approved_by_name?: string
  approved_at?: string
  rejected_by?: string
  rejected_by_name?: string
  rejected_at?: string
  rejection_comment?: string
  rejection_count?: number          // Kolikrát byl úkol vrácen (default: 0)

  // === URGENCY & ESCALATION ===
  urgency_count?: number            // Kolikrát bylo urgováno (0-5)
  last_urged_at?: string            // Datum poslední urgence
  escalated_to?: string             // ID manažera (pokud eskalováno)
  escalated_at?: string             // Kdy eskalováno
  escalation_reason?: string        // Důvod eskalace
  auto_notifications_sent?: number  // Počet automatických notifikací

  // Timestamps
  created_at: string
  updated_at: string
  completed_at?: string
}

// Mock tasks pro účetní s GTD kategoriemi
export const mockTasks: Task[] = [
  // QUICK ACTIONS (< 2 min) - PO TERMÍNU
  {
    id: 'task-1',
    title: 'Zaslat připomínku emailem',
    description: 'Poslat automatický email klientovi ABC s.r.o. o chybějícím výpisu',
    is_project: false,
    status: 'pending',
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    assigned_to: 'user-2-accountant',
    assigned_to_name: 'Jana Svobodová',
    is_waiting_for: false,
    due_date: MOCK_DATES.OVERDUE_2_DAYS, // PO TERMÍNU
    due_time: '14:00',
    company_id: 'company-1',
    company_name: 'ABC s.r.o.',
    gtd_context: ['@email'],
    gtd_energy_level: 'low',
    gtd_is_quick_action: true,
    estimated_minutes: 2,
    is_billable: false,
    tags: ['email', 'urgence'],
    // R-Tasks Score: 7 (střední priorita)
    score_money: 1,      // 5k+ potenciál
    score_fire: 2,       // High urgency
    score_time: 3,       // <30min
    score_distance: 2,   // PC
    score_personal: 1,   // Good
    created_at: '2025-12-06T10:00:00Z',
    updated_at: '2025-12-06T10:00:00Z',
  },
  {
    id: 'task-2',
    title: 'Zavolat klientovi - potvrzení schůzky',
    description: 'Rychlý telefonát klientovi XYZ OSVČ pro potvrzení zítřejší schůzky',
    is_project: false,
    status: 'pending',
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    assigned_to: 'user-2-accountant',
    assigned_to_name: 'Jana Svobodová',
    is_waiting_for: false,
    due_date: MOCK_DATES.TODAY, // DNES
    due_time: '10:00',
    company_id: 'company-2',
    company_name: 'XYZ OSVČ',
    gtd_context: ['@telefon'],
    gtd_energy_level: 'low',
    gtd_is_quick_action: true,
    estimated_minutes: 2,
    is_billable: false,
    tags: ['telefon', 'schuzka'],
    // R-Tasks Score: 6 (střední priorita)
    score_money: 0,      // <5k
    score_fire: 1,       // Normal
    score_time: 3,       // <30min
    score_distance: 2,   // PC (telefonovat můžu odkudkoliv)
    score_personal: 0,   // Poor (nerad volám)
    created_at: '2025-12-06T09:00:00Z',
    updated_at: '2025-12-06T09:00:00Z',
  },

  // URGENTNÍ (overdue nebo deadline dnes/zítra)
  {
    id: 'task-3',
    title: 'DPH přiznání - listopad 2025',
    description: 'URGENTNÍ: Podat DPH přiznání. Deadline blíží!',
    is_project: false,
    status: 'in_progress',
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    assigned_to: 'user-2-accountant',
    assigned_to_name: 'Jana Svobodová',
    is_waiting_for: false,
    due_date: MOCK_DATES.TOMORROW, // ZÍTRA
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
    // R-Tasks Score: 11 (vysoká priorita!)
    score_money: 3,      // 50k+ hodnota (DPH = velké částky)
    score_fire: 3,       // Critical - deadline!
    score_time: 1,       // 2-4 hodiny práce
    score_distance: 2,   // PC
    score_personal: 1,   // Good (důležité)
    created_at: '2025-12-01T08:00:00Z',
    updated_at: '2025-12-06T14:30:00Z',
  },
  {
    id: 'task-4',
    title: 'Chybí bankovní výpis - PO TERMÍNU!',
    description: 'Klient dosud nenahrál výpis za listopad. Už po termínu!',
    is_project: false,
    status: 'pending',
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    assigned_to: 'user-2-accountant',
    assigned_to_name: 'Jana Svobodová',
    is_waiting_for: false,
    due_date: MOCK_DATES.OVERDUE_3_DAYS, // PO TERMÍNU - 3 DNY
    due_time: '17:00',
    company_id: 'company-1',
    company_name: 'ABC s.r.o.',
    gtd_context: ['@email', '@telefon'],
    gtd_energy_level: 'medium',
    gtd_is_quick_action: false,
    estimated_minutes: 15,
    is_billable: false,
    tags: ['urgence', 'dokumenty'],
    // R-Tasks Score: 8 (střední-vysoká priorita)
    score_money: 2,      // 15k+ hodnota (bankovní výpisy důležité)
    score_fire: 3,       // Critical - deadline dnes!
    score_time: 2,       // <1h práce
    score_distance: 2,   // PC
    score_personal: 0,   // Poor (administrativní práce)
    // === URGENCY DATA ===
    urgency_count: 2,                        // Urgováno 2×
    last_urged_at: '2025-12-24T10:00:00Z',   // Poslední urgence před 2 dny
    auto_notifications_sent: 3,              // Systém poslal 3 automatické notifikace
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
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    assigned_to: 'user-2-accountant',
    assigned_to_name: 'Jana Svobodová',
    is_waiting_for: true,
    waiting_for_who: 'Petr Svoboda (TechSolutions)',
    waiting_for_what: 'Podepsaná smlouva o vedení účetnictví',
    due_date: MOCK_DATES.IN_2_DAYS, // za 2 dny
    company_id: 'company-3',
    company_name: 'DEF s.r.o.',
    gtd_context: ['@anywhere'],
    gtd_energy_level: 'low',
    gtd_is_quick_action: false,
    estimated_minutes: 5,
    is_billable: false,
    tags: ['smlouva', 'waiting'],
    // R-Tasks Score: 5 (nižší priorita - čekáme)
    score_money: 1,      // 5k+ hodnota
    score_fire: 1,       // Normal
    score_time: 3,       // <30min (jen kontrola)
    score_distance: 2,   // PC
    score_personal: 0,   // Poor
    // === URGENCY DATA - ESKALOVÁNO! ===
    urgency_count: 3,                        // Urgováno 3× - dosažen limit
    last_urged_at: '2025-12-22T14:00:00Z',   // Poslední urgence před 4 dny
    escalated_to: 'user-3-manager',          // Eskalováno na manažera
    escalated_at: '2025-12-23T09:00:00Z',    // Kdy eskalováno
    escalation_reason: 'Klient nereaguje na opakované výzvy k podpisu smlouvy',
    auto_notifications_sent: 5,              // 5 automatických notifikací
    created_at: '2025-12-03T11:00:00Z',
    updated_at: '2025-12-03T11:00:00Z',
  },
  {
    id: 'task-6',
    title: 'Čeká na údaje z Pohody',
    description: 'Požádáno klienta o export dat z účetního systému Pohoda. Čeká na dodání.',
    is_project: false,
    status: 'waiting_for',
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    assigned_to: 'user-2-accountant',
    assigned_to_name: 'Jana Svobodová',
    is_waiting_for: true,
    waiting_for_who: 'Eva Malá (Green Energy)',
    waiting_for_what: 'Export dat z Pohoda za Q4 2025',
    due_date: MOCK_DATES.IN_5_DAYS, // za 5 dní
    company_id: 'company-5',
    company_name: 'JKL Consulting',
    gtd_context: ['@anywhere'],
    gtd_energy_level: 'low',
    gtd_is_quick_action: false,
    estimated_minutes: 10,
    is_billable: true,
    hourly_rate: 800,
    tags: ['pohoda', 'export', 'waiting'],
    // R-Tasks Score: 6 (střední priorita - čekáme)
    score_money: 2,      // 15k+ hodnota (Q4 data)
    score_fire: 1,       // Normal
    score_time: 2,       // <1h práce po dodání
    score_distance: 2,   // PC
    score_personal: 0,   // Poor
    // === URGENCY DATA ===
    urgency_count: 1,                        // Urgováno 1× (čerstvé)
    last_urged_at: '2025-12-25T10:00:00Z',   // Včera
    auto_notifications_sent: 2,              // 2 automatické notifikace
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
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    assigned_to: 'user-2-accountant',
    assigned_to_name: 'Jana Svobodová',
    is_waiting_for: false,
    due_date: MOCK_DATES.OVERDUE_1_DAY,
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
    // R-Tasks Score: 9 (vysoká priorita)
    score_money: 2,      // 15k+ hodnota (faktury = peníze)
    score_fire: 2,       // High urgency
    score_time: 2,       // <1h práce
    score_distance: 2,   // PC
    score_personal: 1,   // Good (důležité)
    created_at: '2025-12-05T09:15:00Z',
    updated_at: '2025-12-06T10:00:00Z',
  },
  {
    id: 'task-8',
    title: 'Zkontrolovat příjmové faktury',
    description: 'Ověřit správnost 3 nových příjmových faktur a zaúčtovat',
    is_project: false,
    status: 'pending',
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    assigned_to: 'user-2-accountant',
    assigned_to_name: 'Jana Svobodová',
    is_waiting_for: false,
    due_date: MOCK_DATES.IN_3_DAYS,
    company_id: 'company-5',
    company_name: 'JKL Consulting',
    gtd_context: ['@pocitac'],
    gtd_energy_level: 'medium',
    gtd_is_quick_action: false,
    estimated_minutes: 45,
    is_billable: true,
    hourly_rate: 1000,
    tags: ['faktury', 'kontrola'],
    // R-Tasks Score: 8 (střední-vysoká priorita)
    score_money: 2,      // 15k+ hodnota
    score_fire: 1,       // Normal
    score_time: 2,       // <1h práce
    score_distance: 2,   // PC
    score_personal: 1,   // Good
    created_at: '2025-12-06T16:20:00Z',
    updated_at: '2025-12-06T16:20:00Z',
  },
  {
    id: 'task-9',
    title: 'Připravit podklady pro roční závěrku',
    description: 'Sběr a kontrola všech dokumentů potřebných pro roční závěrku 2025',
    is_project: false,
    status: 'pending',
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    assigned_to: 'user-2-accountant',
    assigned_to_name: 'Jana Svobodová',
    is_waiting_for: false,
    due_date: MOCK_DATES.IN_7_DAYS,
    company_id: 'company-9',
    company_name: 'VWX Logistics s.r.o.',
    gtd_context: ['@pocitac', '@kancelar'],
    gtd_energy_level: 'high',
    gtd_is_quick_action: false,
    estimated_minutes: 180,
    is_billable: true,
    hourly_rate: 1200,
    tags: ['rocni-uzaverka', 'podklady'],
    // R-Tasks Score: 10 (vysoká priorita)
    score_money: 3,      // 50k+ hodnota (roční uzávěrka)
    score_fire: 2,       // High (deadline se blíží)
    score_time: 0,       // den+ práce
    score_distance: 2,   // PC
    score_personal: 1,   // Good (důležité)
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
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    assigned_to: 'user-2-accountant',
    assigned_to_name: 'Jana Svobodová',
    is_waiting_for: false,
    due_date: MOCK_DATES.END_OF_MONTH,
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
    // R-Tasks Score: 9 (vysoká priorita - projekt)
    score_money: 3,      // 50k+ hodnota (velký projekt)
    score_fire: 1,       // Normal (deadline ještě daleko)
    score_time: 0,       // den+ práce (projekt)
    score_distance: 1,   // Lokálně (potřeba schůzky)
    score_personal: 1,   // Good (zajímavý projekt)
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
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    assigned_to: 'user-2-accountant',
    assigned_to_name: 'Jana Svobodová',
    is_waiting_for: false,
    due_date: MOCK_DATES.IN_5_DAYS,
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
    // R-Tasks Score: 12 (maximální priorita!)
    score_money: 3,      // 50k+ hodnota (daňová kontrola = riziko)
    score_fire: 3,       // Critical (brzy deadline)
    score_time: 0,       // den+ práce
    score_distance: 2,   // PC
    score_personal: 1,   // Good (důležité)
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
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    assigned_to: 'user-2-accountant',
    assigned_to_name: 'Jana Svobodová',
    is_waiting_for: false,
    due_date: MOCK_DATES.END_OF_NEXT_MONTH,
    company_id: 'company-1',
    company_name: 'ABC s.r.o.',
    gtd_context: ['@pocitac'],
    gtd_energy_level: 'medium',
    gtd_is_quick_action: false,
    estimated_minutes: 120,
    is_billable: false,
    tags: ['automatizace', 'vylepseni'],
    // R-Tasks Score: 4 (nízká priorita - someday/maybe)
    score_money: 1,      // 5k+ potenciální hodnota
    score_fire: 0,       // Easy (není urgentní)
    score_time: 0,       // den+ práce
    score_distance: 2,   // PC
    score_personal: 1,   // Good (zajímavé)
    created_at: '2025-11-10T12:00:00Z',
    updated_at: '2025-11-10T12:00:00Z',
  },
  {
    id: 'task-13',
    title: 'Napsat blogpost o DPH změnách 2026',
    description: 'Připravit článek pro klienty o připravovaných změnách v DPH legislativě',
    is_project: false,
    status: 'someday_maybe',
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    assigned_to: 'user-2-accountant',
    assigned_to_name: 'Jana Svobodová',
    is_waiting_for: false,
    due_date: MOCK_DATES.END_OF_NEXT_MONTH,
    company_id: 'company-2',
    company_name: 'XYZ OSVČ',
    gtd_context: ['@pocitac'],
    gtd_energy_level: 'medium',
    gtd_is_quick_action: false,
    estimated_minutes: 90,
    is_billable: false,
    tags: ['content', 'blog'],
    // R-Tasks Score: 4 (nízká priorita - someday/maybe)
    score_money: 0,      // <5k (blog = marketing)
    score_fire: 0,       // Easy (není urgentní)
    score_time: 1,       // 2-4h práce
    score_distance: 2,   // PC
    score_personal: 1,   // Good (kreativní práce)
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
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    assigned_to: 'user-2-accountant',
    assigned_to_name: 'Jana Svobodová',
    is_waiting_for: false,
    due_date: MOCK_DATES.OVERDUE_1_DAY,
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
    // R-Tasks Score: 8 (střední-vysoká priorita - dokončeno)
    score_money: 2,      // 15k+ hodnota
    score_fire: 2,       // High (měsíční povinnost)
    score_time: 1,       // 2-4h práce
    score_distance: 2,   // PC
    score_personal: 1,   // Good
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
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    assigned_to: 'user-2-accountant',
    assigned_to_name: 'Jana Svobodová',
    is_waiting_for: false,
    due_date: MOCK_DATES.OVERDUE_2_DAYS,
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
    // R-Tasks Score: 9 (vysoká priorita - dokončeno)
    score_money: 2,      // 15k+ hodnota
    score_fire: 2,       // High (měsíční povinnost)
    score_time: 1,       // 2-4h práce
    score_distance: 2,   // PC
    score_personal: 1,   // Good
    created_at: '2025-12-01T09:00:00Z',
    updated_at: '2025-12-06T11:30:00Z',
    completed_at: '2025-12-06T11:30:00Z',
  },

  // ============================================
  // COMPANY 11 - BCD Finance - Různé typy úkolů
  // ============================================

  // QUICK ACTION - rychlá akce pod 2 minuty
  {
    id: 'task-bcd-1',
    title: 'Zaslat potvrzení platby',
    description: 'Poslat klientovi email s potvrzením úhrady faktury za listopad',
    is_project: false,
    status: 'pending',
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    assigned_to: 'user-2-accountant',
    assigned_to_name: 'Jana Svobodová',
    is_waiting_for: false,
    due_date: MOCK_DATES.TODAY,
    due_time: '10:00',
    company_id: 'company-11',
    company_name: 'BCD Finance',
    gtd_context: ['@email'],
    gtd_energy_level: 'low',
    gtd_is_quick_action: true,
    estimated_minutes: 2,
    actual_minutes: 0,
    is_billable: false,
    tags: ['email', 'potvrzeni'],
    progress_percentage: 0,
    // R-Tasks Score: 7 (střední priorita - quick action)
    score_money: 0,      // <5k (jen potvrzení)
    score_fire: 1,       // Normal
    score_time: 3,       // <30min
    score_distance: 2,   // PC
    score_personal: 1,   // Good
    created_at: '2025-12-20T08:00:00Z',
    updated_at: '2025-12-20T08:00:00Z',
  },

  // URGENT - kritická priorita, deadline dnes
  {
    id: 'task-bcd-2',
    title: 'DPH přiznání - Q4 2025',
    description: 'URGENTNÍ: Připravit a podat čtvrtletní DPH přiznání. Deadline blíží!',
    is_project: false,
    status: 'in_progress',
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    assigned_to: 'user-2-accountant',
    assigned_to_name: 'Jana Svobodová',
    is_waiting_for: false,
    due_date: MOCK_DATES.TODAY,
    due_time: '23:59',
    company_id: 'company-11',
    company_name: 'BCD Finance',
    gtd_context: ['@pocitac', '@kancelar'],
    gtd_energy_level: 'high',
    gtd_is_quick_action: false,
    estimated_minutes: 180,
    actual_minutes: 60,
    is_billable: true,
    hourly_rate: 1500,
    tags: ['dph', 'deadline', 'urgentni'],
    progress_percentage: 35,
    // R-Tasks Score: 11 (vysoká priorita!)
    score_money: 3,      // 50k+ hodnota (DPH)
    score_fire: 3,       // Critical - deadline!
    score_time: 0,       // den+ práce
    score_distance: 2,   // PC
    score_personal: 1,   // Good
    created_at: '2025-12-15T09:00:00Z',
    updated_at: '2025-12-22T10:30:00Z',
  },

  // IN PROGRESS - rozpracovaný úkol
  {
    id: 'task-bcd-3',
    title: 'Zaúčtovat mzdy - prosinec',
    description: 'Zaúčtování mezd pro 3 zaměstnance včetně srážek a odvodů',
    is_project: false,
    status: 'pending',
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    assigned_to: 'user-2-accountant',
    assigned_to_name: 'Jana Svobodová',
    is_waiting_for: false,
    due_date: MOCK_DATES.IN_3_DAYS,
    company_id: 'company-11',
    company_name: 'BCD Finance',
    gtd_context: ['@pocitac'],
    gtd_energy_level: 'medium',
    gtd_is_quick_action: false,
    estimated_minutes: 90,
    actual_minutes: 35,
    is_billable: true,
    hourly_rate: 1200,
    tags: ['mzdy', 'mesicni'],
    progress_percentage: 40,
    // R-Tasks Score: 8 (střední-vysoká priorita)
    score_money: 2,      // 15k+ hodnota
    score_fire: 2,       // High (měsíční povinnost)
    score_time: 1,       // 2-4h práce
    score_distance: 2,   // PC
    score_personal: 1,   // Good
    created_at: '2025-12-18T08:00:00Z',
    updated_at: '2025-12-21T14:00:00Z',
  },

  // WAITING FOR CLIENT - čeká na podklady od klienta
  {
    id: 'task-bcd-4',
    title: 'Doložit chybějící faktury',
    description: 'Čekáme na dodání 5 faktur za služby od dodavatelů',
    is_project: false,
    status: 'waiting_for',
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    assigned_to: 'user-2-accountant',
    assigned_to_name: 'Jana Svobodová',
    is_waiting_for: true,
    waiting_for_who: 'Klient BCD Finance',
    waiting_for_what: 'Chybějící faktury za IT služby a marketing',
    due_date: MOCK_DATES.IN_5_DAYS,
    company_id: 'company-11',
    company_name: 'BCD Finance',
    gtd_context: ['@email', '@telefon'],
    gtd_energy_level: 'low',
    gtd_is_quick_action: false,
    estimated_minutes: 30,
    actual_minutes: 5,
    is_billable: false,
    tags: ['podklady', 'cekani'],
    progress_percentage: 10,
    // R-Tasks Score: 5 (nižší priorita - čekáme)
    score_money: 1,      // 5k+ hodnota
    score_fire: 1,       // Normal
    score_time: 2,       // <1h práce po dodání
    score_distance: 2,   // PC
    score_personal: 0,   // Poor
    created_at: '2025-12-10T10:00:00Z',
    updated_at: '2025-12-20T09:00:00Z',
  },

  // PROJECT - roční uzávěrka jako projekt s podúkoly
  {
    id: 'task-bcd-5',
    title: 'Roční účetní uzávěrka 2025',
    description: 'Kompletní roční uzávěrka účetnictví včetně inventarizace a přípravy podkladů pro daňové přiznání',
    is_project: true,
    project_outcome: 'Kompletní roční uzávěrka připravená k auditu',
    status: 'pending',
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    assigned_to: 'user-2-accountant',
    assigned_to_name: 'Jana Svobodová',
    is_waiting_for: false,
    due_date: MOCK_DATES.END_OF_NEXT_MONTH,
    company_id: 'company-11',
    company_name: 'BCD Finance',
    gtd_context: ['@pocitac', '@kancelar'],
    gtd_energy_level: 'high',
    gtd_is_quick_action: false,
    estimated_minutes: 480,
    actual_minutes: 0,
    is_billable: true,
    hourly_rate: 1500,
    tags: ['rocni-uzaverka', 'projekt', '2025'],
    progress_percentage: 0,
    // R-Tasks Score: 10 (vysoká priorita - projekt)
    score_money: 3,      // 50k+ hodnota (roční uzávěrka)
    score_fire: 2,       // High (důležité)
    score_time: 0,       // den+ práce
    score_distance: 2,   // PC
    score_personal: 1,   // Good
    created_at: '2025-12-15T08:00:00Z',
    updated_at: '2025-12-15T08:00:00Z',
  },

  // DELEGATED - delegovaný úkol na asistentku
  {
    id: 'task-bcd-6',
    title: 'Archivace dokumentů Q3',
    description: 'Naskenovat a archivovat papírové doklady za 3. čtvrtletí',
    is_project: false,
    status: 'in_progress',
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    assigned_to: 'user-4-assistant',
    assigned_to_name: 'Marie Dvořáková',
    is_waiting_for: false,
    due_date: MOCK_DATES.END_OF_MONTH,
    company_id: 'company-11',
    company_name: 'BCD Finance',
    gtd_context: ['@kancelar'],
    gtd_energy_level: 'low',
    gtd_is_quick_action: false,
    estimated_minutes: 120,
    actual_minutes: 45,
    is_billable: false,
    tags: ['archivace', 'dokumenty'],
    progress_percentage: 35,
    // R-Tasks Score: 3 (nízká priorita - delegováno)
    score_money: 0,      // <5k
    score_fire: 0,       // Easy
    score_time: 0,       // den+ práce
    score_distance: 0,   // Daleko (kancelář)
    score_personal: 0,   // Poor
    created_at: '2025-12-05T10:00:00Z',
    updated_at: '2025-12-19T16:00:00Z',
  },

  // COMPLETED - dokončený úkol
  {
    id: 'task-bcd-7',
    title: 'Kontrolní hlášení - listopad',
    description: 'Odeslat kontrolní hlášení DPH za listopad 2025',
    is_project: false,
    status: 'completed',
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    assigned_to: 'user-2-accountant',
    assigned_to_name: 'Jana Svobodová',
    is_waiting_for: false,
    due_date: MOCK_DATES.IN_5_DAYS,
    company_id: 'company-11',
    company_name: 'BCD Finance',
    gtd_context: ['@pocitac'],
    gtd_energy_level: 'medium',
    gtd_is_quick_action: false,
    estimated_minutes: 45,
    actual_minutes: 40,
    is_billable: true,
    hourly_rate: 1200,
    tags: ['kh', 'dph', 'dokonceno'],
    progress_percentage: 100,
    // R-Tasks Score: 9 (vysoká priorita - dokončeno)
    score_money: 2,      // 15k+ hodnota
    score_fire: 2,       // High (povinnost)
    score_time: 2,       // <1h práce
    score_distance: 2,   // PC
    score_personal: 1,   // Good
    created_at: '2025-12-10T08:00:00Z',
    updated_at: '2025-12-14T11:30:00Z',
    completed_at: '2025-12-14T11:30:00Z',
  },

  // SOMEDAY/MAYBE - úkol do budoucna
  {
    id: 'task-bcd-8',
    title: 'Optimalizace daňového zatížení',
    description: 'Připravit analýzu možností daňové optimalizace pro rok 2026',
    is_project: false,
    status: 'someday_maybe',
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    assigned_to: 'user-2-accountant',
    assigned_to_name: 'Jana Svobodová',
    is_waiting_for: false,
    due_date: MOCK_DATES.END_OF_NEXT_MONTH,
    company_id: 'company-11',
    company_name: 'BCD Finance',
    gtd_context: ['@pocitac'],
    gtd_energy_level: 'high',
    gtd_is_quick_action: false,
    estimated_minutes: 240,
    actual_minutes: 0,
    is_billable: true,
    hourly_rate: 1500,
    tags: ['optimalizace', 'dane', 'budouci'],
    progress_percentage: 0,
    // R-Tasks Score: 6 (střední priorita - someday)
    score_money: 2,      // 15k+ hodnota (potenciální úspory)
    score_fire: 0,       // Easy (není urgentní)
    score_time: 0,       // den+ práce
    score_distance: 2,   // PC
    score_personal: 1,   // Good (zajímavé)
    created_at: '2025-11-15T08:00:00Z',
    updated_at: '2025-11-15T08:00:00Z',
  },

  // OVERDUE - zpožděný úkol
  {
    id: 'task-bcd-9',
    title: 'Odsouhlasení salda - dodavatelé',
    description: 'Provést odsouhlasení zůstatků s hlavními dodavateli',
    is_project: false,
    status: 'pending',
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    assigned_to: 'user-2-accountant',
    assigned_to_name: 'Jana Svobodová',
    is_waiting_for: false,
    due_date: MOCK_DATES.IN_5_DAYS,
    company_id: 'company-11',
    company_name: 'BCD Finance',
    gtd_context: ['@email', '@telefon'],
    gtd_energy_level: 'medium',
    gtd_is_quick_action: false,
    estimated_minutes: 60,
    actual_minutes: 0,
    is_billable: true,
    hourly_rate: 1200,
    tags: ['saldo', 'dodavatele', 'zpozdeneno'],
    progress_percentage: 0,
    // R-Tasks Score: 7 (střední priorita - overdue!)
    score_money: 1,      // 5k+ hodnota
    score_fire: 2,       // High (zpožděno!)
    score_time: 2,       // <1h práce
    score_distance: 2,   // PC
    score_personal: 0,   // Poor
    created_at: '2025-12-01T09:00:00Z',
    updated_at: '2025-12-01T09:00:00Z',
  },

  // PHONE CALL - telefonní úkol
  {
    id: 'task-bcd-10',
    title: 'Zavolat finančnímu úřadu',
    description: 'Ověřit stav vratky DPH za Q3',
    is_project: false,
    status: 'pending',
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    assigned_to: 'user-2-accountant',
    assigned_to_name: 'Jana Svobodová',
    is_waiting_for: false,
    due_date: MOCK_DATES.TODAY,
    due_time: '14:00',
    company_id: 'company-11',
    company_name: 'BCD Finance',
    gtd_context: ['@telefon'],
    gtd_energy_level: 'low',
    gtd_is_quick_action: true,
    estimated_minutes: 5,
    actual_minutes: 0,
    is_billable: false,
    tags: ['telefon', 'fu'],
    progress_percentage: 0,
    // R-Tasks Score: 8 (střední-vysoká priorita - quick action)
    score_money: 1,      // 5k+ hodnota (vratka)
    score_fire: 2,       // High (důležité zjistit)
    score_time: 3,       // <30min
    score_distance: 2,   // PC (telefon)
    score_personal: 0,   // Poor (volání)
    created_at: '2025-12-20T09:00:00Z',
    updated_at: '2025-12-20T09:00:00Z',
  },

  // MEETING - schůzka
  {
    id: 'task-bcd-11',
    title: 'Schůzka s jednatelem - roční výsledky',
    description: 'Osobní schůzka k projednání hospodářských výsledků za rok 2025',
    is_project: false,
    status: 'pending',
    created_by: 'user-1-client',
    created_by_name: 'Karel Novák',
    assigned_to: 'user-2-accountant',
    assigned_to_name: 'Jana Svobodová',
    is_waiting_for: false,
    due_date: MOCK_DATES.IN_2_DAYS,
    due_time: '10:00',
    company_id: 'company-11',
    company_name: 'BCD Finance',
    gtd_context: ['@meeting', '@kancelar'],
    gtd_energy_level: 'high',
    gtd_is_quick_action: false,
    estimated_minutes: 60,
    actual_minutes: 0,
    is_billable: true,
    hourly_rate: 1500,
    tags: ['schuzka', 'jednatel', 'vysledky'],
    progress_percentage: 0,
    // R-Tasks Score: 8 (střední-vysoká priorita)
    score_money: 2,      // 15k+ hodnota (důležitá schůzka)
    score_fire: 2,       // High (deadline blízko)
    score_time: 2,       // <1h práce
    score_distance: 0,   // Daleko (osobní schůzka)
    score_personal: 1,   // Good
    created_at: '2025-12-18T10:00:00Z',
    updated_at: '2025-12-19T08:00:00Z',
  },

  // CLARIFYING - úkol vyžadující upřesnění
  {
    id: 'task-bcd-12',
    title: 'Neidentifikovaná platba 45 000 Kč',
    description: 'Na účet přišla platba bez VS - nutno zjistit od koho a za co',
    is_project: false,
    status: 'waiting_for',
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    assigned_to: 'user-2-accountant',
    assigned_to_name: 'Jana Svobodová',
    is_waiting_for: true,
    waiting_for_who: 'Jednatel BCD Finance',
    waiting_for_what: 'Informace o původu platby',
    due_date: MOCK_DATES.OVERDUE_1_DAY,
    company_id: 'company-11',
    company_name: 'BCD Finance',
    gtd_context: ['@email'],
    gtd_energy_level: 'low',
    gtd_is_quick_action: false,
    estimated_minutes: 15,
    actual_minutes: 5,
    is_billable: false,
    tags: ['platba', 'identifikace'],
    progress_percentage: 20,
    // R-Tasks Score: 6 (střední priorita - čekáme na info)
    score_money: 2,      // 15k+ hodnota (45k platba)
    score_fire: 1,       // Normal
    score_time: 2,       // <1h práce po zjištění
    score_distance: 2,   // PC
    score_personal: 0,   // Poor
    created_at: '2025-12-19T11:00:00Z',
    updated_at: '2025-12-20T10:00:00Z',
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
      is_project: false,
      assigned_to_name: 'Jana Svobodová',
      due_date: MOCK_DATES.OVERDUE_1_DAY,
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
      is_project: false,
      assigned_to_name: 'Jana Svobodová',
      due_date: MOCK_DATES.OVERDUE_2_DAYS,
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
      is_project: false,
      assigned_to_name: 'Jana Svobodová',
      due_date: MOCK_DATES.TODAY,
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
      is_project: true,
      assigned_to_name: 'Jana Svobodová',
      due_date: MOCK_DATES.END_OF_MONTH,
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
      is_project: false,
      assigned_to_name: 'Jana Svobodová',
      due_date: MOCK_DATES.TOMORROW,
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
      is_project: false,
      assigned_to_name: 'Jana Svobodová',
      due_date: MOCK_DATES.IN_2_DAYS,
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

// Get tasks by company
export function getTasksByCompany(companyId: string) {
  return mockTasks.filter(t => t.company_id === companyId)
}

// Get all tasks (including bonus tasks and project tasks)
export function getAllTasks() {
  return [...mockTasks, ...mockBonusTasks, ...mockProjectTasks]
}

// Get only free tasks (not part of any project)
export function getFreeTasks() {
  return [...mockTasks, ...mockBonusTasks].filter(t => !t.project_id)
}

// Get all project tasks
export function getAllProjectTasks() {
  return mockProjectTasks
}

/**
 * Get tasks for the main Tasks list based on user context
 *
 * Rules:
 * 1. Free tasks (no project_id) - always shown
 * 2. Project tasks shown only if:
 *    - Assigned to current user AND not blocked
 *    - OR is_next_action === true (project owner sees next step)
 *
 * @param userId - Current user ID to filter assigned tasks
 * @param includeNextActions - Show next actions even if not assigned to user
 */
export function getTasksForMainList(userId: string, includeNextActions: boolean = true): Task[] {
  // Free tasks (not part of any project)
  const freeTasks = [...mockTasks, ...mockBonusTasks].filter(t => !t.project_id && !t.is_project)

  // Project tasks filtered by rules
  const eligibleProjectTasks = mockProjectTasks.filter(task => {
    // Skip completed tasks in main list
    if (task.status === 'completed' || task.status === 'cancelled') {
      return false
    }

    // Rule: is_next_action always visible (if enabled)
    if (includeNextActions && task.is_next_action) {
      return true
    }

    // Rule: Assigned to user AND not blocked
    if (task.assigned_to === userId && !task.is_blocked) {
      return true
    }

    return false
  })

  return [...freeTasks, ...eligibleProjectTasks]
}

/**
 * Get project info for a task (for display purposes)
 */
export function getProjectForTask(task: Task): Project | undefined {
  if (!task.project_id) return undefined
  return mockProjects.find(p => p.id === task.project_id)
}

/**
 * Get effective priority for a task (inherits from project if not set)
 */
export function getEffectivePriority(task: Task): number {
  // If task has its own score_fire, use it
  if (task.score_fire !== undefined && task.score_fire > 0) {
    return task.score_fire
  }

  // Otherwise, inherit from project
  if (task.project_id) {
    const project = mockProjects.find(p => p.id === task.project_id)
    if (project?.priority !== undefined) {
      return project.priority
    }
  }

  // Default to normal (1)
  return 1
}

// ==========================================
// URGENCY & ESCALATION HELPERS
// ==========================================

/**
 * Konfigurace pro urgování
 */
export const URGENCY_CONFIG = {
  MAX_URGENCIES_BEFORE_ESCALATION: 3,  // Po 3 urgencích eskalovat
  DAYS_BETWEEN_URGENCIES: 2,            // Minimální interval mezi urgencemi
  AUTO_ESCALATE_AFTER_DAYS: 7,          // Automaticky eskalovat po 7 dnech bez reakce
}

/**
 * Získá úroveň eskalace pro úkol (0-3)
 * 0 = bez eskalace, 1 = urgováno 1-2×, 2 = urgováno 3×, 3 = eskalováno na manažera
 */
export function getEscalationLevel(task: Task): 0 | 1 | 2 | 3 {
  if (task.escalated_to) return 3
  if (!task.urgency_count) return 0
  if (task.urgency_count >= URGENCY_CONFIG.MAX_URGENCIES_BEFORE_ESCALATION) return 2
  return 1
}

/**
 * Zjistí jestli úkol potřebuje urgenci (čeká na klienta a nebyl urgován dostatečně nedávno)
 */
export function needsUrgency(task: Task): boolean {
  // Jen úkoly čekající na klienta
  if (task.status !== 'waiting_for' && task.status !== 'waiting_client') return false

  // Pokud je eskalováno, už ne
  if (task.escalated_to) return false

  // Pokud nebyl nikdy urgován, potřebuje urgenci
  if (!task.last_urged_at) return true

  // Zjisti kolik dní od poslední urgence
  const lastUrged = new Date(task.last_urged_at)
  const now = new Date()
  const daysSinceLastUrge = Math.floor((now.getTime() - lastUrged.getTime()) / (1000 * 60 * 60 * 24))

  return daysSinceLastUrge >= URGENCY_CONFIG.DAYS_BETWEEN_URGENCIES
}

/**
 * Zjistí jestli je čas na eskalaci (dosažen limit urgencí nebo dlouhá doba bez reakce)
 */
export function shouldEscalate(task: Task, maxUrgencies: number = URGENCY_CONFIG.MAX_URGENCIES_BEFORE_ESCALATION): boolean {
  // Už eskalováno
  if (task.escalated_to) return false

  // Dosažen limit urgencí
  if (task.urgency_count && task.urgency_count >= maxUrgencies) return true

  // Dlouhá doba od první urgence bez reakce
  if (task.last_urged_at) {
    const lastUrged = new Date(task.last_urged_at)
    const now = new Date()
    const daysSinceLastUrge = Math.floor((now.getTime() - lastUrged.getTime()) / (1000 * 60 * 60 * 24))
    if (daysSinceLastUrge >= URGENCY_CONFIG.AUTO_ESCALATE_AFTER_DAYS) return true
  }

  return false
}

/**
 * Provede urgenci na úkolu (vrací nový task objekt)
 */
export function urgeTask(task: Task): Task {
  return {
    ...task,
    urgency_count: (task.urgency_count || 0) + 1,
    last_urged_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

/**
 * Eskaluje úkol na manažera (vrací nový task objekt)
 */
export function escalateTask(task: Task, managerId: string, reason: string): Task {
  return {
    ...task,
    escalated_to: managerId,
    escalated_at: new Date().toISOString(),
    escalation_reason: reason,
    updated_at: new Date().toISOString(),
  }
}

/**
 * Získá reliability score pro firmu
 */
export function getCompanyReliabilityScore(companyId: string): 0 | 1 | 2 | 3 {
  const company = mockCompanies.find(c => c.id === companyId) as typeof mockCompanies[0] & { reliability_score?: 0 | 1 | 2 | 3 }
  return company?.reliability_score ?? 2  // Default: normální
}

/**
 * Vrátí textový popis reliability score
 */
export function getReliabilityLabel(score: 0 | 1 | 2 | 3): string {
  switch (score) {
    case 0: return 'Beznadějný'
    case 1: return 'Problémový'
    case 2: return 'Normální'
    case 3: return 'Spolehlivý'
  }
}

/**
 * Vrátí emoji pro reliability score
 */
export function getReliabilityEmoji(score: 0 | 1 | 2 | 3): string {
  switch (score) {
    case 0: return '🔴'  // Beznadějný
    case 1: return '🟠'  // Problémový
    case 2: return '🟡'  // Normální
    case 3: return '🟢'  // Spolehlivý
  }
}

/**
 * Vrátí úkoly eskalované na daného manažera
 */
export function getEscalatedTasksForManager(managerId: string): Task[] {
  return [...mockTasks, ...mockProjectTasks].filter(t => t.escalated_to === managerId)
}

/**
 * Vrátí úkoly které potřebují urgenci pro daného uživatele
 */
export function getTasksNeedingUrgency(userId: string): Task[] {
  return [...mockTasks, ...mockProjectTasks].filter(t =>
    t.assigned_to === userId && needsUrgency(t)
  )
}

// ==========================================
// MAJETEK FIRMY
// ==========================================

export const mockAssets: Asset[] = [
  // Company 1 - ABC s.r.o. (Novák)
  {
    id: 'asset-1',
    company_id: 'company-1',
    category: 'vehicle',
    name: 'Škoda Octavia Combi',
    acquisition_price: 650000,
    acquisition_date: '2022-03-15',
    acquisition_method: 'leasing',
    current_value: 455000,
    depreciation_group: '2',
    depreciation_start: '2022-04-01',
    status: 'active',
    vehicle_details: {
      license_plate: '4A2 5678',
      brand: 'Škoda',
      model: 'Octavia Combi Style',
      year: 2022,
      vin: 'TMBAG7NE3N0123456',
      stk_until: '2026-03-15',
      insurance_until: '2026-03-15',
      fuel_type: 'diesel',
      mileage: 45000,
    },
    notes: 'Služební vůz - jednatel',
    created_at: '2022-03-15T10:00:00Z',
    updated_at: '2024-12-01T10:00:00Z',
  },
  {
    id: 'asset-2',
    company_id: 'company-1',
    category: 'electronics',
    name: 'MacBook Pro 14"',
    acquisition_price: 65000,
    acquisition_date: '2023-09-10',
    acquisition_method: 'purchase',
    current_value: 52000,
    depreciation_group: '1',
    depreciation_start: '2023-10-01',
    status: 'active',
    electronics_details: {
      device_type: 'Notebook',
      brand: 'Apple',
      model: 'MacBook Pro 14" M3 Pro',
      serial_number: 'C02X12345678',
      warranty_until: '2025-09-10',
    },
    created_at: '2023-09-10T10:00:00Z',
    updated_at: '2023-09-10T10:00:00Z',
  },
  {
    id: 'asset-3',
    company_id: 'company-1',
    category: 'equipment',
    name: 'Kancelářský nábytek',
    acquisition_price: 85000,
    acquisition_date: '2021-06-01',
    acquisition_method: 'purchase',
    current_value: 42500,
    depreciation_group: '2',
    depreciation_start: '2021-07-01',
    status: 'active',
    equipment_details: {
      equipment_type: 'Nábytek',
      quantity: 1,
      location: 'Hlavní kancelář',
    },
    notes: '2x stůl, 4x židle, 2x skříň',
    created_at: '2021-06-01T10:00:00Z',
    updated_at: '2021-06-01T10:00:00Z',
  },

  // Company 11 - BCD Finance s.r.o.
  {
    id: 'asset-4',
    company_id: 'company-11',
    category: 'vehicle',
    name: 'VW Passat Variant',
    acquisition_price: 890000,
    acquisition_date: '2023-01-20',
    acquisition_method: 'purchase',
    current_value: 712000,
    depreciation_group: '2',
    depreciation_start: '2023-02-01',
    status: 'active',
    vehicle_details: {
      license_plate: '5B1 9876',
      brand: 'Volkswagen',
      model: 'Passat Variant Business',
      year: 2023,
      vin: 'WVWZZZ3CZPE123456',
      stk_until: '2027-01-20',
      insurance_until: '2026-01-20',
      fuel_type: 'diesel',
      mileage: 28000,
    },
    created_at: '2023-01-20T10:00:00Z',
    updated_at: '2024-11-15T10:00:00Z',
  },
  {
    id: 'asset-5',
    company_id: 'company-11',
    category: 'real_estate',
    name: 'Kancelářské prostory',
    acquisition_price: 4500000,
    acquisition_date: '2020-05-15',
    acquisition_method: 'purchase',
    current_value: 4050000,
    depreciation_group: '5',
    depreciation_start: '2020-06-01',
    status: 'active',
    real_estate_details: {
      property_type: 'office',
      address: 'Václavské náměstí 12, Praha 1',
      area_m2: 120,
      land_registry_number: '12345',
      cadastral_area: 'Nové Město',
    },
    created_at: '2020-05-15T10:00:00Z',
    updated_at: '2020-05-15T10:00:00Z',
  },
  {
    id: 'asset-6',
    company_id: 'company-11',
    category: 'machinery',
    name: 'Serverová infrastruktura',
    acquisition_price: 320000,
    acquisition_date: '2022-11-01',
    acquisition_method: 'purchase',
    current_value: 192000,
    depreciation_group: '1',
    depreciation_start: '2022-12-01',
    status: 'active',
    machinery_details: {
      machine_type: 'Server',
      brand: 'Dell',
      model: 'PowerEdge R750',
      serial_number: 'SVR2022110001',
      power_kw: 1.5,
      next_service: '2025-06-01',
    },
    notes: '2x server + UPS + rack',
    created_at: '2022-11-01T10:00:00Z',
    updated_at: '2024-06-01T10:00:00Z',
  },
  {
    id: 'asset-7',
    company_id: 'company-11',
    category: 'other',
    name: 'Firemní umělecké dílo',
    acquisition_price: 150000,
    acquisition_date: '2021-03-10',
    acquisition_method: 'purchase',
    current_value: 150000,
    depreciation_group: 'none',
    status: 'active',
    custom_fields: [
      { id: 'cf-1', label: 'Autor', value: 'Jan Kovář' },
      { id: 'cf-2', label: 'Rok vzniku', value: '2019' },
      { id: 'cf-3', label: 'Technika', value: 'Olej na plátně' },
      { id: 'cf-4', label: 'Rozměry', value: '120x80 cm' },
    ],
    notes: 'Obraz v zasedací místnosti - neodepisuje se',
    created_at: '2021-03-10T10:00:00Z',
    updated_at: '2021-03-10T10:00:00Z',
  },

  // Prodaný majetek
  {
    id: 'asset-8',
    company_id: 'company-1',
    category: 'vehicle',
    name: 'Ford Focus',
    acquisition_price: 380000,
    acquisition_date: '2019-06-01',
    acquisition_method: 'purchase',
    current_value: 0,
    depreciation_group: '2',
    depreciation_start: '2019-07-01',
    status: 'sold',
    disposal_date: '2024-05-15',
    disposal_price: 180000,
    vehicle_details: {
      license_plate: '4A1 2345',
      brand: 'Ford',
      model: 'Focus Titanium',
      year: 2019,
      fuel_type: 'petrol',
    },
    notes: 'Prodáno zaměstnanci',
    created_at: '2019-06-01T10:00:00Z',
    updated_at: '2024-05-15T10:00:00Z',
  },
]

export function getAssetsByCompany(companyId: string): Asset[] {
  return mockAssets.filter(a => a.company_id === companyId)
}

export function getActiveAssetsByCompany(companyId: string): Asset[] {
  return mockAssets.filter(a => a.company_id === companyId && a.status === 'active')
}

// ==========================================
// POJIŠTĚNÍ A SMLOUVY
// ==========================================

export const mockInsurances: Insurance[] = [
  // Company 1 - ABC s.r.o. (Novák)
  // Daňově odečitatelné
  {
    id: 'ins-1',
    company_id: 'company-1',
    category: 'life_insurance',
    provider: 'NN pojišťovna',
    contract_number: 'ZP-2020-123456',
    name: 'Životní pojištění - jednatel',
    insured_subject: 'Životní pojištění s investiční složkou',
    insured_person: 'Karel Novák',
    premium_amount: 2000,
    payment_frequency: 'monthly',
    annual_premium: 24000,
    is_tax_deductible: true,
    tax_deductible_amount: 24000,
    contract_date: '2020-03-15',
    effective_date: '2020-04-01',
    anniversary_date: '2025-04-01',
    status: 'active',
    notes: 'Pojištění pro případ smrti nebo dožití, investiční složka',
    created_at: '2020-03-15T10:00:00Z',
    updated_at: '2024-03-15T10:00:00Z',
  },
  {
    id: 'ins-2',
    company_id: 'company-1',
    category: 'pension_savings',
    provider: 'ČSOB Penzijní společnost',
    contract_number: 'DPS-2019-789012',
    name: 'Penzijní spoření - jednatel',
    insured_subject: 'Doplňkové penzijní spoření',
    insured_person: 'Karel Novák',
    premium_amount: 3000,
    payment_frequency: 'monthly',
    annual_premium: 36000,
    is_tax_deductible: true,
    tax_deductible_amount: 15600, // (3000 - 1700) * 12 = 15600
    contract_date: '2019-06-01',
    effective_date: '2019-07-01',
    anniversary_date: '2025-07-01',
    status: 'active',
    notes: 'Státní příspěvek 340 Kč/měs, odpočet z částky nad 1700 Kč',
    created_at: '2019-06-01T10:00:00Z',
    updated_at: '2024-07-01T10:00:00Z',
  },
  // Podnikatelská pojištění
  {
    id: 'ins-3',
    company_id: 'company-1',
    category: 'liability_business',
    provider: 'Kooperativa',
    contract_number: 'ODP-2021-456789',
    name: 'Pojištění odpovědnosti za škodu',
    insured_subject: 'Odpovědnost za škodu způsobenou podnikáním',
    premium_amount: 8500,
    payment_frequency: 'annual',
    annual_premium: 8500,
    coverage_limit: 5000000,
    deductible: 5000,
    is_tax_deductible: false,
    contract_date: '2021-01-15',
    effective_date: '2021-02-01',
    anniversary_date: '2025-02-01',
    status: 'active',
    notes: 'Limit 5 mil. Kč, spoluúčast 5 000 Kč',
    created_at: '2021-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 'ins-4',
    company_id: 'company-1',
    category: 'vehicle',
    provider: 'Direct pojišťovna',
    contract_number: 'POV-2022-111222',
    name: 'Povinné ručení + havarijní - Octavia',
    insured_subject: 'Škoda Octavia Combi (4A2 5678)',
    premium_amount: 12400,
    payment_frequency: 'annual',
    annual_premium: 12400,
    coverage_limit: 100000000,
    is_tax_deductible: false,
    contract_date: '2022-03-15',
    effective_date: '2022-03-15',
    anniversary_date: '2025-03-15',
    status: 'active',
    linked_asset_id: 'asset-1',
    notes: 'POV limit 100 mil., havarijní plné krytí',
    created_at: '2022-03-15T10:00:00Z',
    updated_at: '2024-03-15T10:00:00Z',
  },

  // Company 11 - BCD Finance s.r.o.
  {
    id: 'ins-5',
    company_id: 'company-11',
    category: 'life_insurance',
    provider: 'Generali',
    contract_number: 'GEN-ZP-2021-555',
    name: 'Kapitálové životní pojištění',
    insured_subject: 'Pojištění pro případ smrti nebo dožití',
    insured_person: 'Jan Horák',
    premium_amount: 4000,
    payment_frequency: 'monthly',
    annual_premium: 48000,
    is_tax_deductible: true,
    tax_deductible_amount: 24000, // max limit
    contract_date: '2021-05-01',
    effective_date: '2021-06-01',
    anniversary_date: '2026-06-01',
    status: 'active',
    created_at: '2021-05-01T10:00:00Z',
    updated_at: '2024-05-01T10:00:00Z',
  },
  {
    id: 'ins-6',
    company_id: 'company-11',
    category: 'pension_savings',
    provider: 'KB Penzijní společnost',
    contract_number: 'KB-DPS-2020-888',
    name: 'DPS - jednatel',
    insured_subject: 'Doplňkové penzijní spoření',
    insured_person: 'Jan Horák',
    premium_amount: 5700,
    payment_frequency: 'monthly',
    annual_premium: 68400,
    is_tax_deductible: true,
    tax_deductible_amount: 48000, // max limit (5700-1700)*12 = 48000
    contract_date: '2020-01-10',
    effective_date: '2020-02-01',
    anniversary_date: '2026-02-01',
    status: 'active',
    notes: 'Maximální daňový odpočet 48 000 Kč',
    created_at: '2020-01-10T10:00:00Z',
    updated_at: '2024-07-01T10:00:00Z',
  },
  {
    id: 'ins-7',
    company_id: 'company-11',
    category: 'property_business',
    provider: 'Česká pojišťovna',
    contract_number: 'CP-MAJ-2020-999',
    name: 'Pojištění kancelářských prostor',
    insured_subject: 'Kancelář Václavské náměstí 12, Praha 1',
    premium_amount: 15000,
    payment_frequency: 'annual',
    annual_premium: 15000,
    coverage_limit: 5000000,
    deductible: 10000,
    is_tax_deductible: false,
    contract_date: '2020-05-20',
    effective_date: '2020-06-01',
    anniversary_date: '2025-12-10',
    linked_asset_id: 'asset-5',
    status: 'active',
    notes: 'Pojištění stavby + vybavení, živelní + odcizení',
    created_at: '2020-05-20T10:00:00Z',
    updated_at: '2024-05-20T10:00:00Z',
  },
  {
    id: 'ins-8',
    company_id: 'company-11',
    category: 'liability_professional',
    provider: 'Allianz',
    contract_number: 'ALZ-PROF-2022-333',
    name: 'Profesní odpovědnost - finanční poradenství',
    insured_subject: 'Odpovědnost za škodu z finančního poradenství',
    premium_amount: 25000,
    payment_frequency: 'annual',
    annual_premium: 25000,
    coverage_limit: 10000000,
    deductible: 25000,
    is_tax_deductible: false,
    contract_date: '2022-09-01',
    effective_date: '2022-09-15',
    anniversary_date: '2026-09-15',
    status: 'active',
    notes: 'Povinné pojištění pro investiční poradce',
    created_at: '2022-09-01T10:00:00Z',
    updated_at: '2024-09-01T10:00:00Z',
  },
  {
    id: 'ins-9',
    company_id: 'company-11',
    category: 'vehicle',
    provider: 'UNIQA',
    contract_number: 'UNI-AUTO-2023-444',
    name: 'Pojištění VW Passat',
    insured_subject: 'VW Passat Variant (5B1 9876)',
    premium_amount: 18500,
    payment_frequency: 'annual',
    annual_premium: 18500,
    coverage_limit: 150000000,
    is_tax_deductible: false,
    contract_date: '2023-01-20',
    effective_date: '2023-01-20',
    anniversary_date: '2026-01-20',
    linked_asset_id: 'asset-4',
    status: 'active',
    notes: 'POV + havarijní + čelní sklo',
    created_at: '2023-01-20T10:00:00Z',
    updated_at: '2024-01-20T10:00:00Z',
  },
  {
    id: 'ins-10',
    company_id: 'company-11',
    category: 'cyber',
    provider: 'Kooperativa',
    contract_number: 'KOOP-CYBER-2023-777',
    name: 'Kybernetické pojištění',
    insured_subject: 'Ochrana proti kybernetickým rizikům',
    premium_amount: 35000,
    payment_frequency: 'annual',
    annual_premium: 35000,
    coverage_limit: 2000000,
    deductible: 50000,
    is_tax_deductible: false,
    contract_date: '2023-11-01',
    effective_date: '2023-11-15',
    anniversary_date: '2025-11-28',
    status: 'active',
    notes: 'Krytí: únik dat, ransomware, právní náklady',
    created_at: '2023-11-01T10:00:00Z',
    updated_at: '2023-11-01T10:00:00Z',
  },
  {
    id: 'ins-11',
    company_id: 'company-11',
    category: 'employee_statutory',
    provider: 'Kooperativa',
    contract_number: 'KOOP-ZAM-2020-111',
    name: 'Zákonné pojištění zaměstnanců',
    insured_subject: 'Pojištění odpovědnosti zaměstnavatele',
    premium_amount: 2800,
    payment_frequency: 'quarterly',
    annual_premium: 11200,
    is_tax_deductible: false,
    contract_date: '2020-01-01',
    effective_date: '2020-01-01',
    anniversary_date: '2026-05-01',
    status: 'active',
    notes: 'Povinné ze zákona - 3 zaměstnanci',
    created_at: '2020-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z',
  },
]

export function getInsurancesByCompany(companyId: string): Insurance[] {
  return mockInsurances.filter(i => i.company_id === companyId)
}

export function getActiveInsurancesByCompany(companyId: string): Insurance[] {
  return mockInsurances.filter(i => i.company_id === companyId && i.status === 'active')
}

export function getTaxDeductibleInsurances(companyId: string): Insurance[] {
  return mockInsurances.filter(i => i.company_id === companyId && i.is_tax_deductible && i.status === 'active')
}

// ============================================
// GAMIFICATION: TIME LOGS
// ============================================
export const mockTimeLogs: TimeLog[] = [
  // Task-related time logs
  {
    id: 'tl-1',
    task_id: 'task-3',
    user_id: 'user-2-accountant',
    user_name: 'Jana Svobodová',
    activity_type: 'task',
    date: MOCK_DATES.OVERDUE_1_DAY,
    minutes: 45,
    description: 'Kontrola vstupních dokladů pro DPH',
    is_billable: true,
    created_at: '2025-12-22T10:00:00Z',
  },
  {
    id: 'tl-2',
    task_id: 'task-3',
    user_id: 'user-2-accountant',
    user_name: 'Jana Svobodová',
    activity_type: 'task',
    date: MOCK_DATES.TODAY,
    minutes: 90,
    description: 'Zpracování DPH přiznání v Pohoda',
    is_billable: true,
    created_at: '2025-12-23T14:00:00Z',
  },
  {
    id: 'tl-3',
    task_id: 'task-5',
    user_id: 'user-2-accountant',
    user_name: 'Jana Svobodová',
    activity_type: 'task',
    date: MOCK_DATES.TODAY,
    minutes: 30,
    description: 'Příprava podkladů pro kontrolu',
    is_billable: true,
    created_at: '2025-12-23T09:00:00Z',
  },
  // Non-task time logs (general time tracking)
  {
    id: 'tl-4',
    user_id: 'user-2-accountant',
    user_name: 'Jana Svobodová',
    client_id: 'c1',
    client_name: 'ABC Company s.r.o.',
    activity_type: 'call',
    date: MOCK_DATES.TODAY,
    minutes: 15,
    description: 'Telefonát s klientem - dotaz k fakturaci',
    is_billable: true,
    created_at: '2025-12-23T11:30:00Z',
  },
  {
    id: 'tl-5',
    user_id: 'user-2-accountant',
    user_name: 'Jana Svobodová',
    client_id: 'c2',
    client_name: 'XYZ Trading a.s.',
    activity_type: 'email',
    date: MOCK_DATES.TODAY,
    minutes: 20,
    description: 'Odpověď na dotazy ohledně DPH',
    is_billable: true,
    created_at: '2025-12-23T10:00:00Z',
  },
  {
    id: 'tl-6',
    user_id: 'user-2-accountant',
    user_name: 'Jana Svobodová',
    client_id: 'c3',
    client_name: 'Klientská Firma 3',
    activity_type: 'meeting',
    date: MOCK_DATES.OVERDUE_1_DAY,
    minutes: 60,
    description: 'Schůzka - roční uzávěrka',
    is_billable: true,
    created_at: '2025-12-22T14:00:00Z',
  },
  {
    id: 'tl-7',
    user_id: 'user-2-accountant',
    user_name: 'Jana Svobodová',
    activity_type: 'admin',
    date: MOCK_DATES.TODAY,
    minutes: 30,
    description: 'Organizace a třídění dokumentů',
    is_billable: false,
    created_at: '2025-12-23T08:00:00Z',
  },
  {
    id: 'tl-8',
    user_id: 'user-3-accountant',
    user_name: 'Marie Účetní',
    client_id: 'c1',
    client_name: 'ABC Company s.r.o.',
    activity_type: 'general',
    date: MOCK_DATES.TODAY,
    minutes: 45,
    description: 'Příprava podkladů pro audit',
    is_billable: true,
    created_at: '2025-12-23T09:00:00Z',
  },
]

// ============================================
// GAMIFICATION: USER TASK SETTINGS
// ============================================
export const mockUserTaskSettings: UserTaskSettings[] = [
  {
    user_id: 'user-2-accountant',
    user_name: 'Jana Svobodová',
    max_wip_total: 5,
    max_wip_bonus: 2,
    can_claim_bonus: true,
    quality_score: 92,
    quality_factors: {
      on_time_rate: 95,
      no_rejection_rate: 88,
      estimate_accuracy: 93,
    },
    current_month: '2025-12',
    monthly_base_required: 15,
    monthly_base_completed: 12,
    monthly_bonus_points: 450,
    monthly_bonus_cashed_out: false,
  },
  {
    user_id: 'user-3-accountant',
    user_name: 'Marie Účetní',
    max_wip_total: 4,
    max_wip_bonus: 1,
    can_claim_bonus: true,
    quality_score: 85,
    quality_factors: {
      on_time_rate: 88,
      no_rejection_rate: 82,
      estimate_accuracy: 85,
    },
    current_month: '2025-12',
    monthly_base_required: 12,
    monthly_base_completed: 10,
    monthly_bonus_points: 200,
    monthly_bonus_cashed_out: false,
  },
  {
    user_id: 'user-4-junior',
    user_name: 'Petr Nováček',
    max_wip_total: 3,
    max_wip_bonus: 0,  // Junior zatím nemůže bonus
    can_claim_bonus: false,
    quality_score: 75,
    quality_factors: {
      on_time_rate: 78,
      no_rejection_rate: 70,
      estimate_accuracy: 77,
    },
    current_month: '2025-12',
    monthly_base_required: 8,
    monthly_base_completed: 6,
    monthly_bonus_points: 0,
    monthly_bonus_cashed_out: false,
  },
]

// ============================================
// GAMIFICATION: TASK SYSTEM SETTINGS
// ============================================
export const mockTaskSystemSettings: TaskSystemSettings = {
  monthly_cutoff_day: 5,
  approval_deadline_hours: 24,
  min_quality_for_bonus: 80,
  points_to_currency_rate: 1,
}

// ============================================
// PROJECTS (kontejnery pro fáze a úkoly)
// ============================================
export const mockProjects: Project[] = [
  {
    id: 'project-1',
    title: 'Účetní uzávěrka 11/2024',
    description: 'Kompletní měsíční uzávěrka za listopad 2024',
    outcome: 'Uzavřený měsíc listopad 2024 s odeslanými reporty klientovi',
    company_id: 'company-1',
    company_name: 'ABC s.r.o.',
    project_type: 'recurring',
    recurrence: {
      pattern: 'monthly',
      period_label: '11/2024',
    },
    start_date: '2024-12-01',
    target_date: MOCK_DATES.IN_5_DAYS,
    status: 'active',
    owner_id: 'user-2-accountant',
    owner_name: 'Jana Svobodová',
    team_ids: ['user-3-accountant'],
    team_names: ['Marie Černá'],
    is_someday_maybe: false,
    priority: 2, // high - blíží se deadline
    is_billable: true,
    budget_hours: 4,
    hourly_rate: 800,
    total_tasks: 8,
    completed_tasks: 3,
    progress_percent: 38,
    created_at: '2024-12-01T08:00:00Z',
    updated_at: '2024-12-20T14:00:00Z',
  },
  {
    id: 'project-2',
    title: 'DPH Q4/2024',
    description: 'Přiznání k DPH za 4. kvartál 2024',
    outcome: 'Podané DPH přiznání za Q4 2024',
    company_id: 'company-3',
    company_name: 'MNO Holding',
    project_type: 'recurring',
    recurrence: {
      pattern: 'quarterly',
      period_label: 'Q4/2024',
    },
    start_date: '2024-12-15',
    target_date: MOCK_DATES.IN_14_DAYS,
    status: 'active',
    owner_id: 'user-3-accountant',
    owner_name: 'Marie Černá',
    team_ids: [],
    team_names: [],
    is_someday_maybe: false,
    priority: 1, // normal
    is_billable: true,
    budget_hours: 6,
    hourly_rate: 900,
    total_tasks: 5,
    completed_tasks: 1,
    progress_percent: 20,
    created_at: '2024-12-15T09:00:00Z',
    updated_at: '2024-12-22T10:00:00Z',
  },
  {
    id: 'project-3',
    title: 'Onboarding - Nový klient XYZ',
    description: 'Kompletní nastavení nového klienta v systému',
    outcome: 'Plně funkční klient s nastaveným účetnictvím',
    company_id: 'company-5',
    company_name: 'BCD Finance a.s.',
    project_type: 'one_time',
    start_date: '2024-12-10',
    target_date: MOCK_DATES.IN_7_DAYS,
    status: 'active',
    owner_id: 'user-2-accountant',
    owner_name: 'Jana Svobodová',
    team_ids: ['user-3-accountant', 'user-4-admin'],
    team_names: ['Marie Černá', 'Admin Účetní'],
    is_someday_maybe: false,
    priority: 1, // normal
    is_billable: false,
    budget_hours: 10,
    total_tasks: 12,
    completed_tasks: 5,
    progress_percent: 42,
    created_at: '2024-12-10T08:00:00Z',
    updated_at: '2024-12-23T11:00:00Z',
  },
  {
    id: 'project-4',
    title: 'Roční uzávěrka 2024',
    description: 'Kompletní roční účetní uzávěrka za rok 2024',
    outcome: 'Uzavřený rok 2024 s kompletní dokumentací pro audit',
    company_id: 'company-1',
    company_name: 'ABC s.r.o.',
    project_type: 'recurring',
    recurrence: {
      pattern: 'yearly',
      period_label: '2024',
    },
    start_date: '2025-01-02',
    target_date: '2025-03-31',
    status: 'planning',
    owner_id: 'user-2-accountant',
    owner_name: 'Jana Svobodová',
    team_ids: ['user-3-accountant'],
    team_names: ['Marie Černá'],
    is_someday_maybe: false,
    priority: 3, // critical - roční uzávěrka
    is_billable: true,
    budget_hours: 40,
    hourly_rate: 800,
    total_tasks: 0,
    completed_tasks: 0,
    progress_percent: 0,
    created_at: '2024-12-20T08:00:00Z',
    updated_at: '2024-12-20T08:00:00Z',
  },
  {
    id: 'project-5',
    title: 'Průběžná podpora',
    description: 'Průběžné dotazy a konzultace',
    outcome: 'Spokojený klient s odpověďmi na dotazy',
    company_id: 'company-2',
    company_name: 'XYZ a.s.',
    project_type: 'ongoing',
    target_date: MOCK_DATES.END_OF_NEXT_MONTH,
    status: 'active',
    owner_id: 'user-3-accountant',
    owner_name: 'Marie Černá',
    team_ids: [],
    team_names: [],
    is_someday_maybe: false,
    priority: 0, // low - průběžná podpora
    is_billable: true,
    hourly_rate: 700,
    total_tasks: 3,
    completed_tasks: 1,
    progress_percent: 33,
    created_at: '2024-01-01T08:00:00Z',
    updated_at: '2024-12-23T15:00:00Z',
  },
]

// ============================================
// PHASES (fáze v projektech)
// ============================================
export const mockPhases: Phase[] = [
  // Project 1: Účetní uzávěrka 11/2024
  {
    id: 'phase-1-1',
    project_id: 'project-1',
    title: 'Příprava podkladů',
    description: 'Sběr a kontrola vstupních dokumentů',
    position: 1,
    status: 'completed',
    total_tasks: 3,
    completed_tasks: 3,
    progress_percent: 100,
    created_at: '2024-12-01T08:00:00Z',
    updated_at: '2024-12-15T10:00:00Z',
  },
  {
    id: 'phase-1-2',
    project_id: 'project-1',
    title: 'Účtování',
    description: 'Zaúčtování všech dokladů',
    position: 2,
    status: 'active',
    total_tasks: 3,
    completed_tasks: 0,
    progress_percent: 0,
    created_at: '2024-12-01T08:00:00Z',
    updated_at: '2024-12-20T14:00:00Z',
  },
  {
    id: 'phase-1-3',
    project_id: 'project-1',
    title: 'Kontrola a reporting',
    description: 'Finální kontrola a generování výstupů',
    position: 3,
    status: 'pending',
    total_tasks: 2,
    completed_tasks: 0,
    progress_percent: 0,
    created_at: '2024-12-01T08:00:00Z',
    updated_at: '2024-12-01T08:00:00Z',
  },
  // Project 2: DPH Q4/2024
  {
    id: 'phase-2-1',
    project_id: 'project-2',
    title: 'Sběr dokladů',
    description: 'Shromáždění všech dokladů pro DPH',
    position: 1,
    status: 'completed',
    total_tasks: 2,
    completed_tasks: 2,
    progress_percent: 100,
    created_at: '2024-12-15T09:00:00Z',
    updated_at: '2024-12-20T11:00:00Z',
  },
  {
    id: 'phase-2-2',
    project_id: 'project-2',
    title: 'Výpočet a kontrola',
    description: 'Výpočet DPH a kontrola správnosti',
    position: 2,
    status: 'active',
    total_tasks: 2,
    completed_tasks: 0,
    progress_percent: 0,
    created_at: '2024-12-15T09:00:00Z',
    updated_at: '2024-12-22T10:00:00Z',
  },
  {
    id: 'phase-2-3',
    project_id: 'project-2',
    title: 'Podání přiznání',
    description: 'Finální podání DPH přiznání',
    position: 3,
    status: 'pending',
    total_tasks: 1,
    completed_tasks: 0,
    progress_percent: 0,
    created_at: '2024-12-15T09:00:00Z',
    updated_at: '2024-12-15T09:00:00Z',
  },
  // Project 3: Onboarding
  {
    id: 'phase-3-1',
    project_id: 'project-3',
    title: 'Sběr informací',
    description: 'Získání všech potřebných údajů od klienta',
    position: 1,
    status: 'completed',
    total_tasks: 4,
    completed_tasks: 4,
    progress_percent: 100,
    created_at: '2024-12-10T08:00:00Z',
    updated_at: '2024-12-15T14:00:00Z',
  },
  {
    id: 'phase-3-2',
    project_id: 'project-3',
    title: 'Nastavení systému',
    description: 'Konfigurace účetního systému',
    position: 2,
    status: 'active',
    total_tasks: 5,
    completed_tasks: 1,
    progress_percent: 20,
    created_at: '2024-12-10T08:00:00Z',
    updated_at: '2024-12-23T11:00:00Z',
  },
  {
    id: 'phase-3-3',
    project_id: 'project-3',
    title: 'Testování a předání',
    description: 'Ověření funkčnosti a školení klienta',
    position: 3,
    status: 'pending',
    total_tasks: 3,
    completed_tasks: 0,
    progress_percent: 0,
    created_at: '2024-12-10T08:00:00Z',
    updated_at: '2024-12-10T08:00:00Z',
  },
]

// ============================================
// PROJECT TASKS (úkoly patřící do projektů)
// ============================================
export const mockProjectTasks: Task[] = [
  // Project 1, Phase 1: Příprava podkladů (completed)
  {
    id: 'ptask-1-1-1',
    title: 'Import bankovních výpisů',
    description: 'Stáhnout a importovat bankovní výpisy za listopad',
    project_id: 'project-1',
    project_name: 'Účetní uzávěrka 11/2024',
    phase_id: 'phase-1-1',
    phase_name: 'Příprava podkladů',
    position_in_phase: 1,
    is_next_action: false,
    is_project: false,
    status: 'completed',
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    assigned_to: 'user-2-accountant',
    assigned_to_name: 'Jana Svobodová',
    is_waiting_for: false,
    due_date: '2024-12-05',
    company_id: 'company-1',
    company_name: 'ABC s.r.o.',
    estimated_minutes: 30,
    actual_minutes: 25,
    is_billable: true,
    created_at: '2024-12-01T08:00:00Z',
    updated_at: '2024-12-05T10:00:00Z',
  },
  {
    id: 'ptask-1-1-2',
    title: 'Zkontrolovat přijaté faktury',
    description: 'Ověřit úplnost přijatých faktur za měsíc',
    project_id: 'project-1',
    project_name: 'Účetní uzávěrka 11/2024',
    phase_id: 'phase-1-1',
    phase_name: 'Příprava podkladů',
    position_in_phase: 2,
    depends_on_task_ids: ['ptask-1-1-1'],
    is_next_action: false,
    is_project: false,
    status: 'completed',
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    assigned_to: 'user-2-accountant',
    assigned_to_name: 'Jana Svobodová',
    is_waiting_for: false,
    due_date: '2024-12-08',
    company_id: 'company-1',
    company_name: 'ABC s.r.o.',
    estimated_minutes: 45,
    actual_minutes: 50,
    is_billable: true,
    created_at: '2024-12-01T08:00:00Z',
    updated_at: '2024-12-08T11:00:00Z',
  },
  {
    id: 'ptask-1-1-3',
    title: 'Nahrát dokumenty do systému',
    description: 'Uploadovat všechny dokumenty do DMS',
    project_id: 'project-1',
    project_name: 'Účetní uzávěrka 11/2024',
    phase_id: 'phase-1-1',
    phase_name: 'Příprava podkladů',
    position_in_phase: 3,
    depends_on_task_ids: ['ptask-1-1-2'],
    is_next_action: false,
    is_project: false,
    status: 'completed',
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    assigned_to: 'user-3-accountant',
    assigned_to_name: 'Marie Černá',
    is_waiting_for: false,
    due_date: '2024-12-10',
    company_id: 'company-1',
    company_name: 'ABC s.r.o.',
    estimated_minutes: 20,
    actual_minutes: 15,
    is_billable: true,
    created_at: '2024-12-01T08:00:00Z',
    updated_at: '2024-12-10T09:00:00Z',
  },
  // Project 1, Phase 2: Účtování (active)
  {
    id: 'ptask-1-2-1',
    title: 'Zaúčtovat přijaté faktury',
    description: 'Zaúčtování všech přijatých faktur za listopad',
    project_id: 'project-1',
    project_name: 'Účetní uzávěrka 11/2024',
    phase_id: 'phase-1-2',
    phase_name: 'Účtování',
    position_in_phase: 1,
    is_next_action: true, // NEXT ACTION
    is_project: false,
    status: 'in_progress',
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    assigned_to: 'user-2-accountant',
    assigned_to_name: 'Jana Svobodová',
    is_waiting_for: false,
    due_date: MOCK_DATES.TOMORROW,
    company_id: 'company-1',
    company_name: 'ABC s.r.o.',
    estimated_minutes: 60,
    is_billable: true,
    created_at: '2024-12-01T08:00:00Z',
    updated_at: '2024-12-23T08:00:00Z',
  },
  {
    id: 'ptask-1-2-2',
    title: 'Zaúčtovat vydané faktury',
    description: 'Zaúčtování všech vydaných faktur za listopad',
    project_id: 'project-1',
    project_name: 'Účetní uzávěrka 11/2024',
    phase_id: 'phase-1-2',
    phase_name: 'Účtování',
    position_in_phase: 2,
    depends_on_task_ids: ['ptask-1-2-1'],
    is_blocked: true,
    is_next_action: false,
    is_project: false,
    status: 'pending',
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    assigned_to: 'user-2-accountant',
    assigned_to_name: 'Jana Svobodová',
    is_waiting_for: false,
    due_date: MOCK_DATES.IN_2_DAYS,
    company_id: 'company-1',
    company_name: 'ABC s.r.o.',
    estimated_minutes: 45,
    is_billable: true,
    created_at: '2024-12-01T08:00:00Z',
    updated_at: '2024-12-01T08:00:00Z',
  },
  {
    id: 'ptask-1-2-3',
    title: 'Kontrola DPH',
    description: 'Zkontrolovat správnost DPH na všech dokladech',
    project_id: 'project-1',
    project_name: 'Účetní uzávěrka 11/2024',
    phase_id: 'phase-1-2',
    phase_name: 'Účtování',
    position_in_phase: 3,
    depends_on_task_ids: ['ptask-1-2-1', 'ptask-1-2-2'],
    is_blocked: true,
    is_next_action: false,
    is_project: false,
    status: 'pending',
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    assigned_to: 'user-3-accountant',
    assigned_to_name: 'Marie Černá',
    is_waiting_for: false,
    due_date: MOCK_DATES.IN_3_DAYS,
    company_id: 'company-1',
    company_name: 'ABC s.r.o.',
    estimated_minutes: 60,
    is_billable: true,
    created_at: '2024-12-01T08:00:00Z',
    updated_at: '2024-12-01T08:00:00Z',
  },
  // Project 1, Phase 3: Kontrola a reporting (pending)
  {
    id: 'ptask-1-3-1',
    title: 'Generovat měsíční reporty',
    description: 'Vygenerovat všechny měsíční výkazy',
    project_id: 'project-1',
    project_name: 'Účetní uzávěrka 11/2024',
    phase_id: 'phase-1-3',
    phase_name: 'Kontrola a reporting',
    position_in_phase: 1,
    depends_on_task_ids: ['ptask-1-2-3'],
    is_blocked: true,
    is_next_action: false,
    is_project: false,
    status: 'pending',
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    assigned_to: 'user-2-accountant',
    assigned_to_name: 'Jana Svobodová',
    is_waiting_for: false,
    due_date: MOCK_DATES.IN_4_DAYS,
    company_id: 'company-1',
    company_name: 'ABC s.r.o.',
    estimated_minutes: 30,
    is_billable: true,
    created_at: '2024-12-01T08:00:00Z',
    updated_at: '2024-12-01T08:00:00Z',
  },
  {
    id: 'ptask-1-3-2',
    title: 'Odeslat reporty klientovi',
    description: 'Odeslat finální reporty na email klienta',
    project_id: 'project-1',
    project_name: 'Účetní uzávěrka 11/2024',
    phase_id: 'phase-1-3',
    phase_name: 'Kontrola a reporting',
    position_in_phase: 2,
    depends_on_task_ids: ['ptask-1-3-1'],
    is_blocked: true,
    is_next_action: false,
    is_project: false,
    status: 'pending',
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    assigned_to: 'user-2-accountant',
    assigned_to_name: 'Jana Svobodová',
    is_waiting_for: false,
    due_date: MOCK_DATES.IN_5_DAYS,
    company_id: 'company-1',
    company_name: 'ABC s.r.o.',
    estimated_minutes: 10,
    is_billable: true,
    created_at: '2024-12-01T08:00:00Z',
    updated_at: '2024-12-01T08:00:00Z',
  },
]

// Helper functions for projects
export function getAllProjects(): Project[] {
  return mockProjects
}

export function getProjectById(projectId: string): Project | undefined {
  return mockProjects.find(p => p.id === projectId)
}

export function getProjectsByStatus(status: ProjectStatus): Project[] {
  return mockProjects.filter(p => p.status === status)
}

export function getProjectsByCompany(companyId: string): Project[] {
  return mockProjects.filter(p => p.company_id === companyId)
}

export function getProjectsByOwner(ownerId: string): Project[] {
  return mockProjects.filter(p => p.owner_id === ownerId)
}

export function getPhasesForProject(projectId: string): Phase[] {
  return mockPhases.filter(p => p.project_id === projectId).sort((a, b) => a.position - b.position)
}

export function getTasksForProject(projectId: string): Task[] {
  return mockProjectTasks.filter(t => t.project_id === projectId)
}

export function getTasksForPhase(phaseId: string): Task[] {
  return mockProjectTasks.filter(t => t.phase_id === phaseId).sort((a, b) => (a.position_in_phase || 0) - (b.position_in_phase || 0))
}

export function getNextActionForProject(projectId: string): Task | undefined {
  return mockProjectTasks.find(t => t.project_id === projectId && t.is_next_action)
}

export function getActiveProjects(): Project[] {
  return mockProjects.filter(p => p.status === 'active')
}

// ============================================
// GAMIFICATION: BONUS TASKS (pool)
// ============================================
export const mockBonusTasks: Task[] = [
  {
    id: 'bonus-1',
    title: 'Mimořádná kontrola DPH za Q3',
    description: 'Detailní kontrola DPH přiznání za 3. kvartál - klient požádal o extra revizi',
    is_project: false,
    status: 'pending',
    task_type: 'bonus',
    points_value: 180,
    created_by: MOCK_CONFIG.CURRENT_USER_ID,
    created_by_name: MOCK_CONFIG.CURRENT_USER_NAME,
    is_waiting_for: false,
    due_date: MOCK_DATES.IN_5_DAYS,
    company_id: 'company-5',
    company_name: 'BCD Finance a.s.',
    estimated_minutes: 180,
    estimate_locked: true,
    is_billable: true,
    hourly_rate: 800,
    tags: ['bonus', 'dph', 'kontrola'],
    created_at: '2025-12-20T10:00:00Z',
    updated_at: '2025-12-20T10:00:00Z',
  },
  {
    id: 'bonus-2',
    title: 'Export dat pro nového auditora',
    description: 'Připravit kompletní export účetních dat pro externího auditora',
    is_project: false,
    status: 'pending',
    task_type: 'bonus',
    points_value: 250,
    created_by: MOCK_CONFIG.CURRENT_USER_ID,
    created_by_name: MOCK_CONFIG.CURRENT_USER_NAME,
    is_waiting_for: false,
    due_date: MOCK_DATES.IN_7_DAYS,
    company_id: 'company-3',
    company_name: 'MNO Holding',
    estimated_minutes: 240,
    estimate_locked: true,
    is_billable: true,
    hourly_rate: 900,
    tags: ['bonus', 'audit', 'export'],
    created_at: '2025-12-19T14:00:00Z',
    updated_at: '2025-12-19T14:00:00Z',
  },
  {
    id: 'bonus-3',
    title: 'Urgentní oprava chyby v uzávěrce',
    description: 'Klient našel chybu v měsíční uzávěrce - potřeba rychlé opravy',
    is_project: false,
    status: 'pending',
    task_type: 'bonus',
    points_value: 120,
    claimed_by: 'user-2-accountant',
    claimed_by_name: 'Jana Svobodová',
    claimed_at: '2025-12-23T08:00:00Z',
    created_by: MOCK_CONFIG.CURRENT_USER_ID,
    created_by_name: MOCK_CONFIG.CURRENT_USER_NAME,
    assigned_to: 'user-2-accountant',
    assigned_to_name: 'Jana Svobodová',
    is_waiting_for: false,
    due_date: MOCK_DATES.TOMORROW,
    company_id: 'company-1',
    company_name: 'ABC s.r.o.',
    estimated_minutes: 60,
    estimate_locked: true,
    is_billable: false,
    tags: ['bonus', 'urgentni', 'oprava'],
    score_fire: 3,
    created_at: '2025-12-22T16:00:00Z',
    updated_at: '2025-12-23T08:00:00Z',
  },
]

// ============================================
// GAMIFICATION: TASK APPROVALS HISTORY
// ============================================
export const mockTaskApprovals: TaskApproval[] = [
  {
    id: 'approval-1',
    task_id: 'task-15',
    action: 'approved',
    by_user_id: MOCK_CONFIG.CURRENT_USER_ID,
    by_user_name: MOCK_CONFIG.CURRENT_USER_NAME,
    created_at: '2025-12-20T15:00:00Z',
  },
  {
    id: 'approval-2',
    task_id: 'task-16',
    action: 'approved',
    by_user_id: MOCK_CONFIG.CURRENT_USER_ID,
    by_user_name: MOCK_CONFIG.CURRENT_USER_NAME,
    created_at: '2025-12-21T10:00:00Z',
  },
  {
    id: 'approval-3',
    task_id: 'task-10',
    action: 'rejected',
    by_user_id: MOCK_CONFIG.CURRENT_USER_ID,
    by_user_name: MOCK_CONFIG.CURRENT_USER_NAME,
    comment: 'Chybí kontrola bankovních výpisů za listopad',
    created_at: '2025-12-19T14:00:00Z',
  },
]

// ============================================
// CLIENT REQUESTS DATA
// ============================================
export const mockClientRequests: ClientRequest[] = [
  {
    id: 'req-1',
    client_id: 'company-1',
    client_name: 'ABC s.r.o.',
    title: 'Potřebuji potvrzení o bezdlužnosti',
    description: 'Zdravím, potřeboval bych potvrzení o bezdlužnosti pro banku kvůli novému úvěru. Je to urgentní, musím to dodat do konce týdne.',
    category: 'documents',
    priority: 'urgent',
    status: 'new',
    requested_by_date: MOCK_DATES.IN_3_DAYS,
    created_at: MOCK_DATES.TODAY + 'T08:30:00Z',
    updated_at: MOCK_DATES.TODAY + 'T08:30:00Z',
  },
  {
    id: 'req-2',
    client_id: 'company-3',
    client_name: 'DEF s.r.o.',
    title: 'Dotaz na odpočet DPH u firemního vozu',
    description: 'Pořídili jsme nový firemní vůz. Můžeme si celou DPH odečíst, nebo jen poměrnou část? Vůz bude používán i pro soukromé účely asi z 20%.',
    category: 'tax',
    priority: 'normal',
    status: 'reviewed',
    assigned_to: 'user-2-accountant',
    assigned_to_name: 'Jana Svobodová',
    response_to_client: 'Děkuji za dotaz. Připravuji pro vás podrobnou odpověď s výpočtem.',
    created_at: MOCK_DATES.OVERDUE_1_DAY + 'T14:00:00Z',
    updated_at: MOCK_DATES.TODAY + 'T09:00:00Z',
  },
  {
    id: 'req-3',
    client_id: 'company-2',
    client_name: 'XYZ a.s.',
    title: 'Změna fakturační adresy',
    description: 'Prosím o změnu fakturační adresy na: Nová ulice 123, Praha 1, 110 00. Děkuji.',
    category: 'other',
    priority: 'low',
    status: 'completed',
    assigned_to: 'user-2-accountant',
    assigned_to_name: 'Jana Svobodová',
    response_to_client: 'Fakturační adresa byla změněna. Změna se projeví na všech nových dokladech.',
    resolved_at: MOCK_DATES.OVERDUE_1_DAY + 'T16:00:00Z',
    created_at: MOCK_DATES.OVERDUE_2_DAYS + 'T10:00:00Z',
    updated_at: MOCK_DATES.OVERDUE_1_DAY + 'T16:00:00Z',
  },
  {
    id: 'req-4',
    client_id: 'company-4',
    client_name: 'GHI Praha s.r.o.',
    title: 'Příprava podkladů pro bankovní audit',
    description: 'Banka požaduje komplexní účetní výkazy za poslední 3 roky pro posouzení úvěru. Potřebuji: rozvahu, výsledovku, cash flow a přílohu k účetní závěrce.',
    category: 'accounting',
    priority: 'high',
    status: 'in_progress',
    assigned_to: 'user-2-accountant',
    assigned_to_name: 'Jana Svobodová',
    related_task_id: 'task-20',
    internal_notes: 'Velký klient, priorita. Ověřit s Petrem konzistenci dat.',
    requested_by_date: MOCK_DATES.IN_7_DAYS,
    created_at: MOCK_DATES.OVERDUE_1_DAY + 'T11:00:00Z',
    updated_at: MOCK_DATES.TODAY + 'T10:00:00Z',
  },
  {
    id: 'req-5',
    client_id: 'company-5',
    client_name: 'JKL Tech s.r.o.',
    title: 'Konzultace k zaměstnávání na DPP',
    description: 'Plánujeme zaměstnat několik brigádníků na DPP. Jaké jsou limity a povinnosti? Můžeme se domluvit na schůzce?',
    category: 'consulting',
    priority: 'normal',
    status: 'new',
    created_at: MOCK_DATES.TODAY + 'T07:00:00Z',
    updated_at: MOCK_DATES.TODAY + 'T07:00:00Z',
  },
  {
    id: 'req-6',
    client_id: 'company-1',
    client_name: 'ABC s.r.o.',
    title: 'Oprava chyby ve mzdách za říjen',
    description: 'Zaměstnanec Jan Novák nahlásil, že mu v říjnu chyběla příplatek za přesčasy. Prosím o kontrolu a případnou opravu.',
    category: 'payroll',
    priority: 'high',
    status: 'reviewed',
    assigned_to: 'user-3-manager',
    assigned_to_name: 'Petr Novotný',
    internal_notes: 'Ověřeno - chybí 8h přesčasů. Připravit doplatek pro prosinec.',
    created_at: MOCK_DATES.OVERDUE_2_DAYS + 'T15:00:00Z',
    updated_at: MOCK_DATES.TODAY + 'T11:00:00Z',
  },
  {
    id: 'req-7',
    client_id: 'company-6',
    client_name: 'MNO Consulting s.r.o.',
    title: 'Nahrání faktur za listopad',
    description: 'V příloze zasílám faktury za listopad ke zpracování.',
    category: 'documents',
    priority: 'normal',
    status: 'in_progress',
    attachments: ['faktury_listopad_2025.zip'],
    assigned_to: 'user-2-accountant',
    assigned_to_name: 'Jana Svobodová',
    created_at: MOCK_DATES.OVERDUE_1_DAY + 'T09:00:00Z',
    updated_at: MOCK_DATES.TODAY + 'T08:00:00Z',
  },
]

// ============================================
// GAMIFICATION: HELPER FUNCTIONS
// ============================================

// Get task type with default
export function getTaskType(task: Task): TaskType {
  return task.task_type || 'base'
}

// Get rejection count with default
export function getTaskRejectionCount(task: Task): number {
  return task.rejection_count || 0
}

// Check if estimate is locked (default: true for existing tasks)
export function isEstimateLocked(task: Task): boolean {
  return task.estimate_locked !== false
}

// Get time logs for task
export function getTimeLogsForTask(taskId: string): TimeLog[] {
  return mockTimeLogs.filter(tl => tl.task_id === taskId)
}

// Get total logged time for task
export function getTotalLoggedMinutes(taskId: string): number {
  return getTimeLogsForTask(taskId).reduce((sum, tl) => sum + tl.minutes, 0)
}

// Get time logs for user
export function getTimeLogsForUser(userId: string): TimeLog[] {
  return mockTimeLogs.filter(tl => tl.user_id === userId)
}

// Get time logs for client
export function getTimeLogsForClient(clientId: string): TimeLog[] {
  return mockTimeLogs.filter(tl => tl.client_id === clientId ||
    // Also include task-based logs if task is for this client
    (tl.task_id && mockTasks.find(t => t.id === tl.task_id)?.company_id === clientId)
  )
}

// Get non-task time logs (general time tracking)
export function getNonTaskTimeLogs(): TimeLog[] {
  return mockTimeLogs.filter(tl => !tl.task_id)
}

// Get time logs for user for specific date range
export function getTimeLogsForUserInRange(userId: string, startDate: string, endDate: string): TimeLog[] {
  return mockTimeLogs.filter(tl =>
    tl.user_id === userId &&
    tl.date &&
    tl.date >= startDate &&
    tl.date <= endDate
  )
}

// Get aggregated time stats for user
export function getUserTimeStats(userId: string, month?: string): {
  totalMinutes: number
  billableMinutes: number
  nonBillableMinutes: number
  taskMinutes: number
  nonTaskMinutes: number
  byActivityType: Record<ActivityType, number>
} {
  const logs = month
    ? mockTimeLogs.filter(tl => tl.user_id === userId && tl.date && tl.date.startsWith(month))
    : mockTimeLogs.filter(tl => tl.user_id === userId)

  const byActivityType: Record<ActivityType, number> = {
    task: 0,
    general: 0,
    admin: 0,
    meeting: 0,
    call: 0,
    email: 0,
  }

  let totalMinutes = 0
  let billableMinutes = 0
  let nonBillableMinutes = 0
  let taskMinutes = 0
  let nonTaskMinutes = 0

  logs.forEach(log => {
    totalMinutes += log.minutes
    if (log.is_billable) {
      billableMinutes += log.minutes
    } else {
      nonBillableMinutes += log.minutes
    }
    if (log.task_id) {
      taskMinutes += log.minutes
    } else {
      nonTaskMinutes += log.minutes
    }
    byActivityType[log.activity_type] += log.minutes
  })

  return {
    totalMinutes,
    billableMinutes,
    nonBillableMinutes,
    taskMinutes,
    nonTaskMinutes,
    byActivityType,
  }
}

// Get aggregated time stats for client
export function getClientTimeStats(clientId: string, month?: string): {
  totalMinutes: number
  billableMinutes: number
  byUser: { userId: string; userName: string; minutes: number }[]
  byActivityType: Record<ActivityType, number>
} {
  const clientLogs = getTimeLogsForClient(clientId).filter(tl =>
    !month || (tl.date && tl.date.startsWith(month))
  )

  const byActivityType: Record<ActivityType, number> = {
    task: 0,
    general: 0,
    admin: 0,
    meeting: 0,
    call: 0,
    email: 0,
  }

  const userMap = new Map<string, { userName: string; minutes: number }>()
  let totalMinutes = 0
  let billableMinutes = 0

  clientLogs.forEach(log => {
    totalMinutes += log.minutes
    if (log.is_billable) {
      billableMinutes += log.minutes
    }
    byActivityType[log.activity_type] += log.minutes

    const existing = userMap.get(log.user_id)
    if (existing) {
      existing.minutes += log.minutes
    } else {
      userMap.set(log.user_id, { userName: log.user_name, minutes: log.minutes })
    }
  })

  return {
    totalMinutes,
    billableMinutes,
    byUser: Array.from(userMap.entries()).map(([userId, data]) => ({
      userId,
      userName: data.userName,
      minutes: data.minutes,
    })),
    byActivityType,
  }
}

// Add a new time log
export function addTimeLog(log: Omit<TimeLog, 'id' | 'created_at'>): TimeLog {
  const newLog: TimeLog = {
    ...log,
    id: `tl-${Date.now()}`,
    created_at: new Date().toISOString(),
  }
  mockTimeLogs.push(newLog)
  return newLog
}

// Get user task settings
export function getUserTaskSettings(userId: string): UserTaskSettings | undefined {
  return mockUserTaskSettings.find(s => s.user_id === userId)
}

// Check if user can claim bonus tasks
export function canUserClaimBonus(userId: string): boolean {
  const settings = getUserTaskSettings(userId)
  if (!settings) return false
  return settings.can_claim_bonus && settings.quality_score >= mockTaskSystemSettings.min_quality_for_bonus
}

// Get available bonus tasks (not claimed)
export function getAvailableBonusTasks(): Task[] {
  return mockBonusTasks.filter(t => !t.claimed_by && t.status === 'pending')
}

// Get user's current WIP count
export function getUserWipCount(userId: string): { total: number; bonus: number } {
  const allTasks = [...mockTasks, ...mockBonusTasks]
  const inProgressStatuses: TaskStatus[] = ['accepted', 'in_progress', 'awaiting_approval']

  const userTasks = allTasks.filter(t =>
    t.assigned_to === userId &&
    inProgressStatuses.includes(t.status)
  )

  return {
    total: userTasks.length,
    bonus: userTasks.filter(t => getTaskType(t) === 'bonus').length,
  }
}

// Check if user can take more tasks
export function canUserTakeMoreTasks(userId: string): { canTake: boolean; canTakeBonus: boolean; reason?: string } {
  const settings = getUserTaskSettings(userId)
  if (!settings) return { canTake: false, canTakeBonus: false, reason: 'Uživatel nemá nastavení' }

  const wip = getUserWipCount(userId)

  const canTake = wip.total < settings.max_wip_total
  const canTakeBonus = settings.can_claim_bonus &&
                       wip.bonus < settings.max_wip_bonus &&
                       settings.quality_score >= mockTaskSystemSettings.min_quality_for_bonus

  let reason: string | undefined
  if (!canTake) {
    reason = `Dosažen limit ${settings.max_wip_total} rozpracovaných úkolů`
  } else if (!canTakeBonus && settings.can_claim_bonus) {
    if (settings.quality_score < mockTaskSystemSettings.min_quality_for_bonus) {
      reason = 'Kvalita pod minimem pro bonus úkoly'
    } else if (wip.bonus >= settings.max_wip_bonus) {
      reason = `Dosažen limit ${settings.max_wip_bonus} bonus úkolů`
    }
  }

  return { canTake, canTakeBonus, reason }
}

// FÁZE 6: Check monthly cutoff and base completion status
export function getMonthlyStatus(userId: string): {
  cutoffDay: number
  isBaseComplete: boolean
  canCashOut: boolean
  daysUntilCutoff: number
  baseRequired: number
  baseCompleted: number
  bonusPoints: number
} {
  const settings = getUserTaskSettings(userId)
  const today = new Date()
  const cutoffDay = mockTaskSystemSettings.monthly_cutoff_day

  // Calculate days until next cutoff
  let nextCutoff = new Date(today.getFullYear(), today.getMonth(), cutoffDay)
  if (today.getDate() >= cutoffDay) {
    nextCutoff = new Date(today.getFullYear(), today.getMonth() + 1, cutoffDay)
  }
  const daysUntilCutoff = Math.ceil((nextCutoff.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  // Check base completion
  const baseRequired = settings?.monthly_base_required || 0
  const baseCompleted = settings?.monthly_base_completed || 0
  const isBaseComplete = baseCompleted >= baseRequired
  const bonusPoints = settings?.monthly_bonus_points || 0

  return {
    cutoffDay,
    isBaseComplete,
    canCashOut: isBaseComplete && bonusPoints > 0 && !settings?.monthly_bonus_cashed_out,
    daysUntilCutoff,
    baseRequired,
    baseCompleted,
    bonusPoints,
  }
}

// Calculate inbox + overdue for menu badge
export function getAttentionRequiredCount(): number {
  const archivedStatuses: TaskStatus[] = ['completed', 'invoiced', 'cancelled']
  const waitingStatuses: TaskStatus[] = ['waiting_for', 'waiting_client']
  const inboxStatuses: TaskStatus[] = ['pending', 'clarifying']

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const allTasks = [...mockTasks, ...mockBonusTasks]

  // Inbox tasks
  const inboxTasks = allTasks.filter(t =>
    inboxStatuses.includes(t.status) &&
    !archivedStatuses.includes(t.status)
  )

  // Overdue tasks (not waiting, not archived)
  const overdueTasks = allTasks.filter(t => {
    if (archivedStatuses.includes(t.status)) return false
    if (waitingStatuses.includes(t.status)) return false
    if (inboxStatuses.includes(t.status)) return false // Already counted in inbox

    const dueDate = new Date(t.due_date)
    dueDate.setHours(0, 0, 0, 0)
    return dueDate < today
  })

  return inboxTasks.length + overdueTasks.length
}

// Get tasks awaiting approval (for manager view)
export function getTasksAwaitingApproval(): Task[] {
  const allTasks = [...mockTasks, ...mockBonusTasks]
  return allTasks.filter(t => t.status === 'awaiting_approval')
}

// FÁZE 7: Aggregate billable time logs by client for invoicing
export interface BillableSummary {
  company_id: string
  company_name: string
  totalMinutes: number
  totalAmount: number
  uninvoicedTasks: {
    task_id: string
    task_title: string
    minutes: number
    amount: number
    logs: TimeLog[]
  }[]
}

export function getBillableByClient(): BillableSummary[] {
  const allTasks = [...mockTasks, ...mockBonusTasks]
  const billableByCompany: Map<string, BillableSummary> = new Map()

  // Find tasks that are billable and completed (but not invoiced)
  const billableTasks = allTasks.filter(t =>
    t.is_billable &&
    t.status === 'completed' // Completed but not yet invoiced
  )

  for (const task of billableTasks) {
    const logs = getTimeLogsForTask(task.id)
    const taskMinutes = logs.reduce((sum, log) => sum + log.minutes, 0) || task.actual_minutes || 0
    const hourlyRate = task.hourly_rate || 0
    const taskAmount = Math.round((taskMinutes / 60) * hourlyRate)

    if (!billableByCompany.has(task.company_id)) {
      billableByCompany.set(task.company_id, {
        company_id: task.company_id,
        company_name: task.company_name,
        totalMinutes: 0,
        totalAmount: 0,
        uninvoicedTasks: [],
      })
    }

    const summary = billableByCompany.get(task.company_id)!
    summary.totalMinutes += taskMinutes
    summary.totalAmount += taskAmount
    summary.uninvoicedTasks.push({
      task_id: task.id,
      task_title: task.title,
      minutes: taskMinutes,
      amount: taskAmount,
      logs,
    })
  }

  return Array.from(billableByCompany.values()).sort((a, b) => b.totalAmount - a.totalAmount)
}

// ============================================
// CLIENT REQUESTS HELPER FUNCTIONS
// ============================================

// Get all client requests
export function getClientRequests(): ClientRequest[] {
  return mockClientRequests
}

// Get client requests for a specific client
export function getClientRequestsByClient(clientId: string): ClientRequest[] {
  return mockClientRequests.filter(r => r.client_id === clientId)
}

// Get client requests assigned to a user
export function getClientRequestsByAssignee(userId: string): ClientRequest[] {
  return mockClientRequests.filter(r => r.assigned_to === userId)
}

// Get new/unassigned requests (for manager view)
export function getUnassignedClientRequests(): ClientRequest[] {
  return mockClientRequests.filter(r => !r.assigned_to && r.status === 'new')
}

// Get active requests (not completed/rejected)
export function getActiveClientRequests(): ClientRequest[] {
  return mockClientRequests.filter(r => !['completed', 'rejected'].includes(r.status))
}

// Get request stats for dashboard
export function getClientRequestStats(): {
  total: number
  new: number
  inProgress: number
  urgent: number
  completed: number
} {
  const requests = mockClientRequests
  return {
    total: requests.length,
    new: requests.filter(r => r.status === 'new').length,
    inProgress: requests.filter(r => r.status === 'in_progress' || r.status === 'reviewed').length,
    urgent: requests.filter(r => r.priority === 'urgent' && r.status !== 'completed').length,
    completed: requests.filter(r => r.status === 'completed').length,
  }
}

// Get category label
export function getRequestCategoryLabel(category: ClientRequestCategory): string {
  const labels: Record<ClientRequestCategory, string> = {
    accounting: 'Účetnictví',
    tax: 'Daně',
    payroll: 'Mzdy',
    consulting: 'Poradenství',
    documents: 'Dokumenty',
    other: 'Ostatní',
  }
  return labels[category]
}

// Get priority label
export function getRequestPriorityLabel(priority: ClientRequestPriority): string {
  const labels: Record<ClientRequestPriority, string> = {
    low: 'Nízká',
    normal: 'Normální',
    high: 'Vysoká',
    urgent: 'Urgentní',
  }
  return labels[priority]
}

// Get status label
export function getRequestStatusLabel(status: ClientRequestStatus): string {
  const labels: Record<ClientRequestStatus, string> = {
    new: 'Nový',
    reviewed: 'Posouzeno',
    in_progress: 'Řeší se',
    completed: 'Vyřešeno',
    rejected: 'Zamítnuto',
  }
  return labels[status]
}

// Add new client request
export function addClientRequest(request: Omit<ClientRequest, 'id' | 'created_at' | 'updated_at'>): ClientRequest {
  const newRequest: ClientRequest = {
    ...request,
    id: `req-${Date.now()}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  mockClientRequests.push(newRequest)
  return newRequest
}

// Update client request
export function updateClientRequest(id: string, updates: Partial<ClientRequest>): ClientRequest | null {
  const index = mockClientRequests.findIndex(r => r.id === id)
  if (index === -1) return null

  mockClientRequests[index] = {
    ...mockClientRequests[index],
    ...updates,
    updated_at: new Date().toISOString(),
  }
  return mockClientRequests[index]
}
