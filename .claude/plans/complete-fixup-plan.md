# Kompletní plán doladění UcetniWebApp

## Fáze 1: Oprava GTD dat a flow (KRITICKÉ - nic bez toho nefunguje)

### 1.1 Fix task statusů v DB
- UPDATE tasks SET status='pending' WHERE status='open' (6 tasků)
- Tím se naplní inbox a clarify wizard bude mít co zpracovat

### 1.2 Fix company_name na tasks
- Všechny tasks mají company_name='' (prázdný string)
- UPDATE tasks SET company_name = (SELECT name FROM companies WHERE id = tasks.company_id)
- Aby v UI bylo vidět ke které firmě úkol patří

### 1.3 Ověřit Quick Add → creates pending task
- QuickAddButton POST na /api/tasks by měl vytvořit task se status=pending
- Zkontrolovat API route, že default status = 'pending'

### 1.4 Ověřit Clarify flow end-to-end
- Pending task → Clarify wizard → scoring → status změní na 'accepted'
- Timer (2min) → status změní na 'completed'
- Reference/Someday → status změní na 'cancelled'/'someday_maybe'

### 1.5 Vytvořit pár demo projektů
- Alespoň 2-3 projekty s fázemi a přiřazenými úkoly
- Aby dashboard Projects sekce nebyla prázdná

---

## Fáze 2: BUG-5 Mobile matrix overflow

### 2.1 Diagnostika
- Matice 120 firem × 12 měsíců na mobilu přetéká
- Potřeba: horizontal scroll wrapper + sticky first column

### 2.2 Fix
- Přidat overflow-x-auto na table wrapper
- Sticky first column (company name) přes CSS sticky

---

## Fáze 3: Tech debt cleanup

### 3.1 Duplicate Task types konsolidace
- mock-data.ts Task ≠ lib/types/tasks.ts Task
- Rozhodnout: jeden typ, nebo explicit aliasy
- Pravděpodobně: smazat mock-data Task, použít jen lib/types/tasks.ts

### 3.2 mockUsers → Supabase
- 4 statické mockUsers entries
- Nahradit fetch z /api/accountant/users kde se používají
- Nebo je úplně smazat pokud je nikdo nepoužívá

### 3.3 Zbytky mock-data.ts
- Zkontrolovat co ještě importuje z mock-data.ts
- Pokud jen typy → přesunout do lib/types/
- Smazat mock-data.ts pokud je prázdný

---

## Fáze 4: Feature - Kimi AI OCR (#53)

### 4.1 Podle .claude-context/kimi-integration-plan.md
- API route pro Kimi OCR call
- Upload dokument → extract data → fill form
- Integrace s documents/upload flow

---

## Fáze 5: Menší features

### 5.1 Export matice Excel/CSV
### 5.2 Search/filter by company name (na klienti stránce)
### 5.3 Keyboard shortcuts

---

## Fáze 6: Build + Deploy + E2E smoke test

- npm run build
- Deploy
- Ruční test: login → dashboard → tasks → clarify → project → settings

---

## Pořadí priorit

1. **Fáze 1** (30 min) - Bez toho GTD nefunguje vůbec
2. **Fáze 2** (15 min) - Rychlý bug fix
3. **Fáze 3** (30 min) - Tech debt
4. **Fáze 6** (10 min) - Ověřit vše
5. **Fáze 4** (2+ hod) - Větší feature
6. **Fáze 5** (1+ hod) - Nice-to-have
