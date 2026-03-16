# KOMPLETNÍ SEZNAM POŽADAVKŮ — UcetniWebApp
**Datum:** 2026-03-16
**Zdroje:** monetizace-a-verzovani, danovy-dotaznik-uol, lead-generation-marketplace, email-system, mesicni-uzaverky-klient, pojistne-udalosti-vize, krizove-rizeni-integrace, go-to-market, testing-feedback-01 až 05, RADIM-CHECKLIST, missing-integrations-checklist, navrh-tarifu
**Celkem:** 143 bodů | **Ověřeno:** kód v ~/Projects/UcetniWebApp/

**Legenda:**
- ✅ HOTOVO — implementováno v kódu
- ⚠️ ČÁSTEČNĚ — kód existuje, potřebuje doladění
- ❌ CHYBÍ — neimplementováno
- 🔧 RADIM — potřebuje Radimovu akci (API klíč, fyzická akce, konfigurace)

---

## UI/UX

- ✅ BOD-001: Attention bar — "Urgovat všechny klienty" má AlertDialog s potvrzením (clients-alert-bar.tsx:780)
- ⚠️ BOD-002: Attention bar — kompaktní formát (jeden řádek místo 3) — "compact" klíčové slovo v kódu ale plný one-liner formát neověřen
- ⚠️ BOD-003: Attention bar — "Označit jako hotové" má dialog ale není auto-triggered dodáním dokladů (pouze manuálně)
- ⚠️ BOD-004: Attention bar — "Urgovat" vs "Delegovat" — UrgencyActions.tsx existuje ale zjednodušení neověřeno
- ⚠️ BOD-005: Attention bar — pathname tracking existuje ale podmínka "schovat na komunikaci" neověřena
- ❌ BOD-006: Attention bar — nezobrazuje co se stane po kliknutí Urgovat (email? WhatsApp? SMS?)
- ❌ BOD-007: Attention bar — "Přidat poznámku" → kde se poznámka zobrazí, není jasné
- ⚠️ BOD-008: Dashboard — horní dlaždice: billable_amount skryté pro non-admin ale klikatelnost dlaždic chybí
- ⚠️ BOD-009: Dashboard — příjmy/revenue skryté pouze přes isAdmin check; obecné finance pro řadové účetní ještě nekryté
- ❌ BOD-010: Master matice — "Čeká na schválení" přejmenovat (neověřeno zda hotovo)
- ❌ BOD-011: Master matice — barevná kolečka jako filtr (click-to-filter) — nenalezeno
- ❌ BOD-012: Inbox dokladů — přejmenování na "Inbox podkladů" — neověřeno
- ✅ BOD-013: Inbox dokladů — seskupení podle klientů (clientGroups v inbox/page.tsx:400)
- ❌ BOD-014: Inbox dokladů — zpracované doklady přesunout do profilu klienta — logika nenalezena
- ✅ BOD-015: GTD/Práce — 3 taby Inbox|Úkoly|Projekty + InboxList component (work/page.tsx)
- ❌ BOD-016: Navigace — rozdělení sidebaru "denní práce" vs "extras" — neimplementováno
- ❌ BOD-017: Marketplace — admin se stále musí "registrovat" (marketplace/register/ stránka stále existuje)
- ❌ BOD-018: Revenue analytika — stále na /accountant/revenue/, nepřesunuto do Admin/Analytika
- ⚠️ BOD-019: Krizový plán — client/crisis/page.tsx existuje, ale umístění pod "Firma" neověřeno
- ❌ BOD-020: Role — junior vs senior účetní rozlišení — nenalezeno v kódu
- ✅ BOD-021: Landing page pro klienty — /pro-podnikatele/ existuje
- ❌ BOD-022: Freemium UX — jasný indikátor zdarma vs placené při onboardingu — nenalezeno
- ✅ BOD-023: Randomizér cesťáku — UpsellBanner v client/travel/page.tsx (cena předem)

---

## Funkce

