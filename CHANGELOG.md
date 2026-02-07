# Changelog

Všechny důležité změny v tomto projektu budou zdokumentovány v tomto souboru.

---

## [2025-12-27] - Kompletní Fakturační Systém

### ✨ Přidáno

#### Fáze 1: Rozšíření Task modelu
- **lib/mock-data.ts**:
  - Nový typ `BillingType = 'tariff' | 'extra' | 'free'`
  - Přidáno `billing_type` do Task interface
  - Přidáno `invoiced`, `invoiced_at`, `invoice_id` pro sledování fakturace

- **components/tasks/gtd-wizard.tsx**:
  - Přidán výběr billing type v Step 5
  - Grid s možnostmi: Paušál / Zvlášť / Zdarma

- **components/tasks/task-creation-wizard.tsx**:
  - Přidána sekce fakturace s přepínačem billable/nebillable
  - Výběr typu fakturace a hodinové sazby

#### Fáze 2: Invoice entita
- **lib/mock-data.ts**:
  - Nový interface `Invoice` s kompletní strukturou
  - Typy `InvoiceStatus` a `InvoiceType`
  - Helper funkce: `generateInvoiceNumber`, `getUninvoicedTasksForCompany`, `getBillableTasksByCompany`, `createInvoiceFromTasks`, `markTasksAsInvoiced`
  - Mock data pro faktury (accountant_to_client i client_to_customer)

#### Fáze 3: Funkční UI invoicing stránky
- **app/accountant/invoicing/page.tsx**:
  - Propojení s novým Invoice systémem
  - Handlery pro vytvoření faktury, označení jako odesláno/zaplaceno
  - Tabulka faktur s akčními tlačítky

#### Fáze 4: mPohoda API integrace
- **lib/mpohoda-client.ts** (NOVÝ):
  - MPohodaClient třída pro REST API
  - Metody: createInvoice, getContacts, getBankAccounts, testConnection, exportInvoice
  - Konfigurace přes env proměnné

- **app/api/pohoda/export/route.ts** (NOVÝ):
  - POST endpoint pro export faktury do mPohoda
  - GET endpoint pro test připojení

#### Fáze 5: Pohoda XML export
- **lib/pohoda-xml.ts** (NOVÝ):
  - XML generátor podle Pohoda mXML 2.0 specifikace
  - Funkce: generateInvoiceXml, generateBatchXml, validatePohodaXml, createExportZipContent
  - Správné namespaces a formátování

- **app/api/invoices/export-xml/route.ts** (NOVÝ):
  - POST endpoint pro export faktur do XML
  - GET endpoint pro seznam exportovatelných faktur
  - Podpora single i batch exportu

#### Fáze 6: Klientský portál pro fakturaci
- **app/client/invoices/page.tsx** (NOVÝ):
  - Seznam faktur klienta (typ client_to_customer)
  - Filtry a řazení
  - Statistiky (celkem, koncepty, neuhrazeno, uhrazeno)
  - XML download tlačítko

- **app/client/invoices/new/page.tsx** (NOVÝ):
  - Formulář pro vytvoření nové faktury
  - Odběratel (zákazník) - kompletní údaje
  - Položky faktury s DPH
  - Automatický výpočet součtů
  - Export do XML pro Pohodu

- **app/client/layout.tsx**:
  - Přidána navigace "Faktury" s ikonou Receipt

### 📁 Struktura systému

```
Fakturační systém:
├── Větev 1: Účetní → Klient
│   ├── mPohoda REST API
│   ├── Přímé napojení na naši Pohodu
│   └── Automatická synchronizace
│
└── Větev 2: Klient → Zákazník
    ├── Pohoda XML export (mXML 2.0)
    ├── Univerzální kompatibilita
    └── Download ZIP s XML soubory
```

### 🔧 Technické detaily
- XML kódování: Windows-1250 (Pohoda standard)
- Namespaces: dat, inv, typ
- Validace XML před exportem
- Podpora batch exportu více faktur

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
