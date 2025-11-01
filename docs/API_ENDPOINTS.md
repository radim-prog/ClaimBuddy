# ClaimBuddy - API Endpoints Documentation

## 🎯 API Overview

**Base URL:** `https://claimbuddy.com/api` (production)
**Local:** `http://localhost:3000/api`

**Architecture:** Next.js API Routes (serverless functions)
**Authentication:** Firebase Auth tokens (Bearer)
**Response Format:** JSON
**Error Handling:** Standardized error responses

---

## 🔐 Authentication

All protected endpoints require Firebase Auth token:

```bash
Authorization: Bearer <firebase-id-token>
```

**How to get token:**
```typescript
const user = auth.currentUser;
const token = await user.getIdToken();
```

---

## 📋 API Endpoints

### Authentication

#### `POST /api/auth/register`
Register new user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "Jan",
  "lastName": "Novák",
  "phoneNumber": "+420123456789"
}
```

**Response (201):**
```json
{
  "success": true,
  "user": {
    "id": "abc123",
    "email": "user@example.com",
    "firstName": "Jan",
    "lastName": "Novák",
    "role": "client"
  },
  "token": "eyJhbGc..."
}
```

**Errors:**
- `400` - Invalid input
- `409` - Email already exists

---

#### `POST /api/auth/login`
Login existing user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "abc123",
    "email": "user@example.com",
    "firstName": "Jan",
    "lastName": "Novák",
    "role": "client"
  },
  "token": "eyJhbGc..."
}
```

**Errors:**
- `401` - Invalid credentials
- `403` - Account disabled

---

#### `POST /api/auth/verify`
Verify Firebase token and get user data.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "abc123",
    "email": "user@example.com",
    "firstName": "Jan",
    "lastName": "Novák",
    "role": "client",
    "isActive": true
  }
}
```

**Errors:**
- `401` - Invalid or expired token

---

### Cases Management

#### `GET /api/cases`
List user's cases (or all cases for admin).

**Headers:**
```
Authorization: Bearer <token>
```

**Query Params:**
```
?status=submitted&limit=20&offset=0&sortBy=updatedAt&order=desc
```

**Response (200):**
```json
{
  "success": true,
  "cases": [
    {
      "id": "case123",
      "caseNumber": "CB-2025-0001",
      "title": "Dopravní nehoda na D1",
      "type": "car",
      "status": "submitted",
      "priority": "high",
      "insuranceCompany": "Česká pojišťovna",
      "estimatedAmount": 50000,
      "createdAt": "2025-10-22T10:00:00Z",
      "updatedAt": "2025-10-23T14:30:00Z",
      "stats": {
        "messageCount": 5,
        "documentCount": 3,
        "unreadMessages": 1
      }
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 20
}
```

**Errors:**
- `401` - Unauthorized

---

#### `POST /api/cases`
Create new case.

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "type": "car",
  "title": "Dopravní nehoda na D1",
  "description": "Srážka s jiným vozidlem při prudkém brzdění.",
  "insuranceCompany": "Česká pojišťovna",
  "policyNumber": "1234567890",
  "incidentDate": "2025-10-20T15:30:00Z",
  "estimatedAmount": 50000
}
```

**Response (201):**
```json
{
  "success": true,
  "case": {
    "id": "case123",
    "caseNumber": "CB-2025-0001",
    "status": "draft",
    "createdAt": "2025-10-22T10:00:00Z",
    // ... full case object
  }
}
```

**Errors:**
- `400` - Invalid input (validation errors)
- `401` - Unauthorized
- `429` - Rate limit exceeded

---

#### `GET /api/cases/[id]`
Get case detail.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "case": {
    "id": "case123",
    "caseNumber": "CB-2025-0001",
    "title": "Dopravní nehoda na D1",
    "type": "car",
    "status": "in_progress",
    "description": "...",
    "insuranceCompany": "Česká pojišťovna",
    "policyNumber": "1234567890",
    "incidentDate": "2025-10-20T15:30:00Z",
    "reportedDate": "2025-10-22T10:00:00Z",
    "estimatedAmount": 50000,
    "claimedAmount": 50000,
    "approvedAmount": null,
    "priority": "high",
    "assignedTo": "admin456",
    "milestones": [
      {
        "id": "m1",
        "title": "Dokumentace přijata",
        "status": "completed",
        "completedAt": "2025-10-22T11:00:00Z"
      },
      {
        "id": "m2",
        "title": "Jednání s pojišťovnou",
        "status": "in_progress"
      }
    ],
    "aiSummary": "Klient hlásí dopravní nehodu...",
    "createdAt": "2025-10-22T10:00:00Z",
    "updatedAt": "2025-10-23T14:30:00Z",
    "stats": {
      "messageCount": 5,
      "documentCount": 3,
      "unreadMessages": 1
    }
  }
}
```

**Errors:**
- `401` - Unauthorized
- `403` - Forbidden (not your case)
- `404` - Case not found

---

#### `PATCH /api/cases/[id]`
Update case (partial update).

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "estimatedAmount": 60000
}
```

**Response (200):**
```json
{
  "success": true,
  "case": {
    // ... updated case object
  }
}
```

**Errors:**
- `400` - Invalid input
- `401` - Unauthorized
- `403` - Forbidden (case locked or not owner)
- `404` - Case not found

**Note:** Client can only update draft/pending_info cases. Admin can update any case.

---

#### `DELETE /api/cases/[id]`
Delete case (admin only, soft delete recommended).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Case deleted successfully"
}
```

**Errors:**
- `401` - Unauthorized
- `403` - Forbidden (not admin)
- `404` - Case not found

---

#### `PATCH /api/cases/[id]/status`
Update case status (workflow transition).

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "status": "submitted",
  "note": "All documents uploaded"
}
```

