// Mock data pro testování UI (než napojíme backend)

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
      expense_invoices_status: status,
      receipts_status: status,
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

// Mock documents (10 ukázkových dokumentů)
export const mockDocuments = [
  {
    id: 'doc-1',
    company_id: 'company-1',
    period: '2025-01',
    type: 'receipt' as const,
    file_name: 'uctenka-potraviny.jpg',
    file_url: 'https://example.com/doc1.jpg',
    file_size: 245000,
    google_drive_file_id: 'drive-id-1',
    upload_source: 'web' as const,
    uploaded_by: 'user-1-client',
    ocr_processed: true,
    ocr_data: {
      extracted_text: 'TESCO\nDatum: 15.01.2025\nCelkem: 450 Kč',
      parsed_fields: {
        date: '2025-01-15',
        total_amount: 450,
        supplier_name: 'TESCO',
        confidence: 0.95,
      },
    },
    created_at: '2025-01-15T14:30:00Z',
  },
  {
    id: 'doc-2',
    company_id: 'company-1',
    period: '2025-01',
    type: 'bank_statement' as const,
    file_name: 'vypis-leden-2025.pdf',
    file_url: 'https://example.com/doc2.pdf',
    file_size: 1024000,
    google_drive_file_id: 'drive-id-2',
    upload_source: 'web' as const,
    uploaded_by: 'user-1-client',
    ocr_processed: false,
    ocr_data: null,
    created_at: '2025-02-01T09:00:00Z',
  },
  // Další dokumenty...
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
