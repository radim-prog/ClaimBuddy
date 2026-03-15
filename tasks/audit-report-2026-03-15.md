# Audit Report — UcetniWebApp
**Datum:** 2026-03-15
**Typ:** Kompletní audit dnešních změn (migrace, env vars, API routes, changelog)

---

## 1. DB Migrace

Dnes přibyly **4 nové migrace** (všechny v `supabase/migrations/`):

| Migrace | Tabulka | Stav |
|---------|---------|------|
| `20260315_extraction_presence.sql` | `extraction_presence` + ALTER `documents` | OK |
| `20260315_knowledge_base.sql` | `knowledge_base` | OK |
| `20260315_tax_questionnaires.sql` | `tax_questionnaires` | OK |
| `20260315_onboarding_questionnaires.sql` | `onboarding_questionnaires` | OK |

### Kontrola migrací:

**extraction_presence.sql** — OK
- PK na `user_id`, FK na `users(id)` + `documents(id)` — korektní
- `ON DELETE CASCADE` / `SET NULL` — správné chování
- Indexy: `idx_extraction_presence_heartbeat`, `idx_extraction_presence_document` (partial) — OK
- ALTER documents: `locked_by UUID REFERENCES users(id)` — OK
- `IF NOT EXISTS` na CREATE TABLE — OK

**knowledge_base.sql** — OK
- `gen_random_uuid()` PK — OK
- CHECK constraint na category (8 hodnot) — OK
- FK na `users(id)` pro `created_by`/`updated_by` — OK, ale **BEZ `ON DELETE SET NULL`** (minor: pokud uživatel smazán, INSERT selže)
- Index na `(category, sort_order)` — OK

**tax_questionnaires.sql** — OK
- `ON DELETE CASCADE` na company_id — OK
- UNIQUE `(company_id, year)` — OK
- 3 indexy (company, year, status) — OK
- Status CHECK constraint: 5 hodnot — OK

**onboarding_questionnaires.sql** — OK
- UNIQUE na `company_id` (1 dotazník per firma) — OK
- Status CHECK constraint: 5 hodnot — OK
- **CHYBÍ `ON DELETE CASCADE`** na `company_id` FK — MEDIUM: pokud firma smazána, dotazník osiří

### Migrace které CHYBÍ:

**VAROVÁNÍ:** Modul dohodáři (`97e709b`) nevytvořil žádnou DB migraci. Kód v `lib/dohodari-store-db.ts` čte z tabulek `employees` a `companies` — ty existují, ale **nová migrace pro dohody/výkazy ještě neexistuje** (plánováno v D-1). To je OK — dohodáři zatím pracují pouze s existujícími tabulkami.

---

## 2. Environment Variables

### Dokumentované v .env.local.example (14 ks):
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY, GOOGLE_DRIVE_CLIENT_EMAIL, GOOGLE_DRIVE_PRIVATE_KEY, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, SENDGRID_API_KEY, SENDGRID_FROM_EMAIL, WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_VERIFY_TOKEN

### NEDOKUMENTOVANÉ — CRITICAL (crash bez nich):
| Proměnná | Soubory | Fallback |
|----------|---------|----------|
| `AUTH_SECRET` | middleware.ts, lib/auth.ts, lib/crypto.ts | **throws Error** — app nestartuje! |
| `CRON_SECRET` | 9× cron routes | **401** na všechny crony |
| `SETUP_SECRET` | first-admin route | **nefunkční** setup |

### NEDOKUMENTOVANÉ — HIGH (funkce nefungují):
| Proměnná | Soubory | Fallback |
|----------|---------|----------|
| `STRIPE_SECRET_KEY` | lib/stripe.ts | vrátí null |
| `STRIPE_WEBHOOK_SECRET` | stripe/webhook/route.ts | webhook selže |
| `STRIPE_PRICE_PROFI_MONTHLY` | lib/stripe.ts | `''` |
| `STRIPE_PRICE_PROFI_YEARLY` | lib/stripe.ts | `''` |
| `STRIPE_PRICE_BUSINESS_MONTHLY` | lib/stripe.ts | `''` |
| `STRIPE_PRICE_BUSINESS_YEARLY` | lib/stripe.ts | `''` |
| `STRIPE_PRICE_CLIENT_PLUS_MONTHLY` | lib/stripe.ts | `''` |
| `STRIPE_PRICE_CLIENT_PLUS_YEARLY` | lib/stripe.ts | `''` |
| `STRIPE_PRICE_CLIENT_PREMIUM_MONTHLY` | lib/stripe.ts | `''` |
| `STRIPE_PRICE_CLIENT_PREMIUM_YEARLY` | lib/stripe.ts | `''` |
| `STRIPE_PRICE_EXTRACTION_SINGLE` | lib/stripe.ts | `''` |
| `STRIPE_PRICE_EXTRACTION_BULK` | lib/stripe.ts | `''` |
| `STRIPE_PRICE_EXTRACTION_OPUS` | lib/stripe.ts | `''` |
| `STRIPE_PRICE_EXTRA_USER` | lib/stripe.ts | `''` |
| `STRIPE_PRICE_EXTRA_COMPANY` | lib/stripe.ts | `''` |
| `STRIPE_PRICE_RANDOMIZER` | lib/stripe.ts | `''` |
| `STRIPE_PRICE_CREDITS_50` | subscription/credits | `''` |
| `STRIPE_PRICE_CREDITS_200` | subscription/credits | `''` |
| `MONETIZATION_ENABLED` | plan-gate.ts | `false` (OK) |

