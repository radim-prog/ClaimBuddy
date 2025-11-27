# 🚀 IMPLEMENTAČNÍ PLÁN - Frontend First

**Konkrétní step-by-step plán pro stavbu frontendu s mock daty**

---

## 🎯 STRATEGIE: Frontend First

Postavíme **všechny UI stránky s MOCK daty** → vypadá funkčně, ale backend napojíme později.

**Výhoda:** Vidíš okamžitě výsledky, motivace, rychlá iterace na designu.

---

## 🎨 DESIGN SYSTÉM (zachováme stávající)

### **Barvy:**
```css
/* Z landing page (app/page.tsx) */
--blue-primary: #2563eb (blue-600)
--blue-light: #dbeafe (blue-50)
--purple-primary: #9333ea (purple-600)
--purple-light: #faf5ff (purple-50)
--gray-text: #4b5563 (gray-600)

/* Gradients */
background: linear-gradient(to bottom right, blue-50, white, purple-50)
text: linear-gradient(to right, blue-600, purple-600)
```

### **Typography:**
```css
/* Headings */
h1: text-5xl font-bold
h2: text-2xl font-bold
h3: text-xl font-semibold

/* Body */
p: text-base text-gray-600
small: text-sm text-gray-500
```

### **Komponenty:**
- **shadcn/ui** (už máme button, card)
- Tailwind CSS utility classes
- Responsive (mobile-first)

### **Color Coding (pro statusy):**
```
🔴 Missing: bg-red-100 border-red-300 text-red-700
🟡 Uploaded: bg-yellow-100 border-yellow-300 text-yellow-700
🟢 Approved: bg-green-100 border-green-300 text-green-700
```

---

## 📋 IMPLEMENTAČNÍ FÁZE

### **FÁZE 1: Základy (1-2 dny)**

#### ✅ 1.1 Infrastruktura (HOTOVO)
```bash
# ✅ Supabase připojen
# ✅ Auth funguje
# ✅ Mock data připravena
# ✅ Shadcn/ui komponenty nainstalovány
```

#### ✅ 1.2 Přidat chybějící shadcn/ui komponenty
```bash
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add table
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add skeleton
```

#### ✅ 1.3 Vytvořit mock data
```typescript
// lib/mock-data.ts
export const mockUsers = [...]
export const mockCompanies = [...]
export const mockClosures = [...]
export const mockDocuments = [...]
```

---

### **FÁZE 2: Auth Pages (půl dne)**

#### ✅ 2.1 Login stránka
```
File: app/(auth)/login/page.tsx
Design: Stejný gradient jako landing page
- Email input
- Password input
- "Přihlásit se" button
- Link na /register
- MOCK: Po kliku redirect na /dashboard nebo /accountant/dashboard
```

#### ✅ 2.2 Register stránka
```
File: app/(auth)/register/page.tsx
Design: Stejný styl jako login
- Email, Password, Name, Role (dropdown)
- "Registrovat" button
- MOCK: Po kliku redirect na /dashboard
```

---

### **FÁZE 3: Master Matice 🔥 (2-3 dny)**

**KILLER FEATURE - děláme jako první!**

#### ✅ 3.1 Účetní layout
```
File: app/(accountant)/layout.tsx
- Sidebar s navigací:
  📊 Dashboard (Master Matice)
  👥 Klienti
  ✅ Úkoly
  📧 Urgování
  ⚙️ Nastavení
- User avatar + dropdown (Odhlásit se)
- Responsive (mobile hamburger)
```

#### ✅ 3.2 Master Matice komponenta
```
File: app/(accountant)/dashboard/page.tsx
File: components/accountant/MasterMatrix.tsx

UI:
┌──────────────┬──────┬──────┬──────┬─────┬──────┬─────┐
│ Klient       │ Led  │ Úno  │ Bře  │ ... │ Pro  │ Akce│
├──────────────┼──────┼──────┼──────┼─────┼──────┼─────┤
│ ABC s.r.o.   │  🟢  │  🟡  │  🔴  │     │      │ [📧]│
│ XYZ FO       │  🟢  │  🟢  │  🟡  │     │      │ [📧]│
│ DEF s.r.o.   │  🔴  │  🔴  │  🔴  │     │      │ [📧]│
└──────────────┴──────┴──────┴──────┴─────┴──────┴─────┘

Features:
- Mock 20 klientů × 12 měsíců (240 buněk)
- Barvy podle statusu (🔴🟡🟢)
- Klik na buňku → otevře Dialog s detailem
- Tlačítko "Urgovat" → otevře modal
- Search bar (filtrování klientů)
- Sort by name / sort by "nejvíc missing"
```

