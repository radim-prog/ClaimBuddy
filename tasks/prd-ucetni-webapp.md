# PRD: UcetniWebApp — Účetní portál a klientský portál

## Introduction

UcetniWebApp je webová aplikace pro účetní firmy a jejich klienty (podnikatele/živnostníky). Aplikace má dva portály — účetnický (pro tým účetní firmy) a klientský (pro firmy/živnostníky). Cílem je digitalizace komunikace, sdílení dokladů, správa úkolů a fakturace mezi účetním a klientem.

**Aktuální stav:** Všech 15 modulů je plně funkčních. Aplikace je nasazena na Railway (Docker).

**Strategický cíl:** Monetizace aplikace přes tarifní systém (Stripe) s free tierem a placenými rozšířeními pro oba portály.

---

## Goals

### G-1: Dokumentace současného stavu
Zdokumentovat všech 15 existujících modulů, jejich funkčnost a vzájemné vazby.

### G-2: Monetizační model
Implementovat tarifní systém pro účetní (3 tarify: Základní/Střední/Profi) a klienty (Free + placené pluginy). Stripe integrace již existuje — rozšířit na nový tarifní model.

### G-3: Feature gating
Omezit funkčnost dle tarifu/pluginu. Existující `plan-gate.ts` rozšířit na nový tarifní model.

### G-4: Landing page
Vytvořit prodejní stránku s vysvětlením tarifů a funkcí.

### G-5: Code quality
Vyčistit duplicity, dead code, konsolidovat utility funkce, opravit identifikované bugy.

---

## User Stories

### US-001: Registrace a onboarding účetního
**Jako** nový účetní **chci** se zaregistrovat a vytvořit profil firmy **abych** mohl začít spravovat klienty.

**Acceptance Criteria:**
- [ ] Registrace vytváří uživatele s rolí `accountant` přes custom JWT systém (NE Supabase Auth)
- [ ] Po registraci proběhne onboarding wizard (základní údaje firmy, IČO, kontakt)
- [ ] Uživatel dostane 30denní Professional trial (reverse trial)
- [ ] Po trialu přechod na tarif Základní (free)

### US-002: Registrace klienta
**Jako** podnikatel/živnostník **chci** se zaregistrovat **abych** mohl nahrávat doklady a komunikovat s účetním.

**Acceptance Criteria:**
- [ ] Registrace přes custom JWT systém (opravit stávající Supabase Auth flow)
- [ ] Klient je přiřazen k účetní firmě (přes pozvánku nebo kód)
- [ ] Free tier: faktury, cestovní deník, zprávy
- [ ] Přístup k placeným pluginům po upgradu

### US-003: Dashboard účetního — Master Matice
**Jako** účetní **chci** vidět přehled všech klientů a stavu jejich měsíčních uzávěrek **abych** věděl co je potřeba řešit.

**Acceptance Criteria:**
- [ ] Matice: klienti × měsíce, barevné buňky (červená/žlutá/zelená/šedá)
- [ ] 3 indikátory per buňka (výpis z banky, nákladové doklady, příjmové faktury)
- [ ] Klik na buňku otevře detail uzávěrky
- [ ] 4 záložky: Uzávěrky, Platby, DPH, Daň z příjmu
- [ ] Export matice do CSV
- [ ] Skupiny firem s aggregate statusem

### US-004: Dashboard klienta — Action Hub
**Jako** klient **chci** mít na dashboardu rychlé akce **abych** mohl okamžitě nahrát doklad, vystavit fakturu nebo přidat jízdu.

**Acceptance Criteria:**
- [ ] 5 action tlačítek: Nahrát doklad, Faktura, Jízda, Zprávy, Nahrát výpis
- [ ] Přehled roku (12 buněk — red/yellow/green/gray)
- [ ] Widget: nepotvrzené drafty, aktivní spisy, daňový dopad, zprávy, termíny
- [ ] Kontakt na účetní

### US-005: Vytěžování dokladů (OCR)
**Jako** účetní **chci** automaticky vytěžovat data z nahraných dokladů **abych** nemusel přepisovat údaje ručně.

