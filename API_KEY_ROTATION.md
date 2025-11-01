# Google AI API Key Rotation

## Krok 1: Revoke starý klíč

1. Jdi na: https://aistudio.google.com/app/apikey
2. Najdi klíč končící `...ZfP4`
3. Klikni ⋮ → **Delete key**
4. Potvrď deletion

## Krok 2: Vytvoř nový klíč

1. Google AI Studio → Create API Key
2. Zkopíruj nový klíč (začíná `AIza...`)
3. **NIKDY** ho necommituj do gitu!

## Krok 3: Aktualizuj lokální .env.local

```bash
# /Users/Radim/Projects/claimbuddy/.env.local
GOOGLE_AI_API_KEY=AIza... [tvůj nový klíč]
```

## Krok 4: Aktualizuj Vercel

```bash
# Option A: Vercel CLI
vercel env add GOOGLE_AI_API_KEY production
# Paste nový klíč

# Option B: Vercel Dashboard
# 1. Jdi na https://vercel.com/your-project/settings/environment-variables
# 2. Najdi GOOGLE_AI_API_KEY
# 3. Edit → Update value → Save
```

## Krok 5: Redeploy

```bash
vercel --prod
```

## Krok 6: Test

```bash
# Test že OCR funguje
curl -X POST https://your-app.vercel.app/api/ai/ocr \
  -H "Authorization: Bearer $YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"imageUrl": "https://example.com/invoice.jpg"}'
```

## Monitoring

1. Google AI Studio → Usage
2. Sleduj první requesty s novým klíčem
3. Ověř že starý klíč už není použitý (404 errors OK)
