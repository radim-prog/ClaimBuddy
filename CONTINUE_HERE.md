# 🎯 CONTINUE HERE - Přesný bod návratu

**Datum poslední práce:** 2025-11-24
**Větev:** `claude/load-project-0139XquGDoefhFdrvoDP3cEN`
**Progress:** 50% projektu hotovo
**Status:** Vše commitnuto a pushnuté na GitHub ✅

---

## 🚀 JAK POKRAČOVAT (PŘESNÉ KROKY)

### 1. Naklonuj repozitář (pokud ještě nemáš)
```bash
git clone https://github.com/radim-prog/UcetniWebApp.git
cd UcetniWebApp
```

### 2. Přepni se na pracovní větev
```bash
git checkout claude/load-project-0139XquGDoefhFdrvoDP3cEN
git pull origin claude/load-project-0139XquGDoefhFdrvoDP3cEN
```

### 3. Nainstaluj závislosti
```bash
npm install
```

### 4. Nastav environment variables
Vytvoř soubor `.env.local` v root složce:
```env
NEXT_PUBLIC_SUPABASE_URL=https://ybcubkuskirbspyoxpak.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliY3Via3Vza2lyYnNweW94cGFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc2NDk4OTcsImV4cCI6MjA1MzIyNTg5N30.f5YqVFh0G7fH7wXeMxJx3KN6hWPFtVBQQZgxOYPNEf4
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliY3Via3Vza2lyYnNweW94cGFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzY0OTg5NywiZXhwIjoyMDUzMjI1ODk3fQ.gXOR0x8V_RBwJiRqNLqr-CgOOajrOMHfg5WNJjvG_Gk
```

**POZOR:** Tyto credentials jsou v `CREDENTIALS.md` na GitHubu.

### 5. Spusť dev server
```bash
npm run dev
```

Server poběží na: **http://localhost:3000**

---

## ✅ CO JE UŽ HOTOVO

### MODUL A: Infrastruktura ✅
- [x] Next.js 14 + TypeScript + Tailwind setup
- [x] Supabase setup (@supabase/ssr)
- [x] Mock data (5 klientů × 12 měsíců × 4 kategorie dokumentů)
- [x] shadcn/ui komponenty (input, label, dialog, avatar, dropdown-menu, button, card)

**Klíčové soubory:**
- `lib/supabase.ts` - Browser client
- `lib/supabase-server.ts` - Server client (s cookie handling pro auth)
- `lib/mock-data.ts` - Mock data pro testování

### MODUL B: Autentizace ✅
- [x] Login page (`/login`) s toast notifications
- [x] Register page (`/register`) s validací
- [x] Server Actions pro auth (Supabase Auth)
- [x] Middleware pro route protection
- [x] Role-based routing (client → /client/dashboard, accountant → /accountant/dashboard)

**Klíčové soubory:**
- `app/(auth)/login/page.tsx` - Login UI
- `app/(auth)/login/actions.ts` - Login server action
- `app/(auth)/register/page.tsx` - Register UI
- `app/(auth)/register/actions.ts` - Register server action
- `middleware.ts` - Route protection + role-based access

**Co funguje:**
- Registrace nového usera
- Automatický login po registraci
- Session cookies (Supabase Auth)
- Redirect podle role (client/accountant/admin)
- Toast notifications pro errors/success (sonner)

### MODUL C: Master Matice (Killer Feature!) ✅
- [x] Accountant layout s sidebar + hamburger menu
- [x] Master Matrix dashboard (5 klientů × 12 měsíců)
- [x] Barevné statusy (🔴 missing, 🟡 uploaded, 🟢 approved)
- [x] Hover tooltips s detailem všech 4 kategorií dokumentů
- [x] Stats cards (celkové počty podle statusu)
- [x] Legenda
- [x] Responsive design

**Klíčové soubory:**
- `app/(accountant)/layout.tsx` - Layout s navigací
- `app/(accountant)/dashboard/page.tsx` - Master Matrix komponenta
- `app/(accountant)/clients/page.tsx` - Placeholder
- `app/(accountant)/tasks/page.tsx` - Placeholder

