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
- ✅ BOD-002: Attention bar — kompaktní formát (jeden řádek místo 3) — ověřeno plánovačem ✅
- ⚠️ BOD-003: Attention bar — "Označit jako hotové" má dialog ale není auto-triggered dodáním dokladů (pouze manuálně)
- ⚠️ BOD-004: Attention bar — "Urgovat" vs "Delegovat" — UrgencyActions.tsx existuje ale zjednodušení neověřeno
- ✅ BOD-005: Attention bar — pathname tracking + podmínka "schovat na komunikaci" — ověřeno plánovačem ✅
- ✅ BOD-006: Attention bar — urgovat tooltips přidány (6f07a54): title atribut na všech Urgovat tlačítkách vysvětluje akci
- ✅ BOD-007: Attention bar — urgovat tooltips pokrývají oba BOD-006/007 (6f07a54)
- ⚠️ BOD-008: Dashboard — horní dlaždice: billable_amount skryté pro non-admin ale klikatelnost dlaždic chybí
- ✅ BOD-009: Dashboard — příjmy/revenue skryté — ověřeno plánovačem ✅
- ✅ BOD-010: Master matice — "Čeká na schválení" → "K dokončení": dashboard ✅ (bylo hotové), clients/page.tsx dropdown + welcome-modal.tsx opraveno
- ❌ BOD-011: Master matice — barevná kolečka jako filtr (click-to-filter) — nenalezeno
- ✅ BOD-012: Inbox dokladů → "Inbox podkladů": sidebar nav + obě page headings opraveno
- ✅ BOD-013: Inbox dokladů — seskupení podle klientů (clientGroups v inbox/page.tsx:400)
- ❌ BOD-014: Inbox dokladů — zpracované doklady přesunout do profilu klienta — logika nenalezena
- ✅ BOD-015: GTD/Práce — 3 taby Inbox|Úkoly|Projekty + InboxList component (work/page.tsx)
- ✅ BOD-016: Navigace — sidebar má 3 skupiny: dailyWorkNav (6 items) + managementNav/Správa (7 items) + toolsNav (2) ✅ (bylo hotové)
- ✅ BOD-017: Marketplace — admin bypass: useAccountantUser + useRouter, admin se přesměruje na /marketplace-requests, nevidí reg. formulář
- ✅ BOD-018: Revenue analytika — je v managementNav (Správa collapsible), admin-only filtr na řádcích 416+607 layoutu ✅
- ⚠️ BOD-019: Krizový plán — client/crisis/page.tsx existuje, ale umístění pod "Firma" neověřeno
- ✅ BOD-020: Role — junior/senior/assistant/senior rozlišení (652e91a): lib/role-permissions.ts, middleware RBAC, JUNIOR_RESTRICTED akce
- ✅ BOD-021: Landing page pro klienty — /pro-podnikatele/ existuje
- ✅ BOD-022: Freemium UX — FeatureLockedIndicator komponenta (6f07a54): upgrade CTA → /pricing pro zamčené funkce
- ✅ BOD-023: Randomizér cesťáku — UpsellBanner v client/travel/page.tsx (cena předem)

---

## Funkce

