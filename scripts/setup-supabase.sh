#!/bin/bash

# ============================================
# SUPABASE AUTO-SETUP SCRIPT
# ============================================
# Tento script spustí všechny SQL příkazy v Supabase
# ============================================

set -e

SUPABASE_URL="${SUPABASE_URL:-https://ybcubkuskirbspyoxpak.supabase.co}"
SERVICE_KEY="${SUPABASE_SERVICE_ROLE_KEY:?SUPABASE_SERVICE_ROLE_KEY env var is required}"

echo "🚀 Supabase Auto-Setup"
echo "======================="
echo ""

# Funkce pro spuštění SQL
run_sql() {
  local sql="$1"
  local description="$2"

  echo "⏳ $description..."

  response=$(curl -s -X POST \
    "$SUPABASE_URL/rest/v1/rpc" \
    -H "apikey: $SERVICE_KEY" \
    -H "Authorization: Bearer $SERVICE_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"$sql\"}")

  if [ $? -eq 0 ]; then
    echo "✅ $description - HOTOVO"
  else
    echo "❌ $description - CHYBA"
    echo "Response: $response"
  fi
}

echo "📋 POZNÁMKA: Tento script vyžaduje manuální kroky v Supabase UI:"
echo ""
echo "1️⃣ SCHEMA + TABLES:"
echo "   → Otevři: https://supabase.com/dashboard/project/ybcubkuskirbspyoxpak/sql/new"
echo "   → Zkopíruj celý obsah: supabase/schema.sql"
echo "   → Klikni RUN"
echo ""

echo "2️⃣ STORAGE BUCKET:"
echo "   → Otevři: https://supabase.com/dashboard/project/ybcubkuskirbspyoxpak/storage/buckets"
echo "   → New bucket → 'documents' (private)"
echo "   → File size limit: 10 MB"
echo ""

echo "3️⃣ TESTOVACÍ UŽIVATELÉ:"
echo "   → Otevři: https://supabase.com/dashboard/project/ybcubkuskirbspyoxpak/auth/users"
echo "   → Add user:"
echo "     - karel@example.com / Test123456!"
echo "     - jana@ucetni.cz / Test123456!"
echo "   → Auto-confirm: YES"
echo "   → ZKOPÍRUJ UUID obou uživatelů!"
echo ""

echo "4️⃣ SEED DATA:"
echo "   → Edituj supabase/seed.sql"
echo "   → Nahraď UUID na řádcích 17-18"
echo "   → Otevři: https://supabase.com/dashboard/project/ybcubkuskirbspyoxpak/sql/new"
echo "   → Zkopíruj celý obsah seed.sql"
echo "   → Klikni RUN"
echo ""

echo "5️⃣ STORAGE RLS POLICIES:"
cat << 'EOF'

-- Spusť v SQL Editoru:
CREATE POLICY "Clients can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' AND
  auth.uid()::text = split_part(name, '/', 1)
);

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

CREATE POLICY "Accountants can delete documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.role IN ('accountant', 'admin')
  )
);
EOF

echo ""
echo "✅ SETUP INSTRUKCE zobrazeny!"
echo ""
echo "📖 Detailní návod: SUPABASE_SETUP.md"
echo ""
