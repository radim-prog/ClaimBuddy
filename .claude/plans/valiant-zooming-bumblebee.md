# QA Testování klientské sekce — Plán

## Kontext
Po redesignu dashboardu (Quick Action Overlay + Missing Docs Bar + kompaktní tlačítka) je potřeba provést kompletní QA audit celé klientské sekce. Kromě ověření nové funkcionality je třeba otestovat všechny existující stránky, tlačítka, formuláře a logiku.

**Nahlášený bug:** Při impersonaci (pohled účetního jako klient) se oranžová lišta + další bannery kumulují a překrývají navigační prvky (sidebar, zpět tlačítka). NotificationBanner je `sticky top-0 z-50` a zakrývá ImpersonationBanner s tlačítkem "Zpět". Sidebar je `fixed inset-y-0 z-30` — banner z-[100] překrývá jeho horní část.

---

## Strategie: 5 paralelních agentů

Každý agent otestuje jednu oblast a vrátí:
- Seznam testovaných prvků (tlačítka, formuláře, linky)
- PASS/FAIL pro každý prvek
- Nalezené bugy s popisem a souborem:řádek
- Návrhy oprav

### Agent 1: Dashboard + Quick Action Overlay + Missing Docs Bar
**Soubory:**
- `app/client/dashboard/page.tsx`
- `components/client/action-hub/quick-action-overlay.tsx`
- `components/client/missing-docs-bar.tsx`
- `components/client/action-hub/scan-overlay.tsx`
- `components/client/action-hub/invoice-overlay.tsx`
- `components/client/action-hub/trip-overlay.tsx`
- `components/client/tax-impact-summary.tsx`

**Testovat:**
1. Quick Action Overlay: zobrazí se při otevření? 5 tlačítek funkční? Dismiss na X/backdrop? Z-index pod bottom nav?
2. Kompaktní řada: 5 tlačítek (doklad/faktura/jízda/zprávy/výpis) — navigace + overlay otevření
3. Company tabs: přepínání firem
4. Draft badge: zobrazení podmínky, link na /client/documents
5. Year matrix: správné barvy, zvýraznění aktuálního měsíce
6. Cases widget: zobrazení podmínky, link na /client/cases
7. Tax Impact Summary: API volání, podmínky zobrazení
8. Messages + Deadlines widgety: linky, obsah
9. Contact card: link na zprávy
10. Overlays (scan/invoice/trip): max-w-2xl na desktopu, slide-in animace, zavírání
11. ScanOverlay: auto-trigger kamery, extrakce pipeline, draft uložení, submit flow
12. InvoiceOverlay: ClientInvoiceForm rendering
13. TripOverlay: načtení vehicles/drivers/places, TripForm rendering
14. Dark mode kompatibilita všech nových komponent

### Agent 2: Layout + Bannery + Navigace (VČETNĚ IMPERSONATION BUGU)
**Soubory:**
- `app/client/layout.tsx`
- `components/client/impersonation-banner.tsx`
- `components/client/missing-docs-bar.tsx`
- `components/client/notification-banner.tsx`
- `components/client/notification-modal.tsx`

**Testovat:**
1. **IMPERSONATION BUG** — klíčový problém:
   - ImpersonationBanner (relative, z-[100]) + MissingDocsBar (relative, z-[90]) + NotificationBanner (sticky top-0, z-50)
   - Sidebar (fixed inset-y-0, z-30) — banner překrývá horní část sidebaru
   - Na mobilech: kumulace bannerů + mobile header → kolik px zbývá pro obsah?
   - NotificationBanner sticky se může překrývat s ImpersonationBanner po scrollu
   - Tlačítko "Zpět do účetní sekce" v ImpersonationBanner — je klikatelné?
2. Desktop sidebar: collapse/expand, navigace, tooltip v collapsed stavu
3. Mobile bottom nav: všech 5 položek, active state, z-50 vs overlay z-[45]
4. Mobile header: logo, avatar dropdown, logout
5. MissingDocsBar: správná logika detekce chybějících dokladů, dismiss do sessionStorage, navigace na /client/documents
6. NotificationModal: zobrazení, dismiss all, grouping by severity
7. NotificationBanner: sticky chování, expand/collapse, barvy podle severity
8. Theme toggle: funkčnost v sidebar
9. User dropdown: na desktopu i mobilech

### Agent 3: Documents + Messages stránky
**Soubory:**
- `app/client/documents/page.tsx` (~57KB — velký soubor)
- `app/client/messages/page.tsx`
- `components/client/messages-section.tsx`
- `components/client/DocumentUpload.tsx`
- `components/client/bank-statement-upload.tsx`
- `components/client/transaction-list.tsx`
- `components/client/transaction-match-dialog.tsx`
- `components/client/income-categorizer.tsx`

