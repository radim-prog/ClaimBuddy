# PRD: ClaimBuddy MVP — noc 11.→12. 5. 2026

**Stav:** smoke OK (admin + klient E2E projde), čeká na finální verifikaci 05:30
**Deadline:** 06:00 12. 5. 2026
**Branch:** `mvp-3-klienti` (z `main` 21cbe23)
**Workdir:** `/root/Projects/ClaimBuddy/`
**Důležité:** `UctoApp (app.zajcon.cz)` zůstává **NEDOTČENÝ**. Žádný PR na UcetniWebApp repo.

## SCOPE UPDATE 22:30 (Radim → Jarvis)

- ❌ NEseedovat 3 klienty — klienti se registrují **sami**.
- ✅ Pouze 1× admin Radim seedován z env.
- ✅ Úplná separace od UctoApp — žádný fetch na `app.zajcon.cz/api/bridge` (cross-check: žádný nebyl).
- ❌ Žádný Stripe / placení v MVP — gated přes `STRIPE_DISABLED=true`.
- ✅ Po registraci klient ihned viditelný adminem (bez schvalovací fronty).

---

## 1. Cíl

claims.zajcon.cz dokončit do MVP stavu, aby 3 reální klienti mohli ráno použít:

- **Admin (Radim):** přihlášení, vidí seznam klientů, otevře spis, založí spis, nahraje doklad.
- **Klient:** přihlášení, vidí své spisy + dokumenty.

Žádné AI, Stripe, marketplace, e-mail notifikace, číselníky pojišťoven UI, stats — viz „Out of scope".

## 2. Současný stav (zachycený 22:30)

- ClaimBuddy běží jako systemd `claimbuddy-webapp.service` (port 3020, NODE_ENV=production)
- Caddy routuje `claims.zajcon.cz → 127.0.0.1:3020`
- Vlastní lokální Supabase (port 55421 API, 55422 DB) — kontejnery `supabase_db_claimbuddy-local` & spol.
- `middleware.ts` má `CLAIMS_REWRITES` mapu pro `/dashboard`, `/cases`, `/insurers`, …, ale **chybí `/admin`** → request padá do default větve a redirect-307 na `/dashboard`.
- Auth: vlastní HMAC-signed JSON token v cookie `auth_token`, hesla PBKDF2 SHA-512 (100k iter, 16B salt, 64B key) — viz `lib/auth.ts`.
- Bridge `app.zajcon.cz/api/bridge/companies` zůstává funkční read-only doplněk.

## 3. Funkční požadavky (MVP scope)

### FR-1: `/admin` rewrite na admin dashboard
- `claims.zajcon.cz/admin` → rewrite na `/accountant/claims/dashboard` (NE redirect)
- Po loginu admin přistupuje přes `/admin` URL i `/dashboard` URL (alias).
- Implementace: doplnit `'/admin': '/accountant/claims/dashboard'` do `CLAIMS_REWRITES` v `middleware.ts`.

### FR-2: ~~Seed 3 klientů~~ → Seed pouze admin Radim
**SCOPE UPDATE:** klienti se registrují sami (FR-2-bis). Seed skript zůstává idempotentní pro admin radim. Test klienti `klient1/2/3` byli smazáni.

- 1× admin (role=`admin`, login=`radim`, heslo z `MVP_ADMIN_PASSWORD` env)
- Skript: `scripts/seed-mvp-clients.ts` — pokud znovu spuštěno, vytvoří jen admin (ostatní bloky idempotentně přeskočí pokud klienti neexistují → byli smazaní)

### FR-2-bis: Klient se registruje sám (`/auth/register`)
- Form: jméno, email, heslo, potvrzení hesla, GDPR checkbox
- Žádné email verification v MVP (`MVP_AUTO_ACTIVATE=true` env)
- Po INSERT user se rovnou:
  - status = `active`
  - vytvoří se placeholder `companies` row (`name = "${user.name} — klient"`, `owner_id`, `source_system=claimbuddy`, `status=active`, `email`)
  - vytvoří se `client_users` mapping (`role=owner`)
  - link na existující `insurance_cases` s odpovídajícím `contact_email`
  - vystaví se JWT cookie `auth_token` a redirect na `/client/claims`

### FR-2-ter: Žádné Stripe / placení
- `STRIPE_DISABLED=true` v `/etc/claimbuddy-webapp.env`
- `POST /api/stripe/checkout` a `POST /api/stripe/addon-checkout` → 503 s českou zprávou
- `/pricing` stránka nahrazena jednoduchým info-boxem „Ceník zatím nezveřejňujeme"

### FR-3: Admin flow funguje
- Login `radim` / heslo → cookie `auth_token` → redirect na `/admin` → rewrite na `/accountant/claims/dashboard`
- Dashboard se načte (žádné AI processor errors, žádné Stripe fail)
- Sidebar → "Klienti" → vidí 3 klienty
- Klik na klienta → detail → vidí jeho 1 spis
- Tlačítko "Nový spis" funguje (vytvoří row v `insurance_cases`)
- Upload dokumentu (FormData → `/api/claims/cases/[id]/documents` nebo podobné)

