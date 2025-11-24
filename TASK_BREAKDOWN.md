# 📋 TASK BREAKDOWN - Účetní OS

Kompletní rozdělení projektu na micro-úkoly s kontrolami. Odhadovaný čas: **16-17 hodin čistého coding time**.

**Status legend:**
- ⬜ Not started
- 🔄 In progress
- ✅ Done
- ⏭️ Skipped

---

## 📊 PROGRESS OVERVIEW

```
[===========>                        ] 20% (MODUL A DONE ✅)

Dokončeno: 1/12 modulů (MODUL A complete)
Čas strávený: 0.85h / ~17h
```

---

## ⚙️ MODUL A: ZÁKLADY + INFRASTRUKTURA

**Čas: ~50 min** | **Status: 🔄 In Progress**

### ✅ A1: Cleanup a příprava (15 min) - DONE
- [x] A1.1 Smazat `lib/firebase.ts`
- [x] A1.2 Smazat Firebase config soubory (`firestore.rules`, `storage.rules`, `firebase.json`)
- [x] A1.3 Odebrat `firebase` z `package.json`
- [x] A1.4 Přidat shadcn/ui komponenty první várka (`dropdown-menu`, `avatar`, `dialog`, `input`, `label`)
- [x] ✅ **KONTROLA:** `npm install` prošlo, dev server běží na `localhost:3000`

### ✅ A2: Supabase setup (20 min) - DONE
- [x] A2.1 Vytvořit `lib/supabase.ts` (client pro browser) - používá @supabase/ssr
- [x] A2.2 Vytvořit `lib/supabase-server.ts` (server pro API routes) - používá @supabase/ssr
- [x] A2.3 Přidat env variables do `.env.local` + npm install (@supabase/ssr, @supabase/supabase-js)
- [x] A2.4 Vytvořit Supabase projekt + spustit `schema.sql` v SQL Editor
- [x] A2.5 Setup kompletní (credentials vyplněny, schema spuštěno)
- [x] ✅ **KONTROLA:** Připojení k Supabase funguje, tabulky existují

**🔄 COMMIT + PUSH:** `git commit -m "MODUL A2 complete"`

### ✅ A3: Mock data (15 min) - DONE
- [x] A3.1 Vytvořit `lib/mock-data.ts`
- [x] A3.2 Mock `users` (2 uživatelé: 1 klient, 1 účetní)
- [x] A3.3 Mock `companies` (5 klientů)
- [x] A3.4 Mock `monthly_closures` (5 klientů × 12 měsíců = 60 záznamů)
- [x] A3.5 Mock `documents` (10 dokumentů jako ukázka)
- [x] ✅ **KONTROLA:** Mock data připravena pro UI testování v konzoli

**🔄 COMMIT + PUSH:** `git commit -m "Setup infrastructure and mock data"`

---

## 🔐 MODUL B: AUTENTIZACE

**Čas: ~70 min** | **Status: ⬜ Not Started**

### ⬜ B1: Auth pages UI (20 min)
- [ ] B1.1 Vytvořit `app/(auth)/layout.tsx` (simple layout bez sidebar)
- [ ] B1.2 Vytvořit `app/(auth)/login/page.tsx`
- [ ] B1.3 Vytvořit `app/(auth)/register/page.tsx`
- [ ] B1.4 Použít shadcn/ui (`Input`, `Button`, `Card`, `Label`)
- [ ] B1.5 Design: Použít gradient background z landing page
- [ ] ✅ **KONTROLA:** Stránky `/login` a `/register` se zobrazují, formuláře vypadají dobře

### ⬜ B2: Auth logika (30 min)
- [ ] B2.1 Vytvořit `app/(auth)/login/actions.ts` (Supabase Auth login)
- [ ] B2.2 Vytvořit `app/(auth)/register/actions.ts` (Supabase Auth signup)
- [ ] B2.3 Přidat error handling (toast notifications)
- [ ] B2.4 Test: Registrace nového usera (check Supabase Dashboard)
- [ ] B2.5 Test: Login s vytvořeným userem (check session cookie)
- [ ] ✅ **KONTROLA:** Registrace + Login funguje, session se ukládá do cookies

