# ClaimBuddy Admin API Endpoints

## Autentizace
Všechny admin endpointy vyžadují:
```
Authorization: Bearer <firebase-id-token>
```

## Endpointy

### Cases (Případy)
```
GET    /api/admin/cases                    - Seznam případů s filtry
PATCH  /api/admin/cases/[id]/status        - Aktualizace stavu
GET    /api/admin/cases/[id]/notes         - Seznam interních poznámek
POST   /api/admin/cases/[id]/notes         - Přidat interní poznámku
GET    /api/admin/cases/[id]/assign        - (Already exists)
POST   /api/admin/cases/[id]/assign        - (Already exists)
```

### Users (Uživatelé)
```
GET    /api/admin/users                    - Seznam uživatelů s filtry
POST   /api/admin/users                    - Vytvořit nového uživatele (ADMIN only)
GET    /api/admin/users/[id]               - Detail uživatele se statistikami
PATCH  /api/admin/users/[id]               - Aktualizovat uživatele (ADMIN only)
DELETE /api/admin/users/[id]               - Deaktivovat uživatele (ADMIN only)
```

### Analytics (Analytika)
```
GET    /api/admin/analytics                - Kompletní analytická data
                                             - Stats, charts, performance metrics
```

### Export
```
POST   /api/admin/export                   - Export dat do CSV
                                             - Podporuje: cases, users, analytics
```

### Activity Log (Audit trail)
```
GET    /api/admin/activity                 - Log všech admin aktivit
```

### Agents (Already exists)
```
GET    /api/admin/agents                   - Seznam agentů
```

## Počet endpointů celkem: 11 + 2 (již existující) = 13

## Role Requirements
- **Admin nebo Agent:** Většina read operací, update případů
- **Pouze Admin:** Tvorba/úprava uživatelů, DELETE operace

## Dokumentace
Detailní dokumentace v: `.claude-context/2025-11-01-admin-backend-api-documentation.md`
