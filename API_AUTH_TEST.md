# API Authorization Test Checklist

Po implementaci Authorization headers, otestuj:

## API Endpoints s Auth

- [ ] POST /api/cases - Create case
- [ ] GET /api/cases - List cases
- [ ] PATCH /api/cases/[id] - Update case
- [ ] POST /api/cases/[id]/messages - Send message
- [ ] POST /api/upload - Upload file
- [ ] POST /api/ai/chat - AI chat
- [ ] POST /api/ai/ocr - OCR scan (pokud existuje)
- [ ] POST /api/payments/checkout - Create payment (pokud existuje)

## Test Scenarios

### 1. Bez tokenu (mělo by vrátit 401)
```bash
curl -X POST http://localhost:3000/api/cases \
  -H "Content-Type: application/json" \
  -d '{"insuranceType":"POV"}'
# Expected: 401 Unauthorized
```

### 2. S neplatným tokenem (mělo by vrátit 401)
```bash
curl -X POST http://localhost:3000/api/cases \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid-token" \
  -d '{"insuranceType":"POV"}'
# Expected: 401 Invalid token
```

### 3. S platným tokenem (mělo by fungovat)
- Přihlaš se v aplikaci
- Dev Tools → Network → najdi API request
- Copy token z Authorization header
- Test v curl

```bash
# Replace YOUR_TOKEN with actual Firebase token
curl -X POST http://localhost:3000/api/cases \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"insuranceType":"POV","incidentDate":"2025-11-01","incidentLocation":"Praha","incidentDescription":"Test description that is long enough to pass validation requirements for minimum length","claimAmount":50000,"insuranceCompany":"Česká pojišťovna"}'
# Expected: 200 OK with caseId
```

## Browser Test

1. Přihlaš se do aplikace
2. Vytvoř nový případ (Cases → New Case)
3. Zkontroluj Network tab (F12 → Network):
   - Všechny `/api/*` requesty mají Authorization header
   - Token začíná "Bearer eyJ..."
   - Status code je 200, ne 401
4. Uploadni soubor
5. Pošli message v případu
6. Použij AI chat

Všechno by mělo fungovat bez 401 errors.

## Files Modified

Všechny tyto soubory nyní obsahují Authorization header:

1. `<project-root>/components/cases/case-messages.tsx`
   - POST /api/cases/[id]/messages

2. `<project-root>/components/cases/case-ai-assistant.tsx`
   - POST /api/ai/chat

3. `<project-root>/components/cases/case-documents.tsx`
   - POST /api/upload

4. `<project-root>/app/(dashboard)/cases/new/page.tsx`
   - POST /api/upload (file upload)
   - POST /api/cases (create case)

## Utility Helper

Nový soubor `<project-root>/lib/api-client.ts` obsahuje:

- `authenticatedFetch()` - Fetch wrapper s auto token
- `apiRequest()` - JSON API helper s auto token + error handling

Použití v budoucích feature branches:

```typescript
import { apiRequest } from '@/lib/api-client';
import { useAuth } from '@/components/providers/auth-provider';

// In component
const { user } = useAuth();

// Simple usage
const data = await apiRequest(user, '/api/cases', {
  method: 'POST',
  body: { insuranceType: 'POV', ... }
});
```

## Security Notes

- API endpoints musí mít middleware pro verifikaci Firebase tokens
- Token expiruje po 1 hodině (Firebase default)
- Při 401 error by měla app redirectnout na /login
- NIKDY nekončit API route bez autentizace check!
