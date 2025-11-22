# 🎫 GitHub Issues - Úče tní OS

Kompletní rozpis všech Issues pro implementaci projektu.

---

## 📦 Milestone 1: Infrastructure & Auth

### ✅ Issue #1: Database Schema & Migrations
**Labels:** `P0`, `infrastructure`, `database`
**Assignee:** Claude Code
**Status:** ✅ DONE

**Popis:**
- [x] Vytvořit Supabase SQL migrations
- [x] Tabulky: users, companies, monthly_closures, documents, invoices, tasks, chats, atd.
- [x] Indexy pro performance
- [x] Row Level Security (RLS) policies
- [x] Updated_at triggers

**Files:**
- `supabase/migrations/20250101000000_initial_schema.sql`
- `types/database.ts`

---

### 🔨 Issue #2: Autentizace (Login/Register)
**Labels:** `P0`, `auth`, `frontend`
**Assignee:** Antigravity
**Estimate:** 4h

**Zadání:**
Implementuj login a registraci s Supabase Auth.

**Tasks:**
- [ ] Vytvoř `app/(auth)/login/page.tsx`
- [ ] Vytvoř `app/(auth)/register/page.tsx`
- [ ] Email/Password login
- [ ] Google OAuth (optional)
- [ ] Redirect podle role:
  - `client` → `/client/dashboard`
  - `accountant` → `/accountant/dashboard`
- [ ] Error handling (neplatné credentials)

**API:**
```typescript
// app/(auth)/login/actions.ts
export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;

  // Get user role
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', data.user.id)
    .single();

  return { user: data.user, role: userData.role };
}
```

**UI:**
- Formulář s email + password
- "Zapomenuté heslo" link
- "Registrovat" link

---

### 🔨 Issue #3: Role-based Middleware
**Labels:** `P0`, `auth`, `backend`
**Assignee:** Antigravity
**Estimate:** 2h

**Zadání:**
Ochrana routes podle user role.

**Tasks:**
- [ ] Vytvoř `middleware.ts` v root
- [ ] Kontrola auth state (Supabase session)
- [ ] Redirect podle role:
  - `/client/*` → pouze client
  - `/accountant/*` → pouze accountant/admin
- [ ] Public routes: `/`, `/login`, `/register`

**Code:**
```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const { data: { session } } = await supabase.auth.getSession();

  // Public routes
  if (req.nextUrl.pathname === '/' || req.nextUrl.pathname.startsWith('/login')) {
    return res;
  }

  // Auth required
  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Role-based access
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (req.nextUrl.pathname.startsWith('/accountant') && user.role !== 'accountant') {
    return NextResponse.redirect(new URL('/client/dashboard', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

---

## 📦 Milestone 2: Client Dashboard

### 🔨 Issue #4: Client Dashboard Layout
**Labels:** `P0`, `frontend`, `client`
**Assignee:** Antigravity
**Estimate:** 3h

**Zadání:**
Vytvoř layout pro klientskou část s navigací.

**Tasks:**
- [ ] Vytvoř `app/(client)/layout.tsx`
- [ ] Sidebar s menu:
  - 📊 Dashboard (přehled)
  - 📄 Doklady (upload)
  - 📑 Faktury (vystavování)
  - 💰 Finanční přehled
  - 💬 Chat
- [ ] User avatar + dropdown (Odhlásit se)
- [ ] Responsive (mobile hamburger menu)

**UI Design:**
```
┌─────────────┬──────────────────────────┐
│   SIDEBAR   │      CONTENT             │
│             │                          │
│ Dashboard   │  <page.tsx content>      │
│ Doklady     │                          │
│ Faktury     │                          │
│ Přehled     │                          │
│ Chat        │                          │
│             │                          │
│  [Avatar]   │                          │
└─────────────┴──────────────────────────┘
```

---

### 🔨 Issue #5: Měsíční checklist (Client View)
**Labels:** `P0`, `frontend`, `client`, `KILLER_FEATURE`
**Assignee:** Antigravity
**Estimate:** 6h

**Zadání:**
Zobraz klientovi checklist podkladů pro daný měsíc.

**Tasks:**
- [ ] Vytvoř `app/(client)/dashboard/page.tsx`
- [ ] Fetch `monthly_closures` pro vlastní company
- [ ] Zobraz aktuální měsíc + 2 předchozí
- [ ] Status každého podkladu:
  - 🔴 Chybí (missing)
  - 🟡 Nahráno (uploaded)
  - 🟢 Schváleno (approved)
- [ ] Tlačítko "Nahrát" pro každý typ dokladu

**API:**
```typescript
// app/api/client/monthly-status/route.ts
export async function GET(req: Request) {
  const user = await getCurrentUser();

  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('owner_id', user.id)
    .single();

  const { data: closures } = await supabase
    .from('monthly_closures')
    .select('*')
    .eq('company_id', company.id)
    .order('period', { ascending: false })
    .limit(3);

  return Response.json(closures);
}
```

**UI:**
```
Listopad 2025
┌─────────────────────┬────────┬──────────┐
│ Výpis z účtu        │   🟢   │ 15.11.   │
│ Výdajové faktury    │   🟡   │ Nahrát   │
│ Účtenky             │   🔴   │ Nahrát   │
│ Příjmové faktury    │   🟢   │ 5 ks     │
└─────────────────────┴────────┴──────────┘

