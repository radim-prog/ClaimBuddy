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

// Mock tasks pro účetní
export const mockTasks = [
  {
    id: 'task-1',
    company_id: 'company-1',
    company_name: 'ABC s.r.o.',
    title: 'Chybí výpis z účtu za listopad',
    description: 'Klient dosud nenahrál bankovní výpis za období 2025-11',
    priority: 'high' as const,
    status: 'pending' as const,
    due_date: '2025-11-30',
    created_at: '2025-11-20T10:00:00Z',
  },
  {
    id: 'task-2',
    company_id: 'company-2',
    company_name: 'XYZ OSVČ',
    title: 'Urgovat účtenky za listopad',
    description: 'Klient nenahrál žádné účtenky, deadline za 3 dny',
    priority: 'high' as const,
    status: 'pending' as const,
    due_date: '2025-11-28',
    created_at: '2025-11-18T14:30:00Z',
  },
  {
    id: 'task-3',
    company_id: 'company-3',
    company_name: 'DEF s.r.o.',
    title: 'Schválit výdajové faktury',
    description: '5 faktur čeká na schválení',
    priority: 'medium' as const,
    status: 'pending' as const,
    due_date: '2025-11-29',
    created_at: '2025-11-22T09:15:00Z',
  },
  {
    id: 'task-4',
    company_id: 'company-4',
    company_name: 'GHI Trading',
    title: 'DPH přiznání - říjen 2025',
    description: 'Připravit a podat DPH přiznání do 25.11.',
    priority: 'high' as const,
    status: 'in_progress' as const,
    due_date: '2025-11-25',
    created_at: '2025-11-15T11:00:00Z',
  },
  {
    id: 'task-5',
    company_id: 'company-5',
    company_name: 'JKL Consulting',
    title: 'Zkontrolovat příjmové faktury',
    description: 'Ověřit správnost 3 nových faktur',
    priority: 'low' as const,
    status: 'pending' as const,
    due_date: '2025-12-05',
    created_at: '2025-11-23T16:20:00Z',
  },
  {
    id: 'task-6',
    company_id: 'company-1',
    company_name: 'ABC s.r.o.',
    title: 'Zaúčtovat mzdy - říjen',
    description: 'Zpracovat mzdové podklady a zaúčtovat',
    priority: 'medium' as const,
    status: 'completed' as const,
    due_date: '2025-11-15',
    created_at: '2025-11-10T08:00:00Z',
  },
  {
    id: 'task-7',
    company_id: 'company-6',
    company_name: 'MNO Services s.r.o.',
    title: 'Urgovat příjmové faktury',
    description: 'Klient nenahrál faktury za říjen',
    priority: 'high' as const,
    status: 'pending' as const,
    due_date: '2025-11-27',
    created_at: '2025-11-21T13:45:00Z',
  },
  {
    id: 'task-8',
    company_id: 'company-7',
    company_name: 'PQR Development',
    title: 'Měsíční uzávěrka - říjen',
    description: 'Dokončit měsíční uzávěrku za říjen 2025',
    priority: 'medium' as const,
    status: 'completed' as const,
    due_date: '2025-11-10',
    created_at: '2025-11-01T09:00:00Z',
  },
  {
    id: 'task-9',
    company_id: 'company-8',
    company_name: 'STU Marketing OSVČ',
    title: 'Chybí bankovní výpis',
    description: 'Nenahrán výpis za říjen 2025',
    priority: 'high' as const,
    status: 'pending' as const,
    due_date: '2025-11-26',
    created_at: '2025-11-19T10:30:00Z',
  },
  {
    id: 'task-10',
    company_id: 'company-9',
    company_name: 'VWX Logistics s.r.o.',
    title: 'Kontrola účetní závěrky',
    description: 'Příprava podkladů pro roční závěrku',
    priority: 'low' as const,
    status: 'pending' as const,
    due_date: '2025-12-15',
    created_at: '2025-11-20T15:00:00Z',
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
