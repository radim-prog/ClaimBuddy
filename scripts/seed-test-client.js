/**
 * Seed script: fills test client "radim-klient" company with data in ALL categories.
 * Company: financniportal.cz s.r.o. (9912feb5-ca03-48aa-9bd0-09b9769cfdd9)
 * User: Radim (klient) (d84a9316-03e5-4ce3-bab8-c0f340042f1e)
 *
 * Run: node scripts/seed-test-client.js
 */

const { createClient } = require('@supabase/supabase-js')

const SK = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SK) throw new Error('SUPABASE_SERVICE_ROLE_KEY env var is required')
const supabase = createClient(process.env.SUPABASE_URL || 'https://ybcubkuskirbspyoxpak.supabase.co', SK)

const COMPANY_ID = '9912feb5-ca03-48aa-9bd0-09b9769cfdd9'
const USER_ID = 'd84a9316-03e5-4ce3-bab8-c0f340042f1e'
const COMPANY_NAME = 'financniportal.cz s.r.o.'

async function seed() {
  console.log('=== Seeding test client data ===\n')

  // 1. UPDATE existing closures (Jan=complete, Feb=in-progress) + add March
  console.log('1. Monthly closures...')

  // January - complete (approved)
  await supabase.from('monthly_closures').update({
    status: 'approved',
    bank_statement_status: 'uploaded',
    bank_statement_uploaded_at: '2026-02-05T10:00:00Z',
    expense_invoices_status: 'uploaded',
    expense_invoices_count: 3,
    receipts_status: 'uploaded',
    receipts_count: 2,
    income_invoices_status: 'uploaded',
    income_invoices_count: 2,
    vat_payable: 4200,
    vat_due_date: '2026-02-25',
    income_tax_accrued: 15000,
    social_insurance: 3852,
    health_insurance: 2968,
    cash_income: 5000,
    cash_expense: 1200,
    cash_documents_status: 'uploaded',
    closed_at: '2026-02-10T14:30:00Z',
    closed_by: USER_ID,
    notes: 'Vše kompletní, uzavřeno v termínu.',
    updated_at: new Date().toISOString(),
  }).eq('id', 'c909935a-52da-4032-8aee-b120fcfa51c5')

  // February - in progress (some uploaded, some missing)
  await supabase.from('monthly_closures').update({
    status: 'in_progress',
    bank_statement_status: 'uploaded',
    bank_statement_uploaded_at: '2026-03-08T09:00:00Z',
    expense_invoices_status: 'uploaded',
    expense_invoices_count: 2,
    receipts_status: 'missing',
    receipts_count: 0,
    income_invoices_status: 'uploaded',
    income_invoices_count: 1,
    vat_payable: 3100,
    vat_due_date: '2026-03-25',
    cash_income: 3000,
    cash_expense: 800,
    cash_documents_status: 'missing',
    notes: 'Chybí účtenky a hotovostní doklady.',
    updated_at: new Date().toISOString(),
  }).eq('id', '57b13b48-471b-4a28-ae94-1c27767f6225')

  // March - current month (open, nothing yet)
  const { error: marchErr } = await supabase.from('monthly_closures').upsert({
    company_id: COMPANY_ID,
    period: '2026-03',
    status: 'open',
    bank_statement_status: 'missing',
    expense_invoices_status: 'missing',
    expense_invoices_count: 0,
    receipts_status: 'missing',
    receipts_count: 0,
    income_invoices_status: 'missing',
    income_invoices_count: 0,
    company_name: COMPANY_NAME,
    vat_status: 'not_applicable',
    cash_income: 0,
    cash_expense: 0,
    cash_documents_status: 'not_applicable',
  }, { onConflict: 'company_id,period' })
  if (marchErr) console.log('  March closure error:', marchErr.message)
  else console.log('  ✓ 3 closures (Jan=approved, Feb=in_progress, Mar=open)')

  // 2. DOCUMENTS (8 docs across different types and months)
  console.log('2. Documents...')
  const documents = [
    { period: '2026-01', type: 'expense_invoice', file_name: 'FA-2026-001-alza.pdf', supplier_name: 'Alza.cz a.s.', supplier_ico: '27082440', total_without_vat: 8264, total_vat: 1735, total_with_vat: 9999, variable_symbol: '2026000101', document_number: 'FA-2026-001', date_issued: '2026-01-15', status: 'approved' },
    { period: '2026-01', type: 'expense_invoice', file_name: 'FA-2026-002-vodafone.pdf', supplier_name: 'Vodafone Czech Republic a.s.', supplier_ico: '25788001', total_without_vat: 450, total_vat: 94.5, total_with_vat: 544.5, variable_symbol: '2026000102', document_number: 'FA-2026-002', date_issued: '2026-01-20', status: 'approved' },
    { period: '2026-01', type: 'receipt', file_name: 'uctenka-benzin-jan.jpg', supplier_name: 'Shell', total_without_vat: 1240, total_vat: 260, total_with_vat: 1500, status: 'approved' },
    { period: '2026-01', type: 'bank_statement', file_name: 'vypis-fio-2026-01.pdf', supplier_name: 'Fio banka, a.s.', status: 'approved' },
    { period: '2026-02', type: 'expense_invoice', file_name: 'FA-2026-010-czc.pdf', supplier_name: 'CZC.cz s.r.o.', supplier_ico: '25679066', total_without_vat: 4132, total_vat: 867.72, total_with_vat: 4999.72, variable_symbol: '2026000201', document_number: 'FA-2026-010', date_issued: '2026-02-10', status: 'approved' },
    { period: '2026-02', type: 'expense_invoice', file_name: 'FA-2026-011-hosting.pdf', supplier_name: 'WEDOS Internet, a.s.', supplier_ico: '26167131', total_without_vat: 990, total_vat: 207.9, total_with_vat: 1197.9, variable_symbol: '2026000202', document_number: 'FA-2026-011', date_issued: '2026-02-18', status: 'pending' },
    { period: '2026-02', type: 'bank_statement', file_name: 'vypis-fio-2026-02.pdf', supplier_name: 'Fio banka, a.s.', status: 'approved' },
    { period: '2026-01', type: 'income_invoice', file_name: 'FV-2026-001-klient.pdf', supplier_name: 'WikiPoradce s.r.o.', total_without_vat: 25000, total_vat: 5250, total_with_vat: 30250, variable_symbol: '2026010001', document_number: 'FV-2026-001', date_issued: '2026-01-31', status: 'approved' },
  ]

  for (const doc of documents) {
    const { error } = await supabase.from('documents').insert({
      company_id: COMPANY_ID,
      period: doc.period,
      type: doc.type,
      file_name: doc.file_name,
      supplier_name: doc.supplier_name,
      supplier_ico: doc.supplier_ico || null,
      total_without_vat: doc.total_without_vat || null,
      total_vat: doc.total_vat || null,
      total_with_vat: doc.total_with_vat || null,
      variable_symbol: doc.variable_symbol || null,
      document_number: doc.document_number || null,
      date_issued: doc.date_issued || null,
      status: doc.status,
      uploaded_by: USER_ID,
      uploaded_at: new Date().toISOString(),
      upload_source: 'manual',
      currency: 'CZK',
      confidence_score: 0.95,
      ocr_processed: true,
      ocr_status: 'completed',
    })
    if (error) console.log('  Doc error:', doc.file_name, error.message)
  }
  console.log('  ✓ 8 documents (invoices, receipts, bank statements)')

  // 3. INVOICES (issued by the company - income)
  console.log('3. Invoices...')
  const invoices = [
    {
      type: 'income', invoice_number: 'FV-2026-0002', variable_symbol: '20260002',
      issue_date: '2026-01-15', due_date: '2026-01-29', period: '2026-01',
      partner: { name: 'ABC Consulting s.r.o.', ico: '12345678' },
      items: [{ id: 'i1', description: 'Účetní služby - leden 2026', quantity: 1, unit: 'měs', unit_price: 15000, vat_rate: 21, total_without_vat: 15000, total_with_vat: 18150 }],
      total_without_vat: 15000, total_vat: 3150, total_with_vat: 18150,
      payment_status: 'paid', paid_at: '2026-01-25', paid_amount: 18150,
      document_type: 'invoice',
    },
    {
      type: 'income', invoice_number: 'FV-2026-0003', variable_symbol: '20260003',
      issue_date: '2026-02-01', due_date: '2026-02-15', period: '2026-02',
      partner: { name: 'XYZ Development a.s.', ico: '87654321' },
      items: [{ id: 'i1', description: 'Webový vývoj - únor', quantity: 40, unit: 'hod', unit_price: 1500, vat_rate: 21, total_without_vat: 60000, total_with_vat: 72600 }],
      total_without_vat: 60000, total_vat: 12600, total_with_vat: 72600,
      payment_status: 'paid', paid_at: '2026-02-12', paid_amount: 72600,
      document_type: 'invoice',
    },
    {
      type: 'income', invoice_number: 'FV-2026-0004', variable_symbol: '20260004',
      issue_date: '2026-03-01', due_date: '2026-03-15', period: '2026-03',
      partner: { name: 'ABC Consulting s.r.o.', ico: '12345678' },
      items: [{ id: 'i1', description: 'Účetní služby - březen 2026', quantity: 1, unit: 'měs', unit_price: 15000, vat_rate: 21, total_without_vat: 15000, total_with_vat: 18150 }],
      total_without_vat: 15000, total_vat: 3150, total_with_vat: 18150,
      payment_status: 'unpaid', paid_at: null, paid_amount: 0,
      document_type: 'invoice',
    },
    {
      type: 'income', invoice_number: 'ZF-2026-0001', variable_symbol: '20260101',
      issue_date: '2026-02-20', due_date: '2026-03-05', period: '2026-02',
      partner: { name: 'Nový Klient s.r.o.', ico: '99887766' },
      items: [{ id: 'i1', description: 'Záloha na služby Q1/2026', quantity: 1, unit: 'ks', unit_price: 30000, vat_rate: 21, total_without_vat: 30000, total_with_vat: 36300 }],
      total_without_vat: 30000, total_vat: 6300, total_with_vat: 36300,
      payment_status: 'paid', paid_at: '2026-03-03', paid_amount: 36300,
      document_type: 'proforma',
    },
  ]

  for (const inv of invoices) {
    const { error } = await supabase.from('invoices').insert({
      company_id: COMPANY_ID,
      company_name: COMPANY_NAME,
      type: inv.type,
      invoice_number: inv.invoice_number,
      variable_symbol: inv.variable_symbol,
      issue_date: inv.issue_date,
      due_date: inv.due_date,
      period: inv.period,
      partner: inv.partner,
      items: inv.items,
      total_without_vat: inv.total_without_vat,
      total_vat: inv.total_vat,
      total_with_vat: inv.total_with_vat,
      payment_status: inv.payment_status,
      paid_at: inv.paid_at,
      paid_amount: inv.paid_amount,
      document_type: inv.document_type,
      created_by: USER_ID,
    })
    if (error) console.log('  Invoice error:', inv.invoice_number, error.message)
  }
  console.log('  ✓ 4 invoices (3 faktury + 1 proforma)')

  // 4. CHATS + MESSAGES
  console.log('4. Chats & messages...')
  const chatInserts = [
    {
      type: 'company',
      company_id: COMPANY_ID,
      participants: [USER_ID],
      subject: 'Chybějící účtenky za leden',
      status: 'resolved',
      started_by: USER_ID,
      completed_at: '2026-02-08T15:00:00Z',
    },
    {
      type: 'company',
      company_id: COMPANY_ID,
      participants: [USER_ID],
      subject: 'Dotaz k DPH za únor',
      status: 'open',
      started_by: USER_ID,
      waiting_since: '2026-03-10T10:00:00Z',
    },
    {
      type: 'company',
      company_id: COMPANY_ID,
      participants: [USER_ID],
      subject: 'Změna fakturačních údajů',
      status: 'open',
      started_by: USER_ID,
    },
  ]

  const chatIds = []
  for (const chat of chatInserts) {
    const { data, error } = await supabase.from('chats').insert(chat).select('id').single()
    if (error) console.log('  Chat error:', error.message)
    else chatIds.push(data.id)
  }

  // Messages for chat 1 (resolved)
  if (chatIds[0]) {
    const msgs1 = [
      { chat_id: chatIds[0], sender_id: USER_ID, sender_name: 'Radim (klient)', sender_type: 'client', text: 'Dobrý den, nemohu najít účtenky za benzín z ledna. Můžete mi poradit, jestli je potřebuji?' },
      { chat_id: chatIds[0], sender_id: USER_ID, sender_name: 'Účetní', sender_type: 'accountant', text: 'Dobrý den, ano, účtenky za pohonné hmoty potřebujeme pro daňové odpočty. Nahrajte je prosím do sekce Doklady → Účtenky.' },
      { chat_id: chatIds[0], sender_id: USER_ID, sender_name: 'Radim (klient)', sender_type: 'client', text: 'Děkuji, právě jsem je nahrál. Najdete je v lednu.' },
      { chat_id: chatIds[0], sender_id: USER_ID, sender_name: 'Účetní', sender_type: 'accountant', text: 'Výborně, vidím je. Vše je v pořádku, leden je uzavřen. ✓' },
    ]
    for (const m of msgs1) {
      await supabase.from('chat_messages').insert({ ...m, read: true, read_at: new Date().toISOString() })
    }
  }

  // Messages for chat 2 (open, waiting for response)
  if (chatIds[1]) {
    const msgs2 = [
      { chat_id: chatIds[1], sender_id: USER_ID, sender_name: 'Radim (klient)', sender_type: 'client', text: 'Dobrý den, mám dotaz ohledně DPH za únor. Faktura od CZC za 4999.72 Kč - je to s DPH nebo bez?' },
      { chat_id: chatIds[1], sender_id: USER_ID, sender_name: 'Účetní', sender_type: 'accountant', text: 'Dobrý den, částka 4999.72 Kč je včetně DPH. Základ je 4132 Kč a DPH 867.72 Kč (21%). Toto již máme správně zaúčtováno.' },
      { chat_id: chatIds[1], sender_id: USER_ID, sender_name: 'Radim (klient)', sender_type: 'client', text: 'A ještě - mohu si odečíst DPH z hostingu od WEDOS? Jsem neplátce DPH.' },
    ]
    for (const m of msgs2) {
      await supabase.from('chat_messages').insert({ ...m, read: true })
    }
  }

  // Messages for chat 3 (open, just started)
  if (chatIds[2]) {
    await supabase.from('chat_messages').insert({
      chat_id: chatIds[2], sender_id: USER_ID, sender_name: 'Radim (klient)', sender_type: 'client',
      text: 'Dobrý den, od příštího měsíce budeme fakturovat z nové adresy: Vinohradská 42, Praha 2. Můžete to prosím aktualizovat?',
      read: false,
    })
  }

  // Update last_message for chats
  for (let i = 0; i < chatIds.length; i++) {
    const { data: lastMsg } = await supabase.from('chat_messages').select('text, created_at').eq('chat_id', chatIds[i]).order('created_at', { ascending: false }).limit(1).single()
    if (lastMsg) {
      await supabase.from('chats').update({
        last_message_at: lastMsg.created_at,
        last_message_preview: lastMsg.text.substring(0, 100),
      }).eq('id', chatIds[i])
    }
  }
  console.log('  ✓ 3 chats with 8 messages')

  // 5. TRAVEL - vehicle, driver, places, trips
  console.log('5. Travel (kniha jízd)...')

  // Vehicle
  const { data: vehicle } = await supabase.from('travel_vehicles').insert({
    company_id: COMPANY_ID,
    name: 'Škoda Octavia',
    license_plate: '1AB 2345',
    brand: 'Škoda',
    model: 'Octavia',
    year: 2022,
    fuel_type: 'diesel',
    fuel_consumption: 5.8,
    tank_capacity: 50,
    current_odometer: 45230,
    rate_per_km: 5.6,
    is_company_car: true,
    is_active: true,
    vehicle_category: 'osobni',
  }).select('id').single()
  const vehicleId = vehicle?.id

  // Driver
  const { data: driver } = await supabase.from('travel_drivers').insert({
    company_id: COMPANY_ID,
    name: 'Radim Zajíček',
    email: 'radim@financniportal.cz',
    phone: '+420 777 888 999',
    is_default: true,
    is_active: true,
  }).select('id').single()
  const driverId = driver?.id

  // Places
  const places = [
    { name: 'Kancelář Praha', address: 'Vinohradská 42, Praha 2', is_favorite: true, visit_count: 20 },
    { name: 'Klient ABC Consulting', address: 'Národní 15, Praha 1', is_favorite: true, visit_count: 8 },
    { name: 'Finanční úřad Praha 2', address: 'Italská 1583/6, Praha 2', is_favorite: false, visit_count: 3 },
    { name: 'Brno - pobočka', address: 'Masarykova 12, Brno', is_favorite: true, visit_count: 5 },
  ]
  const placeIds = []
  for (const p of places) {
    const { data } = await supabase.from('travel_places').insert({ company_id: COMPANY_ID, ...p }).select('id').single()
    if (data) placeIds.push(data.id)
  }

  // Trips
  if (vehicleId && driverId) {
    const trips = [
      { trip_date: '2026-01-10', departure_time: '08:00', arrival_time: '08:45', origin: 'Kancelář Praha', destination: 'Klient ABC Consulting', purpose: 'Jednání s klientem - roční uzávěrka', trip_type: 'business', distance_km: 12, odometer_start: 44800, odometer_end: 44812, is_round_trip: true },
      { trip_date: '2026-01-22', departure_time: '09:30', arrival_time: '10:00', origin: 'Kancelář Praha', destination: 'Finanční úřad Praha 2', purpose: 'Podání přiznání k DPH', trip_type: 'business', distance_km: 5, odometer_start: 44812, odometer_end: 44817, is_round_trip: true },
      { trip_date: '2026-02-05', departure_time: '07:00', arrival_time: '09:30', origin: 'Kancelář Praha', destination: 'Brno - pobočka', purpose: 'Kontrola účetnictví pobočky', trip_type: 'business', distance_km: 210, odometer_start: 44817, odometer_end: 45027, is_round_trip: false },
      { trip_date: '2026-02-05', departure_time: '16:00', arrival_time: '18:30', origin: 'Brno - pobočka', destination: 'Kancelář Praha', purpose: 'Návrat z Brna', trip_type: 'business', distance_km: 210, odometer_start: 45027, odometer_end: 45237, is_round_trip: false },
      { trip_date: '2026-03-12', departure_time: '10:00', arrival_time: '10:30', origin: 'Kancelář Praha', destination: 'Klient ABC Consulting', purpose: 'Předání Q1 reportu', trip_type: 'business', distance_km: 12, odometer_start: 45237, odometer_end: 45249, is_round_trip: true },
    ]
    for (const t of trips) {
      const { error } = await supabase.from('travel_trips').insert({
        company_id: COMPANY_ID,
        vehicle_id: vehicleId,
        driver_id: driverId,
        ...t,
        basic_rate_per_km: 5.6,
        fuel_price_per_unit: 38.5,
        reimbursement: Math.round(t.distance_km * 5.6),
      })
      if (error) console.log('  Trip error:', error.message)
    }
  }
  console.log('  ✓ 1 vehicle, 1 driver, 4 places, 5 trips')

  // 6. TAX CONFIG
  console.log('6. Tax config...')
  const { error: taxErr } = await supabase.from('tax_annual_config').insert({
    company_id: COMPANY_ID,
    year: 2026,
    mortgage_interest: 45000,
    savings_contributions: 12000,
    other_deductions: 0,
    taxpayer_discount: true,
    children_count: 2,
    children_details: [
      { age: 8, disabled: false, student: false },
      { age: 12, disabled: false, student: false },
    ],
    other_credits: 0,
    social_advances_paid: 46224,
    health_advances_paid: 35616,
    initial_tax_base: 0,
    annual_revenue: 750000,
    annual_expenses: 480000,
    is_flat_tax: false,
    is_secondary_activity: false,
    months_active: 12,
    notes: 'OSVČ - hlavní činnost, 2 děti',
    updated_by: USER_ID,
  })
  if (taxErr) console.log('  Tax config error:', taxErr.message)

  // Tax period data - monthly breakdown
  const monthlyTax = [
    { period: '2026-01', revenue: 65000, expenses: 42000 },
    { period: '2026-02', revenue: 72000, expenses: 38000 },
    { period: '2026-03', revenue: 58000, expenses: 35000 },
  ]
  for (const mt of monthlyTax) {
    const { error } = await supabase.from('tax_period_data').insert({
      company_id: COMPANY_ID,
      period: mt.period,
      revenue: mt.revenue,
      expenses: mt.expenses,
    })
    if (error) console.log('  Tax period error:', mt.period, error.message)
  }
  console.log('  ✓ Annual config + 3 monthly periods')

  // 7. CASH TRANSACTIONS
  console.log('7. Cash transactions...')
  const cashTxns = [
    { period: '2026-01', type: 'income', amount: 3000, description: 'Hotovostní úhrada od klienta', date: '2026-01-18' },
    { period: '2026-01', type: 'income', amount: 2000, description: 'Hotovostní tržba - konzultace', date: '2026-01-25' },
    { period: '2026-01', type: 'expense', amount: 800, description: 'Kancelářské potřeby', date: '2026-01-20' },
    { period: '2026-01', type: 'expense', amount: 400, description: 'Poštovné', date: '2026-01-28' },
    { period: '2026-02', type: 'income', amount: 3000, description: 'Hotovostní úhrada - poradenství', date: '2026-02-12' },
    { period: '2026-02', type: 'expense', amount: 800, description: 'Kancelářské potřeby', date: '2026-02-15' },
  ]

  // Check cash_transactions schema first
  const { error: cashSchemaErr } = await supabase.from('cash_transactions').select('*').limit(0)
  if (cashSchemaErr) {
    console.log('  ⚠ cash_transactions table issue:', cashSchemaErr.message)
  } else {
    for (const tx of cashTxns) {
      const { error } = await supabase.from('cash_transactions').insert({
        company_id: COMPANY_ID,
        period: tx.period,
        type: tx.type,
        amount: tx.amount,
        description: tx.description,
        date: tx.date,
        created_by: USER_ID,
      })
      if (error) console.log('  Cash tx error:', error.message)
    }
    console.log('  ✓ 6 cash transactions')
  }

  // 8. MONTHLY PAYMENTS
  console.log('8. Monthly payments...')
  const payments = [
    { period: '2026-01', paid: true, paid_at: '2026-02-03T10:00:00Z' },
    { period: '2026-02', paid: true, paid_at: '2026-03-05T09:30:00Z' },
    { period: '2026-03', paid: false, paid_at: null },
  ]
  for (const p of payments) {
    const { error } = await supabase.from('monthly_payments').upsert({
      company_id: COMPANY_ID,
      period: p.period,
      paid: p.paid,
      paid_at: p.paid_at,
      updated_by: USER_ID,
    }, { onConflict: 'company_id,period' })
    if (error) console.log('  Payment error:', p.period, error.message)
  }
  console.log('  ✓ 3 monthly payments (Jan+Feb paid, Mar unpaid)')

  // 9. UPDATE company with some details
  console.log('9. Company details...')
  await supabase.from('companies').update({
    vat_payer: false,
    legal_form: 'sro',
    address: 'Vinohradská 42, 120 00 Praha 2',
    email: 'info@financniportal.cz',
    phone: '+420 777 888 999',
    bank_account: '2901234567/2010',
    status: 'active',
    has_employees: false,
    managing_director: 'Radim Zajíček',
    monthly_reporting: true,
    accounting_start_date: '2025-01-01',
  }).eq('id', COMPANY_ID)
  console.log('  ✓ Company details updated')

  console.log('\n=== DONE! ===')
  console.log('Login: radim-klient / (existing password)')
  console.log('Company: financniportal.cz s.r.o.')
  console.log('Data: closures(3), docs(8), invoices(5), chats(3), trips(5), tax config, cash(6), payments(3)')
}

seed().catch(console.error)
