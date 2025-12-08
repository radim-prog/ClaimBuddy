# Changelog

Všechny důležité změny v tomto projektu budou zdokumentovány v tomto souboru.

---

## [2025-12-08] - User Tracking ve Fakturaci

### ✨ Přidáno

#### Statistiky podle účetních v modulu fakturace
- **Nová sekce "Statistiky podle účetních"** na stránce `/accountant/invoicing`
  - Zobrazení pro každého účetního: počet projektů, odpracované hodiny, vyfakturovaná částka, průměrná sazba
  - Celkové součty ve footeru tabulky
  - Automatické přepočítávání podle filtrů (období, klient, status)

#### Rozšíření datového modelu
- **lib/invoicing-mock-data.ts**:
  - Přidáno pole `userId` do interface `TimeEntry`
  - Nový interface `UserStats` pro statistiky uživatelů
  - Nová funkce `getUserStats()` - výpočet statistik per uživatel
  - Doplněno `userId` do všech časových záznamů v mock datech

#### Rozšíření týmu
- **lib/mock-data.ts**:
  - Přidáni 2 noví účetní: Petr Novotný a Marie Dvořáková
  - Celkem 4 mock uživatelé pro realističtější demo

### 🔧 Opraveno

#### Nastavení - Unified Navigation
- **app/accountant/settings/layout.tsx** (NOVÝ):
  - Jednotná navigace napříč všemi stránkami nastavení
  - Tabs: Obecné, Firma, Ceník a Sazby, Správa uživatelů
  - Automatické skrývání záložky "Správa uživatelů" pro non-admin uživatele

#### Nastavení - Konzistence šířky stránky
- **app/accountant/settings/pricing/page.tsx**:
  - Odstraněn `max-w-4xl` wrapper pro konzistentní šířku

- **app/accountant/settings/page.tsx**:
  - Odebrána duplikovaná navigace (nyní v layout)

#### Nové stránky nastavení
- **app/accountant/settings/company/page.tsx** (NOVÝ):
  - Správa informací o firmě centrálně
  - Sekce: Základní info, Kontakty, Bankovní účet, Logo/Podpis

- **app/accountant/settings/users/page.tsx** (NOVÝ):
  - Správa uživatelů - vytvoření, editace, mazání
  - Role management (admin, accountant, assistant)
  - Supabase Auth integrace

### 🎨 UX Vylepšení

#### Úkoly - GTD metodika a zobrazení
- **app/accountant/tasks/page.tsx**:
  - GTD info box přesunut nahoru (z paty stránky)
  - Přidány 3 režimy zobrazení: Karty, Seznam, Kanban
  - View mode selector s přepínačem

#### Fakturace - Vyjasnění účelu stránky
- **app/accountant/invoicing/page.tsx**:
  - Změna titulku: "Měsíční fakturace" → "Přehled fakturace"
  - Přidán subtitle vysvětlující, že faktury se vystavují jinde
  - Nový toggle "Jen nevyfakturované" / "Zobrazit všechno"
  - Aktualizovaný info box s workflow vysvětlením

### 🗑️ Odstraněno

- Testovací utility scripty: `test-*.js`, `create-*.js`, `fix-sync.js`, `sync-user.js`, etc.
- Zastaralé soubory: `app/accountant/clients/[companyId]/page-old.tsx`
- Test screenshots: `test-screenshots/`

### 📊 Souhrn změn

**Soubory upraveny:**
- `app/accountant/invoicing/page.tsx` - přidány statistiky uživatelů
- `lib/invoicing-mock-data.ts` - user tracking a statistics
- `lib/mock-data.ts` - 2 noví účetní
- `app/accountant/tasks/page.tsx` - GTD nahoru + view modes
- `app/accountant/settings/*` - unified navigation

**Soubory vytvořeny:**
- `app/accountant/settings/layout.tsx` - unified settings nav
- `app/accountant/settings/company/page.tsx` - company settings
- `app/accountant/settings/users/page.tsx` - user management
- `CHANGELOG.md` - tento soubor

**Soubory smazány:**
- Všechny testovací a utility scripty
- Zastaralé backup soubory

---

## Předchozí verze

Pro historii starších verzí viz git commit history.

**Repository:** https://github.com/radim-prog/UcetniWebApp
**Branch:** dev
**Lokální cesta:** `/Users/Radim/Projects/UcetniWebApp`
