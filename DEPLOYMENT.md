# 🚀 Deployment Guide - ClaimBuddy

**Datum:** 2025-11-01
**Verze:** 1.0

---

## 📋 Pre-Deployment Checklist

### ✅ Co je hotovo:

- [x] Firebase projekt vytvořen (`claimbuddy-1c327`)
- [x] Firebase Authentication nakonfigurována
- [x] Firestore Database vytvořena
- [x] Firebase Storage nakonfigurován
- [x] Storage Rules nasazeny
- [x] Firestore Rules nasazeny
- [x] Environment variables nakonfigurovány (`.env.local`)
- [x] Admin systém kompletně implementován
- [x] Security audit dokončen
- [x] Rate limiting implementován

### ⏳ Co je potřeba dodělat:

- [ ] Vytvořit prvního admin uživatele
- [ ] Nasadit na Vercel
- [ ] Nakonfigurovat Upstash Redis (pro production rate limiting)
- [ ] Nakonfigurovat Stripe (pro platby)
- [ ] Nakonfigurovat Resend (pro emaily)
- [ ] Nastavit custom doménu
- [ ] SSL certifikát (automaticky přes Vercel)

---

## 🎯 Deployment Kroky

### 1. Vytvoření prvního admin uživatele

**Lokálně (doporučeno):**

```bash
# Vytvoř admin uživatele
npx tsx scripts/create-admin.ts admin@claimbuddy.cz "Admin User"

# Output:
# ✅ Vytvořen nový uživatel v Auth: xyz123
# ✅ Uživatel uložen do Firestore s role: admin
# Email: admin@claimbuddy.cz
# Heslo: Admin123! (ZMĚŇ PŘI PRVNÍM PŘIHLÁŠENÍ!)
```

**Nebo manuálně v Firebase Console:**

1. **Firebase Authentication:**
   - Jdi na: https://console.firebase.google.com/project/claimbuddy-1c327/authentication/users
   - Klikni "Add user"
   - Email: `admin@claimbuddy.cz`
   - Password: `Admin123!` (nebo vlastní)
   - Zkopíruj **User UID**

2. **Firestore:**
   - Jdi na: https://console.firebase.google.com/project/claimbuddy-1c327/firestore/data
   - Collection: `users`
   - Document ID: `[User UID z kroku 1]`
   - Fields:
     ```
     email: "admin@claimbuddy.cz"
     displayName: "Admin User"
     role: "admin"
     status: "active"
     createdAt: [timestamp]
     updatedAt: [timestamp]
     ```

3. **Test lokálně:**
   ```bash
   npm run dev
   # Otevři: http://localhost:3000/login
   # Přihlaš se s admin@claimbuddy.cz / Admin123!
   # Jdi na: http://localhost:3000/admin
   ```

---

### 2. Vercel Deployment

#### A. GitHub Setup

```bash
# Inicializuj git (pokud ještě není)
git init
git add .
git commit -m "🚀 Initial commit - ClaimBuddy v1.0"

# Vytvoř GitHub repo
gh repo create claimbuddy --private --source=. --remote=origin --push

# Nebo manuálně:
# 1. Jdi na github.com/new
# 2. Vytvoř private repo "claimbuddy"
# 3. Push:
git remote add origin https://github.com/YOUR_USERNAME/claimbuddy.git
git branch -M main
git push -u origin main
```

#### B. Vercel Setup

**Option 1: Vercel CLI (doporučeno)**

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Následuj prompts:
# - Set up and deploy? Yes
# - Which scope? [Tvůj account]
# - Link to existing project? No
# - What's your project's name? claimbuddy
# - In which directory is your code located? ./
# - Want to modify settings? No

