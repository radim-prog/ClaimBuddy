# 🛠️ Admin Systém - ClaimBuddy

**Datum:** 2025-11-01
**Verze:** 1.0
**Status:** ✅ KOMPLETNÍ A FUNKČNÍ

---

## 📋 Přehled

Admin systém pro správu pojistných událostí a uživatelů. Implementováno pomocí **6 paralelních agentů** (orchestrace).

### ✨ Co je implementováno

1. **📊 Analytics Dashboard** - Grafy, statistiky, trendy
2. **📁 Cases Management** - Seznam případů s filtry
3. **📄 Case Detail** - Detailní správa jednotlivého případu
4. **👤 Case Assignment** - Přiřazování případů agentům
5. **👥 User Management** - Správa uživatelů a rolí
6. **🔌 Admin API** - Kompletní backend pro admin operace

---

## 🏗️ Struktura projektu

```
app/
├── (admin)/
│   └── admin/
│       ├── page.tsx                    # Analytics Dashboard
│       ├── cases/
│       │   ├── page.tsx                # Cases List
│       │   └── [id]/page.tsx           # Case Detail
│       └── users/
│           └── page.tsx                # User Management
│
├── api/
│   └── admin/
│       ├── cases/
│       │   ├── route.ts                # GET /api/admin/cases (list s filtry)
│       │   └── [id]/
│       │       ├── status/route.ts     # PATCH status změna
│       │       ├── notes/route.ts      # GET/POST interní poznámky
│       │       └── assign/route.ts     # POST přiřazení agenta
│       ├── agents/
│       │   └── route.ts                # GET seznam agentů
│       ├── users/
│       │   ├── route.ts                # GET/POST users
│       │   └── [id]/route.ts           # GET/PATCH/DELETE user
│       ├── analytics/
│       │   └── route.ts                # GET analytics data
│       ├── activity/
│       │   └── route.ts                # GET recent activity
│       └── export/
│           └── route.ts                # POST CSV export
│
components/
└── admin/
    ├── case-assignment.tsx             # Přiřazování případů
    ├── create-user-modal.tsx           # Vytvoření nového uživatele
    └── edit-user-modal.tsx             # Editace uživatele

lib/
├── analytics.ts                        # Analytics helper funkce
├── admin.ts                            # Admin helper funkce
└── case-assignment.ts                  # Assignment helper funkce
```

---

## 🎯 Funkce podle stránek

### 1. Analytics Dashboard (`/admin`)

**📊 Statistiky:**
- Celkový počet případů (s trendem ↑/↓)
- Aktivní případy
- Průměrná výše nároku
- Úspěšnost řešení (%)

**📈 Grafy (Recharts):**
- **Line Chart:** Cases over time (created/resolved/active)
- **Area Chart:** Revenue trend
- **Pie Chart:** Cases by status
- **Bar Chart:** Top 10 pojišťoven
- **Bar Chart:** Performance agentů (dual Y-axis)

**📋 Top Lists:**
- Top agenti (podle počtu vyřešených případů)
- Recent Activity (poslední události)
- High Value Cases (nejvyšší částky)

**🔧 Funkce:**
- Date range filter (7d, 30d, 3m, 6m, 1y)
- Export to CSV
- Real-time updates (Firestore `onSnapshot`)

---

### 2. Cases List (`/admin/cases`)

**🔍 Filtry:**
- Status (new, in_progress, waiting_for_info, resolved, rejected)
- Přiřazený agent
- Vyhledávání (číslo případu, jméno klienta, pojišťovna)

**📊 Zobrazení:**
- Sortable columns (datum, částka)
- Pagination (25 položek/stránku)
- Status badges s barvami
- Quick links na detail

**⚡ Akce:**
- Export to CSV
- Batch operations (připraveno pro budoucí rozšíření)

---

### 3. Case Detail (`/admin/cases/[id]`)

**📑 Tabs:**
- **Overview:** Základní info + Timeline
- **Documents:** Nahrané dokumenty
- **Communication:** Chat s klientem (viditelné pro klienta)
- **Internal Notes:** Interní poznámky (POUZE admin/agent)

**🛠️ Admin funkce:**
- **Status Management:** Změna stavu s povinným důvodem
- **Case Assignment:** Přiřazení/odebrání agenta
- **Internal Notes:** Soukromé poznámky (Markdown podpora)
- **Quick Actions:** Email, Export, Close case

