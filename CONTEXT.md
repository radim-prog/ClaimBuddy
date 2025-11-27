# 📝 KONTEXT PROJEKTU - Účetní OS

**Tento soubor obsahuje klíčové rozhodnutí a kontext z konverzací. Vždy aktualizuj když se něco důležitého změní!**

---

## 🎯 O čem projekt je

**Účetní OS** = Webová aplikace pro účetní firmu Radima ([radim@wikiporadce.cz](mailto:radim@wikiporadce.cz))

### Cíl:
Nahradit **Notion, Slack, Raynet a iDoklad** v jedné aplikaci.

### Hlavní uživatelé:
1. **Klienti** - Nahrávají doklady, vidí svoje daňové přehledy
2. **"Holky" (účetní)** - Mají master dashboard, urgují klienty, zpracovávají účetnictví

### KILLER FEATURE:
**Master matice** - Tabulka všech klientů × 12 měsíců s barvami (🔴 chybí, 🟡 nahráno, 🟢 schváleno)

---

## 🛠️ TECH STACK ROZHODNUTÍ

### ✅ CO POUŽÍVÁME (FINÁLNÍ):

#### **Database:**
- **Supabase (PostgreSQL)**
- Relační databáze (lepší než NoSQL pro složité dotazy)
- Důvod:
  - Jednodušší dotazy než Firestore
  - Žádné omezení subcollections
  - Integrovaný s Vercel
  - Built-in Auth, Real-time, Row Level Security

#### **Storage (přímý upload):**

**Google Drive (jediné storage)**
- Klient nahraje soubor → **přímo na Google Drive**
- V databázi uložit **google_drive_file_id**
- Struktura: `/Účetní OS/Klient_{ICO}/{Rok}/{Měsíc}/`
- Důvod:
  - ✅ Už máme Google Workspace (zero extra náklady)
  - ✅ Účetní vidí vše i přímo v Drive
  - ✅ Gemini API umí číst přímo z Drive
  - ✅ Jednodušší (méně kroků, méně error states)
  - ✅ Single source of truth

**Flow:**
```
Klient upload → Google Drive → OCR (Gemini z Drive) → Update DB
```

**Proč NE Supabase Storage:**
- Zbytečný mezikrok (složitější)
- Extra náklady
- Víc error states (upload, move, delete)
- Single point of failure

#### **Auth:**
- **Supabase Auth** (built-in)
- Email/Password + Google OAuth
- Row Level Security policies

#### **AI:**
- **Google Gemini 2.5 Flash**
  - OCR (čtení účtenek)
  - Chat asistent s přístupem k Google Drive souborům
  - Extrakce intentu z WhatsApp

#### **Hosting:**
- **Vercel** (Edge Functions, automatic deploys)

#### **Integrace:**
- **Pohoda mServer** (XML API pro faktury)
- **WhatsApp Business API** (požadavky klientů → úkoly)
- **Twilio** (SMS urgence)
- **SendGrid** (Email urgence)

---

### ❌ CO NEPOUŽÍVÁME:

**Alternativy které jsme zvažovali ale NEpoužíváme:**
- Firebase Firestore - příliš složité dotazy pro naše potřeby
- Railway - nahrazeno Vercel (lepší integrace s Supabase)
- Supabase Storage jako hlavní úložiště - nahrazeno přímým uploadem na Google Drive

---

## 📊 DATABÁZOVÉ SCHEMA (Supabase PostgreSQL)

### Hlavní tabulky:

```sql
users (Supabase Auth + vlastní pole)
  - id, email, name, role (client/accountant/admin), phone_number

companies
  - id, owner_id (FK users), assigned_accountant_id (FK users)
  - name, ico, dic, vat_payer, legal_form
  - google_drive_folder_id

monthly_closures (MASTER TABLE pro matrici!)
  - id, company_id (FK companies), period ('2025-01')
  - status, bank_statement_status, expense_invoices_status, receipts_status
  - vat_payable, income_tax_accrued
  - reminder_count, last_reminder_sent_at

documents (odkazy na Google Drive)
  - id, company_id (FK companies), period
  - file_name
  - google_drive_file_id (link na Google Drive)
  - type (bank_statement, receipt, expense_invoice, contract)
  - ocr_data (JSONB výstup z Gemini)
  - ocr_status (pending, processing, completed, failed)
  - status (missing, uploaded, approved, rejected)

invoices
  - id, company_id (FK companies), type (income/expense)
  - invoice_number, total_with_vat, payment_status
  - pohoda_id (párování s Pohoda)
  - generated_by_ai, ai_prompt

tasks (úkolový systém)
  - id, company_id, assigned_to, status, priority
  - source (manual, whatsapp, chat, ai_generated)
  - whatsapp_message_id

chats + messages (komunikace)

whatsapp_messages (WhatsApp integrace)

reminders (SMS/Email urgence)

payment_matches (párování plateb)
```