### ⬜ B3: Middleware (20 min)
- [ ] B3.1 Vytvořit `middleware.ts` v root (role-based routing)
- [ ] B3.2 Public routes: `/`, `/login`, `/register`
- [ ] B3.3 Protected routes: `/client/*` (role: client), `/accountant/*` (role: accountant)
- [ ] B3.4 Test redirect: Client → `/client/dashboard`
- [ ] B3.5 Test redirect: Accountant → `/accountant/dashboard`
- [ ] ✅ **KONTROLA:** Routy jsou chráněné, redirecty podle role fungují

**🔄 COMMIT + PUSH:** `git commit -m "Add authentication (Supabase Auth + middleware)"`

---

## 🔥 MODUL C: MASTER MATICE (Killer Feature!)

**Čas: ~110 min** | **Status: ⬜ Not Started**

### ⬜ C1: Layout pro účetní (15 min)
- [ ] C1.1 Vytvořit `app/(accountant)/layout.tsx`
- [ ] C1.2 Sidebar s navigací (Dashboard, Klienti, Úkoly, Nastavení)
- [ ] C1.3 User avatar + dropdown menu (Profil, Odhlásit se)
- [ ] C1.4 Responsive: Hamburger menu na mobilu
- [ ] ✅ **KONTROLA:** Layout se zobrazuje, navigace funguje

### ⬜ C2: Master Matice - UI s mock daty (45 min)
- [ ] C2.1 Vytvořit `app/(accountant)/dashboard/page.tsx`
- [ ] C2.2 Vytvořit `components/accountant/MasterMatrix.tsx`
- [ ] C2.3 Tabulka: řádky = klienti, sloupce = měsíce (leden-prosinec)
- [ ] C2.4 Barevné buňky podle statusu:
  - [ ] 🔴 `missing` → `bg-red-100 border-red-300`
  - [ ] 🟡 `uploaded` → `bg-yellow-100 border-yellow-300`
  - [ ] 🟢 `approved` → `bg-green-100 border-green-300`
- [ ] C2.5 Použít mock data (`lib/mock-data.ts`)
- [ ] C2.6 Legenda: Zobraz význam barev
- [ ] ✅ **KONTROLA:** Matice se zobrazuje (5 klientů × 12 měsíců), barvy fungují

### ⬜ C3: Master Matice - napojení na Supabase (30 min)
- [ ] C3.1 Vytvořit API route `/api/accountant/matrix/route.ts`
- [ ] C3.2 Fetch `companies` + jejich `monthly_closures` (JOIN query)
- [ ] C3.3 Ošetřit N+1 query problém (použít nested select)
- [ ] C3.4 Nahradit mock data reálnými z API
- [ ] C3.5 Test s dummy daty v Supabase (insert 5 companies + 60 closures)
- [ ] ✅ **KONTROLA:** Matice načítá data z DB, performance je OK (<500ms)

### ⬜ C4: Master Matice - interakce (20 min)
- [ ] C4.1 Klik na buňku → Redirect na detail `/accountant/klienti/[companyId]?period=2025-01`
- [ ] C4.2 Přidat tlačítko "Urgovat" na každém řádku
- [ ] C4.3 Zatím jen `console.log('Urgovat klienta X')` (funkčnost v modulu G)
- [ ] ✅ **KONTROLA:** Klik na buňku funguje, routing správný

**🔄 COMMIT + PUSH:** `git commit -m "Add Master Matrix (accountant dashboard)"`

---

## 👤 MODUL D: CLIENT DASHBOARD

**Čas: ~65 min** | **Status: ⬜ Not Started**

### ⬜ D1: Layout pro klienta (15 min)
- [ ] D1.1 Vytvořit `app/(client)/layout.tsx`
- [ ] D1.2 Sidebar s navigací (Dashboard, Doklady, Faktury, Přehled)
- [ ] D1.3 User avatar + dropdown (Profil, Odhlásit se)
- [ ] D1.4 Responsive: Hamburger menu
- [ ] ✅ **KONTROLA:** Layout se zobrazuje

### ⬜ D2: Měsíční checklist (30 min)
- [ ] D2.1 Vytvořit `app/(client)/dashboard/page.tsx`
- [ ] D2.2 Vytvořit `components/client/MonthlyChecklist.tsx`
- [ ] D2.3 Fetch vlastní `company` + `monthly_closures` (aktuální + 2 předchozí měsíce)
- [ ] D2.4 Zobrazit status každého podkladu:
  - [ ] Výpis z účtu
  - [ ] Výdajové faktury
  - [ ] Účtenky
  - [ ] Příjmové faktury
