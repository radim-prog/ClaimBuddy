# Chybějící integrace — UcetniWebApp
**Datum:** 2026-03-16
**Kategorie:** architektura

---

## Legenda
- ✅ Funguje — všechny env vars nastaveny
- ⚠️ Částečně — kód existuje, chybí konfigurace
- ❌ Nefunguje — kritické env vars chybí
- 🚫 Neexistuje — žádný kód, žádná reference

---

## PŘEHLED STAVU

| Integrace | Stav | Co chybí | Priorita |
|-----------|------|----------|----------|
| Google Drive | ✅ | nic | — |
| Raynet CRM | ✅ | nic | — |
| Stripe (základní) | ✅ | nic | — |
| Gmail OAuth | ✅ | nic | — |
| OSRM (routing) | ✅ | nic, veřejné API | — |
| Supabase | ✅ | nic | — |
| OpenAI / Anthropic | ✅ | nic | — |
| Ecomail | ❌ | 7 env vars + nastavení v Ecomailu | P0 — emailová komunikace nefunguje |
| SendGrid (fallback) | ❌ | API klíč | P0 — alternativní email nefunguje |
| Signi.com | ❌ | API klíč + migrace nespuštěna | P1 — e-podpisy nefungují |
| Telegram notifikace | ⚠️ | TELEGRAM_BOT_TOKEN | P1 — připomínky klientům nefungují |
| WhatsApp (Evolution) | ⚠️ | EVOLUTION_API_KEY + instance running | P2 — zatím nepoužíváno aktivně |
| Notion sync | ⚠️ | NOTION_TOKEN | P2 — cron selže |
| Stripe (nové funkce) | ⚠️ | 9 price IDs | P2 — extraction/travel platby nefungují |
| Twilio | ⚠️ | TWILIO_AUTH_TOKEN | P3 — jen webhook validace |
| TELFA.cz | 🚫 | žádný kód, žádná reference | — nevyžaduje akci |

---

## DETAILY

---

### 1. Signi.com (E-podpisy) — ❌ NEFUNGUJE

**Kód:** `lib/signi-client.ts`, `app/accountant/signing/`, `app/api/signing/`, `components/admin/signi-settings.tsx`

**Co se rozbilo:**
1. **Migrace nebyla aplikována** — sloupec `users.signi_api_key` neexistuje v DB! Migration soubor `20260316_signing.sql` obsahuje `ALTER TABLE users ADD COLUMN IF NOT EXISTS signi_api_key TEXT` ale nebyla push-nuta do Supabase.
2. **`SIGNI_API_KEY`** chybí v `.env.local` (globální fallback klíč)

**Jak funguje architektura:**
- Každý uživatel (účetní) může mít vlastní Signi API klíč uložený v `users.signi_api_key`
- Env var `SIGNI_API_KEY` je globální fallback pro celou firmu
- `SIGNI_API_URL` = optional, defaultně `https://api.signi.com/api/v1`

**Co Radim musí udělat:**
```
1. Spustit migraci v Supabase SQL Editoru:
   ALTER TABLE users ADD COLUMN IF NOT EXISTS signi_api_key TEXT;

2. Vytvořit účet na signi.com
3. Vygenerovat API klíč v administraci Signi
4. Přidat do .env.local:
   SIGNI_API_KEY=sk_...
```

**Adresa docs:** https://helpdesk.signi.com/en/support/solutions/articles/201000062743

---

### 2. TELFA.cz — 🚫 ŽÁDNÁ REFERENCE

V celé codebase (`app/`, `lib/`, `components/`) **není ani jedna zmínka o TELFA.cz**.
Integrace zatím neexistuje. Nevyžaduje akci.

---

### 3. Ecomail — ❌ KRITICKÉ (emailová komunikace nefunguje)

**Kód:** `lib/ecomail-client.ts`, `lib/email-service.ts`, `lib/marketing-service.ts`, `app/api/cron/sync-ecomail-contacts/`

**Email service fallback logika:**
1. Pokus Ecomail (transactional) → pokud `ECOMAIL_API_KEY` chybí → fallback
2. Pokus SendGrid → pokud `SENDGRID_API_KEY` chybí → fallback
3. Log-only (nic se neposílá!)

**Aktuálně:** Ani Ecomail ani SendGrid není nakonfigurován → žádné emaily se neposílají.

**Chybějící env vars:**
```
ECOMAIL_API_KEY=           # API klíč z Ecomail administrace → Nastavení → API
ECOMAIL_LIST_ID_ACCOUNTANTS= # ID seznamu pro účetní (číslo, např. 42)
ECOMAIL_LIST_ID_CLIENTS=     # ID seznamu pro klienty
ECOMAIL_AUTOMATION_ONBOARDING=  # ID automatizace → welcome email
ECOMAIL_AUTOMATION_TRIAL=       # ID automatizace → trial expiry
ECOMAIL_AUTOMATION_UPSELL=      # ID automatizace → upgrade reminder
ECOMAIL_AUTOMATION_WINBACK=     # ID automatizace → winback
EMAIL_FROM_NOREPLY=noreply@ucetnios.cz  # nebo jiná adresa
```

