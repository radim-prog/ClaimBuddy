// Mock data pro testování UI (než napojíme backend)

import { TaskTimelineEvent } from '@/lib/types/tasks'
import { Employee, Deduction } from '@/lib/types/employee'
import { Asset } from '@/lib/types/asset'
import { Insurance } from '@/lib/types/insurance'

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
    priority: 'medium',
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    assigned_to: 'user-2-accountant',
    assigned_to_name: 'Jana Svobodová',
    is_waiting_for: false,
    due_date: '2025-12-23',
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
    priority: 'critical',
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    assigned_to: 'user-2-accountant',
    assigned_to_name: 'Jana Svobodová',
    is_waiting_for: false,
    due_date: '2025-12-25',
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
    created_at: '2025-12-15T09:00:00Z',
    updated_at: '2025-12-22T10:30:00Z',
  },

  // IN PROGRESS - rozpracovaný úkol
  {
    id: 'task-bcd-3',
    title: 'Zaúčtovat mzdy - prosinec',
    description: 'Zaúčtování mezd pro 3 zaměstnance včetně srážek a odvodů',
    is_project: false,
    status: 'in_progress',
    priority: 'high',
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    assigned_to: 'user-2-accountant',
    assigned_to_name: 'Jana Svobodová',
    is_waiting_for: false,
    due_date: '2025-12-28',
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
    priority: 'medium',
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    assigned_to: 'user-2-accountant',
    assigned_to_name: 'Jana Svobodová',
    is_waiting_for: true,
    waiting_for_who: 'Klient BCD Finance',
    waiting_for_what: 'Chybějící faktury za IT služby a marketing',
    due_date: '2025-12-30',
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
    priority: 'high',
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    assigned_to: 'user-2-accountant',
    assigned_to_name: 'Jana Svobodová',
    is_waiting_for: false,
    due_date: '2026-01-31',
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
    priority: 'low',
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    assigned_to: 'user-4-assistant',
    assigned_to_name: 'Marie Dvořáková',
    is_waiting_for: false,
    due_date: '2025-12-31',
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
    priority: 'high',
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    assigned_to: 'user-2-accountant',
    assigned_to_name: 'Jana Svobodová',
    is_waiting_for: false,
    due_date: '2025-12-15',
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
    priority: 'low',
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    assigned_to: 'user-2-accountant',
    assigned_to_name: 'Jana Svobodová',
    is_waiting_for: false,
    due_date: '2026-03-31',
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
    priority: 'medium',
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    assigned_to: 'user-2-accountant',
    assigned_to_name: 'Jana Svobodová',
    is_waiting_for: false,
    due_date: '2025-12-15',
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
    priority: 'medium',
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    assigned_to: 'user-2-accountant',
    assigned_to_name: 'Jana Svobodová',
    is_waiting_for: false,
    due_date: '2025-12-23',
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
    created_at: '2025-12-20T09:00:00Z',
    updated_at: '2025-12-20T09:00:00Z',
  },

  // MEETING - schůzka
  {
    id: 'task-bcd-11',
    title: 'Schůzka s jednatelem - roční výsledky',
    description: 'Osobní schůzka k projednání hospodářských výsledků za rok 2025',
    is_project: false,
    status: 'accepted',
    priority: 'high',
    created_by: 'user-1-client',
    created_by_name: 'Karel Novák',
    assigned_to: 'user-2-accountant',
    assigned_to_name: 'Jana Svobodová',
    is_waiting_for: false,
    due_date: '2025-12-27',
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
    priority: 'medium',
    created_by: 'user-2-accountant',
    created_by_name: 'Jana Svobodová',
    assigned_to: 'user-2-accountant',
    assigned_to_name: 'Jana Svobodová',
    is_waiting_for: true,
    waiting_for_who: 'Jednatel BCD Finance',
    waiting_for_what: 'Informace o původu platby',
    due_date: '2025-12-24',
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

// Get tasks by company
export function getTasksByCompany(companyId: string) {
  return mockTasks.filter(t => t.company_id === companyId)
}

// Get all tasks
export function getAllTasks() {
  return mockTasks
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