- [ ] D2.5 Barevné statusy (🔴🟡🟢)
- [ ] D2.6 Tlačítko "Nahrát" u každého typu
- [ ] ✅ **KONTROLA:** Checklist se zobrazuje s daty z DB

### ⬜ D3: Daňová kalkulačka (20 min)
- [ ] D3.1 Vytvořit `components/client/TaxSummary.tsx`
- [ ] D3.2 Použít existující `lib/tax-calculator.ts`
- [ ] D3.3 Zobrazit pro aktuální měsíc:
  - [ ] DPH k odvedení
  - [ ] Daň z příjmů (akruální)
  - [ ] Sociální pojištění
  - [ ] Zdravotní pojištění
- [ ] D3.4 Design: Card s gradienty
- [ ] ✅ **KONTROLA:** Kalkulačka počítá správně (manuální verify)

**🔄 COMMIT + PUSH:** `git commit -m "Add client dashboard"`

---

## 📤 MODUL E: UPLOAD + GOOGLE DRIVE

**Čas: ~90 min** | **Status: ⬜ Not Started**

### ⬜ E1: Google Drive setup (30 min)
- [ ] E1.1 Vytvořit Google Service Account (Google Cloud Console)
- [ ] E1.2 Povolit Google Drive API
- [ ] E1.3 Stáhnout JSON credentials
- [ ] E1.4 Přidat env variables: `GOOGLE_DRIVE_CLIENT_EMAIL`, `GOOGLE_DRIVE_PRIVATE_KEY`
- [ ] E1.5 Vytvořit `lib/google-drive.ts`
- [ ] E1.6 Funkce `uploadToGoogleDrive(file, companyId, period)`
- [ ] E1.7 Test upload: Nahrát jednoduchý `.txt` soubor
- [ ] ✅ **KONTROLA:** Soubor se objeví na Google Drive v správné složce

### ⬜ E2: Upload komponenta (45 min)
- [ ] E2.1 Vytvořit `components/client/DocumentUpload.tsx`
- [ ] E2.2 Přidat `react-dropzone` (drag & drop)
- [ ] E2.3 Validace: Max 10 MB, pouze PDF/obrázky
- [ ] E2.4 Vytvořit API route `/api/documents/upload/route.ts`
- [ ] E2.5 Flow:
  - [ ] Upload na Google Drive
  - [ ] Uložit metadata do `documents` table (file_name, google_drive_file_id, atd.)
- [ ] E2.6 Loading state + progress bar
- [ ] E2.7 Success toast po uploadu
- [ ] ✅ **KONTROLA:** Upload funguje end-to-end (soubor na Drive + záznam v DB)

### ⬜ E3: Aktualizace monthly_closures (15 min)
- [ ] E3.1 Po uploadu aktualizuj status v `monthly_closures`
- [ ] E3.2 Logika: Pokud type = 'receipt' → `receipts_status = 'uploaded'`
- [ ] E3.3 Test: Nahraju účtenku → status se změní v dashboardu
- [ ] ✅ **KONTROLA:** Status se aktualizuje v DB i v UI (refresh stránky)

**🔄 COMMIT + PUSH:** `git commit -m "Add document upload (Google Drive)"`

---

## 🤖 MODUL F: OCR INTEGRACE

**Čas: ~65 min** | **Status: ⬜ Not Started**

### ⬜ F1: Gemini setup (20 min)
- [ ] F1.1 Získat `GEMINI_API_KEY` (Google AI Studio)
- [ ] F1.2 Přidat do `.env.local`
- [ ] F1.3 Nainstalovat `@google/generative-ai`
- [ ] F1.4 Vytvořit `lib/ocr.ts`
- [ ] F1.5 Funkce `extractReceiptData(imageBase64)`
- [ ] F1.6 Prompt: Extrahuj datum, částku, dodavatele, položky
- [ ] F1.7 Test OCR s ukázkovou účtenkou (např. JPEG z netu)
- [ ] ✅ **KONTROLA:** OCR vrací JSON s extrahovanými daty