**Co Radim musí udělat:**
```
1. Přihlásit se na ecomail.cz
2. Vytvořit 2 subscriber lists: "Účetní" a "Klienti"
3. Nastavit → API → zkopírovat API klíč
4. Vytvořit 4 automatizace (nebo přeskočit a dát prázdné hodnoty)
5. Přidat do .env.local (a na Vercel)
```

**Alternativa:** Nastavit jen SendGrid jako rychlé řešení:
```
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=noreply@ucetnios.cz
```

---

### 4. WhatsApp via Evolution API — ⚠️ NEAKTIVNÍ

**Kód:** `lib/whatsapp.ts`, `lib/reminder-engine.ts`

**Architektura:** Self-hosted Evolution API v2 na `evolution.zajcon.cz`

**Chybějící env vars:**
```
EVOLUTION_API_KEY=     # API klíč Evolution instance
EVOLUTION_API_URL=https://evolution.zajcon.cz  # (optional, je to default)
EVOLUTION_INSTANCE=ucetni-webapp               # (optional, je to default)
```

**Stav:** Kód existuje, WhatsApp zprávy jsou volitelné v reminder-engine. Pokud EVOLUTION_API_KEY chybí, kód hodí error ale nepadne celá appka.

**Co Radim musí udělat:**
```
1. Ověřit, že evolution.zajcon.cz běží (curl https://evolution.zajcon.cz/manager)
2. Přihlásit se do Evolution API manageru
3. Zkopírovat API klíč (Global API Key nebo instance token)
4. Ověřit, že instance "ucetni-webapp" existuje a je připojená k WhatsApp
5. Přidat EVOLUTION_API_KEY do .env.local
```

---

### 5. Google Drive — ✅ FUNGUJE

**Nastavené vars:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, `GOOGLE_DRIVE_ROOT_FOLDER_ID`

Integrace by měla fungovat. Cron `/api/cron/drive-sync` běží pravidelně.

---

### 6. Raynet CRM — ✅ FUNGUJE

**Nastavené vars:** `RAYNET_API_KEY`, `RAYNET_EMAIL`, `RAYNET_INSTANCE_NAME`

Cron sync každých 5 min (8-20h). Auto-create BCs 1. den měsíce. OK.

---

### 7. Stripe — ✅ ZÁKLADNÍ / ⚠️ NOVÉ FUNKCE CHYBÍ

**Základní monetizace:** FUNGUJE — `STRIPE_SECRET_KEY` (sk_live_...) ✅, webhook secret ✅, 10 základních price IDs ✅

**Chybí price IDs pro nové funkce:**
```
# Vytěžování dokumentů
STRIPE_PRICE_EXTRACTION_SINGLE=price_xxx  # 1 extrakce
STRIPE_PRICE_EXTRACTION_BULK=price_xxx    # balíček extrakcí
STRIPE_PRICE_EXTRACTION_OPUS=price_xxx    # Opus model extrakce

# Extra kapacity
STRIPE_PRICE_EXTRA_USER=price_xxx         # přidání uživatele
STRIPE_PRICE_EXTRA_COMPANY=price_xxx      # přidání firmy

# Kniha jízd
STRIPE_PRICE_TRAVEL_YEARLY_SINGLE=price_xxx  # 399 Kč/rok - 1 vozidlo
STRIPE_PRICE_TRAVEL_YEARLY_FLEET=price_xxx   # 599 Kč/rok - více vozidel
STRIPE_PRICE_TRAVEL_REGEN=price_xxx          # 199 Kč - regenerace cesty

# AI Travel Randomizer
STRIPE_PRICE_RANDOMIZER=price_xxx         # jednorázový purchase
```

**Co Radim musí udělat:**
```
1. Stripe Dashboard → Products → Create product pro každý typ
2. Zkopírovat price IDs (price_xxx) do .env.local a Vercel env vars
```

---

### 8. Gmail OAuth — ✅ FUNGUJE

