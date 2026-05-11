/**
 * MVP seed: 3 reálné klienty + 1 admin (Radim) + 3 startovní spisy do
 * lokální ClaimBuddy Supabase pro nasazení 12.5.2026.
 *
 * Idempotentní: hledá podle emailu / login_name a re-používá existující rows.
 *
 * Run:
 *   npx tsx scripts/seed-mvp-clients.ts
 *   npx tsx scripts/seed-mvp-clients.ts --admin-password=heslo123
 *
 * ENV:
 *   CLAIMS_SUPABASE_URL          (default http://127.0.0.1:55421)
 *   CLAIMS_SUPABASE_SERVICE_ROLE_KEY (REQUIRED — bere se z /etc/claimbuddy-webapp.env)
 *   MVP_ADMIN_PASSWORD           heslo pro radim admin, fallback z --admin-password
 */

import { createClient } from '@supabase/supabase-js'
import crypto from 'node:crypto'

const SUPABASE_URL = process.env.CLAIMS_SUPABASE_URL || 'http://127.0.0.1:55421'
const SERVICE_KEY = process.env.CLAIMS_SUPABASE_SERVICE_ROLE_KEY
if (!SERVICE_KEY) {
  console.error('FATAL: CLAIMS_SUPABASE_SERVICE_ROLE_KEY missing — viz /etc/claimbuddy-webapp.env')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// Heslo přes argv pro snadný override v terminálu
const cliPwd = process.argv.find((a) => a.startsWith('--admin-password='))?.split('=')[1]
const ADMIN_PASSWORD = cliPwd || process.env.MVP_ADMIN_PASSWORD || 'mvp-radim-2026'

// PBKDF2 SHA-512, formát stejný jako lib/auth.ts → '${salt}:${hash}'
function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex')
    crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, key) => {
      if (err) return reject(err)
      resolve(`${salt}:${key.toString('hex')}`)
    })
  })
}

function generatePassword(): string {
  // 12-char alphanumeric, čitelné (bez 0/O/I/l)
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < 12; i++) {
    out += chars[crypto.randomInt(chars.length)]
  }
  return out
}

interface ClientSpec {
  loginName: string
  email: string
  name: string
  companyName: string
  ico: string
  insuranceType: 'auto' | 'property' | 'life' | 'liability' | 'travel' | 'industrial' | 'other'
  caseNumber: string
  eventDescription: string
}

// 3 placeholder klienti — Radim může přepsat ráno přes UPDATE
const CLIENTS: ClientSpec[] = [
  {
    loginName: 'klient1',
    email: 'test-klient-1@example.com',
    name: 'Test Klient 1',
    companyName: 'Demo Auto Servis s.r.o.',
    ico: '11111111',
    insuranceType: 'auto',
    caseNumber: 'MVP-2026-001',
    eventDescription: 'Škoda na vozidle při dopravní nehodě',
  },
  {
    loginName: 'klient2',
    email: 'test-klient-2@example.com',
    name: 'Test Klient 2',
    companyName: 'Stavba & Reality s.r.o.',
    ico: '22222222',
    insuranceType: 'property',
    caseNumber: 'MVP-2026-002',
    eventDescription: 'Voda v suterénu po prasknutí potrubí',
  },
  {
    loginName: 'klient3',
    email: 'test-klient-3@example.com',
    name: 'Test Klient 3',
    companyName: 'IT Consulting s.r.o.',
    ico: '33333333',
    insuranceType: 'liability',
    caseNumber: 'MVP-2026-003',
    eventDescription: 'Nárok třetí strany na náhradu škody',
  },
]

