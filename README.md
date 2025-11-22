# 📊 Účetní OS - Komplexní webová aplikace pro účetní firmu

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

### **Pro účetní ("holky"):**
- ✅ **Master dashboard** - Matice klient × měsíc (přehled všech podkladů)
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
- **Storage:** Google Drive API (Service Account)
- **AI:**
  - Gemini 2.5 Flash (OCR, kontextové zpracování)
  - OpenAI GPT-4o (Chat asistent)
- **Integrace:**
  - Pohoda mServer (XML API)
  - Google Drive (Service Account)
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

### **2. Nastavit environment variables**
```bash
cp .env.local.example .env.local
# Vyplnit Supabase credentials, API klíče
```

### **3. Spustit vývojový server**
```bash
npm run dev
# http://localhost:3000
```

---

## 🗂️ Struktura projektu

```
ucetni-os/
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
│   │   ├── dashboard/          # Master matice (všichni klienti)
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
    ├── migrations/             # SQL migrace
    └── seed.sql                # Dummy data pro development
```

---

## 🗄️ Databázové schema (Supabase)

### **users**
```sql
id: uuid (PK)
email: text
name: text
role: enum ('client', 'accountant', 'admin')
phone_number: text
created_at: timestamp
```

### **companies**
```sql
id: uuid (PK)
owner_id: uuid (FK → users.id)
assigned_accountant_id: uuid (FK → users.id)
name: text
ico: text
dic: text
vat_payer: boolean
vat_period: enum ('monthly', 'quarterly', null)
google_drive_folder_id: text
pohoda_id: text
created_at: timestamp
```

### **monthly_closures**
```sql
id: uuid (PK)
company_id: uuid (FK → companies.id)
period: text ('2025-01')
status: enum ('open', 'pending_review', 'closed')
bank_statement_status: enum ('missing', 'uploaded', 'approved')
invoices_status: enum ('missing', 'uploaded', 'approved')
receipts_status: enum ('missing', 'uploaded', 'approved')
vat_payable: decimal
income_tax_accrued: decimal
closed_at: timestamp
reminder_count: integer
last_reminder_sent_at: timestamp
```

### **documents**
```sql
id: uuid (PK)
company_id: uuid (FK → companies.id)
period: text ('2025-01')
type: enum ('bank_statement', 'receipt', 'expense_invoice', 'other')
file_name: text
file_url: text
google_drive_file_id: text
ocr_processed: boolean
ocr_data: jsonb
status: enum ('missing', 'uploaded', 'approved', 'rejected')
uploaded_by: uuid (FK → users.id)
uploaded_at: timestamp
```

### **invoices**
```sql
id: uuid (PK)
company_id: uuid (FK → companies.id)
type: enum ('income', 'expense')
invoice_number: text
issue_date: date
due_date: date
total_without_vat: decimal
total_vat: decimal
total_with_vat: decimal
payment_status: enum ('unpaid', 'paid', 'overdue')
pohoda_id: text
generated_by_ai: boolean
```

### **tasks**
```sql
id: uuid (PK)
title: text
description: text
company_id: uuid (FK → companies.id)
assigned_to: uuid (FK → users.id)
created_by: uuid (FK → users.id)
status: enum ('open', 'in_progress', 'completed', 'cancelled')
priority: enum ('low', 'medium', 'high', 'urgent')
source: enum ('manual', 'whatsapp', 'chat', 'ai_generated')
whatsapp_message_id: text
due_date: timestamp
created_at: timestamp
```

### **chat_messages**
```sql
id: uuid (PK)
task_id: uuid (FK → tasks.id) -- nullable, může být i company chat
company_id: uuid (FK → companies.id)
sender_id: uuid (FK → users.id)
sender_type: enum ('client', 'accountant', 'ai')
text: text
ai_generated: boolean
created_at: timestamp
```

---

## 🚀 Deployment

### **Vercel (doporučeno)**
```bash
npm install -g vercel
vercel
```

### **Environment variables v Vercel:**
Přidat všechny z `.env.local.example` do Vercel Project Settings

---

## 📋 Roadmap

### **Milestone 1: Infrastructure & Auth** ✅
- [x] Next.js setup
- [x] Supabase schema
- [x] Autentizace (login/register)
- [x] Role-based routing

### **Milestone 2: Client Dashboard** 🚧
- [ ] Měsíční checklist podkladů
- [ ] Upload komponenta (Google Drive)
- [ ] OCR integrace (Gemini)
- [ ] Jednoduchá daňová kalkulačka
- [ ] Finanční přehled (grafy)

### **Milestone 3: Accountant Dashboard** 📅
- [ ] Master matice (všichni klienti × měsíce)
- [ ] Urgovací systém (SMS/Email)
- [ ] Detail klienta
- [ ] Párování plateb

### **Milestone 4: Integrace** 📅
- [ ] Pohoda XML export/import
- [ ] WhatsApp webhook
- [ ] AI chat asistent
- [ ] Úkolový systém

### **Milestone 5: Fakturace** 📅
- [ ] Vystavování faktur (přes Pohoda API)
- [ ] Automatické zálohové faktury
- [ ] Kontrola plateb od klientů

---

## 💰 Odhadované náklady (100 klientů)

| Služba | Měsíční náklady |
|--------|-----------------|
| Supabase (Pro) | $25 |
| Gemini API (OCR) | ~$30 (1000 dokladů) |
| OpenAI API (Chat) | ~$50 |
| Twilio (SMS) | ~$20 (200 SMS) |
| SendGrid (Email) | ~$15 (10k emailů) |
| Google Drive API | Zdarma (15 GB) |
| Vercel (Pro) | $20 |
| **Celkem** | **~$160/měsíc** |

---

## 🔐 Bezpečnost

- ✅ Row Level Security (RLS) v Supabase
- ✅ JWT tokens (Supabase Auth)
- ✅ API routes chráněné middleware
- ✅ Google Drive Service Account (ne OAuth)
- ✅ Environment variables (nikdy v kódu)
- ✅ HTTPS only (Vercel)

---

## 📚 Další dokumentace

- [Supabase Setup](./docs/SUPABASE_SETUP.md)
- [Pohoda Integration](./docs/POHODA_INTEGRATION.md)
- [Google Drive Setup](./docs/GOOGLE_DRIVE_SETUP.md)
- [WhatsApp Webhook](./docs/WHATSAPP_WEBHOOK.md)

---

## 👨‍💻 Autor

**Radim** - [radim@wikiporadce.cz](mailto:radim@wikiporadce.cz)

---

## 📄 License

Private - Proprietary Software