**Co funguje:**
- Master Matrix tabulka se zobrazuje s mock daty
- Hover na buňku → tooltip s detailem (výpis z banky, výdaje, příjmy, účtenky)
- Stats cards ukazují celkové počty
- Sidebar navigace
- User dropdown s logout
- Mobile hamburger menu

### MODUL D: Client Dashboard ✅
- [x] Client layout s navigací
- [x] Dashboard s přehledem firem
- [x] Stats cards (Moje firmy, Chybějící dokumenty)
- [x] Seznam firem s alerty
- [x] Quick actions (Nahrát, Zobrazit dokumenty)
- [x] Placeholder pages (companies, documents, upload)

**Klíčové soubory:**
- `app/(client)/layout.tsx` - Layout pro klienty
- `app/(client)/dashboard/page.tsx` - Dashboard
- `app/(client)/companies/page.tsx` - Placeholder
- `app/(client)/documents/page.tsx` - Placeholder
- `app/(client)/upload/page.tsx` - Placeholder

**Co funguje:**
- Dashboard zobrazuje firmy uživatele (podle owner_id)
- Alerty pro chybějící dokumenty
- Stats cards s počty
- Sidebar navigace
- Responsive design

---

## 🚧 CO ZBÝVÁ UDĚLAT (PRIORITY)

### PRIORITA 1: Deployment na Vercel
**Problém:** Na Vercelu je stará verze (jenom landing page).
**Řešení:** Redeploy z větve `claude/load-project-0139XquGDoefhFdrvoDP3cEN`

**Kroky:**
1. Jdi na Vercel Dashboard
2. Settings → Git → Production Branch
3. Změň z `main` na `claude/load-project-0139XquGDoefhFdrvoDP3cEN`
4. Deployments → Redeploy

**NEBO:**
- Zmerguj větev do `main` přes GitHub Pull Request
- Vercel automaticky deployне z `main`

### PRIORITA 2: Napojení na Supabase (nahradit mock data)
**Aktuální stav:** Všechno používá `lib/mock-data.ts`
**Cíl:** Načítat data z Supabase databáze

**Konkrétní úkoly:**

#### 2.1 Master Matrix - reálná data
**Soubor:** `app/(accountant)/dashboard/page.tsx`

**Co změnit:**
```typescript
// PŘED (mock data):
import { mockCompanies, mockMonthlyClosures } from '@/lib/mock-data'

// PO (Supabase):
import { createServerClient } from '@/lib/supabase-server'

// Přidat fetch funkci:
async function getMatrixData() {
  const supabase = createServerClient()

  const { data: companies } = await supabase
    .from('companies')
    .select('*')
    .order('name')

  const { data: closures } = await supabase
    .from('monthly_closures')
    .select('*')
    .eq('period', '2025-01')  // nebo dynamicky podle roku

  return { companies, closures }
}
```

#### 2.2 Client Dashboard - reálná data
**Soubor:** `app/(client)/dashboard/page.tsx`

**Co změnit:**
```typescript
// Načíst firmy aktuálního usera
const { data: { user } } = await supabase.auth.getUser()

const { data: companies } = await supabase
  .from('companies')
  .select('*, monthly_closures(*)')
  .eq('owner_id', user.id)
```

#### 2.3 Test s reálnými daty v Supabase
**Aktuální stav:** Databáze je prázdná (kromě schema)

**Potřeba:**
1. Zaregistrovat testovacího usera (přes `/register`)
2. V Supabase SQL Editor vložit testovací data:

```sql
-- Testovací firma
INSERT INTO companies (id, owner_id, name, ico, dic, vat_payer, legal_form)
VALUES (
  gen_random_uuid(),
  'ID_USERA_Z_REGISTRACE',  -- nahraď skutečným ID
  'Test s.r.o.',
  '12345678',
  'CZ12345678',
  true,
  's.r.o.'
);

-- Testovací uzávěrka
INSERT INTO monthly_closures (
  company_id,
  period,
  bank_statement_status,
  expense_invoices_status,
  income_invoices_status,
  receipts_status
) VALUES (
  'ID_FIRMY',  -- nahraď ID firmy výše
  '2025-01',
  'missing',
  'missing',
  'missing',
  'missing'
);
```

