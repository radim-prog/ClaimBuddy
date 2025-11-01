# ClaimBuddy - Project Structure

## 📁 Kompletní adresářová struktura

```
claimbuddy/
├── app/                              # Next.js 14 App Router
│   ├── (marketing)/                  # Marketing pages (public)
│   │   ├── page.tsx                  # Homepage (/)
│   │   ├── pricing/
│   │   │   └── page.tsx             # Ceník (/pricing)
│   │   ├── about/
│   │   │   └── page.tsx             # O nás (/about)
│   │   ├── contact/
│   │   │   └── page.tsx             # Kontakt (/contact)
│   │   ├── how-it-works/
│   │   │   └── page.tsx             # Jak to funguje (/how-it-works)
│   │   └── layout.tsx                # Marketing layout (header, footer)
│   │
│   ├── (auth)/                       # Auth pages
│   │   ├── login/
│   │   │   └── page.tsx             # Login (/login)
│   │   ├── register/
│   │   │   └── page.tsx             # Registrace (/register)
│   │   ├── forgot-password/
│   │   │   └── page.tsx             # Zapomenuté heslo
│   │   └── layout.tsx                # Auth layout (centered, minimal)
│   │
│   ├── (dashboard)/                  # Client Dashboard (authenticated)
│   │   ├── dashboard/
│   │   │   └── page.tsx             # Přehled případů (/dashboard)
│   │   ├── cases/
│   │   │   ├── page.tsx             # Seznam případů
│   │   │   ├── new/
│   │   │   │   └── page.tsx         # Nový případ
│   │   │   └── [id]/
│   │   │       ├── page.tsx         # Detail případu
│   │   │       ├── messages/
│   │   │       │   └── page.tsx     # Komunikace
│   │   │       └── documents/
│   │   │           └── page.tsx     # Dokumenty
│   │   ├── ai-assistant/
│   │   │   └── page.tsx             # AI Asistent chat
│   │   ├── payments/
│   │   │   ├── page.tsx             # Platby a faktury
│   │   │   └── success/
│   │   │       └── page.tsx         # Platba úspěšná
│   │   ├── profile/
│   │   │   └── page.tsx             # Profil uživatele
│   │   └── layout.tsx                # Dashboard layout (sidebar, nav)
│   │
│   ├── (admin)/                      # Admin Panel (admin only)
│   │   ├── admin/
│   │   │   ├── page.tsx             # Admin dashboard
│   │   │   ├── cases/
│   │   │   │   ├── page.tsx         # Správa případů
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx     # Admin - detail případu
│   │   │   ├── clients/
│   │   │   │   ├── page.tsx         # Správa klientů
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx     # Detail klienta
│   │   │   ├── analytics/
│   │   │   │   └── page.tsx         # Analytiky a reporty
│   │   │   └── settings/
│   │   │       └── page.tsx         # Nastavení systému
│   │   └── layout.tsx                # Admin layout
│   │
│   ├── api/                          # API Routes (serverless)
│   │   ├── auth/
│   │   │   ├── register/
│   │   │   │   └── route.ts         # POST /api/auth/register
│   │   │   ├── login/
│   │   │   │   └── route.ts         # POST /api/auth/login
│   │   │   └── verify/
│   │   │       └── route.ts         # POST /api/auth/verify
│   │   │
│   │   ├── cases/
│   │   │   ├── route.ts             # GET /api/cases (list), POST /api/cases (create)
│   │   │   └── [id]/
│   │   │       ├── route.ts         # GET, PATCH, DELETE /api/cases/[id]
│   │   │       ├── messages/
│   │   │       │   └── route.ts     # POST /api/cases/[id]/messages
│   │   │       ├── documents/
│   │   │       │   └── route.ts     # POST /api/cases/[id]/documents
│   │   │       └── status/
│   │   │           └── route.ts     # PATCH /api/cases/[id]/status
│   │   │
│   │   ├── ai/
│   │   │   ├── chat/
│   │   │   │   └── route.ts         # POST /api/ai/chat (streaming)
│   │   │   ├── summarize/
│   │   │   │   └── route.ts         # POST /api/ai/summarize
│   │   │   └── ocr/
│   │   │       └── route.ts         # POST /api/ai/ocr (scan dokument)
│   │   │
│   │   ├── payments/
│   │   │   ├── create-checkout/
│   │   │   │   └── route.ts         # POST /api/payments/create-checkout
│   │   │   ├── webhook/
│   │   │   │   └── route.ts         # POST /api/payments/webhook (Stripe)
│   │   │   └── gopay/
│   │   │       ├── create/
│   │   │       │   └── route.ts     # POST /api/payments/gopay/create
│   │   │       └── callback/
│   │   │           └── route.ts     # POST /api/payments/gopay/callback
│   │   │
│   │   ├── upload/
│   │   │   └── route.ts             # POST /api/upload (signed URL)
│   │   │
│   │   └── admin/
│   │       ├── stats/
│   │       │   └── route.ts         # GET /api/admin/stats
│   │       └── users/
│   │           └── route.ts         # GET /api/admin/users
│   │
│   ├── legal/                        # Legal pages
│   │   ├── terms/
│   │   │   └── page.tsx             # Obchodní podmínky
│   │   ├── privacy/
│   │   │   └── page.tsx             # Zásady ochrany soukromí
│   │   └── gdpr/
│   │       └── page.tsx             # GDPR info
│   │
│   ├── layout.tsx                    # Root layout (global providers)
│   ├── globals.css                   # Global Tailwind styles
│   └── error.tsx                     # Global error boundary
│
├── components/                       # React Components
│   ├── ui/                          # shadcn/ui components (auto-generated)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── textarea.tsx
│   │   ├── badge.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── toast.tsx
│   │   ├── tabs.tsx
│   │   └── ...
│   │
│   ├── marketing/                    # Marketing components
│   │   ├── hero.tsx
│   │   ├── features.tsx
│   │   ├── testimonials.tsx
│   │   ├── pricing-cards.tsx
│   │   ├── cta.tsx
│   │   └── footer.tsx
│   │
│   ├── dashboard/                    # Dashboard components
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   ├── case-card.tsx
│   │   ├── case-status-badge.tsx
│   │   ├── message-thread.tsx
│   │   ├── document-uploader.tsx
│   │   ├── file-preview.tsx
│   │   └── stats-overview.tsx
│   │
│   ├── admin/                        # Admin components
│   │   ├── admin-sidebar.tsx
│   │   ├── case-table.tsx
│   │   ├── client-table.tsx
│   │   ├── analytics-chart.tsx
│   │   └── export-button.tsx
│   │
│   ├── ai/                          # AI components
│   │   ├── chat-interface.tsx
│   │   ├── message-bubble.tsx
│   │   ├── typing-indicator.tsx
│   │   └── ocr-viewer.tsx
│   │
│   ├── forms/                        # Form components
│   │   ├── case-form.tsx
│   │   ├── login-form.tsx
│   │   ├── register-form.tsx
│   │   └── profile-form.tsx
│   │
│   └── providers/                    # Context providers
│       ├── auth-provider.tsx
│       ├── query-provider.tsx        # React Query
│       ├── toast-provider.tsx
│       └── theme-provider.tsx
│
├── lib/                             # Core library functions
│   ├── firebase/
│   │   ├── config.ts                # Firebase init
│   │   ├── auth.ts                  # Auth helpers
│   │   ├── firestore.ts             # Firestore helpers
│   │   └── storage.ts               # Storage helpers
│   │
│   ├── ai/
│   │   ├── gemini.ts                # Gemini AI client
│   │   ├── prompts.ts               # AI prompts
│   │   └── ocr.ts                   # OCR processing
│   │
│   ├── payments/
│   │   ├── stripe.ts                # Stripe client
│   │   └── gopay.ts                 # GoPay client
│   │
│   ├── email/
│   │   ├── resend.ts                # Email client
│   │   └── templates/               # Email templates
│   │       ├── welcome.tsx
│   │       ├── case-update.tsx
│   │       └── payment-receipt.tsx
│   │
│   ├── utils/
│   │   ├── cn.ts                    # classNames utility (shadcn)
│   │   ├── format.ts                # Date/number formatting
│   │   ├── validation.ts            # Common validators
│   │   └── errors.ts                # Error handling
│   │
│   ├── middleware/
│   │   ├── auth.ts                  # Auth middleware
│   │   ├── rate-limit.ts            # Rate limiting
│   │   └── error-handler.ts         # Error middleware
│   │
│   └── constants/
│       ├── case-statuses.ts
│       ├── claim-types.ts
│       └── insurance-types.ts
│
├── types/                           # TypeScript types
│   ├── index.ts                     # Re-exports
│   ├── case.ts                      # Case types
│   ├── user.ts                      # User types
│   ├── message.ts                   # Message types
│   ├── payment.ts                   # Payment types
│   ├── document.ts                  # Document types
│   └── api.ts                       # API response types
│
├── hooks/                           # Custom React hooks
│   ├── use-auth.ts                  # Auth hook
│   ├── use-cases.ts                 # Cases data hook
│   ├── use-messages.ts              # Messages hook
│   ├── use-upload.ts                # File upload hook
│   └── use-toast.ts                 # Toast notifications
│
├── schemas/                         # Zod validation schemas
│   ├── case.ts                      # Case schema
│   ├── user.ts                      # User schema
│   ├── message.ts                   # Message schema
│   └── payment.ts                   # Payment schema
│
├── public/                          # Static assets
│   ├── images/
│   │   ├── logo.svg
│   │   ├── hero.png
│   │   └── placeholder.png
│   ├── icons/
│   │   └── favicon.ico
│   └── fonts/
│       └── ...
│
├── legal/                           # Legal documents (markdown)
│   ├── terms-cs.md                  # Obchodní podmínky (CZ)
│   ├── privacy-cs.md                # Zásady ochrany soukromí (CZ)
│   └── gdpr-cs.md                   # GDPR info (CZ)
│
├── docs/                            # Project documentation
│   ├── PROJECT_STRUCTURE.md         # This file
│   ├── DATABASE_SCHEMA.md           # Database structure
│   ├── API_ENDPOINTS.md             # API documentation
│   ├── FIREBASE_SETUP.md            # Firebase setup guide
│   ├── FIRESTORE_RULES.txt          # Firestore security rules
│   ├── STORAGE_RULES.txt            # Storage security rules
│   ├── DEPENDENCIES.md              # NPM packages
│   └── DEV_WORKFLOW.md              # Development workflow
│
├── .claude-context/                 # Claude Code context
│   └── .gitkeep
│
├── .vscode/
│   └── settings.json                # VS Code settings
│
├── .env.example                     # Environment variables template
├── .env.local                       # Local environment (gitignored)
├── .gitignore
├── .eslintrc.json                   # ESLint config
├── .prettierrc                      # Prettier config
├── next.config.js                   # Next.js config
├── tailwind.config.ts               # Tailwind config
├── tsconfig.json                    # TypeScript config
├── components.json                  # shadcn/ui config
├── package.json
├── package-lock.json
└── README.md
```

