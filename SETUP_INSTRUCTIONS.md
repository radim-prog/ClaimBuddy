# ClaimBuddy - Setup Instructions

## Co bylo vytvořeno

### ✅ Kompletní Next.js 14 projekt struktura
- App Router s route groups (marketing, auth, dashboard, admin)
- TypeScript konfigurace
- Tailwind CSS + shadcn/ui setup
- Všechny config soubory (next.config.js, tsconfig.json, tailwind.config.ts)

### ✅ Marketing stránky (funkční s reálným contentem)
- **Landing page** (`/`) - Hero, How It Works, Pricing preview, CTA
- **Pricing** (`/pricing`) - Fixní ceny + Success Fee s kalkulačkami
- **About** (`/about`) - Founding story, hodnoty, statistiky
- **FAQ** (`/faq`) - 20+ otázek ve 5 kategoriích
- **Marketing layout** - Header s navigací + Footer

### ✅ Core lib funkce
- Firebase client konfigurace
- Utility funkce (cn, formatDate, formatCurrency, formatFileSize)

### ✅ TypeScript typy
- User, Case, Message, Document typy
- CaseType, CaseStatus, UserRole enums

### ✅ shadcn/ui komponenty (připravené)
- Button, Card (s Header, Content, Footer, Title, Description)
- Další komponenty ready to install: Input, Select, Dialog, Toast, atd.

### ✅ Styling
- Tailwind CSS s custom theme
- CSS Variables pro dark mode support
- Inter font (Google Fonts)

---

## Jak spustit projekt

### 1. Instalace závislostí

```bash
cd /Users/Radim/Projects/claimbuddy
npm install
```

**Důležité:** První instalace může trvat 5-10 minut (stahuje se ~500 MB packages).

### 2. Environment Variables

Zkopírujte `.env.example` do `.env.local`:

```bash
cp .env.example .env.local
```

Poté vyplňte hodnoty v `.env.local`:

```env
# Firebase (vytvořte projekt na firebase.google.com)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
# ... další Firebase credentials

# Google AI (získejte na ai.google.dev)
GOOGLE_AI_API_KEY=your-gemini-api-key

# Stripe (test klíče z dashboard.stripe.com)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# GoPay (zatím nepovinné)
GOPAY_GOID=...
GOPAY_CLIENT_ID=...
GOPAY_CLIENT_SECRET=...

# Resend (pro emaily, zatím nepovinné)
RESEND_API_KEY=re_...
```

### 3. Firebase Setup (nejdůležitější krok!)

#### A) Vytvoření Firebase projektu

1. Jděte na https://console.firebase.google.com
2. Klikněte "Add project" / "Přidat projekt"
3. Pojmenujte projekt (např. "claimbuddy-dev")
4. Povolte Google Analytics (volitelné)
5. Počkejte na vytvoření projektu

#### B) Aktivace služeb

1. **Authentication:**
   - V levém menu: Authentication → Get started
   - Sign-in method → Email/Password → Enable
   - Sign-in method → Google → Enable (zadejte project support email)

2. **Firestore Database:**
   - V levém menu: Firestore Database → Create database
   - Start in **test mode** (zatím, rules nastavíme později)
   - Vyberte location: `europe-west3` (Frankfurt)

3. **Storage:**
   - V levém menu: Storage → Get started
   - Start in **test mode** (rules nastavíme později)

#### C) Získání credentials

1. V levém menu: Project settings (ikona ozubeného kolečka)
2. V "Your apps" sekci klikněte na "</>" (Web app)
3. Zaregistrujte app (např. "ClaimBuddy Web")
4. Zkopírujte `firebaseConfig` objekt do `.env.local`:

```javascript
// Z Firebase Console
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};

// Přepište do .env.local jako:
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
# atd...
```

#### D) Firebase Admin SDK (pro API routes)

1. Project settings → Service accounts
2. Generate new private key → Stáhne se JSON soubor
3. Z JSON zkopírujte do `.env.local`:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

**Pozor:** Private key musí být v uvozovkách a obsahovat `\n` pro nové řádky!

### 4. Spuštění dev serveru

```bash
npm run dev
```