### PRIORITA 3: Upload funkcionalita
**Cíl:** Klient může nahrát dokumenty

**Úkoly:**
1. Google Drive integrace (nebo Supabase Storage)
2. Upload UI v `/client/upload`
3. Drag & drop
4. File preview
5. Uložení do `documents` tabulky
6. Update `monthly_closures` statusu

**Soubor:** `app/(client)/upload/page.tsx`

**Základní struktura:**
```typescript
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)

  const handleUpload = async () => {
    if (!file) return

    const supabase = createClient()

    // Upload do Supabase Storage
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(`${Date.now()}_${file.name}`, file)

    if (error) {
      console.error('Upload failed:', error)
      return
    }

    // Uložit záznam do documents tabulky
    await supabase.from('documents').insert({
      company_id: 'ID_FIRMY',
      period: '2025-01',
      document_type: 'bank_statement',  // nebo jiný typ
      file_url: data.path,
      file_name: file.name,
    })
  }

  return (
    <div>
      <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      <button onClick={handleUpload}>Nahrát</button>
    </div>
  )
}
```

### PRIORITA 4: Detail klienta + schvalování
**Cíl:** Účetní klikne na buňku v Master Matici → detail uzávěrky

**Soubor:** `app/(accountant)/clients/[companyId]/page.tsx` (vytvořit)

**Co má obsahovat:**
- Informace o firmě
- Seznam všech dokumentů pro daný měsíc
- Tlačítka pro schválení/zamítnutí každého dokumentu
- Update statusu v `monthly_closures`

### PRIORITA 5: Komunikace (urgování)
**Cíl:** Účetní urguje klienta, který neposlal dokumenty

**Úkoly:**
1. Email notifikace (SendGrid API)
2. SMS připomínky (Twilio API)
3. WhatsApp integrace (optional)
4. Automatické urgence (cron job)

**Soubor:** `app/api/urgency/route.ts` (vytvořit)

---

## 📁 STRUKTURA PROJEKTU

```
UcetniWebApp/
├── app/
│   ├── (auth)/              # ✅ Auth pages (public routes)
│   │   ├── login/
│   │   │   ├── page.tsx     # ✅ Login UI
│   │   │   └── actions.ts   # ✅ Login server action
│   │   ├── register/
│   │   │   ├── page.tsx     # ✅ Register UI
│   │   │   └── actions.ts   # ✅ Register server action
│   │   └── layout.tsx       # ✅ Auth layout
│   │
│   ├── (accountant)/        # ✅ Accountant routes (protected)
│   │   ├── dashboard/
│   │   │   └── page.tsx     # ✅ Master Matrix
│   │   ├── clients/
│   │   │   └── page.tsx     # 📝 Placeholder → potřeba implementovat
│   │   ├── tasks/
│   │   │   └── page.tsx     # 📝 Placeholder
│   │   └── layout.tsx       # ✅ Accountant layout
│   │
│   ├── (client)/            # ✅ Client routes (protected)
│   │   ├── dashboard/
│   │   │   └── page.tsx     # ✅ Client dashboard
│   │   ├── companies/
│   │   │   └── page.tsx     # 📝 Placeholder
│   │   ├── documents/
│   │   │   └── page.tsx     # 📝 Placeholder
│   │   ├── upload/
│   │   │   └── page.tsx     # 📝 Placeholder → PRIORITA 3
│   │   └── layout.tsx       # ✅ Client layout
│   │
│   ├── api/                 # 🔜 API routes (zatím neexistuje)
│   │   └── ...              # Potřeba vytvořit
│   │
│   ├── layout.tsx           # ✅ Root layout (s Toaster)
│   ├── page.tsx             # ✅ Landing page
│   └── globals.css          # ✅ Global styles
│
├── components/
│   └── ui/                  # ✅ shadcn/ui komponenty
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── dialog.tsx
│       ├── avatar.tsx
│       └── dropdown-menu.tsx
│
├── lib/
│   ├── supabase.ts          # ✅ Browser client
│   ├── supabase-server.ts   # ✅ Server client
│   └── mock-data.ts         # ✅ Mock data (nahradit reálnými)
│
├── supabase/
│   └── schema.sql           # ✅ Database schema
│
├── middleware.ts            # ✅ Route protection + role-based access
├── .env.local               # ⚠️ LOKÁLNĚ (ne na GitHubu!)
├── .env.local.example       # ✅ Template
│
├── PROGRESS.md              # ✅ Progress report
├── TASK_BREAKDOWN.md        # ✅ Task breakdown (50% done)
├── CREDENTIALS.md           # ✅ API keys (na GitHubu)
├── ARCHITECTURE.md          # ✅ Technická architektura
└── CONTINUE_HERE.md         # 👈 TENTO SOUBOR
```

