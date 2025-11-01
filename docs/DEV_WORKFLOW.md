# ClaimBuddy - Development Workflow

## 🎯 Development Setup

### Prerequisites

- **Node.js:** 18.x nebo vyšší
- **npm:** 9.x nebo vyšší
- **Git:** Pro version control
- **VS Code:** Doporučený editor (s extensions)

### VS Code Extensions (doporučené)

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "dsznajder.es7-react-js-snippets"
  ]
}
```

---

## 🚀 Initial Setup

### 1. Clone Repository (po vytvoření)

```bash
cd ~/Projects
git clone https://github.com/your-username/claimbuddy.git
cd claimbuddy
```

### 2. Install Dependencies

```bash
npm install
```

**Očekávaná doba:** 2-5 minut (podle rychlosti internetu)

### 3. Environment Variables

```bash
# Zkopíruj .env.example do .env.local
cp docs/.env.example .env.local

# Edituj .env.local a vyplň hodnoty
nano .env.local
# nebo
code .env.local
```

**Povinné hodnoty pro local dev:**
- Firebase credentials (všechny `NEXT_PUBLIC_FIREBASE_*`)
- Firebase Admin SDK (`FIREBASE_ADMIN_*`)
- Google AI API key (`GOOGLE_AI_API_KEY`)

**Volitelné (můžeš použít později):**
- Stripe keys (testovací mode)
- Resend API key
- Sentry DSN

### 4. Firebase Setup

Následuj instrukce v `FIREBASE_SETUP.md`:

1. Vytvoř Firebase projekt
2. Zapni Authentication, Firestore, Storage
3. Zkopíruj credentials do `.env.local`
4. Nasaď security rules

### 5. Run Development Server

```bash
npm run dev
```

**Výstup:**
```
   ▲ Next.js 14.2.0
   - Local:        http://localhost:3000
   - Environments: .env.local

 ✓ Ready in 2.5s
```

Otevři browser na http://localhost:3000

---

## 🔄 Git Workflow

### Branching Strategy

**Main branches:**
- `main` - Production (vždy stable)
- `develop` - Development (aktuální práce)

**Feature branches:**
- `feature/auth-implementation` - Nové funkce
- `bugfix/login-error` - Bug fixes
- `hotfix/payment-webhook` - Urgentní fixes (z main)

### Workflow

#### 1. Začít novou funkci

```bash
# Přepni na develop
git checkout develop
git pull origin develop

# Vytvoř novou branch
git checkout -b feature/case-creation

# Pracuj na funkci...
# (edituj soubory, commituj průběžně)
```

#### 2. Commitovat změny

**Commit message format:**
```
🔧 Typ: Stručný popis (max 50 znaků)

- Detailní bullet point 1
- Detailní bullet point 2

Fixes #123
```

**Emoji prefix:**
- 🎉 `:tada:` - Initial commit
- ✨ `:sparkles:` - Nová funkce
- 🔧 `:wrench:` - Konfigurace
- 🐛 `:bug:` - Bug fix
- 📝 `:memo:` - Dokumentace
- 💄 `:lipstick:` - Styling/UI
- ♻️ `:recycle:` - Refactoring
- 🚀 `:rocket:` - Performance
- 🔒 `:lock:` - Security
- 🧪 `:test_tube:` - Tests

**Příklad:**
```bash
git add app/cases/new/page.tsx
git commit -m "✨ Přidána stránka pro vytvoření nového případu

- Formulář s validací (Zod schema)
- Automatické generování case number
- Upload fotografií škody
- Propojení s Firestore

Implements #42"
```

#### 3. Push do remote

```bash
git push origin feature/case-creation
```

#### 4. Create Pull Request

1. Jdi na GitHub repository
2. Klikni **Pull requests** > **New pull request**
3. **Base:** `develop` ← **Compare:** `feature/case-creation`
4. **Title:** `✨ Přidána stránka pro vytvoření případu`
5. **Description:**
   ```markdown
   ## Summary
   - Implementace formuláře pro vytvoření nového případu
   - Validace vstupu pomocí Zod
   - Upload fotografií přes Firebase Storage

   ## Test plan
   - [x] Formulář se zobrazí správně
   - [x] Validace funguje (neplatný email → error)
   - [x] Upload fotografií funguje
   - [x] Case se vytvoří ve Firestore
   - [x] Redirect na detail případu po vytvoření

   ## Screenshots
   [Přidat screenshot]

   Fixes #42
   ```
6. Klikni **Create pull request**
7. Request review (pokud máš team)

#### 5. Merge Pull Request

**Po schválení:**
```bash
# Na GitHubu: Merge pull request (squash and merge)

# Lokálně: Update develop
git checkout develop
git pull origin develop