---

## 🗂️ GOOGLE DRIVE STRUKTURA

```
📁 Účetní OS/
  📁 Klient_ABC_sro_12345678/
    📁 2025/
      📁 01_Leden/
        📄 vypis_uctu_2025_01.pdf
        🧾 uctenka_lidl_2025_01_15.jpg
        📑 faktura_prijata_F001.pdf
      📁 02_Unor/
        ...
  📁 Klient_XYZ_FO_87654321/
    ...
```

**V databázi:**
```sql
INSERT INTO documents (
  company_id,
  period,
  file_name,
  google_drive_file_id, -- TADY JE LINK!
  type,
  ocr_data
) VALUES (
  'abc-sro',
  '2025-01',
  'uctenka_lidl_2025_01_15.jpg',
  '1a2b3c4d5e6f7g8h', -- Google Drive file ID
  'receipt',
  '{"total_amount": 523.50, "supplier": "Lidl"}'
);
```

---

## 🚀 AKTUÁLNÍ STAV PROJEKTU

### Co JE hotovo:
- ✅ Next.js 14 setup (App Router)
- ✅ TypeScript typy pro databázi (ale pro Firestore - přepsat!)
- ✅ Landing page (app/page.tsx)
- ✅ Daňová kalkulačka (lib/tax-calculator.ts)
- ✅ Základní UI komponenty (shadcn/ui: button, card)

### Co NENÍ hotovo (všechno ostatní):
- ❌ Žádná databáze připojená
- ❌ Žádné API routes
- ❌ Žádná autentizace
- ❌ Žádné Google Drive API
- ❌ Žádné funkční komponenty
- ❌ Žádné OCR
- ❌ Nic z toho co je v dokumentaci

**Závěr:** Projekt je v teoretické fázi. Dokumentace je kompletní, ale kód prakticky neexistuje.

---

## 🔨 CO TEĎKA DĚLAT

### 1. ✅ Infrastruktura (HOTOVO):
- [x] Supabase projekt vytvořen
- [x] PostgreSQL schema nasazeno
- [x] Row Level Security (RLS) policies nastaveny
- [x] Next.js připojen (@supabase/ssr)
- [x] Supabase Auth funguje (Email/Password)

### 2. 🚧 Aktuálně pracujeme:
- [ ] Timeline systém pro klientské tasky
- [ ] Upload dokumentů přímo na Google Drive
- [ ] OCR integrace s Gemini 2.5 Flash

### 3. Google Drive API:
- [ ] Vytvořit Service Account v Google Cloud
- [ ] Implementovat `lib/google-drive.ts`
- [ ] Upload/download funkce
- [ ] Vytvořit root folder "Účetní OS"

### 4. Implementovat přímý upload:
```typescript
// Zjednodušený flow (3 kroky):
1. Upload přímo → Google Drive
2. OCR (Gemini čte z Drive)
3. Update DB: google_drive_file_id + ocr_data
```

### 5. První funkční feature:
**Rozhodnout co jako první:**
- **A)** Login/registrace (Supabase Auth)
- **B)** Klient nahraje účtenku → Google Drive → OCR
- **C)** Master matice (prázdná, ale fungující)

---

## 💡 DŮLEŽITÉ POZNÁMKY

### "Červená čísla" feature:
Motivace pro klienty dodat podklady:
> "⚠️ Pokud nedoložíš tuto účtenku (5 000 Kč), ztratíš na daních 1 050 Kč!"

Funkce už existuje: `lib/tax-calculator.ts:131` → `calculateMissingDocumentPenalty()`

**⚠️ UPOZORNĚNÍ z Expert Review:**
- Daňová kalkulačka je ZJEDNODUŠENÁ (neřeší slevy, paušály)
- Musí obsahovat disclaimer: "Orientační odhad, není závazný"
- "Červená čísla" fungují jen pokud klient má ZISK!

### Google Drive + Gemini synergye:
- Gemini umí číst z Google Drive (přes download + base64)
- Chat asistent může referencovat soubory
- ⚠️ NENÍ to přímý přístup - musíme stáhnout z Drive a poslat do Gemini

### Design principles:
- **Pro klienty:** Mobile-first (fotit účtenky), jednoduchost (babička to musí ovládat)
- **Pro účetní:** Efektivita (minimize clicks), batch operace, přehlednost

