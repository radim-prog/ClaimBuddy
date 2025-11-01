# ClaimBuddy - Firebase Setup Guide

## 🎯 Overview

ClaimBuddy používá Firebase pro:
- **Authentication** - Přihlášení uživatelů
- **Firestore** - NoSQL databáze
- **Storage** - Ukládání souborů (PDF, obrázky)
- **Cloud Functions** (volitelně) - Background jobs

---

## 📋 Prerequisites

- Google účet
- Node.js 18+ nainstalovaný
- Firebase CLI: `npm install -g firebase-tools`

---

## 🚀 Step 1: Vytvoření Firebase projektu

### 1.1 Vytvořit projekt v Firebase Console

1. Jdi na https://console.firebase.google.com/
2. Klikni **Add project** / **Přidat projekt**
3. Zadej název: `claimbuddy` (nebo `claimbuddy-dev` pro development)
4. (Volitelně) Zapni Google Analytics - **Doporučeno ANO**
5. Zvol/vytvoř Analytics účet
6. Klikni **Create project**
7. Počkej 30-60 sekund než se projekt vytvoří

### 1.2 Upgrade na Blaze Plan (Pay-as-you-go)

**Proč Blaze Plan?**
- Firebase Storage nad 5 GB free
- Firestore nad 1 GB storage
- Firebase Functions (pokud použijeme)
- DŮLEŽITÉ: I na Blaze Planu máš generous free tier!

**Jak upgradovat:**
1. V Firebase Console vlevo dole: **Upgrade**
2. Zvol **Blaze Plan**
3. Přidej platební metodu (kreditka)
4. Potvrď

**Odhad nákladů (10k uživatelů/měsíc):**
- Firestore: ~$50/měsíc
- Storage: ~$10-20/měsíc
- Functions: ~$5/měsíc (pokud použijeme)
- **Celkem: $65-75/měsíc**

---

## 🔐 Step 2: Firebase Authentication

### 2.1 Zapnout Authentication

1. V Firebase Console: **Build** > **Authentication**
2. Klikni **Get started**
3. Zapni **Sign-in methods:**
   - ✅ **Email/Password** (Enable)
   - ✅ **Google** (Enable) - Potřebuješ OAuth consent screen
   - ❌ Facebook, Apple, atd. (zatím ne - můžeš přidat později)

### 2.2 Konfigurace Email/Password

1. Klikni **Email/Password**
2. Enable switch: **ON**
3. **Email link (passwordless sign-in)**: OFF (zatím)
4. Save

### 2.3 Konfigurace Google Sign-In

1. Klikni **Google**
2. Enable switch: **ON**
3. **Project support email:** Vyber svůj email
4. Save

### 2.4 Authorized Domains

1. V **Authentication** > **Settings** > **Authorized domains**
2. Default: `localhost`, `*.firebaseapp.com` jsou už přidané
3. Přidej **produkční doménu:**
   - `claimbuddy.com`
   - `*.vercel.app` (pokud používáš Vercel)
4. Save

---

## 🗄️ Step 3: Firestore Database

### 3.1 Vytvořit Firestore databázi

1. V Firebase Console: **Build** > **Firestore Database**
2. Klikni **Create database**
3. **Start in:** Zvol **Production mode** (security rules nastavíme později)
4. **Location:** Zvol `europe-west3` (Frankfurt) - nejblíž k ČR
5. Klikni **Enable**
6. Počkej cca 1 minutu

### 3.2 Vytvořit Collections (prázdné - vzniknou automaticky)

Firestore collections vzniknou automaticky při prvním write. Ale můžeš vytvořit manually:

1. Klikni **Start collection**
2. **Collection ID:** `users`
3. **Document ID:** Auto-ID
4. **Fields:**
   - `email` (string): `test@example.com`
   - `role` (string): `client`
5. Klikni **Save**
6. Pak můžeš testovací document smazat

**Collections k vytvoření:**
- `users`
- `cases`
- `documents`
- `payments`
- `ai_conversations`
- `settings`

**Note:** Subcollections (např. `cases/{id}/messages`) se vytvoří při prvním write.

### 3.3 Nastavit Firestore Security Rules

1. V **Firestore Database** > **Rules** tab
2. Smaž výchozí rules a zkopíruj obsah z `FIRESTORE_RULES.txt` (viz soubor níže)
3. Klikni **Publish**

---

## 📁 Step 4: Firebase Storage

### 4.1 Vytvořit Storage bucket

1. V Firebase Console: **Build** > **Storage**
2. Klikni **Get started**
3. **Security rules:** Start in **Production mode**
4. **Location:** `europe-west3` (stejné jako Firestore)
5. Klikni **Done**

### 4.2 Vytvořit složky (organizace)

Firebase Storage nemá reálné složky, ale používáme path prefix:

```
/uploads/
  /cases/
    /{caseId}/
      /documents/
        /{documentId}.{ext}
      /photos/
        /{photoId}.{ext}
```

**Struktura se vytvoří automaticky při uploadu.**

### 4.3 Nastavit Storage Security Rules