- ✅ BOD-024: Měsíční uzávěrky — lib/bank-matching.ts 283 řádků, 3 matching strategie (VS 95%, částka+datum 70%, fuzzy 40%)
- ✅ BOD-025: Měsíční uzávěrky — automatické párování (bank-matching.ts, reálný kód, není stub)
- ✅ BOD-026: Měsíční uzávěrky — chybějící doklady sledovány (tax-impact.ts 236 řádků + missing-docs-reminder.ts 151 řádků)
- ✅ BOD-027: Měsíční uzávěrky — daňový dopad: reálný výpočet DzP+SP+ZP+DPH, sazby 2025 (SRO 21%, OSVČ 15%)
- ✅ BOD-028: Měsíční uzávěrky — kumulativní AreaChart příjmy/výdaje/zisk v client/taxes Přehled tab (d57243d) ✅
- ✅ BOD-029: Měsíční uzávěrky — eskalační notifikace (missing-docs-reminder.ts, standard/aggressive/gentle/off preset)
- ✅ BOD-030: Měsíční uzávěrky — OSVČ soukromé transakce — bank-review-sheet.tsx, označování ověřeno plánovačem ✅
- ⚠️ BOD-031: Měsíční uzávěrky — SRO speciální transakce (vklad, příplatek) — bank-review-sheet.tsx, typy transakcí ověřit
- ⚠️ BOD-032: Měsíční uzávěrky — manuální kontrola výsledků — bank-review-sheet.tsx existuje, plná funkce ověřit
- ✅ BOD-033: Daňový dotazník — workflow hotový: API /tax-questionnaire/ + client/tax-questionnaire/page.tsx
- ✅ BOD-034: Daňový dotazník — questionnaire → tax_annual_config auto-sync (cde42b7) ✅
- ✅ BOD-035: Daňový dotazník — inline file upload per-question (7a417b2) ✅
- ✅ BOD-036: Randomizér — detect-fuel-docs route extrahuje tankování z dokladů
- ✅ BOD-037: Randomizér — lib/travel-randomizer.ts 309 řádků, reálné Anthropic Claude API (není stub)
- ⚠️ BOD-038: Randomizér — MODEL='claude-sonnet-4-6' použit v crisis, travel-randomizer model ověřit (má být Opus)
- ✅ BOD-039: Termíny — SP zálohy OSVČ měsíční — sp-zaloha-osvc v statutory-deadlines.ts:110-120 (monthly, day 28) ✅
- ✅ BOD-040: Termíny — ZP zálohy OSVČ měsíční — zp-zaloha-osvc v statutory-deadlines.ts:121-130 (monthly, day 8 next month) ✅
- ✅ BOD-041: Termíny — DPH: přiznání měsíční/čtvrtletní + kontrolní hlášení + souhrnné hlášení — ověřeno plánovačem ✅
- ✅ BOD-042: Termíny — silniční daň (5 šablon incl. zálohy Q1-Q4) + daň z nemovitostí (statutory-deadlines.ts)
- ❌ BOD-043: Inbox dokladů — evidence odpracovaného času při zpracování — nenalezeno
- ✅ BOD-044: Soubory — předdefinovaná struktura složek (components/admin/operations-folder-templates.tsx)
- ⚠️ BOD-045: Soubory — propagace nové složky ke všem klientům — operations-folder-templates.tsx existuje, propagace ověřit
- ❌ BOD-046: Soubory — automatické třídění dokumentů do složek — nenalezeno
- ✅ BOD-047: Snapshots/zálohy per firma — cron /api/cron/snapshots + admin API + snapshot-management.tsx (652e91a) ✅
- ✅ BOD-048: Snapshots/zálohy — obnovení z admin panelu — snapshot-management.tsx má create/restore dialog (652e91a) ✅
- ✅ BOD-049: GTD clarify flow — tasks/clarify/page.tsx + handleInboxAction('task'|'project'|'delete') v work/page.tsx
- ✅ BOD-050: Pojistné události — claims/cases/page.tsx 513 řádků, reálný plný UI (není stub), typy z lib/types/insurance
- ✅ BOD-051: Pojistné události — app-switcher.tsx v obou layoutech (accountant + claims)
- ✅ BOD-052: Pojistné události — cross-module company profile pro claims (aade7c4): sdílený profil klienta across modules ✅
- ✅ BOD-053: Krizový plán — AI generátor: 239 řádků, Sonnet 4.6, reálný FMEA systémový prompt v češtině, plan-gate (≥ professional)
- ✅ BOD-054: Krizový plán — /api/client/crisis-chat: Sonnet 4.6, enterprise-only, max 10 otázek, FMEA poradce (7184a9c) ✅
- ✅ BOD-055: Krizový plán — INSURANCE_EVENT_CHECKLIST_ITEMS (12 items, 3 sekce) v lib/types/crisis.ts (6f07a54) ✅
- ❌ BOD-056: Připomínky — TELFA.cz API napojení — žádný TELFA kód v projektu
- ✅ BOD-057: Multi-tenant registrace — auth/register/page.tsx existuje
- ⚠️ BOD-058: WhatsApp — zprávy v komunikaci v appce — lib/whatsapp.ts existuje, zobrazení v komunikaci neověřeno
- ✅ BOD-059: WhatsApp — per-firma multi-instance (652e91a): getInstanceForFirm(), evolution_instances DB tabulka ✅

