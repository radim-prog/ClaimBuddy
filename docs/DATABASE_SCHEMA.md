# ClaimBuddy - Database Schema (Firestore)

## 🗄️ Firestore Collections Overview

```
Firestore Database
├── users/                    # Uživatelé (klienti + admin)
├── cases/                    # Pojistné případy
├── messages/                 # Komunikace (vázané na case)
├── documents/                # Metadata uploadnutých souborů
├── payments/                 # Platební transakce
├── ai_conversations/         # AI chatbot historie
└── settings/                 # System settings (admin)
```

---

## 📊 Collection Schemas

### 1. `users` Collection

**Path:** `/users/{userId}`

**Document Structure:**
```typescript
interface User {
  // Identity
  id: string;                          // Auto-generated UID (Firebase Auth)
  email: string;                       // Email (indexed)

  // Personal Info
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  dateOfBirth?: Timestamp;

  // Address
  address?: {
    street: string;
    city: string;
    postalCode: string;
    country: string;                   // Default: "CZ"
  };

  // Role & Permissions
  role: "client" | "admin";            // Default: "client"
  isActive: boolean;                   // Default: true (soft delete)

  // Metadata
  createdAt: Timestamp;                // Server timestamp
  updatedAt: Timestamp;                // Server timestamp
  lastLoginAt?: Timestamp;

  // Preferences
  preferences?: {
    emailNotifications: boolean;       // Default: true
    smsNotifications: boolean;         // Default: false
    language: "cs" | "en";             // Default: "cs"
  };

  // Stats (denormalized for quick access)
  stats?: {
    totalCases: number;                // Default: 0
    activeCases: number;               // Default: 0
    completedCases: number;            // Default: 0
  };
}
```

**Indexes:**
- `email` (ASC)
- `role` (ASC) + `isActive` (ASC)
- `createdAt` (DESC)

**Security:**
- Users can read/update ONLY their own document
- Admin can read/update all users

---

### 2. `cases` Collection

**Path:** `/cases/{caseId}`

**Document Structure:**
```typescript
interface Case {
  // Identity
  id: string;                          // Auto-generated
  caseNumber: string;                  // User-friendly (e.g., "CB-2025-0001")

  // Owner
  userId: string;                      // Reference to users/{userId}
  userEmail: string;                   // Denormalized for admin queries
  userName: string;                    // Denormalized (firstName + lastName)

  // Case Details
  type: CaseType;                      // "car" | "health" | "property" | "travel" | "other"
  title: string;                       // User-defined title (max 100 chars)
  description: string;                 // Detailed description

  // Insurance Info
  insuranceCompany: string;            // Název pojišťovny
  policyNumber?: string;               // Číslo pojistky
  incidentDate: Timestamp;             // Datum události
  reportedDate: Timestamp;             // Datum nahlášení (auto)

  // Claim Amount
  estimatedAmount?: number;            // Odhadovaná částka (CZK)
  claimedAmount?: number;              // Požadovaná částka (CZK)
  approvedAmount?: number;             // Schválená částka (CZK)

  // Status
  status: CaseStatus;                  // See enum below
  priority: "low" | "medium" | "high"; // Default: "medium"

  // Assignment
  assignedTo?: string;                 // Admin user ID (pokud přiřazeno)
  assignedAt?: Timestamp;

  // Progress Tracking
  milestones: Milestone[];             // See type below

  // AI Features
  aiSummary?: string;                  // AI-generated summary
  aiRecommendations?: string[];        // AI suggestions

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  closedAt?: Timestamp;

  // Counters (denormalized)
  stats: {
    messageCount: number;              // Default: 0
    documentCount: number;             // Default: 0
    unreadMessages: number;            // Default: 0 (for client)
  };
}

// Case Types
type CaseType =
  | "car"          // Autopojištění (havarijní, povinné ručení)
  | "health"       // Zdravotní/životní pojištění
  | "property"     // Majetkové pojištění (dům, byt)
  | "travel"       // Cestovní pojištění
  | "other";       // Ostatní

// Case Statuses (workflow)
type CaseStatus =
  | "draft"        // Rozpracovaný (client může editovat)
  | "submitted"    // Odeslaný (čeká na review)
  | "in_review"    // V posouzení (admin reviewuje)
  | "pending_info" // Čeká na doplnění info od klienta
  | "in_progress"  // V jednání s pojišťovnou
  | "resolved"     // Vyřešený (vyplaceno)
  | "rejected"     // Zamítnutý
  | "cancelled";   // Zrušený klientem

// Milestones (progress tracking)
interface Milestone {
  id: string;
  title: string;                       // "Dokumentace odeslána", "Jednání s pojišťovnou"
  status: "pending" | "in_progress" | "completed" | "skipped";
  completedAt?: Timestamp;
  completedBy?: string;                // User ID (admin)
  note?: string;
}
```

