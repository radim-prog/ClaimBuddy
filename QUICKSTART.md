# ⚡ QUICKSTART - 2 minuty k rozběhnutí

## 🚀 Start za 4 příkazy:

```bash
git clone https://github.com/radim-prog/UcetniWebApp.git
cd UcetniWebApp
git checkout claude/load-project-0139XquGDoefhFdrvoDP3cEN
npm install
npm run dev
```

→ Otevři: **http://localhost:3000**

---

## 🔐 .env.local (zkopíruj tohle):

```env
NEXT_PUBLIC_SUPABASE_URL=https://ybcubkuskirbspyoxpak.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliY3Via3Vza2lyYnNweW94cGFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc2NDk4OTcsImV4cCI6MjA1MzIyNTg5N30.f5YqVFh0G7fH7wXeMxJx3KN6hWPFtVBQQZgxOYPNEf4
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliY3Via3Vza2lyYnNweW94cGFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzY0OTg5NywiZXhwIjoyMDUzMjI1ODk3fQ.gXOR0x8V_RBwJiRqNLqr-CgOOajrOMHfg5WNJjvG_Gk
```

---

## ✅ CO FUNGUJE:

- `/register` → Registrace ✅
- `/login` → Přihlášení ✅
- `/accountant/dashboard` → **Master Matrix** (5 klientů × 12 měsíců) ✅
- `/client/dashboard` → Client dashboard ✅
- Middleware (route protection) ✅
- Toast notifications ✅
- Responsive design ✅

---

## 🎯 CO DĚLAT DAL:

1. **Deploy na Vercel** → Vercel Dashboard → Settings → Git → Production Branch: `claude/load-project-0139XquGDoefhFdrvoDP3cEN`
2. **Napojit Supabase** → Nahradit mock data reálnými v dashboards
3. **Implementovat Upload** → `/client/upload` page

**Detaily:** Čti `CONTINUE_HERE.md` 📖