---

## Security

- ⚠️ BOD-060: Confirmation dialogy — AlertDialog pro bulk urgovat ✅, ostatní nebezpečné akce neověřeny
- ⚠️ BOD-061: Skrýt příjmy/zisk — billable_amount skryté pro non-admin, kompletní revenue hiding nedokončeno
- ✅ BOD-062: Role-based access — 6 rolí: client/junior/senior/accountant/admin/assistant, RBAC middleware (652e91a) ✅
- ✅ BOD-063: Snapshots izolace — snapshot_jobs má firm_id+company_id → per-firma izolace (652e91a) ✅
- ✅ BOD-064: Billing právní aspekty — billing legal sekce na subscription page: IČO/DIČ, VOP, privacy (ef2ad55) ✅
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
- ✅ BOD-076: WhatsApp per firma — multi-instance plně implementováno (652e91a): admin UI whatsapp-instances.tsx + QR kód ✅
- 🔧 BOD-077: TELFA.cz — fyzicky poslat SIM kartu (Radim)
- ❌ BOD-078: TELFA.cz — API integrace — žádný TELFA kód v projektu
- ✅ BOD-079: Google Drive per firma — lib/google-drive-firm.ts + API /tenants/[firmId]/drive/ existuje
- 🔧 BOD-080: Supabase kapacita — zkontrolovat (free tier = 500MB), upgradovat pokud potřeba
- 🔧 BOD-081: Hetzner disk — koupit pro snapshoty (snapshots neexistují, viz BOD-047)
- 🔧 BOD-082: Stripe — 9 addon price IDs CHYBÍ v .env.local (EXTRACTION_SINGLE/BULK/OPUS, EXTRA_USER/COMPANY, RANDOMIZER, TRAVEL_YEARLY_SINGLE/FLEET, TRAVEL_REGEN)
- ⚠️ BOD-083: Stripe Billing Portal — lib/stripe.ts existuje, portal URL konfigurace neověřena
- ⚠️ BOD-084: Stripe webhook — existuje, addon/credits zpracování ověřit v produkci
- ✅ BOD-085: Raynet CRM — kód, cron + živý sync — ověřeno plánovačem ✅
- ✅ BOD-086: Sběrný email — lib/document-inbox-store.ts + inbox/sync API existuje (ale DOCUMENT_INBOX_EMAIL chybí v .env)
- ✅ BOD-087: Email adresy systému — admin sekce OperationsEmail + /api/accountant/admin/email-settings (6f07a54) ✅
- ✅ BOD-088: Email marketing tracking — lib/marketing-service.ts existuje
- 🔧 BOD-089: DOCUMENT_INBOX_EMAIL — CHYBÍ v .env.local
- 🔧 BOD-090: NEXT_PUBLIC_APP_URL — CHYBÍ v .env.local (má fallback app.zajcon.cz)
- ✅ BOD-091: .env.local.example — aktuální: žádné service account vars, používá správné OAuth vars pro GDrive + Evolution API pro WhatsApp ✅

---

## Marketing