- ✅ BOD-024: Měsíční uzávěrky — lib/bank-matching.ts 283 řádků, 3 matching strategie (VS 95%, částka+datum 70%, fuzzy 40%)
- ✅ BOD-025: Měsíční uzávěrky — automatické párování (bank-matching.ts, reálný kód, není stub)
- ✅ BOD-026: Měsíční uzávěrky — chybějící doklady sledovány (tax-impact.ts 236 řádků + missing-docs-reminder.ts 151 řádků)
- ✅ BOD-027: Měsíční uzávěrky — daňový dopad: reálný výpočet DzP+SP+ZP+DPH, sazby 2025 (SRO 21%, OSVČ 15%)
- ⚠️ BOD-028: Měsíční uzávěrky — YearlyTaxImpact type v tax-impact.ts, client UI kumulativního grafu ověřit
- ✅ BOD-029: Měsíční uzávěrky — eskalační notifikace (missing-docs-reminder.ts, standard/aggressive/gentle/off preset)
- ⚠️ BOD-030: Měsíční uzávěrky — OSVČ soukromé transakce — bank-review-sheet.tsx (client) existuje, označování ověřit
- ⚠️ BOD-031: Měsíční uzávěrky — SRO speciální transakce (vklad, příplatek) — bank-review-sheet.tsx, typy transakcí ověřit
- ⚠️ BOD-032: Měsíční uzávěrky — manuální kontrola výsledků — bank-review-sheet.tsx existuje, plná funkce ověřit
- ✅ BOD-033: Daňový dotazník — workflow hotový: API /tax-questionnaire/ + client/tax-questionnaire/page.tsx
- ⚠️ BOD-034: Daňový dotazník — napojení na modul daňového přiznání — API existuje, datový tok ověřit
- ⚠️ BOD-035: Daňový dotazník — upload dokumentu ke každé otázce — questionnaire existuje, per-question upload ověřit
- ✅ BOD-036: Randomizér — detect-fuel-docs route extrahuje tankování z dokladů
- ✅ BOD-037: Randomizér — lib/travel-randomizer.ts 309 řádků, reálné Anthropic Claude API (není stub)
- ⚠️ BOD-038: Randomizér — MODEL='claude-sonnet-4-6' použit v crisis, travel-randomizer model ověřit (má být Opus)
- ❌ BOD-039: Termíny — SP zálohy OSVČ měsíční — CHYBÍ v statutory-deadlines.ts (jen roční přehledy)
- ❌ BOD-040: Termíny — ZP zálohy OSVČ měsíční — CHYBÍ v statutory-deadlines.ts (jen roční přehledy)
- ⚠️ BOD-041: Termíny — DPH: přiznání měsíční/čtvrtletní ✅, ale kontrolní hlášení a souhrnné hlášení CHYBÍ
- ✅ BOD-042: Termíny — silniční daň (5 šablon incl. zálohy Q1-Q4) + daň z nemovitostí (statutory-deadlines.ts)
- ❌ BOD-043: Inbox dokladů — evidence odpracovaného času při zpracování — nenalezeno
- ✅ BOD-044: Soubory — předdefinovaná struktura složek (components/admin/operations-folder-templates.tsx)
- ⚠️ BOD-045: Soubory — propagace nové složky ke všem klientům — operations-folder-templates.tsx existuje, propagace ověřit
- ❌ BOD-046: Soubory — automatické třídění dokumentů do složek — nenalezeno
- ❌ BOD-047: Snapshots/zálohy per firma — neimplementováno (žádný snapshot lib)
- ❌ BOD-048: Snapshots/zálohy — obnovení z admin panelu — neimplementováno
- ✅ BOD-049: GTD clarify flow — tasks/clarify/page.tsx + handleInboxAction('task'|'project'|'delete') v work/page.tsx
- ✅ BOD-050: Pojistné události — claims/cases/page.tsx 513 řádků, reálný plný UI (není stub), typy z lib/types/insurance
- ✅ BOD-051: Pojistné události — app-switcher.tsx v obou layoutech (accountant + claims)
- ⚠️ BOD-052: Pojistné události — sdílený profil klienta — app-switcher existuje, ale sdílení DB dat claims/účetnictví neověřeno
- ✅ BOD-053: Krizový plán — AI generátor: 239 řádků, Sonnet 4.6, reálný FMEA systémový prompt v češtině, plan-gate (≥ professional)
- ❌ BOD-054: Krizový plán — chatbot pro krizové řízení (max 10 otázek) — nenalezeno
- ❌ BOD-055: Krizový plán — checklist pro PU klienty "co dělat hned po pojistné události" — nenalezeno
- ❌ BOD-056: Připomínky — TELFA.cz API napojení — žádný TELFA kód v projektu
- ✅ BOD-057: Multi-tenant registrace — auth/register/page.tsx existuje
- ⚠️ BOD-058: WhatsApp — zprávy v komunikaci v appce — lib/whatsapp.ts existuje, zobrazení v komunikaci neověřeno
- ⚠️ BOD-059: WhatsApp — skupinový přístup — single EVOLUTION_INSTANCE, per-firma instance neimplementováno

