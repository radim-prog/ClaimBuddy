# ClaimBuddy (Notion Mode)

ClaimBuddy je nyní připravený v dočasném provozním režimu bez Firebase.

Data případů se ukládají přímo do Notion databáze přes `POST /api/cases`.

## Co funguje
- Marketing web
- Veřejný formulář pro nový případ: `/cases/new`
- Uložení případu do Notion
- Základní AI chat endpoint: `/api/ai/chat` (pokud je nastavený `GOOGLE_AI_API_KEY`)

## Povinné env proměnné
- `NOTION_TOKEN`
- `NOTION_CASES_DB_ID`

## Volitelné env proměnné
- `GOOGLE_AI_API_KEY`
- `ADMIN_API_KEY`

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
Interní admin/dashboard API endpointy jsou v Notion režimu úmyslně vypnuté (`501`).