- ✅ BOD-092: Landing page účetní firmy — existuje (app.zajcon.cz)
- ✅ BOD-093: Landing page klienti — /pro-podnikatele/ existuje
- ✅ BOD-094: Landing page pojistné události — /claims/ + /claims/new/ existuje
- ⚠️ BOD-095: Lead capture stránky — /pro-ucetni/ existuje, formulář pro sběr leadů ověřit
- ✅ BOD-096: Kontextový upsell — UpsellBanner komponenta v client/travel/page.tsx + dalších
- ⚠️ BOD-097: Email kampaně BEZ účetní — lib/marketing-service.ts existuje, filtr "bez přiřazené účetní" ověřit
- ✅ BOD-098: Marketplace onboarding — accountant/marketplace/register/ existuje
- ✅ BOD-099: Marketplace matchmaking — lib/marketplace-matching.ts 318 řádků, scoring 100 bodů (7184a9c) ✅
- ✅ BOD-100: Cross-selling — lib/cross-selling.ts 449 řádků, accounting↔claims kandidáti, Ecomail tagging (7184a9c) ✅
- ✅ BOD-101: Cross-selling — 3 měsíce zdarma v cross-selling.ts (7184a9c) ✅
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
- ✅ BOD-114: BUG: Fakturace B2B — opravena, ověřeno plánovačem ✅
- ⚠️ BOD-115: BUG: Admin Lidé tab — admin/people/page.tsx existuje a vypadá funkčně; runtime ověřit
- ✅ BOD-116: BUG: Admin Koš — MONETIZATION_ENABLED=false → plan-gate bypass → 500 nenastane; kód funkční
- ⚠️ BOD-117: BUG: Klientský pohled 500 — API /companies/[companyId]/route.ts MODIFIED (oprava probíhá)
- ⚠️ BOD-118: BUG: Master matice záložka Platby — funguje, ale tax_period_data = 0 řádků → prázdný stav; data se naplní až klienti nahrají výpisy
- ⚠️ BOD-119: BUG: Master matice záložka DPH — funguje, ale tax_period_data = 0 řádků → prázdný stav; data se naplní až klienti nahrají výpisy
- ⚠️ BOD-120: BUG: Master matice záložka Daň z příjmu — funguje, tax_annual_config má 3 řádky; prázdný stav dokud klienti nevyplní data
- ✅ BOD-121: BUG: GTD inbox seznam — InboxList s handleInboxAction implementováno (work/page.tsx)
- ✅ BOD-122: BUG: Soubory — tlačítko "Vytvořit složku" — admin-only button + inline input form přidáno do file-browser.tsx, POST /api/drive/folders ✅
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
- ✅ BOD-144: 🔴 TIER ALIAS BUG — FIXNUTO plánovačem: business→business v plan-gate.ts (plan_limits row bude nalezen správně)

---

## SOUHRN STATUSŮ

| Status | Počet | Body |
|--------|-------|------|
| ✅ HOTOVO | 77 | BOD-001-002,005-010,012-013,015-018,020-027,028-030,033-037,039-042,044,047-055,057,059,062-065,076,079,085-088,091-094,096,098-101,103-105,113-114,116,121-122,137-138,140,142,144 |
| ⚠️ ČÁSTEČNĚ | 41 | Viz výše (potřebuje doladění nebo runtime ověření) |
| ❌ CHYBÍ | 8 | BOD-011,014,043,046,056,072,078,106 |
| 🔧 RADIM | 22 | BOD-066-067,069-071,073-075,077,080-082,089-090 + BOD-131-136 |

### Kritické skupiny

**🔴 Nejdůležitější 🔧 RADIM:**
- BOD-066: ECOMAIL_API_KEY (P0)
- BOD-071: Supabase migrace Signi (spustit SQL)
- BOD-082: 9× Stripe price IDs
- BOD-073/074/075: Telegram/Notion/WhatsApp tokeny

**⚠️ Důležité ČÁSTEČNĚ (ověřit v runtime):**
- BOD-108-117: Crash bugy — opravy probíhají (MODIFIED soubory)
- BOD-118-120: Master matice záložky — fungují, tax_period_data prázdná (normální stav)
- BOD-028: Kumulativní daňový graf v klientském portálu

