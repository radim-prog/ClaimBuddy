# Rate Limiting

Pojistná Pomoc používá rate limiting pro ochranu API před abuse a kontrolu nákladů.

## Limity

| Endpoint | Limit | Window | Důvod |
|----------|-------|--------|-------|
| `/api/ai/ocr` | 10 requests | 1 hodina | Drahé Gemini Vision API |
| `/api/ai/chat` | 50 requests | 1 hodina | Gemini API náklady |
| `/api/*` (general) | 100 requests | 15 minut | DoS ochrana |
| Auth endpoints | 5 attempts | 15 minut | Brute force ochrana |

## Implementace

### Production (Upstash Redis)
- Distribuovaný rate limiting
- Perzistentní napříč Vercel serverless functions
- Analytics dashboard

### Development (In-Memory)
- Lokální fallback pokud Upstash není nakonfigurován
- Neperzistentní (resetuje se při restartu)

## Setup Upstash (Production)

1. Vytvoř free účet: https://upstash.com/
2. Vytvoř Redis database
3. Copy REST URL a TOKEN
4. Přidej do Vercel environment variables:
   ```
   UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
   UPSTASH_REDIS_REST_TOKEN=xxx
   ```

## Response Headers

Každý rate-limited endpoint vrací headers:
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1699564800000
```

## Error Response (429)

```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again after 14:30:00",
  "retryAfter": 300
}
```

## Testing

```bash
# Test OCR rate limit (should fail after 10 requests)
for i in {1..15}; do
  curl -X POST http://localhost:3000/api/ai/ocr \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"imageUrl": "https://example.com/image.jpg"}'
  echo "\nRequest $i"
done
```

## Frontend Integrace

Klientský kód by měl sledovat rate limit headers:

```typescript
const response = await fetch('/api/ai/ocr', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ imageUrl })
});

if (response.status === 429) {
  const data = await response.json();
  const resetTime = new Date(parseInt(response.headers.get('X-RateLimit-Reset') || '0'));

  console.error(`Rate limit exceeded. Try again after ${resetTime.toLocaleTimeString()}`);
  // Zobraz uživateli chybovou hlášku
}

// Zobraz zbývající limity v UI
const remaining = response.headers.get('X-RateLimit-Remaining');
const limit = response.headers.get('X-RateLimit-Limit');
console.log(`API calls remaining: ${remaining}/${limit}`);
```

## Monitoring

### Production (Upstash Dashboard)
- Real-time analytics
- Request patterns
- Abuse detection

### Development (Console Logs)
```
⚠️ Upstash credentials not found, using in-memory rate limiter
```

## Náklady

### Upstash Free Tier (100% zdarma)
- 10,000 requests denně
- 256 MB storage
- Global replication

Pro Pojistná Pomoc s očekávaným provozem:
- 100 aktivních uživatelů/den
- Průměr 5 OCR requests/user = 500 requests/den
- 50 chat requests/user = 5,000 requests/den
- **Celkem: ~5,500 requests/den = well within free tier**

## Future Improvements

- [ ] Premium tier s vyššími limity
- [ ] Dynamic rate limits based on subscription
- [ ] Whitelist pro trusted users
- [ ] Rate limit bursts (short-term spikes)
- [ ] Per-IP rate limiting (navíc k per-user)
