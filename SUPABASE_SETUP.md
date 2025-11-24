# 🔧 SUPABASE SETUP - Krok za krokem

**Tento soubor obsahuje vše co musíš udělat v Supabase Dashboard.**

---

## 1️⃣ VYTVOŘIT STORAGE BUCKET (KRITICKÉ!)

### Postup:
1. Otevři Supabase Dashboard: https://supabase.com/dashboard
2. Vyber svůj projekt: `ybcubkuskirbspyoxpak`
3. V levém menu klikni na **Storage**
4. Klikni na **"New bucket"**
5. Nastav:
   - **Name:** `documents`
   - **Public bucket:** ❌ **NE** (private bucket)
   - **File size limit:** `10 MB`
   - **Allowed MIME types:** `image/jpeg, image/png, application/pdf`
6. Klikni **"Create bucket"**

---

## 2️⃣ NASTAVIT RLS POLICIES PRO STORAGE

V SQL Editor (Storage → Policies) spusť:

```sql
-- Policy 1: Clients can upload to their own companies
CREATE POLICY "Clients can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' AND
  (auth.uid())::text = (storage.foldername(name))[1]
);

-- Policy 2: Users can view documents they own or are assigned to
CREATE POLICY "Users can view own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id::text = (storage.foldername(name))[1]
    AND (c.owner_id = auth.uid() OR c.assigned_accountant_id = auth.uid())
  )
);

-- Policy 3: Accountants can delete documents
CREATE POLICY "Accountants can delete documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.role IN ('accountant', 'admin')
  )
);
```

**⚠️ POZOR:** Pokud policies failují, můžeš je nastavit i ručně v UI (Storage → documents → Policies).

---

## 3️⃣ VYTVOŘIT TESTOVACÍ UŽIVATELE

### Postup:
1. V Supabase Dashboard → **Authentication** → **Users**
2. Klikni **"Add user"** → **"Create new user"**

### User 1 (Client):
- **Email:** `karel@example.com`
- **Password:** `Test123456!`
- **Auto Confirm User:** ✅ **ANO**
- Klikni **"Create user"**
- **Zkopíruj UUID** (např. `550e8400-e29b-41d4-a716-446655440001`)

### User 2 (Accountant):
- **Email:** `jana@ucetni.cz`
- **Password:** `Test123456!`
- **Auto Confirm User:** ✅ **ANO**
- Klikni **"Create user"**
- **Zkopíruj UUID** (např. `550e8400-e29b-41d4-a716-446655440002`)

---

## 4️⃣ SPUSTIT SEED SCRIPT (MOCK DATA)

### Postup:
1. Otevři soubor `supabase/seed.sql` v editoru
2. **NAHRAĎ UUID:**
   ```sql
   client_uuid UUID := '550e8400-e29b-41d4-a716-446655440001'; -- REPLACE!
   accountant_uuid UUID := '550e8400-e29b-41d4-a716-446655440002'; -- REPLACE!
   ```
   Vlož skutečné UUID z kroku 3.

3. V Supabase Dashboard → **SQL Editor**
4. Klikni **"New query"**
5. **Zkopíruj celý obsah** `supabase/seed.sql`
6. Vlož do SQL Editoru
7. Klikni **"Run"** (Ctrl+Enter)

### Co se vytvoří:
- ✅ 2 uživatelé v tabulce `users` (Karel + Jana)
- ✅ 5 firem v tabulce `companies`
- ✅ 60 měsíčních uzávěrek v `monthly_closures` (5 firem × 12 měsíců)

---

## 5️⃣ OVĚŘIT DATA

Spusť v SQL Editoru:

```sql
-- Zkontroluj počty
SELECT 'Users' AS table_name, COUNT(*) FROM public.users
UNION ALL
SELECT 'Companies', COUNT(*) FROM public.companies
UNION ALL
SELECT 'Monthly Closures', COUNT(*) FROM public.monthly_closures;

-- Zkontroluj firmy
SELECT name, ico, vat_payer FROM public.companies;

-- Zkontroluj uzávěrky
SELECT
  c.name,
  mc.period,
  mc.bank_statement_status
FROM public.companies c
JOIN public.monthly_closures mc ON mc.company_id = c.id
ORDER BY c.name, mc.period
LIMIT 20;
```

**Očekávaný výsledek:**
- 2 users
- 5 companies
- 60 monthly_closures

---

## 6️⃣ TEST APLIKACE

### Postup:
1. Spusť dev server:
   ```bash
   cd ~/Projects/UcetniWebApp
   npm run dev
   ```

2. Otevři: http://localhost:3000

3. **Test jako Client:**
   - Login: `karel@example.com` / `Test123456!`
   - Měl bys vidět 5 firem na dashboardu
   - Zkus nahrát dokument přes `/client/upload`

4. **Test jako Accountant:**
   - Logout
   - Login: `jana@ucetni.cz` / `Test123456!`
   - Měl bys vidět Master Matrix s 5 klienty × 12 měsíců
   - Různé barvy podle statusu (zelená/žlutá/červená)

---

## ✅ HOTOVO!

Pokud vše funguje:
- ✅ Storage bucket vytvořen
- ✅ RLS policies nastaveny
- ✅ Testovací uživatelé vytvořeni
- ✅ Mock data v databázi
- ✅ Aplikace běží a zobrazuje data

**Můžeš pokračovat:**
- Implementovat detail klienta
- Přidat schvalování dokumentů
- Deploy na Vercel

---

## 🆘 TROUBLESHOOTING

### Problém: "Failed to fetch companies"
- ✅ Zkontroluj že uživatel má role v tabulce `users`
- ✅ Zkontroluj že firmy mají `owner_id` = UUID uživatele

### Problém: "Upload failed 403 Forbidden"
- ✅ Zkontroluj že Storage bucket `documents` existuje
- ✅ Zkontroluj že RLS policies jsou nastavené
- ✅ Zkontroluj že bucket je **private** (ne public)

### Problém: "Master Matrix je prázdná"
- ✅ Zkontroluj že accountant má `assigned_accountant_id` v companies
- ✅ Zkontroluj že monthly_closures mají správný `company_id`

---

**📝 Po dokončení setupu můžeš tento soubor smazat nebo archivovat.**