# Při prvním deployi se vytvoří .vercel/project.json
```

**Option 2: Vercel Dashboard (webové rozhraní)**

1. Jdi na: https://vercel.com/new
2. Import Git Repository → Vyber `claimbuddy`
3. Configure Project:
   - Framework Preset: **Next.js**
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

#### C. Environment Variables ve Vercelu

**Všechny tyto proměnné přidej v Vercel Dashboard → Settings → Environment Variables:**

```bash
# Firebase Client (NEXT_PUBLIC_*)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCZWCYmCgfNjYuyDqugKL7q2ECNJLip-cU
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=claimbuddy-1c327.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=claimbuddy-1c327
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=claimbuddy-1c327.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=999605188815
NEXT_PUBLIC_FIREBASE_APP_ID=1:999605188815:web:8f32a5a0b0d99fcc9ddfba

# Firebase Admin (Server-side)
FIREBASE_PROJECT_ID=claimbuddy-1c327
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@claimbuddy-1c327.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC5USvwNeAxX45U\n/DI53em9kKJ0dLMEHQWxMnSpSFbdEZdQbphlL2CLEyTtzhKv2+aVY89LqxxWBrj5\nZD0Ib0dkt96L1EGtRkqV3fuAzDsrg9GJohkAEgA1JLTrRiUEfsqmzczUFh37EaTW\nWKZGYoKt1em2mlvQgfXZ3DpZgUM9gqPQCIAJWJ9egX7j7w/3aiEDCOi+tepRgH4s\nrqw0dNHHGwEunYyFN7PghtExOt72qGxBhyYmxethDl2LBzqWU5EpsYQkwgc/q3ik\nbNAzdQJH+ppkjr6ezmHFJra0briuBAG3x2ZZSMuyKfZ/0t2uAxQvj0W8Zx1JvfJU\n/xJNYKazAgMBAAECggEAIeO/RkmD+2N/Mvl/8ecsRLd7jhJ9XmY0UUhp3z9Ua085\nPcNL6U01uZlBqp+B+VkcnPtIwIzFPNIz55+2LaG0C644a5fgfuCY6TlUMiSnOXj8\ny8+yBLpGAXH6CACm6mCJjOGb8LkuuGhsnapOlhaT0ViKShOGcOYjYLkOjqm98zRt\n+vPQXYg1SG054/yY64bs/sFgyuFB+G8xtnYSBLGXVny/8/ZGi2jHqeC/VJ+VxlYl\nFgLMXC1c7BlhDd1hyCO6oq17QWw/CYQCF0FuiEsB5oVcHUJ/W0gJ0Ne24thntBzc\nLlbiWKw69L61JIroB1Cz1VSp2aZddhWZc/BMWA0+gQKBgQDraAzzt+V7a0L5XVDw\nWDviC2H0brpOaeiWLCfclTmQxKuDQK0KaxkjfrVCQh/gJiGf04pPcN/BPyjKAdnG\n+SI9mJZRkVjbHer89LT06z1ZyMB6RCU335GLMn13JrsEXPl52pUeLVHcq8Hl+jXT\nme7+4dTVwDV1oWR46dtYEDrFQQKBgQDJh11pupfMVtBW+lCGRoS4ufTXuimZsJZ4\n1Jf5aEJSzP2nptkxj2EI7JCIsF9yHiEYK0LpvivcOPWM4z5VZlm+kmgd0N/RSu7d\nO2bSNcA1cMg4YN0dGuKXB4Ky/hedaFU4cXR7vovSMIOqAoEm/sRSWZKN7NpVLUsF\n/667iMrq8wKBgQCjaamEDeZZlI37eNHU5gs70VcATVU7Vb3FcYWCVHyPiFbfWChH\nES10PGMrSafC+/Vfc4ORvfM1vNhd0ocQ3qTsSV4f5VvfT5duXZi4ZAxEpV0oAuIr\nNSFdlYEPE23Di58K/beCKUeoffqt4NE4wKTtfms2rqTtsUmDviMrsKh7gQKBgGYM\nV68MP4XHiCQjCNeVqetorqT2rc4Xb3qsHHC87KjFCMT2ZhEEi5xbPi0ZMpu0yglV\nDsMR+1++sAixoYTZGSS5OmOuu0dd7Gq2g7B6a2QkQh7aXd05GfhkYziEFi0tAcpd\nGSD4MhEzY9iZABFg/MS+esnHYB+1mcHl4PMxp58lAoGBAIxJL9k8IWcNygy5s56L\nKqqUGQuieC033KQD+mEvqLfNPeHvrUiwkMCEq7yeH+pHLvfxtQEKOaw4adGVxb50\na6TUnX5hcNenduLUgnMD2GOZp3Vql2XV3eeptpzo26/ePrJzSyDSVYehuIlAYhHo\nqAg8Wvf9lHO27LJRvPK3PNgK\n-----END PRIVATE KEY-----\n"

