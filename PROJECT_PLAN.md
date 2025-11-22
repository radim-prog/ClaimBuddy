# 📋 Účetní OS - Projektový plán

Kompletní roadmap implementace podle původního zadání.

---

## 🎯 Cíle projektu

Vytvořit webovou aplikaci která:
1. **Nahrazuje** Notion, Slack, Raynet a iDoklad v jednom systému
2. **Automatizuje** urgování klientů (SMS/Email)
3. **Páruje** doklady (OCR + AI)
4. **Zobrazuje "červená čísla"** - motivace klientů k dodání podkladů
5. **Integruje** WhatsApp, Pohoda, Google Drive

---

## 📅 Milestone Timeline

### **M1: Infrastructure & Auth** (Týden 1) - ✅ HOTOVO
- [x] Next.js setup
- [x] Supabase schema
- [x] Database migrations
- [x] TypeScript typy
- [x] Základní UI komponenty
- [ ] Autentizace (login/register)
- [ ] Role-based middleware

### **M2: Client Dashboard** (Týden 2-3)
- [ ] Klientský layout + sidebar
- [ ] Měsíční checklist podkladů (vlastní firmy)
- [ ] Upload komponenta (Google Drive integration)
- [ ] OCR integrace (Gemini API)
- [ ] Jednoduchá daňová kalkulačka (lib/tax-calculator.ts)
- [ ] Finanční přehled (grafy - recharts)

### **M3: Accountant Dashboard** (Týden 4-5)
- [ ] Účetní layout + sidebar
- [ ] **KILLER FEATURE:** Master matice (všichni klienti × 12 měsíců)
  - Barvy: 🔴 chybí, 🟡 nahrané, 🟢 zpracováno
  - Tlačítko "Urgovat" na každém řádku
- [ ] Detail klienta (stejný checklist jako vidí klient)
- [ ] Urgovací systém (Twilio SMS + SendGrid Email)
- [ ] Párování plateb (výpisy × faktury)

### **M4: Integrace - Pohoda** (Týden 6)
- [ ] Pohoda XML export (vydané faktury)
- [ ] Pohoda XML import (klienti, položky)
- [ ] UI pro vystavování faktur (prefill z Pohody)
- [ ] Kontrola plateb od klientů

### **M5: Úkolový systém** (Týden 7)
- [ ] Tabulka tasks (existuje v DB)
- [ ] UI pro seznam úkolů (pro účetní)
- [ ] Chat ke každému úkolu
- [ ] Zobrazení úkolů v klientském dashboardu

### **M6: AI & WhatsApp** (Týden 8+)
- [ ] WhatsApp Business API webhook
- [ ] AI extrakce intentu z WhatsApp zprávy
- [ ] Automatické vytvoření úkolu z WhatsApp
- [ ] AI chat asistent (OpenAI GPT-4o)
  - Přístup k historickým datům klienta
  - Generování faktur hlasem

### **M7: Polish & Deployment** (Týden 9+)
- [ ] Mobile responsiveness (fotit účtenky)
- [ ] Notifikace (push, email, SMS)
- [ ] Advanced reporting
- [ ] Vercel deployment
- [ ] Production testing

---

## 🔑 Klíčové komponenty (Priority P0)

### **1. Master Dashboard Matice** (PRO HOLKY)
```
Komponenta: components/accountant/MasterMatrix.tsx
Popis: Tabulka všech klientů × 12 měsíců
Data: monthly_closures (group by company_id)
Barvy:
  - 🔴 missing (bank_statement_status = 'missing')
  - 🟡 uploaded
  - 🟢 approved
Actions:
  - Klik na buňku → Detail měsíce
  - Tlačítko "Urgovat" → SMS/Email
```

### **2. Upload s OCR** (PRO KLIENTY)
```
Komponenta: components/client/DocumentUpload.tsx
Flow:
  1. Dropzone (react-dropzone)
  2. Komprese obrázku (< 1 MB pro Gemini)
  3. Upload na Google Drive (Service Account)
  4. Volání /api/ocr (Gemini 2.5 Flash)
  5. Uložení do documents table
  6. Aktualizace monthly_closures.receipts_status = 'uploaded'
```

### **3. Daňová kalkulačka** (ČERVENÁ ČÍSLA)
```
Funkce: lib/tax-calculator.ts → calculateMissingDocumentPenalty()
UI: components/client/TaxImpactWarning.tsx
Zobrazení:
  "⚠️ Pokud nedoložíš tuto účtenku (5 000 Kč), ztratíš na daních 1 050 Kč!"
Výpočet:
  - DPH: 5000 * 21% = 1050 (pokud plátce DPH)
  - DPFO: 5000 * 15% = 750
  - Celkem: 1800 Kč ztráta
```

### **4. Fakturace přes Pohoda**
```
API route: /api/pohoda/export
Generuje: mXML pro Pohoda mServer
UI: components/client/InvoiceForm.tsx
Prefill:
  - Klienti z Pohody (načteno přes API)
  - Položky z Pohody (standardní služby)
  - AI prompt: "Vyfakturuj Karlovi stejnou fakturu jako minulý měsíc + přidej 3 šroubky"
```

