# 👥 EXPERT PANEL REVIEW - Účetní OS

**Multi-perspektivní analýza projektu od specializovaných expertů**

---

## 📋 PANEL EXPERTŮ

1. 👔 Účetní/Daňový poradce
2. 💻 Backend Developer
3. 🎨 Frontend Developer
4. 🧪 QA Tester
5. 🔧 DevOps Engineer
6. 📊 Project Manager
7. 🔒 Security Expert
8. ✨ UX Designer

---

## 👔 ÚČETNÍ / DAŇOVÝ PORADCE

### ✅ CO JE DOBŘE:

**Daňová kalkulačka:**
- ✅ Sazby 2025 jsou správně (21% DPH, 15%/23% DPFO, 19% DPPO)
- ✅ Minimální vyměřovací základ správně (3 546 Kč)
- ✅ Sociální (29.2%) a zdravotní (13.5%) pojištění OK

**Master matice:**
- ✅ Perfektní nápad! To je přesně co účetní potřebují
- ✅ Barvy (🔴🟡🟢) jsou intuitivní

### ⚠️ CO CHYBÍ / PROBLEMATICKÉ:

**1. Daňová kalkulačka je ZJEDNODUŠENÁ**
```typescript
// PROBLÉM: Neřešíte:
- Slevy na dani (základní sleva 30 840 Kč, sleva na manželku atd.)
- Paušální výdaje (60% pro podnikatele)
- Mimořádné platby pojištění (minimální zálohy)
- Nezdanitelné části (dary, životní pojištění)
- Daňové ztráty z předchozích let
```

**Doporučení:**
- Přidat disclaimer: "Orientační odhad, není závazný"
- Nebo přidat pokročilý režim se slevami

**2. "Červená čísla" mohou být ZAVÁDĚJÍCÍ**
```
"Pokud nedoložíš účtenku 5000 Kč, ztratíš 1050 Kč"
```

**PROBLÉM:**
- To platí jen pokud klient má ZISK!
- Pokud je ve ztrátě, nedoložený výdaj ho neovlivní
- Motivace může být špatně

**Doporučení:**
- Přidat check: `if (grossProfit > 0)`
- Jinak text: "Toto neovlivní tvoje daně (jsi ve ztrátě)"

**3. DPH výpočet je PŘÍLIŠ ZJEDNODUŠENÝ**
```typescript
const vatOnIncome = income * (21 / 121)
```

**PROBLÉM:**
- Ne vše má 21% (jsou i 12% a 0% sazby)
- Dovoz ze zahraničí má jiné pravidla
- Režim přenesení daňové povinnosti

**Doporučení:**
- Přidat pole "VAT rate" na každém dokladu
- Nebo alespoň poznámku "předpokládáme 21%"

**4. Párování plateb je SLOŽITÉ**
```
Výpis z účtu × Faktury (AI matching)
```

**PROBLÉM:**
- Klienti často platí více faktur najednou
- Nebo platí částečně
- Nebo má platba špatný variabilní symbol
- AI matching může být 70% přesný = 30% práce navíc!

**Doporučení:**
- Nenechávat AI automaticky párovat
- Jen "navrhnout" páry, účetní musí schválit

**5. CHYBÍ důležité reporty:**
- Rozvaha
- Výkaz zisků a ztrát
- Cash flow
- Přehled DPH

**Doporučení:**
- Přidat do P1 (ne P3!)

---

## 💻 BACKEND DEVELOPER

### ✅ CO JE DOBŘE:

- ✅ Supabase + Vercel = dobrá volba
- ✅ PostgreSQL (relační DB) správná pro účetnictví
- ✅ Row Level Security = bezpečnost na DB level
- ✅ Google Drive Service Account = správný přístup

### 🚨 KRITICKÉ PROBLÉMY:

**1. N+1 QUERY PROBLÉM v Master Matici**
```typescript
// ŠPATNĚ:
const companies = await supabase.from('companies').select('*')
for (const company of companies) {
  const closures = await supabase
    .from('monthly_closures')
    .eq('company_id', company.id)
}
// 100 klientů = 101 queries! 🐌
```

