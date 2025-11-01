# 🔥 Firebase Setup - Krok za krokem

**Čas:** 15-20 minut
**Obtížnost:** Snadné (jen klikání)

---

## 📋 Co budeš potřebovat

- Gmail účet (nebo Google Workspace)
- Přístup k internetu
- 15 minut času

---

## 🎯 KROK 1: Vytvoření Firebase projektu (3 min)

### 1.1 Otevři Firebase Console
```
https://console.firebase.google.com
```

### 1.2 Přihlas se
- Použij svůj Gmail účet
- Pokud nemáš, vytvoř si ho na gmail.com

### 1.3 Vytvoř nový projekt
- Klikni na **"Add project"** (nebo "Přidat projekt")
- Název projektu: `claimbuddy-production`
- Klikni **Continue**

### 1.4 Google Analytics (volitelné)
- Zapni nebo vypni podle preference
- Pro začátek doporučuji **vypnout** (rychlejší setup)
- Klikni **Create project**

### 1.5 Počkej
- Firebase vytváří projekt (30-60 sekund)
- Když je hotovo, klikni **Continue**

✅ **HOTOVO - Projekt vytvořen!**

---

## 🔐 KROK 2: Zapnutí Authentication (2 min)

### 2.1 V levém menu klikni na **"Authentication"**

### 2.2 Klikni **"Get started"**

### 2.3 Zapni Email/Password metodu
- Klikni na **"Email/Password"**
- Přepni první toggle na **"Enabled"** (modrá)
- **NE**zapínej "Email link (passwordless sign-in)" - nech to vypnuté
- Klikni **Save**

### 2.4 Zapni Google Sign-In metodu
- Klikni na **"Google"**
- Přepni toggle na **"Enabled"**
- **Project support email:** Vyber svůj email z dropdownu
- Klikni **Save**

✅ **HOTOVO - Přihlašování funguje!**

---

## 💾 KROK 3: Vytvoření Firestore Database (2 min)

### 3.1 V levém menu klikni na **"Firestore Database"**

### 3.2 Klikni **"Create database"**

### 3.3 Security rules
- Vyber: **"Start in production mode"** (DŮLEŽITÉ!)
- Klikni **Next**

### 3.4 Cloud Firestore location
- Vyber: **"eur3 (europe-west)"** (nejbližší k ČR)
- Klikni **Enable**

### 3.5 Počkej
- Firestore se vytváří (30-60 sekund)

✅ **HOTOVO - Databáze vytvořena!**

---

## 📁 KROK 4: Vytvoření Storage (1 min)

### 4.1 V levém menu klikni na **"Storage"**

### 4.2 Klikni **"Get started"**

### 4.3 Security rules
- Ponech defaultní pravidla (production mode)
- Klikni **Next**

### 4.4 Cloud Storage location
- Vyber: **"eur3 (europe-west)"** (stejné jako Firestore)
- Klikni **Done**

✅ **HOTOVO - Úložiště vytvořeno!**

---

## 🔑 KROK 5: Získání Web App Credentials (3 min)

### 5.1 Jdi na Project Overview
- V levém menu úplně nahoře klikni na ikonu **"domečku"** nebo **"Project Overview"**

### 5.2 Přidej Web App
- Uprostřed stránky uvidíš "Get started by adding Firebase to your app"
- Klikni na ikonu **"</>"** (Web platform)

### 5.3 Registruj aplikaci
- **App nickname:** `ClaimBuddy Web`
- **NE**zaškrtávej "Also set up Firebase Hosting" - nech to prázdné
- Klikni **Register app**

### 5.4 DŮLEŽITÉ - Zkopíruj credentials
Uvidíš kód, který vypadá nějak takhle:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "claimbuddy-production.firebaseapp.com",
  projectId: "claimbuddy-production",
  storageBucket: "claimbuddy-production.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

### 5.5 Zkopíruj tyto hodnoty DO TEXŤÁKU:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=claimbuddy-production.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=claimbuddy-production
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=claimbuddy-production.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

**ULOŽ SI TENTO TEXTOVÝ SOUBOR!** Budeš ho potřebovat za chvíli.

### 5.6 Pokračuj
- Klikni **Continue to console**

✅ **HOTOVO - Credentials zkopírované!**

---

## 🔐 KROK 6: Vytvoření Service Account (pro server) (3 min)

### 6.1 Jdi do Project Settings
- V levém menu nahoře klikni na **ikonu ozubeného kolečka ⚙️**
- Klikni **"Project settings"**

### 6.2 Přejdi na Service Accounts tab
- Nahoře klikni na záložku **"Service accounts"**

### 6.3 Vygeneruj nový private key
- Klikni na tlačítko **"Generate new private key"** (velké červené)
- V potvrzovacím okně klikni **"Generate key"**