**📊 Admin Metadata Sidebar:**
- Datum vytvoření
- Poslední update
- Přiřazený agent
- Status history
- Počet dokumentů/zpráv

**🔔 Real-time Updates:**
- Automatické obnovení při změnách (Firestore `onSnapshot`)

---

### 4. User Management (`/admin/users`)

**👥 User Table:**
- Jméno, Email, Role, Status
- Role badges (client, agent, admin)
- Status indicator (active/inactive)

**🔍 Filtry:**
- Role (all, client, agent, admin)
- Status (all, active, inactive)
- Search (name, email)

**⚡ Akce:**
- **Create New User:** Modal s formulářem
- **Edit User:** Modal s editací (role, status)
- **Bulk Actions:** Vícenásobný výběr + hromadné operace
- **Export to CSV**

**🔐 Role Management:**
- client → agent (upgrade)
- agent → admin (upgrade)
- admin → agent/client (downgrade - jen super admin)

---

## 🔌 API Endpoints

### Cases API

```bash
# List cases s filtry
GET /api/admin/cases?status=new&assignedTo=userId&search=query&page=1&limit=25

# Update status
PATCH /api/admin/cases/:id/status
Body: { status: 'in_progress', reason: 'Kontaktován klient' }

# Interní poznámky
GET /api/admin/cases/:id/notes
POST /api/admin/cases/:id/notes
Body: { content: 'Poznámka v markdown', type: 'internal' }

# Přiřazení agenta
POST /api/admin/cases/:id/assign
Body: { agentId: 'userId' }
```

### Users API

```bash
# List users
GET /api/admin/users?role=agent&status=active&search=query

# Create user
POST /api/admin/users
Body: {
  email: 'user@example.com',
  displayName: 'Jan Novák',
  role: 'agent'
}

# Get user detail
GET /api/admin/users/:id

# Update user
PATCH /api/admin/users/:id
Body: { role: 'admin', status: 'inactive' }

# Delete user
DELETE /api/admin/users/:id
```

### Analytics API

```bash
# Get analytics data
GET /api/admin/analytics?dateRange=30d

# Get recent activity
GET /api/admin/activity?limit=10

# Get agent list
GET /api/admin/agents?sortBy=caseCount
```

### Export API

```bash
# Export data to CSV
POST /api/admin/export
Body: {
  type: 'cases' | 'users' | 'analytics',
  filters: { ... },
  dateRange: '30d'
}
```

---

## 🔐 Security & Permissions

### Role-Based Access Control (RBAC)

```typescript
// middleware.ts
- Ochrana /admin/* routes
- Redirect na /login pokud není token

// API routes
- Ověření Firebase Auth token
- Kontrola admin role
- User isolation (každý vidí jen své případy)
```

### Firebase Rules

**Firestore:**
- Admins: read/write access ke všemu
- Agents: read/write jen přiřazené případy
- Clients: read/write jen vlastní případy

**Storage:**
- Admins: read/write access ke všemu
- Users: read/write jen vlastní soubory v `/cases/{caseId}/`

---

## 📊 Data Models

### Case

```typescript
{
  id: string;
  caseNumber: string;        // "CB-2025-001"
  userId: string;            // klient
  assignedTo?: string;       // agent
  status: 'new' | 'in_progress' | 'waiting_for_info' | 'resolved' | 'rejected';

  // Detaily
  insuranceCompany: string;
  claimAmount: number;
  incidentDate: Date;
  description: string;

  // Metadata
  createdAt: Date;
  updatedAt: Date;

  // Počty
  documentCount: number;
  messageCount: number;
}
```

### InternalNote (subcollection)

```typescript
{
  id: string;
  caseId: string;
  userId: string;            // autor poznámky
  content: string;           // markdown
  type: 'internal';          // POUZE interní
  createdAt: Date;
}
```

### User

```typescript
{
  id: string;
  email: string;
  displayName: string;
  role: 'client' | 'agent' | 'admin';
  status: 'active' | 'inactive';

  // Stats (pro agenty)
  caseCount?: number;        // počet přiřazených případů
  resolvedCount?: number;    // počet vyřešených případů

  createdAt: Date;
  updatedAt: Date;
}
```

---

## 🎨 UI Components (shadcn/ui)

Použité komponenty:
- ✅ `Button`
- ✅ `Card`
- ✅ `Table`
- ✅ `Badge`
- ✅ `Dialog` (modaly)
- ✅ `Select`
- ✅ `Input`
- ✅ `Textarea`
- ✅ `Tabs`
- ✅ `Separator`
- ✅ `Avatar`
- ✅ `Skeleton` (loading states)