**ŘEŠENÍ:**
```typescript
// SPRÁVNĚ:
const { data } = await supabase
  .from('companies')
  .select(`
    *,
    monthly_closures (*)
  `)
// 1 query! ⚡
```

**2. CHYBÍ INDEXY**
```sql
-- MUSÍTE PŘIDAT:
CREATE INDEX idx_monthly_closures_company_period
  ON monthly_closures(company_id, period);

CREATE INDEX idx_documents_company_period
  ON documents(company_id, period);

CREATE INDEX idx_invoices_company_period
  ON invoices(company_id, period);
```

Bez indexů bude matice POMALÁ (2-3 sekundy).

**3. GOOGLE DRIVE RATE LIMITS**
```
1000 requests / 100 seconds / user
```

**PROBLÉM:**
- Service Account = 1 user
- 20 klientů nahrává současně = možný rate limit

**ŘEŠENÍ:**
```typescript
// Implementovat retry s exponential backoff
async function uploadWithRetry(file, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await drive.files.create(...)
    } catch (error) {
      if (error.code === 429) { // Rate limit
        await sleep(2 ** i * 1000)
        continue
      }
      throw error
    }
  }
}
```

**4. OCR ERROR HANDLING CHYBÍ**
```typescript
// CO KDYŽ:
- Gemini API spadne?
- Timeout (> 30 sekund)?
- Rate limit?
- Invalid response?
```

**ŘEŠENÍ:**
```typescript
try {
  const ocrData = await callGeminiOCR(file)
} catch (error) {
  // Uložit dokument BEZ OCR
  await supabase.from('documents').insert({
    ...documentData,
    ocr_status: 'failed',
    ocr_error: error.message
  })

  // Queue pro retry později
  await queueForRetry(documentId)
}
```

**5. TRANSACTIONS CHYBÍ**
```typescript
// PROBLÉM: Co když toto selže napůl?
await supabase.from('documents').insert(...)
await supabase.from('monthly_closures').update(...)
```

**ŘEŠENÍ:**
```typescript
// PostgreSQL transaction
await supabase.rpc('insert_document_and_update_closure', {
  document_data: {...},
  closure_update: {...}
})

// Nebo Supabase RPC function:
CREATE FUNCTION insert_document_and_update_closure(...)
RETURNS void AS $$
BEGIN
  INSERT INTO documents ...;
  UPDATE monthly_closures ...;
END;
$$ LANGUAGE plpgsql;
```

**6. FILE SIZE LIMITS?**
```typescript
// MUSÍTE CHECKNOUT:
- Max velikost souboru? (5 MB? 10 MB?)
- Co když klient nahraje 100 MB PDF?
- Timeout na upload?
```

**ŘEŠENÍ:**
```typescript
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

if (file.size > MAX_FILE_SIZE) {
  throw new Error('File too large')
}
```

**7. SOFT DELETE MÍSTO HARD DELETE**
```typescript
// ŠPATNĚ:
await supabase.from('documents').delete().eq('id', id)

// SPRÁVNĚ:
await supabase.from('documents')
  .update({ deleted_at: new Date() })
  .eq('id', id)
```

---

## 🎨 FRONTEND DEVELOPER

### ✅ CO JE DOBŘE:

- ✅ Next.js 14 App Router = moderní
- ✅ Tailwind CSS = rychlý vývoj
- ✅ shadcn/ui = kvalitní komponenty

### 🚨 PROBLÉMY:

**1. MASTER MATICE = PERFORMANCE NIGHTMARE**
```tsx
// 100 klientů × 12 měsíců = 1200 buněk!
// Každá buňka má onClick, hover, conditional rendering
```

**ŘEŠENÍ:**
- **Virtualizace** (@tanstack/react-virtual)
- **Pagination** (zobraz jen 20 klientů)
- **Nebo lazy load** (scroll infinite)

**2. UPLOAD UX CHYBÍ DETAILY**
```tsx
// MUSÍTE ŘEŠIT:
- Progress bar (0-100%)
- Preview obrázku před uploadem
- Drag & drop visual feedback
- Multiple files najednou?
- Cancel upload button
```