### **5. WhatsApp → Úkoly**
```
Webhook: /api/webhooks/whatsapp
Flow:
  1. Příjem zprávy z WhatsApp
  2. Identifikace klienta (phone_number → company)
  3. AI extrakce intentu (Gemini: "urgentní úkol", "dotaz na fakturu")
  4. Vytvoření task v DB
  5. Notifikace účetní (push/email)
```

---

## 📊 Datový model (Klíčové tabulky)

### **monthly_closures** - MASTER TABLE
```sql
company_id + period (UNIQUE)
Statusy:
  - bank_statement_status: missing | uploaded | approved
  - expense_invoices_status
  - receipts_status
  - income_invoices_status
Finanční data:
  - vat_payable (vypočítané DPH)
  - income_tax_accrued (akruální DPFO/DPPO)
Urgence:
  - reminder_count
  - last_reminder_sent_at
```

### **documents** - Všechny doklady
```sql
type: bank_statement | receipt | expense_invoice | contract
ocr_data: JSONB (výstup z Gemini)
google_drive_file_id: string (link na Drive)
```

### **invoices** - Vydané i přijaté faktury
```sql
type: income | expense
pohoda_id: string (párování s Pohoda)
generated_by_ai: boolean
ai_prompt: string ("Vyfakturuj Karlovi...")
```

### **tasks** - Úkolový systém
```sql
source: manual | whatsapp | chat | ai_generated
whatsapp_message_id: string (link na WhatsApp zprávu)
```

---

## 🚀 Quick Start pro Development

### **1. Setup lokální prostředí**
```bash
git clone https://github.com/radim-prog/UcetniWebApp.git
cd UcetniWebApp
npm install
cp .env.local.example .env.local
# Vyplnit Supabase credentials
npm run dev
```

### **2. Supabase migrace**
```bash
# V Supabase Dashboard:
1. SQL Editor → New Query
2. Copy-paste z supabase/migrations/20250101000000_initial_schema.sql
3. Run
```

### **3. Dummy data (pro testování)**
```sql
-- Vytvoř testovacího klienta
INSERT INTO public.companies (owner_id, assigned_accountant_id, name, ico, ...)
VALUES (...);

-- Vytvoř měsíční uzávěrky (leden-prosinec 2025)
INSERT INTO public.monthly_closures (company_id, period, status, ...)
VALUES
  ('company-id', '2025-01', 'open', 'missing', ...),
  ('company-id', '2025-02', 'open', 'missing', ...),
  ...
```

---

## 💡 AI Workflow (Jak to celé dát dohromady)

### **Rozdělení práce mezi AI:**

| AI nástroj | Role | Kdy použít |
|------------|------|------------|
| **Claude Code** | DevOps, Code review, Refactoring | Strukturovat projekt, vytvořit Issues, merge kód |
| **Google Antigravity** | Hlavní vývojář | Psát React komponenty, API routes |
| **AI Studio (Gemini)** | Architekt logiky | Navrhovat algoritmy, daňové výpočty |
| **Perplexity** | Právní/Daňový expert | Zjišťovat sazby DPH/DPFO, Pohoda API specs |

### **Příklad workflow pro Milestone 2:**

1. **Claude Code:** Vytvoř Issue "M2.1: Client Dashboard Layout"
2. **Antigravity:** Implementuj `app/(client)/dashboard/page.tsx`
3. **AI Studio:** Navrhni algoritmus pro párování výpisů × faktury
4. **Antigravity:** Implementuj `lib/payment-matching.ts`
5. **Claude Code:** Code review, merge do main

---

## 📝 Poznámky z původního zadání

### **Klíčové požadavky:**
- ✅ "Matice klient × měsíc" → `monthly_closures` table
- ✅ "Červená čísla" → `calculateMissingDocumentPenalty()`
- ✅ "WhatsApp integrace" → `whatsapp_messages` table
- ✅ "Párování plateb" → `payment_matches` table
- ✅ "AI chat s historií" → `chat_messages` table
- ✅ "Náhrada Notion/Slack" → `tasks` table

### **Prioritizace:**
1. **P0 (MUST-HAVE):** Matice, Upload, Daňová kalkulačka
2. **P1 (HIGH):** Urgování, Pohoda integrace
3. **P2 (MEDIUM):** WhatsApp, AI chat
4. **P3 (LOW):** Pokročilé reporty, Multi-firma

---

## 🎨 Design Principles

### **Pro klienty:**
- **Mobile-first** (fotit účtenky na mobil)
- **Červená čísla** (psychologický efekt - motivace)
- **Jednoduchost** (babička to musí ovládat)

### **Pro účetní:**
- **Efektivita** (minimize clicks)
- **Batch operace** (urgovat 10 klientů najednou)
- **Přehlednost** (matice musí být čitelná na první pohled)

---

## 📈 Success Metrics

- [ ] Klient vidí stav podkladů do 3 sekund od otevření app
- [ ] Upload účtenky + OCR < 30 sekund
- [ ] Urgování klienta < 2 kliky
- [ ] Vystavení faktury < 60 sekund (když je prefill z Pohody)
- [ ] WhatsApp zpráva → úkol < 10 sekund

---

**Last updated:** 2025-01-22
**Next review:** Po dokončení M1
