# Debug Report — UcetniWebApp

**Datum:** 2026-03-15
**Typ:** READ-ONLY analýza — žádné změny provedeny

---

## Shrnutí

Identifikováno **12 problémů**, z toho 1 kritický, 3 vysoké priority.

---

## CRITICAL

### D-01: Role `assistant` chybí v DB CHECK constraint
- **Soubor:** `supabase/schema.sql:21`
- **Problém:** `CHECK (role IN ('client', 'accountant', 'admin'))` — chybí `'assistant'`
- **Dopad:** INSERT uživatele s rolí `assistant` selže s constraint violation. Všechen kód používající `assistant` (middleware.ts, plan-gate.ts, permissions.ts, 10+ API routes) je de facto nedostupný.
- **Migrace:** Žádná z 23 migrací neopravuje tento constraint (některé ho používají, ale žádná ho nerozšiřuje).
- **Fix:**
  ```sql
  ALTER TABLE public.users DROP CONSTRAINT users_role_check;
  ALTER TABLE public.users ADD CONSTRAINT users_role_check
    CHECK (role IN ('client', 'accountant', 'admin', 'assistant'));
  ```
- **Verifikace:** `\d public.users` na živé DB pro ověření aktuálního stavu constraintu.

---

## HIGH

### D-02: 17 nedokumentovaných environment variables
- **Soubor:** `.env.local.example`
- **Problém:** Dokumentuje jen 6 z 23+ potřebných proměnných. Chybí:
  - `AUTH_SECRET` — **KRITICKÁ** — middleware hází exception při startu bez ní
  - `MONETIZATION_ENABLED`
  - `CRON_SECRET`
  - 12× `STRIPE_*` (secret key, webhook secret, 10 price IDs)
  - 2× `STRIPE_PRICE_CREDITS_*`
- **Dopad:** Nový vývojář nemůže spustit aplikaci.
- **Fix:** Doplnit všechny proměnné s komentáři do `.env.local.example`.

### D-03: Register/Login architektonický nesoulad
- **Soubory:** `app/auth/register/actions.ts` vs `app/api/auth/login/route.ts`
- **Problém:** Registrace používá `supabase.auth.signUp()` (Supabase Auth), login používá custom JWT z tabulky `users`. Nově registrovaný uživatel se pravděpodobně nemůže přihlásit.
- **Dopad:** Nefunkční registrační flow. Pricing page (/pricing) linkuje na register (4 místa).
- **Fix:** Přepsat register na custom JWT systém (vytvořit záznam v `users` tabulce s PBKDF2 hash).

### D-04: `@supabase/ssr@0.0.10` — zastaralý balíček
- **Soubor:** `package.json`
- **Problém:** Nainstalována verze 0.0.10, aktuální je 0.5+. API se změnilo.
- **Dopad:** Dokumentace neodpovídá nainstalované verzi. Bezpečnostní riziko.
- **Fix:** Upgrade na 0.5.x (může vyžadovat úpravy v `lib/supabase-server.ts`).

---

## MEDIUM

### D-05: Next.js 14.1.0 — známé security vulnerabilities
- **Soubor:** `package.json`
- **Problém:** Verze 14.1.0 má známé cache poisoning a SSRF zranitelnosti.
- **Fix:** Upgrade na nejnovější 14.2.x patch nebo 15.x.

### D-06: In-memory rate limiting — nefunguje multi-instance
- **Soubor:** `middleware.ts:21`
- **Problém:** `const hits = new Map<string, number[]>()` — resetuje se při restartu, v multi-instance deployment efektivně vydělený počtem instancí.
- **Fix:** Dokumentovat omezení nebo migrovat na Redis/Upstash.

### D-07: Non-httpOnly impersonation cookie
- **Soubor:** `app/api/auth/impersonate/route.ts:35`
- **Problém:** Cookie `impersonate_company` je čitelná JavaScriptem. XSS + UUID = potenciální cílené dotazy.
- **Fix:** Dokumentovat riziko. Zvážit httpOnly + server-side čtení.

### D-08: Hardcoded hesla v e2e testech
- **Soubory:** `e2e/auth.setup.ts:8` (`admin123`), `app/api/setup/first-admin/route.ts:38` (`admin`)
- **Problém:** Hardcoded testovací hesla. First-admin endpoint vytváří admina s heslem `admin`.
- **Fix:** Načítat z env vars (`E2E_ADMIN_PASSWORD`). First-admin: vyžadovat heslo v request body.

---

## LOW

### D-09: `any` typy na 30+ místech
- **Soubory:** Stripe webhook, invoicing, client invoices, matrix, tasks routes
- **Problém:** Obcházejí TypeScript ochranu. Zvyšují riziko runtime chyb.
- **Fix:** Definovat konkrétní interfaces.

### D-10: E2E testy vázané na produkční data
- **Soubor:** `e2e/api-health.spec.ts:18`
- **Problém:** `expect(body.name).toBe('Radim')` — pevně kódovaný test na jméno.
- **Fix:** Ověřovat jen existenci pole, ne konkrétní hodnotu.

### D-11: First-admin endpoint bez ochrany
- **Soubor:** `app/api/setup/first-admin/route.ts`
- **Problém:** Endpoint vytváří admina s heslem 'admin' a nemá žádnou ochranu (není v PUBLIC_PATHS ale používá se před prvním loginem).
- **Fix:** Ověřit zda je po prvním použití zablokován. Pokud ne, přidat kontrolu `users.count === 0`.

### D-12: Promise.all bez individuálních catch
- **Soubor:** `app/api/accountant/matrix/route.ts:13`
- **Problém:** 3 paralelní DB operace — pokud jedna selže, celá route selže.
- **Fix:** Zvážit `Promise.allSettled` nebo individuální try/catch.

---

## Statistiky

| Severity | Počet |
|----------|-------|
| Critical | 1 |
| High | 3 |
| Medium | 4 |
| Low | 4 |
| **Celkem** | **12** |

---

## Doporučené pořadí oprav

1. D-01 (DB constraint) — Critical, jednoduchý fix
2. D-02 (.env.local.example) — High, dokumentační fix
3. D-03 (Register flow) — High, vyžaduje přepis
4. D-04 (@supabase/ssr upgrade) — High, package update
5. D-05 (Next.js upgrade) — Medium, package update
6. D-06–D-08 — Medium, inkrementální opravy
7. D-09–D-12 — Low, code quality