---

## Security

- ⚠️ BOD-060: Confirmation dialogy — AlertDialog pro bulk urgovat ✅, ostatní nebezpečné akce neověřeny
- ⚠️ BOD-061: Skrýt příjmy/zisk — billable_amount skryté pro non-admin, kompletní revenue hiding nedokončeno
- ❌ BOD-062: Role-based access junior/senior — binární admin/non-admin, granulované role chybí
- ❌ BOD-063: Snapshots izolace — snapshots neexistují (viz BOD-047)
- ⚠️ BOD-064: Billing právní aspekty — billing-service.ts pozn. "No Stripe Connect", právní review nutné
- ✅ BOD-065: Per-firma klíče — lib/google-drive-firm.ts + lib/tenant-store.ts + API tenants/[firmId]/drive/

---

## Integrace

- 🔧 BOD-066: ECOMAIL_API_KEY — CHYBÍ v .env.local (P0: žádné emaily se neposílají!)
- 🔧 BOD-067: Ecomail subscriber listy — CHYBÍ ECOMAIL_LIST_ID_ACCOUNTANTS + ECOMAIL_LIST_ID_CLIENTS
- ⚠️ BOD-068: Ecomail automations — kód (triggerAutomation) existuje, ale IDs (ECOMAIL_AUTOMATION_*) nejsou nakonfigurovány
- 🔧 BOD-069: SendGrid fallback — SENDGRID_API_KEY + SENDGRID_FROM_EMAIL CHYBÍ v .env.local
- 🔧 BOD-070: Signi.com — SIGNI_API_KEY CHYBÍ v .env.local
- 🔧 BOD-071: Signi.com — Supabase migrace NESPUŠTĚNA: `ALTER TABLE users ADD COLUMN IF NOT EXISTS signi_api_key TEXT;`
- ❌ BOD-072: Signi.com — vzory smluv (DOCX šablony s auto-fill) — nenalezeno v kódu
- 🔧 BOD-073: Telegram — TELEGRAM_BOT_TOKEN CHYBÍ v .env.local
- 🔧 BOD-074: Notion — NOTION_TOKEN CHYBÍ v .env.local
- 🔧 BOD-075: Evolution API — EVOLUTION_API_KEY CHYBÍ v .env.local
- ⚠️ BOD-076: WhatsApp per firma — kód jen single instance (EVOLUTION_INSTANCE=ucetni-webapp), per-firma neimplementováno
- 🔧 BOD-077: TELFA.cz — fyzicky poslat SIM kartu (Radim)
- ❌ BOD-078: TELFA.cz — API integrace — žádný TELFA kód v projektu
- ✅ BOD-079: Google Drive per firma — lib/google-drive-firm.ts + API /tenants/[firmId]/drive/ existuje
- 🔧 BOD-080: Supabase kapacita — zkontrolovat (free tier = 500MB), upgradovat pokud potřeba
- 🔧 BOD-081: Hetzner disk — koupit pro snapshoty (snapshots neexistují, viz BOD-047)
- 🔧 BOD-082: Stripe — 9 addon price IDs CHYBÍ v .env.local (EXTRACTION_SINGLE/BULK/OPUS, EXTRA_USER/COMPANY, RANDOMIZER, TRAVEL_YEARLY_SINGLE/FLEET, TRAVEL_REGEN)
- ⚠️ BOD-083: Stripe Billing Portal — lib/stripe.ts existuje, portal URL konfigurace neověřena
- ⚠️ BOD-084: Stripe webhook — existuje, addon/credits zpracování ověřit v produkci
- ⚠️ BOD-085: Raynet CRM — kód a cron nakonfigurován, živý sync neověřen
- ✅ BOD-086: Sběrný email — lib/document-inbox-store.ts + inbox/sync API existuje (ale DOCUMENT_INBOX_EMAIL chybí v .env)
- ❌ BOD-087: Email adresy systému — noreply@/fakturace@/kancelar@/info@ nestanoveny v konfiguraci
- ✅ BOD-088: Email marketing tracking — lib/marketing-service.ts existuje
- 🔧 BOD-089: DOCUMENT_INBOX_EMAIL — CHYBÍ v .env.local
- 🔧 BOD-090: NEXT_PUBLIC_APP_URL — CHYBÍ v .env.local (má fallback app.zajcon.cz)
- ❌ BOD-091: .env.local.example — stále zastaralý (GDrive service account vars + WhatsApp TOKEN vars)

---

