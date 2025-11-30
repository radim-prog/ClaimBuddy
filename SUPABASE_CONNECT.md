# 🔗 Připojení Supabase - 5 minut

## ✅ Co už MÁME:
- ✅ Supabase projekt vytvořený
- ✅ Credentials v `.env.local`
- ✅ Aktualizované SQL schema (3 kategorie dokladů)

## 📋 CO ZBÝVÁ (5 kroků):

---

### 1️⃣ Nahrát Database Schema (2 min)

**Otevři SQL Editor:**
https://supabase.com/dashboard/project/ybcubkuskirbspyoxpak/sql/new

**Zkopíruj CELÝ soubor `supabase/schema.sql`:**
- Otevři `supabase/schema.sql` v editoru
- Ctrl+A (Select All)
- Ctrl+C (Copy)

**Vlož do SQL Editoru:**
- Ctrl+V do Supabase SQL Editoru
- Klikni **"RUN"** (nebo Ctrl+Enter)
- Počkej 5-10 sekund

**✅ Výsledek:** Vytvoří se 9 tabulek:
- `users`
- `companies`
- `monthly_closures` (s 3 kategoriemi!)
- `documents`
- `invoices`
- `tasks`
- `chats`
- `chat_messages`
- `whatsapp_messages`

---

### 2️⃣ Vytvořit Storage Bucket (30 sec)

**Otevři Storage:**
https://supabase.com/dashboard/project/ybcubkuskirbspyoxpak/storage/buckets

**Klikni "New bucket":**
- Name: `documents`
- Public: ❌ **NE** (private!)
- File size limit: `10 MB`
- Allowed MIME types: `image/jpeg, image/png, application/pdf`
- **"Create bucket"**

---

### 3️⃣ Storage Security Policies (1 min)

**Otevři SQL Editor znovu:**
https://supabase.com/dashboard/project/ybcubkuskirbspyoxpak/sql/new

**Zkopíruj a spusť:**

```sql
-- Policy 1: Upload
CREATE POLICY "Clients can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' AND
  auth.uid()::text = split_part(name, '/', 1)
);

-- Policy 2: View
CREATE POLICY "Users can view own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id::text = split_part(name, '/', 1)
    AND (c.owner_id = auth.uid() OR c.assigned_accountant_id = auth.uid())
  )
);

-- Policy 3: Delete
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

---

### 4️⃣ Vytvořit Test Uživatele (1 min)

**Otevři Auth:**
https://supabase.com/dashboard/project/ybcubkuskirbspyoxpak/auth/users

**Vytvoř 2 uživatele:**

**User 1 - Client:**
- Klikni "Add user" → "Create new user"
- Email: `karel@example.com`
- Password: `Test123456!`
- Auto Confirm Email: ✅ **ANO**
- "Create user"
- **➡️ ZKOPÍRUJ UUID** (např. `a1b2c3d4-e5f6-...`)

**User 2 - Accountant:**
- Stejný postup
- Email: `jana@ucetni.cz`
- Password: `Test123456!`
- Auto Confirm Email: ✅ **ANO**
- "Create user"
- **➡️ ZKOPÍRUJ UUID** (např. `x9y8z7w6-...`)

---

### 5️⃣ Seed Data (1 min)

**Otevři `supabase/seed.sql` v editoru**

**Najdi řádky 17-18:**
```sql
client_uuid UUID := '550e8400-...'; -- REPLACE!
accountant_uuid UUID := '550e8400-...'; -- REPLACE!
```

**Nahraď UUID z kroku 4:**
```sql
client_uuid UUID := 'a1b2c3d4-e5f6-...'; -- Karel UUID z kroku 4
accountant_uuid UUID := 'x9y8z7w6-...'; -- Jana UUID z kroku 4
```

**Ulož soubor a zkopíruj CELÝ obsah**

**Otevři SQL Editor:**
https://supabase.com/dashboard/project/ybcubkuskirbspyoxpak/sql/new

**Vlož a spusť:**
- Ctrl+V
- Klikni **"RUN"**

**✅ Výsledek:** Vytvoří se:
- 2 users v tabulce `users`
- 5 companies
- 60 monthly_closures (5 firem × 12 měsíců)
- Testovací data

---

## ✅ 6️⃣ TEST

**Spusť aplikaci:**
```bash
cd ~/Projects/UcetniWebApp
npm run dev
```

**Otevři:** http://localhost:3000

**Login jako CLIENT:**
- Email: `karel@example.com`
- Password: `Test123456!`
- ✅ Měl bys vidět 5 firem

**Login jako ACCOUNTANT:**
- Email: `jana@ucetni.cz`
- Password: `Test123456!`
- ✅ Měl bys vidět Master Matrix (5 klientů × 12 měsíců)
- ✅ Barevné kódy: Zelená (Jan-Bře), Žlutá (Dub-Čer), Červená (Čec-Pro)

---

## 🎉 HOTOVO!

Teď máš:
- ✅ Funkční Supabase databázi
- ✅ 3 kategorie dokladů (Výpis, Nákladové, Příjmové)
- ✅ Authentication ready
- ✅ Storage pro dokumenty
- ✅ Testovací data

**Co dál:**
1. Vyzkoušej upload dokumentu
2. Deploy na Vercel (přidej env vars)
3. Invite skutečné klienty

---

## 🆘 TROUBLESHOOTING

**"Failed to fetch companies"**
→ Zkontroluj že seed.sql proběhlo s správnými UUID (krok 5)

**"Upload failed 403"**
→ Zkontroluj že Storage bucket "documents" existuje (krok 2)
→ Zkontroluj že Storage policies jsou nastavené (krok 3)

**"Master Matrix prázdná"**
→ Zkontroluj že accountant UUID je správně v seed.sql
→ Zkontroluj že companies mají `assigned_accountant_id`
