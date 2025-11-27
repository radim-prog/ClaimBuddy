# 📊 Účetní OS - Kompletní webová aplikace pro účetní firmu

Samoobslužný portál pro klienty a master dashboard pro účetní. Nahrazuje Notion, Slack, Raynet a iDoklad v jedné aplikaci.

---

## 🎯 Hlavní funkce

### **Pro klienty:**
- ✅ **Kontrola podkladů** - Měsíční checklist (výpisy, faktury, účtenky)
- ✅ **Nahrávání dokladů** - PDF, obrázky, OCR zpracování
- ✅ **Vystavování faktur** - Integrace s Pohoda API
- ✅ **Finanční přehledy** - Měsíční DPH a daň z příjmů (s "červenými čísly")
- ✅ **AI chat asistent** - Přístup k historickým datům
- ✅ **Responsivní design** - Mobile-first (fotit účtenky na mobil)

### **Pro účetní:**
- ✅ **Master Matice** 🔥 - Přehled všech klientů × 12 měsíců (killer feature!)
- ✅ **Urgovací systém** - Automatické SMS/Email když chybí podklady
- ✅ **Párování plateb** - Výpisy × faktury (OCR + AI)
- ✅ **Úkolový systém** - Náhrada Notion/Slack (chat ke každému úkolu)
- ✅ **WhatsApp integrace** - Požadavky klientů → automatické úkoly
- ✅ **Google Drive propojení** - Struktura: Klient_ID/Rok/Měsíc

### **Automatizace:**
- ✅ **OCR účtenek** - Gemini 2.5 Flash → XML → Pohoda
- ✅ **Párování dokladů** - Výpisy vs. faktury (AI matching)
- ✅ **Daňová kalkulačka** - Real-time odhad daní po měsících
- ✅ **Červená čísla** - "Když nedoložíš tento doklad, ztratíš 5 000 Kč na daních"
- ✅ **Automatické faktury** - Zálohy klientům (kontrola plateb)

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Next.js API Routes
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Authentication
- **Storage:** Google Drive (direct upload via Service Account)
- **Hosting:** Vercel
- **AI:**
  - Google Gemini 2.5 Flash (OCR, kontextové zpracování)
- **Integrace:**
  - Pohoda mServer (XML API)
  - WhatsApp Business API
  - Twilio (SMS)
  - SendGrid (Email)

---

## 📦 Rychlý start

### **1. Naklonovat a nainstalovat**
```bash
git clone https://github.com/radim-prog/UcetniWebApp.git
cd UcetniWebApp
npm install
```

### **2. Supabase setup**
```bash
# 1. Vytvoř Supabase projekt na https://supabase.com
# 2. V SQL Editor spusť: supabase/schema.sql
# 3. Zkopíruj API credentials
```

### **3. Environment variables**
```bash
cp .env.local.example .env.local
# Vyplň:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY
# - GEMINI_API_KEY
# - GOOGLE_DRIVE_CLIENT_EMAIL
# - GOOGLE_DRIVE_PRIVATE_KEY
```

### **4. Spustit vývojový server**
```bash
npm run dev
# http://localhost:3000
```

---

## 🗂️ Struktura projektu

```
UcetniWebApp/
├── app/
│   ├── (auth)/                 # Autentizace
│   │   ├── login/
│   │   └── register/
│   ├── (client)/               # Klientská část
│   │   ├── dashboard/
│   │   ├── doklady/
│   │   ├── faktury/
│   │   └── prehled/
│   ├── (accountant)/           # Účetní část
│   │   ├── dashboard/          # Master Matice (všichni klienti)
│   │   ├── klienti/
│   │   ├── ukoly/
│   │   └── nastaveni/
│   └── api/
│       ├── ocr/                # Gemini OCR endpoint
│       ├── ai-chat/            # AI asistent
│       ├── pohoda/             # Pohoda XML export/import
│       ├── google-drive/       # Google Drive operations
│       ├── reminders/          # SMS/Email urgence
│       └── webhooks/
│           └── whatsapp/       # WhatsApp webhook
├── components/
│   ├── ui/                     # shadcn/ui komponenty
│   ├── client/                 # Klientské komponenty
│   ├── accountant/             # Účetní komponenty
│   └── shared/                 # Sdílené komponenty
├── lib/
│   ├── supabase.ts             # Supabase client
│   ├── ocr.ts                  # OCR logika
│   ├── pohoda.ts               # Pohoda XML generator
│   ├── google-drive.ts         # Google Drive API
│   ├── tax-calculator.ts       # Daňová kalkulačka
│   └── utils.ts
├── types/
│   └── database.ts             # TypeScript typy
└── supabase/
    └── schema.sql              # PostgreSQL schema s indexy a RLS
```

