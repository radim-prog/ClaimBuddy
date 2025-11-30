# 🎯 Demo přístupy - Účetní OS

## Rychlý přístup (jedním kliknutím)

Na přihlašovací stránce (`/auth/login`) jsou 2 demo tlačítka:

### 👤 Klient - Karel Novák
- **Tlačítko:** Modré tlačítko "Klient"
- **Přístup:** `/client/dashboard`
- **Vidí:**
  - Dashboard s přehledem svých firem
  - 3 firmy (ABC s.r.o., XYZ OSVČ, DEF s.r.o.)
  - Chybějící dokumenty pro aktuální měsíc
  - Možnost nahrát dokumenty
  - Finanční přehledy

### 👔 Účetní - Jana Svobodová
- **Tlačítko:** Fialové tlačítko "Účetní"
- **Přístup:** `/accountant/dashboard`
- **Vidí:**
  - Master Matice (15 firem × 12 měsíců = 180 záznamů)
  - Statistiky (missing/uploaded/approved dokumenty)
  - Seznam klientů
  - Úkolový systém
  - Detail každé firmy s uzávěrkami

## 🔐 Administrátorský přístup

**V současné demo verzi není administrátorský přístup oddělen.**

Podle kódu v `app/auth/login/actions.ts:64`:
```typescript
if (role === 'accountant' || role === 'admin') {
  redirect('/accountant/dashboard')
}
```

**Admin role** vede na stejný dashboard jako účetní. Pro budoucí rozlišení:
- Admin by měl mít navíc:
  - Správu uživatelů
  - Přiřazování účetních ke klientům
  - Systémové nastavení
  - Audit log
  - Fakturace

## 📊 Mock data v demo režimu

### Firmy
- **15 mock firem** (company-1 až company-15)
- Různé právní formy: s.r.o., OSVČ
- Plátci i neplátci DPH
- Města: Praha, Brno, Ostrava, Plzeň, Liberec, atd.

### Měsíční uzávěrky
- **180 záznamů** (15 firem × 12 měsíců)
- Období: 2025-01 až 2025-12
- Statusy:
  - ✅ `approved` - schváleno (leden-březen)
  - ⚠️ `uploaded` - nahráno (duben-červen)
  - ❌ `missing` - chybí (červenec-prosinec, závisí na firmě)

### Dokumenty
- **30 mock dokumentů**
- Typy:
  - `receipt` - účtenky
  - `bank_statement` - výpisy z účtu
  - `expense_invoice` - výdajové faktury
  - `income_invoice` - příjmové faktury
- Rozprostřeny mezi prvních 5 firem
- Období: leden-červen 2025

## 🚀 Supabase přihlášení (reálné)

Pokud potřebujete použít reálný Supabase login:
1. Vyplňte email a heslo
2. Klikněte "Přihlásit se"
3. Systém ověří přes Supabase Auth
4. Podle role v DB tabulce `users` přesměruje:
   - `role: 'client'` → `/client/dashboard`
   - `role: 'accountant'` nebo `'admin'` → `/accountant/dashboard`

## 🎨 Barvy tlačítek (opraveno)

### Landing page (`/`)
- **Přihlásit se:** Modrý gradient (blue-600 → purple-600), bílý text, shadow
- **Registrovat:** Outline s blue-600 borderem, blue-700 text

### Login page (`/auth/login`)
- **Klient:** Modré outline tlačítko, hover modrý background
- **Účetní:** Fialové outline tlačítko, hover fialový background
- **Přihlásit se (Supabase):** Modrý gradient, bílý text

Všechna tlačítka mají:
- `font-semibold` - tučné písmo
- `shadow-lg` - stín pro lepší viditelnost
- `transition-all` - plynulé animace
- `hover:` efekty pro interaktivitu

## 📝 Poznámky

1. **Demo režim = žádná autentizace**
   - Tlačítka "Klient" a "Účetní" přímo přesměrují
   - Žádné kontroly hesla
   - Ideální pro testování UI

2. **API endpointy v demo módu**
   - Všechny API routes vrací mock data
   - Upload souborů se simuluje (nezapisuje na disk)
   - Approve/Reject dokumentů jen loguje do console

3. **Pro produkci**
   - Vypnout demo tlačítka
   - Aktivovat Supabase Auth middleware
   - Nahradit mock data reálnými DB queries
