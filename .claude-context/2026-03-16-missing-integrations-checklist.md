# Chybějící integrace — UcetniWebApp
**Datum:** 2026-03-16
**Kategorie:** architektura
**Metoda:** porovnání `.env.local` vs `.env.local.example` + analýza kódu

---

## Auth / Security

### AUTH_SECRET
- **Stav:** ✅ Nakonfigurováno
- **Env vars:** `AUTH_SECRET`
- **Co Radim musí udělat:** nic

### CRON_SECRET
- **Stav:** ✅ Nakonfigurováno
- **Env vars:** `CRON_SECRET`
- **Co Radim musí udělat:** nic

### SETUP_SECRET
- **Stav:** ❌ Chybí
- **Env vars:** `SETUP_SECRET`
- **Kde se volá:** `app/api/setup/first-admin/route.ts` — jednorázový endpoint pro vytvoření prvního admina
- **Co Radim musí udělat:**
  ```
  openssl rand -hex 16
  → přidat do .env.local: SETUP_SECRET=<výsledek>
  ```
  *(Nízká priorita — admin už existuje, endpoint se nepoužívá dál)*

---

## Supabase

### Supabase (DB + auth)
- **Stav:** ✅ Nakonfigurováno
- **Env vars:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- **Co Radim musí udělat:** nic

---

## Stripe — Payments & Subscriptions

### Stripe (základní — live klíče)
- **Stav:** ✅ Nakonfigurováno (`sk_live_...`)
- **Env vars:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- **Co Radim musí udělat:** nic

### Stripe — základní subscription price IDs
- **Stav:** ✅ Nakonfigurováno
- **Env vars:** `STRIPE_PRICE_PROFI_MONTHLY/YEARLY`, `STRIPE_PRICE_BUSINESS_MONTHLY/YEARLY`, `STRIPE_PRICE_CLIENT_PLUS_MONTHLY/YEARLY`, `STRIPE_PRICE_CLIENT_PREMIUM_MONTHLY/YEARLY`, `STRIPE_PRICE_CREDITS_50`, `STRIPE_PRICE_CREDITS_200`
- **Co Radim musí udělat:** nic

### Stripe — nové addon price IDs
- **Stav:** ❌ Chybí (9 price IDs)
- **Env vars chybí:**
  ```
  STRIPE_PRICE_EXTRACTION_SINGLE   # 1 extrakce dokumentu
  STRIPE_PRICE_EXTRACTION_BULK     # balíček extrakcí
  STRIPE_PRICE_EXTRACTION_OPUS     # Opus model (drahá extrakce)
  STRIPE_PRICE_EXTRA_USER          # přidání uživatele nad limit
  STRIPE_PRICE_EXTRA_COMPANY       # přidání firmy nad limit
  STRIPE_PRICE_RANDOMIZER          # AI travel randomizer (jednorázový)
  STRIPE_PRICE_TRAVEL_YEARLY_SINGLE  # kniha jízd 1 vozidlo/rok (399 Kč)
  STRIPE_PRICE_TRAVEL_YEARLY_FLEET   # kniha jízd více vozidel/rok (599 Kč)
  STRIPE_PRICE_TRAVEL_REGEN          # regenerace cesty (199 Kč)
  ```
- **Kde se volá:** `lib/stripe.ts` — vracejí se jako `''` pokud chybí → zakáže purchase flow
- **Co Radim musí udělat:**
  ```
  1. Stripe Dashboard → Products → + Add product pro každý typ
  2. Nastavit cenu v CZK
  3. Zkopírovat price_xxx ID do .env.local + Vercel env vars
  ```

---

## AI / OCR Extraction

### OpenAI
- **Stav:** ✅ Nakonfigurováno
- **Env vars:** `OPENAI_API_KEY`, `AI_EXTRACTION_PROVIDER`, `AI_EXTRACTION_MODEL`
- **Co Radim musí udělat:** nic

### Anthropic Claude
- **Stav:** ✅ Nakonfigurováno
- **Env vars:** `ANTHROPIC_API_KEY`
- **Co Radim musí udělat:** nic