**3. OPTIMISTIC UPDATES**
```tsx
// ŠPATNĚ: Čekat na server response
const handleUpload = async (file) => {
  setLoading(true)
  await uploadFile(file)
  await refetch() // 2-3 sekundy čekání!
  setLoading(false)
}

// SPRÁVNĚ: Optimistic update
const handleUpload = async (file) => {
  // Přidat soubor DO UI OKAMŽITĚ
  setDocuments(prev => [...prev, {
    id: 'temp-' + Date.now(),
    file_name: file.name,
    status: 'uploading'
  }])

  // Upload na pozadí
  const result = await uploadFile(file)

  // Update s real ID
  setDocuments(prev => prev.map(doc =>
    doc.id === 'temp-...' ? result : doc
  ))
}
```

**4. ERROR STATES CHYBÍ**
```tsx
// CO ZOBRAZIT KDYŽ:
- API spadne?
- Upload selže?
- OCR selže?
- Rate limit?

// MUSÍTE MÍT:
<ErrorBoundary>
  <Toast position="top-right" />
  <Retry button />
</ErrorBoundary>
```

**5. MOBILE RESPONSIVENESS**
```
Master matice na mobilu = NEČITELNÁ!
100 klientů × 12 měsíců na 375px šířce?
```

**ŘEŠENÍ:**
- Na mobilu zobrazit JINÉ UI (ne matice)
- Dropdown select klienta → pak měsíce
- Nebo horizontal scroll s fixed první sloupec

**6. LOADING STATES VŠUDE**
```tsx
// KAŽDÝ API CALL MUSÍ MÍT:
{isLoading && <Skeleton />}
{error && <ErrorMessage />}
{data && <Content />}
```

---

## 🧪 QA TESTER

### 🐛 TESTOVACÍ SCÉNÁŘE (které MUSÍTE pokrýt):

**1. UPLOAD EDGE CASES:**
```
✅ Upload PNG (< 1 MB)
✅ Upload JPEG (< 1 MB)
✅ Upload PDF (< 5 MB)
❌ Upload 50 MB video - Mělo by failnout!
❌ Upload .exe soubor - Mělo by failnout!
❌ Upload bez extension - Co se stane?
❌ Upload stejný soubor 2× - Duplikát?
❌ Upload během offline - Retry?
❌ Upload během rate limit - Retry?
```

**2. OCR EDGE CASES:**
```
❌ Rozmazaná účtenka - Co vrátí Gemini?
❌ Účtenka v němčině - Rozpozná?
❌ Účtenka naopak (180°) - Rozpozná?
❌ Screenshot účtenky - Rozpozná?
❌ Účtenka s vodoznakem - Rozpozná?
❌ Gemini timeout (> 30s) - Co se stane?
```

**3. MASTER MATICE EDGE CASES:**
```
❌ 0 klientů - Co se zobrazí?
❌ 1000 klientů - Spadne to?
❌ Klient bez měsíčních uzávěrek - Prázdný řádek?
❌ Filtrování (search) - Funguje?
❌ Sorting (řadit podle názvu) - Funguje?
```

**4. URGOVÁNÍ EDGE CASES:**
```
❌ Klient nemá telefon - SMS nefunguje!
❌ Klient nemá email - Email nefunguje!
❌ Twilio spadne - Co se stane?
❌ SendGrid rate limit - Retry?
❌ SMS text > 160 znaků - Ořízne se?
```

**5. SECURITY TESTING:**
```
❌ Klient změní companyId v requestu - Může vidět cizí data?
❌ SQL injection v search field
❌ XSS v chat zprávy
❌ CSRF na POST endpoints
❌ File upload - Může nahrát .php malware?
```

**6. CONCURRENCY ISSUES:**
```
❌ 2 účetní urgují stejného klienta současně
❌ Klient nahrává 10 souborů najednou
❌ Účetní schvaluje doklad zatímco klient ho maže
```

**DOPORUČENÍ:**
- Napsat **E2E testy** (Playwright)
- Napsat **Unit testy** pro daňovou kalkulačku
- Napsat **Integration testy** pro API routes
- **Manual testing checklist** před každým deployem

---

## 🔧 DEVOPS ENGINEER

### ✅ CO JE DOBŘE:

- ✅ Vercel = auto-deploy z GitHubu
- ✅ Supabase = managed database (0 DevOps)