**Indexes:**
- `userId` (ASC) + `status` (ASC) + `createdAt` (DESC)
- `status` (ASC) + `priority` (DESC) + `createdAt` (DESC)
- `caseNumber` (ASC)
- `assignedTo` (ASC) + `status` (ASC)

**Security:**
- Client can read/update ONLY their own cases
- Admin can read/update all cases

---

### 3. `messages` Collection

**Path:** `/cases/{caseId}/messages/{messageId}` (subcollection)

**Document Structure:**
```typescript
interface Message {
  // Identity
  id: string;                          // Auto-generated
  caseId: string;                      // Parent case ID

  // Author
  authorId: string;                    // User ID (client nebo admin)
  authorName: string;                  // Denormalized
  authorRole: "client" | "admin" | "system"; // system = auto messages

  // Content
  content: string;                     // Message text
  contentType: "text" | "html";        // Default: "text"

  // Attachments
  attachments?: {
    documentId: string;                // Reference to documents/{id}
    fileName: string;
    fileType: string;
    fileSize: number;
  }[];

  // Metadata
  createdAt: Timestamp;
  isRead: boolean;                     // Default: false
  readAt?: Timestamp;
  readBy?: string;                     // User ID who read it

  // AI Context
  isAiGenerated?: boolean;             // True pokud vygeneroval AI
  aiContext?: {
    conversationId: string;            // Reference to ai_conversations
    promptUsed?: string;
  };
}
```

**Indexes:**
- `caseId` (ASC) + `createdAt` (ASC)
- `authorId` (ASC) + `createdAt` (DESC)
- `isRead` (ASC) + `createdAt` (DESC)

**Security:**
- Only case owner + admin + assigned user can read
- Only case owner + admin can create

---

### 4. `documents` Collection

**Path:** `/documents/{documentId}`

**Document Structure:**
```typescript
interface Document {
  // Identity
  id: string;                          // Auto-generated

  // Ownership
  caseId: string;                      // Reference to cases/{id}
  userId: string;                      // Uploader user ID

  // File Info
  fileName: string;                    // Original filename
  fileType: string;                    // MIME type (e.g., "application/pdf")
  fileSize: number;                    // Bytes
  fileExtension: string;               // "pdf", "jpg", "png", etc.

  // Storage
  storagePath: string;                 // Firebase Storage path
  downloadUrl?: string;                // Public URL (if shared)
  thumbnailUrl?: string;               // Thumbnail pro images

  // Classification
  documentType: DocumentType;          // See enum below
  category?: string;                   // Custom tag

  // AI Processing
  ocrText?: string;                    // Extracted text (from OCR)
  ocrStatus?: "pending" | "processing" | "completed" | "failed";
  aiExtractedData?: {                  // AI-parsed fields
    invoiceNumber?: string;
    invoiceDate?: string;
    totalAmount?: number;
    insuranceCompany?: string;
    policyNumber?: string;
    // ... další fields
  };

  // Security
  isEncrypted: boolean;                // Default: true (for health docs)
  encryptionKey?: string;              // Reference to encryption key

  // Metadata
  uploadedAt: Timestamp;
  uploadedBy: string;                  // User ID
  lastAccessedAt?: Timestamp;

  // Validation
  isVerified: boolean;                 // Default: false (admin verifies)
  verifiedBy?: string;                 // Admin user ID
  verifiedAt?: Timestamp;
}

// Document Types
type DocumentType =
  | "invoice"          // Faktura za služby
  | "medical_report"   // Lékařská zpráva
  | "police_report"    // Protokol policie
  | "photo"            // Fotografie škody
  | "contract"         // Pojistná smlouva
  | "correspondence"   // Korespondence s pojišťovnou
  | "other";
```

**Indexes:**
- `caseId` (ASC) + `uploadedAt` (DESC)
- `userId` (ASC) + `uploadedAt` (DESC)
- `documentType` (ASC) + `uploadedAt` (DESC)
- `ocrStatus` (ASC)

**Security:**
- Only case owner + admin can read
- Files stored in Firebase Storage with token-based access