#### ✅ 3.3 Detail měsíce (Dialog)
```
File: components/accountant/MonthDetailDialog.tsx

UI:
┌──────────────────────────────────────┐
│  ABC s.r.o. - Leden 2025            │
├──────────────────────────────────────┤
│  📄 Výpis z účtu:     🟢 Schváleno   │
│  🧾 Účtenky:          🔴 Chybí (0)   │
│  📑 Výdajové faktury: 🟡 Nahráno (3) │
│  📑 Příjmové faktury: 🟢 Schváleno   │
│                                      │
│  Daňový odhad:                       │
│  DPH: 15 000 Kč                      │
│  DPFO: 3 500 Kč                      │
│                                      │
│  [Urgovat SMS] [Urgovat Email]       │
└──────────────────────────────────────┘
```

#### ✅ 3.4 Urgování modal
```
File: components/accountant/SendReminderDialog.tsx

UI:
- Dropdown: SMS nebo Email
- Textarea: Předvyplněná zpráva
- Preview co chybí
- "Odeslat" button (MOCK: jen alert "SMS odesláno!")
```

---

### **FÁZE 4: Klientský Dashboard (2 dny)**

#### ✅ 4.1 Klientský layout
```
File: app/(client)/layout.tsx
- Sidebar:
  📊 Dashboard
  📄 Doklady
  📑 Faktury
  💰 Přehled
- User avatar + dropdown
```

#### ✅ 4.2 Dashboard (Měsíční checklist)
```
File: app/(client)/dashboard/page.tsx

UI:
┌───────────────────────────────────────────┐
│  📅 Listopad 2025                         │
├───────────────────────────────────────────┤
│  Výpis z účtu        🟢  ✓ Nahráno       │
│  Výdajové faktury    🟡  ⚠️ 3 ks          │
│  Účtenky             🔴  ✗ Chybí          │
│  Příjmové faktury    🟢  ✓ 5 ks          │
├───────────────────────────────────────────┤
│  Progress: ███████░░░ 75%                 │
├───────────────────────────────────────────┤
│  💰 Daňový odhad tento měsíc:            │
│     DPH k odvedení:    15 000 Kč         │
│     Daň z příjmů:       3 500 Kč         │
│     Celkem:            18 500 Kč         │
├───────────────────────────────────────────┤
│  ⚠️ ČERVENÁ ČÍSLA:                        │
│  "Pokud nedoložíš chybějící účtenky,     │
│   ztratíš na daních cca 1 200 Kč"        │
└───────────────────────────────────────────┘

Buttons:
- [Nahrát doklady] (otevře upload modal)
```

#### ✅ 4.3 Upload modal (UI only)
```
File: components/client/DocumentUploadDialog.tsx

UI:
┌───────────────────────────────────────────┐
│  Nahrát doklady - Listopad 2025           │
├───────────────────────────────────────────┤
│  Typ dokladu:                             │
│  [Dropdown: Účtenka ▼]                    │
│                                           │
│  ┌─────────────────────────────────────┐ │
│  │   📤 Přetáhni soubory sem           │ │
│  │   nebo klikni pro výběr             │ │
│  │                                     │ │
│  │   Podporované: JPG, PNG, PDF       │ │
│  │   Max velikost: 10 MB               │ │
│  └─────────────────────────────────────┘ │
│                                           │
│  MOCK: Vybraný soubor se zobrazí         │
│  [uctenka.jpg] [×]                        │
│                                           │
│  [Zrušit] [Nahrát] (mock: alert)         │
└───────────────────────────────────────────┘
```

---

### **FÁZE 5: Detail views (1 den)**