**Response (200):**
```json
{
  "success": true,
  "case": {
    "id": "case123",
    "status": "submitted",
    "updatedAt": "2025-10-23T15:00:00Z"
  }
}
```

**Errors:**
- `400` - Invalid status transition
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Case not found

**Valid Transitions:**
- `draft` → `submitted` (client)
- `submitted` → `in_review` (admin)
- `in_review` → `pending_info` | `in_progress` (admin)
- `pending_info` → `submitted` (client)
- `in_progress` → `resolved` | `rejected` (admin)
- Any status → `cancelled` (client/admin)

---

### Messages

#### `GET /api/cases/[id]/messages`
Get messages for a case.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Params:**
```
?limit=50&offset=0&order=asc
```

**Response (200):**
```json
{
  "success": true,
  "messages": [
    {
      "id": "msg123",
      "caseId": "case123",
      "authorId": "user123",
      "authorName": "Jan Novák",
      "authorRole": "client",
      "content": "Ahoj, přikládám fotky škody.",
      "contentType": "text",
      "attachments": [
        {
          "documentId": "doc456",
          "fileName": "skoda1.jpg",
          "fileType": "image/jpeg",
          "fileSize": 524288
        }
      ],
      "createdAt": "2025-10-22T10:30:00Z",
      "isRead": false
    }
  ],
  "total": 15,
  "unreadCount": 2
}
```

**Errors:**
- `401` - Unauthorized
- `403` - Forbidden (not case participant)
- `404` - Case not found

---

#### `POST /api/cases/[id]/messages`
Create new message.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request:**
```json
{
  "content": "Děkuji za informace, připravím další dokumenty.",
  "attachments": [
    {
      "documentId": "doc789"
    }
  ]
}
```

**Response (201):**
```json
{
  "success": true,
  "message": {
    "id": "msg456",
    "caseId": "case123",
    "authorId": "admin123",
    "authorName": "Petra Adminová",
    "authorRole": "admin",
    "content": "Děkuji za informace...",
    "createdAt": "2025-10-23T09:15:00Z",
    "isRead": false
  }
}
```

**Errors:**
- `400` - Invalid input
- `401` - Unauthorized
- `403` - Forbidden (case closed or not participant)
- `404` - Case not found

**Note:** Sending message triggers email notification to other party.

---

### Documents

#### `GET /api/cases/[id]/documents`
List documents for a case.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "documents": [
    {
      "id": "doc123",
      "caseId": "case123",
      "fileName": "faktura.pdf",
      "fileType": "application/pdf",
      "fileSize": 1048576,
      "fileExtension": "pdf",
      "documentType": "invoice",
      "downloadUrl": "https://storage.googleapis.com/...",
      "thumbnailUrl": null,
      "ocrText": "Faktura č. 2025001...",
      "ocrStatus": "completed",
      "aiExtractedData": {
        "invoiceNumber": "2025001",
        "invoiceDate": "2025-10-20",
        "totalAmount": 15000
      },
      "uploadedAt": "2025-10-22T10:15:00Z",
      "uploadedBy": "user123",
      "isVerified": true
    }
  ],
  "total": 5
}
```

**Errors:**
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Case not found

---

#### `POST /api/cases/[id]/documents`
Upload document (multipart/form-data).

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request (FormData):**
```
file: <binary>
documentType: "invoice"
category: "repair"
```

**Response (201):**
```json
{
  "success": true,
  "document": {
    "id": "doc456",
    "caseId": "case123",
    "fileName": "faktura.pdf",
    "fileType": "application/pdf",
    "fileSize": 1048576,
    "documentType": "invoice",
    "downloadUrl": "https://storage.googleapis.com/...",
    "ocrStatus": "pending",
    "uploadedAt": "2025-10-23T10:00:00Z"
  }
}
```

**Errors:**
- `400` - Invalid file (too large, wrong type)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Case not found
- `413` - File too large (max 25 MB)
- `415` - Unsupported file type

**Allowed File Types:**
- PDF: `application/pdf`
- Images: `image/jpeg`, `image/png`, `image/heic`
- Word: `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