Daňový odhad: DPH 15 000 Kč | DPFO 3 500 Kč
```

---

### 🔨 Issue #6: Upload komponenta + Google Drive
**Labels:** `P0`, `frontend`, `backend`, `integration`
**Assignee:** Antigravity
**Estimate:** 8h

**Zadání:**
Implementuj upload dokladů s Google Drive integrací.

**Tasks:**
- [ ] Vytvoř `components/client/DocumentUpload.tsx`
- [ ] React Dropzone (drag & drop)
- [ ] Komprese obrázků (< 1 MB pro Gemini)
- [ ] Upload na Google Drive (Service Account)
- [ ] Volání OCR API (pokud obrázek/PDF)
- [ ] Uložení metadata do `documents` table
- [ ] Aktualizace `monthly_closures` statusu

**API:**
```typescript
// app/api/documents/upload/route.ts
export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get('file') as File;
  const companyId = formData.get('companyId');
  const period = formData.get('period'); // '2025-11'
  const type = formData.get('type'); // 'receipt'

  // 1. Upload na Google Drive
  const driveFileId = await uploadToGoogleDrive(file, companyId, period);

  // 2. Volání OCR (pokud image/pdf)
  let ocrData = null;
  if (file.type.startsWith('image/') || file.type === 'application/pdf') {
    ocrData = await callGeminiOCR(file);
  }

  // 3. Uložit do DB
  const { data: document } = await supabase
    .from('documents')
    .insert({
      company_id: companyId,
      period,
      type,
      file_name: file.name,
      file_url: `https://drive.google.com/file/d/${driveFileId}`,
      google_drive_file_id: driveFileId,
      ocr_processed: !!ocrData,
      ocr_data: ocrData,
      uploaded_by: user.id,
      upload_source: 'web',
    })
    .select()
    .single();

  // 4. Aktualizovat monthly_closure
  await supabase
    .from('monthly_closures')
    .update({
      [`${type}s_status`]: 'uploaded',
      updated_at: new Date().toISOString(),
    })
    .eq('company_id', companyId)
    .eq('period', period);

  return Response.json({ document });
}
```

**Google Drive:**
```typescript
// lib/google-drive.ts
import { google } from 'googleapis';

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_DRIVE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_DRIVE_PRIVATE_KEY,
  },
  scopes: ['https://www.googleapis.com/auth/drive.file'],
});

const drive = google.drive({ version: 'v3', auth });

