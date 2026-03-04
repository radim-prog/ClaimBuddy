# Pokračování projektu (Pojistná Pomoc)

Tento soubor je hlavní vstupní bod pro další relaci.

## Aktuální stav
- Produkce běží: `https://pu.zajcon.cz`
- Branch: `main`
- Poslední commit: `94f4272`
- Repozitář: `https://github.com/radim-prog/ClaimBuddy.git`

## Co je hotové
- Notion-only architektura bez Firebase.
- Veřejný formulář nové PU (`/cases/new`) -> zapisuje do Notion DB.
- Admin režim (`/admin/login`, `/admin/cases`, `/admin/cases/[id]`):
  - statusy, priorita, assignee
  - interní poznámky
  - timeline/aktivita
  - dokumenty (upload + URL)
  - export CSV
  - analytics endpoint
- OCR endpoint (Gemini) implementovaný.
- Stripe checkout/webhook endpointy implementované.
- Email notifikace přes Resend implementované.
- Rebrand na "Pojistná Pomoc" v app + docs/legal/copy.

## Kritické cesty
- Repo: `/root/Projects/PU/ClaimBuddy`
- Service env: `/etc/claimbuddy-pu.env`
- Systemd service: `/etc/systemd/system/claimbuddy-pu.service`
- Caddy config: `/etc/caddy/Caddyfile`

## Notion
- Projektová stránka: `https://www.notion.so/ClaimBuddy-319c49dc953281a0ad3ac1d7e9808619`
- Cases DB (správná): `https://www.notion.so/319c49dc95328148a36dd154df7cb1d3`
- `NOTION_CASES_DB_ID=319c49dc-9532-8148-a36d-d154df7cb1d3`

## Co zbývá aktivovat
- Resend produkční klíče (`RESEND_API_KEY`, `RESEND_FROM_EMAIL`).
- Stripe produkční klíče (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) + webhook v Stripe.
- Gemini klíč (`GOOGLE_AI_API_KEY`) pro OCR/chat.

## Další doporučený krok
1. Dodat produkční API klíče do `/etc/claimbuddy-pu.env`.
2. `systemctl restart claimbuddy-pu.service`.
3. Projít [docs/DEPLOYMENT_RUNBOOK.md](docs/DEPLOYMENT_RUNBOOK.md) a [docs/NEXT_STEPS.md](docs/NEXT_STEPS.md).
