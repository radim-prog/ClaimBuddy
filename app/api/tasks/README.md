# Task Management API Endpoints

Kompletní dokumentace API endpointů pro GTD-based task management systém.

## Přehled

Všechny endpointy vyžadují autentizaci přes Supabase Auth. API používá Row Level Security (RLS) policies pro kontrolu přístupu.

## Endpoints

### 1. GET /api/tasks

Získání seznamu úkolů s pokročilým filtrováním a stránkováním.

**Query Parameters:**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `status` | string | Filtr podle stavu (lze vícenásobně oddělené čárkou) | `pending,in_progress` |
| `priority` | string | Filtr podle priority (lze vícenásobně) | `high,critical` |
| `assigned_to` | UUID | Filtr podle přiřazeného uživatele | `user-uuid` |
| `created_by` | UUID | Filtr podle tvůrce úkolu | `user-uuid` |
| `company_id` | UUID | Filtr podle klienta | `company-uuid` |
| `is_project` | boolean | Filtr projektů vs. úkolů | `true` |
| `is_billable` | boolean | Filtr fakturovatelných úkolů | `true` |
| `gtd_context` | string | GTD kontext (lze vícenásobně) | `@telefon,@email` |
| `gtd_energy_level` | string | Úroveň energie | `high` |
| `gtd_is_quick_action` | boolean | Rychlé akce (< 2 min) | `true` |
| `due_date_from` | DATE | Deadline od | `2025-12-01` |
| `due_date_to` | DATE | Deadline do | `2025-12-31` |
| `parent_project_id` | UUID | Dílčí úkoly projektu | `project-uuid` |
| `search` | string | Hledání v názvu a popisu | `faktura` |
| `sort_by` | string | Pole pro řazení | `created_at` |
| `sort_order` | string | Směr řazení (asc/desc) | `desc` |
| `page` | number | Číslo stránky | `1` |
| `page_size` | number | Počet na stránku (max 100) | `50` |

**Response:**

```json
{
  "tasks": [
    {
      "id": "uuid",
      "title": "Poslat email klientovi",
      "description": "...",
      "status": "in_progress",
      "priority": "high",
      "is_project": false,
      "created_by": "uuid",
      "created_by_name": "Radim",
      "assigned_to": "uuid",
      "assigned_to_name": "Jana",
      "company_id": "uuid",
      "company_name": "Alza.cz",
      "estimated_minutes": 10,
      "actual_minutes": 12,
      "is_billable": true,
      "hourly_rate": 800,
      "billable_hours": 0.2,
      "gtd_context": ["@email"],
      "gtd_energy_level": "medium",
      "gtd_is_quick_action": false,
      "due_date": "2025-12-10",
      "created_at": "2025-12-07T10:00:00Z",
      "updated_at": "2025-12-07T10:30:00Z"
    }
  ],
  "total": 42,
  "page": 1,
  "page_size": 50,
  "total_pages": 1
}
```

**Example Requests:**

```bash
# Získat všechny moje úkoly v progress
GET /api/tasks?assigned_to=my-uuid&status=in_progress

# Získat rychlé akce (< 2 min) s vysokou prioritou
GET /api/tasks?gtd_is_quick_action=true&priority=high,critical

# Získat všechny fakturovatelné úkoly pro klienta v prosinci
GET /api/tasks?company_id=company-uuid&is_billable=true&due_date_from=2025-12-01&due_date_to=2025-12-31

# Hledat úkoly obsahující "faktura"
GET /api/tasks?search=faktura
```

---

### 2. POST /api/tasks

Vytvoření nového úkolu.

**Request Body:**

```typescript
{
  title: string                    // POVINNÉ
  description?: string
  is_project?: boolean             // default: false
  project_outcome?: string
  parent_project_id?: string
  status?: TaskStatus              // default: 'pending'
  priority?: TaskPriority          // default: 'medium'
  assigned_to?: string
  assigned_to_name?: string
  due_date?: string                // DATE
  due_time?: string                // TIME
  company_id: string               // POVINNÉ
  company_name: string             // POVINNÉ
  monthly_closure_id?: string
  document_id?: string
  onboarding_client_id?: string
  estimated_minutes?: number
  is_billable?: boolean            // default: false
  hourly_rate?: number
  gtd_context?: string[]
  gtd_energy_level?: 'high' | 'medium' | 'low'
  gtd_is_quick_action?: boolean    // default: false
  tags?: string[]
  task_data?: Record<string, any>
}
```

**Response (201 Created):**