1. V **Storage** > **Rules** tab
2. Smaž výchozí rules a zkopíruj obsah z `STORAGE_RULES.txt` (viz soubor níže)
3. Klikni **Publish**

---

## 🔑 Step 5: Získání Credentials

### 5.1 Web App Credentials (Frontend)

1. V Firebase Console: **Project Overview** (ikona ozubeného kola) > **Project settings**
2. Scroll dolů na **Your apps**
3. Klikni **</> (Web app)** ikonu
4. **App nickname:** `ClaimBuddy Web`
5. **Firebase Hosting:** NE (používáme Vercel)
6. Klikni **Register app**
7. Zkopíruj `firebaseConfig` object:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "claimbuddy-xxxxx.firebaseapp.com",
  projectId: "claimbuddy-xxxxx",
  storageBucket: "claimbuddy-xxxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:xxxxx",
  measurementId: "G-XXXXXXXXXX"
};
```

8. **Přidej do `.env.local`:**

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=claimbuddy-xxxxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=claimbuddy-xxxxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=claimbuddy-xxxxx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:xxxxx
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 5.2 Admin SDK Credentials (Backend)

**Potřebuješ pro server-side API routes!**

1. V **Project settings** > **Service accounts** tab
2. Klikni **Generate new private key**
3. Potvrd a stáhni JSON soubor (např. `claimbuddy-xxxxx-firebase-adminsdk-xxxxx.json`)
4. **NIKDY necommituj tento soubor do Gitu!**
5. Otevři JSON soubor a zkopíruj hodnoty:

```json
{
  "project_id": "claimbuddy-xxxxx",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@claimbuddy-xxxxx.iam.gserviceaccount.com"
}
```

6. **Přidej do `.env.local`:**

```bash
FIREBASE_ADMIN_PROJECT_ID=claimbuddy-xxxxx
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@claimbuddy-xxxxx.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

**DŮLEŽITÉ:**
- Private key musí být v uvozovkách a obsahovat `\n` newline znaky
- Zachovej formát včetně `-----BEGIN PRIVATE KEY-----` a `-----END PRIVATE KEY-----`

---

## 🛠️ Step 6: Firebase CLI Setup (Development)

### 6.1 Přihlášení do Firebase CLI

```bash
firebase login
```

- Otevře se browser
- Přihlaš se Google účtem
- Potvrď oprávnění

### 6.2 Inicializace projektu

```bash
cd /Users/Radim/Projects/claimbuddy
firebase init
```

**Vyber služby:**
- ✅ Firestore
- ✅ Storage
- ❌ Functions (zatím ne, můžeš přidat později)
- ❌ Hosting (používáme Vercel)

**Nastavení:**
1. **Use existing project:** Vyber `claimbuddy-xxxxx`
2. **Firestore rules file:** `firestore.rules` (default)
3. **Firestore indexes file:** `firestore.indexes.json` (default)
4. **Storage rules file:** `storage.rules` (default)

### 6.3 Nasazení Rules (z CLI)

```bash
# Firestore rules
firebase deploy --only firestore:rules

# Storage rules
firebase deploy --only storage:rules
```

---

## 📊 Step 7: Firestore Indexes

### 7.1 Vytvořit composite indexes

Některé queries vyžadují composite indexy. Firebase ti je navrhne automaticky při prvním dotazu.

**Nebo vytvořit ručně:**

1. V **Firestore Database** > **Indexes** tab
2. Klikni **Create index**
3. **Collection:** `cases`
4. **Fields:**
   - `userId` (Ascending)
   - `status` (Ascending)
   - `createdAt` (Descending)
5. Klikni **Create**

**Doporučené indexy (pro optimalizaci):**

#### Index 1: User cases by status
```
Collection: cases
Fields:
  - userId (Ascending)
  - status (Ascending)
  - createdAt (Descending)
```

#### Index 2: Admin cases priority
```
Collection: cases
Fields:
  - status (Ascending)
  - priority (Descending)
  - createdAt (Ascending)
```

#### Index 3: Assigned cases
```
Collection: cases
Fields:
  - assignedTo (Ascending)
  - status (Ascending)
  - updatedAt (Descending)
```

**Note:** Indexy se automaticky vytvoří při prvním query, který je potřebuje. Firebase ti pošle error s linkem na vytvoření indexu.

---

## 🔒 Step 8: Security Best Practices

### 8.1 API Key Restrictions

**Firebase Web API Key je public - to je OK!**
- Nemůže se zneužít bez autentizace
- Security se řeší přes Firestore/Storage Rules

**Ale můžeš omezit (doporučeno pro production):**

1. Jdi do Google Cloud Console: https://console.cloud.google.com/
2. **APIs & Services** > **Credentials**
3. Najdi **Browser key (auto created by Firebase)**
4. **Application restrictions:**
   - HTTP referrers: `claimbuddy.com/*`, `*.vercel.app/*`
5. **API restrictions:**
   - Restrict key: Identity Toolkit API, Cloud Firestore API, Cloud Storage
6. Save

### 8.2 Enable App Check (Anti-abuse)

**Firebase App Check** chrání před zneužitím (boti, scraping):