### Google Cloud AI
- **Stav:** ✅ Nakonfigurováno
- **Env vars:** `GOOGLE_CLOUD_API_KEY`
- **Co Radim musí udělat:** nic

### Kimi / Moonshot (bank statement OCR)
- **Stav:** ✅ Nakonfigurováno
- **Env vars:** `MOONSHOT_API_KEY`
- **Co Radim musí udělat:** nic

### Z.AI (OCR provider)
- **Stav:** ✅ Nakonfigurováno
- **Env vars:** `ZAI_API_KEY`
- **Co Radim musí udělat:** nic

### Google Gemini
- **Stav:** ⚠️ Chybí (ale zatím se nepoužívá — provider je openai/anthropic)
- **Env vars:** `GEMINI_API_KEY` (v .env.local.example, chybí v .env.local)
- **Kde se volá:** `lib/ai-extractor.ts` — pouze pokud `AI_EXTRACTION_PROVIDER=gemini`
- **Co Radim musí udělat:** nic zatím; přidat klíč až když bude potřeba Gemini

---

## Google Drive

### Google Drive (OAuth)
- **Stav:** ✅ Nakonfigurováno — kód používá OAuth2 (`GOOGLE_CLIENT_ID/SECRET/REFRESH_TOKEN`)
- **Env vars:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, `GOOGLE_DRIVE_ROOT_FOLDER_ID`
- **Co Radim musí udělat:** nic

> **Poznámka:** `.env.local.example` uvádí service account vars (`GOOGLE_DRIVE_CLIENT_EMAIL`, `GOOGLE_DRIVE_PRIVATE_KEY`) — ty jsou **zastaralé**. Kód (`lib/google-drive.ts`) používá OAuth2, ne service account. Příklad je zavádějící.

---

## Raynet CRM

### Raynet CRM
- **Stav:** ✅ Nakonfigurováno
- **Env vars:** `RAYNET_API_KEY`, `RAYNET_EMAIL`, `RAYNET_INSTANCE_NAME`
- **Co Radim musí udělat:** nic

---

## Notion

### Notion Task Sync
- **Stav:** ❌ Chybí
- **Env vars chybí:** `NOTION_TOKEN`
- **Env vars volitelné:** `NOTION_TASKS_DS_ID` (má hardcoded default `1f8c49dc953280c2a0f7f120d55aa0ee`)
- **Kde se volá:** `lib/notion-sync.ts`, `/api/cron/notion-sync` — cron selže s `Error: NOTION_TOKEN not configured`
- **Co Radim musí udělat:**
  ```
  1. notion.so → Settings → My connections → Develop or manage integrations
  2. + New integration → Internal → zkopírovat "Internal Integration Secret"
  3. Sdílet Notion databázi s touto integrací (Share → Invite)
  4. Přidat do .env.local:
     NOTION_TOKEN=ntn_xxx
  ```

---

## Email

### Ecomail (primární email provider)
- **Stav:** ❌ Chybí — **KRITICKÉ: žádné emaily se v produkci neposílají!**
- **Env vars chybí:** `ECOMAIL_API_KEY`
- **Env vars chybí (volitelné):** `ECOMAIL_LIST_ID_ACCOUNTANTS`, `ECOMAIL_LIST_ID_CLIENTS`, `ECOMAIL_AUTOMATION_ONBOARDING`, `ECOMAIL_AUTOMATION_TRIAL`, `ECOMAIL_AUTOMATION_UPSELL`, `ECOMAIL_AUTOMATION_WINBACK`
- **Kde se volá:** `lib/ecomail-client.ts`, `lib/email-service.ts` — fallback na SendGrid pokud chybí, pak jen log
- **Co Radim musí udělat:**
  ```
  1. Přihlásit se na ecomail.cz
  2. Nastavení → Správa účtu → Pro vývojáře → zkopírovat API klíč
  3. Subscriber lists → vytvořit "Účetní" a "Klienti" → zkopírovat ID
  4. Automations → vytvořit (nebo přeskočit, funkce funguje i bez nich)
  5. Přidat do .env.local:
     ECOMAIL_API_KEY=xxx
     ECOMAIL_LIST_ID_ACCOUNTANTS=42
     ECOMAIL_LIST_ID_CLIENTS=43
  ```