```json
{
  "task": {
    "id": "uuid",
    "title": "...",
    // ... všechna pole
  }
}
```

**Example:**

```bash
POST /api/tasks
Content-Type: application/json

{
  "title": "Připravit daňové přiznání",
  "description": "DPH přiznání za prosinec 2025",
  "company_id": "company-uuid",
  "company_name": "Alza.cz",
  "priority": "high",
  "assigned_to": "user-uuid",
  "assigned_to_name": "Radim",
  "due_date": "2025-12-20",
  "estimated_minutes": 120,
  "is_billable": true,
  "hourly_rate": 1200,
  "gtd_context": ["@počítač", "@kancelář"],
  "gtd_energy_level": "high"
}
```

---

### 3. GET /api/tasks/[id]

Získání detailu úkolu včetně všech relací.

**Response:**

```json
{
  "task": {
    "id": "uuid",
    "title": "...",
    // ... základní pole

    // Relace:
    "checklist_items": [
      {
        "id": "uuid",
        "text": "Krok 1",
        "completed": false,
        "position": 0,
        "estimated_minutes": 30,
        "actual_minutes": 0,
        "due_date": "2025-12-08"
      }
    ],
    "time_entries": [
      {
        "id": "uuid",
        "user_id": "uuid",
        "user_name": "Radim",
        "started_at": "2025-12-07T10:00:00Z",
        "stopped_at": "2025-12-07T10:15:00Z",
        "duration_minutes": 15,
        "note": "Příprava dokumentů",
        "billable": true
      }
    ],
    "subtasks": [
      // Pokud is_project = true
    ],
    "parent_project": {
      // Pokud parent_project_id je nastaveno
    }
  }
}
```

---

### 4. PATCH /api/tasks/[id]

Aktualizace úkolu.

**Request Body (všechna pole volitelná):**

```typescript
{
  title?: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  assigned_to?: string
  assigned_to_name?: string
  delegated_from?: string
  delegated_to?: string
  delegation_reason?: string
  is_waiting_for?: boolean
  waiting_for_who?: string
  waiting_for_what?: string
  accepted?: boolean
  accepted_at?: string
  due_date?: string
  due_time?: string
  estimated_minutes?: number
  is_billable?: boolean
  hourly_rate?: number
  gtd_context?: string[]
  gtd_energy_level?: 'high' | 'medium' | 'low'
  gtd_is_quick_action?: boolean
  tags?: string[]
  progress_percentage?: number
  task_data?: Record<string, any>
}
```

**Response:**

```json
{
  "task": {
    // Aktualizovaný úkol
  }
}
```

**Example:**

```bash
PATCH /api/tasks/task-uuid
Content-Type: application/json

{
  "priority": "critical",
  "due_date": "2025-12-08",
  "gtd_context": ["@email", "@urgent"]
}
```

---

### 5. DELETE /api/tasks/[id]

Smazání úkolu (soft delete - označí jako cancelled).

**Oprávnění:** Pouze tvůrce nebo admin.

**Response:**

```json
{
  "success": true,
  "task": {
    "status": "cancelled",
    "completed_at": "2025-12-07T12:00:00Z"
  },
  "message": "Úkol byl označen jako zrušený"
}
```

---

### 6. POST /api/tasks/[id]/time-tracking

Vytvoření záznamu o čase (start nebo log).

**Request Body:**

```typescript
{
  started_at: string               // POVINNÉ (ISO 8601)
  stopped_at?: string              // Volitelné - pokud není, začíná měření
  note?: string
  billable?: boolean               // default: task.is_billable
}
```

**Response (201 Created):**

```json
{
  "entry": {
    "id": "uuid",
    "task_id": "uuid",
    "user_id": "uuid",
    "user_name": "Radim",
    "started_at": "2025-12-07T10:00:00Z",
    "stopped_at": null,
    "duration_minutes": null,
    "note": "Začínám pracovat",
    "billable": true
  },
  "task_actual_minutes": 0,
  "task_billable_hours": 0,
  "message": "Měření času zahájeno"
}
```

**Example - Start tracking:**

```bash
POST /api/tasks/task-uuid/time-tracking
Content-Type: application/json

{
  "started_at": "2025-12-07T10:00:00Z",
  "note": "Začínám s přípravou dokumentů"
}
```

**Example - Log completed time:**

```bash
POST /api/tasks/task-uuid/time-tracking
Content-Type: application/json

{
  "started_at": "2025-12-07T10:00:00Z",
  "stopped_at": "2025-12-07T10:15:00Z",
  "note": "Příprava dokumentů dokončena",
  "billable": true
}
```

---