---

### 5. `payments` Collection

**Path:** `/payments/{paymentId}`

**Document Structure:**
```typescript
interface Payment {
  // Identity
  id: string;                          // Auto-generated

  // User & Case
  userId: string;                      // Plátce
  caseId?: string;                     // Associated case (optional)

  // Payment Details
  amount: number;                      // CZK (haléře = amount * 100)
  currency: "CZK" | "EUR";             // Default: "CZK"
  description: string;                 // Co platí (e.g., "Zpracování případu CB-2025-0001")

  // Payment Method
  provider: "stripe" | "gopay";
  paymentMethod?: string;              // "card", "bank_transfer", etc.

  // External References
  stripePaymentIntentId?: string;      // Stripe Payment Intent ID
  stripeCustomerId?: string;
  gopayId?: string;                    // GoPay payment ID
  gopayGwUrl?: string;                 // GoPay gateway URL

  // Status
  status: PaymentStatus;               // See enum below

  // Invoice
  invoiceNumber?: string;              // Auto-generated
  invoiceUrl?: string;                 // PDF URL

  // Metadata
  createdAt: Timestamp;
  paidAt?: Timestamp;
  cancelledAt?: Timestamp;
  refundedAt?: Timestamp;

  // Refund
  refundAmount?: number;
  refundReason?: string;

  // Webhook Events
  webhookEvents?: {
    event: string;
    receivedAt: Timestamp;
    data: any;
  }[];
}

// Payment Statuses
type PaymentStatus =
  | "pending"      // Vytvořený, čeká na platbu
  | "processing"   // V procesu
  | "succeeded"    // Zaplaceno
  | "failed"       // Selhala platba
  | "cancelled"    // Zrušeno uživatelem
  | "refunded";    // Vráceno
```

**Indexes:**
- `userId` (ASC) + `createdAt` (DESC)
- `caseId` (ASC) + `status` (ASC)
- `status` (ASC) + `createdAt` (DESC)
- `stripePaymentIntentId` (ASC)
- `gopayId` (ASC)

**Security:**
- Only payment owner + admin can read
- Webhook endpoints validate with secret keys

---

### 6. `ai_conversations` Collection

**Path:** `/ai_conversations/{conversationId}`

**Document Structure:**
```typescript
interface AIConversation {
  // Identity
  id: string;                          // Auto-generated

  // User
  userId: string;                      // User chatting
  caseId?: string;                     // Associated case (optional)

  // Conversation
  messages: AIMessage[];               // Chat history

  // Context
  systemPrompt?: string;               // System prompt used
  model: string;                       // "gemini-2.0-flash"

  // Usage Stats
  totalTokens?: number;
  totalCost?: number;                  // USD (tracking)

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastMessageAt?: Timestamp;

  // Flags
  isSaved: boolean;                    // Default: false (auto-cleanup old convos)
  isArchived: boolean;
}

interface AIMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Timestamp;
  tokens?: number;
}
```

**Indexes:**
- `userId` (ASC) + `lastMessageAt` (DESC)
- `caseId` (ASC) + `createdAt` (DESC)
- `isSaved` (ASC) + `createdAt` (DESC)

**Security:**
- Only conversation owner can read
- Auto-cleanup conversations older than 30 days (if not saved)

---

### 7. `settings` Collection (Admin only)

**Path:** `/settings/global`

**Document Structure:**
```typescript
interface SystemSettings {
  // Business
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  supportEmail: string;

  // Pricing
  pricing: {
    successFee: number;                // % (e.g., 15 = 15%)
    minFee: number;                    // CZK minimum
    maxFee?: number;                   // CZK maximum (optional)
  };

  // AI Settings
  ai: {
    geminiApiKey: string;              // Stored encrypted
    defaultModel: string;              // "gemini-2.0-flash"
    maxTokensPerRequest: number;       // Default: 2048
    temperature: number;               // Default: 0.7
  };

  // Limits
  limits: {
    maxFileSizeMB: number;             // Default: 25
    maxFilesPerCase: number;           // Default: 20
    maxCasesPerUser: number;           // Default: unlimited (-1)
  };

  // Features
  features: {
    aiChatEnabled: boolean;
    ocrEnabled: boolean;
    stripeEnabled: boolean;
    gopayEnabled: boolean;
  };

  // Metadata
  updatedAt: Timestamp;
  updatedBy: string;                   // Admin user ID
}
```

**Security:**
- ONLY admin can read/write

---

