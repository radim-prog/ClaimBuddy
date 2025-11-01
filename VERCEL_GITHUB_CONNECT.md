# 🔗 Propojení GitHub s Vercel - Krok za krokem

**Čas:** 5 minut
**Co to udělá:** Automatický deployment při každém git push

---

## ✅ MÁME HOTOVO

### GitHub Repository:
```
https://github.com/radim-prog/ClaimBuddy
```
✅ Kód je online a zálohovaný!

### Vercel Deployment:
```
https://claimbuddy-cv7bx1esz-radims-projects-1028bd88.vercel.app
```
✅ Aplikace běží živě!

---

## 🎯 TEĎ POTŘEBUJEME PROPOJIT

Aby se každá změna v GitHub automaticky deployovala na Vercel.

---

## 📋 KROK 1: Jdi na Vercel Dashboard

### 1.1 Otevři Vercel
```
https://vercel.com/dashboard
```

### 1.2 Přihlas se
- Použij účet kterým jsi vytvořil projekt
- Měl bys vidět projekt **"claimbuddy"**

---

## 🔗 KROK 2: Připojení GitHub Repository

### 2.1 Klikni na projekt "claimbuddy"

### 2.2 Jdi do Settings
- Klikni na záložku **"Settings"** nahoře

### 2.3 Git v levém menu
- V levém menu klikni na **"Git"**

### 2.4 Connect Git Repository
- Měl bys vidět sekci **"Connect Git Repository"**
- Klikni **"Connect"**

### 2.5 Vyber GitHub
- Klikni na **"GitHub"**

### 2.6 Autorizuj Vercel
- GitHub tě požádá o povolení
- Klikni **"Authorize Vercel"**
- Možná tě požádá o heslo - zadej ho

### 2.7 Install Vercel na repository
- Vyber **"Only select repositories"**
- V dropdownu vyber **"radim-prog/ClaimBuddy"**
- Klikni **"Install"**

### 2.8 Potvrď propojení
- Vercel ti ukáže potvrzení
- Měl bys vidět: **"Connected to radim-prog/ClaimBuddy"**

✅ **HOTOVO - GitHub propojen!**

---

## 🎉 CO SE TEĎSTANE AUTOMATICKY

### Při každém `git push`:
1. ✅ GitHub pošle notifikaci Vercel
2. ✅ Vercel automaticky stáhne nový kód
3. ✅ Spustí `npm run build`
4. ✅ Deployuje novou verzi
5. ✅ Pošle ti email když je hotovo

### Pull Requesty:
1. ✅ Každý PR dostane **preview URL**
2. ✅ Můžeš testovat před mergem
3. ✅ Automatický deployment po merge

---

## 🔥 TEĎ POTŘEBUJEME FIREBASE CREDENTIALS

Aplikace běží, ale potřebuje Firebase credentials pro:
- ✅ Přihlašování (Auth)
- ✅ Databáze (Firestore)
- ✅ Upload souborů (Storage)

---

## 📋 CO POTŘEBUJI OD TEBE

Prosím projdi **FIREBASE_SETUP_GUIDE.md** a pošli mi **9 hodnot**:

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

**Kde najdeš návod:**
```
~/Projects/claimbuddy/FIREBASE_SETUP_GUIDE.md
```

Nebo otevři:
```bash
open ~/Projects/claimbuddy/FIREBASE_SETUP_GUIDE.md
```

---

## 🚀 CO UDĚLÁM JÁ (když mi pošleš Firebase credentials)

### 1. Nastavím Environment Variables ve Vercel
```
Settings → Environment Variables → přidám všech 9 hodnot
```

### 2. Trigger redeploy
```
Deployments → ... → Redeploy
```

### 3. Test funkcionalita
- Registrace nového uživatele
- Přihlášení
- Vytvoření case
- Upload dokumentu
- AI chatbot

### 4. Pošlu ti finální live URL
```
https://claimbuddy-[production].vercel.app
```

---

## ✅ PROGRESS CHECK

Co máme hotovo:
- ✅ Aplikace vytvořena (120+ souborů, 50k+ slov docs)
- ✅ Git repository (4 commity)
- ✅ GitHub upload (`https://github.com/radim-prog/ClaimBuddy`)
- ✅ Vercel deployment (`https://claimbuddy-cv7bx...vercel.app`)
- ✅ GitHub ↔ Vercel propojení (tento krok)

Co zbývá:
- ⏳ Firebase production projekt (15-20 min - děláš ty)
- ⏳ Firebase credentials do Vercel (5 min - dělám já)
- ⏳ Final test (5 min - dělám já)

---

## 📞 NEXT STEP

**Otevři a projdi:**
```
~/Projects/claimbuddy/FIREBASE_SETUP_GUIDE.md
```

**Když budeš mít 9 hodnot, pošli mi je a dokončím to!** 🚀

---

**Za 20 minut můžeš mít plně funkční ClaimBuddy online!** 🎉