### 6.4 Stáhne se JSON soubor
- Soubor se jmenuje: `claimbuddy-production-XXXXX.json`
- **ULOŽ SI HO BEZPEČNĚ** (Desktop nebo Downloads)
- **NIKDY ho nesdílej!** Obsahuje tajné klíče

### 6.5 Otevři JSON soubor v textovém editoru
- Najdi tyto 3 hodnoty:
  - `"project_id"`: `"claimbuddy-production"`
  - `"private_key"`: `"-----BEGIN PRIVATE KEY-----\nXXXXXX..."`
  - `"client_email"`: `"firebase-adminsdk-xxxxx@claimbuddy-production.iam.gserviceaccount.com"`

### 6.6 Zkopíruj je DO TEXŤÁKU (k předchozím):

```
FIREBASE_PROJECT_ID=claimbuddy-production
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@claimbuddy-production.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBA...celý dlouhý klíč...\n-----END PRIVATE KEY-----\n"
```

**POZOR:** Private key musí být v uvozovkách a obsahovat \n (backslash-n)!

✅ **HOTOVO - Service Account vytvořen!**

---

## 🌍 KROK 7: Nastavení Authorized Domains (1 min)

### 7.1 Zpět do Authentication
- V levém menu klikni **"Authentication"**

### 7.2 Jdi na Settings tab
- Nahoře klikni na záložku **"Settings"**

### 7.3 Authorized domains
- Scrolluj dolů na sekci **"Authorized domains"**
- Měl bys vidět:
  - ✅ `localhost` (pro lokální vývoj)
  - ✅ `claimbuddy-production.firebaseapp.com`

### 7.4 Přidej Vercel doménu
- Klikni **"Add domain"**
- Vlož: `claimbuddy-cv7bx1esz-radims-projects-1028bd88.vercel.app`
- Klikni **Add**

### 7.5 (Později) Přidej vlastní doménu
Až budeš mít claimbuddy.cz:
- Klikni **"Add domain"**
- Vlož: `claimbuddy.cz`
- Klikni **Add**

✅ **HOTOVO - Domény povoleny!**

---

## 📊 KROK 8: Nastavení Firestore Indexes (2 min)

### 8.1 Jdi do Firestore Database
- V levém menu klikni **"Firestore Database"**

### 8.2 Klikni na záložku **"Indexes"**

### 8.3 Vytvoř composite index pro cases
- Klikni **"Create index"**
- **Collection ID:** `cases`
- Klikni **"Add field"**:
  - Field path: `userId` → Order: `Ascending`
- Klikni **"Add field"** znovu:
  - Field path: `createdAt` → Order: `Descending`
- **Query scope:** Collection
- Klikni **Create**

### 8.4 Počkej na vytvoření
- Status: "Building..." → "Enabled" (1-2 minuty)
- Můžeš pokračovat dál, nemusíš čekat

✅ **HOTOVO - Index se vytváří!**

---

## 🎉 SHRNUTÍ - Co máš teперь hotové

### ✅ Firebase projekt vytvořen
- Název: `claimbuddy-production`
- Region: Europe West

### ✅ Authentication zapnuté
- Email/Password ✓
- Google Sign-In ✓

### ✅ Firestore Database vytvořena
- Production mode ✓
- Indexes se vytváří ✓

### ✅ Storage vytvořen
- Pro upload dokumentů ✓

### ✅ Credentials připravené
Máš textový soubor s těmito hodnotami:

```bash
# Web App (Client-side)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Service Account (Server-side)
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

---

## 📨 CO MÍ TEĎPOŠLI

**Zkopíruj celý obsah textového souboru (všech 9 řádků) a pošli mi ho.**

Příklad:
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAbc123...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=claimbuddy-production.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=claimbuddy-production
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=claimbuddy-production.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
FIREBASE_PROJECT_ID=claimbuddy-production
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@claimbuddy-production.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBA...dlouhý klíč...\n-----END PRIVATE KEY-----\n"
```

**Pak to nastavím do Vercel a bude to živě fungovat!** 🚀

---

## ❓ Troubleshooting

### "Nevidím tlačítko Add project"
- Zkontroluj že jsi přihlášený (vpravo nahoře tvoje fotka/email)
- Zkus obnovit stránku (F5)

### "Firebase říká že projekt už existuje"
- Použij jiný název: `claimbuddy-prod` nebo `claimbuddy-app`

### "Nemůžu najít Private key"
- Měl se stáhnout do Downloads složky
- Jmenuje se: `claimbuddy-production-xxxxx.json`
- Otevři v Poznámkovém bloku (Windows) nebo TextEdit (Mac)

### "Private key je moc dlouhý"
- To je v pořádku! Zkopíruj ho celý včetně BEGIN a END řádků
- Musí být v uvozovkách: `"-----BEGIN...END-----"`

---

**Jakmile mi pošleš ty credentials, nastavím to do Vercel a ClaimBuddy bude živě fungovat!** 🎉