# Google AI (Gemini 2.0 Flash)
GOOGLE_AI_API_KEY=AIzaSyBqBcc2Wc9-dTv1bFLBIpMJUVCG-B_ZfP4

# App URL (po deployi aktualizuj na produkční URL!)
NEXT_PUBLIC_APP_URL=https://claimbuddy.vercel.app

# Rate Limiting (zapni v produkci)
RATE_LIMITING_ENABLED=true

# Stripe (TODO - později)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Resend (TODO - později)
RESEND_API_KEY=re_...
```

**⚠️ DŮLEŽITÉ:**
- FIREBASE_PRIVATE_KEY musí obsahovat `\n` pro new lines (viz výše)
- Všechny proměnné nastav pro **Production, Preview, Development**
- Po deployi aktualizuj `NEXT_PUBLIC_APP_URL` na produkční URL

#### D. Deploy

```bash
# Production deploy
vercel --prod

# Nebo přes Git:
git push origin main
# → Automaticky se deployuje přes Vercel GitHub integration
```

---

### 3. Firebase Authorized Domains

**Po deployi na Vercel přidej domain do Firebase:**

1. Jdi na: https://console.firebase.google.com/project/claimbuddy-1c327/authentication/settings
2. Tab: **Authorized domains**
3. Přidej:
   - `claimbuddy.vercel.app` (pokud používáš Vercel subdomain)
   - `claimbuddy.cz` (pokud máš custom domain)

---

### 4. Upstash Redis (Production Rate Limiting)

**Proč?** Aktuálně používáš in-memory rate limiting, které resetuje při každém deployi. Pro produkci potřebuješ perzistentní storage.

#### Setup:

1. **Vytvoř Upstash účet:**
   - Jdi na: https://upstash.com
   - Sign up (GitHub login)

2. **Vytvoř Redis database:**
   - Create Database → Regional
   - Name: `claimbuddy-rate-limit`
   - Region: `eu-west-1` (Ireland - blízko k Evropě)
   - Type: **Free** (10,000 commands/day)

3. **Zkopíruj credentials:**
   - REST API → Copy `.env`
   - Přidej do Vercel Environment Variables:
     ```bash
     UPSTASH_REDIS_REST_URL=https://...
     UPSTASH_REDIS_REST_TOKEN=...
     ```

4. **Aktivuj rate limiting:**
   ```bash
   RATE_LIMITING_ENABLED=true
   ```

5. **Redeploy:**
   ```bash
   vercel --prod
   ```

---

### 5. Stripe Setup (Volitelné - pro platby)

**Když budeš chtít zprovoznit platby:**

1. **Vytvoř Stripe účet:**
   - https://dashboard.stripe.com/register

2. **Get API keys:**
   - Developers → API keys
   - Zkopíruj:
     - Publishable key → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
     - Secret key → `STRIPE_SECRET_KEY`

3. **Webhook setup:**
   - Developers → Webhooks → Add endpoint
   - URL: `https://claimbuddy.vercel.app/api/webhooks/stripe`
   - Events:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
   - Signing secret → `STRIPE_WEBHOOK_SECRET`