---

## 🗄️ Databázové schema

Kompletní PostgreSQL schema s Row Level Security (RLS) je v `supabase/schema.sql`.

**Klíčové tabulky:**
- `users` - Uživatelé (klienti + účetní)
- `companies` - Firmy klientů
- `monthly_closures` - Měsíční uzávěrky (MASTER TABLE pro Matici)
- `documents` - Všechny doklady (účtenky, faktury, výpisy)
- `invoices` - Vydané i přijaté faktury
- `tasks` - Úkolový systém
- `chats` + `chat_messages` - Chat ke každému úkolu
- `reminders` - Historie urgování
- `audit_log` - Audit trail všech akcí

**Důležité indexy:**
- `idx_monthly_closures_company_period` - Performance pro Master Matici
- `idx_documents_company_period` - Rychlé filtrování dokladů
- RLS policies zajišťují že klient vidí jen svoje data

---

## 🚀 Deployment

### **Vercel (doporučeno)**
```bash
npm install -g vercel
vercel
```

### **Environment variables v Vercel:**
Přidat všechny z `.env.local` do Vercel Project Settings → Environment Variables

---

## 💰 Odhadované náklady (100 klientů)

| Služba | Měsíční náklady |
|--------|-----------------|
| Supabase (Pro) | $25 |
| Gemini API (OCR) | ~$30 (1000 dokladů) |
| Twilio (SMS) | ~$20 (200 SMS) |
| SendGrid (Email) | ~$15 (10k emailů) |
| Google Drive API | Zdarma (15 GB) |
| Vercel (Pro) | $20 |
| **Celkem** | **~$110/měsíc** |

---

## 📚 Dokumentace

- **[CONTEXT.md](./CONTEXT.md)** - Tech stack rozhodnutí a conversation history
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Kompletní systémová architektura s diagramy
- **[EXPERT_REVIEW.md](./EXPERT_REVIEW.md)** - Expert panel review (8 expertů)
- **[IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)** - Frontend-first build plán (aktuální strategie)
- **[supabase/schema.sql](./supabase/schema.sql)** - PostgreSQL schema s indexy a RLS

---

## 📋 Aktuální stav projektu

### ✅ **Hotovo:**
- Next.js setup
- Landing page (app/page.tsx)
- Supabase schema (production-ready s indexy)
- TypeScript typy
- Expert review a architektura
- Frontend-first implementační plán

### 🚧 **Nyní stavíme:**
- API Routes pro backend funkcionalitu
- Timeline systém pro správu klientských tasků
- Upload dokumentů s OCR zpracováním
- Master Matice workflow (schvalování dokumentů)

### 📅 **Plán:**
Stavíme **frontend first s mock daty** → vidíme okamžitě výsledky → pak napojíme backend.

---

## 🔐 Bezpečnost

- ✅ Row Level Security (RLS) v Supabase
- ✅ Server-side validace (dle expert review)
- ✅ API routes chráněné middleware
- ✅ Google Drive Service Account (ne OAuth)
- ✅ File upload validace (MIME type, velikost)
- ✅ Audit log všech akcí
- ✅ Environment variables (nikdy v kódu)
- ✅ HTTPS only (Vercel)

---

## 🎨 Design systém

Zachováváme existující design z landing page:

**Barvy:**
- Primary blue: `#2563eb` (blue-600)
- Primary purple: `#9333ea` (purple-600)
- Background: `gradient(blue-50, white, purple-50)`
- Text gradient: `gradient(blue-600, purple-600)`

**Status colors:**
- 🔴 Missing: `bg-red-100 border-red-300 text-red-700`
- 🟡 Uploaded: `bg-yellow-100 border-yellow-300 text-yellow-700`
- 🟢 Approved: `bg-green-100 border-green-300 text-green-700`

---

## 👨‍💻 Autor

**Radim** - [radim@wikiporadce.cz](mailto:radim@wikiporadce.cz)

---

## 📄 License

Private - Proprietary Software