export async function uploadToGoogleDrive(
  file: File,
  companyId: string,
  period: string
): Promise<string> {
  // Struktura: /Klienti/{companyId}/{year}/{month}/
  const [year, month] = period.split('-');
  const folderPath = `Klienti/${companyId}/${year}/${month}`;

  // Najít nebo vytvořit složku
  const folderId = await getOrCreateFolder(folderPath);

  // Upload souboru
  const response = await drive.files.create({
    requestBody: {
      name: file.name,
      parents: [folderId],
    },
    media: {
      mimeType: file.type,
      body: file.stream(),
    },
  });

  return response.data.id!;
}
```

---

### 🔨 Issue #7: OCR integrace (Gemini 2.5 Flash)
**Labels:** `P1`, `backend`, `ai`, `integration`
**Assignee:** Antigravity
**Estimate:** 6h

**Zadání:**
Implementuj OCR zpracování účtenek přes Gemini API.

**Tasks:**
- [ ] Vytvoř `app/api/ocr/route.ts`
- [ ] Volání Gemini 2.5 Flash API
- [ ] Extrakce polí:
  - Datum
  - Částka (celkem s DPH)
  - Dodavatel
  - Položky
  - DIČ (pokud dostupné)
- [ ] Uložení do `documents.ocr_data`

**API:**
```typescript
// app/api/ocr/route.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  const { fileUrl, documentId } = await req.json();

  // Stáhnout soubor
  const fileBuffer = await fetch(fileUrl).then(r => r.arrayBuffer());

  // Volání Gemini
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `
Analyzuj tuto účtenku a extrahuj následující informace ve formátu JSON:
{
  "date": "YYYY-MM-DD",
  "total_amount": number,
  "supplier_name": string,
  "supplier_ico": string (pokud dostupné),
  "items": [
    { "description": string, "amount": number }
  ],
  "confidence": number (0-1)
}

Pokud nějaké pole nemůžeš určit, dej null.
`;

  const result = await model.generateContent([
    { text: prompt },
    {
      inlineData: {
        mimeType: 'image/jpeg',
        data: Buffer.from(fileBuffer).toString('base64'),
      },
    },
  ]);

  const responseText = result.response.text();
  const ocrData = JSON.parse(responseText);

  // Uložit výsledek
  await supabase
    .from('documents')
    .update({
      ocr_processed: true,
      ocr_data: {
        extracted_text: responseText,
        parsed_fields: ocrData,
        confidence: ocrData.confidence || 0.8,
      },
    })
    .eq('id', documentId);

  return Response.json({ ocrData });
}
```

---

### 🔨 Issue #8: Jednoduchá daňová kalkulačka
**Labels:** `P0`, `frontend`, `business-logic`
**Assignee:** Antigravity
**Estimate:** 4h

**Zadání:**
Zobraz klientovi odhad daní za daný měsíc.

**Tasks:**
- [ ] Vytvoř `components/client/TaxSummary.tsx`
- [ ] Použij `lib/tax-calculator.ts`
- [ ] Zobraz:
  - DPH k odvedení (pokud plátce)
  - Daň z příjmů za měsíc (akruální)
  - Sociální pojištění (pokud FO)
  - Zdravotní pojištění (pokud FO)
- [ ] Graf (recharts) - kumulativní daně po měsících

**UI:**
```typescript
// components/client/TaxSummary.tsx
import { calculateMonthlyTaxes } from '@/lib/tax-calculator';