---

## 🧪 JAK OTESTOVAT CO FUNGUJE

### Test 1: Auth Flow
```bash
npm run dev
```

1. Otevři: http://localhost:3000
2. Klikni "Registrace"
3. Zadej: `test@example.com` / `password123` / `Test User`
4. Po registraci → automatický redirect na `/client/dashboard` ✅
5. Odhlásit se
6. Přihlásit znovu → redirect na `/client/dashboard` ✅

### Test 2: Master Matrix
1. Přihlaš se jako účetní (potřeba ručně změnit role v Supabase):
   - Jdi do Supabase Dashboard → Table Editor → `users`
   - Najdi svého usera
   - Změň `role` z `client` na `accountant`
2. Odhlásit se a přihlásit znovu
3. → Redirect na `/accountant/dashboard` ✅
4. Uvidíš Master Matrix (5 klientů × 12 měsíců) ✅
5. Hover na buňku → tooltip s detailem ✅

### Test 3: Client Dashboard
1. Přihlaš se jako client
2. Uvidíš dashboard s přehledem firem ✅
3. Stats cards: Moje firmy (0), Chybějící dokumenty (0) ✅
4. Seznam firem je prázdný (mock data filtruje podle owner_id) ✅

### Test 4: Middleware Protection
1. Odhlásit se
2. Zkus otevřít: http://localhost:3000/client/dashboard
3. → Redirect na `/login` ✅
4. Zkus otevřít: http://localhost:3000/accountant/dashboard
5. → Redirect na `/login` ✅

---

## 🔧 TECHNICKÉ DETAILY

### Database Schema (Supabase)
Spuštěno: `supabase/schema.sql`

**Tabulky:**
- `users` - Uživatelé (id, email, name, role, phone_number)
- `companies` - Firmy klientů
- `monthly_closures` - Měsíční uzávěrky (4 kategorie dokumentů)
- `documents` - Nahrané soubory
- `communication_logs` - Historie komunikace
- `tasks` - Úkoly účetních

**Row Level Security (RLS):**
- ✅ Nakonfigurováno v `schema.sql`
- Klienti vidí jen své firmy
- Účetní vidí všechny firmy

### Auth Flow
1. User → `/register`
2. `register/actions.ts` → `supabase.auth.signUp()`
3. Vytvoří záznam v `users` tabulce (role: 'client')
4. Auto-login → session cookie
5. Redirect podle role (`middleware.ts`)

### Middleware Logic
```typescript
// middleware.ts
- Public routes: /, /login, /register
- Protected routes: /client/*, /accountant/*
- Role check: Načte users.role z databáze
- Redirect:
  - client → /client/dashboard
  - accountant/admin → /accountant/dashboard
```

### Mock Data Strategy
**Aktuálně:** Všechno používá `lib/mock-data.ts`

**Struktura mock dat:**
- 2 users (1 client, 1 accountant)
- 5 companies (owner_id: 'user-1-client')
- 60 monthly_closures (5 companies × 12 months)
- 10 documents

**Strategické rozložení statusů:**
- Měsíce 1-3: approved (zelená)
- Měsíce 4-6: uploaded (žlutá)
- Měsíce 7-12: missing (červená)

---

## 🐛 ZNÁMÉ PROBLÉMY

