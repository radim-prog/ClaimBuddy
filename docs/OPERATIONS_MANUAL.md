# 📘 ClaimBuddy - Operační Manuál pro Tým

**Verze:** 1.0
**Datum:** 1. listopadu 2025
**Pro:** Operační tým (1 profík + 1 asistentka)

---

## 📋 Obsah

1. [Úvod](#úvod)
2. [Denní Operace](#denní-operace)
3. [Týdenní Úkoly](#týdenní-úkoly)
4. [Měsíční Úkoly](#měsíční-úkoly)
5. [Case Management](#case-management)
6. [Troubleshooting](#troubleshooting)
7. [Templates](#templates)
8. [Knowledge Base](#knowledge-base)
9. [KPIs & Metriky](#kpis--metriky)
10. [Onboarding](#onboarding)

---

## 🎯 Úvod

### Co je ClaimBuddy

ClaimBuddy je AI-powered platforma pro asistenci při pojistných událostech. Pomáháme klientům získat maximální pojistné plnění rychle a bez stresu.

**Naše služba:**
- ✅ Zpracování pojistných nároků
- ✅ Komunikace s pojišťovnami
- ✅ Příprava dokumentace
- ✅ AI asistent 24/7
- ✅ Vyjednávání vyšších plnění

### Tým

**Profík (Lídr):**
- Správa komplexních případů
- Komunikace s pojišťovnami
- Eskalace problémů
- Training asistentky
- Reporting

**Asistentka:**
- První kontakt s klienty
- Sběr dokumentace
- Administrativa
- Tracking případů
- Support

### Jak používat tento manuál

📖 **První čtení:** 2-3 hodiny
🔄 **Refresh:** Před složitým případem
📌 **Quick reference:** Hledej v obsahu

---

## ⏰ Denní Operace

### Ranní Rutina (9:00-9:30)

#### 1. Přihlášení do systému
```
URL: https://claimbuddy.vercel.app/admin
Login: [tvůj email]
Password: [heslo z 1Password]
```

#### 2. Dashboard Check
- **Nové případy:** Červený badge číslo
- **Urgentní:** Orange badge (>14 dní bez akce)
- **Čekající na tebe:** Assigned to you tab

#### 3. Email Check
```
Gmail: info@claimbuddy.cz
Filtry:
  - "Nový případ" → Automaticky v systému
  - "Klient odpověděl" → Action needed
  - "Pojišťovna" → High priority
```

#### 4. Prioritizace Dne
Seřaď podle:
1. **🔴 URGENTNÍ:** Deadline dnes/zítra
2. **🟠 VYSOKÁ:** Client waiting >3 dny
3. **🟡 STŘEDNÍ:** In progress, on track
4. **🟢 NÍZKÁ:** Waiting for insurance

---

### Case Management Workflow

#### 📨 NOVÝ PŘÍPAD PŘIŠEL

**Krok 1: Notifikace (0-5 min)**
- Email na `info@claimbuddy.cz`
- Slack notifikace (pokud setup)
- Admin dashboard - červený badge

**Krok 2: První Review (5-10 min)**
```
Admin Dashboard → Cases → [Nový případ]

Zkontroluj:
✓ Typ pojištění (POV, Majetek, Zdraví, atd.)
✓ Pojišťovna (která?)
✓ Dokumenty (kompletní?)
✓ Urgence (deadline z pojistky?)
✓ Složitost (jednoduchý/složitý?)
```

**Krok 3: Assignment (1 min)**
```
IF jednoduchý AND dokumenty kompletní:
  → Assign to: Asistentka
ELSE:
  → Assign to: Profík
```

**Krok 4: První Kontakt (do 2 hodin!)**

Email šablona: **`case-created.tsx`** (automatický z systému)

```
Předmět: Váš případ #{ID} byl vytvořen ✅

Dobrý den [JMÉNO],

děkujeme za důvěru v ClaimBuddy!

📋 Váš případ:
- ID: #{ID}
- Typ: [TYP POJIŠTĚNÍ]
- Pojišťovna: [NÁZEV]
- Vytvořeno: [DATUM]

✅ Co bude následovat:
1. Zkontrolujeme vaši dokumentaci (do 24 hodin)
2. Připravíme nárok pro pojišťovnu (2-3 dny)
3. Podáme nárok a budeme jednat (7-14 dní)
4. Informujeme vás o výsledku

⏱️ Očekávaná doba vyřízení: 14-21 dnů

Máte-li dotazy, odpovězte na tento email nebo pište v aplikaci.

S pozdravem,
[TVOJE JMÉNO]
Tým ClaimBuddy
```

**Krok 5: Do Timeline**
```
Admin Dashboard → Case Detail → Add Timeline Event

Typ: "Case Created"
Popis: "Případ vytvořen klientem. První kontakt odeslán."
```

---

#### 🔄 CASE IN PROGRESS

**Denní Check (každý pracovní den)**

```
Pro každý case kde jsi assigned:

1. Zkontroluj status:
   - Waiting for documents? → Reminder po 3 dnech
   - Waiting for insurance? → Follow-up po 7 dnech
   - Waiting for client? → Reminder po 3 dnech

2. Update timeline (pokud něco nového):
   "Kontaktovali jsme pojišťovnu XYZ"
   "Obdrželi jsme odpověď: ..."

3. Komunikuj s klientem (každé 3-5 dní):
   "Update: Vaše žádost je u pojišťovny, čekáme na odpověď"
```

**Komunikace s Pojišťovnou**

**Telefonní hovor:**
```
1. Představ se: "Dobrý den, jsem [JMÉNO] z ClaimBuddy, voláme ohledně případu [ČÍSLO POJISTKY]"
2. Stručně vysvětli situaci
3. Dotaz: "Kdy můžeme očekávat stanovisko?"
4. Zaznamenej odpověď → Internal Notes
5. Follow-up email s summary
```

**Email pojišťovně:**
```
Předmět: Nárok z pojistky [ČÍSLO] - [TYP UDÁLOSTI]

Dobrý den,

jménem našeho klienta [JMÉNO KLIENTA] podáváme nárok z pojistné smlouvy [ČÍSLO].

Přílohy:
- Záznam o události
- Fotodokumentace
- [Další dokumenty]

Prosíme o posouzení a sdělení stanoviska do 14 dnů dle pojistných podmínek.

V případě dotazů kontaktujte:
[TVOJE JMÉNO]
[EMAIL]
[TELEFON]

S pozdravem,
ClaimBuddy
```

---

#### ⏸️ WAITING FOR CLIENT

**Scenario:** Klient neodpovídá, chybí dokumenty

**Timeline:**

**Den 0:** Poslali jsme žádost o dokumenty
**Den 3:** První reminder
```
Email/SMS:
"Ahoj [JMÉNO], stále čekáme na [DOKUMENTY].
Můžeš je nahrát v aplikaci nebo poslat emailem.
Bez nich nemůžeme pokračovat. Díky!"
```

**Den 7:** Druhý reminder (urgentní)
```
Email + SMS:
"Poslední připomínka - potřebujeme [DOKUMENTY] do 7 dnů,
jinak budeme muset případ uzavřít. Děkujeme!"
```

**Den 14:** Auto-close
```
Status → "Closed - No Response"
Email:
"Váš případ byl uzavřen z důvodu nedostatečné spolupráce.
Pokud chcete pokračovat, vytvořte nový případ. Děkujeme."
```

---

#### ✅ CASE RESOLVED

**Krok 1: Verify Payment from Insurance**
```
Klient potvrdil:
"Ano, pojišťovna vyplatila [ČÁSTKA] Kč"

NEBO check v systému pojišťovny (pokud máš přístup)
```

**Krok 2: Calculate Fee**
```
IF Success Fee model:
  Výpočet: [VYPLACENÁ ČÁSTKA] × 15% = [FEE]
  Příklad: 50,000 × 0.15 = 7,500 Kč

IF Fixed Fee model:
  Fee = [490-1990 Kč] (již zaplaceno předem)
```

**Krok 3: Generate Invoice**
```
Admin Dashboard → Case → Generate Invoice

Položky:
- ClaimBuddy Success Fee (15%)
- Částka: 7,500 Kč
- DPH: 21% (1,575 Kč)
- Celkem: 9,075 Kč
```

**Krok 4: Send Payment Link**
```
Email Template: `payment-receipt.tsx` (automatický)

Obsahuje:
- Poděkování
- Souhrn případu
- Invoice (PDF)
- Payment link (Stripe nebo GoPay)
- "Zaplaťte do 14 dnů"
```

**Krok 5: Confirm Payment & Close**
```
Stripe webhook → Auto-update status → "Paid"

Manual check (pokud webhook selhal):
Stripe Dashboard → Payments → Verify

Pak:
Status → "Closed - Completed"
Timeline → "Payment received, case closed"
```

**Krok 6: Request Review**
```
Email (2 dny po close):
"Jak jste spokojeni? Zanechte nám review:"
Link na Google Reviews / Trustpilot
```

---

## 📅 Týdenní Úkoly

### PONDĚLÍ - Planning (9:00-10:00)

**1. Review All Open Cases**
```
Dashboard → Cases → Filter: Status = Active

Pro každý case:
✓ Zkontroluj deadline
✓ Je něco blokované?
✓ Priority na tento týden
```

**2. Team Meeting (15 min)**
```
Agenda:
- Kolik nových cases minulý týden?
- Kolik closed?
- Problémy?
- Goal pro tento týden
```

**3. Prioritization**
```
Vytvoř weekly checklist (Notion/Trello):
🔴 Urgentní cases (3-5)
🟠 Důležité (5-10)
🟡 Normal (zbytek)
```

---

### STŘEDA - Mid-week Check (15:00-15:30)

**1. Cases Stuck?**
```
Dashboard → Sort by: Last Updated (oldest first)

IF case bez akce >5 dní:
  → Investigate why
  → Escalate if needed
```

**2. Client Satisfaction Check**
```
Náhodně vyber 3 active cases
Zavolej/napiš klientovi:
"Jak jste spokojeni? Máte dotazy?"

Zaznamenej feedback → Notion
```

**3. Respond to Reviews**
```
Google Reviews / Trustpilot → Check new reviews

Odpověz do 24 hodin:
Pozitivní: "Děkujeme! Jsme rádi že jsme mohli pomoci."
Negativní: "Omlouváme se. Kontaktujeme vás pro vyřešení."
```

---

### PÁTEK - Wrap-up (16:00-17:00)

**1. Close Resolved Cases**
```
Status: Resolved → Closed
Send final emails
Archive documents
```

**2. Send Invoices**
```
All cases where insurance paid this week
→ Generate invoices
→ Send payment links
```

**3. Weekly Report**
```
Stats pro tento týden:
- New cases: [X]
- Closed cases: [X]
- Success rate: [X]%
- Revenue: [X] Kč
- Avg resolution time: [X] dní

Share s týmem/majitelem
```

**4. Plan Next Week**
```
Jaké cases budou hot příští týden?
Kdo bude assigned?
Dovolená/absence?
```

---

## 📆 Měsíční Úkoly

### PRVNÍ TÝDEN - Financials & Stats

**Financial Report:**
```
Stripe Dashboard → Reports → Last Month

Metrics:
- Total revenue
- Transactions count
- Avg transaction
- Fees paid (Stripe, payment processing)
- Net revenue

Firebase → Cases → Count by status
- Total cases
- Success rate
- Churn rate
```

**Cases Stats:**
```
Dashboard → Analytics → Last 30 Days

- Cases created
- Cases closed
- Avg resolution time (goal: <21 dní)
- Success rate (goal: >75%)
```

**Client Satisfaction:**
```
Send NPS survey to all closed cases last month:
"Na škále 0-10, jak pravděpodobné je že doporučíte ClaimBuddy?"

NPS = % Promoters (9-10) - % Detractors (0-6)
Goal: NPS >70
```

---

### DRUHÝ TÝDEN - Marketing & Content

**Website Traffic:**
```
Google Analytics → Last Month
- Visitors
- Conversion rate (goal: >3%)
- Top pages
- Bounce rate
```

**Update FAQ:**
```
Review support tickets/emails
Identify 3-5 new common questions
Add to FAQ page
```

**Content Marketing:**
```
Write 1-2 blog posts:
- SEO optimized
- Real case study (anonymized)
- Tips for clients

Examples:
"Jak na pojistnou událost při autonehodě"
"5 chyb při vyřizování pojistky"
```

---

### TŘETÍ TÝDEN - Security & Maintenance

**Backup Check:**
```
Firebase Console → Backups
- Last backup: When?
- Test restore (1 case)
- Documents in Storage: Accessible?
```

**Security Audit:**
```
Firebase → Authentication → Recent Sign-ins
- Any suspicious activity?
- Failed login attempts?

Admin Dashboard → Users → Check roles
- Everyone has correct permissions?
```

**Update Knowledge Base:**
```
Notion → ClaimBuddy KB
- New insurance companies contacted?
- New procedures learned?
- Document it!
```

---

### ČTVRTÝ TÝDEN - Planning & Training

**Next Month Plan:**
```
Goals:
- Target cases: [X]
- Target revenue: [X] Kč
- New features to launch?
- Marketing campaigns?
```

**Team Performance Review:**
```
1-on-1 meetings:
- What went well?
- What can improve?
- Training needs?
- Goal for next month
```

**Team Training:**
```
Topics:
- New insurance procedures
- New software features
- Customer service best practices
- Time management

Format: 1 hodina workshop
```

---

## 🆘 Troubleshooting

### Pojišťovna odmítá vyplatit

**Situace:** Client dostal zamítavé stanovisko

**Kroky:**

**1. Review pojistné podmínky**
```
Najdi pojistku klienta (PDF)
Najdi relevantní klauzuli
Pojišťovna odkazuje na správnou klauzuli?
```

**2. Check dokumentace**
```
Je kompletní?
- Všechny požadované dokumenty?
- Lhůty dodrženy?
- Formuláře správně vyplněné?
```

**3. Konzultace s právníkem (pokud potřeba)**
```
IF odměna >50,000 Kč AND máme silný case:
  → Kontaktuj legal partnera
  → Explain situation
  → Ask: "Je to worth legal action?"
```

**4. Appeal Letter**
```
Template:

Vážená pojišťovno,

nesouhlasíme s vaším rozhodnutím ze dne [DATUM] z následujících důvodů:

1. [DŮVOD 1 - reference na podmínky]
2. [DŮVOD 2 - faktická evidence]
3. [DŮVOD 3 - precedens]

Přikládáme dodatečnou dokumentaci:
- [DOKUMENT 1]
- [DOKUMENT 2]

Žádáme o přehodnocení do 14 dnů.

V případě zamítnutí využijeme služeb finančního arbitra.

S pozdravem,
ClaimBuddy jménem [KLIENT]
```

**5. Explain klientovi**
```
"Bohužel pojišťovna zamítla z důvodu [X].
Podali jsme appeal.
Realistická šance: [60%/40%/20%]

Pokud neuspějeme, můžete:
a) Přijmout (žádná platba)
b) Jít k finančnímu arbitrovi (3-6 měsíců)
c) Soudní spor (6-12 měsíců, drahé)

Co preferujete?"
```

---

### Klient nespokojený

**Situace:** Complaint email/call

**Kroky: LISTEN → ACKNOWLEDGE → ACTION → FOLLOW-UP**

**1. LISTEN (Aktivní poslouchání)**
```
Nechej klienta mluvit bez přerušení
Dělej si poznámky
"Rozumím. Pokračujte prosím."
```

**2. ACKNOWLEDGE (Uznat problém)**
```
"Chápu vaši frustraci."
"Omlouváme se že to tak dopadlo."
"Máte pravdu že jsme mohli [X] udělat lépe."

NEVER:
❌ "To není naše chyba."
❌ "Měl jste [něco udělat]."
❌ "Všichni ostatní jsou spokojení."
```

**3. ACTION PLAN (Co uděláme)**
```
"Tady je co uděláme:

1. [KONKRÉTNÍ AKCE 1] - Do [DATUM]
2. [KONKRÉTNÍ AKCE 2] - Do [DATUM]
3. [KOMPENZACE pokud appropriate] - např. sleva, refund

Souhlasíte s tímto plánem?"
```

**4. FOLLOW-UP (Ověř spokojenost)**
```
Po vyřešení (2-3 dny):
"Dobrý den, ověřuji že jste spokojení s řešením.
Je ještě něco co můžeme udělat?"

Zaznamenej do CRM.
```

---

### Technický problém

**Situace:** Web nefunguje, login selhává, data missing

**Debug Checklist:**

**1. Verify problem**
```
Je to jen pro tebe nebo pro všechny?
→ Ask kolegu: "Funguje ti X?"
→ Try incognito mode
→ Try different browser
```

**2. Check Status Pages**
```
Vercel Status: https://www.vercel-status.com/
Firebase Status: https://status.firebase.google.com/
```

**3. Check Logs**
```
Vercel Dashboard → Logs
Firebase Console → Errors
Sentry (pokud setup) → Recent errors
```

**4. Common Fixes**
```
Login issues:
→ Clear cookies/cache
→ Try password reset

Data not loading:
→ Check Firebase Console → Firestore (data exists?)
→ Check network tab (API calls failing?)

Upload failing:
→ File size <25 MB?
→ Correct file type?
→ Check Storage rules
```

**5. Escalate if needed**
```
IF nelze vyřešit do 30 min:
→ Email developer: dev@claimbuddy.cz
→ Include:
  - What's broken
  - Steps to reproduce
  - Screenshots/error messages
  - Your browser/device
```

---

### Platba selhala

**Situace:** Client tried to pay, payment failed

**Kroky:**

**1. Check Stripe Dashboard**
```
Stripe Dashboard → Payments → Search customer email

Error codes:
- `card_declined` → Banka zamítla (insufficient funds, fraud)
- `incorrect_cvc` → Špatný CVC
- `expired_card` → Expirovaná karta
- `processing_error` → Stripe temporary issue
```

**2. Communicate with Client**
```
"Vaše platba bohužel selhala z důvodu: [DŮVOD]

Můžete:
a) Zkusit jinou kartu
b) Použít GoPay (bankovní převod)
c) Poslat fakturu (zaplatíte převodem)

Která varianta vám vyhovuje?"
```

**3. Retry Options**
```
Option A: Nový payment link (jiná karta)
→ Admin → Case → Generate new payment link

Option B: GoPay
→ Admin → Case → Generate GoPay payment

Option C: Invoice + Bank Transfer
→ Admin → Case → Generate invoice PDF
→ Send bank details
→ "Zaplaťte do 7 dnů"
```

**4. Persistent Non-payment**
```
Day 7: First reminder
Day 14: Final notice
Day 30: Legal action warning

IF still not paid:
→ Debt collection agency (optional)
→ NEBO write-off (close case, mark as loss)
```

---

## 📧 Templates

### Email: Žádost o dodatečné dokumenty

```
Předmět: Případ #{ID} - Potřebujeme doplnit dokumentaci

Dobrý den [JMÉNO],

děkujeme za důvěru v ClaimBuddy. Pro úspěšné vyřízení vašeho případu potřebujeme doplnit následující dokumenty:

📄 Chybějící dokumenty:
- [DOKUMENT 1] - např. "Protokol o nehodě z Policie"
- [DOKUMENT 2] - např. "Fotografie poškození (min. 3 úhly)"
- [DOKUMENT 3] - např. "Odhad škody z autoservisu"

📤 Jak je nahrát:
1. Přihlaste se na https://claimbuddy.vercel.app
2. Přejděte na váš případ #{ID}
3. Klikněte "Nahrát dokumenty"
4. NEBO odpovězte na tento email s přílohami

⏰ Deadline: Do [DATUM] (7 dní)

Jakmile dokumenty obdržíme, okamžitě pokračujeme v jednání s pojišťovnou.

Máte-li dotazy, neváhejte se ozvat.

S pozdravem,
[TVOJE JMÉNO]
ClaimBuddy
Tel: [TELEFON]
Email: [EMAIL]
```

---

### Email: Status Update (Waiting for Insurance)

```
Předmět: Aktualizace případu #{ID} - Čekáme na pojišťovnu

Dobrý den [JMÉNO],

posíláme vám update k vašemu případu #{ID}.

📊 Aktuální stav:
- ✅ Dokumentace kompletní
- ✅ Nárok podán pojišťovně [NÁZEV] dne [DATUM]
- ⏳ Čekáme na odpověď (obvyklá doba: 7-14 dní)

📅 Co bude následovat:
1. Pojišťovna posoudí nárok (7-14 dní)
2. Jakmile obdržíme odpověď, okamžitě vás informujeme
3. Pokud bude potřeba doplnění, dáme vědět

💬 Máte dotazy?
Kdykoliv se ozvěte - odpovíme do 24 hodin.

Děkujeme za trpělivost!

S pozdravem,
[TVOJE JMÉNO]
ClaimBuddy
```

---

### Internal Note Template

```
[2025-11-01 14:30] - [Radim]
━━━━━━━━━━━━━━━━━━━━━━━━
Akce: Telefonát s pojišťovnou Direct
Výsledek: Potvrdili příjem našeho nároku. Zpracovávají.
Next step: Čekat na stanovisko (do 14 dní)
Deadline: 2025-11-15
Poznámky: Mluvil jsem s panem Novákem, ext. 234
━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 📚 Knowledge Base

### Časté Pojistné Situace

#### 🚗 Autonehoda (POV)

**Potřebné dokumenty:**
- ✅ Záznam o dopravní nehodě (oboustranně podepsaný)
- ✅ Fotodokumentace škody (min. 5 fotek z různých úhlů)
- ✅ Protokol Policie ČR (pokud byla přivolána)
- ✅ Pojistná smlouva (číslo pojistky stačí)
- ✅ Odhad opravy z autoservisu (nepovinné, ale pomáhá)

**Očekávaná doba vyřízení:** 10-15 dnů
**Success rate:** 85%
**Průměrné vyplacené:** 35,000 Kč
**Časté problémy:** Nesrovnalosti v záznamu, chybí policie u větších škod

**Tips:**
- Vždy fotit na místě (i když je stres)
- Záznam o nehodě vyplnit kompletně (ne jen podpisy)
- Pokud druhá strana odmítá podepsat → Policie nutná

---

#### 🏠 Poškození majetku (voda, oheň, krupobití)

**Potřebné dokumenty:**
- ✅ Fotodokumentace ASAP (čím dřív, tím líp)
- ✅ Odhad škody (znalec, nebo 3 nabídky na opravu)
- ✅ Pojistná smlouva
- ✅ Faktury za opravu (pokud už opraveno)
- ✅ Záznam hasičů/policie (pokud byl incident)

**Očekávaná doba vyřízení:** 15-30 dní
**Success rate:** 70%
**Průměrné vyplacené:** 120,000 Kč
**Časté problémy:** Podhodnocení škody pojišťovnou, spory o příčinu

**Tips:**
- Fotit PŘED úklidem (důkaz rozsahu)
- Pokud nutno opravit hned (havarijní stav) → fotit + volat pojišťovnu
- Znalec od pojišťovny může podhod notit → vlastní znalec doporučen

---

#### 🏥 Zdravotní úraz

**Potřebné dokumenty:**
- ✅ Lékařské zprávy (vstupní vyšetření, průběh léčby, závěrečná)
- ✅ Pojistná smlouva
- ✅ Popis události (kde, kdy, jak se to stalo)
- ✅ Náklady (faktury za léčbu, léky, rehabilitaci)
- ✅ Potvrzení o pracovní neschopnosti (pokud byla)

**Očekávaná doba vyřízení:** 30-60 dní
**Success rate:** 60%
**Průměrné vyplacené:** 80,000 Kč
**Časté problémy:** Spory o trvalé následky, podhodnocení bolestného

**Tips:**
- Dokumentovat VŠE (každá návštěva lékaře)
- Fotit zranění (pokud viditelné)
- Nechat si vyplnit znalecký posudek (může zvýšit plnění 2-3×)

---

### Top Pojišťovny ČR

#### 1. Česká pojišťovna (Generali Group)

**Profil:**
- Market leader (#1 podíl)
- Tradiční, konzervativní
- Velká síť poboček

**Vyřizování claims:**
- ⏱️ **Rychlost:** 🐌🐌 Pomalé (20-30 dní)
- 💰 **Férovost:** 😐 Střední (často podhodnocují)
- 📞 **Komunikace:** 📞 Lepší osobně na pobočce než telefonicky

**Tips:**
- Půjčte si osobní kontakt na "svého" agenta
- Email > Telefon (evidence)
- Buďte persistentní

---

#### 2. Kooperativa (Vienna Insurance Group)

**Profil:**
- #2 v ČR
- Rychlé, digitální
- Dobrá pověst

**Vyřizování claims:**
- ⏱️ **Rychlost:** 🚀🚀 Rychlé (10-15 dní)
- 💰 **Férovost:** 😊 Férové (málokdy spory)
- 📞 **Komunikace:** 📧 Perfektní (odpovídají do 48h)

**Tips:**
- Využijte online portál (rychlejší než email)
- Obvykle fair first offer

---

#### 3. Allianz

**Profil:**
- Global player
- Premium pojistky
- Profesionální

**Vyřizování claims:**
- ⏱️ **Rychlost:** 🚗 Střední (15-20 dní)
- 💰 **Férovost:** 😊 Dobré
- 📞 **Komunikace:** 📞 Profesionální

---

#### 4. Direct pojišťovna

**Profil:**
- Online-only
- Levné pojistky
- AI-powered

**Vyřizování claims:**
- ⏱️ **Rychlost:** 🚀🚀🚀 Nejrychlejší (5-10 dní)
- 💰 **Férovost:** 😊 Férové
- 📞 **Komunikace:** 💬 Chat + Email (no phone)

**Tips:**
- Všechno online
- AI zpracování → instant ve 30% případů

---

#### 5. ČSOB Pojišťovna

**Profil:**
- Banko-pojišťovna
- Integrace s ČSOB bankou

**Vyřizování claims:**
- ⏱️ **Rychlost:** 🚗 Střední (15-20 dní)
- 💰 **Férovost:** 😐 Střední
- 📞 **Komunikace:** 📧 Email preferován

---

### Kdy eskalovat na advokáta

**Kritéria:**

✅ **ANO - eskaluj:**
- Pojišťovna odmítá >50,000 Kč bez dobrého důvodu
- Case trvá >90 dní (abnormálně dlouhý)
- Klient explicitně chce právní zastoupení
- Sporná interpretace pojistných podmínek
- Podezření na bad faith (zlá víra pojišťovny)

❌ **NE - neeskaluj:**
- Nízká částka (<20,000 Kč) - legal costs > benefit
- Klient jasně vinný (např. pojištění neplatil)
- Chybí dokumentace (weak case)
- Existuje mediace/arbiter alternativa

**Legal Partners:**
```
1. Dostupný Advokát
   - Konzultace: 390 Kč
   - Fixed fee modely
   - Web: dostupnyadvokat.cz

2. [Další partner - doplnit]
```

---

## 📊 KPIs & Metriky

### Sleduj Týdně

| Metrika | Jak měřit | Cíl | Akce pokud pod cílem |
|---------|-----------|-----|---------------------|
| **New Cases** | Dashboard → Stats | >5/týden | Marketing boost, SEO, PPC |
| **Resolved Cases** | Dashboard → Closed this week | >3/týden | Zrychlit procesy, hire help |
| **Success Rate** | (Paid cases / Total closed) × 100% | >75% | Review failed cases, improve strategy |
| **Avg Resolution Time** | Sum(days) / Count(cases) | <21 dní | Identify bottlenecks, automate |
| **Client Satisfaction** | NPS survey (weekly 3 random) | NPS >70 | Improve communication, faster |

---

### Sleduj Měsíčně

| Metrika | Jak měřit | Cíl | Akce pokud pod cílem |
|---------|-----------|-----|---------------------|
| **Revenue** | Stripe Dashboard → Total | >100k/měsíc | More cases, higher fees, upsells |
| **Avg Ticket** | Revenue / Cases | >4,000 Kč | Focus on higher-value cases |
| **Conversion Rate** | (Cases / Website visitors) × 100% | >3% | Improve landing page, CTA |
| **Churn** | (Lost clients / Total clients) × 100% | <20% | Improve service, follow-ups |
| **Cost per Acquisition** | Marketing spend / New cases | <2,000 Kč | Optimize ads, organic growth |

---

### Dashboard Metrics Explained

**New Cases (Weekly):**
```
Dobrý: >5/týden (260/rok)
OK: 3-5/týden (150-260/rok)
Špatný: <3/týden (<150/rok) → Not sustainable
```

**Success Rate:**
```
Excellent: >85%
Good: 75-85%
OK: 60-75%
Bad: <60% → Review strategy, cherry-pick cases
```

**Avg Resolution Time:**
```
Fast: <14 dní (klienti happy!)
Good: 14-21 dní (cíl)
OK: 21-30 dní
Slow: >30 dní (klienti frustrated)
```

**NPS (Net Promoter Score):**
```
Calculation:
1. Survey: "Jak pravděpodobné 0-10 doporučíte ClaimBuddy?"
2. Promoters: 9-10 → Count
3. Detractors: 0-6 → Count
4. NPS = (% Promoters - % Detractors)

World-class: >70
Good: 50-70
OK: 30-50
Bad: <30
```

---

## 👥 Onboarding Nového Člena Týmu

### První Den (8 hodin)

#### Ráno (9:00-12:00)

**9:00 - Welcome & Setup (1h)**
```
✅ Setup:
- Email účet (Google Workspace)
- Admin dashboard login
- Slack/komunikační nástroje
- 1Password (sdílené hesla)

✅ Tour:
- Kancelář/workspace
- Kde co je
- Coffee machine 😊
```

**10:00 - Read Operations Manual (2h)**
```
✅ Přečti tento manuál (2-3 hodiny)
✅ Dělej si poznámky
✅ Questions? Write them down
```

**12:00 - Oběd (1h)**

#### Odpoledne (13:00-17:00)

**13:00 - Shadow Experienced Member (3h)**
```
✅ Sedni vedle zkušeného kolegy
✅ Watch:
  - Jak přijímá nový case
  - Jak komunikuje s klientem
  - Jak používá systém
  - Jak píše emaily

✅ Ask questions throughout
```

**16:00 - First Hands-on (1h)**
```
✅ Pod dohledem:
  - Respond na jeden email
  - Update timeline v jednom case
  - Log internal note

✅ Mentor ti dá feedback
```

---

### První Týden (40 hodin)

**Pondělí:**
- Setup day (viz výše)

**Úterý-Čtvrtek:**
```
✅ Handle 3-5 JEDNODUCHÝCH cases (s mentorem):
  - Type: POV, jednoduché
  - Mentor assigned as backup
  - Review before sending emails

✅ Learn postupy:
  - Email templates
  - Call scripts
  - Documentation requirements
```

**Pátek:**
```
✅ Quiz na znalosti (30 min):
  - 20 otázek
  - Pass: >80% správných
  - Pokud fail → Review + retry příští týden

✅ Feedback session (30 min):
  - Co šlo dobře?
  - Co můžeš zlepšit?
  - Goals pro příští týden
```

---

### První Měsíc

**Týden 1:** Setup + shadowing + first cases (s mentorem)
**Týden 2:** 5-10 cases (samostatně, mentor reviews výstupy)
**Týden 3:** 10-15 cases (full independence, spot checks)
**Týden 4:** 15+ cases + feedback session (end of month)

**End of Month Evaluation:**
```
✅ Skills check:
  - Can handle cases independently?
  - Client communication quality?
  - System proficiency?
  - Team collaboration?

✅ Decision:
  - Pass → Full team member
  - Needs improvement → Action plan + Month 2
  - Not a fit → Part ways
```

---

## 🔐 Tools & Access

### Must-Have Přístupy

| Tool | URL | Purpose | Credentials |
|------|-----|---------|-------------|
| **Admin Dashboard** | claimbuddy.vercel.app/admin | Case management | 1Password: "Admin Login" |
| **Firebase Console** | console.firebase.google.com | Database, users, storage | Google SSO |
| **Stripe Dashboard** | dashboard.stripe.com | Payments, invoices | 1Password: "Stripe" |
| **Gmail** | gmail.com | info@claimbuddy.cz | Google SSO |
| **Notion** | notion.so | Project management, KB | Invite link |

---

### Keyboard Shortcuts (Admin Dashboard)

```
Global:
  Ctrl/Cmd + K → Quick search
  Ctrl/Cmd + / → Shortcuts menu

Cases:
  C → Create new case
  / → Search cases
  ? → Help

Case Detail:
  E → Edit case
  M → Send message
  U → Upload document
  N → Add internal note
```

---

## 📞 Kontakty & Escalation

### Internal Team

```
Profík (Lídr):
  Tel: [TELEFON]
  Email: [EMAIL]
  Availability: 9-17 Po-Pá

Asistentka:
  Tel: [TELEFON]
  Email: [EMAIL]
  Availability: 9-17 Po-Pá

Developer (Technical issues):
  Email: dev@claimbuddy.cz
  Response: <24h (weekdays)
```

---

### External Partners

```
Legal:
  Dostupný Advokát: dostupnyadvokat.cz
  Tel: [TELEFON]

Accounting:
  [ÚČETNÍ FIRMA]
  Tel: [TELEFON]

Insurance Contacts:
  Česká pojišťovna: 956 777 977
  Kooperativa: 800 105 105
  Direct: 270 270 777
  (více v Knowledge Base)
```

---

## 📈 Continuous Improvement

### Weekly Review (Pátek 16:30)

```
3 Questions:
1. Co fungovalo dobře tento týden?
2. Co nefungovalo?
3. Co změníme příští týden?

Log do Notion → Track improvements over time
```

---

### Monthly Retro (Poslední Pátek)

```
Team meeting (1 hodina):

1. Review KPIs (15 min)
   - Hitting goals?
   - What's blocking us?

2. Process improvements (20 min)
   - What's frustrating?
   - What can we automate?
   - What can we eliminate?

3. Wins celebration (10 min)
   - Best case this month
   - Client testimonial
   - Team achievement

4. Next month goals (15 min)
   - Targets
   - Action items
   - Who's responsible?
```

---

## 📄 Appendix

### A. Pojistné Pojmy Slovník

- **POV:** Povinné ručení (auto liability insurance)
- **Havarijní pojištění:** Auto damage insurance (comprehensive)
- **Pojistné plnění:** Insurance payout
- **Likvidace škody:** Claims adjustment process
- **Spoluúčast:** Deductible
- **Pojistná doba:** Policy period
- **Výluka:** Exclusion (co není kryto)

---

### B. Užitečné Linky

**Oficiální:**
- Česká asociace pojišťoven: cap.cz
- Finanční arbitr: finarbitr.cz
- Česká národní banka (dohled): cnb.cz

**Nástroje:**
- Kalkulačka pojistného: [link]
- Srovnání pojišťoven: [link]

---

### C. Emergency Procedures

**Systém Down (web nefunguje):**
```
1. Check Vercel Status: vercel-status.com
2. Try from different network
3. IF confirmed outage:
   - Email všem klientům affected
   - Use backup email (info@)
   - Update social media
   - Notify developer
   - Estimate fix time
```

**Data Breach / Security Incident:**
```
1. STOP - don't panic
2. Notify majitel ASAP
3. Change všechny passwords
4. Review Firebase logs (who accessed what?)
5. Notify affected clients (GDPR requirement - do 72h)
6. Report to ÚOOÚ (if serious)
7. Post-mortem: How did it happen? How prevent?
```

---

## ✅ Checklist: Jsem Ready?

**Po přečtení tohoto manuálu, ověř:**

- [ ] Znám denní rutinu (ranní check, case workflow)
- [ ] Vím jak assignovat cases
- [ ] Umím použít email templates
- [ ] Znám kroky při problému (troubleshooting)
- [ ] Vím kdy eskalovat na legal
- [ ] Rozumím KPIs (co měřit, proč)
- [ ] Mám přístup ke všem tools
- [ ] Znám kontakty (tým, external partners)
- [ ] Vím kde najít help (tento manuál, mentor)

**Pokud ano → Jsi ready! 🎉**

---

## 📝 Feedback na Manuál

Tento manuál je living document. Pokud najdeš:
- ❌ Chybu
- 💡 Zlepšení
- ➕ Chybějící info

→ Napiš do Notion → "Ops Manual Feedback"

---

**Verze:** 1.0
**Poslední update:** 2025-11-01
**Autor:** ClaimBuddy Team
**Review:** [Datum příštího review: 2025-12-01]

---

**🚀 Hodně štěstí s provozováním ClaimBuddy!**