# ClaimBuddy Database

`ClaimBuddy` má běžet na vlastní databázi. Kód je už připravený používat samostatné claims credentials, ale zatím má fallback na původní sdílené proměnné, aby šel split dělat postupně.

## Preferred environment variables

```env
NEXT_PUBLIC_CLAIMS_SUPABASE_URL=
NEXT_PUBLIC_CLAIMS_SUPABASE_ANON_KEY=
CLAIMS_SUPABASE_SERVICE_ROLE_KEY=
```

Pokud jsou tyto tři hodnoty nastavené, `ClaimBuddy` používá vlastní claims databázi.

Fallback:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Bootstrap

Pro první samostatnou claims DB je připravený bootstrap:

- [claimbuddy.bootstrap.sql](/root/Projects/ClaimBuddy/supabase/claimbuddy.bootstrap.sql)

Tento bootstrap schválně zachovává tabulky `users`, `companies` a `client_users`, ale klientský přístup je už vedený přes `companies.owner_id`. `client_users` zůstává jen jako kompatibilitní vrstva pro split, ne jako hlavní zdroj pravdy.

## Local Supabase dev stack

`ClaimBuddy` má vlastní `supabase/config.toml` s oddělenými porty:

- API: `55421`
- DB: `55422`
- Studio: `55423`
- Inbucket: `55424`

Staré sdílené migrations jsou pro tento lokální stack vypnuté. ClaimBuddy bootstrapuje DB přes vlastní claims SQL.

## Safe migration path

1. Založit novou claims databázi na serveru.
2. Aplikovat `supabase/claimbuddy.bootstrap.sql`.
3. Naplnit minimální data:
   - claims staff users
   - klienti
   - firmy
   - odvozené membershipy v `client_users` z `companies.owner_id`
   - pojistné případy a jejich dokumenty
4. Nastavit claims env proměnné.
5. Ověřit login, `/claims`, `/client/claims`, `/accountant/claims/dashboard`.
6. Teprve potom odpojit fallback na sdílenou účetní DB.

Pro lokální dev stack je připravený bootstrap skript:

```bash
./scripts/bootstrap-claimbuddy-local-supabase.sh
```

Skript:

- spustí separátní lokální Supabase stack pro ClaimBuddy
- aplikuje `supabase/claimbuddy.bootstrap.sql`
- vygeneruje `.env.claimbuddy.local` s claims DB credentials

## Sync script

Pro první naplnění nové DB je připravený seed/sync skript:

```bash
node scripts/sync-claimbuddy-db.js --dry-run
node scripts/sync-claimbuddy-db.js
```

Skript bere:

- zdroj z `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`
- cíl z `NEXT_PUBLIC_CLAIMS_SUPABASE_URL` + `CLAIMS_SUPABASE_SERVICE_ROLE_KEY`

Kopíruje jen claims-relevantní data:

- `insurance_companies`
- `users`
- `companies`
- odvozené `client_users` membershipy z `companies.owner_id`
- `insurance_cases`
- `insurance_case_documents`
- `insurance_case_events`
- `insurance_payments`
- `claim_reviews`
- `signing_jobs`
- `signing_signers`
- `signing_events`

Po databázovém syncu je potřeba přenést i samotné claims soubory ze storage:

```bash
node scripts/sync-claimbuddy-storage.js --dry-run
node scripts/sync-claimbuddy-storage.js
```

Skript kopíruje soubory z bucketu `documents` podle cest uložených v:

- `insurance_case_documents.file_path`
- `signing_jobs.signed_document_path`

Poznámka k aktuálnímu workspace stavu:

- současná claims data v projektu jsou testovací
- část testovacích dokumentových cest v DB nemá odpovídající objekt ve zdrojovém storage
- to není blocker pro split ani pro staging deploy, jen nekonzistence ve fixture datech