**Testovat:**
1. Documents: 4 taby (Dokumenty/K podpisu/Bankovní výpisy/Daňový dopad)
2. Dokumenty tab: list, status badge, document type filter
3. K podpisu tab: draft list, potvrdit/smazat, extrakce pipeline
4. Upload: file input, kamera, drag-and-drop, typ dokumentu selector
5. OCR extrakce: POST /api/client/extract, výsledky, korekce, submit
6. Bank statements: upload CSV/XLS, auto-match, transaction list
7. Transaction match dialog: manuální matching, status ikony
8. Daňový dopad tab: tax impact zobrazení
9. Messages: company tabs, konverzace sidebar, chat area
10. Nová konverzace: subject input, odeslání
11. Zprávy: odeslání, přílohy, scroll to bottom, read marking
12. Konverzace: complete/reopen akce
13. Prázdné stavy (žádné zprávy, žádné dokumenty)

### Agent 4: Account + Cases stránky
**Soubory:**
- `app/client/account/page.tsx`
- `app/client/cases/page.tsx`
- `app/client/cases/[id]/page.tsx`
- `components/case/case-timeline.tsx`
- `components/case/case-documents.tsx`
- `components/case/case-budget-card.tsx`

**Testovat:**
1. Account - Profil tab: jméno/email editace, změna hesla, validace
2. Account - Firma tab: read-only zobrazení, IČO/DIČ/právní forma/DPH/zaměstnanci/status
3. Account - Faktury tab: summary cards, filtry (all/income/expense), detail karty, status badge
4. Account - Upozornění tab: email/telegram toggles, telegram chat ID podmíněné pole, typy notifikací
5. Cases list: grid layout, status badges (5 stavů), barvy, navigace na detail
6. Case detail: header card, tabs (timeline/documents/budget), podmíněná viditelnost tabů
7. Case timeline: read-only mód, entrie display
8. Case documents: read-only mód, download link
9. Case budget: read-only zobrazení
10. Zpět tlačítka: na cases list, case detail — fungují správně?
11. Prázdné stavy: žádné cases, žádné faktury

### Agent 5: Travel (cestovní deník) kompletně
**Soubory:**
- `app/client/travel/page.tsx`
- `app/client/travel/new/page.tsx`
- `app/client/travel/[tripId]/page.tsx`
- `components/client/travel/trip-form.tsx`
- `components/client/travel/trip-list.tsx`
- `components/client/travel/vehicle-card.tsx`
- `components/client/travel/vehicle-form.tsx`
- `components/client/travel/fuel-gauge.tsx`
- `components/client/travel/place-autocomplete.tsx`
- `components/client/travel/travel-stats.tsx`

**Testovat:**
1. Travel - Jízdy tab: trip list, měsíční filtr, filtr vozidla, přidat/edit/delete jízdu
2. Trip form: všechna pole (datum, čas, vozidlo, řidič, trasa, účel, vzdálenost, zpáteční)
3. Výpočet náhrady: basic rate + fuel, § 157 ZP, zákonné sazby, přepínání skutečné/vyhlášková cena
4. Trip list: řazení, stránkování(?), detail karty
5. Travel - Vozidla tab: vehicle cards, přidat/edit/delete vozidlo
6. Vehicle form: SPZ, značka, typ paliva, spotřeba, sazba/km
7. Fuel log form: datum, litry, cena, stav km, čerpací stanice, plná nádrž checkbox
8. Travel - Místa tab: autocomplete, oblíbená místa, počet návštěv
9. Travel - Přehled tab: statistiky (celkem km, náhrady, náklady na palivo)
10. /client/travel/new: vytvoření nové jízdy, zpět tlačítko
11. /client/travel/[tripId]: editace existující jízdy, zpět tlačítko
12. PlaceAutocomplete: suggestions, výběr, custom místo

---

## Známé problémy k ověření

1. **CRITICAL: Impersonation banner překrývá navigaci** — sidebar top, zpět tlačítka, kumulace bannerů
2. Quick Action Overlay: z-index [45] vs bottom nav z-50 — bottom nav musí být klikatelný
3. MissingDocsBar: logika pro "chybí doklady" — funguje pro firmu bez closure záznamu?
4. Overlays max-w-2xl: nerozstáhnou se formuláře na celou šířku na desktopu?
5. Dark mode: všechny nové komponenty

---

## Výstup

Každý agent vrátí strukturovaný report:
```
## [Oblast]
### PASS ✅
- [seznam fungujících prvků]

### FAIL ❌
- [bug popis] — soubor:řádek — návrh opravy

### WARN ⚠️
- [potenciální problém nebo UX vylepšení]
```

Po dokončení všech agentů: sloučím do jednoho seznamu bugů a opravím vše najednou.