### SendGrid (fallback email provider)
- **Stav:** ❌ Chybí (záložní provider, pokud Ecomail selže)
- **Env vars chybí:** `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`
- **Kde se volá:** `lib/email-service.ts` — druhý fallback po Ecomailu
- **Co Radim musí udělat:**
  ```
  1. sendgrid.com → Settings → API Keys → Create API Key
  2. Přidat do .env.local:
     SENDGRID_API_KEY=SG.xxx
     SENDGRID_FROM_EMAIL=noreply@ucetnios.cz
  ```
  *(Alternativně stačí jen Ecomail — SendGrid je fallback)*

### EMAIL_FROM_NOREPLY
- **Stav:** ⚠️ Chybí (ale má fallback `noreply@ucetnios.cz`)
- **Env vars:** `EMAIL_FROM_NOREPLY`
- **Co Radim musí udělat:** přidat do .env.local pokud chce jiný from address

---

## Signi.com (E-podpisy)

### Signi.com
- **Stav:** ❌ Chybí — **PLUS: migrace nebyla aplikována do Supabase!**
- **Env vars chybí:** `SIGNI_API_KEY`
- **Env vars volitelné:** `SIGNI_API_URL` (default: `https://api.signi.com/api/v1`)
- **Kde se volá:** `lib/signi-client.ts`, `app/accountant/signing/`, `app/api/signing/`
- **Kritický problém:** Sloupec `users.signi_api_key` **neexistuje** v DB (migrace `20260316_signing.sql` nebyla aplikována)
- **Co Radim musí udělat:**
  ```
  1. NEJDŘÍV: Spustit v Supabase SQL Editoru:
     ALTER TABLE users ADD COLUMN IF NOT EXISTS signi_api_key TEXT;

  2. Vytvořit účet na signi.com/app
  3. Nastavení → API → vygenerovat klíč
  4. Přidat do .env.local:
     SIGNI_API_KEY=sk_live_xxx

  5. Volitelně: každý účetní si může nastavit vlastní klíč
     v profilech (users.signi_api_key v DB)
  ```

---

## Twilio (SMS)

### Twilio
- **Stav:** ⚠️ Částečně (TWILIO_AUTH_TOKEN je v kódu jen pro webhook validaci)
- **Env vars chybí:** `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
- **Kde se volá:** `app/api/webhooks/twilio/route.ts` — validace příchozích webhooků; `lib/reminder-engine.ts` — volitelné SMS
- **Co Radim musí udělat:**
  ```
  1. twilio.com → Console → Account SID + Auth Token
  2. Phone Numbers → koupit číslo
  3. Přidat do .env.local:
     TWILIO_ACCOUNT_SID=ACxxx
     TWILIO_AUTH_TOKEN=xxx
     TWILIO_PHONE_NUMBER=+420xxx
  ```
  *(Nízká priorita — SMS jsou volitelná notifikace)*

---

## Telegram (Notifikace)

### Telegram Bot
- **Stav:** ❌ Chybí
- **Env vars chybí:** `TELEGRAM_BOT_TOKEN`
- **Kde se volá:** `lib/telegram.ts`, `lib/reminder-engine.ts`, `/api/cron/generate-notifications` — selže tiše (warn log, neopadá appka)
- **Co Radim musí udělat:**
  ```
  1. Telegram → @BotFather → /newbot
  2. Zkopírovat token (formát: 123456789:AAFxxx)
  3. Přidat do .env.local:
     TELEGRAM_BOT_TOKEN=xxx
  ```

---

## WhatsApp (Evolution API)

### Evolution API / WhatsApp
- **Stav:** ⚠️ Částečně (kód existuje, default URL je `evolution.zajcon.cz`)
- **Env vars chybí:** `EVOLUTION_API_KEY`
- **Env vars volitelné (mají default):** `EVOLUTION_API_URL=https://evolution.zajcon.cz`, `EVOLUTION_INSTANCE=ucetni-webapp`
- **Kde se volá:** `lib/whatsapp.ts`, `lib/reminder-engine.ts`
- **Poznámka:** `.env.local.example` uvádí starší `WHATSAPP_TOKEN/PHONE_NUMBER_ID/VERIFY_TOKEN` — ty jsou zastaralé, kód používá Evolution API v2
- **Co Radim musí udělat:**
  ```
  1. Ověřit, že https://evolution.zajcon.cz běží
  2. Přihlásit se do Evolution API manageru
  3. Zkopírovat Global API Key
  4. Ověřit, že instance "ucetni-webapp" existuje a je připojená k WhatsApp (QR kód)
  5. Přidat do .env.local:
     EVOLUTION_API_KEY=xxx
  ```