Sdílí OAuth credentials s Google Drive (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`). Cron fetch-emails / fetch-document-emails by měl fungovat.

---

### 9. Notion Sync — ⚠️ NEFUNGUJE (NOTION_TOKEN chybí)

**Kód:** `lib/notion-sync.ts`, `app/api/cron/notion-sync/route.ts`

**Chybí:**
```
NOTION_TOKEN=secret_xxx   # Notion integration token (REQUIRED)
NOTION_TASKS_DS_ID=...    # ID datasource v Notion (má hardcoded default: 1f8c49dc...)
```

**Co Radim musí udělat:**
```
1. Notion → Settings → Integrations → New integration → zkopírovat token
2. Sdílet příslušnou Notion databázi s integrací
3. Přidat NOTION_TOKEN do .env.local
```

---

### 10. OSRM (routing pro knihu jízd) — ✅ FUNGUJE

**Kód:** `lib/distance-client.ts`

Používá veřejné API `router.project-osrm.org` + Nominatim geocoding. Žádný API klíč nepotřeba. DB cache zabraňuje zbytečným voláním.

---

### 11. Telegram notifikace — ⚠️ NEFUNGUJE

**Kód:** `lib/telegram.ts`, `lib/reminder-engine.ts`, `app/api/cron/generate-notifications/route.ts`, klientský profil `app/client/account/page.tsx`

Klienti mohou v nastavení zadat Telegram chat ID pro notifikace. Bez `TELEGRAM_BOT_TOKEN` funkce selže tiše (warn log, ne crash).

**Chybí:**
```
TELEGRAM_BOT_TOKEN=123456789:AAFxxx   # token z @BotFather
```

**Co Radim musí udělat:**
```
1. Telegram → @BotFather → /newbot → zkopírovat token
2. Přidat TELEGRAM_BOT_TOKEN do .env.local
```

---

### 12. Document Inbox Email — ⚠️ CHYBÍ

**Kód:** `/api/cron/fetch-document-emails`

```
DOCUMENT_INBOX_EMAIL=doklady@ucetnios.cz  # adresa pro příjem dokumentů emailem
```

Bez tohoto nastavení cron neví na jakou schránku koukat.

---

## SHRNUTÍ AKCÍ PRO RADIMA

### P0 — Email nefunguje (žádné emaily se neposílají)
```bash
# Varianta A — Ecomail (doporučeno)
ECOMAIL_API_KEY=xxx
ECOMAIL_LIST_ID_ACCOUNTANTS=xxx
ECOMAIL_LIST_ID_CLIENTS=xxx
ECOMAIL_AUTOMATION_ONBOARDING=xxx  # nebo prázdné
ECOMAIL_AUTOMATION_TRIAL=xxx       # nebo prázdné
EMAIL_FROM_NOREPLY=noreply@ucetnios.cz

# Varianta B — SendGrid (rychlé řešení)
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=noreply@ucetnios.cz
```

### P1 — Signi.com (e-podpisy)
```bash
# 1. Spustit v Supabase SQL Editoru:
ALTER TABLE users ADD COLUMN IF NOT EXISTS signi_api_key TEXT;

# 2. Do .env.local:
SIGNI_API_KEY=xxx  # z signi.com → Nastavení → API
```

### P1 — Telegram notifikace
```bash
TELEGRAM_BOT_TOKEN=xxx  # z @BotFather v Telegramu
```

### P2 — Notion sync
```bash
NOTION_TOKEN=secret_xxx  # z Notion → Settings → Integrations
```

### P2 — Nové Stripe price IDs (9 produktů)
```bash
# Vytvořit v Stripe Dashboard → Products
STRIPE_PRICE_EXTRACTION_SINGLE=price_xxx
STRIPE_PRICE_EXTRACTION_BULK=price_xxx
STRIPE_PRICE_EXTRACTION_OPUS=price_xxx
STRIPE_PRICE_EXTRA_USER=price_xxx
STRIPE_PRICE_EXTRA_COMPANY=price_xxx
STRIPE_PRICE_TRAVEL_YEARLY_SINGLE=price_xxx
STRIPE_PRICE_TRAVEL_YEARLY_FLEET=price_xxx
STRIPE_PRICE_TRAVEL_REGEN=price_xxx
STRIPE_PRICE_RANDOMIZER=price_xxx
```

### P2 — WhatsApp (Evolution)
```bash
EVOLUTION_API_KEY=xxx  # z evolution.zajcon.cz manageru
# Ověřit, že instance "ucetni-webapp" je připojená
```

### P3 — Ostatní (nice-to-have)
```bash
NEXT_PUBLIC_APP_URL=https://app.zajcon.cz  # má fallback, ale lepší explicitně
DOCUMENT_INBOX_EMAIL=doklady@ucetnios.cz
TWILIO_AUTH_TOKEN=xxx  # jen pro webhook validaci Twilio
```

---

## CO SE DĚJE PO NASAZENÍ (VERCEL)
Nezapomenout přidat VŠECHNY env vars také do Vercel dashboardu:
`vercel.com → zajcon-ucetni → Settings → Environment Variables`

Po přidání env vars je nutný **redeploy** aby se projevily.