1. V Firebase Console: **Build** > **App Check**
2. Klikni **Get started**
3. **reCAPTCHA v3:** Register site
   - Doména: `claimbuddy.com`
   - reCAPTCHA type: Score-based
4. Zkopíruj **Site Key** a **Secret Key**
5. Přidej do `.env.local`:

```bash
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6Lc...
RECAPTCHA_SECRET_KEY=6Lc...
```

6. **Enforcement:** Start in **Unenforced mode** (monitoring)
7. Po testování: Přepni na **Enforced mode**

### 8.3 Audit Logs

1. V **Firestore** > **Usage** tab
2. Sleduj:
   - Reads/Writes per day
   - Document count
   - Storage size
3. Nastav **Budget alerts** v Google Cloud Console

---

## 🧪 Step 9: Testing Firebase Setup

### 9.1 Vytvořit testovacího uživatele

```bash
# V projektu
npm run dev
```

1. Jdi na http://localhost:3000/register
2. Zaregistruj testovacího usera:
   - Email: `test@claimbuddy.com`
   - Heslo: `testtest123`
3. Zkontroluj v Firebase Console > **Authentication** > **Users**
   - Měl by být vidět nový user

### 9.2 Test Firestore Write

```typescript
// V app/test/page.tsx (temporary test page)
'use client';

import { db } from '@/lib/firebase/config';
import { collection, addDoc } from 'firebase/firestore';

export default function TestPage() {
  const testWrite = async () => {
    try {
      const docRef = await addDoc(collection(db, 'users'), {
        email: 'test@example.com',
        role: 'client',
        createdAt: new Date()
      });
      console.log('Document written with ID: ', docRef.id);
    } catch (e) {
      console.error('Error adding document: ', e);
    }
  };

  return <button onClick={testWrite}>Test Firestore Write</button>;
}
```

### 9.3 Test Storage Upload

```typescript
import { storage } from '@/lib/firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const testUpload = async (file: File) => {
  const storageRef = ref(storage, `test/${file.name}`);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  console.log('File uploaded:', url);
};
```

---

## 📊 Step 10: Monitoring & Analytics

### 10.1 Firebase Analytics

Pokud jsi zapnul Analytics při vytváření projektu:

1. V Firebase Console: **Analytics** > **Dashboard**
2. Sleduj:
   - Active users
   - Events
   - Conversions

### 10.2 Performance Monitoring (volitelně)

```bash
npm install firebase
```

```typescript
// lib/firebase/config.ts
import { getPerformance } from 'firebase/performance';

const perf = getPerformance(app);
```

---

## 🚀 Step 11: Production Deployment

### 11.1 Environment Variables (Vercel)

1. V Vercel dashboard: **Settings** > **Environment Variables**
2. Přidej všechny Firebase env vars z `.env.local`
3. **Scope:** Production, Preview, Development

### 11.2 Firestore Production Rules

V production mód přepni security rules na strict:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Production rules (viz FIRESTORE_RULES.txt)
  }
}
```

---

## 📚 Užitečné odkazy

- **Firebase Console:** https://console.firebase.google.com/
- **Firebase Docs:** https://firebase.google.com/docs
- **Firestore Queries:** https://firebase.google.com/docs/firestore/query-data/queries
- **Storage Security:** https://firebase.google.com/docs/storage/security
- **Firebase Pricing:** https://firebase.google.com/pricing

---

## ⚠️ Troubleshooting

### Problem: "Missing or insufficient permissions"

**Řešení:**
- Zkontroluj Firestore Security Rules
- Ověř že user je přihlášený (`auth.currentUser`)
- Zkontroluj že máš správný `userId` match

### Problem: "Storage unauthorized"

**Řešení:**
- Zkontroluj Storage Security Rules
- Ověř že používáš správný auth token
- Zkontroluj že cesta k souboru je správná

### Problem: "Firebase config is missing"

**Řešení:**
- Zkontroluj že máš všechny env vars v `.env.local`
- Restartuj `npm run dev`
- Ověř že env vars jsou `NEXT_PUBLIC_` pro client-side

### Problem: "Admin SDK authentication error"

**Řešení:**
- Zkontroluj formát private key (musí obsahovat `\n`)
- Ověř že používáš správný service account email
- Regeneruj private key v Firebase Console

---

## ✅ Checklist

Před spuštěním projektu:

- [ ] Firebase projekt vytvořen
- [ ] Blaze Plan aktivován
- [ ] Authentication zapnutá (Email/Password + Google)
- [ ] Firestore databáze vytvořena (europe-west3)
- [ ] Storage bucket vytvořen (europe-west3)
- [ ] Security rules nasazeny (Firestore + Storage)
- [ ] Web app credentials zkopírovány do `.env.local`
- [ ] Admin SDK credentials zkopírovány do `.env.local`
- [ ] Firebase CLI přihlášen a inicializován
- [ ] Composite indexy vytvořeny (nebo připraveny)
- [ ] Testovací user vytvořen a funguje
- [ ] App Check nakonfigurován (pro production)
- [ ] Budget alerts nastaveny v Google Cloud Console

---

**Ready to go! 🚀**
