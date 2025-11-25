# ⚡ QUICK SETUP - 5 MINUT

**Rychlý setup pro okamžité spuštění aplikace.**

---

## 🎯 MÁME PŘIPRAVENO:

✅ Kód na GitHubu (30 commitů)
✅ Supabase credentials v `.env.local`
✅ Schema v `supabase/schema.sql`
✅ Seed data v `supabase/seed.sql`
✅ Všechny API endpointy
✅ Upload funkcionalita
✅ Client + Accountant dashboardy

**ZBÝVÁ JEN SUPABASE SETUP (5 minut):**

---

## 📋 CHECKLIST (5 KROKŮ):

### ✅ 1. SPUSTIT SCHEMA (1 min)

```bash
1. Otevři: https://supabase.com/dashboard/project/ybcubkuskirbspyoxpak/sql/new
2. Zkopíruj CELÝ soubor: supabase/schema.sql
3. Vlož do SQL Editoru
4. Klikni "RUN" (nebo Ctrl+Enter)
5. Počkej 5-10 sekund
```

**Výsledek:** 9 tabulek vytvořeno (users, companies, monthly_closures, documents, atd.)

---

### ✅ 2. VYTVOŘIT STORAGE BUCKET (30 sec)

```bash
1. Otevři: https://supabase.com/dashboard/project/ybcubkuskirbspyoxpak/storage/buckets
2. Klikni "New bucket"
3. Name: documents
4. Public: ❌ NE (private!)
5. File size limit: 10 MB
6. Allowed MIME types: image/jpeg, image/png, application/pdf
7. Klikni "Create bucket"
```

---

### ✅ 3. STORAGE RLS POLICIES (1 min)

```bash
1. Otevři: https://supabase.com/dashboard/project/ybcubkuskirbspyoxpak/sql/new
2. Zkopíruj a spusť:
```

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

### ✅ 4. VYTVOŘIT TESTOVACÍ UŽIVATELE (1 min)

```bash
1. Otevři: https://supabase.com/dashboard/project/ybcubkuskirbspyoxpak/auth/users
2. Klikni "Add user" → "Create new user"
```

**User 1 (Client):**
- Email: `karel@example.com`
- Password: `Test123456!`
- Auto-confirm: ✅ **ANO**
- Klikni "Create user"
- **ZKOPÍRUJ UUID** (např. `a1b2c3d4-...`)

**User 2 (Accountant):**
- Email: `jana@ucetni.cz`
- Password: `Test123456!`
- Auto-confirm: ✅ **ANO**
- Klikni "Create user"
- **ZKOPÍRUJ UUID** (např. `e5f6g7h8-...`)

---

### ✅ 5. SPUSTIT SEED DATA (1 min)

```bash
1. Otevři soubor: supabase/seed.sql v editoru
2. Najdi řádky 17-18:
```

```sql
client_uuid UUID := '550e8400-...'; -- REPLACE!
accountant_uuid UUID := '550e8400-...'; -- REPLACE!
```

```bash
3. Nahraď UUID z kroku 4
4. Otevři: https://supabase.com/dashboard/project/ybcubkuskirbspyoxpak/sql/new
5. Zkopíruj CELÝ seed.sql
6. Klikni "RUN"
```

**Výsledek:** 2 users + 5 companies + 60 monthly_closures vytvořeno

---

## ✅ 6. TEST (30 sec)

```bash
cd ~/Projects/UcetniWebApp
npm run dev
```

**Otevři:** http://localhost:3000

**Login jako CLIENT:**
- Email: `karel@example.com`
- Password: `Test123456!`
- → Měl bys vidět 5 firem v dashboardu

**Login jako ACCOUNTANT:**
- Logout
- Email: `jana@ucetni.cz`
- Password: `Test123456!`
- → Měl bys vidět Master Matrix (5 klientů × 12 měsíců)

---

## 🎉 HOTOVO!

Pokud vše funguje:
- ✅ Vidíš dashboard s daty
- ✅ Master Matrix zobrazuje 5 klientů
- ✅ Můžeš kliknout na "Nahrát dokumenty"

**Co teď:**
1. Vyzkoušej upload dokumentu
2. Jako accountant approve/reject dokument
3. Deploy na Vercel (5 min)

---

## 🆘 TROUBLESHOOTING

**Problém: "Failed to fetch companies"**
→ Zkontroluj že seed.sql proběhlo úspěšně (krok 5)

**Problém: "Upload failed 403"**
→ Zkontroluj že Storage bucket existuje (krok 2)
→ Zkontroluj že RLS policies jsou nastavené (krok 3)

**Problém: "Master Matrix prázdná"**
→ Zkontroluj že UUID v seed.sql jsou správné (krok 5)
→ Zkontroluj že accountant má assigned_accountant_id v companies

---

**📖 Detailní návod:** SUPABASE_SETUP.md