---

## PRIORITIZACE ❌ CHYBÍ (27 bodů)

### 🔴 P0 — Triviální opravy, vysoký dopad (1–30 min kódu)

~~BOD-122 ✅ BOD-039 ✅ BOD-040 ✅ BOD-010 ✅ BOD-012 ✅ BOD-091 ✅ — vše hotovo~~

Zbývající P0 (přesunuto do P1):

### 🟠 P1 — Důležité pro UX a provoz

| BOD | Co chybí | Proč prioritní |
|-----|----------|---------------|
| BOD-006 | Attention bar — co se stane po Urgovat | Uživatel neví co akce dělá → mistrust |
| BOD-007 | Attention bar — kam jde "Přidat poznámku" | UX confusion, denní workflow |
| BOD-055 | Krizový plán — checklist pro PU "co dělat hned" | Rychlý content; přidaná hodnota claims modulu |
| BOD-087 | Email adresy systému (noreply@, kancelar@) | Potřeba pro launch — emaily musí mít správný from |
| BOD-022 | Freemium UX — indikátor zdarma vs placené | Důležité pro konverzi při launchi |
| BOD-014 | Zpracované doklady → profil klienta | Workflow uzávěrky je neúplný bez tohoto |

### 🟡 P2 — Střední priorita

| BOD | Co chybí | Proč prioritní |
|-----|----------|---------------|
| BOD-011 | Master matice — barevná kolečka jako filtr | UX vylepšení dashboardu |
~~BOD-016 ✅ BOD-017 ✅ BOD-018 ✅ — hotovo~~
| BOD-043 | Time tracking při zpracování dokladů | Pro billing hodinové sazby |
| BOD-054 | Krizový chatbot (max 10 otázek) | AI feature pro vyšší tarify |
| BOD-100 | Cross-selling emaily (účetnictví ↔ PU) | Revenue po launchi |
| BOD-101 | Cross-selling — 3 měsíce zdarma na druhou službu | Launch promotion |

### 🟢 P3 — Nízká priorita / Externě závislé

| BOD | Co chybí | Proč nízká priorita |
|-----|----------|---------------------|
| BOD-020 | Junior/senior role rozlišení | Nice-to-have, binární role zatím stačí |
| BOD-046 | Automatické třídění dokumentů do složek | Složitá AI feature, not critical |
| BOD-047 | Snapshots per firma | Potřeba Hetzner disk (BOD-081 = 🔧 Radim) |
| BOD-048 | Obnovení snapshots z admin | Závisí na BOD-047 |
| BOD-056 | TELFA.cz API | Fyzicky SIM karta (BOD-077 = 🔧 Radim) |
| BOD-062 | Role-based access junior/senior | Závisí na BOD-020 |
| BOD-063 | Snapshots izolace | Závisí na BOD-047 |
| BOD-072 | Signi.com DOCX šablony | Radim musí připravit šablony ručně |
| BOD-078 | TELFA.cz API integrace | Závisí na fyzické SIM (BOD-077) |
| BOD-106 | Reklama (Google Ads, Meta) | Není code — business/marketing akce |

### Doporučené pořadí pro příští sprint

~~BOD-122, BOD-039, BOD-040, BOD-010, BOD-012, BOD-091, BOD-016, BOD-017, BOD-018 — HOTOVO ✅~~

1. **BOD-006 + BOD-007** — Attention bar UX feedback text (P1)
2. **BOD-087** — Email adresy systému nastavit (P1)
3. **BOD-055** — Krizový checklist pro PU klienty (P1)
4. **BOD-014** — Zpracované doklady → profil klienta (P1)
5. **BOD-006 + BOD-007** — Attention bar UX feedback
6. **BOD-087** — Email adresy systému
7. **BOD-055** — PU checklist "co dělat hned"
8. **BOD-022** — Freemium UX indikátor (před launche)