**Max File Size:** 25 MB

---

#### `DELETE /api/cases/[id]/documents/[documentId]`
Delete document.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Document deleted successfully"
}
```

**Errors:**
- `401` - Unauthorized
- `403` - Forbidden (not owner or admin)
- `404` - Document not found

---

### File Upload (Direct)

#### `POST /api/upload`
Get signed upload URL (for client-side direct upload to Firebase Storage).

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "fileName": "faktura.pdf",
  "fileType": "application/pdf",
  "fileSize": 1048576,
  "caseId": "case123"
}
```

**Response (200):**
```json
{
  "success": true,
  "uploadUrl": "https://storage.googleapis.com/...",
  "downloadUrl": "https://storage.googleapis.com/...",
  "token": "upload-token-123",
  "expiresAt": "2025-10-23T11:00:00Z"
}
```

**Errors:**
- `400` - Invalid file info
- `401` - Unauthorized
- `403` - Forbidden (case quota exceeded)

**Usage:**
1. Call `/api/upload` to get signed URL
2. Upload file directly to Firebase Storage using signed URL
3. Call `/api/cases/[id]/documents` to create document metadata

---

### AI Features

#### `POST /api/ai/chat`
Chat with AI assistant (streaming response).

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request:**
```json
{
  "message": "Jaké dokumenty potřebuji k nároku na náhradu?",
  "caseId": "case123",
  "conversationId": "conv456"
}
```

**Response (200 - Server-Sent Events):**
```
data: {"token": "K"}
data: {"token": " nároku"}
data: {"token": " na"}
...
data: {"done": true, "conversationId": "conv456"}
```

**Errors:**
- `400` - Invalid input
- `401` - Unauthorized
- `429` - Rate limit exceeded (too many requests)
- `500` - AI service error

**Note:** Uses Server-Sent Events (SSE) for streaming responses.

---

#### `POST /api/ai/summarize`
Generate AI summary of a case.

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "caseId": "case123"
}
```

**Response (200):**
```json
{
  "success": true,
  "summary": "Klient hlásí dopravní nehodu na dálnici D1 dne 20.10.2025. Škoda na vozidle je odhadnuta na 50 000 Kč. Přiloženy fotografie a policejní protokol.",
  "recommendations": [
    "Doplnit lékařskou zprávu",
    "Kontaktovat pojišťovnu do 5 dnů",
    "Připravit znalecký posudek"
  ],
  "tokensUsed": 512
}
```

**Errors:**
- `400` - Invalid case ID
- `401` - Unauthorized
- `403` - Forbidden (not your case)
- `404` - Case not found

---

#### `POST /api/ai/ocr`
Extract text from document (OCR).

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "documentId": "doc123"
}
```

**Response (200):**
```json
{
  "success": true,
  "text": "Faktura č. 2025001\nDatum: 20.10.2025\nCelkem: 15 000 Kč",
  "extractedData": {
    "invoiceNumber": "2025001",
    "invoiceDate": "2025-10-20",
    "totalAmount": 15000,
    "currency": "CZK"
  },
  "confidence": 0.95
}
```

**Errors:**
- `400` - Invalid document ID or unsupported file type
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Document not found
- `500` - OCR processing failed

---

### Payments