4. **Test mode:**
   - Začni s test keys (`pk_test_...`, `sk_test_...`)
   - Později přepni na live keys

---

### 6. Resend Email Setup (Volitelné - pro emaily)

**Když budeš chtít posílat emaily:**

1. **Vytvoř Resend účet:**
   - https://resend.com/signup

2. **Get API key:**
   - API Keys → Create API Key
   - Zkopíruj → `RESEND_API_KEY`

3. **Verify domain:**
   - Domains → Add Domain
   - `claimbuddy.cz`
   - Přidej DNS záznamy (TXT, MX, CNAME)

4. **Test lokálně:**
   ```typescript
   import { Resend } from 'resend';
   const resend = new Resend(process.env.RESEND_API_KEY);

   await resend.emails.send({
     from: 'ClaimBuddy <noreply@claimbuddy.cz>',
     to: 'user@example.com',
     subject: 'Test email',
     html: '<p>Hello!</p>',
   });
   ```

---

### 7. Custom Domain (Volitelné)

**Pokud máš doménu (např. `claimbuddy.cz`):**

1. **Vercel Dashboard:**
   - Settings → Domains
   - Add Domain: `claimbuddy.cz`
   - Přidej také: `www.claimbuddy.cz`

2. **DNS nastavení u registrátora:**
   ```
   Type: A
   Name: @
   Value: 76.76.21.21

   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

3. **SSL:**
   - Automaticky přes Vercel (Let's Encrypt)
   - Počkej 24-48h na DNS propagaci

4. **Aktualizuj Firebase Authorized Domains:**
   - Přidej `claimbuddy.cz` a `www.claimbuddy.cz`

5. **Aktualizuj Environment Variables:**
   ```bash
   NEXT_PUBLIC_APP_URL=https://claimbuddy.cz
   ```

---

## 🧪 Post-Deployment Testing

### Checklist po deployi:

```bash
# 1. Otevři produkční URL
https://claimbuddy.vercel.app