## 🔐 Firestore Security Rules Summary

### Users:
- ✅ Read: Own document OR admin
- ✅ Write: Own document OR admin
- ❌ Create: Only via Firebase Auth
- ❌ Delete: Admin only (soft delete via `isActive`)

### Cases:
- ✅ Read: Owner OR admin OR assigned admin
- ✅ Write: Owner (if status = draft/pending_info) OR admin
- ✅ Create: Authenticated users only
- ❌ Delete: Admin only

### Messages:
- ✅ Read: Case participants only
- ✅ Write: Case participants only
- ✅ Create: Authenticated users
- ❌ Delete: Never (audit trail)

### Documents:
- ✅ Read: Case owner OR admin
- ✅ Write: Case owner OR admin (metadata only)
- ✅ Create: Case owner OR admin
- ❌ Delete: Admin only (soft delete recommended)

### Payments:
- ✅ Read: Payment owner OR admin
- ✅ Write: System only (via API routes)
- ❌ User-initiated writes: DENIED (security)

### AI Conversations:
- ✅ Read: Owner only
- ✅ Write: Owner only
- ✅ Auto-cleanup: System cron job

### Settings:
- ✅ Read: Admin only
- ✅ Write: Admin only

---

## 📈 Denormalization Strategy

**Why Denormalize?**
- Firestore charges per document read
- Joins are expensive (client-side)
- Faster queries for common use cases

**Denormalized Fields:**
1. **users.stats** - Avoid counting cases on every dashboard load
2. **cases.userEmail, userName** - Admin quick view (no user lookup)
3. **cases.stats** - Message/document counts
4. **messages.authorName** - Display without user lookup

**Trade-off:**
- More complex updates (update multiple places)
- Slight data staleness (eventual consistency)
- WORTH IT for read-heavy app (99% reads, 1% writes)

---

## 🚀 Query Optimization Examples

### Client Dashboard - Recent Cases:
```typescript
const casesRef = collection(db, 'cases');
const q = query(
  casesRef,
  where('userId', '==', currentUserId),
  orderBy('updatedAt', 'desc'),
  limit(10)
);
```

### Admin - Cases Needing Attention:
```typescript
const q = query(
  casesRef,
  where('status', 'in', ['submitted', 'pending_info']),
  orderBy('priority', 'desc'),
  orderBy('createdAt', 'asc'),
  limit(20)
);
```

### Unread Messages Count:
```typescript
// Denormalized in case.stats.unreadMessages
// No subcollection query needed!
```

---

## 💾 Data Retention Policy

**Active Data:**
- Cases: Indefinite (legal requirement)
- Messages: Indefinite (audit trail)
- Documents: Indefinite (evidence)
- Payments: 10 years (accounting law)

**Auto-Cleanup:**
- AI conversations: 30 days (if not saved)
- Draft cases (never submitted): 90 days
- Failed payments: 180 days

**GDPR Right to Deletion:**
- Soft delete user (isActive = false)
- Anonymize PII in cases/messages
- Keep audit trail (legal requirement)

---

## 🔢 Initial Data Seeds

### Case Statuses Config:
```typescript
// Stored in settings/case_statuses
const statuses = [
  { value: "draft", label: "Rozpracovaný", color: "gray" },
  { value: "submitted", label: "Odeslaný", color: "blue" },
  { value: "in_review", label: "V posouzení", color: "yellow" },
  // ... atd
];
```

### Insurance Companies List:
```typescript
// Stored in settings/insurance_companies
const companies = [
  "Česká pojišťovna",
  "Kooperativa",
  "Allianz",
  "Generali",
  "ČSOB Pojišťovna",
  // ... atd
];
```

---

## 📊 Estimated Data Sizes (at scale)

**10,000 users:**
- Users: 10,000 docs (~5 MB)
- Cases (avg 3/user): 30,000 docs (~150 MB)
- Messages (avg 20/case): 600,000 docs (~300 MB)
- Documents (avg 5/case): 150,000 docs (~750 MB metadata only)
- Payments: ~15,000 docs (~7.5 MB)
- AI conversations: ~50,000 docs (~250 MB)

**Total Firestore:** ~1.5 GB (well within limits)
**Storage (files):** ~300 GB (depends on file sizes)

**Firestore Free Tier:**
- ❌ Exceeded (need Blaze plan)
- Estimated cost at 10k users: $50-100/month

**Storage Free Tier:**
- ❌ Exceeded
- Estimated cost: $10-20/month
