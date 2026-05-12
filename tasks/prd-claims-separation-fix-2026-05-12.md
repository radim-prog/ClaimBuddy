# PRD: claims.zajcon.cz separace + branding fix wave

**Datum:** 2026-05-12 13:00
**Author:** Jarvis (per Radim 12.5. 13:03)
**Audit source:** `/root/Projects/jarvis-fleet/claims-audit-2026-05-12-jarvis.md` (Sonnet subagent, Codex out of tokens)
**Health score před fix:** 5/10
**Target po fix:** 9/10 production-ready

## 1. Goal + non-goals

**Goal:** Dotáhnout claims.zajcon.cz do stavu kdy reálně NENÍ připojená k UctoApp infrastruktuře (DB + email + branding) a klienti vidí pouze ClaimBuddy/„Pojistná Pomoc" identity.

**Non-goals:** Žádný refactor business logic, žádné nové features (úspory feature # 4669 separátně). Žádný front-end redesign.

## 2. Status quo (3 BLOKERY + 2 MAJORS z auditu)

### BLOKER #1: DB fallback na UctoApp Supabase
- `.env.local` (commited template): `NEXT_PUBLIC_SUPABASE_URL=https://ybcubkuskirbspyoxpak.supabase.co` jako fallback
- `lib/database-config.ts` preferuje `NEXT_PUBLIC_CLAIMS_SUPABASE_URL` pokud SET, jinak fallback na původní
- Systemd `claimbuddy-webapp.service` env: pravděpodobně chybí explicit claims URL → fallback aktivuje
- Důsledek: ClaimBuddy v produkci čte UctoApp DB, claims data leak risk + cross-contamination

### BLOKER #2: Branding leak (129 výskytů „ÚčetníOS" / „ucetnios.cz")
- `lib/email-templates.ts`: každý email má header „ÚčetníOS" + footer `ucetnios.cz`
- `lib/email-service.ts:34`: DEFAULT_FROM=noreply@ucetnios.cz
- `app/client/account/page.tsx:643`: odkaz na `@UcetniWebAppBot`
- `app/legal/{vop,gdpr,cookies}/page.tsx`: `<title>` „Účetní OS"
- `lib/cross-selling.ts`: UctoApp cross-sell kampaň aktivní pro claims klienty

### BLOKER #3: Neaplikované migrace
- `tax_questionnaires` table nenalezena → PGRST205 server errors
- `user_company_visibility` table nenalezena → 500 errors
- `plan_limits` table nenalezena → 500 errors
- SQL existují v `supabase/migrations/`, ale nebyly spuštěny na claims Supabase

### MAJOR #1: Bridge API `/api/bridge/*` existuje
- Routes `/api/bridge/closures` + `/api/bridge/companies` slouží UctoApp data
- Pro ClaimBuddy zbytečné, leak risk pokud admin/klient otevře

### MAJOR #2: `/admin` rewrite scope
- Aktuálně `/admin` rewrite na ClaimBuddy dashboard
- Chybí přímý přístup k user management URL clean

## 3. Implementační plán per BLOKER

### BLOKER #1 fix — DB isolation

**Cíl:** Zaručit že production ClaimBuddy NIKDY nečte UctoApp DB.

**Kroky:**
1. `/etc/claimbuddy-webapp.env` (systemd unit env file):
   - Set `NEXT_PUBLIC_CLAIMS_SUPABASE_URL=http://127.0.0.1:55421`
   - Set `NEXT_PUBLIC_CLAIMS_SUPABASE_ANON_KEY=<lokální JWT>`
   - Set `CLAIMS_SUPABASE_SERVICE_ROLE_KEY=<lokální service role>`
   - Verify že `NEXT_PUBLIC_SUPABASE_URL` (= UctoApp fallback) buď není SET, nebo je SET na same lokální URL
2. `.env.local` template v repo:
   - Remove ybcubk fallback (replace placeholder s prázdným nebo lokálním URL)
   - Comment: „NEVER point this to UctoApp — fallback dangerous"
3. `lib/database-config.ts`:
   - Throw error v boot pokud `NEXT_PUBLIC_CLAIMS_SUPABASE_URL` neset (fail-fast)
   - Remove fallback logic
4. `systemctl restart claimbuddy-webapp.service`
5. Verify: `curl https://claims.zajcon.cz/api/version` + log inspection → confirm reads from `127.0.0.1:55421`

**Acceptance:**
- DB query po restart vrací jen claims-local data
- Žádný HTTP request z ClaimBuddy na `*.ybcubkuskirbspyoxpak.supabase.co`
- Boot fails fast pokud env not set

### BLOKER #2 fix — Branding scrub

**Cíl:** 0 výskytů „ÚčetníOS" / „ucetnios.cz" v ClaimBuddy code + emails + legal pages.

**Kroky:**
1. **Email templates** (`lib/email-templates.ts`):
   - Replace „ÚčetníOS" → „Pojistná Pomoc"
   - Replace footer `ucetnios.cz` → `claims.zajcon.cz`
   - Replace logo references → ClaimBuddy logo
2. **Email service** (`lib/email-service.ts:34`):
   - `DEFAULT_FROM=noreply@claims.zajcon.cz`
   - Plus DKIM/SPF setup pokud potřeba (Caddy/MailJet config)
3. **Client account** (`app/client/account/page.tsx:643`):
   - Replace `@UcetniWebAppBot` → odpovídající ClaimBuddy bot link nebo support email
4. **Legal pages** (`app/legal/*/page.tsx`):
   - `<title>` „Pojistná Pomoc — VOP/GDPR/Cookies"
   - Body content review per page
5. **Cross-selling** (`lib/cross-selling.ts`):
   - Disable UctoApp cross-sell kampaň pro claims klienty
   - Feature flag `ENABLE_UCETNIOS_CROSS_SELL=false` v env
6. **Grep audit po každém commit:**
   - `grep -ri "ÚčetníOS\|ucetnios" /root/Projects/ClaimBuddy/src /root/Projects/ClaimBuddy/app` → expected 0 hits

**Acceptance:**
- 0 výskytů „ÚčetníOS" v ClaimBuddy code/templates/legal
- 0 výskytů „ucetnios.cz" v emails/links
- Klient registrace email má branding „Pojistná Pomoc" + claims.zajcon.cz
- Footer všech emailů + legal pages: „Pojistná Pomoc, claims.zajcon.cz"

### BLOKER #3 fix — Apply pending migrations

**Cíl:** Aplikovat všechny pending migrace na claims Supabase + verify 0 PGRST205 errors.

**Kroky:**
1. List pending: `ls /root/Projects/ClaimBuddy/supabase/migrations/`
2. Compare s applied list: `docker exec supabase_db_claimbuddy-local psql -U postgres -d postgres -c "SELECT name FROM supabase_migrations.schema_migrations"` (or wherever Supabase tracks)
3. Identify diff (tax_questionnaires, user_company_visibility, plan_limits)
4. Pg_dump backup PŘED apply
5. Apply pending: `supabase db push --db-url postgresql://postgres:...@127.0.0.1:55422/postgres`
6. Verify: SELECT 1 z každé nové tabulky → success

**Acceptance:**
- Žádné PGRST205 errors v logs
- Všechny migrations applied
- Pre-apply backup v `/root/inkaska-pre-migration-2026-05-12.dump`

### MAJOR #1 fix — Disable Bridge API

**Cíl:** `/api/bridge/*` endpointy odebrané z ClaimBuddy (nepatří tam).

**Kroky:**
1. Delete `app/api/bridge/closures/route.ts` + `app/api/bridge/companies/route.ts`
2. Middleware grep pro any reference → cleanup
3. Acceptance: curl `https://claims.zajcon.cz/api/bridge/companies` → 404

### MAJOR #2 fix — /admin URL improvements

**Cíl:** Clean URLs pro admin user management.

**Kroky:**
1. Add middleware rewrite: `/admin/users` → `/accountant/admin/users`
2. Verify klik v admin nav vrátí na `/admin/users`, ne `/accountant/admin/users` (cosmetic)

## 4. Sequence

**Den 1 (dnes):**
1. BLOKER #3 (migrace push) — first, blocking pro testing dalších fix
2. BLOKER #1 (DB env) — kritický
3. BLOKER #2 (branding scrub) — největší effort 1-2h
4. MAJOR #1 (bridge disable) — quick
5. MAJOR #2 (admin URLs) — quick polish

**Po každém fix:** Tester E2E verify per BLOKER acceptance.

## 5. Acceptance criteria overall

1. Health score 9/10 (audit re-run)
2. Klient registrace → email s brandingem „Pojistná Pomoc" + `claims.zajcon.cz` footer
3. Admin login → URL `/admin/users` → user list (clean)
4. `curl claims.zajcon.cz/api/bridge/companies` → 404
5. `grep -ri "ÚčetníOS\|ucetnios" src/ app/` → 0 hits
6. 0 PGRST205 / 500 v logs během 10-min smoke
7. Žádný outbound HTTP request na ybcubk Supabase během runtime

## 6. Risks + mitigations

- **R1:** DB env switch může break existing klientská data — mitigation: backup před, verify migrace status
- **R2:** Email branding scrub může break MailJet/SMTP auth — mitigation: keep DKIM/SPF for both domains during transition
- **R3:** Migrace push může selhat — mitigation: pg_dump + dry-run první

## 7. Rollback plán per BLOKER

- B1: revert systemd env → `systemctl daemon-reload && systemctl restart`
- B2: revert email templates → git checkout commit pre-scrub
- B3: rollback migrace → `pg_restore` z `/root/inkaska-pre-migration-2026-05-12.dump`

## 8. Time estimates

- B3 (migrace push): 30 min
- B1 (DB env): 15 min  
- B2 (branding scrub): 1-2h
- M1 (bridge disable): 15 min
- M2 (admin URLs): 15 min
- **Total:** 2.5-3.5h

## 9. Hand-off

Dispatch UctoApp bot (vlastník ClaimBuddy code, zná repo z overnight MVP). Per fix:
1. /plan v worktree
2. Implementace per acceptance
3. CI green
4. Coolify deploy (nebo systemctl reload)
5. Tester E2E verify
6. Hlas Jarvisovi

Plus paralelně dispatch Tester na HUMAN PERSPECTIVE walk-through (Playwright E2E klient register → email → admin login → klient management workflow). Code audit miss UX issues.
