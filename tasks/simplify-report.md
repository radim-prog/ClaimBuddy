# Simplify Report — UcetniWebApp

**Datum:** 2026-03-15
**Typ:** READ-ONLY analýza — žádné změny provedeny

---

## Shrnutí

Identifikováno **18 oblastí** pro zjednodušení, seřazeno dle priority.

---

## VYSOKÁ PRIORITA

### S-01: Duplicitní approve endpointy
- **Soubory:** `/api/extraction/approve/route.ts` + `/api/accountant/extraction/approve/route.ts`
- **Problém:** Oba endpointy updatují dokument a volají `populateDenormalizedFields`. Překrývající se logika.
- **Akce:** Identifikovat volající UI → konsolidovat na jeden endpoint → starší přesměrovat nebo smazat.

### S-02: Architektonický nesoulad register vs login
- **Soubory:** `app/auth/register/actions.ts` (Supabase Auth) vs `app/api/auth/login/route.ts` (custom JWT)
- **Problém:** Registrace používá jiný auth systém než login. Pravděpodobně nefunkční flow.
- **Akce:** Přepsat registraci na custom JWT systém.

---

## STŘEDNÍ PRIORITA

### S-03: Duplicitní formatCurrency/formatDate (9 souborů)
- **Soubory:**
  1. `app/accountant/invoices/page.tsx` — lokální `formatCurrency`, `formatDate`
  2. `app/accountant/invoices/[id]/page.tsx` — lokální `formatCurrency`, `formatDate`
  3. `app/accountant/analytics/clients/page.tsx` — lokální `formatCurrency`
  4. `components/invoice/invoice-items-editor.tsx` — lokální `formatCurrency`
  5. `lib/pdf/invoice-template.tsx` — lokální `formatAmount` (jiný název, stejná CZK logika)
  6. `lib/travel-randomizer.ts` — lokální `formatDate`
  7. `components/admin/people-substitutions.tsx` — lokální `formatDate`
  8. `app/accountant/analytics/page.tsx` — `formatKc` (jiný název)
  9. `app/api/time-entries/route.ts` — inline `formatAmount`
- **Akce:** Nahradit importem z `@/lib/utils`.

### S-04: Dva CollapsibleSection komponenty
- **Soubory:** `components/collapsible-section.tsx` + `components/ui/collapsible-section.tsx`
- **Problém:** Různé API (`title` vs `label`, `defaultOpen` vs `expanded/onToggle`), různý vizuální styl. 8 importujících souborů.
- **Akce:** Sloučit do jedné s controlled/uncontrolled módem.

### S-05: kimi-ai.ts — sdílené typy v monolitickém souboru (1039 ř.)
- **Soubor:** `lib/kimi-ai.ts`
- **Problém:** Obsahuje typy (`ExtractedInvoice`, `CorrectionRecord`, `RoundResult`), validační funkci a KimiAIClient. Typy importovány z 3 míst.
- **Akce:** Extrahovat typy → `lib/types/extraction.ts`, bank statement logic → `lib/bank-statement-extractor.ts`.

### S-06: Zavádějící název mock-data.ts
- **Soubor:** `lib/mock-data.ts`
- **Problém:** Neobsahuje mock data — obsahuje Invoice typy, urgency helpers. Importován z 12 souborů.
- **Akce:** Přejmenovat na `lib/types/invoice-domain.ts` nebo rozdělit.

---

## NÍZKÁ PRIORITA

### S-07: Nepoužívané komponenty (2 soubory)
- `components/annual-closing-section.tsx` — 0 importů
- `components/section-nav.tsx` — 0 importů
- **Akce:** Smazat.

### S-08: Mega-komponenta unified-task-detail.tsx (2731 řádků)
- **Soubor:** `components/work-preview/unified-task-detail.tsx`
- **Akce:** Split na sub-komponenty (task header, checklist, time tracking, documents).

### S-09: Velké stránky vhodné ke splitnutí
- `app/accountant/requests/page.tsx` — 1151 řádků
- `app/accountant/extraction/verify/page.tsx` — 1147 řádků
- `components/deadline-alert-bar.tsx` — 1040 řádků
- `components/tax-tracking/income-tax-matrix.tsx` — 981 řádků
- `components/gtd/gtd-capture-flow.tsx` — 970 řádků
- **Akce:** Extrahovat sub-komponenty, zachovat funkčnost.

### S-10: Console.log v produkčním kódu
- `lib/kimi-ai.ts` — 15× console.log
- `lib/ai-extractor.ts` — 8× console.log
- `app/api/stripe/webhook/route.ts` — 7× console.log (audit trail)
- `app/api/documents/extract/route.ts` — 2× console.log
- **Akce:** Stripe logy → structured error-logger. Debug logy → smazat.

### S-11: Explicitní `any` typy (30+ míst)
- `app/api/stripe/webhook/route.ts` — `type WebhookObject = any`
- `app/api/accountant/invoicing/route.ts` — `any[]` bez typu
- `app/api/client/invoices/route.ts` — `item: any`
- `app/api/accountant/matrix/route.ts` — `(g: any)`
- `app/api/tasks/route.ts` — `as any`
- **Akce:** Definovat konkrétní interfaces. Stripe `any` je akceptovatelné.

### S-12: drive-sync-store.ts (907 řádků)
- **Soubor:** `lib/drive-sync-store.ts`
- **Akce:** Zvážit split na sync logic vs store logic.

---

## Statistiky

| Kategorie | Počet položek |
|-----------|--------------|
| Vysoká priorita | 2 |
| Střední priorita | 4 |
| Nízká priorita | 6 |
| Celkem dotčených souborů | ~35 |
| Dead code k smazání | 2 soubory |
| Duplicitní kód | 9+ souborů |
| Mega-soubory (1000+ ř.) | 7 souborů |
