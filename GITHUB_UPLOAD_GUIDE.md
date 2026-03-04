# 📤 Jak nahrát Pojistná Pomoc na GitHub - Krok za krokem

**Čas:** 10 minut
**Obtížnost:** Snadné

---

## 🎯 Co je GitHub a proč ho potřebuješ

GitHub je jako **"Google Drive pro kód"**:
- ✅ Záloha projektu online (ne jen na tvém počítači)
- ✅ Verzování (můžeš vrátit zpět jakoukoliv změnu)
- ✅ Collaboration (více lidí může na projektu pracovat)
- ✅ Vercel se připojí a automaticky deployuje při každé změně

**Pojistná Pomoc je připravený k nahrání - stačí pár kliků!**

---

## 📋 KROK 1: Vytvoření GitHub účtu (pokud nemáš)

### 1.1 Jdi na GitHub
```
https://github.com
```

### 1.2 Klikni "Sign up"
- **Username:** Něco profesionálního (např. `radim-prog`, `pojistna-pomoc-dev`)
- **Email:** Tvůj hlavní email
- **Password:** Silné heslo (doporučuji uložit do 1Password/LastPass)

### 1.3 Ověř email
- GitHub ti pošle email
- Klikni na ověřovací link

✅ **HOTOVO - Účet vytvořen!**

---

## 🔑 KROK 2: Vytvoření GitHub Personal Access Token

(Tvůj starý token už vypršel, takže musíš vytvořit nový)

### 2.1 Jdi do Settings
- Klikni na svoji **profilovou fotku** vpravo nahoře
- Klikni **"Settings"**

### 2.2 Developer settings
- Scrolluj úplně dolů v levém menu
- Klikni **"Developer settings"**

### 2.3 Personal access tokens
- Klikni **"Personal access tokens"**
- Klikni **"Tokens (classic)"**

### 2.4 Generate new token
- Klikni **"Generate new token"** → **"Generate new token (classic)"**
- Možná tě požádá o heslo - zadej ho

### 2.5 Nastav token
- **Note:** `Pojistná Pomoc Deployment Token`
- **Expiration:** `No expiration` (nebo 90 days pokud preferuješ)
- **Select scopes:** Zaškrtni:
  - ✅ `repo` (celá sekce)
  - ✅ `workflow`
  - ✅ `admin:repo_hook`

### 2.6 Generate token
- Scrolluj dolů a klikni **"Generate token"**

### 2.7 DŮLEŽITÉ - Zkopíruj token
- Uvidíš něco jako: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- **ZKOPÍRUJ A ULOŽ SI HO!** (ukáže se jen jednou)
- Ulož do textového souboru

✅ **HOTOVO - Token vytvořen!**

---

## 📁 KROK 3: Vytvoření GitHub Repository

### 3.1 Nový repository
- Jdi na: https://github.com/new
- Nebo klikni na `+` vpravo nahoře → **"New repository"**

### 3.2 Vyplň detaily
- **Repository name:** `pojistna-pomoc`
- **Description:** `🏥 AI-powered insurance claims assistant for Czech Republic`
- **Visibility:**
  - **Private** (doporučuji na začátek - jen ty to vidíš)
  - nebo **Public** (kdokoliv může vidět kód)
- **NE**zaškrtávej "Initialize this repository with:"
  - Žádný README
  - Žádný .gitignore
  - Žádnou License
  - (už to máme v projektu!)

### 3.3 Create repository
- Klikni **"Create repository"**

### 3.4 Uvidíš instrukce
- GitHub ti ukáže stránku s instrukcemi
- **NECH JI OTEVŘENOU** - budeš potřebovat URL

✅ **HOTOVO - Repository vytvořen!**

---

## 💻 KROK 4: Nahrání kódu z tvého počítače

### Varianta A: Mám Terminal/Příkazový řádek (Mac/Linux/Windows)

#### 4.1 Otevři Terminal
- **Mac:** Spotlight (Cmd+Space) → "Terminal"
- **Windows:** Start → "cmd" nebo "PowerShell"

#### 4.2 Jdi do projektu
```bash
cd <project-root>
```

#### 4.3 Zkontroluj git status
```bash
git status
```
Měl bys vidět: `On branch main` a nějaké commity.

#### 4.4 Přidej GitHub jako remote
Zkopíruj svůj **GitHub username** a **nový token** (z kroku 2.7):