### NEDOKUMENTOVANÉ — nově přidané dnes:
| Proměnná | Commit | Soubory | Fallback |
|----------|--------|---------|----------|
| `NOTION_TOKEN` | f126409 (Notion sync) | lib/notion-sync.ts | **NE** |
| `NOTION_TASKS_DS_ID` | f126409 (Notion sync) | lib/notion-sync.ts | hardcoded UUID `1f8c49dc...` |
| `SETUP_SECRET` | 1a47d30 (H5 fix) | first-admin | **NE** |

### Další nedokumentované (existovaly dříve):
- `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `MOONSHOT_API_KEY`, `ZAI_API_KEY`, `GOOGLE_CLOUD_API_KEY`, `AI_EXTRACTION_PROVIDER`, `AI_EXTRACTION_MODEL`
- `RAYNET_API_KEY`, `RAYNET_EMAIL`, `RAYNET_INSTANCE_NAME`
- `TELEGRAM_BOT_TOKEN`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`

**Celkem nedokumentováno: 32+ proměnných** (z toho 3 CRITICAL)

---

## 3. Audit nových API routes

### Přehled:

| Route | force-dynamic | Auth | IDOR | Stav |
|-------|:---:|:---:|:---:|------|
| `/api/extraction/presence` | YES | YES | **PARTIAL** | IDOR na documentId |
| `/api/accountant/admin/knowledge-base` | YES | YES (admin) | OK | PATCH spread issue |
| `/api/client/tax-questionnaire` | YES | YES | YES | OK |
| `/api/accountant/.../tax-questionnaire` | YES | YES | **PARTIAL** | Chybí company scoping |
| `/api/client/onboarding-questionnaire` | YES | YES | YES | OK |
| `/api/accountant/.../onboarding-questionnaire` | YES | **PARTIAL** | **PARTIAL** | GET/POST nemá user_id |
| `/api/cron/notion-sync` | YES | YES (CRON_SECRET) | N/A | OK, v PUBLIC_PATHS |
| `/api/accountant/agreements/pdf` | YES | YES | **MISSING** | IDOR na employee_id |

### Detailní nálezy:

#### AUDIT-01: IDOR — agreements/pdf (HIGH)
- **Soubor:** `app/api/accountant/agreements/pdf/route.ts`
- **Problém:** Route přijímá `employee_id` z query param, fetchuje zaměstnance bez ověření že patří k firmě aktuálního účetního. Jakýkoli staff user může generovat PDF pro jakéhokoli zaměstnance v systému.
- **Fix:** Po fetchnutí employee ověřit `canAccessCompany(userId, userRole, employee.company_id)`.

#### AUDIT-02: IDOR — extraction/presence lock spoofing (HIGH)
- **Soubor:** `app/api/extraction/presence/route.ts`
- **Problém:** POST přijímá `documentId` z body bez ověření, že uživatel má přístup k dokumentu. Uživatel může zamknout cizí dokument.
- **Fix:** Před lockem ověřit přístup k dokumentu přes company_id.

#### AUDIT-03: Arbitrary field spread v PATCH (MEDIUM)
- **Soubor:** `app/api/accountant/admin/knowledge-base/route.ts`
- **Problém:** `{ ...updates, updated_at, updated_by }` — request body se přímo spreaduje do DB update. Admin může přepsat `created_by` nebo jiné interní sloupce.
- **Fix:** Použít ALLOWED_FIELDS whitelist.

#### AUDIT-04: Chybí company scoping na accountant routes (MEDIUM)
- **Soubory:** `accountant/.../tax-questionnaire`, `accountant/.../onboarding-questionnaire`
- **Problém:** `isStaffRole()` check bez ověření přiřazení ke company. V multi-accountant setupu assistant A vidí data firmy B.
- **Závisí na data modelu:** Pokud všichni staff vidí vše → OK. Pokud ne → chybí check.

#### AUDIT-05: GET/POST bez audit trail (LOW)
- **Soubor:** `accountant/.../onboarding-questionnaire`
- **Problém:** GET a POST nečtou `x-user-id` — žádný audit trail kdo vytvořil/četl.