# 2. Zkontroluj všechny public stránky
✓ Homepage (/)
✓ About (/about)
✓ Pricing (/pricing)
✓ FAQ (/faq)
✓ Legal pages (/legal/*)

# 3. Registrace + Login
✓ Register (/register)
✓ Login (/login)
✓ Email verification
✓ Password reset

# 4. Client Dashboard
✓ Nahrát případ (/dashboard/new)
✓ Seznam případů (/dashboard)
✓ Detail případu (/dashboard/cases/[id])
✓ Chat s agentem
✓ OCR funguje (Gemini API)
✓ File upload funguje (Firebase Storage)

# 5. Admin System
✓ Analytics Dashboard (/admin)
✓ Cases List (/admin/cases)
✓ Case Detail (/admin/cases/[id])
✓ User Management (/admin/users)
✓ Všechny grafy se renderují
✓ Filtry fungují
✓ Export to CSV funguje

# 6. Security
✓ Middleware chrání /admin routes
✓ Middleware chrání /dashboard routes
✓ Firebase Rules fungují (cross-user access blocked)
✓ Rate limiting funguje (pokud je zapnutý)

# 7. Performance
✓ Lighthouse score > 90
✓ First Contentful Paint < 2s
✓ Time to Interactive < 3s
```

---

## 📊 Monitoring & Analytics

### Vercel Analytics (zdarma)

```bash
# Install
npm install @vercel/analytics

# Add to app/layout.tsx
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

### Firebase Usage Monitoring

**Firestore:**
- https://console.firebase.google.com/project/claimbuddy-1c327/firestore/usage

**Storage:**
- https://console.firebase.google.com/project/claimbuddy-1c327/storage/usage

**Authentication:**
- https://console.firebase.google.com/project/claimbuddy-1c327/authentication/users

**Limity (Spark plan - FREE):**
- Firestore: 1GB storage, 10GB/month transfer
- Storage: 5GB storage, 1GB/day downloads
- Authentication: Neomezené (email/password)

---

## 🔐 Security Best Practices

### ✅ Co je už implementováno:

- [x] Environment variables (`.env.local` v `.gitignore`)
- [x] Firebase Rules (Storage + Firestore)
- [x] Middleware auth protection
- [x] RBAC (client/agent/admin)
- [x] Rate limiting (OCR, Chat, API, Auth)
- [x] Input validation (Zod schemas)
- [x] XSS protection (React escaping)
- [x] CSRF protection (Next.js SameSite cookies)

### 📝 Doporučení pro produkci:

1. **Změň výchozí admin heslo:**
   ```bash
   # Po prvním přihlášení jdi na:
   /dashboard/settings
   # A změň heslo z "Admin123!" na silné heslo
   ```

2. **Zapni 2FA pro admin účty:**
   - Firebase Console → Authentication → Settings → Multi-factor auth

3. **Monitoring logs:**
   - Vercel Dashboard → Logs
   - Firebase Console → Functions → Logs (pokud budeš používat Functions)

4. **Backup Firestore:**
   - Firebase Console → Firestore → Export/Import
   - Nastavit pravidelný export do Cloud Storage

5. **HTTPS Only:**
   - Vercel automaticky přesměruje HTTP → HTTPS
   - Zkontroluj že všechny API calls používají `https://`

---

## 💰 Náklady

### Free Tier Limits:

**Vercel:**
- 100GB bandwidth/month
- Unlimited deployments
- Analytics included
- ✅ **ZDARMA** pro personal projekty

**Firebase (Spark Plan):**
- Firestore: 1GB, 10GB transfer/month
- Storage: 5GB, 1GB download/day
- Auth: Neomezené
- ✅ **ZDARMA** pro malé projekty

**Google AI (Gemini 2.0 Flash):**
- Input: $0.075 per 1M tokens
- Output: $0.30 per 1M tokens
- **Odhad:** 1000 OCR requestů = ~$1-2
- ✅ **PAY-AS-YOU-GO** (levný model)

**Upstash Redis:**
- 10,000 commands/day
- ✅ **ZDARMA**

**Celkem měsíčně (100 uživatelů, 500 případů):**
- Vercel: $0
- Firebase: $0
- Gemini AI: ~$5-10
- Upstash: $0
- **TOTAL: ~$5-10/měsíc** 🎉

---

## 🆘 Troubleshooting

### Problém: "Authentication Error" po deployi

**Řešení:**
1. Zkontroluj Firebase Authorized Domains
2. Zkontroluj Environment Variables ve Vercelu
3. Zkontroluj že `FIREBASE_PRIVATE_KEY` má správné `\n`

### Problém: "403 Forbidden" při uploadu souborů

**Řešení:**
1. Zkontroluj Firebase Storage Rules
2. Zkontroluj že user má token v cookies
3. Zkontroluj že `caseId` je správně předán

### Problém: Rate limiting nefunguje

**Řešení:**
1. Zkontroluj `RATE_LIMITING_ENABLED=true`
2. Zkontroluj Upstash credentials
3. Zkontroluj Vercel logs: `vercel logs`

### Problém: Grafy se nerenderují

**Řešení:**
1. Zkontroluj že Recharts je nainstalován: `npm list recharts`
2. Zkontroluj browser console (F12)
3. Zkontroluj že API vrací správná data: `/api/admin/analytics`

---

## 📞 Support & Resources

**Dokumentace:**
- Next.js: https://nextjs.org/docs
- Firebase: https://firebase.google.com/docs
- Vercel: https://vercel.com/docs
- Gemini API: https://ai.google.dev/docs

**Help:**
- GitHub Issues: [Tvůj repo]/issues
- Discord: (TODO - vytvoř community)
- Email: support@claimbuddy.cz

---

**Vytvořeno:** 2025-11-01
**Status:** ✅ PRODUCTION READY
**Next Steps:** Deploy na Vercel → Test → Launch! 🚀
