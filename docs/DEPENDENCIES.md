# ClaimBuddy - NPM Dependencies

## 📦 Complete Package List

### Core Dependencies

```json
{
  "dependencies": {
    // ============================================
    // NEXT.JS & REACT
    // ============================================
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",

    // ============================================
    // TYPESCRIPT
    // ============================================
    "typescript": "^5.4.0",
    "@types/node": "^20.12.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",

    // ============================================
    // STYLING
    // ============================================
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss-animate": "^1.0.7",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.3.0",

    // ============================================
    // UI COMPONENTS (shadcn/ui)
    // ============================================
    "@radix-ui/react-avatar": "^1.0.4",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-separator": "^1.0.3",
    "@radix-ui/react-slot": "^1.0.2",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-toast": "^1.1.5",
    "@radix-ui/react-tooltip": "^1.0.7",
    "@radix-ui/react-progress": "^1.0.3",
    "@radix-ui/react-checkbox": "^1.0.4",
    "@radix-ui/react-radio-group": "^1.1.3",
    "@radix-ui/react-switch": "^1.0.3",
    "lucide-react": "^0.376.0",

    // ============================================
    // FIREBASE
    // ============================================
    "firebase": "^10.12.0",
    "firebase-admin": "^12.1.0",

    // ============================================
    // GOOGLE AI (GEMINI)
    // ============================================
    "@google/generative-ai": "^0.11.0",

    // ============================================
    // PAYMENTS
    // ============================================
    "@stripe/stripe-js": "^3.3.0",
    "stripe": "^15.5.0",
    "gopay-node": "^1.0.5",

    // ============================================
    // EMAIL
    // ============================================
    "resend": "^3.2.0",
    "@react-email/components": "^0.0.17",
    "@react-email/render": "^0.0.15",

    // Alternative: SendGrid
    // "@sendgrid/mail": "^8.1.0",

    // ============================================
    // DATA FETCHING & STATE
    // ============================================
    "@tanstack/react-query": "^5.32.0",
    "@tanstack/react-query-devtools": "^5.32.0",
    "axios": "^1.6.8",
    "swr": "^2.2.5",

    // ============================================
    // FORMS & VALIDATION
    // ============================================
    "react-hook-form": "^7.51.3",
    "@hookform/resolvers": "^3.3.4",
    "zod": "^3.23.6",

    // ============================================
    // DATE & TIME
    // ============================================
    "date-fns": "^3.6.0",

    // ============================================
    // FILE UPLOAD
    // ============================================
    "react-dropzone": "^14.2.3",
    "react-pdf": "^7.7.3",

    // ============================================
    // UTILITIES
    // ============================================
    "nanoid": "^5.0.7",
    "slugify": "^1.6.6",
    "pluralize": "^8.0.0",

    // ============================================
    // ERROR TRACKING
    // ============================================
    "@sentry/nextjs": "^7.112.0",

    // ============================================
    // ANALYTICS
    // ============================================
    "@vercel/analytics": "^1.2.2",
    "react-ga4": "^2.1.0",

    // ============================================
    // ENCRYPTION (for sensitive data)
    // ============================================
    "crypto-js": "^4.2.0",
    "@types/crypto-js": "^4.2.2",

    // ============================================
    // RATE LIMITING
    // ============================================
    "@upstash/ratelimit": "^1.1.3",
    "@upstash/redis": "^1.29.0",

    // ============================================
    // MARKDOWN (for legal docs rendering)
    // ============================================
    "react-markdown": "^9.0.1",
    "remark-gfm": "^4.0.0",

    // ============================================
    // CHARTS (admin analytics)
    // ============================================
    "recharts": "^2.12.5",

    // ============================================
    // NOTIFICATIONS
    // ============================================
    "sonner": "^1.4.41"
  },

  "devDependencies": {
    // ============================================
    // LINTING & FORMATTING
    // ============================================
    "eslint": "^8.57.0",
    "eslint-config-next": "^14.2.0",
    "prettier": "^3.2.5",
    "prettier-plugin-tailwindcss": "^0.5.14",

    // ============================================
    // TESTING (optional - not in MVP)
    // ============================================
    // "@testing-library/react": "^15.0.0",
    // "@testing-library/jest-dom": "^6.4.2",
    // "jest": "^29.7.0",
    // "jest-environment-jsdom": "^29.7.0",

    // ============================================
    // TYPE CHECKING
    // ============================================
    "@typescript-eslint/eslint-plugin": "^7.7.0",
    "@typescript-eslint/parser": "^7.7.0"
  }
}
```

---

## 📥 Installation Commands

### Initial Setup

```bash
# Create Next.js app with TypeScript
npx create-next-app@latest claimbuddy --typescript --tailwind --app --src-dir=false

cd claimbuddy

# Install all dependencies
npm install
```

### Core Dependencies (grouped)

```bash
# Firebase
npm install firebase firebase-admin

# Google AI
npm install @google/generative-ai

# Payments
npm install @stripe/stripe-js stripe gopay-node

# Email
npm install resend @react-email/components @react-email/render

# Data Fetching
npm install @tanstack/react-query @tanstack/react-query-devtools axios

# Forms & Validation
npm install react-hook-form @hookform/resolvers zod

# Utilities
npm install date-fns nanoid slugify pluralize

# Error Tracking
npm install @sentry/nextjs

# Analytics
npm install @vercel/analytics react-ga4

# Encryption
npm install crypto-js @types/crypto-js

# Rate Limiting
npm install @upstash/ratelimit @upstash/redis

# File Upload
npm install react-dropzone react-pdf

# Markdown
npm install react-markdown remark-gfm

# Charts
npm install recharts

# Notifications
npm install sonner
```