## Marketing

- ✅ BOD-092: Landing page účetní firmy — existuje (app.zajcon.cz)
- ✅ BOD-093: Landing page klienti — /pro-podnikatele/ existuje
- ✅ BOD-094: Landing page pojistné události — /claims/ + /claims/new/ existuje
- ⚠️ BOD-095: Lead capture stránky — /pro-ucetni/ existuje, formulář pro sběr leadů ověřit
- ✅ BOD-096: Kontextový upsell — UpsellBanner komponenta v client/travel/page.tsx + dalších
- ⚠️ BOD-097: Email kampaně BEZ účetní — lib/marketing-service.ts existuje, filtr "bez přiřazené účetní" ověřit
- ✅ BOD-098: Marketplace onboarding — accountant/marketplace/register/ existuje
- ⚠️ BOD-099: Marketplace matchmaking — marketplace-requests API existuje, matching algoritmus ověřit
- ❌ BOD-100: Cross-selling emaily — účetnictví → PU, PU → účetnictví: specifické kampaně nenalezeny
- ❌ BOD-101: Cross-selling — 3 měsíce zdarma na druhou službu — nenalezeno
- ⚠️ BOD-102: Soft launch — reverse trial 30 dní existuje; 3měsíční soft launch je business rozhodnutí
- ✅ BOD-103: Revenue sharing — lib/revenue-sharing.ts 79 řádků, reálné Supabase queries na marketplace_providers
- ✅ BOD-104: Billing-as-a-service — lib/billing-service.ts 714 řádků, full Stripe + payout tracking (není stub)
- ✅ BOD-105: Markup model — revenue-sharing.ts má markup_pct + commission výpočet
- ❌ BOD-106: Reklama — externe (Google Ads, Meta); není code issue
- ⚠️ BOD-107: Fee model — revenue-sharing.ts má strukturu, konkrétní % zatím nefinalizováno (business decision)

---

## Bugy

- ⚠️ BOD-108: CRASH: záložka "Jízdy" — travel/page.tsx existuje, layout.tsx MODIFIED (oprava probíhá)
- ⚠️ BOD-109: CRASH: záložka "Daně" — taxes/page.tsx existuje, profile/page.tsx MODIFIED (oprava probíhá)
- ⚠️ BOD-110: CRASH: záložka "Dohodáři" — dohodari/page.tsx existuje, layout.tsx MODIFIED (oprava probíhá)
- ⚠️ BOD-111: CRASH: záložka "Firma" — profile/page.tsx MODIFIED (oprava probíhá)
- ⚠️ BOD-112: CRASH: Vytěžování — extraction pages existují, extraction/clients/[companyId]/page.tsx MODIFIED (oprava probíhá)
- ✅ BOD-113: BUG: Extraction spinner — safety timeout přidán (extraction/clients/[companyId]/page.tsx:64-73)
- ⚠️ BOD-114: BUG: Fakturace B2B — accountant/invoicing/page.tsx existuje, runtime chyba neověřena
- ⚠️ BOD-115: BUG: Admin Lidé tab — admin/people/page.tsx existuje a vypadá funkčně; runtime ověřit
- ⚠️ BOD-116: BUG: Admin Koš — admin/trash/page.tsx existuje s ConfirmDialog; runtime 500 neověřeno
- ⚠️ BOD-117: BUG: Klientský pohled 500 — API /companies/[companyId]/route.ts MODIFIED (oprava probíhá)
- ⚠️ BOD-118: BUG: Master matice záložka Platby — TabsTrigger kód existuje; runtime ověřit
- ⚠️ BOD-119: BUG: Master matice záložka DPH — TabsTrigger kód existuje; runtime ověřit
- ⚠️ BOD-120: BUG: Master matice záložka Daň z příjmu — TabsTrigger kód existuje; runtime ověřit
- ✅ BOD-121: BUG: GTD inbox seznam — InboxList s handleInboxAction implementováno (work/page.tsx)
- ❌ BOD-122: BUG: Soubory — tlačítko "Vytvořit složku" — createFolder logika nenalezena v files/page.tsx
- ⚠️ BOD-123: BUG: Master matice filtr — filtr existuje; správnost filtrování ověřit v runtime
- ⚠️ BOD-124: INFO: Znalostní báze — sessionStorage cache problém, žádný code fix; workaround: hard refresh Ctrl+Shift+R

---

## Monetizace