**Acceptance Criteria:**
- [ ] 3-krokový pipeline: OCR → AI extrakce → AI verifikace
- [ ] Multi-provider: OpenAI, Anthropic, Gemini (konfigurovatelné)
- [ ] Verify stránka: split view (náhled + editovatelná pole)
- [ ] ConfidenceBadge pro každé pole
- [ ] Předkontace (debit/credit účty)
- [ ] Export do Pohoda XML
- [ ] Batch zpracování pro vybrané firmy
- [ ] Queue manager (max 5 souběžných, 60s timeout)
- [ ] Kreditový systém dle tarifu

### US-006: Faktury — B2B (účetní fakturuje klientům)
**Jako** účetní **chci** fakturovat klientům za účetní služby **abych** měl přehled o tržbách.

**Acceptance Criteria:**
- [ ] CRUD faktur (list, create, detail)
- [ ] Generování PDF
- [ ] Odeslání emailem
- [ ] Export XLSX/CSV
- [ ] Šablony faktur
- [ ] Export do Pohoda XML
- [ ] Automatické číslování (číselné řady)

### US-007: Faktury — Klientské (podnikatel fakturuje zákazníkům)
**Jako** klient **chci** vystavovat faktury svým zákazníkům přímo v aplikaci.

**Acceptance Criteria:**
- [ ] Typy: faktura, proforma (zálohová), dobropis
- [ ] Statusy: draft → sent → paid (+ overdue)
- [ ] Konverze: proforma → faktura, faktura → dobropis
- [ ] PDF generování a odeslání emailem
- [ ] QR platební kód
- [ ] Oblíbené položky
- [ ] Statistiky

### US-008: Cestovní deník (Kniha jízd)
**Jako** klient **chci** evidovat služební jízdy **abych** měl podklady pro daňové odpočty.

**Acceptance Criteria:**
- [ ] CRUD jízd (datum, trasa, účel, typ, vzdálenost, tachometr)
- [ ] Automatický výpočet náhrady (sazba + PHM dle vyhlášky)
- [ ] CRUD vozidel (SPZ, palivo, spotřeba, FuelGauge)
- [ ] Záznam tankování
- [ ] Oblíbená místa s auto-save
- [ ] Export CSV (měsíční + roční)
- [ ] Účetní: read-only pohled + CSV export
- [ ] Alert: vozidla existují ale žádné jízdy v měsíci

### US-009: Cestovní deník PRO — AI Randomizér
**Jako** klient **chci** automaticky generovat věrohodný cestovní deník na základě dokladů **abych** ušetřil čas a peníze.

**Acceptance Criteria:**
- [ ] Z vytěžených dokladů (tankování) přiřadit k vozidlu
- [ ] AI generátor: věrohodné cesty na základě dokladů a tankování
- [ ] Kontrola konzistence: litry × km × nájezd
- [ ] Vyřazení nevhodných dokladů (vrácení DPH nároku)
- [ ] Sestavení zpětně (rok, dva)
- [ ] Speciální zpoplatnění (per km, NE součást tarifu)
- [ ] UX: ukázat pravděpodobnou cenu předem

### US-010: Adresář partnerů
**Jako** klient **chci** spravovat seznam obchodních partnerů **abych** je mohl snadno používat při fakturaci.

**Acceptance Criteria:**
- [ ] CRUD partnerů (název, IČO, DIČ, adresa, kontakt, bankovní účet)
- [ ] ARES lookup — auto-fill dle IČO
- [ ] usage_count badge (3x+ použití)
- [ ] Vyhledávání
- [ ] Integrace s fakturačním formulářem

### US-011: GTD úkoly a projekty
**Jako** účetní **chci** spravovat úkoly metodikou GTD **abych** měl přehled o práci a prioritách.

**Acceptance Criteria:**
- [ ] Priority swimlanes (high/medium/low)
- [ ] R-Tasks skórování (5 dimenzí → automatická priorita)
- [ ] CRUD úkolů + checklist + komentáře + přílohy
- [ ] Projekty s fázemi a timeline
- [ ] Drag-and-drop přeřazení
- [ ] Gamifikace (confetti, progress ring)
- [ ] GTD inbox zpracování (clarify)
- [ ] Time tracking