### Middleware PUBLIC_PATHS — OK
Všechny cron routes jsou v PUBLIC_PATHS. `/api/cron/notion-sync` přidán správně. Cron routes mají vlastní Bearer token check (`CRON_SECRET`).

---

## 4. Changelog — 2026-03-15

### Nové funkce
| Commit | Popis |
|--------|-------|
| `9829021` | Interaktivní onboarding dotazník klienta |
| `3f092f4` | Generátor PDF pro DPP/DPČ dohody + download button |
| `5153063` | Znalostní báze — kompletní obsah (22 nových článků) |
| `97e709b` | Modul dohodáři — evidence DPP/DPČ, daňová kalkulačka, info sekce |
| `38ec252` | Účetnický pohled na daňový dotazník |
| `f126409` | Notion↔App bidirectional task sync bridge |
| `878cad3` | Klientská stránka daňového dotazníku |
| `2c7ec58` | Daňový dotazník — DB migrace + API + definice otázek |
| `9c61525` | Realtime presence v sekci vytěžování dokladů |
| `822d8c0` | Stripe setup — přemapování 7 plánů na 6 nových tarifů |

### Refaktoring a cleanup
| Commit | Popis |
|--------|-------|
| `54573ba` | Replace console.log with structured logging |
| `e7ac471` | Extract types from kimi-ai.ts → lib/types/extraction.ts |
| `caed883` | Merge two CollapsibleSection components into one |
| `bbb5fc7` | Consolidate formatCurrency/formatDate into lib/utils.ts |
| `f1ecbd6` | Remove dead /api/accountant/extraction/approve endpoint |
| `363da34` | Remove 10 unused dependencies |
| `37b7c80` | Remove 7 orphan lib/types/scripts files (dead code) |
| `892d497` | Remove 24 orphan component files (dead code) |

### Security fixy
| Commit | Popis |
|--------|-------|
| `4c4c70a` | H2: Impersonate cookie — httpOnly + HMAC podpis |
| `1a47d30` | H5: Zabezpečení setup/first-admin endpointu |
| `b4d457c` | H3: Cron endpointy — secret z URL do Bearer header |
| `fdb059f` | H7+H1: Role check na case-types POST + oprava cron auth bypass |
| `17b0f0c` | Security fixes: 8 kritických nálezů z QA review |

### Bugfixy a UX vylepšení
| Commit | Popis |
|--------|-------|
| `9c61637` | Navigace: přidán odkaz na Dotazník v klientském menu |
| `a8e7fc9` | Znalostní báze do hlavního menu |
| `5e2fd8e` | Oprava approve + cleanup test dat |
| `fd740e6` | Fix 6 problémů: blikání extraction, profil, test data |
| `c1fa4f5` | Extraction verify: 7 oprav |
| `64160be` | Extraction UX Redesign: komprese layout, split 2:1, Pohoda XML |
| `e955ef7` | Extraction UX Fáze 3: JSON view, rename, count fix |
| `eb41238` | Fix: TooltipProvider wraps celý accountant layout |
| `1d78e54` | Extraction UX Fáze 2: workflow, progress, editace |
| `d44282f` | Fix extraction UX: jedno tlačítko, auth, reset |
| `27dc800` | Extraction UX + pipeline opravy |
| `f327486` | QA: E2E testy monetizace + code review + build fix |
| `25646ab` | Monetizace Fáze 4-6: cenová strategie + pricing + credits |
| `1f57e17` | Travel AI Randomizer — generování cest |

### Statistiky dne
| Metrika | Hodnota |
|---------|---------|
| Celkem commitů | 35 |
| Nové funkce | 10 |
| Refaktoring/cleanup | 8 |
| Security fixy | 5 |
| Bugfixy/UX | 12 |
| Nové migrace | 4 |
| Smazané soubory | 41+ (dead code) |
| Smazané závislosti | 10 |

---

## 5. Shrnutí — akční body

### CRITICAL
1. ~~AUTH_SECRET chybí v .env.local.example~~ — **stávající problém z debug-report D-02**

### HIGH (nové nálezy)
1. **AUDIT-01:** IDOR v agreements/pdf — employee_id bez company access check
2. **AUDIT-02:** IDOR v extraction/presence — documentId lock bez access check
3. **32 env variables nedokumentováno** v .env.local.example

### MEDIUM
4. **AUDIT-03:** Knowledge base PATCH — arbitrary field spread
5. **AUDIT-04:** Accountant questionnaire routes — chybí company scoping
6. **onboarding_questionnaires.sql** — chybí ON DELETE CASCADE na company_id FK

### LOW
7. **AUDIT-05:** Onboarding questionnaire GET/POST — chybí audit trail (x-user-id)