# Smaž feature branch
git branch -d feature/case-creation
git push origin --delete feature/case-creation
```

---

## 🏗️ Development Phases

### Phase 1: MVP Core (Týden 1-2)

**Features:**
- [ ] Authentication (Email/Password, Google)
- [ ] User profile
- [ ] Create case
- [ ] View cases (list + detail)
- [ ] Basic messaging
- [ ] File upload

**Branches:**
```bash
feature/auth-implementation
feature/user-profile
feature/case-creation
feature/case-list
feature/messaging
feature/file-upload
```

### Phase 2: AI Integration (Týden 3)

**Features:**
- [ ] Gemini AI chat
- [ ] OCR document scanning
- [ ] Case summarization

**Branches:**
```bash
feature/ai-chat
feature/ocr-integration
feature/ai-summarization
```

### Phase 3: Payments (Týden 4)

**Features:**
- [ ] Stripe integration
- [ ] GoPay integration
- [ ] Invoice generation

**Branches:**
```bash
feature/stripe-integration
feature/gopay-integration
feature/invoice-generation
```

### Phase 4: Admin Panel (Týden 5)

**Features:**
- [ ] Admin dashboard
- [ ] Case management
- [ ] User management
- [ ] Analytics

**Branches:**
```bash
feature/admin-dashboard
feature/admin-case-management
feature/admin-analytics
```

### Phase 5: Polish & Testing (Týden 6)

**Tasks:**
- [ ] Bug fixes
- [ ] Performance optimization
- [ ] SEO optimization
- [ ] Email templates
- [ ] Legal pages

---

## 🧪 Testing Strategy

### Manual Testing (MVP)

**Checklist před každým commitem:**
- [ ] Stránka se zobrazí bez errorů
- [ ] Funkce funguje podle očekávání
- [ ] Console je čistá (no errors/warnings)
- [ ] TypeScript type check prošel (`npm run type-check`)
- [ ] Linting prošel (`npm run lint`)

### User Testing (před launch)

**Test scenarios:**
1. **User Journey 1: Nový klient**
   - Registrace → Ověření emailu → Vytvoření případu → Upload dokumentů → Odeslání
2. **User Journey 2: Existující klient**
   - Login → Přehled případů → Detail případu → Nová zpráva → AI chat
3. **User Journey 3: Admin**
   - Login → Dashboard → Přiřazení případu → Změna statusu → Odpověď klientovi

---

## 📦 Build & Deploy

### Local Build Test

```bash
# Type check
npm run type-check

# Lint
npm run lint

# Build for production
npm run build

# Test production build locally
npm start
```

**Očekávaný výstup:**
```
Route (app)                                Size     First Load JS
┌ ○ /                                      5.2 kB         87 kB
├ ○ /about                                 2.1 kB         85 kB
├ ƒ /dashboard                            15.2 kB        102 kB
├ ƒ /cases/[id]                           12.8 kB         99 kB
...

○  (Static)  automatically rendered as static HTML
ƒ  (Dynamic) server-rendered on demand
```

**Red flags:**
- ❌ Build errors → Fix před merge
- ❌ First Load JS > 150 kB → Optimalizuj (lazy loading)
- ❌ Build time > 2 min → Zkontroluj dependencies

### Vercel Deployment

#### Setup (once)

1. Jdi na https://vercel.com/
2. **Import Git Repository** > GitHub > `claimbuddy`
3. **Framework Preset:** Next.js (auto-detected)
4. **Root Directory:** `./` (default)
5. **Build Command:** `npm run build` (default)
6. **Install Command:** `npm install` (default)
7. **Environment Variables:**
   - Přidej všechny z `.env.local`
   - Scope: **Production**, **Preview**, **Development**
8. Klikni **Deploy**

#### Continuous Deployment

**Automatické deploymenty:**
- Push do `main` → Production deploy (`claimbuddy.com`)
- Push do `develop` → Preview deploy (`claimbuddy-git-develop.vercel.app`)
- Pull request → Preview deploy (unique URL)

**Manual deploy:**
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

---

## 🐛 Debugging

### Common Issues

#### Issue: "Firebase app not initialized"

**Řešení:**
```typescript
// Zkontroluj že firebase config je správně importován
import { app } from '@/lib/firebase/config';