#### ✅ 5.1 Seznam dokladů
```
File: app/(client)/doklady/page.tsx

UI: Table s mock daty
- Datum | Typ | Název | Status | OCR | Akce
- Filter by měsíc, typ
- Sort by datum
```

#### ✅ 5.2 Finanční přehled
```
File: app/(client)/prehled/page.tsx

UI:
- Grafy (recharts)
- Kumulativní daně za rok (mock data)
- Rozpad DPH / DPFO / Pojištění
```

---

### **FÁZE 6: Polish & Responsive (1 den)**

#### ✅ 6.1 Mobile responsiveness
- Master matice: jiné UI na mobilu (dropdown select klienta)
- Sidebar: hamburger menu
- Tables: horizontal scroll

#### ✅ 6.2 Loading states
```typescript
// Všude přidat:
{isLoading && <Skeleton />}
{error && <ErrorMessage />}
{data && <Content />}
```

#### ✅ 6.3 Empty states
```typescript
// Když žádná data:
<EmptyState
  icon="📄"
  title="Žádné doklady"
  description="Nahraj první doklad kliknutím na tlačítko výše"
/>
```

---

## 📦 MOCK DATA STRUKTURA

### **lib/mock-data.ts**
```typescript
// Users
export const mockUsers = [
  { id: '1', name: 'Jan Novák', email: 'jan@example.cz', role: 'client' },
  { id: '2', name: 'Petra Účetní', email: 'petra@ucetni.cz', role: 'accountant' }
]

// Companies
export const mockCompanies = [
  {
    id: '1',
    name: 'ABC s.r.o.',
    ico: '12345678',
    owner_id: '1',
    vat_payer: true
  },
  // ... 20 more
]

// Monthly closures (20 companies × 12 months = 240 records)
export const mockClosures = [
  {
    id: '1',
    company_id: '1',
    period: '2025-01',
    bank_statement_status: 'approved',
    receipts_status: 'missing',
    expense_invoices_status: 'uploaded',
    income_invoices_status: 'approved',
    vat_payable: 15000,
    income_tax_accrued: 3500
  },
  // ... more
]

// Documents
export const mockDocuments = [
  {
    id: '1',
    company_id: '1',
    period: '2025-01',
    type: 'receipt',
    file_name: 'uctenka_lidl.jpg',
    status: 'uploaded',
    ocr_data: {
      total_amount: 523.50,
      supplier_name: 'Lidl',
      confidence: 0.95
    }
  },
  // ... more
]
```

---

## 🎯 CHECKLIST (Co postavit)

### **FÁZE 1: Základy** ✅ HOTOVO
- [x] Next.js + TypeScript + Tailwind setup
- [x] Nainstalovat shadcn/ui komponenty
- [x] Vytvořit mock-data.ts

### **FÁZE 2: Auth**
- [ ] app/(auth)/login/page.tsx
- [ ] app/(auth)/register/page.tsx
- [ ] Mock redirect

### **FÁZE 3: Master Matice** 🔥
- [ ] app/(accountant)/layout.tsx
- [ ] app/(accountant)/dashboard/page.tsx
- [ ] components/accountant/MasterMatrix.tsx
- [ ] components/accountant/MonthDetailDialog.tsx
- [ ] components/accountant/SendReminderDialog.tsx

### **FÁZE 4: Klientský Dashboard**
- [ ] app/(client)/layout.tsx
- [ ] app/(client)/dashboard/page.tsx (checklist)
- [ ] components/client/DocumentUploadDialog.tsx
- [ ] components/client/TaxSummaryCard.tsx
- [ ] components/client/RedNumbersWarning.tsx

### **FÁZE 5: Detail Views**
- [ ] app/(client)/doklady/page.tsx
- [ ] app/(client)/prehled/page.tsx

### **FÁZE 6: Polish**
- [ ] Mobile responsiveness
- [ ] Loading states (Skeleton)
- [ ] Empty states
- [ ] Error states

---

## 🚀 READY TO START!

**Začneme FÁZÍ 1 (cleanup) a pak rovnou FÁZÍ 3 (Master Matice)** - tvůj killer feature!

**Status:** ✅ Připraveno k implementaci