- ⚠️ BOD-125: Klientský tarif FREE — lib/plan-gate.ts má logiku; plan_limits v DB musí být nakonfigurováno
- ⚠️ BOD-126: Klientský tarif PLUS (199 Kč) — kód v plan-gate.ts, Stripe price ID missing
- ⚠️ BOD-127: Klientský tarif PREMIUM (399 Kč) — kód v plan-gate.ts, Stripe price ID missing
- ⚠️ BOD-128: Účetní tarif ZÁKLAD (0 Kč) — kód v plan-gate.ts, DB config ověřit
- ⚠️ BOD-129: Účetní tarif PROFI (699 Kč) — stripe.ts má STRIPE_PRICE_PROFI_MONTHLY/YEARLY, price IDs nastaveny
- ⚠️ BOD-130: Účetní tarif BUSINESS (1499 Kč) — stripe.ts má STRIPE_PRICE_BUSINESS_MONTHLY/YEARLY, price IDs nastaveny
- 🔧 BOD-131: Per-use vytěžování 9 Kč/doklad — STRIPE_PRICE_EXTRACTION_SINGLE chybí v .env.local
- 🔧 BOD-132: Per-use bulk vytěžování 7 Kč — STRIPE_PRICE_EXTRACTION_BULK chybí v .env.local
- 🔧 BOD-133: Per-use Opus analýza 19 Kč — STRIPE_PRICE_EXTRACTION_OPUS chybí v .env.local
- 🔧 BOD-134: Per-use přidaný uživatel 99 Kč — STRIPE_PRICE_EXTRA_USER chybí v .env.local
- 🔧 BOD-135: Per-use firma nad limit 49 Kč — STRIPE_PRICE_EXTRA_COMPANY chybí v .env.local
- 🔧 BOD-136: Per-use randomizér 990 Kč — STRIPE_PRICE_RANDOMIZER chybí v .env.local
- ✅ BOD-137: Reverse trial 30 dní — api/subscription/trial + cron/trial-expiry existuje
- ✅ BOD-138: MONETIZATION_ENABLED=false — kill switch aktivní v .env.local
- ⚠️ BOD-139: Stripe Billing Portal — lib/stripe.ts existuje, portal URL a konfigurace ověřit

---

## Architektura

- ✅ BOD-140: Jádro + deriváty — claims modul + app-switcher v obou layoutech
- ⚠️ BOD-141: Sdílený klientský profil — app-switcher existuje, ale plné sdílení DB dat claims/účetnictví neověřeno
- ✅ BOD-142: Multi-tenant admin — admin/tenants/ stránka + API tenants/[firmId]/ existuje
- ⚠️ BOD-143: Sdílená infrastruktura — lib kód pro Stripe/Ecomail/Telegram/WhatsApp/Notion existuje; konfigurace závisí na chybějících API klíčích

---

## SOUHRN STATUSŮ

| Status | Počet | Body |
|--------|-------|------|
| ✅ HOTOVO | 35 | BOD-001,013,015,021,023-027,029,033,036-037,042,044,049-051,053,057,065,079,086,088,092-094,096,098,103-105,121,137-138,140,142 |
| ⚠️ ČÁSTEČNĚ | 59 | Viz výše (potřebuje doladění nebo runtime ověření) |
| ❌ CHYBÍ | 27 | BOD-006,007,010-012,014,016-018,020,022,039-040,043,046-048,054-056,059,072,078,087,091,100-101,122 |
| 🔧 RADIM | 22 | BOD-066-067,069-071,073-075,077,080-082,089-090 + BOD-131-136 |

### Kritické skupiny

**🔴 Nejdůležitější ❌ CHYBÍ:**
- BOD-039/040: SP a ZP zálohy OSVČ v termínech
- BOD-041: Kontrolní hlášení + souhrnné hlášení v termínech
- BOD-047/048: Snapshots — celá funkce chybí
- BOD-054: Krizový chatbot
- BOD-078: TELFA API integrace
- BOD-122: Folder creation nefunkční

**🔴 Nejdůležitější 🔧 RADIM:**
- BOD-066: ECOMAIL_API_KEY (P0)
- BOD-071: Supabase migrace Signi (spustit SQL)
- BOD-082: 9× Stripe price IDs
- BOD-073/074/075: Telegram/Notion/WhatsApp tokeny

**⚠️ Důležité ČÁSTEČNĚ (ověřit v runtime):**
- BOD-108-117: Crash bugy — opravy probíhají (MODIFIED soubory)
- BOD-118-120: Master matice záložky — kód existuje, runtime neověřen
- BOD-028: Kumulativní daňový graf v klientském portálu