### ✅ Vyřešené:
- ~~Deprecated @supabase/auth-helpers-nextjs~~ → přepnuto na @supabase/ssr ✅
- ~~shadcn CLI auth errors~~ → komponenty přidány ručně ✅
- ~~Server Actions s cookies~~ → lib/supabase-server.ts má get/set/remove ✅
- ~~next.config.js warning~~ → odstraněn experimental.serverActions ✅
- ~~Zavádějící Firebase/Railway zmínky~~ → všechny odstraněny ✅

### 🚧 K vyřešení:
- **Mock data vs. reálná data:** Všechno používá mock data → potřeba přepnout na Supabase
- **Prázdná databáze:** Schema je spuštěno, ale tabulky jsou prázdné → potřeba testovací data
- **Vercel deployment:** Stará verze je deploynutá → potřeba redeploy z nové větve
- **Upload není implementován:** Placeholder page → PRIORITA 3

---

## 📝 GIT WORKFLOW

### Aktuální stav:
- **Větev:** `claude/load-project-0139XquGDoefhFdrvoDP3cEN`
- **Commity:** 22 commitů
- **Remote:** Vše pushnuté na GitHub ✅

### Když pokračuješ:
```bash
# 1. Ujisti se že jsi na správné větvi
git checkout claude/load-project-0139XquGDoefhFdrvoDP3cEN

# 2. Pull nejnovější změny
git pull origin claude/load-project-0139XquGDoefhFdrvoDP3cEN

# 3. Pracuj na nové feature
# ... dělej změny ...

# 4. Commit
git add .
git commit -m "📝 Popis změny"

# 5. Push
git push origin claude/load-project-0139XquGDoefhFdrvoDP3cEN
```

### Merge do main (když budeš chtít):
```bash
# Varianta 1: Přes GitHub Pull Request (doporučuji)
# → Jdi na GitHub → Create Pull Request

# Varianta 2: Lokálně
git checkout main
git pull origin main
git merge claude/load-project-0139XquGDoefhFdrvoDP3cEN
git push origin main
```

---

## 🎯 PŘÍŠTÍ KROKY (PRIORITIZOVANÉ)

### Krok 1: Deploy na Vercel ⚡ (5 minut)
Aby fungovalo to, co je hotové.

### Krok 2: Test auth flow 🔐 (10 minut)
Zaregistrovat usera, přihlásit, otestovat redirecty.

### Krok 3: Vložit testovací data do Supabase 📊 (15 minut)
Aby Master Matrix a Client Dashboard zobrazovaly reálná data.

### Krok 4: Napojit Master Matrix na Supabase 🔌 (30 minut)
Nahradit mock data reálnými v `app/(accountant)/dashboard/page.tsx`.

### Krok 5: Napojit Client Dashboard na Supabase 🔌 (20 minut)
Nahradit mock data reálnými v `app/(client)/dashboard/page.tsx`.

### Krok 6: Implementovat Upload 📤 (1-2 hodiny)
Vytvořit upload UI v `/client/upload`.

### Krok 7: Detail klienta + schvalování ✅ (1-2 hodiny)
Vytvořit `/accountant/clients/[companyId]` page.

### Krok 8: Komunikace (urgování) 📧 (2-3 hodiny)
Email/SMS notifikace přes SendGrid/Twilio.

---

## 💬 POZNÁMKY PRO POKRAČOVÁNÍ

- **Dev server:** Běží bez errors/warnings ✅
- **TypeScript:** Vše typované, žádné `any` ✅
- **Responsive:** Desktop + mobile design hotový ✅
- **Git:** Všechno commitnuto a pushnuté ✅
- **Dokumentace:** PROGRESS.md, TASK_BREAKDOWN.md, ARCHITECTURE.md ✅

**Pokud něco nefunguje:**
1. Zkontroluj `.env.local` (credentials)
2. Zkus `npm install` znovu
3. Restartuj dev server
4. Zkontroluj Supabase Dashboard (tabulky existují?)

**Pro otázky:**
- Koukni do `PROGRESS.md` (detailní popis hotových features)
- Koukni do `TASK_BREAKDOWN.md` (co zbývá)
- Koukni do `ARCHITECTURE.md` (technické detaily)

---

**🎉 Projekt je připravený na pokračování! Všechno je uložené, funkční a zdokumentované.**

**Příští session začni tady → kroky výše ↑**