#### `POST /api/payments/create-checkout`
Create Stripe checkout session.

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "caseId": "case123",
  "amount": 7500,
  "currency": "CZK",
  "description": "Zpracování případu CB-2025-0001"
}
```

**Response (200):**
```json
{
  "success": true,
  "checkoutUrl": "https://checkout.stripe.com/...",
  "sessionId": "cs_test_...",
  "paymentId": "pay123"
}
```

**Errors:**
- `400` - Invalid input
- `401` - Unauthorized
- `403` - Case already paid
- `404` - Case not found

**Note:** Redirect user to `checkoutUrl` to complete payment.

---

#### `POST /api/payments/webhook`
Stripe webhook handler (internal).

**Headers:**
```
stripe-signature: <signature>
```

**Note:** This endpoint is called by Stripe, not by clients. Validates webhook signature.

---

#### `POST /api/payments/gopay/create`
Create GoPay payment.

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "caseId": "case123",
  "amount": 7500,
  "currency": "CZK",
  "description": "Zpracování případu CB-2025-0001"
}
```

**Response (200):**
```json
{
  "success": true,
  "gopayId": 123456789,
  "gatewayUrl": "https://gate.gopay.cz/...",
  "paymentId": "pay123"
}
```

**Errors:**
- `400` - Invalid input
- `401` - Unauthorized
- `500` - GoPay API error

---

#### `GET /api/payments/gopay/callback`
GoPay callback handler (internal).

**Query Params:**
```
?id=123456789
```

**Note:** Redirects user back to app after payment (success/fail).

---

### Admin Only

#### `GET /api/admin/stats`
Get system statistics (admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "stats": {
    "totalUsers": 1250,
    "activeUsers": 980,
    "totalCases": 3420,
    "casesByStatus": {
      "draft": 120,
      "submitted": 45,
      "in_review": 30,
      "in_progress": 85,
      "resolved": 3000,
      "rejected": 100,
      "cancelled": 40
    },
    "totalRevenue": 500000,
    "averageCaseValue": 50000,
    "averageResolutionTime": 14
  }
}
```

**Errors:**
- `401` - Unauthorized
- `403` - Forbidden (not admin)

---

#### `GET /api/admin/users`
List all users (admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Query Params:**
```
?role=client&isActive=true&limit=50&offset=0
```

**Response (200):**
```json
{
  "success": true,
  "users": [
    {
      "id": "user123",
      "email": "user@example.com",
      "firstName": "Jan",
      "lastName": "Novák",
      "role": "client",
      "isActive": true,
      "createdAt": "2025-10-01T10:00:00Z",
      "stats": {
        "totalCases": 5,
        "activeCases": 2,
        "completedCases": 3
      }
    }
  ],
  "total": 1250,
  "page": 1,
  "limit": 50
}
```

**Errors:**
- `401` - Unauthorized
- `403` - Forbidden (not admin)

---

## 🚨 Error Response Format

All errors follow this structure:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

**Common Error Codes:**
- `VALIDATION_ERROR` - Input validation failed
- `UNAUTHORIZED` - Missing or invalid auth token
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_ERROR` - Server error

---

## 🔒 Rate Limiting

**Limits (per IP + user):**
- Auth endpoints: 5 requests/minute
- Case creation: 10 cases/hour
- Messages: 50 messages/hour
- AI chat: 20 messages/hour
- File uploads: 20 files/hour

**Response when limited:**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "retryAfter": 60
  }
}
```

**Headers:**
```
X-RateLimit-Limit: 50
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1730123456
Retry-After: 60
```

---

## 📊 Pagination

List endpoints support pagination:

**Query Params:**
```
?limit=20&offset=0
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "total": 142,
  "page": 1,
  "limit": 20,
  "hasMore": true
}
```

---

## 🔍 Filtering & Sorting

**Filtering:**
```
?status=submitted&type=car&priority=high
```

**Sorting:**
```
?sortBy=createdAt&order=desc
```

**Multiple filters:**
```
?status=submitted,in_review&sortBy=priority&order=desc
```

---

## 🧪 Testing API

**cURL Example:**
```bash
curl -X POST https://claimbuddy.com/api/cases \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "type": "car",
    "title": "Test case",
    "description": "Test description",
    "insuranceCompany": "Test Insurance",
    "incidentDate": "2025-10-22T10:00:00Z"
  }'
```

**Postman Collection:** TBD

---

## 📚 Webhooks

### Stripe Webhook Events

**Endpoint:** `POST /api/payments/webhook`

**Events Handled:**
- `checkout.session.completed` - Payment successful
- `payment_intent.succeeded` - Payment processed
- `payment_intent.payment_failed` - Payment failed
- `charge.refunded` - Payment refunded

### GoPay Callback

**Endpoint:** `GET /api/payments/gopay/callback`

**Query Params:**
- `id` - GoPay payment ID

**Actions:**
- Update payment status in Firestore
- Send email confirmation
- Redirect user to success/fail page
