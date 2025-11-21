# 📊 Účetní Web Aplikace

Kompletní webová aplikace pro účetní firmu - samoobslužný portál pro klienty a master dashboard pro účetní.

## 🎯 Hlavní funkce

### **Pro klienty:**
- ✅ Kontrola podkladů (měsíční checklist)
- ✅ Nahrávání dokladů (PDF, obrázky) + OCR
- ✅ Vystavování faktur (integrace s Pohoda)
- ✅ Finanční přehledy (DPH, daň z příjmů)
- ✅ AI chat asistent
- ✅ Responsivní design (mobile-first)

### **Pro účetní:**
- ✅ Master dashboard (přehled všech klientů)
- ✅ Urgovací systém (SMS/Email)
- ✅ Párování plateb
- ✅ Úkolový systém (náhrada Notion/Slack)
- ✅ WhatsApp integrace
- ✅ Google Drive propojení

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Next.js API Routes, Firebase (Firestore, Storage, Auth)
- **AI:** Gemini 2.5 Flash (OCR), OpenAI GPT-4o (Chat)
- **Integrace:** Pohoda mServer, Google Drive, WhatsApp, Twilio, SendGrid

---

## 📦 Instalace

### **1. Naklonovat repozitář**
```bash
git clone git@github.com:radim-prog/UcetniWebApp.git
cd ucetni-web-app
```

### **2. Nainstalovat závislosti**
```bash
npm install
```

### **3. Nastavit environment variables**
```bash
cp .env.local.example .env.local
```

Vyplnit Firebase credentials a API klíče v `.env.local`

### **4. Spustit vývojový server**
```bash
npm run dev
```

Aplikace bude dostupná na [http://localhost:3000](http://localhost:3000)

---

## 🔥 Firebase Setup

### **1. Vytvořit Firebase projekt**
1. Jít na [Firebase Console](https://console.firebase.google.com/)
2. Vytvořit nový projekt
3. Povolit Authentication (Google + Email/Password)
4. Vytvořit Firestore Database
5. Vytvořit Storage bucket

### **2. Získat konfiguraci**
1. Project Settings → General → Your apps
2. Zkopírovat Firebase config do `.env.local`

### **3. Nastavit Security Rules**

**Firestore Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }

    function isAccountant() {
      return isAuthenticated() &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'accountant';
    }

    match /companies/{companyId} {
      allow read: if isAuthenticated();
      allow write: if isAccountant();
    }

    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if request.auth.uid == userId || isAccountant();
    }
  }
}
```

**Storage Rules:**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /companies/{companyId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

### **4. Deploy rules**
```bash
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

---

## 📂 Struktura projektu

```
ucetni-web-app/
├── app/
│   ├── (auth)/              # Autentizace
│   │   ├── login/
│   │   └── register/
│   ├── (client-dashboard)/  # Klientská část
│   │   ├── page.tsx
│   │   ├── faktury/
│   │   ├── doklady/
│   │   └── chat/
│   ├── (accountant-dashboard)/  # Účetní část
│   │   ├── page.tsx
│   │   ├── klienti/
│   │   └── ukoly/
│   └── api/
│       ├── ocr/            # Gemini OCR
│       ├── ai-chat/        # AI asistent
│       ├── pohoda/         # Pohoda integrace
│       └── webhooks/
├── components/
│   ├── ui/                 # shadcn/ui komponenty
│   ├── client/             # Klientské komponenty
│   ├── accountant/         # Účetní komponenty
│   └── shared/             # Sdílené komponenty
├── lib/
│   ├── firebase.ts         # Firebase config
│   └── utils.ts
└── types/
    └── database.ts         # TypeScript typy
```

---

## 🚀 Deployment

### **Vercel (doporučeno)**
```bash
npm install -g vercel
vercel
```

### **Firebase Hosting**
```bash
npm run build
firebase deploy --only hosting
```

---

## 🔐 Environment Variables

| Proměnná | Popis |
|----------|-------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API klíč |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase Project ID |
| `GEMINI_API_KEY` | Google Gemini API klíč |
| `OPENAI_API_KEY` | OpenAI API klíč |
| `POHODA_MSERVER_URL` | URL Pohoda mServer |
| `TWILIO_ACCOUNT_SID` | Twilio SID (pro SMS) |
| `SENDGRID_API_KEY` | SendGrid klíč (pro email) |

---

## 📝 Roadmap

### **Fáze 1: MVP (3 měsíce)** ✅
- [x] Základní setup
- [ ] Klientský dashboard
- [ ] Nahrávání dokladů + OCR
- [ ] Fakturace
- [ ] Master dashboard
- [ ] Urgence (SMS/Email)
- [ ] Pohoda integrace

### **Fáze 2: AI & Komunikace (2 měsíce)**
- [ ] AI chat asistent
- [ ] WhatsApp integrace
- [ ] Úkolový systém
- [ ] Pokročilé párování plateb

### **Fáze 3: Škálování**
- [ ] Mobilní aplikace
- [ ] Advanced reporting
- [ ] Multi-firma support

---

## 💰 Odhadované náklady (provoz)

Pro 100 klientů:
- Firebase: ~$50/měsíc
- AI APIs: ~$115/měsíc
- SMS/Email: ~$35/měsíc
- Hosting: ~$20/měsíc
- **Celkem: ~$220/měsíc**

---

## 📚 Dokumentace

- [Next.js Docs](https://nextjs.org/docs)
- [Firebase Docs](https://firebase.google.com/docs)
- [Pohoda XML API](https://api.stormware.cz/pohoda/)
- [Gemini API](https://ai.google.dev/gemini-api/docs)

---

## 👨‍💻 Autor

**Radim** - [radim@wikiporadce.cz](mailto:radim@wikiporadce.cz)

---

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) pro UI komponenty
- [Stormware](https://www.stormware.cz/) za Pohoda API
- [Firebase](https://firebase.google.com/) za backend infrastrukturu