### 🚨 CO CHYBÍ:

**1. CI/CD PIPELINE**
```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      - run: npm test
      - run: npm run lint
      - run: npm run type-check
```

**2. ENVIRONMENT VARIABLES MANAGEMENT**
```bash
# PROBLÉM: Kde ukládáte .env.local?
# Nesmí být v gitu!

# ŘEŠENÍ:
echo ".env.local" >> .gitignore

# A použít Vercel env variables UI
# Nebo GitHub Secrets pro CI/CD
```

**3. DATABASE MIGRATIONS**
```typescript
// JAK BUDETE UPDATOVAT SCHEMA V PRODUKCI?

// MUSÍTE MÍT:
/supabase/migrations/
  20250124_initial_schema.sql
  20250125_add_ocr_status.sql
  20250126_add_indexes.sql

// A script:
npm run migrate
```

**4. MONITORING CHYBÍ**
```typescript
// CO SLEDOVAT:
- API response times (avg, p95, p99)
- Error rate (% failed requests)
- Upload success rate
- OCR accuracy (avg confidence)
- Database query times
- Google Drive rate limit hits

// NÁSTROJE:
- Vercel Analytics (zdarma)
- Sentry (error tracking)
- Supabase Dashboard (DB monitoring)
```

**5. LOGGING CHYBÍ**
```typescript
// MUSÍTE LOGOVAT:
- Každý API request (method, path, user_id)
- Každý error (stack trace, context)
- Každý upload (file_size, duration, status)
- Každý OCR request (confidence, duration)

// NÁSTROJ:
- Winston logger
- Pino logger
- Nebo Vercel logs
```

**6. BACKUP STRATEGIE CHYBÍ**
```bash
# SUPABASE:
- Automatic daily backups (up to 7 days)
- Point-in-time recovery (paid plan)

# GOOGLE DRIVE:
- ❌ NENÍ automatic backup!
- Musíte si udělat vlastní:
  - Periodic sync na jiný Drive account?
  - Nebo AWS S3 backup?
```

**7. DISASTER RECOVERY PLAN CHYBÍ**
```
CO KDYŽ:
- Supabase spadne (99.9% uptime = 43 min downtime/měsíc)
- Google Drive spadne
- Vercel spadne
- Celý projekt se smaže

MUSÍTE MÍT:
- Backup data (databáze + soubory)
- Rollback plan
- Incident response playbook
```

**8. RATE LIMITING CHYBÍ**
```typescript
// MUSÍTE PŘIDAT:
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minut
  max: 100 // max 100 requestů
})

app.use('/api/', limiter)
```

---

## 📊 PROJECT MANAGER

### 📅 REALISTICKÝ TIMELINE:

**Vaše původní plán:**
```
M1: Infrastructure & Auth - Týden 1 ✅
M2: Client Dashboard - Týden 2-3
M3: Accountant Dashboard - Týden 4-5
M4: Integrace Pohoda - Týden 6
M5: Úkolový systém - Týden 7
M6: AI & WhatsApp - Týden 8+
```

**Můj realistický odhad (1 developer full-time):**
```
M1: Infrastructure & Auth - 2-3 týdny ⚠️
  - Supabase setup: 2 dny
  - Database schema + migrations: 3 dny
  - Auth (login/register): 4 dny
  - RLS policies: 2 dny
  - Testing: 2 dny

M2: Client Dashboard - 3-4 týdny ⚠️
  - Layout + routing: 2 dny
  - Měsíční checklist: 5 dnů
  - Upload komponenta: 3 dny
  - Google Drive API: 4 dny
  - OCR integrace: 5 dnů
  - Daňová kalkulačka UI: 3 dny
  - Testing: 3 dny

M3: Accountant Dashboard - 4-5 týdnů ⚠️
  - Layout: 2 dny
  - Master matice: 10 dnů (KOMPLEXNÍ!)
  - Detail klienta: 3 dny
  - Urgovací systém: 5 dnů
  - Párování plateb: 7 dnů
  - Testing: 3 dny

M4: Pohoda integrace - 3-4 týdny ⚠️
  - XML generator: 5 dnů
  - XML parser: 5 dnů
  - Testing s Pohoda: 10 dnů (DEBUGGING!)
  - UI: 3 dny

M5: WhatsApp - 2-3 týdny
M6: AI chat - 2 týdny

CELKEM: 16-22 týdnů (4-5 měsíců!)
```