### ⬜ F2: OCR API route (30 min)
- [ ] F2.1 Vytvořit `/api/ocr/route.ts`
- [ ] F2.2 Flow:
  - [ ] Přijmout `documentId` z requestu
  - [ ] Načíst dokument z DB (získat `google_drive_file_id`)
  - [ ] Stáhnout soubor z Google Drive
  - [ ] Konverze na base64
  - [ ] Volání Gemini API (`lib/ocr.ts`)
  - [ ] Uložit `ocr_data` do `documents` table
- [ ] F2.3 Error handling (OCR selhalo → uložit null)
- [ ] ✅ **KONTROLA:** OCR funguje end-to-end (účtenka → JSON v DB)

### ⬜ F3: Napojení na upload flow (15 min)
- [ ] F3.1 Po uploadu automaticky volat `/api/ocr` (background job)
- [ ] F3.2 Vytvořit `components/client/DocumentDetail.tsx`
- [ ] F3.3 Zobrazit OCR výsledky:
  - [ ] Datum
  - [ ] Částka
  - [ ] Dodavatel
  - [ ] Položky
- [ ] F3.4 Možnost editace (pokud OCR udělalo chybu)
- [ ] ✅ **KONTROLA:** Upload → OCR → zobrazení dat (full flow)

**🔄 COMMIT + PUSH:** `git commit -m "Add OCR integration (Gemini 2.5 Flash)"`

---

## 📧 MODUL G: URGOVÁNÍ (SMS/Email)

**Čas: ~85 min** | **Status: ⬜ Not Started**

### ⬜ G1: Twilio setup (20 min)
- [ ] G1.1 Vytvořit Twilio účet (trial verze OK)
- [ ] G1.2 Získat credentials: `ACCOUNT_SID`, `AUTH_TOKEN`, `PHONE_NUMBER`
- [ ] G1.3 Přidat do `.env.local`
- [ ] G1.4 Nainstalovat `twilio` package
- [ ] G1.5 Vytvořit `lib/twilio.ts`
- [ ] G1.6 Test SMS: Poslat testovací SMS na vlastní číslo
- [ ] ✅ **KONTROLA:** SMS přijde na telefon

### ⬜ G2: SendGrid setup (20 min)
- [ ] G2.1 Vytvořit SendGrid účet (free tier OK)
- [ ] G2.2 Získat `SENDGRID_API_KEY`
- [ ] G2.3 Přidat do `.env.local`
- [ ] G2.4 Nainstalovat `@sendgrid/mail`
- [ ] G2.5 Vytvořit `lib/sendgrid.ts`
- [ ] G2.6 Test email: Poslat testovací email na vlastní schránku
- [ ] ✅ **KONTROLA:** Email přijde do schránky

### ⬜ G3: Reminder API (30 min)
- [ ] G3.1 Vytvořit `/api/reminders/send/route.ts`
- [ ] G3.2 Přijmout: `companyId`, `period`, `type` ('sms' | 'email')
- [ ] G3.3 Logika:
  - [ ] Fetch company + closure z DB
  - [ ] Zjistit co chybí (missing statusy)
  - [ ] Generovat zprávu (template)
  - [ ] Odeslat SMS nebo Email
  - [ ] Uložit do `reminders` table
  - [ ] Update `monthly_closures` (reminder_count++, last_reminder_sent_at)
- [ ] G3.4 Test: Poslat reminder → check DB + SMS/Email
- [ ] ✅ **KONTROLA:** Urgování funguje (SMS/Email + záznam v DB)

### ⬜ G4: UI tlačítko "Urgovat" (15 min)
- [ ] G4.1 Přidat tlačítko "Urgovat" do Master Matice (každý řádek)
- [ ] G4.2 Vytvořit `components/accountant/ReminderDialog.tsx`
- [ ] G4.3 Modal s:
  - [ ] Náhled zprávy
  - [ ] Výběr typu (SMS / Email / Obojí)
  - [ ] Tlačítko "Odeslat"
- [ ] G4.4 Volání `/api/reminders/send`
- [ ] G4.5 Toast notification po odeslání
- [ ] ✅ **KONTROLA:** Tlačítko funguje, urgování se odešle

**🔄 COMMIT + PUSH:** `git commit -m "Add reminder system (SMS/Email)"`