export function TaxSummary({ period }: { period: string }) {
  // Fetch invoices for period
  const { data: invoices } = useSWR(`/api/invoices?period=${period}`);

  const income = invoices
    .filter(i => i.type === 'income')
    .reduce((sum, i) => sum + i.total_with_vat, 0);

  const expenses = invoices
    .filter(i => i.type === 'expense')
    .reduce((sum, i) => sum + i.total_with_vat, 0);

  const taxes = calculateMonthlyTaxes(income, expenses, {
    isVATPayer: company.vat_payer,
    legalForm: company.legal_form,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daňový odhad - {getPeriodLabel(period)}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">DPH k odvedení</p>
            <p className="text-2xl font-bold">{formatCurrency(taxes.vatPayable || 0)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Daň z příjmů</p>
            <p className="text-2xl font-bold">{formatCurrency(taxes.incomeTax)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## 📦 Milestone 3: Accountant Dashboard

### 🔨 Issue #9: Master Dashboard Matice
**Labels:** `P0`, `frontend`, `accountant`, `KILLER_FEATURE`
**Assignee:** Antigravity
**Estimate:** 10h

**Zadání:**
**HLAVNÍ FUNKCE APLIKACE** - Matice všech klientů × 12 měsíců.

**Tasks:**
- [ ] Vytvoř `app/(accountant)/dashboard/page.tsx`
- [ ] Fetch všechny `companies` + jejich `monthly_closures`
- [ ] Tabulka: Řádky = klienti, Sloupce = měsíce (leden-prosinec)
- [ ] Barvy buněk:
  - 🔴 `missing` → bg-red-100
  - 🟡 `uploaded` → bg-yellow-100
  - 🟢 `approved` → bg-green-100
- [ ] Klik na buňku → Detail měsíce klienta
- [ ] Tlačítko "Urgovat" na každém řádku

**UI Design:**
```
Master Dashboard
┌───────────────┬──────┬──────┬──────┬─────┬──────┬─────┐
│ Klient        │ Leden│ Únor │Březen│ ... │Pros. │Akce │
├───────────────┼──────┼──────┼──────┼─────┼──────┼─────┤
│ ABC s.r.o.    │  🟢  │  🟡  │  🔴  │     │      │[📧] │
│ XYZ FO        │  🟢  │  🟢  │  🟡  │     │      │[📧] │
│ DEF s.r.o.    │  🔴  │  🔴  │  🔴  │     │      │[📧] │
└───────────────┴──────┴──────┴──────┴─────┴──────┴─────┘

Legenda: 🔴 Chybí | 🟡 Nahráno | 🟢 Schváleno
```

**Code:**
```typescript
// app/(accountant)/dashboard/page.tsx
export default async function AccountantDashboard() {
  const { data: companies } = await supabase
    .from('companies')
    .select('id, name, owner:users(name)');

  const { data: closures } = await supabase
    .from('monthly_closures')
    .select('*')
    .in('company_id', companies.map(c => c.id))
    .gte('period', '2025-01')
    .lte('period', '2025-12');

  // Group by company_id
  const matrixData = companies.map(company => {
    const companyClos ures = closures.filter(c => c.company_id === company.id);
    const months = {};
    companyClo sures.forEach(closure => {
      months[closure.period] = {
        bank_statement: closure.bank_statement_status,
        invoices: closure.expense_invoices_status,
        receipts: closure.receipts_status,
      };
    });
    return { company, months };
  });

  return <MasterMatrix data={matrixData} />;
}
```

---

### 🔨 Issue #10: Urgovací systém (SMS/Email)
**Labels:** `P1`, `backend`, `integration`
**Assignee:** Antigravity
**Estimate:** 6h

**Zadání:**
Implementuj automatické urgování klientů když chybí podklady.

**Tasks:**
- [ ] Vytvoř `app/api/reminders/send/route.ts`
- [ ] Twilio integrace (SMS)
- [ ] SendGrid integrace (Email)
- [ ] Template zpráv:
  - "Dobrý den, chybí nám od vás výpis z účtu za listopad 2025. Nahrajte ho prosím do 3 dnů."
- [ ] Log do `reminders` table
- [ ] Tlačítko v Master Dashboardu

**API:**
```typescript
// app/api/reminders/send/route.ts
import twilio from 'twilio';
import sgMail from '@sendgrid/mail';

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function POST(req: Request) {
  const { companyId, period, type } = await req.json(); // type: 'sms' | 'email'

  // Fetch company + closure
  const { data: company } = await supabase
    .from('companies')
    .select('*, owner:users(*)')
    .eq('id', companyId)
    .single();

  const { data: closure } = await supabase
    .from('monthly_closures')
    .select('*')
    .eq('company_id', companyId)
    .eq('period', period)
    .single();

  // Zjisti co chybí
  const missing = [];
  if (closure.bank_statement_status === 'missing') missing.push('výpis z účtu');
  if (closure.expense_invoices_status === 'missing') missing.push('výdajové faktury');
  if (closure.receipts_status === 'missing') missing.push('účtenky');

  const message = `
Dobrý den,

chybí nám od vás následující podklady za ${getPeriodLabel(period)}:
${missing.map(m => `- ${m}`).join('\n')}

Nahrajte je prosím do aplikace do 3 dnů.

Děkujeme, Vaše účetní
  `.trim();

  if (type === 'sms') {
    await twilioClient.messages.create({
      body: message.substring(0, 160), // SMS limit
      from: process.env.TWILIO_PHONE_NUMBER,
      to: company.owner.phone_number,
    });
  } else {
    await sgMail.send({
      to: company.owner.email,
      from: process.env.SENDGRID_FROM_EMAIL!,
      subject: `Chybí podklady za ${getPeriodLabel(period)}`,
      text: message,
    });
  }

  // Log
  await supabase.from('reminders').insert({
    company_id: companyId,
    period,
    type,
    recipient: type === 'sms' ? company.owner.phone_number : company.owner.email,
    subject: `Chybí podklady za ${getPeriodLabel(period)}`,
    message,
    delivered: true,
    created_by: (await getCurrentUser()).id,
  });

  // Update closure reminder count
  await supabase
    .from('monthly_closures')
    .update({
      reminder_count: closure.reminder_count + 1,
      last_reminder_sent_at: new Date().toISOString(),
    })
    .eq('id', closure.id);

  return Response.json({ success: true });
}
```

---

## 📦 Milestone 4: Integrace - Pohoda

### 🔨 Issue #11: Pohoda XML Export
**Labels:** `P1`, `backend`, `integration`
**Assignee:** Antigravity
**Estimate:** 8h

**Zadání:**
Generování mXML pro export faktur do Pohody.

**Tasks:**
- [ ] Vytvoř `lib/pohoda-xml.ts`
- [ ] Funkce `generateInvoiceXML(invoice: Invoice): string`
- [ ] API route `/api/pohoda/export`
- [ ] Validace XML proti Pohoda schema
- [ ] Download jako `.xml` soubor

**Code:**
```typescript
// lib/pohoda-xml.ts
export function generateInvoiceXML(invoice: Invoice, company: Company): string {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<dat:dataPack xmlns:dat="http://www.stormware.cz/schema/version_2/data.xsd" version="2.0">
  <dat:dataPackItem version="2.0">
    <inv:invoice version="2.0" xmlns:inv="http://www.stormware.cz/schema/version_2/invoice.xsd">
      <inv:invoiceHeader>
        <inv:invoiceType>issuedInvoice</inv:invoiceType>
        <inv:number>
          <typ:numberRequested>${invoice.invoice_number}</typ:numberRequested>
        </inv:number>
        <inv:date>${invoice.issue_date}</inv:date>
        <inv:dateTax>${invoice.issue_date}</inv:dateTax>
        <inv:dateDue>${invoice.due_date}</inv:dateDue>
        <inv:text>${invoice.partner.name}</inv:text>
        <inv:partnerIdentity>
          <typ:address>
            <typ:company>${invoice.partner.name}</typ:company>
            <typ:ico>${invoice.partner.ico}</typ:ico>
            <typ:dic>${invoice.partner.dic}</typ:dic>
          </typ:address>
        </inv:partnerIdentity>
      </inv:invoiceHeader>
      <inv:invoiceDetail>
        ${invoice.items.map(item => `
        <inv:invoiceItem>
          <inv:text>${item.description}</inv:text>
          <inv:quantity>${item.quantity}</inv:quantity>
          <inv:unit>ks</inv:unit>
          <inv:payVAT>true</inv:payVAT>
          <inv:rateVAT>high</inv:rateVAT>
          <inv:homeCurrency>
            <typ:unitPrice>${item.unit_price}</typ:unitPrice>
          </inv:homeCurrency>
        </inv:invoiceItem>
        `).join('')}
      </inv:invoiceDetail>
      <inv:invoiceSummary>
        <inv:homeCurrency>
          <typ:priceNone>${invoice.total_without_vat}</typ:priceNone>
          <typ:priceLow>0</typ:priceLow>
          <typ:priceLowVAT>0</typ:priceLowVAT>
          <typ:priceHigh>${invoice.total_without_vat}</typ:priceHigh>
          <typ:priceHighVAT>${invoice.total_vat}</typ:priceHighVAT>
        </inv:homeCurrency>
      </inv:invoiceSummary>
    </inv:invoice>
  </dat:dataPackItem>
</dat:dataPack>`;

  return xml;
}
```

---

### 🔨 Issue #12: Fakturace UI (Client)
**Labels:** `P1`, `frontend`, `client`
**Assignee:** Antigravity
**Estimate:** 6h

**Zadání:**
UI pro vystavování faktur s prefill z Pohody.

**Tasks:**
- [ ] Vytvoř `app/(client)/faktury/nova/page.tsx`
- [ ] Formulář:
  - Odběratel (autocomplete z Pohody)
  - Položky (autocomplete ze standardních položek)
  - Částka (autocalc)
  - Splatnost
- [ ] AI prompt input: "Vyfakturuj Karlovi stejnou fakturu jako minulý měsíc"
- [ ] Preview faktury před uložením
- [ ] Export do Pohody tlačítko

---

## 📦 Milestone 5: WhatsApp & AI

### 🔨 Issue #13: WhatsApp Webhook
**Labels:** `P2`, `backend`, `integration`
**Assignee:** Antigravity
**Estimate:** 8h

**Zadání:**
Příjem WhatsApp zpráv a automatické vytvoření úkolu.

**Tasks:**
- [ ] Vytvoř `/api/webhooks/whatsapp/route.ts`
- [ ] Verify token (WhatsApp API requirement)
- [ ] Parse incoming message
- [ ] Identifikace klienta (phone_number → company)
- [ ] AI extrakce intentu (Gemini)
- [ ] Vytvoření task v DB
- [ ] Notifikace účetní (email)

**Code:**
```typescript
// app/api/webhooks/whatsapp/route.ts
export async function POST(req: Request) {
  const body = await req.json();

  const message = body.entry[0].changes[0].value.messages[0];
  const fromPhone = message.from;
  const text = message.text.body;

  // 1. Uložit do whatsapp_messages
  const { data: waMessage } = await supabase
    .from('whatsapp_messages')
    .insert({
      whatsapp_message_id: message.id,
      from_phone: fromPhone,
      to_phone: body.entry[0].changes[0].value.metadata.display_phone_number,
      message_type: 'text',
      text,
    })
    .select()
    .single();

  // 2. Identifikovat klienta
  const { data: company } = await supabase
    .from('companies')
    .select('id, owner:users(phone_number)')
    .eq('owner.phone_number', fromPhone)
    .single();

  if (!company) {
    return Response.json({ status: 'unknown_sender' });
  }

  // 3. AI extrakce intentu
  const intent = await extractIntent(text);

  // 4. Vytvořit úkol
  if (intent.shouldCreateTask) {
    const { data: task } = await supabase
      .from('tasks')
      .insert({
        title: intent.title,
        description: text,
        company_id: company.id,
        assigned_to: company.assigned_accountant_id,
        created_by: company.owner_id,
        status: 'open',
        priority: intent.priority,
        source: 'whatsapp',
        whatsapp_message_id: waMessage.id,
      })
      .select()
      .single();

    // Update whatsapp_message
    await supabase
      .from('whatsapp_messages')
      .update({
        task_created: true,
        task_id: task.id,
        ai_processed: true,
        ai_extracted_intent: intent.title,
      })
      .eq('id', waMessage.id);
  }

  return Response.json({ status: 'ok' });
}

async function extractIntent(text: string) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `
Analyzuj tuto zprávu od klienta a urči:
1. Měl by se vytvořit úkol? (ano/ne)
2. Priorita úkolu (low, medium, high, urgent)
3. Krátký název úkolu (max 50 znaků)

Zpráva: "${text}"

Odpověz JSON:
{
  "shouldCreateTask": boolean,
  "priority": "low" | "medium" | "high" | "urgent",
  "title": string
}
`;

  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
}
```

---

**Last updated:** 2025-01-22