### 🚨 RISKS & MITIGATION:

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Google Drive rate limits | High | High | Implement retry + queue |
| Pohoda XML debugging | Very High | High | Start testing ASAP, buffer 2 týdny |
| OCR accuracy < 80% | Medium | Medium | Manual review flow |
| Master matice performance | Medium | High | Implement pagination early |
| Scope creep | High | High | **STRICT prioritization** |

### 💰 COST ESTIMATION (realistická):

```
Development (4 měsíce):
- 1 developer @ 80h/měsíc @ $50/h = $16,000

Services (roční):
- Supabase Pro: $300
- Gemini API (5000 req/měsíc): $60
- Twilio SMS (100/měsíc): $120
- SendGrid Email: $180
- Vercel Pro: $240
- Google Workspace: $0 (už máte)

TOTAL: $16,900 první rok
```

### 📋 DOPORUČENÝ PŘÍSTUP:

**FÁZE 1 - MVP (8 týdnů):**
```
✅ P0 funkce POUZE:
1. Auth (login/register)
2. Master matice (základní, bez filtrů)
3. Upload dokladů (bez OCR)
4. Měsíční checklist

❌ NECHAT NA POZDĚJI:
- OCR (dělat manuálně zatím)
- Urgování (posílat manuálně)
- Pohoda integrace
- WhatsApp
- AI chat
```

**FÁZE 2 - Automation (6 týdnů):**
```
4. OCR (Gemini)
5. Urgování (Twilio + SendGrid)
6. Základní reporty
```

**FÁZE 3 - Advanced (8 týdnů):**
```
7. Pohoda integrace
8. Párování plateb
9. Úkolový systém
```

**FÁZE 4 - Premium (optional):**
```
10. WhatsApp webhook
11. AI chat asistent
```

---

## 🔒 SECURITY EXPERT

### 🚨 KRITICKÉ BEZPEČNOSTNÍ RIZIKA:

**1. RLS JE NEDOSTATEČNÁ**
```sql
-- PROBLÉM: Co když klient hackne request?
-- Frontend:
fetch('/api/documents', {
  body: { companyId: 'JINÁ-FIRMA' } // HACK!
})

-- ŘEŠENÍ: Server-side validace
export async function POST(req: Request) {
  const { companyId } = await req.json()
  const user = await getCurrentUser()

  // CRITICAL: Ověřit že user OWNS company
  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('id', companyId)
    .eq('owner_id', user.id)
    .single()

  if (!company) {
    throw new Error('Unauthorized')
  }

  // Teď safe
  await uploadDocument(companyId, ...)
}
```

**2. FILE UPLOAD = SECURITY HOLE**
```typescript
// NEBEZPEČÍ:
- .php, .exe, .js malware upload
- Image s embedded script (ImageTragick)
- ZIP bombs (malý soubor → rozbalí na 1 GB)
- Path traversal (../../../etc/passwd)

// OCHRANA:
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'application/pdf'
]

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.pdf']

function validateFile(file: File) {
  // 1. Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error('Invalid file type')
  }

  // 2. Check extension
  const ext = path.extname(file.name).toLowerCase()
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error('Invalid file extension')
  }

  // 3. Check file size
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('File too large')
  }

  // 4. Scan for viruses (ClamAV)
  await scanForVirus(file)
}
```

**3. GOOGLE DRIVE SERVICE ACCOUNT KEY = SINGLE POINT OF FAILURE**
```bash
# PROBLÉM:
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

# CO KDYŽ:
- Leak do Gitu (!!!!)
- Leak přes error log
- Compromised Vercel account

# ŘEŠENÍ:
- Rotate keys každých 90 dní
- Use Google Secret Manager
- Monitor access logs
```

**4. SQL INJECTION RISK**
```typescript
// BEZPEČNÉ (Supabase má built-in protection):
await supabase
  .from('documents')
  .select('*')
  .eq('company_id', userInput) // ✅ Safe

// NEBEZPEČNÉ (raw SQL):
await supabase.rpc('search', {
  query: userInput // ❌ NEBEZPEČNÉ!
})

// OCHRANA:
function sanitizeInput(input: string): string {
  return input.replace(/[^\w\s]/gi, '')
}
```

