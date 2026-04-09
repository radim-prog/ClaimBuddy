# ClaimBuddy Server Deploy

Tento postup předpokládá:

- účetní aplikace běží dál beze změny
- ClaimBuddy se deployuje jako samostatná aplikace
- ClaimBuddy má vlastní databázi
- produkční cutover se dělá až po ověření na neveřejné staging URL

## 1. Připravit server

- vytvořit nový adresář nebo nový repo checkout pro `ClaimBuddy`
- nepřepisovat běžící `UcetniWebApp`
- připravit samostatnou doménu nebo staging subdoménu, například `claims-staging.zajcon.cz`
- použít nové serverové podklady v `scripts/`:
  - `scripts/claimbuddy-webapp.service.example`
  - `scripts/claimbuddy-deploy.service.example`
  - `scripts/claimbuddy-deploy.env.example`
  - `scripts/claimbuddy-deploy.sh`
  - `scripts/claimbuddy-smoke.sh`

## 2. Připravit claims databázi

ClaimBuddy očekává vlastní Supabase-compatible backend.

Minimum:

- `NEXT_PUBLIC_CLAIMS_SUPABASE_URL`
- `NEXT_PUBLIC_CLAIMS_SUPABASE_ANON_KEY`
- `CLAIMS_SUPABASE_SERVICE_ROLE_KEY`

Bootstrap schema:

```bash
psql "$CLAIMBUDDY_DB_URL" -f supabase/claimbuddy.bootstrap.sql
```

Pokud používáte self-hosted Supabase stack, nejdřív zvednout storage, auth a REST vrstvu. Samotný PostgreSQL server nestačí, protože app používá i Supabase storage API.

## 3. Připravit env

ClaimBuddy potřebuje minimálně:

```env
AUTH_SECRET=
NEXT_PUBLIC_APP_URL=https://claims-staging.zajcon.cz

NEXT_PUBLIC_CLAIMS_SUPABASE_URL=
NEXT_PUBLIC_CLAIMS_SUPABASE_ANON_KEY=
CLAIMS_SUPABASE_SERVICE_ROLE_KEY=
ALLOW_ACCOUNTING_DB_FALLBACK=false
```

Další proměnné přebírat jen pokud je claims část skutečně používá:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- claims Stripe price IDs
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GOOGLE_CLOUD_API_KEY`
- `EMAIL_FROM_NOREPLY`
- `ECOMAIL_API_KEY`
- `SIGNI_API_KEY`

Nevázat ClaimBuddy na účetní DB fallback v produkci. Fallback je jen migrační pojistka.
ClaimBuddy teď v `NODE_ENV=production` bez dedikovaných claims envů při startu spadne schválně.

## 4. Naplnit claims data

Nejdřív dry-run:

```bash
set -a
source /path/to/accounting.env
source /path/to/claimbuddy.env
set +a
node scripts/sync-claimbuddy-db.js --dry-run
```

Ostrý import:

```bash
set -a
source /path/to/accounting.env
source /path/to/claimbuddy.env
set +a
node scripts/sync-claimbuddy-db.js
```

## 5. Zkusit storage sync

```bash
set -a
source /path/to/accounting.env
source /path/to/claimbuddy.env
set +a
node scripts/sync-claimbuddy-storage.js --dry-run
node scripts/sync-claimbuddy-storage.js
```

Aktuální stav známých dat:

- databázový sync funguje
- část testovacích claims dokumentů má v DB metadata, ale ve zdrojovém storage objekt fyzicky neexistuje

To v aktuálním repu není produkční blocker, protože jde o testovací data. Pro staging nebo produkci jen rozhodnout, jestli:

- se nasadí čistá claims DB bez fixture dat
- nebo se nahrají nové testovací soubory konzistentní s importovanými záznamy

## 6. Build a start

```bash
npm install
npm run build
npm run start -- -H 127.0.0.1 -p 3020
```

Nebo použít připravené systemd jednotky:

```bash
cp scripts/claimbuddy-webapp.service.example /etc/systemd/system/claimbuddy-webapp.service
cp scripts/claimbuddy-deploy.service.example /etc/systemd/system/claimbuddy-deploy.service
cp scripts/claimbuddy-deploy.env.example /root/Projects/ClaimBuddy/scripts/claimbuddy-deploy.env

systemctl daemon-reload
systemctl enable claimbuddy-webapp.service
systemctl start claimbuddy-webapp.service
```

Jednorázový deploy:

```bash
systemctl start claimbuddy-deploy.service
journalctl -u claimbuddy-deploy.service -n 200 --no-pager
```

Pokud chcete po deployi i autentizovaný smoke test claims flow, vyplnit v `scripts/claimbuddy-deploy.env`:

```env
RUN_SMOKE_TEST=1
TEST_USERNAME=
TEST_PASSWORD=
TEST_COMPANY_ID=
RUN_UPLOAD_DELETE_CHECK=0
```

`RUN_UPLOAD_DELETE_CHECK=1` je vhodné jen pro staging, protože provede upload a následné smazání testovacího souboru.

ClaimBuddy je teď runtime-guarded jako claims-only produkt:

- ne-claims frontend routy se přesměrovávají zpět do claims flow
- root, login a dashboard redirecty už nemíří do účetních dashboardů

## 7. Smoke test před cutoverem

Ověřit minimálně:

- `GET /claims`
- `GET /auth/login`
- `GET /client/claims` po client loginu
- `GET /accountant/claims/dashboard` po staff loginu
- vytvoření nebo edit claims case
- detail claims case
- upload claims dokumentu
- timeline a messages flow

## 8. Cutover

Po staging sign-off:

- přesměrovat claims doménu na nový ClaimBuddy deploy
- účetní aplikaci nechat bez claims marketing entrypointu nebo jen s odkazy/redirecty
- claims tým už deployuje jen ClaimBuddy

## 9. Rollback

Rollback musí být jednoduchý:

- vrátit DNS nebo reverse proxy na původní claims runtime
- nechat účetní aplikaci beze změny
- ClaimBuddy DB ponechat, ale zastavit zápisy nebo odpojit provoz

## Current Known State

K 9. dubnu 2026 je ověřeno:

- ClaimBuddy build prochází
- ClaimBuddy běží proti vlastní lokální claims DB
- DB sync do oddělené claims DB funguje
- storage sync odhalil chybějící objekty u části testovacích fixture dat
