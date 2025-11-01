# ClaimBuddy 🛡️

> AI-powered insurance claims assistant for Czech market

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-10.12-orange)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/license-Proprietary-red)](./LICENSE)

[🚀 Live Demo](https://claimbuddy.vercel.app) | [📚 Documentation](./docs/) | [🤝 Contributing](./CONTRIBUTING.md)

Moderní Next.js aplikace pro profesionální vyřízení pojistných událostí s AI asistentem.

## Features

- 🤖 AI Assistant (Google Gemini 2.0)
- 📄 OCR Document Scanning
- 💳 Stripe + GoPay Payments
- 📊 Client Dashboard
- 👨‍💼 Admin Panel
- 📱 Mobile Responsive
- 🔒 GDPR Compliant

## Status projektu

**✅ FUNKČNÍ ZÁKLAD** - Marketing web hotový, připraveno pro vývoj auth + dashboard

### Co funguje
- 🌐 Marketing web (Landing, Pricing, About, FAQ)
- 🎨 shadcn/ui komponenty (Button, Card)
- ⚙️ Firebase konfigurace
- 📝 TypeScript typy
- 🎯 Tailwind CSS styling

### Co zbývá implementovat
- 🔐 Přihlášení/Registrace (Firebase Auth)
- 📊 Client Dashboard (přehled případů)
- 💬 Komunikace (messages, dokumenty)
- 🤖 AI asistent (Gemini chatbot)
- 💳 Platby (Stripe, GoPay)
- 👨‍💼 Admin panel

## Rychlý start

```bash
# 1. Instalace
npm install

# 2. Environment variables
cp .env.example .env.local
# Vyplňte Firebase credentials v .env.local

# 3. Spuštění
npm run dev
```

Otevřete http://localhost:3000

## Detailní instrukce

Viz **[SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md)** pro:
- Kompletní Firebase setup
- Krok-za-krokem implementace
- Troubleshooting
- Deployment guide

## Dokumentace

- `/docs/PROJECT_STRUCTURE.md` - Adresářová struktura
- `/docs/DATABASE_SCHEMA.md` - Firestore schéma
- `/docs/API_ENDPOINTS.md` - API dokumentace
- `/docs/DEPENDENCIES.md` - NPM packages
- `/content/copy/` - Copywriting (reálný obsah)
- `/legal/` - Právní dokumenty (T&C, Privacy, GDPR)

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Backend:** Firebase (Auth, Firestore, Storage)
- **AI:** Google Gemini 2.0 Flash
- **Payments:** Stripe, GoPay
- **Email:** Resend

## Struktura projektu

```
claimbuddy/
├── app/
│   ├── (marketing)/     ✅ Landing, Pricing, About, FAQ
│   ├── (auth)/          ❌ Login, Register (TODO)
│   ├── (dashboard)/     ❌ Client Dashboard (TODO)
│   ├── (admin)/         ❌ Admin Panel (TODO)
│   ├── api/             ❌ API Routes (TODO)
│   └── legal/           ❌ Legal Pages (TODO)
├── components/
│   ├── ui/              ✅ Button, Card
│   ├── marketing/       ❌ TODO
│   ├── dashboard/       ❌ TODO
│   └── forms/           ❌ TODO
├── lib/                 ✅ Utils, Firebase config
├── types/               ✅ TypeScript definitions
├── content/             ✅ Real copy content
├── legal/               ✅ Legal docs (markdown)
└── docs/                ✅ Project documentation
```

## Příkazy

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint
npm run type-check   # TypeScript check
```

## Následující kroky

1. **Firebase Setup** (20 min)
   - Vytvořit projekt na firebase.google.com
   - Aktivovat Auth, Firestore, Storage
   - Zkopírovat credentials do `.env.local`

2. **Implementovat Auth** (2-3 hodiny)
   - Login/Register pages
   - Firebase Auth integration
   - Protected routes middleware

3. **Client Dashboard** (4-6 hodin)
   - Dashboard overview
   - Case list + case detail
   - File upload

4. **API Routes** (3-4 hodiny)
   - Auth API
   - Cases API
   - Messages API

5. **AI Features** (2-3 hodiny)
   - Gemini chatbot
   - OCR processing

6. **Payments & Admin** (4-5 hodin)
   - Stripe integration
   - Admin dashboard

**Celkový odhad:** 15-21 hodin práce

## License

© 2025 ClaimBuddy s.r.o. All rights reserved.

## Kontakt

- Web: www.claimbuddy.cz (připravuje se)
- Email: info@claimbuddy.cz
- Lokace: Praha, Česká republika

---

**Vytvořeno:** 1. listopadu 2025
**Next.js:** 14.2.0
**Status:** Development (základní struktura hotová)