---

## 📋 MODUL H: POHODA INTEGRACE

**Čas: ~90 min** | **Status: ⬜ Not Started**

### ⬜ H1: Pohoda XML generator (45 min)
- [ ] H1.1 Vytvořit `lib/pohoda-xml.ts`
- [ ] H1.2 Funkce `generateInvoiceXML(invoice, company)`
- [ ] H1.3 XML struktura podle Pohoda mXML 2.0 schema
- [ ] H1.4 Zahrnout:
  - [ ] Hlavička (číslo faktury, datum, splatnost)
  - [ ] Partner (IČO, DIČ, adresa)
  - [ ] Položky (popis, množství, cena, DPH)
  - [ ] Suma (bez DPH, DPH, celkem)
- [ ] H1.5 Test XML validace (online Pohoda validator)
- [ ] ✅ **KONTROLA:** XML se generuje správně a je validní

### ⬜ H2: Fakturace UI (45 min)
- [ ] H2.1 Vytvořit `app/(client)/faktury/page.tsx` (seznam faktur)
- [ ] H2.2 Vytvořit `app/(client)/faktury/nova/page.tsx`
- [ ] H2.3 Vytvořit `components/client/InvoiceForm.tsx`
- [ ] H2.4 Formulář:
  - [ ] Odběratel (input s autocomplete - zatím manual)
  - [ ] Položky (add/remove rows)
  - [ ] Auto-kalkulace (suma bez DPH, DPH, celkem)
  - [ ] Datum vystavení + splatnost
- [ ] H2.5 Preview faktury (Card s náhledem)
- [ ] H2.6 Uložit do `invoices` table
- [ ] H2.7 Tlačítko "Export do Pohoda" → download XML
- [ ] ✅ **KONTROLA:** Faktura se vytvoří + XML se stáhne

**🔄 COMMIT + PUSH:** `git commit -m "Add Pohoda integration (invoicing)"`

---

## 💬 MODUL I: WHATSAPP WEBHOOK

**Čas: ~60 min** | **Status: ⬜ Not Started**

### ⬜ I1: WhatsApp setup (30 min)
- [ ] I1.1 Vytvořit WhatsApp Business API účet (Meta for Developers)
- [ ] I1.2 Získat `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_TOKEN`, `VERIFY_TOKEN`
- [ ] I1.3 Přidat do `.env.local`
- [ ] I1.4 Vytvořit `/api/webhooks/whatsapp/route.ts`
- [ ] I1.5 GET endpoint pro verify token (WhatsApp verification)
- [ ] I1.6 POST endpoint pro příjem zpráv
- [ ] I1.7 Deploy na Vercel (webhook musí být veřejně dostupný)
- [ ] I1.8 Nastavit webhook URL v Meta for Developers
- [ ] I1.9 Test: Poslat testovací zprávu → check konzole
- [ ] ✅ **KONTROLA:** Webhook přijímá zprávy

### ⬜ I2: AI extrakce intentu + task creation (30 min)
- [ ] I2.1 Vytvořit `lib/whatsapp-intent.ts`
- [ ] I2.2 Funkce `extractIntent(text)` (Gemini API)
- [ ] I2.3 Prompt: Zjisti prioritu, typ úkolu, krátký title
- [ ] I2.4 V webhook POST:
  - [ ] Uložit zprávu do `whatsapp_messages` table
  - [ ] Identifikovat klienta (phone_number → company)
  - [ ] Volat `extractIntent()`
  - [ ] Vytvořit task v `tasks` table
  - [ ] Notifikace účetní (email? - použít SendGrid z modulu G)
- [ ] I2.5 Test: Pošlu "Potřebuju fakturu" → vytvoří se task
- [ ] ✅ **KONTROLA:** WhatsApp zpráva → task v DB + notifikace

**🔄 COMMIT + PUSH:** `git commit -m "Add WhatsApp webhook integration"`

---

## ✅ MODUL J: ÚKOLOVÝ SYSTÉM

**Čas: ~105 min** | **Status: ⬜ Not Started**