## 🎯 Routing strategie

### Next.js 14 App Router

**Route Groups (závorky):**
- `(marketing)` - Public marketing pages, shared layout s header/footer
- `(auth)` - Auth pages, minimalistický layout
- `(dashboard)` - Client dashboard, authenticated layout se sidebar
- `(admin)` - Admin panel, admin-only layout

**Dynamic Routes:**
- `[id]` - Dynamic segment (např. `/cases/abc123`)
- `[...slug]` - Catch-all routes (zatím nevyužito)

## 🔒 Protected Routes

**Middleware Protection:**
```typescript
// middleware.ts v root
export async function middleware(request: NextRequest) {
  // Protect /dashboard/* a /admin/*
  // Redirect na /login pokud není autentizovaný
}
```

**Layout-level Protection:**
- `(dashboard)/layout.tsx` - Check auth, redirect pokud ne
- `(admin)/layout.tsx` - Check admin role, redirect pokud není admin

## 📦 Lazy Loading Strategy

**Server Components (default):**
- Většina pages a components = Server Components
- Rychlejší initial load, zero JS na klientu

**Client Components (use client):**
- Forms (interaktivní)
- Chat interface
- File uploader
- Všechny components s hooks (useState, useEffect)

**Dynamic imports:**
```typescript
// Pro heavy components (charts, PDF viewer)
const AnalyticsChart = dynamic(() => import('@/components/admin/analytics-chart'), {
  loading: () => <Skeleton />,
  ssr: false
})
```

