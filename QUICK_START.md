# Quick Start (Notion Mode)

## 1. Vytvoř `.env.local`

```bash
NOTION_TOKEN=secret_xxx
NOTION_CASES_DB_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GOOGLE_AI_API_KEY=optional
ADMIN_API_KEY=optional
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 2. Nainstaluj a spusť

```bash
npm install
npm run dev
```

## 3. Ověř flow

1. Otevři `http://localhost:3000/cases/new`
2. Odešli formulář
3. Zkontroluj nový záznam v Notion DB