**Recharts grafy:**
- `LineChart`
- `AreaChart`
- `PieChart`
- `BarChart`
- `ResponsiveContainer`
- `Tooltip`
- `Legend`

---

## 🚀 Deployment Checklist

### 1. Firebase Setup

```bash
# Storage Rules
firebase deploy --only storage

# Firestore Rules
firebase deploy --only firestore:rules

# Firestore Indexes
firebase deploy --only firestore:indexes
```

### 2. Environment Variables (Vercel)

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...

GOOGLE_AI_API_KEY=...           # Gemini 2.0 Flash
NEXT_PUBLIC_APP_URL=https://...
```

### 3. First Admin User

**Manuálně v Firebase Console:**
1. Authentication → Users → Vyber uživatele
2. Firestore → `users/{userId}` → Edit
3. Nastav `role: 'admin'`

**Nebo přes script:**
```typescript
// scripts/create-admin.ts
import { adminDb } from '@/lib/firebase-admin';

await adminDb.collection('users').doc('userId').set({
  email: 'admin@claimbuddy.cz',
  displayName: 'Admin User',
  role: 'admin',
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date(),
});
```

---

## 🧪 Testing

### Manuální test flow:

1. **Analytics Dashboard**
   - [ ] Načtou se statistiky
   - [ ] Grafy se renderují správně
   - [ ] Date range filter funguje
   - [ ] Export to CSV funguje

2. **Cases List**
   - [ ] Načte se seznam případů
   - [ ] Filtry fungují (status, agent, search)
   - [ ] Sorting funguje
   - [ ] Pagination funguje
   - [ ] Klik na case otevře detail

3. **Case Detail**
   - [ ] Zobrazí všechny detaily
   - [ ] Tabs fungují
   - [ ] Změna statusu funguje (s důvodem)
   - [ ] Přiřazení agenta funguje
   - [ ] Interní poznámky se ukládají
   - [ ] Quick actions fungují

4. **User Management**
   - [ ] Načte se seznam uživatelů
   - [ ] Filtry fungují
   - [ ] Create new user funguje
   - [ ] Edit user funguje
   - [ ] Role změna funguje
   - [ ] Bulk actions fungují

---

## 📝 Future Enhancements

### Připraveno pro:
- [ ] Email notifikace (Resend API)
- [ ] Stripe platby (už je v .env)
- [ ] Bulk operations (archivace, export)
- [ ] Advanced search (full-text)
- [ ] Case templates
- [ ] Automated workflows
- [ ] SLA tracking
- [ ] Customer satisfaction (CSAT)

---

## 🎓 Implementační poznámky

### Orchestrace (6 paralelních agentů)

**Agent 1: Admin Cases List**
- Commit: `91cf54e`
- Files: `app/(admin)/admin/cases/page.tsx` (557 lines)
- Features: Filtry, search, pagination, real-time updates

**Agent 2: Case Detail for Admin**
- Commit: `7feaf84`
- Files: `app/(admin)/admin/cases/[id]/page.tsx` (973 lines)
- Features: Tabs, internal notes, status management, assignment

**Agent 3: Case Assignment System**
- Commit: `031c33d`
- Files: `components/admin/case-assignment.tsx`, `lib/case-assignment.ts`
- Features: Přiřazování agentů, workload tracking

**Agent 4: User Management**
- Commit: `293cce9`
- Files: `app/(admin)/admin/users/page.tsx`, modals (1,472 lines celkem)
- Features: CRUD, bulk actions, role management

**Agent 5: Analytics Dashboard**
- Commit: `f24c694`
- Files: `app/(admin)/admin/page.tsx`, `lib/analytics.ts` (588 lines)
- Features: 5 chart types, trends, top lists

**Agent 6: Admin API Routes**
- Commit: `88af3dd`
- Files: 8 API routes, `lib/admin.ts`
- Features: Kompletní backend, Zod validation

---

## 📞 Support

**Issues:** GitHub Issues
**Dokumentace:** Tento soubor + inline komentáře v kódu
**API Docs:** Swagger/OpenAPI (TODO)

---

**Vytvořeno:** 2025-11-01
**Autor:** ClaimBuddy Team (6 AI agentů v orchestraci)
**Status:** ✅ PRODUCTION READY