### shadcn/ui Setup

```bash
# Initialize shadcn/ui
npx shadcn-ui@latest init

# Install components (one by one as needed)
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add input
npx shadcn-ui@latest add select
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add label
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add tooltip
npx shadcn-ui@latest add progress
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add radio-group
npx shadcn-ui@latest add switch

# OR install all at once
npx shadcn-ui@latest add button card dialog input select textarea badge dropdown-menu toast tabs avatar label separator tooltip progress checkbox radio-group switch
```

---

## 🎯 Package Purposes

### **Next.js & React**
- `next` - Framework pro React (SSR, routing, API routes)
- `react`, `react-dom` - UI library

### **TypeScript**
- `typescript` - Type safety
- `@types/*` - Type definitions

### **Styling**
- `tailwindcss` - Utility-first CSS
- `tailwind-merge` - Merge Tailwind classes (pro shadcn/ui)
- `class-variance-authority` - Component variants (shadcn/ui)
- `clsx` - Conditional classes

### **UI Components (shadcn/ui)**
- `@radix-ui/*` - Headless UI primitives (shadcn uses Radix)
- `lucide-react` - Icon library

### **Firebase**
- `firebase` - Client SDK (auth, firestore, storage)
- `firebase-admin` - Server SDK (API routes, admin operations)

### **Google AI**
- `@google/generative-ai` - Gemini AI client

### **Payments**
- `stripe`, `@stripe/stripe-js` - Stripe payment processing
- `gopay-node` - GoPay (Czech payment gateway)

### **Email**
- `resend` - Email API (modern alternative to SendGrid)
- `@react-email/*` - React-based email templates

### **Data Fetching**
- `@tanstack/react-query` - Server state management (caching, refetching)
- `axios` - HTTP client (alternative to fetch)
- `swr` - Lightweight data fetching (alternative to React Query)

### **Forms**
- `react-hook-form` - Form state management (performant)
- `@hookform/resolvers` - Validation integrations
- `zod` - Schema validation (TypeScript-first)

### **Utilities**
- `date-fns` - Date manipulation (lightweight alternative to moment.js)
- `nanoid` - Generate unique IDs
- `slugify` - URL-friendly slugs
- `pluralize` - Singular/plural text

### **Error Tracking**
- `@sentry/nextjs` - Error monitoring in production

### **Analytics**
- `@vercel/analytics` - Vercel Analytics
- `react-ga4` - Google Analytics 4

### **Encryption**
- `crypto-js` - Client-side encryption (for sensitive data before upload)

### **Rate Limiting**
- `@upstash/ratelimit` - Rate limiting middleware
- `@upstash/redis` - Serverless Redis (for rate limiting state)

### **File Upload**
- `react-dropzone` - Drag & drop file upload
- `react-pdf` - PDF viewer/renderer

### **Markdown**
- `react-markdown` - Render markdown (legal docs)
- `remark-gfm` - GitHub Flavored Markdown support

### **Charts**
- `recharts` - Chart library (admin analytics)

### **Notifications**
- `sonner` - Toast notifications (modern alternative to react-hot-toast)

---

## ⚙️ Configuration Files

### `package.json` scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "format": "prettier --write .",
    "type-check": "tsc --noEmit"
  }
}
```

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### `tailwind.config.ts`

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
```

### `.eslintrc.json`

```json
{
  "extends": ["next/core-web-vitals", "prettier"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

### `.prettierrc`

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "tabWidth": 2,
  "useTabs": false,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

---

## 📊 Bundle Size Optimization

### Dynamic Imports (lazy loading)

```typescript
// Heavy components
const PDFViewer = dynamic(() => import('@/components/pdf-viewer'), {
  ssr: false,
  loading: () => <Skeleton />,
});

const AnalyticsChart = dynamic(() => import('@/components/charts/analytics'), {
  ssr: false,
});
```

### Tree Shaking

- Use **named imports** from libraries:
  ```typescript
  // ✅ Good
  import { format } from 'date-fns';

  // ❌ Bad
  import * as dateFns from 'date-fns';
  ```

### Analyze Bundle

```bash
# Install
npm install @next/bundle-analyzer

# Add to next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(nextConfig);

# Run analysis
ANALYZE=true npm run build
```

---

## 🔄 Dependency Updates

```bash
# Check outdated packages
npm outdated

# Update all to latest (be careful!)
npm update

# Update specific package
npm install package@latest

# Update with interactive CLI
npx npm-check-updates -i
```

---

## 🚨 Security Audit

```bash
# Check for vulnerabilities
npm audit

# Auto-fix vulnerabilities
npm audit fix

# Fix breaking changes (risky!)
npm audit fix --force
```

---

## 📦 Production Build Size (estimated)

**After optimization:**
- First Load JS: ~85 KB (framework)
- Route chunks: ~10-30 KB each
- Total build: ~2-3 MB (gzipped)

**Main contributors:**
- Next.js framework: ~75 KB
- React + React DOM: ~42 KB
- Firebase client SDK: ~100 KB
- Radix UI components: ~50 KB
- Total (shared): ~267 KB (gzipped)

**Per-route:**
- Marketing page: ~10 KB
- Dashboard: ~25 KB
- Admin panel: ~30 KB