**5. XSS (Cross-Site Scripting)**
```typescript
// NEBEZPEČNÉ:
<div dangerouslySetInnerHTML={{__html: userMessage}} />

// BEZPEČNÉ:
<div>{userMessage}</div> // React auto-escapes

// Nebo použít DOMPurify:
import DOMPurify from 'dompurify'
<div dangerouslySetInnerHTML={{
  __html: DOMPurify.sanitize(userMessage)
}} />
```

**6. CSRF (Cross-Site Request Forgery)**
```typescript
// PROBLÉM: Útočník může udělat request z jiné stránky

// OCHRANA: CSRF token (Next.js má built-in)
import { getCsrfToken } from 'next-auth/react'

// Nebo custom middleware:
export function middleware(req: NextRequest) {
  const csrfToken = req.cookies.get('csrf-token')
  const headerToken = req.headers.get('x-csrf-token')

  if (csrfToken !== headerToken) {
    return new Response('Forbidden', { status: 403 })
  }
}
```

**7. RATE LIMITING CHYBÍ**
```typescript
// ÚTOKY:
- Brute force login (1000 pokusů/sekundu)
- DDoS (miliony requestů)
- Scraping (stahování všech dat)

// OCHRANA:
import rateLimit from 'express-rate-limit'

// Per IP:
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 5, // max 5 pokusů
  message: 'Too many login attempts'
})

// Per user:
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 10, // max 10 uploadů
})
```

**8. AUDIT LOG CHYBÍ**
```sql
-- MUSÍTE LOGOVAT:
CREATE TABLE audit_log (
  id UUID PRIMARY KEY,
  user_id UUID,
  action TEXT, -- 'create', 'update', 'delete'
  table_name TEXT,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP
);

-- Trigger na každou operaci:
CREATE TRIGGER audit_documents
AFTER INSERT OR UPDATE OR DELETE ON documents
FOR EACH ROW EXECUTE FUNCTION log_audit();
```

---

## ✨ UX DESIGNER

### 🎨 USER EXPERIENCE PROBLÉMY:

**1. MASTER MATICE = COGNITIVE OVERLOAD**
```
100 řádků × 12 sloupců = 1200 buněk!
Uživatel se ztratí!
```

**ŘEŠENÍ:**
- **Filtrování:** Search box na top
- **Grouping:** Seskupit podle účetní
- **Sorting:** Default sort by "nejvíc chybějících"
- **Highlighting:** Zvýraznit kritické klienty (> 3 urgence)
- **Collapsed view:** Default show jen klienty s problémy

**2. "ČERVENÁ ČÍSLA" = BAD UX**
```
"Ztratíš 1 050 Kč na daních"
```

**PROBLÉM:**
- Negativní framing (strach)
- Nemusí být přesné (viz účetní notes)
- Může demotivovat ("stejně to nedokážu")

**LEPŠÍ:**
```
✅ "Dodáním této účtenky ušetříš 1 050 Kč"
✅ Progress bar: "Máš dodáno 80% podkladů"
✅ Reward: "Když dodáš vše, získáš -10% na další měsíc"
```

**3. UPLOAD UX CHYBÍ GUIDANCE**
```tsx
// ŠPATNĚ:
<input type="file" />

// LÉPE:
<DropZone>
  <Icon name="upload" />
  <h3>Přetáhni účtenky sem</h3>
  <p>nebo klikni pro výběr</p>
  <p className="text-sm text-gray-500">
    Podporované formáty: JPG, PNG, PDF (max 10 MB)
  </p>
</DropZone>
```

**4. ERROR MESSAGES JSOU TECHNICKÉ**
```
❌ "Error 500: Internal Server Error"
❌ "Rate limit exceeded"
❌ "ECONNREFUSED"

✅ "Něco se pokazilo. Zkus to prosím znovu."
✅ "Nahrál jsi moc souborů najednou. Zkus to za chvíli."
✅ "Nepodařilo se připojit. Zkontroluj internet."
```