### 7. GET /api/tasks/[id]/time-tracking

Získání všech záznamů o čase pro úkol.

**Response:**

```json
{
  "entries": [
    {
      "id": "uuid",
      "started_at": "2025-12-07T10:00:00Z",
      "stopped_at": "2025-12-07T10:15:00Z",
      "duration_minutes": 15,
      "note": "...",
      "billable": true
    }
  ],
  "total_duration": 45,
  "billable_duration": 30
}
```

---

### 8. PATCH /api/tasks/[id]/time-tracking

Ukončení běžícího měření času.

**Request Body:**

```typescript
{
  entry_id: string                 // POVINNÉ
  stopped_at: string               // POVINNÉ (ISO 8601)
  note?: string
}
```

**Response:**

```json
{
  "entry": {
    "id": "uuid",
    "stopped_at": "2025-12-07T10:15:00Z",
    "duration_minutes": 15
  },
  "task_actual_minutes": 15,
  "task_billable_hours": 0.25,
  "message": "Měření času ukončeno"
}
```

---

### 9. POST /api/tasks/[id]/accept

Přijmutí delegovaného úkolu.

**Oprávnění:** Pouze uživatel, kterému je úkol přiřazen.

**Response:**

```json
{
  "task": {
    "status": "accepted",
    "accepted": true,
    "accepted_at": "2025-12-07T10:00:00Z"
  },
  "message": "Úkol byl úspěšně přijat"
}
```

---

### 10. POST /api/tasks/[id]/delegate

Delegování úkolu jinému uživateli.

**Request Body:**

```typescript
{
  delegated_to: string             // POVINNÉ (user UUID)
  delegated_to_name: string        // POVINNÉ
  delegation_reason?: string
}
```

**Response (201 Created):**

```json
{
  "original_task": {
    "status": "waiting_for",
    "delegated_to": "uuid",
    "is_waiting_for": true,
    "waiting_for_who": "Jana",
    "waiting_for_what": "Dokončení delegovaného úkolu: ..."
  },
  "delegated_task": {
    "id": "new-uuid",
    "title": "...",
    "status": "pending",
    "assigned_to": "delegated-user-uuid",
    "delegated_from": "original-user-uuid"
  },
  "message": "Úkol byl úspěšně delegován na Jana"
}
```

**Example:**

```bash
POST /api/tasks/task-uuid/delegate
Content-Type: application/json

{
  "delegated_to": "user-uuid",
  "delegated_to_name": "Jana Nováková",
  "delegation_reason": "Potřebuji pomoc s ověřením čísel"
}
```

---

### 11. POST /api/tasks/[id]/complete

Označení úkolu jako dokončeného.

**Validace:**
- U projektů kontroluje, že všechny dílčí úkoly jsou dokončené
- Automaticky zastaví běžící time tracking
- Aktualizuje parent task, pokud byl delegován

**Response:**

```json
{
  "task": {
    "status": "completed",
    "completed_at": "2025-12-07T12:00:00Z",
    "actual_minutes": 45,
    "billable_hours": 0.75
  },
  "message": "Úkol byl úspěšně dokončen | Fakturovatelná částka: 600.00 Kč (0.75h × 800 Kč/h)",
  "billable_summary": {
    "hours": 0.75,
    "rate": 800,
    "amount": 600
  }
}
```

---

## Error Handling

Všechny endpointy vrací standardizované chybové odpovědi:

### 401 Unauthorized
```json
{
  "error": "Nepřihlášen"
}
```

### 403 Forbidden
```json
{
  "error": "Nemáte oprávnění k této operaci"
}
```

### 404 Not Found
```json
{
  "error": "Úkol nenalezen"
}
```

### 400 Bad Request
```json
{
  "error": "Popis chyby",
  "details": ["pole1 je povinné", "pole2 je neplatné"]
}
```

### 500 Internal Server Error
```json
{
  "error": "Interní chyba serveru"
}
```

---

## Rate Limiting

V budoucnu je doporučeno implementovat rate limiting:

```typescript
// Návrh limitů:
- 100 requests/min pro GET endpoints
- 30 requests/min pro POST/PATCH/DELETE endpoints
- 10 requests/min pro time-tracking endpoints (pro zabránění spamu)
```

---

## Helper Functions

API obsahuje pomocné funkce v `/lib/api/task-helpers.ts`:

### Authentication & Authorization
- `requireAuth()` - Kontrola autentizace
- `isAdminOrAccountant()` - Kontrola admin/accountant role
- `canAccessTask()` - Kontrola přístupu k úkolu
- `canModifyTask()` - Kontrola práva na úpravu
- `canDeleteTask()` - Kontrola práva na smazání