Otevřete [http://localhost:3000](http://localhost:3000)

**Měli byste vidět:**
- Landing page s hero sekcí
- Tlačítka "Začít hned zdarma" a "Jak to funguje"
- Trust badges (500+, 23%, 14 dní, 4.9/5)
- How It Works sekce (3 kroky)
- Pricing preview (Basic, Premium, Pro)
- Footer s odkazy

### 5. Testování

Vyzkoušejte navigaci:
- `/` - Landing page
- `/pricing` - Ceník
- `/about` - O nás
- `/faq` - FAQ

**Poznámka:** Auth pages (`/login`, `/register`) a dashboard pages (`/dashboard`) zatím nejsou implementované - to je další krok.

---

## Co zbývá dokončit

### Priorita 1 - Auth & Dashboard (základní funkcionalita)

1. **Auth pages**
   - `/login` - Přihlášení (Email/Password + Google button)
   - `/register` - Registrace (formulář + Firebase Auth)
   - `/forgot-password` - Reset hesla

2. **Client Dashboard**
   - `/dashboard` - Přehled případů (case cards, statistiky)
   - `/cases/new` - Nový případ (multi-step formulář)
   - `/cases/[id]` - Detail případu (timeline, messages, documents)
   - `/profile` - Profil uživatele

3. **Komponenty**
   - Login/Register forms (react-hook-form + zod)
   - Case card component
   - Case timeline component
   - File uploader (react-dropzone)

### Priorita 2 - API Routes (backend funkcionalita)

1. **Auth API**
   - `/api/auth/register` - Registrace
   - `/api/auth/login` - Přihlášení
   - `/api/auth/verify` - Ověření tokenu

2. **Cases API**
   - `/api/cases` - GET (list), POST (create)
   - `/api/cases/[id]` - GET (detail), PATCH (update)
   - `/api/cases/[id]/status` - PATCH (změna statusu)

3. **Messages API**
   - `/api/cases/[id]/messages` - GET (list), POST (create)

4. **Documents API**
   - `/api/cases/[id]/documents` - POST (upload)
   - `/api/upload` - POST (signed URL pro direct upload)

### Priorita 3 - AI Features

1. **AI API**
   - `/api/ai/chat` - Chatbot (Gemini streaming)
   - `/api/ai/summarize` - Shrnutí případu
   - `/api/ai/ocr` - OCR extrakce textu

2. **AI komponenty**
   - Chat interface (message bubbles, typing indicator)
   - OCR viewer

### Priorita 4 - Admin Panel

1. **Admin pages**
   - `/admin` - Dashboard (stats, recent activity)
   - `/admin/cases` - Case management table
   - `/admin/users` - User management

2. **Admin API**
   - `/api/admin/stats` - Statistiky
   - `/api/admin/users` - Seznam uživatelů

### Priorita 5 - Payments & Legal

1. **Payments**
   - `/api/payments/create-checkout` - Stripe checkout
   - `/api/payments/webhook` - Stripe webhook handler
   - `/payments/success` - Success page

2. **Legal pages**
   - `/legal/terms` - Obchodní podmínky (render markdown)
   - `/legal/privacy` - Ochrana soukromí
   - `/legal/cookies` - Cookie policy
   - GDPR consent modal

---

## Další kroky (doporučené pořadí)

### Krok 1: Dokončit instalaci a ověřit funkcionalitu

```bash
npm install
npm run dev
```

Otevřít http://localhost:3000 a projít všechny stránky.

### Krok 2: Nastavit Firebase projekt

Podle instrukcí výše vytvořit Firebase projekt a vyplnit `.env.local`.

### Krok 3: Implementovat auth pages

Vytvořit `/app/(auth)/login/page.tsx` a `/app/(auth)/register/page.tsx`.

### Krok 4: Implementovat client dashboard

Vytvořit `/app/(dashboard)/dashboard/page.tsx` s přehledem případů.

### Krok 5: Implementovat API routes

Začít s `/api/auth/register` a `/api/cases`.

### Krok 6: Implementovat file upload

React-dropzone + Firebase Storage upload.

### Krok 7: Implementovat AI features

Gemini API integration pro chatbot a OCR.

### Krok 8: Implementovat payments

Stripe checkout + webhook handling.

### Krok 9: Admin panel

Dashboard pro správu případů a uživatelů.

### Krok 10: Testing & deployment

Deploy na Vercel, testování celé aplikace.

---

## Užitečné příkazy

```bash
# Development
npm run dev              # Start dev server (localhost:3000)
npm run build            # Production build
npm start                # Start production server
npm run lint             # Run ESLint
npm run format           # Format code with Prettier
npm run type-check       # TypeScript type checking

# shadcn/ui komponenty (instalovat podle potřeby)
npx shadcn-ui@latest add input     # Přidat Input component
npx shadcn-ui@latest add dialog    # Přidat Dialog component
npx shadcn-ui@latest add toast     # Přidat Toast component
# atd...
```

---

## Struktura adresářů

```
/Users/Radim/Projects/claimbuddy/
├── app/
│   ├── (marketing)/        ✅ Hotovo (landing, pricing, about, faq)
│   │   ├── page.tsx       ✅ Landing page
│   │   ├── pricing/       ✅ Ceník
│   │   ├── about/         ✅ O nás
│   │   ├── faq/           ✅ FAQ
│   │   └── layout.tsx     ✅ Marketing layout
│   ├── (auth)/            ❌ TODO (login, register)
│   ├── (dashboard)/       ❌ TODO (client dashboard)
│   ├── (admin)/           ❌ TODO (admin panel)
│   ├── api/               ❌ TODO (API routes)
│   ├── legal/             ❌ TODO (legal pages)
│   ├── layout.tsx         ✅ Root layout
│   └── globals.css        ✅ Global styles
├── components/
│   ├── ui/                ✅ Button, Card (další přidat podle potřeby)
│   ├── marketing/         ❌ TODO
│   ├── dashboard/         ❌ TODO
│   ├── admin/             ❌ TODO
│   └── forms/             ❌ TODO
├── lib/
│   ├── utils.ts           ✅ Utility funkce
│   └── firebase.ts        ✅ Firebase config
├── types/
│   └── index.ts           ✅ TypeScript typy
├── hooks/                 ❌ TODO (custom hooks)
├── schemas/               ❌ TODO (Zod schemas)
├── public/                ✅ Static assets (zatím prázdné)
├── content/               ✅ Copy content (hotovo)
├── legal/                 ✅ Legal docs (hotovo)
├── docs/                  ✅ Project docs (hotovo)
├── package.json           ✅
├── tsconfig.json          ✅
├── tailwind.config.ts     ✅
├── next.config.js         ✅
├── .env.example           ✅
├── .gitignore             ✅
└── components.json        ✅ shadcn/ui config
```

---

## Důležité poznámky

### Firebase Firestore Rules

Po vytvoření Firestore databáze je potřeba nastavit security rules.
Defaultně je databáze v "test mode" = kdokoliv může číst/zapisovat.

**Production-ready rules viz:** `/docs/FIRESTORE_RULES.txt`

Základní pravidlo:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users: pouze vlastní data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Cases: pouze vlastní případy nebo admin
    match /cases/{caseId} {
      allow read: if request.auth != null &&
        (resource.data.userId == request.auth.uid ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow create: if request.auth != null;
      allow update: if request.auth != null &&
        (resource.data.userId == request.auth.uid ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
  }
}
```

### Rate Limiting

Pro production je potřeba nastavit rate limiting (Upstash Redis).
Zatím to není kritické pro development.

### Error Tracking

Pro production doporučuji nastavit Sentry pro error tracking:

```bash
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```

---

## Kontakt & Podpora

Pokud máte otázky nebo narazíte na problémy:

1. Zkontrolujte dokumentaci v `/docs/`
2. Podívejte se na Firebase Console (často tam je detailní error log)
3. Zkontrolujte browser console (F12) a terminal output

**Časté problémy:**

- **"Module not found"** → Spusťte `npm install` znovu
- **Firebase errors** → Zkontrolujte `.env.local` (všechny vars vyplněné?)
- **TypeScript errors** → Spusťte `npm run type-check`
- **Styling nefunguje** → Restartujte dev server (`Ctrl+C`, `npm run dev`)

---

**Projekt vytvořen:** 1. listopadu 2025
**Next.js verze:** 14.2.0
**Status:** Development (základní struktura hotová, čeká na dokončení auth + dashboard + API)