**5. URGOVÁNÍ = AGRESIVNÍ**
```
SMS: "Chybí nám od vás výpis z účtu za leden 2025"
```

**LEPŠÍ:**
```
SMS: "Ahoj! Mohli bychom prosím dostat výpis za leden? Díky! 😊"

+ Link na app: "Nahrát teď → app.ucetni-os.cz/upload"
```

**6. MOBILE EXPERIENCE CHYBÍ**
```
Master matice na mobilu = NEČITELNÁ
Upload fotky = primární use case
```

**MUSÍ BÝT:**
- Mobile-first design
- Camera přímo v app (ne "vybrat soubor")
- Velké touch targets (min 44x44px)
- Bottom navigation (ne sidebar)

**7. ONBOARDING CHYBÍ**
```
Nový klient: Co mám dělat?
```

**PŘIDAT:**
- Welcome screen s 3-krok onboardingem
- Empty state s "Nahraj první účtenku"
- Tooltips na první použití
- Help center / FAQ

**8. NOTIFICATIONS = SPAM?**
```
Každá urgence = SMS + Email + Push?
```

**LEPŠÍ:**
- User preference: "Jak chceš být notifikován?"
- Batch notifications: "1× denně shrnutí"
- Smart timing: Ne v noci!

---

## 🎯 SOUHRNNÁ DOPORUČENÍ VŠECH EXPERTŮ

### 🔴 KRITICKÉ (FIX TEĎKA):

1. **Backend:** Přidat indexy na DB (performance)
2. **Backend:** N+1 query fix v Master Matici
3. **Backend:** Error handling pro všechny API calls
4. **Security:** Server-side validace companyId
5. **Security:** File upload validation (mime type, size, virus scan)
6. **Účetní:** Disclaimer na daňovou kalkulačku
7. **UX:** Mobile responsiveness (master matice jiné UI)

### 🟡 DŮLEŽITÉ (FIX V MVP):

8. **Backend:** Soft delete místo hard delete
9. **Backend:** Transactions pro atomické operace
10. **DevOps:** CI/CD pipeline (tests, lint, type-check)
11. **DevOps:** Logging (Winston/Pino)
12. **QA:** E2E testy (Playwright) pro kritické flow
13. **UX:** Upload UX vylepšení (preview, progress, drag&drop)
14. **PM:** Realistický timeline (4-5 měsíců, ne 2 měsíce)

### 🟢 NICE TO HAVE (POZDĚJI):

15. **Účetní:** Pokročilé daňové výpočty (slevy, paušály)
16. **Backend:** Virtualizace Master Matice
17. **DevOps:** Monitoring (Sentry, Vercel Analytics)
18. **Security:** Audit log
19. **UX:** Onboarding flow
20. **UX:** "Ušetříš X Kč" místo "Ztratíš X Kč"

---

## 📊 PRIORITY MATRIX

```
┌─────────────────────────────────────────────┐
│ HIGH IMPACT + HIGH URGENCY                  │
│ (DO NOW!)                                   │
├─────────────────────────────────────────────┤
│ • DB indexy                                 │
│ • N+1 query fix                             │
│ • Error handling                            │
│ • Security validace                         │
│ • File upload validation                    │
│ • Mobile responsiveness                     │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ HIGH IMPACT + LOW URGENCY                   │
│ (PLAN FOR MVP)                              │
├─────────────────────────────────────────────┤
│ • Soft delete                               │
│ • Transactions                              │
│ • CI/CD pipeline                            │
│ • E2E tests                                 │
│ • Realistický timeline                      │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ LOW IMPACT + HIGH URGENCY                   │
│ (QUICK WINS)                                │
├─────────────────────────────────────────────┤
│ • Daňová kalkulačka disclaimer              │
│ • Error messages UX                         │
│ • Upload guidance text                      │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ LOW IMPACT + LOW URGENCY                    │
│ (BACKLOG)                                   │
├─────────────────────────────────────────────┤
│ • Audit log                                 │
│ • Onboarding flow                           │
│ • Advanced reporting                        │
│ • WhatsApp integrace                        │
└─────────────────────────────────────────────┘
```

---

**Poslední update:** 2025-01-24
**Next review:** Po implementaci kritických bodů