// Ověř že všechny env vars jsou nastavené
console.log(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
```

#### Issue: "Hydration failed"

**Řešení:**
- Server a client render různý obsah
- Zkontroluj conditional rendering (např. `isClient` state)
- Použij `useEffect` pro client-only kód

#### Issue: "Module not found"

**Řešení:**
```bash
# Smaž node_modules a reinstaluj
rm -rf node_modules package-lock.json
npm install
```

#### Issue: "Build fails but dev works"

**Řešení:**
- Zkontroluj TypeScript errors (`npm run type-check`)
- Zkontroluj unused imports/variables
- Zkontroluj dynamic imports (musí být correct paths)

### Browser DevTools

**Network tab:**
- Firestore calls → Sleduj read/write counts
- API routes → Zkontroluj response times
- Storage uploads → Sleduj upload progress

**Console:**
- Loguj důležité events
- `console.error()` pro errory
- Remove console logs před production build

**React DevTools:**
- Sleduj component re-renders
- Zkontroluj props/state
- Profiler pro performance

---

## 🔧 Code Quality

### TypeScript

**Strict mode:**
```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

**Type everything:**
```typescript
// ❌ Bad
const user = data;

// ✅ Good
const user: User = data as User;

// ✅ Better
const user = userSchema.parse(data);
```

### ESLint

```bash
# Run linter
npm run lint

# Auto-fix
npm run lint -- --fix
```

**Custom rules (add to .eslintrc.json):**
```json
{
  "rules": {
    "no-console": "warn",
    "@typescript-eslint/no-unused-vars": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

### Prettier

```bash
# Format all files
npm run format

# Check formatting
npx prettier --check .
```

**VS Code auto-format on save:**
```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode"
}
```

---

## 📊 Performance Monitoring

### Core Web Vitals

**Track in development:**
```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

**Metrics:**
- **LCP (Largest Contentful Paint):** < 2.5s
- **FID (First Input Delay):** < 100ms
- **CLS (Cumulative Layout Shift):** < 0.1

**Optimize:**
- Use Next.js `<Image>` component
- Lazy load heavy components
- Minimize JavaScript bundle

### Lighthouse Audit

```bash
# Run Lighthouse
npx lighthouse http://localhost:3000 --view

# Target scores:
# - Performance: > 90
# - Accessibility: > 95
# - Best Practices: > 95
# - SEO: > 90
```

---

## 🗂️ File Organization Best Practices

### Component Structure

```typescript
// components/dashboard/case-card.tsx
'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Case } from '@/types/case';

interface CaseCardProps {
  case: Case;
  onClick?: () => void;
}

export function CaseCard({ case: caseData, onClick }: CaseCardProps) {
  return (
    <Card onClick={onClick} className="cursor-pointer hover:shadow-lg">
      {/* ... */}
    </Card>
  );
}
```

**Rules:**
- 1 component per file
- File name = component name (kebab-case)
- Export named (not default) when possible
- Props interface directly above component

### API Route Structure

```typescript
// app/api/cases/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/middleware/auth';
import { db } from '@/lib/firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    // ... fetch cases
    return NextResponse.json({ success: true, cases });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // ... create case
}
```

---

## 🔐 Security Checklist

**Před každým commitem:**
- [ ] No API keys v kódu (use env vars)
- [ ] No console.logs s sensitive data
- [ ] Validate user input (Zod schemas)
- [ ] Auth check na protected routes
- [ ] CORS correctly configured
- [ ] Firestore/Storage rules deployed

**Před production deploy:**
- [ ] Firebase App Check enabled
- [ ] Rate limiting configured
- [ ] Sentry error tracking enabled
- [ ] HTTPS enforced
- [ ] Security headers (CSP, HSTS)

---

## 📚 Helpful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm start                # Start production server

# Code Quality
npm run lint             # Run ESLint
npm run lint -- --fix    # Auto-fix lint issues
npm run format           # Format with Prettier
npm run type-check       # TypeScript type checking

# Dependencies
npm install <package>    # Install new package
npm update               # Update all packages
npm outdated             # Check outdated packages
npm audit                # Security audit

# Firebase
firebase login           # Login to Firebase
firebase deploy          # Deploy Firestore/Storage rules
firebase emulators:start # Start local emulators

# Vercel
vercel                   # Deploy to preview
vercel --prod            # Deploy to production
vercel env ls            # List environment variables
```

---

## 🎯 Daily Workflow (příklad)

```bash
# Ráno - začátek práce
git checkout develop
git pull origin develop
git checkout -b feature/new-feature

# Během dne - průběžně
npm run dev  # (běží v pozadí)
# ... pracuj na funkci ...
git add .
git commit -m "✨ Přidána část 1"
# ... pokračuj ...
git commit -m "✨ Přidána část 2"

# Konec dne - push
git push origin feature/new-feature

# Příští den - pokračování
git pull origin feature/new-feature  # (pokud pracuješ z jiného počítače)
# ... pokračuj v práci ...

# Hotovo - merge
# Create Pull Request on GitHub
# Po schválení: Merge
git checkout develop
git pull origin develop
git branch -d feature/new-feature
```

---

**Happy coding! 🚀**
