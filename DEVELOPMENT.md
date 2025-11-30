# 🚀 Development Guide

## ⚠️ DŮLEŽITÉ - BRANCH STRATEGIE

### 🔴 `main` branch = PRODUKCE
- **NEMĚNIT přímo!**
- Automaticky deployuje na Vercel
- Pouze stabilní, otestovaný kód
- Merge pouze z `dev` branch

### 🟢 `dev` branch = VÝVOJ
- **Pracuj ZDE!**
- Všechny nové funkce a opravy
- Testování před merge do main
- Běží na localhost:3000

---

## 📋 WORKFLOW

### 1. Práce na nové funkci:
```bash
# Ujisti se že jsi na dev
git checkout dev

# Aktualizuj dev
git pull origin dev

# Pracuj...
# (změny, commity)

# Push do dev
git push origin dev
```

### 2. Release do produkce:
```bash
# Merge dev -> main (pouze když vše funguje!)
git checkout main
git merge dev
git push origin main

# Vytvoř tag
git tag -a v1.x -m "Release v1.x - popis"
git push origin v1.x

# Vrať se na dev
git checkout dev
```

---

## 🌍 PROSTŘEDÍ

### Localhost (dev branch):
- URL: `http://localhost:3000`
- Spustit: `npm run dev`
- Supabase: ybcubkuskirbspyoxpak
- Změny okamžitě viditelné

### Vercel Production (main branch):
- URL: https://ucetni-web-app.vercel.app
- Auto-deploy při push do main
- Stejná Supabase jako localhost

---

## 📦 AKTUÁLNÍ VERZE

### v1.0 (2025-11-30)
**Funkce:**
- ✅ Username + Password autentizace
- ✅ 3 kategorie dokladů (Výpis, Nákladové, Příjmové)
- ✅ Master Matrix dashboard
- ✅ Client dashboard
- ✅ Demo mode
- ✅ Setup page (/setup)
- ✅ Supabase integration

**Co NEFUNGUJE (TODO):**
- ❌ Admin panel pro správu uživatelů (v Settings)
- ❌ Změna hesla
- ❌ Upload dokumentů (API ready, UI chybí)
- ❌ OCR zpracování
- ❌ Pohoda export

---

## 🛠️ PŘÍKAZY

### Development:
```bash
npm run dev          # Spustit dev server
npm run build        # Build pro produkci
npm run lint         # Linter
```

### Git:
```bash
git status                    # Aktuální stav
git add -A                    # Stage všechno
git commit -m "zpráva"        # Commit
git push origin dev           # Push do dev
```

---

## 🆘 KDYŽ NĚCO ROZBIJEŠ

### Vrátit poslední commit (lokálně):
```bash
git reset --soft HEAD~1
```

### Vrátit k v1.0:
```bash
git checkout main
git reset --hard v1.0
git push -f origin main
```

### Smazat dev a začít znovu z main:
```bash
git checkout main
git branch -D dev
git checkout -b dev
git push -f origin dev
```

---

## 📝 PRO AI ASISTENTY

**Před jakoukoliv změnou:**
1. Zkontroluj na jakém jsi branchi: `git branch --show-current`
2. Pokud jsi na `main` → **PŘEPNI NA DEV!**
3. Commit zprávy v češtině s emoji
4. Push vždy do `dev`, ne do `main`

**Branch policy:**
- `dev` = svoboda experimentovat
- `main` = pouze funkční kód po testování

**Před merge dev → main:**
1. Otestuj všechny funkce
2. Zkontroluj že build projde: `npm run build`
3. Ujisti se že Vercel bude fungovat
4. Vytvoř tag s verzí

---

**Poslední aktualizace:** 2025-11-30
**Současná branch:** `dev`
**Production URL:** https://ucetni-web-app.vercel.app
