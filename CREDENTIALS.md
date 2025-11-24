# 🔐 CREDENTIALS - Všechny přístupové údaje

⚠️ **VAROVÁNÍ:** Tento soubor obsahuje SKUTEČNÉ credentials!
- Pokud je repo PUBLIC → OKAMŽITĚ smazat tyto hodnoty!
- Pokud je repo PRIVATE → OK, ale jen ty máš přístup

---

## ✅ SUPABASE

```env
NEXT_PUBLIC_SUPABASE_URL=https://ybcubkuskirbspyoxpak.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliY3Via3Vza2lyYnNweW94cGFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MTcxNTgsImV4cCI6MjA3OTQ5MzE1OH0.mredIxLwVd61LCpxdIxRSmmJFVO5vTYbHR-_zMGGVTY
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliY3Via3Vza2lyYnNweW94cGFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzkxNzE1OCwiZXhwIjoyMDc5NDkzMTU4fQ.zVg4FIzm-DT3bRZZMXHF5a1647MGwFaGg-SLEEq5880
```

**Database Password (nepoužíváme):**
```
YZZFYgFizZRArMyP
```

**Status:** ✅ Vyplněno v .env.local

---

## 🤖 GOOGLE GEMINI AI (TODO - MODUL F)

```env
GEMINI_API_KEY=your-gemini-api-key
```

**Kde získat:**
1. https://aistudio.google.com/app/apikey
2. "Create API Key"

**Status:** ⏳ Vyplnit před MODUL F (OCR)

---

## 📁 GOOGLE DRIVE (TODO - MODUL E)

```env
GOOGLE_DRIVE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_DRIVE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key\n-----END PRIVATE KEY-----\n"
```

**Kde získat:**
1. https://console.cloud.google.com
2. IAM & Admin → Service Accounts
3. Create Service Account → Create Key (JSON)

**Status:** ⏳ Vyplnit před MODUL E (Upload)

---

## 📱 TWILIO SMS (TODO - MODUL G)

```env
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+420...
```

**Kde získat:**
1. https://console.twilio.com
2. Account → Keys & Credentials

**Status:** ⏳ Vyplnit před MODUL G (Urgování)

---

## 📧 SENDGRID Email (TODO - MODUL G)

```env
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

**Kde získat:**
1. https://app.sendgrid.com
2. Settings → API Keys

**Status:** ⏳ Vyplnit před MODUL G (Urgování)

---

## 💬 WHATSAPP (TODO - MODUL I)

```env
WHATSAPP_TOKEN=your-whatsapp-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_VERIFY_TOKEN=your-verify-token
```

**Kde získat:**
1. https://developers.facebook.com
2. WhatsApp → API Setup

**Status:** ⏳ Vyplnit před MODUL I (WhatsApp webhook)

---

## 🔒 DŮLEŽITÉ

1. **Tento soubor JE na GitHubu** ← Všechny hodnoty viditelné!
2. **Pokud repo je PUBLIC** → Někdo může zneužít credentials!
3. **Doporučení:** Repo nastavit na PRIVATE

---

**Last updated:** 2025-01-24 (po MODUL A2)
**Supabase credentials:** ✅ Kompletní
**Ostatní:** ⏳ Vyplnit postupně podle potřeby