### US-012: Spisy (Cases)
**Jako** účetní **chci** spravovat právní/správní spisy klientů **abych** měl přehled o řízení.

**Acceptance Criteria:**
- [ ] CRUD spisů (case_number, type, opened/closed)
- [ ] Klient: read-only pohled (client_visible=true)
- [ ] Email inbox integrace (Gmail API fetch)
- [ ] Auto-assignment pravidla pro příchozí emaily
- [ ] Budget tracking
- [ ] Case timeline

### US-013: Komunikace (Zprávy)
**Jako** klient **chci** komunikovat s účetním přes chat **abych** nemusel volat nebo posílat emaily.

**Acceptance Criteria:**
- [ ] Konverzace (threads) s subject a statusem (open/completed)
- [ ] Přílohy
- [ ] Klient: chat per firma
- [ ] Účetní: swimlanes (Čeká na odpověď / Čeká na klienta / Vyřešeno)
- [ ] Unread count badge
- [ ] Polling každých 60s
- [ ] Email notifikace (SendGrid)
- [ ] Telegram bot notifikace
- [ ] Nastavitelné preference notifikací

### US-014: Stripe platební systém
**Jako** provozovatel **chci** monetizovat aplikaci přes Stripe **abych** měl příjmy z předplatného.

**Acceptance Criteria:**
- [ ] Účetnické tarify: free → starter → professional → enterprise
- [ ] Klientské tarify: free → basic → premium
- [ ] Stripe Checkout (subscription + one-time credit purchase)
- [ ] Stripe Billing Portal (self-service)
- [ ] Webhooks (checkout, subscription, invoice)
- [ ] Reverse trial: 30 dní Professional zdarma
- [ ] Master kill switch: `MONETIZATION_ENABLED`
- [ ] Credit purchases (extra extrakční kredity)
- [ ] Plan limits (max companies, max users, extractions/month)
- [ ] Feature gating (plan-gate.ts)

### US-015: Nový monetizační model (plánovaný)
**Jako** provozovatel **chci** přejít na nový tarifní model **abych** lépe odpovídal konkurenci.

**Acceptance Criteria:**
- [ ] Účetnické tarify (3 úrovně):
  - Základní (free): seznam klientů, profil, evidence času, matice, jednoduché úkoly, termíny, limit 10 firem
  - Střední: + uzávěrky, DPH, daň z příjmu, skupiny, rozšířené úkoly/projekty/spis, limit 100 firem
  - Profi: + vytěžování, plná komunikace a spis, neomezeno firem
- [ ] Klientské rozšíření:
  - Free: faktury (s omezením), cestovní deník (základní), komunikace
  - Placené pluginy: vytěžování (max 5/měs gratis), rozšířený adresář, cesťák PRO
- [ ] Randomizér: speciální zpoplatnění per km (NE součást tarifu)
- [ ] Landing page s vysvětlením tarifů
- [ ] Migrace stávajících uživatelů na nový model

### US-016: Nahrávání a správa dokladů
**Jako** klient **chci** nahrávat doklady (faktury, účtenky, výpisy) **abych** je sdílel s účetním.

**Acceptance Criteria:**
- [ ] Upload přes drag-and-drop a quick capture (foto, sken)
- [ ] Komentáře k dokladům
- [ ] Links mezi doklady
- [ ] Roční přehled (annual summary)
- [ ] Bulk operace
- [ ] Účetní: schvalování, vytěžování, export

### US-017: Google Drive integrace
**Jako** účetní **chci** synchronizovat dokumenty s Google Drive **abych** měl zálohu a sdílený přístup.

**Acceptance Criteria:**
- [ ] File browser (složky + soubory)
- [ ] Upload do Drive
- [ ] Folder management
- [ ] Sync s aplikací (cron job)
- [ ] Mapování firem na Drive složky

### US-018: Analytika a reporty
**Jako** účetní **chci** vidět analytické přehledy **abych** mohl optimalizovat práci.

**Acceptance Criteria:**
- [ ] Dashboard: kapacita, klienti, cíle, time reporty
- [ ] Per-company reporty
- [ ] Health score (automatické hodnocení klientů)