## 🎨 Styling Convention

**Tailwind CSS:**
- Utility-first approach
- Custom colors v `tailwind.config.ts`
- Dark mode support (class strategy)

**shadcn/ui:**
- Components v `components/ui/`
- Customizovatelné přes CSS variables
- Auto-generated pomocí CLI

**CSS Modules:**
- NEPOUŽÍVAT (preferuj Tailwind)
- Výjimka: komplexní animace (pokud nutné)

## 🚀 Performance Optimizations

**Image Optimization:**
```typescript
import Image from 'next/image'
// Automatická optimalizace, lazy loading, WebP
```

**Font Optimization:**
```typescript
import { Inter } from 'next/font/google'
// Self-hosted, preload
```

**Bundle Analysis:**
```bash
npm run build
# Next.js automaticky reportuje bundle size
```

## 📱 Mobile-First Design

**Breakpoints (Tailwind default):**
- `sm`: 640px (tablet)
- `md`: 768px (tablet landscape)
- `lg`: 1024px (desktop)
- `xl`: 1280px (large desktop)

**Layout Strategy:**
- Mobile: Hamburger menu, single column
- Desktop: Sidebar navigation, multi-column

## 🧪 Testing Structure (future)

```
__tests__/
├── components/
├── lib/
└── api/
```

**Note:** Testing není v MVP scope, ale struktura je připravená.