### ⬜ J1: Tasks UI (45 min)
- [ ] J1.1 Vytvořit `app/(accountant)/ukoly/page.tsx`
- [ ] J1.2 Vytvořit `components/accountant/TaskList.tsx`
- [ ] J1.3 Fetch `tasks` z DB (seřadit podle priority + created_at)
- [ ] J1.4 Tabulka s:
  - [ ] Title
  - [ ] Company name
  - [ ] Priority (badge: urgent=red, high=orange, medium=yellow, low=gray)
  - [ ] Status (open, in_progress, done)
  - [ ] Source (whatsapp, manual, chat, ai_generated)
  - [ ] Created at
- [ ] J1.5 Filtry: Status, Priority, Company
- [ ] J1.6 Klik na task → Detail (modal nebo sidebar)
- [ ] ✅ **KONTROLA:** Úkoly se zobrazují, filtry fungují

### ⬜ J2: Task detail + akce (20 min)
- [ ] J2.1 Vytvořit `components/accountant/TaskDetail.tsx`
- [ ] J2.2 Zobrazit:
  - [ ] Celý popis
  - [ ] Company info
  - [ ] Assigned to (účetní)
  - [ ] WhatsApp zpráva (pokud source = whatsapp)
- [ ] J2.3 Akce:
  - [ ] Změnit status (dropdown)
  - [ ] Změnit prioritu
  - [ ] Smazat task
- [ ] J2.4 Update task přes API route `/api/tasks/[id]/route.ts`
- [ ] ✅ **KONTROLA:** Detail funguje, změny se ukládají do DB

### ⬜ J3: Chat k úkolu (40 min)
- [ ] J3.1 Vytvořit `components/shared/TaskChat.tsx`
- [ ] J3.2 Fetch `chat_messages` pro daný task
- [ ] J3.3 Zobrazit zprávy (timeline - účetní vlevo, klient vpravo)
- [ ] J3.4 Input + tlačítko "Odeslat"
- [ ] J3.5 Vytvořit API route `/api/chats/[chatId]/messages/route.ts`
- [ ] J3.6 POST: Uložit novou zprávu do DB
- [ ] J3.7 Real-time? (zatím skip - použít SWR s polling nebo manual refresh)
- [ ] ✅ **KONTROLA:** Chat funguje, zprávy se ukládají a zobrazují

**🔄 COMMIT + PUSH:** `git commit -m "Add task management system + chat"`

---

## 🧪 MODUL K: TESTING & POLISH

**Čas: ~135 min** | **Status: ⬜ Not Started**

### ⬜ K1: E2E testing (60 min)
- [ ] K1.1 **Test flow 1: Registrace → Login**
  - [ ] Registrovat nového usera (client)
  - [ ] Odhlásit se
  - [ ] Přihlásit se zpět
  - [ ] Check: Redirect na `/client/dashboard`
- [ ] K1.2 **Test flow 2: Upload dokladu**
  - [ ] Jako client nahrát účtenku
  - [ ] Check: Soubor na Google Drive
  - [ ] Check: Záznam v DB (`documents`)
  - [ ] Check: OCR proběhlo (check `ocr_data`)
  - [ ] Check: Status se změnil na 'uploaded' (`monthly_closures`)
- [ ] K1.3 **Test flow 3: Urgování**
  - [ ] Jako accountant otevřít Master Matici
  - [ ] Kliknout "Urgovat" na klientovi s missing statusy
  - [ ] Odeslat SMS/Email
  - [ ] Check: Reminder v DB (`reminders`)
  - [ ] Check: SMS/Email dorazil
- [ ] K1.4 **Test flow 4: Master Matice**
  - [ ] Jako accountant otevřít dashboard
  - [ ] Check: Všichni klienti se zobrazují
  - [ ] Check: Barvy buněk odpovídají statusům
  - [ ] Kliknout na buňku
  - [ ] Check: Redirect na detail klienta
- [ ] K1.5 **Test flow 5: Fakturace**
  - [ ] Jako client vytvořit novou fakturu
  - [ ] Vyplnit položky
  - [ ] Export do Pohoda (stáhnout XML)
  - [ ] Check: XML je validní
- [ ] ✅ **KONTROLA:** Všechny hlavní flow fungují bez errorů