### US-019: Admin panel
**Jako** admin **chci** spravovat uživatele, nastavení a systém **abych** měl kontrolu nad aplikací.

**Acceptance Criteria:**
- [ ] Správa uživatelů (20+ admin stránek)
- [ ] Audit logy
- [ ] Workflow pravidla
- [ ] Pricing nastavení
- [ ] Šablony
- [ ] Knowledge base
- [ ] Capacity management
- [ ] Export dat

### US-020: Quick Capture (hlasový záznam)
**Jako** účetní **chci** rychle zachytit poznámky hlasem **abych** nemusel přepisovat ručně.

**Acceptance Criteria:**
- [ ] Voice recorder
- [ ] Audio transcription (AI)
- [ ] AI summarization
- [ ] Konverze na úkol

---

## Functional Requirements

### FR-1: Autentizace
- Custom HMAC-SHA256 JWT (NE Supabase Auth, NE NextAuth)
- Login: username + password → PBKDF2 hash → HMAC token (httpOnly cookie, 7 dní)
- 4 role: client, accountant, admin, assistant
- 11 fine-grained permissions (JSONB v users tabulce)
- Impersonace: staff může prohlížet klientský portál
- Rate limiting: login 5/min, API 60/min

### FR-2: Databáze
- Supabase (PostgreSQL) s service_role key
- 15+ hlavních tabulek (users, companies, monthly_closures, documents, invoices, tasks, projects, chats, subscriptions, travel_*, ...)
- 23 migrací (12/2025 – 03/2026)

### FR-3: Integrace
- Stripe (platby), Gemini/OpenAI/Z.AI (OCR/AI), Google Drive, Gmail, ARES, Raynet CRM, Twilio, SendGrid, Telegram, Pohoda XML

### FR-4: Deployment
- Next.js 14.1 standalone, Docker (Railway), 7 cron jobs

---

## Non-Goals
- Mobilní nativní aplikace (jen responsive web)
- Multi-tenant SaaS (jedna instance = jedna účetní firma)
- Real-time WebSocket komunikace (polling stačí)
- Vlastní účetní software (integrace s Pohoda přes XML export)

---

## Design / Technical Considerations

### Architektura
- Next.js 14 App Router, TypeScript, Tailwind + shadcn/ui
- Zustand pro state management, React Query pro data fetching
- Supabase admin client obchází RLS (všechny store moduly)
- Middleware: Edge Runtime, Web Crypto API

### Bezpečnostní poznámky
- Rate limiting je in-memory — resetuje se při restartu
- Impersonation cookie je non-httpOnly (záměrně, pro klientský JS)
- E2E testy mají hardcoded hesla

### Technický dluh
- `lib/kimi-ai.ts` (1039 ř.) — sdílené typy by měly být extrahované
- Duplicitní approve endpointy (`/api/extraction/approve` vs `/api/accountant/extraction/approve`)
- Duplicitní `formatCurrency`/`formatDate` funkce na 8+ místech
- Dva CollapsibleSection komponenty s různým API
- 2 nepoužité komponenty (annual-closing-section, section-nav)
- Register page používá legacy Supabase Auth (nesoulad s custom JWT)
- DB check constraint neobsahuje roli `assistant`

---

## Success Metrics
- Všech 15 modulů funguje po cleanup beze změn funkčnosti
- Build projde bez errorů (`npm run build`)
- Lint projde (`npm run lint`)
- TypeScript strict check projde (`npx tsc --noEmit`)
- E2E testy projdou (`npx playwright test`)
- Identifikované bugy opraveny (role constraint, env vars, duplicity)
- PRD pokrývá všechny existující i plánované funkce
- Strukturované tasky připravené pro implementaci

---

## Open Questions
- Přesné ceny tarifů (zatím nedefinovány)
- Naming tarifů (ne "Enterprise" — moc velké)
- Monetizace randomizéru: per km? per zpracování?
- Co dát na měsíc vs 3 měsíce zdarma jako trial
- Zákonné varianty pro paušál u cestovního deníku
- Migrace stávajících uživatelů na nový tarifní model
