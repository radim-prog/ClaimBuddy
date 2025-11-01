# ClaimBuddy - Quick Start Guide

Rychlý průvodce pro spuštění projektu.

---

## 1. Prerequisites

Ujistěte se, že máte nainstalované:
- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** nebo **yarn**
- **Git**

---

## 2. Installation

```bash
# Clone repository (pokud používáte Git)
git clone https://github.com/your-username/claimbuddy.git
cd claimbuddy

# Install dependencies
npm install
```

---

## 3. Firebase Setup

### 3.1 Vytvořit Firebase projekt
1. Jděte na [Firebase Console](https://console.firebase.google.com/)
2. Klikněte na "Add project"
3. Pojmenujte projekt (např. "ClaimBuddy")
4. Disable Google Analytics (nebo enable podle potřeby)
5. Create project

### 3.2 Enable Authentication
1. V levém menu klikněte na **Authentication**
2. Click "Get started"
3. Enable **Email/Password**
4. Enable **Google** (vyžaduje OAuth setup)

### 3.3 Create Firestore Database
1. V levém menu klikněte na **Firestore Database**
2. Click "Create database"
3. Start in **test mode** (pro development)
4. Choose location (např. europe-west1)

### 3.4 Create Storage Bucket
1. V levém menu klikněte na **Storage**
2. Click "Get started"
3. Start in **test mode**
4. Use default bucket

### 3.5 Get Firebase Config
1. Jděte na **Project Settings** (gear icon)
2. Scroll down na "Your apps"
3. Click on web icon (</>)
4. Register app (název např. "ClaimBuddy Web")
5. Copy Firebase config

---

## 4. Google AI (Gemini) Setup

1. Jděte na [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Get API key"
3. Create new API key
4. Copy key

---

## 5. Stripe Setup

### 5.1 Create Stripe Account
1. Jděte na [Stripe](https://stripe.com/)
2. Sign up for account
3. Complete business verification (optional pro testing)

### 5.2 Get API Keys
1. V Dashboard jděte na **Developers** → **API keys**
2. Copy **Publishable key** a **Secret key**
3. Toggle "Test mode" ON (pro development)

### 5.3 Setup Webhook (Local testing)
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local
stripe listen --forward-to localhost:3000/api/payments/webhook
# Copy webhook signing secret
```

---

## 6. Environment Variables

Vytvořte soubor `.env.local`:

```bash
# Firebase Client
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123:web:abc123

# Firebase Admin (pro production použij service account JSON)
# Development: Firebase Admin použije application default credentials
# Production: FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'

# Google AI
GOOGLE_AI_API_KEY=your-gemini-api-key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Resend (optional - pro email notifications)
# RESEND_API_KEY=re_...
```

---

## 7. Run Development Server

```bash
npm run dev
```

Otevřete [http://localhost:3000](http://localhost:3000)

---

## 8. Test The App

### 8.1 Register New User
1. Jděte na `/register`
2. Vyplňte formulář
3. Souhlaste s GDPR
4. Klikněte "Vytvořit účet"
5. Měli byste být přesměrováni na `/dashboard`

### 8.2 Login
1. Jděte na `/login`
2. Použijte email/heslo
3. Nebo použijte "Pokračovat s Google"

### 8.3 Create Case (když budete mít hotovo dashboard)
1. Jděte na `/dashboard/cases/new`
2. Vyplňte formulář
3. Upload dokumenty
4. Submit

---

## 9. Firebase Security Rules

Před production deploymentem aktualizujte security rules:

### Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null &&
                   get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'agent'];
    }

    // Cases collection
    match /cases/{caseId} {
      allow read: if request.auth != null &&
                   (resource.data.userId == request.auth.uid ||
                    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'agent']);
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null &&
                             (resource.data.userId == request.auth.uid ||
                              get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'agent']);
    }

    // Messages collection
    match /messages/{messageId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
    }

    // Timeline collection
    match /timeline/{timelineId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
    }

    // Payments collection
    match /payments/{paymentId} {
      allow read: if request.auth != null &&
                   (resource.data.userId == request.auth.uid ||
                    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow create: if request.auth != null;
      allow update: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

### Storage Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Case documents
    match /cases/{caseId}/documents/{document} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.resource.size < 25 * 1024 * 1024; // 25 MB
    }
  }
}
```

---

## 10. Common Issues

### "Firebase app not initialized"
- Zkontrolujte že `.env.local` existuje a má správné hodnoty
- Restartujte dev server (`npm run dev`)

### "Auth error: Unauthorized"
- Zkontrolujte že jste přihlášení
- Vymazat cookies a zkusit znovu login

### "Stripe webhook failed"
- Ujistěte se že `stripe listen` běží
- Zkontrolujte `STRIPE_WEBHOOK_SECRET` v `.env.local`

### "File upload failed"
- Zkontrolujte Storage rules
- Max file size je 25 MB

### "OCR not working"
- Zkontrolujte `GOOGLE_AI_API_KEY`
- Ujistěte se že Gemini API je enabled v Google Cloud Console

---

## 11. Deployment

### Deploy na Vercel (Doporučeno)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Set environment variables in Vercel Dashboard
# Deploy to production
vercel --prod
```

### Post-deployment checklist
- [ ] Set všechny environment variables ve Vercel
- [ ] Update Firebase Authorized Domains (přidat production domain)
- [ ] Update Stripe Webhook URL (přidat production URL)
- [ ] Test celý flow na production
- [ ] Setup monitoring (Vercel Analytics, Sentry)

---

## 12. Support

Pokud narazíte na problém:
1. Zkontrolujte console v browseru (F12)
2. Zkontrolujte terminal logs
3. Zkontrolujte Firebase logs
4. Zkontrolujte tento guide znovu

---

**Úspěšný development!** 🚀