async function upsertAdmin(): Promise<string> {
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('login_name', 'radim')
    .maybeSingle()

  const passwordHash = await hashPassword(ADMIN_PASSWORD)

  if (existing) {
    await supabase
      .from('users')
      .update({
        password_hash: passwordHash,
        role: 'admin',
        is_system_admin: true,
        status: 'active',
        modules: ['claims', 'accounting'],
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
    console.log(`  ✓ admin 'radim' updated (${existing.id})`)
    return existing.id
  }

  const { data, error } = await supabase
    .from('users')
    .insert({
      name: 'Radim Zajíček',
      email: 'radim@wikiporadce.cz',
      login_name: 'radim',
      password_hash: passwordHash,
      role: 'admin',
      is_system_admin: true,
      modules: ['claims', 'accounting'],
      status: 'active',
    })
    .select('id')
    .single()

  if (error) throw new Error(`admin insert failed: ${error.message}`)
  console.log(`  ✓ admin 'radim' created (${data.id})`)
  return data.id
}

interface ClientResult {
  loginName: string
  password: string
  email: string
  companyName: string
  userId: string
  companyId: string
  caseId: string
}

async function upsertClient(spec: ClientSpec): Promise<ClientResult> {
  // 1. User
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('login_name', spec.loginName)
    .maybeSingle()

  const plainPwd = generatePassword()
  const passwordHash = await hashPassword(plainPwd)

  let userId: string
  if (existingUser) {
    await supabase
      .from('users')
      .update({
        password_hash: passwordHash,
        name: spec.name,
        email: spec.email,
        role: 'client',
        modules: ['claims'],
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingUser.id)
    userId = existingUser.id
    console.log(`  ✓ user '${spec.loginName}' updated (${userId})`)
  } else {
    const { data, error } = await supabase
      .from('users')
      .insert({
        name: spec.name,
        email: spec.email,
        login_name: spec.loginName,
        password_hash: passwordHash,
        role: 'client',
        modules: ['claims'],
        status: 'active',
      })
      .select('id')
      .single()
    if (error) throw new Error(`user ${spec.loginName} insert: ${error.message}`)
    userId = data.id
    console.log(`  ✓ user '${spec.loginName}' created (${userId})`)
  }

  // 2. Company
  const { data: existingCompany } = await supabase
    .from('companies')
    .select('id')
    .eq('ico', spec.ico)
    .maybeSingle()

  let companyId: string
  if (existingCompany) {
    await supabase
      .from('companies')
      .update({
        name: spec.companyName,
        owner_id: userId,
        status: 'active',
        source_system: 'claimbuddy',
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingCompany.id)
    companyId = existingCompany.id
    console.log(`  ✓ company '${spec.companyName}' updated (${companyId})`)
  } else {
    const { data, error } = await supabase
      .from('companies')
      .insert({
        name: spec.companyName,
        ico: spec.ico,
        legal_form: 's.r.o.',
        owner_id: userId,
        source_system: 'claimbuddy',
        status: 'active',
      })
      .select('id')
      .single()
    if (error) throw new Error(`company ${spec.companyName} insert: ${error.message}`)
    companyId = data.id
    console.log(`  ✓ company '${spec.companyName}' created (${companyId})`)
  }

  // 3. client_users mapping
  const { data: existingMapping } = await supabase
    .from('client_users')
    .select('id')
    .eq('user_id', userId)
    .eq('company_id', companyId)
    .maybeSingle()

  if (!existingMapping) {
    const { error } = await supabase.from('client_users').insert({
      user_id: userId,
      company_id: companyId,
      role: 'owner',
    })
    if (error) throw new Error(`client_users insert: ${error.message}`)
    console.log(`  ✓ client_users mapping created`)
  } else {
    console.log(`  ✓ client_users mapping already exists`)
  }

  // 4. Insurance case
  const { data: existingCase } = await supabase
    .from('insurance_cases')
    .select('id')
    .eq('case_number', spec.caseNumber)
    .maybeSingle()

  let caseId: string
  if (existingCase) {
    caseId = existingCase.id
    console.log(`  ✓ case '${spec.caseNumber}' already exists (${caseId})`)
  } else {
    const { data, error } = await supabase
      .from('insurance_cases')
      .insert({
        company_id: companyId,
        case_number: spec.caseNumber,
        insurance_type: spec.insuranceType,
        event_description: spec.eventDescription,
        event_date: new Date().toISOString().slice(0, 10),
        status: 'new',
        priority: 'normal',
      })
      .select('id')
      .single()
    if (error) throw new Error(`insurance_case ${spec.caseNumber} insert: ${error.message}`)
    caseId = data.id
    console.log(`  ✓ case '${spec.caseNumber}' created (${caseId})`)
  }

  return {
    loginName: spec.loginName,
    password: plainPwd,
    email: spec.email,
    companyName: spec.companyName,
    userId,
    companyId,
    caseId,
  }
}

async function main() {
  console.log('=== ClaimBuddy MVP seed ===')
  console.log(`Supabase: ${SUPABASE_URL}`)
  console.log()

  console.log('1. Admin user (radim)')
  const adminId = await upsertAdmin()

  console.log()
  console.log('2. Klienti + jejich firmy a spisy')
  const results: ClientResult[] = []
  for (const spec of CLIENTS) {
    console.log(`\n  > ${spec.loginName} / ${spec.companyName}`)
    results.push(await upsertClient(spec))
  }

  console.log()
  console.log('=== HOTOVO ===')
  console.log()
  console.log('PŘIHLAŠOVACÍ ÚDAJE (předej Radimovi):')
  console.log()
  console.log(`  Admin login:  radim`)
  console.log(`  Admin heslo:  ${ADMIN_PASSWORD}`)
  console.log()
  console.log('  Klienti (login / email / heslo):')
  for (const r of results) {
    console.log(`    ${r.loginName.padEnd(8)} ${r.email.padEnd(32)} ${r.password}`)
  }
  console.log()
  console.log(`  Admin ID: ${adminId}`)
}

main().catch((err) => {
  console.error('FATAL:', err)
  process.exit(1)
})