```bash
git remote add origin https://[TOKEN]@github.com/[USERNAME]/pojistna-pomoc.git
```

**Příklad** (doplň své hodnoty):
```bash
git remote add origin https://ghp_xxxYOURTOKENxxx@github.com/radim-prog/pojistna-pomoc.git
```

#### 4.5 Push na GitHub
```bash
git push -u origin main
```

Měl bys vidět:
```
Enumerating objects: 150, done.
Counting objects: 100% (150/150), done.
...
To https://github.com/radim-prog/pojistna-pomoc.git
 * [new branch]      main -> main
```

✅ **HOTOVO - Kód nahrán!**

---

### Varianta B: Nemám/nechci používat Terminal

#### 4.1 Stáhni GitHub Desktop
```
https://desktop.github.com/
```

#### 4.2 Nainstaluj a přihlas se
- Otevři GitHub Desktop
- Přihlas se svým GitHub účtem

#### 4.3 Add existing repository
- File → Add Local Repository
- Choose: `<project-root>`
- Klikni "Add repository"

#### 4.4 Publish repository
- Klikni na "Publish repository" nahoře
- **Name:** pojistna-pomoc
- **Description:** AI-powered insurance claims assistant
- Vyber Private nebo Public
- Klikni "Publish repository"

✅ **HOTOVO - Kód nahrán!**

---

## ✅ KROK 5: Ověření že to funguje

### 5.1 Jdi na GitHub
```
https://github.com/[USERNAME]/pojistna-pomoc
```

### 5.2 Měl bys vidět:
- ✅ Všechny složky: `app/`, `components/`, `docs/`, `legal/`, atd.
- ✅ Soubory: `README.md`, `HANDOFF.md`, `package.json`
- ✅ 3 commity (nebo víc)
- ✅ Zelený badge "main" vpravo nahoře

### 5.3 Zkontroluj README
- Klikni na `README.md`
- Měl bys vidět pěkně naformátovaný README s:
  - Status: PRODUCTION READY
  - Features list
  - Tech stack
  - Live demo link

✅ **PERFEKTNÍ - GitHub je hotový!**

---

## 🎉 CO MÁŠ TEĎ HOTOVÉ

### ✅ GitHub účet vytvořen
- Username: [tvoje]
- Token: uložený v textovém souboru

### ✅ Repository vytvořen
- URL: `https://github.com/[username]/pojistna-pomoc`
- Visibility: Private nebo Public

### ✅ Kód nahrán
- 120+ souborů
- 38,570+ řádků kódu
- Všechna dokumentace
- 3+ commity

---

## 📨 CO MÍ POŠLI

Pošli mi **URL tvého GitHub repository**:

```
https://github.com/radim-prog/pojistna-pomoc
```

(Nahraď `radim-prog` svým username)

**S tím můžu pak propojit Vercel a každá změna v kódu se automaticky deployuje!** 🚀

---

## 🔄 Co se stane dál (automaticky)

1. **Propojím GitHub s Vercel** (dělám já)
2. **Každý git push automaticky deployuje** novou verzi
3. **Pull requesty mají preview URL** - můžeš testovat před mergem
4. **GitHub Actions můžou běžet testy** (později)

---

## ❓ Troubleshooting

### "git: command not found"
- **Mac:** Nainstaluj Xcode Command Line Tools:
  ```bash
  xcode-select --install
  ```
- **Windows:** Stáhni Git: https://git-scm.com/download/win
- Nebo použij **Variantu B** (GitHub Desktop)

### "remote origin already exists"
```bash
git remote remove origin
# Pak znovu přidej (krok 4.4)
```

### "Authentication failed"
- Zkontroluj že token je správně zkopírovaný
- Token musí začínat `ghp_`
- Zkus vygenerovat nový token (krok 2)

### "Repository not found"
- Zkontroluj URL - username se musí shodovat
- Zkontroluj že repository existuje na GitHubu

---

## 🔐 BEZPEČNOST

### ⚠️ NIKDY necommituj:
- ❌ `.env.local` - už je v `.gitignore` (v pořádku)
- ❌ Firebase service account JSON
- ❌ API keys přímo v kódu
- ❌ Hesla

### ✅ Všechny secrets jdou přes:
- Vercel Environment Variables (tam je nastavím)
- `.env.local` lokálně (není v gitu)

---

**Jakmile mi pošleš GitHub URL, propojím to s Vercel a bude to živě!** 🎉