### ⬜ K2: Mobile responsiveness (45 min)
- [ ] K2.1 Test na mobilu: Login/Register pages
- [ ] K2.2 Test na mobilu: Client dashboard (checklist musí být čitelný)
- [ ] K2.3 Test na mobilu: Upload komponenta (fotit účtenky přes <input type="file" capture="camera">)
- [ ] K2.4 Master Matice na mobilu:
  - [ ] Desktop: Tabulka (horizontální scroll OK)
  - [ ] Mobile: Dropdown select klienta + karty měsíců (vertikální)
- [ ] K2.5 Test na mobilu: Navigace (hamburger menu)
- [ ] ✅ **KONTROLA:** Vše funguje na mobilu (iPhone/Android)

### ⬜ K3: Error handling & UX polish (30 min)
- [ ] K3.1 Přidat Error boundaries (`app/error.tsx`, `app/global-error.tsx`)
- [ ] K3.2 Toast notifications (shadcn/ui `toast`, `sonner`)
- [ ] K3.3 Loading states:
  - [ ] Skeleton loaders (Master Matice, Task List)
  - [ ] Upload progress bar
  - [ ] Button loading states (spinner)
- [ ] K3.4 Error messages (user-friendly, ne tech jargon)
- [ ] K3.5 Empty states (žádné doklady, žádné úkoly)
- [ ] ✅ **KONTROLA:** Errory se zobrazují uživatelsky, loading states fungují

**🔄 COMMIT + PUSH:** `git commit -m "Add testing and polish (mobile + errors)"`

---

## 🚀 MODUL L: DEPLOYMENT

**Čas: ~75 min** | **Status: ⬜ Not Started**

### ⬜ L1: Vercel deployment (30 min)
- [ ] L1.1 Push projekt na GitHub (zkontrolovat že je všechno committed)
- [ ] L1.2 Připojit repo na Vercel (vercel.com → New Project)
- [ ] L1.3 Přidat **všechny** environment variables:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `GEMINI_API_KEY`
  - [ ] `GOOGLE_DRIVE_CLIENT_EMAIL`
  - [ ] `GOOGLE_DRIVE_PRIVATE_KEY`
  - [ ] `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
  - [ ] `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`
  - [ ] `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `VERIFY_TOKEN`
- [ ] L1.4 Deploy (první build)
- [ ] L1.5 Check build logs (no errors)
- [ ] L1.6 Test: Otevřít production URL
- [ ] ✅ **KONTROLA:** Aplikace běží na Vercelu, homepage se načte

### ⬜ L2: Production testing (45 min)
- [ ] L2.1 Test: Registrace + Login v produkci
- [ ] L2.2 Test: Upload dokladu (check Google Drive)
- [ ] L2.3 Test: OCR v produkci (check Gemini API limity)
- [ ] L2.4 Test: Odeslat SMS (check Twilio balance)
- [ ] L2.5 Test: Odeslat Email (check SendGrid)
- [ ] L2.6 Test: WhatsApp webhook (update URL v Meta for Developers)
- [ ] L2.7 Performance audit:
  - [ ] Lighthouse score (target: 90+ Performance)
  - [ ] Master Matice load time (<1s)
  - [ ] Upload time (<5s pro 2 MB soubor)
- [ ] L2.8 Check error tracking (Vercel logs, Sentry?)
- [ ] ✅ **KONTROLA:** Všechny integrace fungují v produkci, performance je OK

**🔄 COMMIT + PUSH:** `git commit -m "Production deployment and final testing"`

---

## 🎉 PROJEKT HOTOVÝ!

```
[====================================] 100%

Dokončeno: 12/12 modulů
Čas strávený: ~17h
```

---

## 📝 POZNÁMKY

### Po každém modulu:
1. Commit + push na GitHub
2. Update tohoto souboru (zaškrtni checkboxy)
3. Konzultace: Pokračovat nebo upravit?

### Důležité:
- **Mock data nejdřív**, pak real DB → vždy vidíš výsledek
- **Kontroly po každém kroku** → catch bugs early
- **Malé commity** → easy rollback
- **Test v produkci** postupně (ne všechno najednou)

### Odkazy:
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Systémová architektura
- [EXPERT_REVIEW.md](./EXPERT_REVIEW.md) - Expert review nálezy
- [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) - Frontend-first plán
- [supabase/schema.sql](./supabase/schema.sql) - DB schema

---

**Last updated:** 2025-01-24
**Current module:** MODUL A (In Progress)
