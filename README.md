# Pojistná Pomoc (Notion Mode)

## Start Here
- Projektový handover: `CONTINUE_HERE.md`
- Provozní runbook: `docs/DEPLOYMENT_RUNBOOK.md`
- Otevřené kroky: `docs/NEXT_STEPS.md`

Pojistná Pomoc je nyní připravený v dočasném provozním režimu bez Firebase.

Data případů se ukládají přímo do Notion databáze přes `POST /api/cases`.

## Co funguje
- Marketing web
- Veřejný formulář pro nový případ: `/cases/new`
- Uložení případu do Notion
- Základní AI chat endpoint: `/api/ai/chat` (pokud je nastavený `GOOGLE_AI_API_KEY`)
- Admin login + správa případů: `/admin/login`, `/admin/cases`, `/admin/cases/[id]`
- Interní poznámky, aktivita, přiřazení, priority, dokumenty
- CSV export: `/api/admin/export`

## Povinné env proměnné
- `NOTION_TOKEN`
- `NOTION_CASES_DB_ID`

## Volitelné env proměnné
- `GOOGLE_AI_API_KEY`
- `ADMIN_API_KEY`
- `ADMIN_PANEL_PASSWORD` (heslo pro `/admin/login`)
- `ADMIN_SESSION_TOKEN` (oddělený token pro admin session cookie)
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (volitelné email notifikace)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (volitelné platby)

## Lokální spuštění
```bash
npm install
npm run dev
```

## Build kontrola
```bash
npm run type-check
npm run build
```

## Poznámka
Část starších endpointů z původní Firebase architektury zůstává v Notion režimu vypnutá (`501`), ale správa případů v `/admin` je aktivní.

## Admin režim
- Přihlášení: `/admin/login`
- Přehled případů: `/admin/cases`
- Detail případu + změna stavu: `/admin/cases/[id]`