### FR-4: Klient flow funguje
- Login `klient1@example.com` / vygenerované heslo → cookie → redirect na `/client/claims`
- Vidí svůj 1 spis
- Klik na spis → vidí dokumenty
- (Žádný upload pro klienta v MVP — to ráno doplníme pokud bude čas)

### FR-5: Build + restart + smoke
- `npm run build` proběhne bez chyb
- `systemctl restart claimbuddy-webapp` + ověření `systemctl is-active`
- Smoke: `curl https://claims.zajcon.cz/` HTTP 200, `/admin` HTTP 200 (po loginu), `/dashboard` HTTP 200
- Playwright: pokud zvládnu, login admin + klient sekvence

## 4. Out of scope (mohou být rozbité, neopravuji)

- AI processor (`claims-ai-processor.ts`)
- Stripe checkout / pricing flow
- Insurers UI (číselník pojišťoven)
- Stats dashboard (`/stats`)
- E-mailové notifikace (cron, fetch-emails)
- Marketplace + reviews

Pokud nějaký z těchto modulů hodí 500 a způsobí, že admin/klient flow padne → vypnu ho feature flagem (env či DB), neopravuju ho.

## 5. Technický plán (kroky)

### Krok 1: Middleware fix (10 min)
- Edit `middleware.ts`: přidat `/admin` do `CLAIMS_REWRITES`.

### Krok 2: Seed script (40 min)
- `scripts/seed-mvp-clients.ts`
- Připravit fixturní data (placeholders pokud Radim nedodá)
- Volat přes `CLAIMS_SUPABASE_URL=http://127.0.0.1:55421` + service role key z `/etc/claimbuddy-webapp.env`
- Vypsat tabulku přihlašovacích údajů na stdout

### Krok 3: Spustit seed (10 min)
- `npx tsx scripts/seed-mvp-clients.ts`
- Ověřit v Supabase Studio (port 55423) že data jsou tam

### Krok 4: Smoke admin flow (30 min)
- Spustit dev server na `:3099` (separate od production 3020)
- Playwright: login Radim → /admin → /dashboard → klienti → detail → nový spis → upload
- Pokud něco vyhodí 500, zalogovat + opravit (fallback: vypnout problematickou sekci)

### Krok 5: Smoke klient flow (15 min)
- Stejně přes Playwright, klient1

### Krok 6: Build + production restart (15 min)
- `npm run build`
- `systemctl restart claimbuddy-webapp` + `systemctl is-active`
- `curl claims.zajcon.cz/` → 200
- Smoke na produkčním procesu

### Krok 7: Hlas Jarvisovi po milestonu (continuous)
- PR otevřu jen pokud explicitně schválí (toto je interní úkol, ne UctoApp).

## 6. Open questions (vyřešit s Jarvisem do 23:00)

1. **Klientská data** (jména, IČO, email, telefon) — bez odpovědi do 23:30 jedu placeholders + memory note „aktualizovat ráno".
2. **Auth model** — SSO přes .zajcon.cz cookie sdílený s app.zajcon.cz, nebo claims-only login? Default jdu **samostatný** (cookie `auth_token` na `claims.zajcon.cz` domain).

## 7. Rollback plán

Při fatálním selhání:
1. `git -C /root/Projects/ClaimBuddy reset --hard 21cbe23` (Release 1.0.0)
2. `systemctl restart claimbuddy-webapp` (z čisté větve)
3. Nejhorší case: Caddy reload s `claims.zajcon.cz → localhost:3003` → UctoApp převezme (404 ale lépe než 500)

## 8. Timeline (skutečný průběh)

| Čas | Milestone | Stav |
|---|---|---|
| 22:30 | PRD draft | ✅ |
| 22:35 | Middleware `/admin` fix | ✅ |
| 22:40 | Seed admin (test klienti smazáni) | ✅ |
| 22:45 | Register flow rewrite (auto-active + auto-login + placeholder company) | ✅ |
| 22:50 | Stripe gate (`STRIPE_DISABLED`) + pricing info-box | ✅ |
| 22:55 | Build + restart claimbuddy-webapp | ✅ |
| 23:00 | Smoke admin + klient E2E na claims.zajcon.cz | ✅ |
| 23:05 | Matrix endpoint: odstranění filtru "jen firmy s case" → klienti viditelní | ✅ |
| 23:10 | PRD update + Jarvis milestone hlas | ✅ |
| 05:30 | Final readiness check | ⏳ |
| 06:00 | DEADLINE | ⏳ |

## 9. Co Jarvis ode mě dostane

- Hlas po každém milestonu (Plan / PRD / impl / restart / smoke)
- Tabulka login credentials pro 3 klienty + Radim admin (pošlu jako příloha v zprávě)
- Diff PR-stylem pokud bych chtěl review, jinak interní branch zůstane (Jarvis řekne)

## 10. Notes

- Neměnit `UctoApp/`, `/api/bridge/*` zůstává read-only.
- Nesahat na produkční DB `app.zajcon.cz` (porty 54331-54333).
- Lokální Supabase ClaimBuddy je 55421-55423 — VŠECHNY změny tam.