### Validation
- `isValidStatus()` - Validace statusu
- `isValidPriority()` - Validace priority
- `validateTaskCreation()` - Validace vytvoření úkolu
- `validateTimeTrackingEntry()` - Validace time tracking

### Error Handling
- `createErrorResponse()` - Vytvoření standardizované chybové odpovědi
- `tryCatch()` - Safe async wrapper

### Common Operations
- `getTaskById()` - Získání úkolu s error handling
- `userExists()` - Kontrola existence uživatele
- `canAccessCompany()` - Kontrola přístupu ke company
- `getCurrentInvoicePeriod()` - Aktuální fakturační období
- `calculateBillableAmount()` - Výpočet fakturovatelné částky
- `formatDuration()` - Formátování času
- `canCompleteTask()` - Kontrola možnosti dokončení
- `stopRunningTimeTracking()` - Zastavení běžícího měření

---

## Database Triggers

API využívá databázové triggery pro automatické aktualizace:

1. **calculate_duration()** - Automatický výpočet duration_minutes při zastavení time tracking
2. **update_task_actual_minutes()** - Automatická aktualizace actual_minutes a billable_hours při změně time entries
3. **update_checklist_actual_minutes()** - Aktualizace času u checklist položek
4. **update_project_progress()** - Automatický výpočet progress_percentage u projektů

---

## TypeScript Types

Všechny typy jsou definovány v `/lib/types/tasks.ts`:

- `Task` - Kompletní task interface
- `TimeTrackingEntry` - Time tracking entry
- `TaskChecklistItem` - Checklist položka
- `TaskInvoice` - Faktura
- `CreateTaskInput` - Input pro vytvoření
- `UpdateTaskInput` - Input pro aktualizaci
- `CreateTimeTrackingInput` - Input pro time tracking
- `TaskFilter` - Filtrovací parametry
- `TaskSortOptions` - Řazení

---

## Testování

### Příklady curl requestů:

```bash
# Vytvoření úkolu
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test task",
    "company_id": "uuid",
    "company_name": "Test Company",
    "priority": "high"
  }'

# Získání seznamu úkolů
curl http://localhost:3000/api/tasks?status=in_progress&priority=high

# Detail úkolu
curl http://localhost:3000/api/tasks/task-uuid

# Aktualizace úkolu
curl -X PATCH http://localhost:3000/api/tasks/task-uuid \
  -H "Content-Type: application/json" \
  -d '{"priority": "critical"}'

# Start time tracking
curl -X POST http://localhost:3000/api/tasks/task-uuid/time-tracking \
  -H "Content-Type: application/json" \
  -d '{
    "started_at": "2025-12-07T10:00:00Z",
    "note": "Starting work"
  }'

# Přijmout úkol
curl -X POST http://localhost:3000/api/tasks/task-uuid/accept

# Delegovat úkol
curl -X POST http://localhost:3000/api/tasks/task-uuid/delegate \
  -H "Content-Type: application/json" \
  -d '{
    "delegated_to": "user-uuid",
    "delegated_to_name": "Jana",
    "delegation_reason": "Need help"
  }'

# Dokončit úkol
curl -X POST http://localhost:3000/api/tasks/task-uuid/complete
```

---

## Implementováno

✅ GET /api/tasks - Seznam úkolů s filtrováním
✅ POST /api/tasks - Vytvoření úkolu
✅ GET /api/tasks/[id] - Detail úkolu s relacemi
✅ PATCH /api/tasks/[id] - Aktualizace úkolu
✅ DELETE /api/tasks/[id] - Smazání (soft delete)
✅ POST /api/tasks/[id]/time-tracking - Logování času
✅ GET /api/tasks/[id]/time-tracking - Seznam záznamů
✅ PATCH /api/tasks/[id]/time-tracking - Ukončení měření
✅ POST /api/tasks/[id]/accept - Přijmutí úkolu
✅ POST /api/tasks/[id]/delegate - Delegování
✅ POST /api/tasks/[id]/complete - Dokončení
✅ Helper functions - Validace a error handling

---

## Poznámky

- Všechny endpointy používají Supabase RLS pro zabezpečení
- Time tracking automaticky aktualizuje actual_minutes a billable_hours přes DB triggery
- Delegování vytváří nový úkol a mění status původního na waiting_for
- Dokončení úkolu kontroluje dokončení všech subtasků u projektů
- Soft delete - úkoly se označují jako cancelled místo fyzického smazání