---

## 🚨 KRITICKÉ NÁLEZY Z EXPERT REVIEW

### 🔴 MUSÍ BÝT FIXNUTY PŘED ZAČÁTKEM KÓDOVÁNÍ:

1. **DB Indexy chybí** → Master matice bude pomalá (2-3 sec)
   ```sql
   CREATE INDEX idx_monthly_closures_company_period
   ON monthly_closures(company_id, period);
   ```

2. **N+1 Query problém** → 100 klientů = 101 queries
   ```typescript
   // Použít JOIN místo loop
   .select('*, monthly_closures(*)')
   ```

3. **Security: Server-side validace chybí**
   ```typescript
   // Klient může změnit companyId v requestu!
   // MUSÍ být server-side check že user OWNS company
   ```

4. **File upload bez validace**
   ```typescript
   // Může nahrát .exe malware!
   // MUSÍ: mime type check, size limit, virus scan
   ```

5. **Error handling VŠUDE chybí**
   ```typescript
   // Co když Gemini spadne? Co když Drive timeout?
   // MUSÍ: try/catch + retry logic + fallback
   ```

### 🟡 DŮLEŽITÉ PRO MVP:

6. **Soft delete** místo hard delete (deleted_at column)
7. **Transactions** pro atomické operace
8. **CI/CD pipeline** (tests, lint, type-check)
9. **Logging** (Winston/Pino)
10. **E2E tests** (Playwright) pro kritické flow

### ⏰ REALISTICKÝ TIMELINE:

**Původní plán:** 8 týdnů
**Reálně:** **16-22 týdnů (4-5 měsíců)**

Důvody:
- Pohoda integrace = 3-4 týdny debugging
- Master matice = komplexní (10 dnů)
- Security + testing = extra čas

---

## 📅 MILESTONES (Prioritizace)

### P0 (MUST-HAVE - dělat TEĎKA):
1. **Master matice** (killer feature pro účetní)
2. **Upload dokladů** + Google Drive + OCR
3. **Daňová kalkulačka** (červená čísla)

### P1 (HIGH - dělat BRZO):
4. Urgování (SMS/Email)
5. Pohoda integrace (faktury)

### P2 (MEDIUM - pak):
6. WhatsApp integrace
7. AI chat asistent

### P3 (LOW - možná):
8. Pokročilé reporty
9. Multi-firma support

---

## 🔑 ENV VARIABLES (které budeme potřebovat)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=... # Pro server-side operace

# Google Drive API (Service Account)
GOOGLE_SERVICE_ACCOUNT_EMAIL=...
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=...
GOOGLE_DRIVE_PARENT_FOLDER_ID=... # Root folder "Účetní OS"

# Google Gemini (OCR + AI)
GEMINI_API_KEY=...

# Pohoda mServer
POHODA_MSERVER_URL=...
POHODA_USERNAME=...
POHODA_PASSWORD=...

# Twilio (SMS)
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...

# SendGrid (Email)
SENDGRID_API_KEY=...
SENDGRID_FROM_EMAIL=...

# WhatsApp Business API
WHATSAPP_BUSINESS_ID=...
WHATSAPP_ACCESS_TOKEN=...
WHATSAPP_PHONE_NUMBER_ID=...
WHATSAPP_VERIFY_TOKEN=...
```

---

## 📚 DOKUMENTACE ODKAZY

- [README.md](./README.md) - Hlavní dokumentace projektu
- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Setup guide pro Supabase
- [QUICK_SETUP.md](./QUICK_SETUP.md) - Rychlý 5-minutový setup
- [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) - Frontend-first build plán

---

**Last updated:** 2025-01-24
**Next update:** Když změníme tech stack rozhodnutí nebo implementujeme něco důležitého

---

## 🗣️ KLÍČOVÁ ROZHODNUTÍ

### Tech Stack (Finální):
- **Database:** Supabase PostgreSQL
  - Důvod: Jednodušší dotazy než NoSQL, integrovaný Auth + RLS
- **Storage:** Google Drive (přímý upload)
  - Důvod: Zero extra náklady, Gemini API může číst přímo z Drive
- **Hosting:** Vercel
  - Důvod: Perfektní integrace s Next.js + Supabase
- **Upload Flow:** Klient → Google Drive → OCR (Gemini) → Update DB
  - Důvod: Jednodušší (3 kroky), levnější, méně error states

### Architektura:
- Frontend-first approach s mock daty
- API Routes pro backend logiku
- Row Level Security (RLS) v databázi
- Server-side validace všech operací