---

## Ostatní

### Document Inbox Email
- **Stav:** ❌ Chybí
- **Env vars chybí:** `DOCUMENT_INBOX_EMAIL`
- **Kde se volá:** `/api/cron/fetch-document-emails` — adresa schránky pro automatické stahování dokladů z emailu
- **Co Radim musí udělat:** přidat emailovou adresu kam klienti posílají doklady

### NEXT_PUBLIC_APP_URL
- **Stav:** ⚠️ Chybí (ale kód má fallback `https://app.zajcon.cz`)
- **Kde se volá:** `lib/signi-client.ts`, `app/auth/register/`, `app/auth/forgot-password/`, `app/api/auth/verify/`
- **Co Radim musí udělat:**
  ```
  NEXT_PUBLIC_APP_URL=https://app.zajcon.cz
  ```

### OSRM (routing)
- **Stav:** ✅ Funguje — veřejné API, žádný klíč nepotřeba
- **Kde se volá:** `lib/distance-client.ts` — `router.project-osrm.org` + Nominatim

---

## SOUHRN — CO CHYBÍ V .env.local

| Var | Popis | Priorita |
|-----|-------|----------|
| `ECOMAIL_API_KEY` | Email provider — **nic se neposílá!** | 🔴 P0 |
| `SENDGRID_API_KEY` + `SENDGRID_FROM_EMAIL` | Fallback email | 🟠 P1 |
| `SIGNI_API_KEY` | E-podpisy + nutno aplikovat migraci | 🟠 P1 |
| `TELEGRAM_BOT_TOKEN` | Notifikace klientům | 🟠 P1 |
| `NOTION_TOKEN` | Sync tasků s Notion | 🟡 P2 |
| 9× `STRIPE_PRICE_*` | Extraction, travel, extras | 🟡 P2 |
| `EVOLUTION_API_KEY` | WhatsApp notifikace | 🟡 P2 |
| `DOCUMENT_INBOX_EMAIL` | Email inbox pro doklady | 🟡 P2 |
| `SETUP_SECRET` | Jednorázový admin setup | 🟢 P3 |
| `TWILIO_*` (3 vars) | SMS notifikace | 🟢 P3 |
| `NEXT_PUBLIC_APP_URL` | Má fallback, není kritické | 🟢 P3 |
| `GEMINI_API_KEY` | Zatím se nepoužívá | ⚪ nice-to-have |

## POZNÁMKA K .env.local.example
Příklad soubor je **zastaralý** ve dvou místech:
1. **Google Drive** — uvádí service account vars (`GOOGLE_DRIVE_CLIENT_EMAIL`, `GOOGLE_DRIVE_PRIVATE_KEY`) ale kód používá OAuth2 — tyto vars jsou zbytečné
2. **WhatsApp** — uvádí `WHATSAPP_TOKEN/PHONE_NUMBER_ID/VERIFY_TOKEN` ale kód používá Evolution API (`EVOLUTION_API_KEY`)

Doporučuji aktualizovat `.env.local.example` dle skutečného stavu kódu.
