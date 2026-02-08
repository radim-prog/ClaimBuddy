// Seed script: pohoda companies + closures + VAT returns → Supabase
// Run: cd /root/Projects/UcetniWebApp && npx tsx scripts/seed-supabase.ts

import { createClient } from '@supabase/supabase-js'
import { pohodaCompanies } from '../lib/pohoda-real-data'

const supabase = createClient(
  'https://ybcubkuskirbspyoxpak.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliY3Via3Vza2lyYnNweW94cGFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzkxNzE1OCwiZXhwIjoyMDc5NDkzMTU4fQ.zVg4FIzm-DT3bRZZMXHF5a1647MGwFaGg-SLEEq5880'
)

async function seedCompanies() {
  console.log(`Seeding ${pohodaCompanies.length} companies...`)

  // Clear existing companies first
  const { error: delError } = await supabase.from('companies').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (delError) console.log('Delete warning (OK if empty):', delError.message)

  // Map pohoda data to Supabase schema
  const rows = pohodaCompanies.map((c: any) => ({
    // Use the pohoda ICO as stable identifier part of UUID
    name: c.name,
    ico: c.ico,
    dic: c.dic || null,
    legal_form: c.legal_form,
    vat_payer: c.vat_payer,
    vat_period: c.vat_period || null,
    address: { street: c.street || '', city: c.city || '', zip: c.zip || '' },
    email: c.email || null,
    phone: c.phone || null,
    pohoda_id: c.pohoda_ico || c.ico,
    bank_account: c.bank_account || null,
    status: c.status || 'active',
    reliability_score: c.reliability_score ?? 2,
    pohoda_years: c.pohoda_years || [],
    invoice_stats: c.invoice_stats || {},
    total_revenue: c.total_revenue || 0,
    has_employees: c.has_employees || false,
    group_name: c.group_name || null,
    created_at: c.created_at || '2025-01-01T00:00:00Z',
  }))

  // Insert in batches of 50
  for (let i = 0; i < rows.length; i += 50) {
    const batch = rows.slice(i, i + 50)
    const { error } = await supabase.from('companies').insert(batch)
    if (error) {
      console.error(`Batch ${i / 50 + 1} error:`, error.message)
      // Try one by one for debugging
      for (const row of batch) {
        const { error: e } = await supabase.from('companies').insert(row)
        if (e) console.error(`  Failed: ${row.name} (${row.ico}):`, e.message)
      }
    } else {
      console.log(`  Batch ${i / 50 + 1}: ${batch.length} companies inserted`)
    }
  }

  // Verify
  const { count } = await supabase.from('companies').select('*', { count: 'exact', head: true })
  console.log(`Total companies in DB: ${count}`)
  return count || 0
}

async function seedClosures() {
  console.log('\nSeeding monthly closures...')

  // Get all companies from DB
  const { data: companies } = await supabase.from('companies').select('id, name, status, assigned_accountant_id')
  if (!companies?.length) {
    console.error('No companies found!')
    return
  }

  const activeCompanies = companies.filter(c => c.status === 'active')
  console.log(`  Active companies: ${activeCompanies.length}`)

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() // 0-indexed

  // Generate closures for months 01..currentMonth+1
  const months: string[] = []
  for (let m = 0; m <= currentMonth; m++) {
    months.push(String(m + 1).padStart(2, '0'))
  }

  const closures = activeCompanies.flatMap(company =>
    months.map(month => ({
      company_id: company.id,
      company_name: company.name,
      period: `${currentYear}-${month}`,
      status: 'open',
      bank_statement_status: 'missing',
      expense_invoices_status: 'missing',
      receipts_status: 'missing',
      income_invoices_status: 'missing',
      vat_payable: null,
      income_tax_accrued: null,
      social_insurance: null,
      health_insurance: null,
      reminder_count: 0,
      last_reminder_sent_at: null,
      notes: null,
      updated_by: null,
      assigned_accountant_id: company.assigned_accountant_id || null,
    }))
  )

  console.log(`  Total closures to insert: ${closures.length}`)

  // Insert in batches of 100
  for (let i = 0; i < closures.length; i += 100) {
    const batch = closures.slice(i, i + 100)
    const { error } = await supabase.from('monthly_closures').insert(batch)
    if (error) {
      console.error(`  Closures batch ${i / 100 + 1} error:`, error.message)
    } else {
      console.log(`  Batch ${i / 100 + 1}: ${batch.length} closures inserted`)
    }
  }

  const { count } = await supabase.from('monthly_closures').select('*', { count: 'exact', head: true })
  console.log(`Total closures in DB: ${count}`)
}

async function seedVatReturns() {
  console.log('\nSeeding VAT returns...')

  // Get VAT payer companies
  const { data: companies } = await supabase
    .from('companies')
    .select('id, name, vat_payer, vat_period')
    .eq('vat_payer', true)

  if (!companies?.length) {
    console.log('  No VAT payer companies found')
    return
  }

  console.log(`  VAT payer companies: ${companies.length}`)

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  const vatReturns: any[] = []

  for (const company of companies) {
    const isMonthly = company.vat_period === 'monthly'

    for (let m = 1; m <= currentMonth; m++) {
      const period = `${currentYear}-${String(m).padStart(2, '0')}`

      // For quarterly payers, only generate for Q boundaries
      if (!isMonthly && m % 3 !== 0 && m !== currentMonth) continue

      // DPH
      vatReturns.push({
        company_id: company.id,
        period,
        type: 'dph',
        status: 'not_filed',
        filed_date: null,
        amount: null,
        paid_date: null,
        notes: null,
      })

      // Kontrolni hlaseni
      vatReturns.push({
        company_id: company.id,
        period,
        type: 'kontrolni_hlaseni',
        status: 'not_filed',
        filed_date: null,
        amount: null,
        paid_date: null,
        notes: null,
      })
    }
  }

  console.log(`  Total VAT returns to insert: ${vatReturns.length}`)

  // Insert in batches of 100
  for (let i = 0; i < vatReturns.length; i += 100) {
    const batch = vatReturns.slice(i, i + 100)
    const { error } = await supabase.from('vat_returns').insert(batch)
    if (error) {
      console.error(`  VAT batch ${i / 100 + 1} error:`, error.message)
    } else {
      console.log(`  Batch ${i / 100 + 1}: ${batch.length} VAT returns inserted`)
    }
  }

  const { count } = await supabase.from('vat_returns').select('*', { count: 'exact', head: true })
  console.log(`Total VAT returns in DB: ${count}`)
}

async function main() {
  console.log('=== Supabase Seed Script ===\n')

  await seedCompanies()
  await seedClosures()
  await seedVatReturns()

  console.log('\n=== Seed complete! ===')
}

main().catch(console.error)
