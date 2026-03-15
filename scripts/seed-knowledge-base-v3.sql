-- Knowledge Base v3: Comprehensive full-text content for Czech accountants
-- Replaces all existing content (TRUNCATE + INSERT)
-- Run via Supabase SQL editor or Management API

TRUNCATE knowledge_base;

-- ============================================================================
-- CATEGORY: procedures (Postupy a best practices) — HLAVNÍ PRACOVNÍ POSTUPY
-- ============================================================================

INSERT INTO knowledge_base (category, title, content, source_url, sort_order) VALUES
('procedures', 'Průvodce aplikací Účetní OS', '## Průvodce aplikací Účetní OS

Účetní OS je komplexní webová aplikace pro vedení účetnictví. Tento průvodce shrnuje hlavní funkce a pracovní postupy.

### Přihlášení a navigace
- Přihlaste se na adrese vaší instance (např. ucetni.example.com)
- Levý sidebar: přehled klientů, matice, vytěžování, nastavení
- Horní lišta: vyhledávání, notifikace, přepínání tmavého režimu

### Správa klientů
1. **Seznam klientů** — přehled všech firem s filtry (právní forma, stav, plátce DPH)
2. **Detail klienta** — záložky: Práce, Úkoly, Zprávy, Doklady, Soubory, Jízdy, Daně, Firma
3. **Matice** — měsíční přehled stavu všech klientů (uzávěrky, doklady, komunikace)

### Doklady a vytěžování
1. Klient nahraje doklad (foto/PDF) přes portál nebo email
2. Doklad se objeví v sekci **Vytěžování** → záložka Nové
3. Účetní ověří vytěžená data (OCR) a schválí/opraví
4. Doklad se přesune do správné kategorie (příjmy, výdaje, banka)

### Měsíční uzávěrka
1. Zkontrolujte, že máte všechny podklady (bankovní výpis, doklady, faktury)
2. Párování bankovních transakcí s fakturami/doklady
3. Kontrola DPH (pokud plátce) — KH a přiznání
4. Uzavření měsíce v matici (zelená = OK, červená = chybí podklady)

### Komunikace s klientem
- Interní zprávy v aplikaci (záložka Zprávy u klienta)
- Urgence: automatické emaily při chybějících podkladech
- Notifikace: systémové oznámení při nových dokladech nebo zprávách

### Pohled klienta
- Tlačítko "Pohled klienta" přepne do klientského portálu
- Vidíte přesně to, co vidí klient
- Pro návrat klikněte na banner nahoře', NULL, 1);

INSERT INTO knowledge_base (category, title, content, source_url, sort_order) VALUES
('procedures', 'Měsíční uzávěrka — kompletní checklist', '## Měsíční uzávěrka — krok za krokem

### Příprava (1.–5. den následujícího měsíce)

- [ ] **Bankovní výpis** — získat kompletní výpis za měsíc
  - Automatické zasílání: nastavení v bance (preferované)
  - Manuální stažení: klient přes portál nebo email
- [ ] **Doklady od klienta** — ověřit kompletnost
  - Příjmové faktury (vystavené)
  - Výdajové doklady (přijaté faktury, paragony, pokladní doklady)
  - Interní doklady (mzdy, odpisy, kurzové rozdíly)
- [ ] **Kontrola datové schránky** — nepřečtené zprávy od úřadů

### Zpracování (5.–15. den)

#### 1. Bankovní výpis
- Zaúčtování všech pohybů
- Párování s fakturami (automatické + ruční)
- Neidentifikované platby → dotaz na klienta

#### 2. Přijaté faktury
- Kontrola náležitostí (dodavatel, částka, DPH, DUZP)
- Zaúčtování do správného období
- U plátců DPH: kontrola nároku na odpočet

#### 3. Vystavené faktury
- Zaúčtování tržeb
- Kontrola uhrazení (párování s bankou)
- Neuhrazené po splatnosti → upomínka

#### 4. Pokladna (pokud existuje)
- Pokladní doklady za měsíc
- Kontrola pokladního zůstatku vs. fyzický stav
- Inventurní rozdíl → zaúčtovat manko/přebytek

#### 5. Mzdy (pokud zaměstnanci)
- Výpočet mezd za měsíc
- Odvody SP a ZP (splatnost 20. dne následujícího měsíce)
- Záloha na daň z příjmů (splatnost 20. dne)
- Předání výplatních pásek zaměstnancům

### DPH — plátci (do 25. dne)
- [ ] Kontrolní hlášení (KH) — vygenerovat a zkontrolovat
- [ ] Přiznání k DPH — vygenerovat
- [ ] Souhrnné hlášení (pokud dodání do EU)
- [ ] Podání přes datovou schránku
- [ ] Platba DPH (do 25. dne)

### Uzavření měsíce
- [ ] Kontrola obratové předvahy
- [ ] Uzavření měsíce v matici (změna stavu na "Uzavřeno")
- [ ] Archivace dokladů (digitální + fyzické pokud požadováno)
- [ ] Komunikace klientovi — shrnutí měsíce, případné dotazy', NULL, 2);

INSERT INTO knowledge_base (category, title, content, source_url, sort_order) VALUES
('procedures', 'Roční uzávěrka — kompletní postup', '## Roční účetní uzávěrka

### Harmonogram

| Termín | Činnost |
|--------|---------|
| Leden–Únor | Uzavření posledního měsíce, inventarizace |
| Únor–Březen | Kontrola účtů, opravné položky, časové rozlišení |
| Březen | Sestavení účetní závěrky |
| Do 1.4. | Přiznání k dani z příjmů (bez daňového poradce) |
| Do 1.7. | Přiznání k dani z příjmů (s daňovým poradcem) |

### 1. Inventarizace majetku a závazků

**Fyzická inventura (majetek, zásoby, pokladna):**
- Porovnat skutečný stav se stavem v účetnictví
- Soupis inventurních rozdílů (manka, přebytky)
- Zaúčtovat inventurní rozdíly

**Dokladová inventura (pohledávky, závazky, účty):**
- Odsouhlasení zůstatků s odběrateli/dodavateli
- Konfirmace bankovních zůstatků
- Kontrola stavu nedokončené výroby

### 2. Uzávěrkové operace

#### Odpisy dlouhodobého majetku
- Daňové odpisy dle ZDP (rovnoměrné nebo zrychlené)
- Účetní odpisy dle odpisového plánu
- Zaúčtování odpisů: MD 551 / D 07x, 08x

#### Časové rozlišení
- **Náklady příštích období (381)**: předplacené nájemné, pojistné, předplatné
- **Výnosy příštích období (384)**: přijaté zálohy za budoucí služby
- **Příjmy příštích období (385)**: nevyfakturované služby za rok
- **Výdaje příštích období (383)**: nevyfakturované náklady (energie, služby)
- **Dohadné účty aktivní (388)**: odhad pohledávek (pojistné plnění)
- **Dohadné účty pasivní (389)**: odhad závazků (nevyfakturované dodávky)

#### Opravné položky
- K pohledávkám po splatnosti (zákonné dle zákona o rezervách)
- K zásobám (pokud tržní cena < účetní hodnota)
- K DHM (pokud užitná hodnota < zůstatková cena)

#### Rezervy
- Zákonné: na opravy DHM (§ 7 zákona o rezervách)
- Účetní: na záruční opravy, na soudní spory, na odstupné

#### Kurzové rozdíly
- Přecenění valutové pokladny a devizových účtů kurzem ČNB k 31.12.
- Přecenění pohledávek a závazků v cizí měně
- MD 563 / D 321 (kurzová ztráta) nebo MD 311 / D 663 (kurzový zisk)

### 3. Daň z příjmů
- Výpočet základu daně (VH + přičitatelné - odčitatelné položky)
- Zaúčtování daně: MD 591 / D 341
- Zaúčtování odložené daně (pokud relevantní): MD 592 / D 481

### 4. Účetní závěrka
- **Rozvaha** (bilance aktiv a pasiv k 31.12.)
- **Výkaz zisku a ztráty** (VZZ — výnosy a náklady za rok)
- **Příloha** (doplňující informace, účetní metody, události po rozvahovém dni)
- Střední a velké ÚJ: + přehled o peněžních tocích + přehled o změnách VK

### 5. Podání
- Přiznání k dani z příjmů FO (DPFO) nebo PO (DPPO)
- Účetní závěrka do sbírky listin (u PO)
- Roční vyúčtování záloh na daň ze závislé činnosti (pokud zaměstnanci)
- Roční vyúčtování srážkové daně', NULL, 3);

INSERT INTO knowledge_base (category, title, content, source_url, sort_order) VALUES
('procedures', 'Vytěžování dokladů — jak na to', '## Vytěžování dokladů v Účetní OS

### Co je vytěžování?
Automatické rozpoznání údajů z nahraného dokladu (OCR + AI) — dodavatel, částka, DPH, datum, variabilní symbol.

### Postup zpracování

#### 1. Příjem dokladu
Doklad se do systému dostane:
- **Klientský portál** — klient nahraje foto/PDF
- **Email** — klient pošle na přidělenou adresu
- **Ruční nahrání** — účetní nahraje ručně

#### 2. Automatické vytěžení
Systém automaticky rozpozná:
- Typ dokladu (faktura přijatá, paragon, pokladní doklad)
- Dodavatel (IČO, název, adresa)
- Částka (celkem, základ DPH, DPH)
- Datum (DUZP, datum vystavení, splatnost)
- Variabilní symbol
- Číslo účtu dodavatele

#### 3. Verifikace účetní
1. Otevřete sekci **Vytěžování** → záložka **K ověření**
2. Zkontrolujte vytěžená data vs. originální doklad (split screen)
3. Opravte případné chyby (zvýrazněné červeně)
4. Přiřaďte kategorii a účet
5. Klikněte **Schválit** nebo **Vrátit k přepracování**

#### 4. Zaúčtování
Po schválení se doklad automaticky zaúčtuje dle přiřazené kategorie.

### Tipy pro kvalitní vytěžení
- **Kvalita fotky** — dobré osvětlení, celý doklad v záběru, bez odlesků
- **PDF preferováno** — lepší přesnost než fotka
- **Jeden doklad = jeden soubor** — neskládejte více dokladů
- **Čitelný text** — vybledlé účtenky předem naskenujte ve vyšším rozlišení

### Řešení problémů
| Problém | Řešení |
|---------|--------|
| Špatně rozpoznaný dodavatel | Opravte IČO → systém si zapamatuje |
| Chybná částka | Opravte ručně, zkontrolujte DPH |
| Nerozpoznaný typ dokladu | Přiřaďte ručně (faktura/paragon/jiné) |
| Duplicitní doklad | Systém upozorní na duplicitu → potvrďte nebo smažte |', NULL, 4);

INSERT INTO knowledge_base (category, title, content, source_url, sort_order) VALUES
('procedures', 'Cestovní náhrady — legislativa a postup', '## Cestovní náhrady

### Právní úprava
- **§ 151–189 zákoníku práce** (z.č. 262/2006 Sb.)
- **Vyhláška MPSV** o sazbách cestovních náhrad (aktualizace každoročně)

### Sazby 2025

| Typ náhrady | Sazba |
|-------------|-------|
| Stravné tuzemsko (5–12 h) | 166 Kč |
| Stravné tuzemsko (12–18 h) | 256 Kč |
| Stravné tuzemsko (nad 18 h) | 398 Kč |
| Náhrada za použití osobního auta | 5,60 Kč/km |
| Průměrná cena PHM — Natural 95 | 36,80 Kč/l |
| Průměrná cena PHM — Motorová nafta | 36,00 Kč/l |

### Postup vyúčtování pracovní cesty

#### 1. Před cestou
- Příkaz k pracovní cestě (může být ústní, ale doporučujeme písemný)
- Údaje: kdo, kam, kdy, účel, dopravní prostředek, záloha

#### 2. Během cesty
- Uchovávat doklady (jízdenky, parkovné, ubytování, stravování)
- Zaznamenat kilometry (pokud vlastní auto)

#### 3. Po cestě (do 10 pracovních dnů)
- Vyplnit cestovní příkaz / vyúčtování
- Přiložit doklady
- Výpočet náhrad: jízdné + stravné + ubytování + nutné vedlejší výdaje

### Kniha jízd
Povinná evidence při použití **firemního vozidla** nebo **vlastního auta** pro pracovní cesty:
- Datum a čas cesty (začátek, konec)
- Odkud – kam (místo jednání)
- Účel cesty
- Počet ujetých km
- Stav tachometru

### Zaúčtování
- **MD 512** / D 211 (nebo 333) — cestovné
- **MD 512** / D 211 — ubytování
- **MD 512** / D 211 — stravné
- Záloha: MD 335 / D 211, vyúčtování: MD 512 / D 335 + doplatek/přeplatek', NULL, 5);

INSERT INTO knowledge_base (category, title, content, source_url, sort_order) VALUES
('procedures', 'Komunikace s klienty — best practices', '## Komunikace s klienty

### Základní principy
1. **Proaktivita** — informujte klienta dříve, než se zeptá
2. **Srozumitelnost** — pište česky, ne účetní hantýrkou
3. **Včasnost** — odpovídejte do 24 hodin (ideálně do 4 hodin)
4. **Dokumentace** — vše písemně (interní zprávy v aplikaci)

### Kdy komunikovat s klientem

| Situace | Způsob | Urgence |
|---------|--------|---------|
| Chybí měsíční podklady | Automatická urgence + zpráva | Střední |
| Blíží se termín DPH/přiznání | Email + zpráva | Vysoká |
| Nalezena chyba v dokladu | Zpráva v aplikaci | Nízká |
| Změna legislativy | Hromadný email | Informativní |
| Nový klient — onboarding | Osobní schůzka/call | Vysoká |

### Urgence — chybějící podklady
Systém automaticky odesílá urgence:
1. **5. den** — první upozornění (měkké)
2. **10. den** — druhé upozornění (středně naléhavé)
3. **15. den** — eskalace (naléhavé, kopie vedení)

### Šablony zpráv

**Žádost o podklady:**
> Dobrý den, pro zpracování účetnictví za měsíc [MĚSÍC] potřebuji:
> - Bankovní výpis (celý měsíc)
> - Přijaté faktury a paragony
> - Vystavené faktury (pokud nebyly vystaveny v systému)
> Prosím o zaslání do [DATUM]. Děkuji.

**Dotaz na neidentifikovanou platbu:**
> Dobrý den, na bankovním výpise za [MĚSÍC] je platba [ČÁSTKA] Kč z/na účet [ÚČET]. Můžete mi prosím sdělit, o jakou platbu se jedná? Děkuji.

**Upozornění na blížící se termín:**
> Dobrý den, připomínám termín pro podání [TYP PŘIZNÁNÍ]: [DATUM]. Prosím o kontrolu a případné doplnění podkladů do [DATUM-3DNY]. Děkuji.

### Jak řešit obtížné situace
- **Klient nereaguje** → telefon, pak eskalace na vedení firmy
- **Klient nesouhlasí** → vysvětlete legislativní důvod, nabídněte schůzku
- **Klient chce "optimalizovat" (na hraně)** → jasně vysvětlete rizika, zdokumentujte', NULL, 6);

INSERT INTO knowledge_base (category, title, content, source_url, sort_order) VALUES
('procedures', 'FAQ — časté dotazy', '## Často kladené dotazy

### Obecné

**Kdy je firma povinna vést podvojné účetnictví?**
Podvojné účetnictví musí vést: všechny právnické osoby (s.r.o., a.s.), OSVČ zapsané v OR, OSVČ s obratem > 25 mil. Kč, a OSVČ které se dobrovolně rozhodly.

**Jak dlouho archivovat účetní doklady?**
- Účetní závěrka, výroční zpráva: **10 let**
- Účetní doklady, knihy, odpisové plány: **5 let**
- Mzdové listy, evidenční listy důchodového pojištění: **30 let** (po ukončení PP)
- Daňové doklady pro DPH: **10 let**

**Kdy musí firma mít audit?**
Povinný audit má účetní jednotka, která k rozvahovému dni účetního období překročí alespoň 2 z 3 kritérií: aktiva > 40 mil. Kč, obrat > 80 mil. Kč, průměrný počet zaměstnanců > 50.

### DPH

**Kdy se musím registrovat k DPH?**
Povinná registrace: obrat > 2 mil. Kč za 12 po sobě jdoucích měsíců (od 2025). Dobrovolná registrace je možná kdykoliv.

**Co je kontrolní hlášení (KH)?**
Měsíční výkaz pro FÚ s detailním rozpisem přijatých a uskutečněných zdanitelných plnění. Podává se elektronicky do 25. dne. Slouží ke kontrole párování faktur (dodavatel ↔ odběratel).

**Co se stane když nepodám KH včas?**
- 1 000 Kč — pokud podáte do 5 dnů po výzvě FÚ
- 10 000 Kč — pokud podáte po výzvě FÚ
- 30 000 Kč — pokud nepodáte ani po výzvě
- 50 000 Kč — opakované nepodání

### Mzdy a zaměstnanci

**Jaká je minimální mzda v roce 2025?**
20 800 Kč/měsíc (124,40 Kč/hodina) pro 40hodinový týden.

**Kdy odvádět zálohy na SP a ZP?**
Do **20. dne** následujícího měsíce. Příklad: mzda za leden → odvody do 20. února.

**Může zaměstnanec podepsat prohlášení k dani u více zaměstnavatelů?**
Ne, prohlášení poplatníka lze podepsat pouze u jednoho zaměstnavatele současně.

### Daň z příjmů

**Jaké jsou sazby daně z příjmů?**
- FO (fyzické osoby): **15%** (nad 36násobek průměrné mzdy 23%)
- PO (právnické osoby): **21%**

**Co jsou daňově neuznatelné náklady?**
Náklady, které nelze uplatnit jako výdaj snižující základ daně: pokuty a penále od státních orgánů, reprezentace (občerstvení, dary nad limit), osobní spotřeba podnikatele, tvorba účetních (ne zákonných) opravných položek.

**Kdy podat přiznání k dani z příjmů?**
- **1. dubna** — bez daňového poradce (elektronicky)
- **2. května** — elektronicky bez poradce (od 2024)
- **1. července** — s daňovým poradcem nebo auditorem', NULL, 7);

INSERT INTO knowledge_base (category, title, content, source_url, sort_order) VALUES
('procedures', 'Archivace dokladů — lhůty a pravidla', '## Archivace účetních dokladů

### Zákonné lhůty

| Typ dokumentu | Lhůta | Zákon |
|---------------|-------|-------|
| Účetní závěrka | 10 let | § 31 zákona o účetnictví |
| Výroční zpráva | 10 let | § 31 zákona o účetnictví |
| Účetní doklady | 5 let | § 31 zákona o účetnictví |
| Účetní knihy | 5 let | § 31 zákona o účetnictví |
| Inventurní soupisy | 5 let | § 31 zákona o účetnictví |
| Účtový rozvrh | 5 let | § 31 zákona o účetnictví |
| Odpisové plány | 5 let | § 31 zákona o účetnictví |
| Daňové doklady (DPH) | 10 let | § 35 zákona o DPH |
| Mzdové listy | 30 let | zákon o organizaci SS |
| Evidenční listy (důchod) | 30 let | zákon o organizaci SS |
| Pracovní smlouvy | 30 let po ukončení PP | zákon o organizaci SS |

### Elektronická archivace (od 2024)
- Účetní doklady lze archivovat **výhradně elektronicky** (novela zákona o účetnictví)
- Podmínky: zachování čitelnosti, věrohodnosti původu, neporušenosti obsahu
- Formát: PDF, PDF/A (preferovaný pro dlouhodobou archivaci)
- Zálohování: minimálně 2 nezávislé kopie na různých médiích

### Praktická doporučení
1. **Struktura složek**: rok / měsíc / typ dokladu
2. **Pojmenování souborů**: YYYY-MM-DD_typ_dodavatel_castka.pdf
3. **Zálohování**: cloud + lokální disk + případně USB archiv
4. **Skartace**: po uplynutí lhůty, zdokumentovat (skartační protokol)
5. **Přístupnost**: oprávněné osoby musí mít přístup (kontrola FÚ, audit)', NULL, 8);

INSERT INTO knowledge_base (category, title, content, source_url, sort_order) VALUES
('procedures', 'Tipy a best practices', '## Tipy pro efektivní účetní praxi

### Organizace práce
- **Pravidelný rytmus**: každý klient = stejný den v měsíci pro zpracování
- **Matice klientů**: denní kontrola stavu (zelená/žlutá/červená)
- **Urgence včas**: nečekejte na poslední chvíli — žádejte podklady hned po 1. dni
- **Šablony**: připravte si šablony pro opakující se situace

### Prevence chyb
- **Dvojí kontrola**: vždy zkontrolujte obratovou předvahu po zaúčtování
- **Bankovní výpis vs. kniha**: měsíční odsouhlasení zůstatku
- **Párování faktur**: automatické párování ušetří čas, ale vždy zkontrolujte
- **DPH kontrola**: před podáním porovnejte KH s přiznáním

### Efektivita
- **Automatizace**: využívejte automatické vytěžování dokladů
- **Hromadné operace**: zpracovávejte doklady po dávkách, ne jednotlivě
- **Klávesové zkratky**: naučte se zkratky v aplikaci
- **Delegace**: opakující se úkoly delegujte na asistenty

### Legislativní monitoring
- Sledujte změny: **Finanční zpravodaj**, **MFČR**, **Komora daňových poradců**
- Klíčové termíny: leden (nové sazby), duben (přiznání FO), červenec (přiznání s poradcem)
- Informujte klienty o změnách, které se jich týkají

### Bezpečnost dat
- **Hesla**: unikátní pro každou službu, min. 12 znaků
- **Dvoufaktorové ověření**: vždy zapnout kde je to možné
- **Zálohování**: 3-2-1 pravidlo (3 kopie, 2 média, 1 offsite)
- **GDPR**: osobní údaje zaměstnanců = zvýšená ochrana
- **Sdílení dat**: nikdy přes nezabezpečený email, vždy přes portál', NULL, 9);

INSERT INTO knowledge_base (category, title, content, source_url, sort_order) VALUES
('procedures', 'Kalendář povinností 2025/2026', '## Kalendář daňových a účetních povinností

### Měsíční povinnosti (do 20. dne)
- Záloha na daň z příjmů ze závislé činnosti
- Odvody na sociální pojištění (zaměstnavatel + zaměstnanec)
- Odvody na zdravotní pojištění (zaměstnavatel + zaměstnanec)

### Měsíční povinnosti (do 25. dne)
- Přiznání k DPH (měsíční plátci)
- Kontrolní hlášení (všichni plátci DPH)
- Souhrnné hlášení (pokud dodání do EU)

### Čtvrtletní povinnosti
- Přiznání k DPH (čtvrtletní plátci) — do 25. dne po skončení čtvrtletí
- Zálohy na daň z příjmů (pokud poslední známá daňová povinnost > 30 000 Kč)

### Roční termíny 2025/2026

| Termín | Povinnost |
|--------|-----------|
| **31.1.** | Vyúčtování daně z příjmů vybírané srážkou za předchozí rok |
| **1.2.** | Zaměstnanci: požádat o roční zúčtování daně |
| **20.2.** | Vyúčtování záloh na daň ze závislé činnosti za předchozí rok |
| **20.3.** | Roční zúčtování daně zaměstnanců (vrácení přeplatku) |
| **1.4.** | Přiznání DPFO a DPPO (papírově, bez poradce) |
| **2.5.** | Přiznání DPFO a DPPO (elektronicky, bez poradce) |
| **30.6.** | Přehled OSVČ pro ČSSZ a ZP za předchozí rok |
| **1.7.** | Přiznání DPFO a DPPO (s daňovým poradcem/auditorem) |
| **1.7.** | Účetní závěrka do sbírky listin (s poradcem) |
| **30.9.** | Daň z nemovitých věcí — 2. splátka |
| **15.12.** | Záloha na daň z příjmů — poslední čtvrtletní záloha |
| **31.12.** | Silniční daň za předchozí rok (zrušena od 2022 pro osobní auta) |

### OSVČ — specifické termíny
- **Přehledy** pro ČSSZ a ZP: do 30 dnů po podání přiznání (nejpozději 30.6. bez poradce, 31.7. s poradcem)
- **Zálohy OSVČ**: měsíčně (SP do 20., ZP do 8.)
- **Paušální daň**: měsíčně do 20. dne (6 208 Kč v roce 2025)', NULL, 10);


-- ============================================================================
-- CATEGORY: vat (DPH pravidla)
-- ============================================================================

INSERT INTO knowledge_base (category, title, content, source_url, sort_order) VALUES
('vat', 'Sazby DPH 2024–2026', '## Sazby DPH platné od 1.1.2024

Od 1.1.2024 došlo ke **konsolidaci sazeb DPH** ze tří na dvě:

| Sazba | Procento | Použití |
|-------|----------|---------|
| **Základní** | 21% | Většina zboží a služeb |
| **Snížená** | 12% | Potraviny, léky, knihy, stavební práce, ubytování, stravovací služby, vodné/stočné, teplo, MHD |

### Co se změnilo oproti 2023
- Zrušena **druhá snížená sazba 10%** (sloučena do 12%)
- Zrušena **první snížená sazba 15%** (sloučena do 12%)
- Některé položky přeřazeny do základní sazby 21% (např. kadeřnické služby, úklidové služby)

### Přechodná ustanovení
- Faktury vystavené před 1.1.2024 s DUZP v roce 2024 → nová sazba 12% resp. 21%
- Zálohy přijaté před 1.1.2024, plnění po 1.1.2024 → dorovnání na novou sazbu

### Reverse charge (přenesení daňové povinnosti)
Vybraná plnění v tuzemsku, kde daň přiznává **odběratel** (ne dodavatel):
- Stavební a montážní práce (§ 92e)
- Dodání nemovité věci v určitých případech
- Dodání zlata, odpadů, obilovin (příloha č. 6)
- Dodání zboží po postoupení výhrady vlastnictví', 'https://www.zakonyprolidi.cz/cs/2004-235', 1);

INSERT INTO knowledge_base (category, title, content, source_url, sort_order) VALUES
('vat', 'Registrace k DPH', '## Registrace k DPH

### Povinná registrace
Osoba povinná k dani se musí registrovat, pokud:
- Obrat za **12 po sobě jdoucích měsíců** překročí **2 000 000 Kč** (od 2025)
- Pořízení zboží z EU překročí **326 000 Kč** za kalendářní rok
- Přijme službu od osoby neusazené v tuzemsku (identifikovaná osoba)

**Lhůta:** Přihláška do 15 dnů po skončení měsíce, ve kterém byl obrat překročen. Plátcem se stává od 1. dne druhého měsíce po překročení.

### Dobrovolná registrace
- Možná kdykoliv (i bez dosažení obratu)
- Výhodná pokud: většina odběratelů jsou plátci, nakupujete od plátců, obchodujete s EU
- Nevýhodná pokud: většina odběratelů jsou neplátci (zdražení pro ně)

### Zrušení registrace
- Po 12 měsících od registrace
- Obrat za 12 měsíců < 2 000 000 Kč
- Podání žádosti na FÚ

### Identifikovaná osoba
Zjednodušená registrace pro osoby, které:
- Pořizují zboží z EU (nad limit)
- Přijímají služby z EU
- **Nepodávají** běžné přiznání k DPH (jen za specifická plnění)
- **Nemají** nárok na odpočet DPH', 'https://www.zakonyprolidi.cz/cs/2004-235#p6', 2);

INSERT INTO knowledge_base (category, title, content, source_url, sort_order) VALUES
('vat', 'Kontrolní hlášení — kompletní průvodce', '## Kontrolní hlášení (KH)

### Co je KH?
Měsíční elektronický výkaz pro finanční úřad obsahující detailní rozpis všech přijatých a uskutečněných plnění. Slouží ke křížové kontrole (párování faktur dodavatel ↔ odběratel).

### Kdo podává
- **Všichni plátci DPH** (právnické i fyzické osoby)
- FO: měsíčně (i čtvrtletní plátci DPH!)
- PO: měsíčně

### Struktura KH

| Oddíl | Obsah | Limit |
|-------|-------|-------|
| **A.1** | Uskutečněná plnění v režimu reverse charge | Bez limitu |
| **A.2** | Přijatá zdanitelná plnění s místem plnění v tuzemsku | Bez limitu |
| **A.3** | Uskutečněná plnění - DIČ odběratele neuvedeno | Bez limitu |
| **A.4** | Uskutečněná plnění ≥ 10 000 Kč vč. DPH | ≥ 10 000 Kč |
| **A.5** | Uskutečněná plnění < 10 000 Kč | Souhrnně |
| **B.1** | Přijatá plnění v režimu reverse charge | Bez limitu |
| **B.2** | Přijatá plnění ≥ 10 000 Kč vč. DPH | ≥ 10 000 Kč |
| **B.3** | Přijatá plnění < 10 000 Kč | Souhrnně |

### Termín podání
- **25. den** následujícího měsíce
- Elektronicky přes datovou schránku nebo EPO (daňový portál)
- **Nelze** podat papírově!

### Sankce za nepodání
| Situace | Pokuta |
|---------|--------|
| Podání do 5 dnů po výzvě FÚ | 1 000 Kč |
| Podání po výzvě FÚ | 10 000 Kč |
| Nepodání ani po výzvě | 30 000 Kč |
| Opakované porušení | 50 000 Kč |

### Praktické tipy
- Vždy párujte s přiznáním k DPH (částky se musí shodovat)
- Oddíl A.4/B.2: uváděné DIČ odběratele/dodavatele musí existovat
- Evidenční číslo dokladu: přesně jak je na faktuře (pozor na formát)
- Kontrola před podáním: stáhněte XML, ověřte v EPO validátorem', NULL, 3);

INSERT INTO knowledge_base (category, title, content, source_url, sort_order) VALUES
('vat', 'Souhrnné hlášení', '## Souhrnné hlášení

### Kdy se podává
Povinné pro plátce DPH, kteří uskutečnili:
- **Dodání zboží** do jiného členského státu EU osobě registrované k DPH
- **Poskytnutí služby** s místem plnění v jiném členském státě EU (§ 9 odst. 1)
- **Přemístění obchodního majetku** do jiného členského státu

### Termín podání
- **Do 25. dne** následujícího měsíce (i čtvrtletní plátci podávají měsíčně, pokud dodávají zboží do EU)
- Elektronicky přes datovou schránku nebo EPO

### Obsah hlášení
- DIČ odběratele v jiném členském státě
- Kód země odběratele
- Celková hodnota plnění (v CZK)
- Kód plnění (0 = dodání zboží, 1 = přemístění, 2 = dodání v rámci třístranného obchodu, 3 = poskytnutí služby)

### Ověření DIČ odběratele
Před vystavením faktury bez DPH do EU **vždy ověřte platnost DIČ** odběratele v systému VIES (vies.ec.europa.eu). Neplatné DIČ = musíte fakturovat s českou DPH.', NULL, 4);


-- ============================================================================
-- CATEGORY: income_tax (Daň z příjmů)
-- ============================================================================

INSERT INTO knowledge_base (category, title, content, source_url, sort_order) VALUES
('income_tax', 'Daň z příjmů fyzických osob (DPFO)', '## Daň z příjmů fyzických osob

### Sazby daně (2025)
| Základ daně | Sazba |
|-------------|-------|
| Do 36násobku průměrné mzdy (~1 582 812 Kč/rok) | **15%** |
| Nad 36násobek | **23%** |

### Druhy příjmů (§ 6–10 ZDP)
1. **§ 6** — Příjmy ze závislé činnosti (zaměstnání)
2. **§ 7** — Příjmy ze samostatné činnosti (OSVČ, podnikání)
3. **§ 8** — Příjmy z kapitálového majetku (dividendy, úroky)
4. **§ 9** — Příjmy z nájmu
5. **§ 10** — Ostatní příjmy (příležitostné příjmy, prodej majetku)

### Slevy na dani (roční, 2025)

| Sleva | Částka/rok |
|-------|-----------|
| Na poplatníka | 30 840 Kč |
| Na invaliditu I./II. stupně | 2 520 Kč |
| Na invaliditu III. stupně | 5 040 Kč |
| Na držitele ZTP/P | 16 140 Kč |
| Na studenta | 4 020 Kč |
| Na manžela/manželku (příjem < 68 000) | 24 840 Kč |
| Daňové zvýhodnění na 1. dítě | 15 204 Kč |
| Daňové zvýhodnění na 2. dítě | 22 320 Kč |
| Daňové zvýhodnění na 3.+ dítě | 27 840 Kč |
| Příplatek na ZTP/P dítě | +dvojnásobek |

### Nezdanitelné části základu daně (§ 15)
- Úroky z hypotéčního úvěru (max 150 000 Kč/rok, od 2024 max 300 000 pro starší smlouvy)
- Penzijní připojištění (max 24 000 Kč/rok — úložka nad 1 000 Kč/měs)
- Životní pojištění (max 24 000 Kč/rok)
- Dary (min 2% ZD nebo 1 000 Kč, max 15% ZD; dar krve = 3 000 Kč)
- Odborové příspěvky (max 1,5% příjmů § 6, nejvýše 3 000 Kč)

### Paušální výdaje (OSVČ, § 7 odst. 7)

| Činnost | % z příjmů | Max. částka |
|---------|-----------|-------------|
| Zemědělská, řemeslná | 80% | 1 600 000 Kč |
| Živnostenská (ne řemeslná) | 60% | 1 200 000 Kč |
| Nájem | 30% | 600 000 Kč |
| Ostatní (§ 7/2 — autorská, znalecká) | 40% | 800 000 Kč |', 'https://www.zakonyprolidi.cz/cs/1992-586', 1);

INSERT INTO knowledge_base (category, title, content, source_url, sort_order) VALUES
('income_tax', 'Daň z příjmů právnických osob (DPPO)', '## Daň z příjmů právnických osob

### Sazba daně (2025)
- **21%** ze základu daně (od 2024, dříve 19%)

### Základ daně
Výsledek hospodaření (zisk/ztráta) z účetnictví, upravený o:

**Přičitatelné položky** (zvyšují základ):
- Daňově neuznatelné náklady (reprezentace, pokuty, penále)
- Účetní odpisy převyšující daňové
- Tvorba účetních (ne zákonných) opravných položek a rezerv
- Náklady na osobní spotřebu

**Odčitatelné položky** (snižují základ):
- Daňová ztráta (uplatnění do 5 let)
- Odpočet na výzkum a vývoj (§ 34 odst. 4)
- Odpočet na podporu odborného vzdělávání (§ 34f)
- Dary (max 10% upraveného ZD)

### Zálohy na DPPO

| Poslední známá daňová povinnost | Zálohy |
|--------------------------------|--------|
| Do 30 000 Kč | Žádné zálohy |
| 30 001–150 000 Kč | Pololetní (40% do 15.6. a 15.12.) |
| Nad 150 000 Kč | Čtvrtletní (25% do 15.3., 15.6., 15.9., 15.12.) |

### Specifika s.r.o.
- Podíly na zisku (dividendy): srážková daň **15%** (§ 36 odst. 2)
- Tantiémy členům orgánů: zdanění jako příjem § 6
- Zápůjčky společníkům: pozor na cenu obvyklou (úrok ≥ ČNB repo sazba)
- Osobní auto: krácení nákladů pokud i soukromé využití', 'https://www.zakonyprolidi.cz/cs/1992-586', 2);

INSERT INTO knowledge_base (category, title, content, source_url, sort_order) VALUES
('income_tax', 'Daňově uznatelné vs. neuznatelné náklady', '## Daňově uznatelné vs. neuznatelné náklady

### Daňově uznatelné (§ 24 ZDP)
Náklady vynaložené na dosažení, zajištění a udržení zdanitelných příjmů:

- Spotřeba materiálu a energie
- Nájemné (kancelář, sklad, vybavení)
- Mzdy a odvody zaměstnanců
- Cestovní náhrady (dle zákoníku práce)
- Odpisy majetku (daňové)
- Opravy a udržování majetku
- Pojistné (odpovědnostní, majetkové)
- Telefon, internet, poštovné
- Reklama a propagace
- Účetní a daňové poradenství
- Zákonné opravné položky k pohledávkám
- Zákonné rezervy
- Školení zaměstnanců související s činností
- Finanční náklady (úroky z úvěrů na podnikání)

### Daňově neuznatelné (§ 25 ZDP)

| Náklad | Důvod |
|--------|-------|
| Pokuty a penále (státní orgány) | § 25/1f |
| Reprezentace (občerstvení, dary klientům) | § 25/1t |
| Manka a škody (nad náhradu) | § 25/1n |
| Osobní spotřeba podnikatele | § 25/1u |
| Účetní odpisy převyšující daňové | Rozdíl § 26 vs. účetní |
| Tvorba účetních OP a rezerv | § 25/1i |
| Dary (nad limit) | § 25/1t |
| Náklady na pořízení DM (nutno odpisovat) | § 25/1a |
| DPH u plátce (pokud má nárok na odpočet) | § 25/1c |
| Pojistné OSVČ (sociální, zdravotní) | § 25/1g |

### Hraniční případy
- **Firemní auto i pro soukromé účely**: poměrné krácení (dle knihy jízd) nebo 1% z PC jako nepeněžní příjem zaměstnance
- **Telefon**: pokud i soukromé využití, krátit poměrem (např. 80:20)
- **Nájem home office**: propočet dle m² a podílu na pracovní činnosti
- **Stravné/stravenky**: do limitu daňově uznatelné, nad limit neuznatelné', 'https://www.zakonyprolidi.cz/cs/1992-586#p24', 3);

INSERT INTO knowledge_base (category, title, content, source_url, sort_order) VALUES
('income_tax', 'Daňová evidence OSVČ', '## Daňová evidence (jednoduché účetnictví)

### Kdo může vést
OSVČ, které nejsou účetní jednotkou (obrat < 25 mil. Kč, nezapsané v OR).

### Co evidovat
1. **Příjmy a výdaje** — v členění na daňové a nedaňové
2. **Majetek a dluhy** — přehled na konci zdaňovacího období

### Kniha příjmů a výdajů
| Datum | Doklad | Popis | Příjem daňový | Příjem nedaňový | Výdaj daňový | Výdaj nedaňový |
|-------|--------|-------|---------------|-----------------|--------------|----------------|
| 5.1. | FV-001 | Tržba za služby | 15 000 | | | |
| 8.1. | PP-001 | Nákup materiálu | | | 3 200 | |
| 10.1. | BV-001 | Osobní vklad | | 50 000 | | |

### Evidence pohledávek a závazků
- Seznam neuhrazených vystavených faktur (pohledávky)
- Seznam neuhrazených přijatých faktur (závazky)
- K 31.12. = základ pro uzávěrkové úpravy (§ 23/8 ZDP)

### Uzávěrkové úpravy na konci roku
Základ daně = příjmy - výdaje ± úpravy:
- **+** neuhrazené závazky po splatnosti > 30 měsíců (dodanění)
- **+** zůstatky zákonných rezerv při ukončení činnosti
- **-** příjmy osvobozené (pojistná plnění v určitých případech)

### Výhody vs. nevýhody

| Daňová evidence | Podvojné účetnictví |
|-----------------|---------------------|
| Jednodušší vedení | Komplexní přehled o firmě |
| Příjmy/výdaje (cash basis) | Výnosy/náklady (akruální princip) |
| Bez rozvahy a VZZ | Povinná účetní závěrka |
| Nižší náklady na účetní | Vyšší náklady, ale lepší kontrola |
| Paušální výdaje možné | Paušální výdaje nelze (ÚJ) |', NULL, 4);


-- ============================================================================
-- CATEGORY: payroll (Mzdové účetnictví)
-- ============================================================================

INSERT INTO knowledge_base (category, title, content, source_url, sort_order) VALUES
('payroll', 'Výpočet mzdy 2025 — krok za krokem', '## Výpočet čisté mzdy 2025

### Vstupní údaje
- Hrubá mzda (HM)
- Podepsané prohlášení k dani (ano/ne)
- Počet dětí (pro daňové zvýhodnění)
- Invalidita, student (pro slevy)

### Postup výpočtu

#### 1. Odvody zaměstnance
| Odvod | Sazba | Z čeho |
|-------|-------|--------|
| Sociální pojištění | **7,1%** | z HM (od 2024, dříve 6,5%) |
| Zdravotní pojištění | **4,5%** | z HM |
| **Celkem zaměstnanec** | **11,6%** | |

#### 2. Základ daně
Základ daně = HM - sociální (7,1%) - zdravotní (4,5%)

**Pozn.:** Od 2024 se superhrubá mzda nepoužívá (zrušena 2021).

#### 3. Záloha na daň
- 15% ze základu daně (zaokrouhleno na celé Kč nahoru)
- Nad 4× průměrnou mzdu měsíčně: 23% z přebytku

#### 4. Slevy na dani
- Na poplatníka: 2 570 Kč/měsíc (pokud podepsané prohlášení)
- Na invaliditu, studenta: poměrná měsíční část

#### 5. Daňové zvýhodnění na děti
- 1. dítě: 1 267 Kč/měsíc
- 2. dítě: 1 860 Kč/měsíc
- 3.+ dítě: 2 320 Kč/měsíc
- Pokud zvýhodnění > záloha → daňový bonus (vyplacen zaměstnanci)

#### 6. Čistá mzda
**Čistá mzda = HM - SP zaměstnanec - ZP zaměstnanec - záloha na daň + daňový bonus**

### Příklad: HM 40 000 Kč, prohlášení ANO, 2 děti

| Položka | Částka |
|---------|--------|
| Hrubá mzda | 40 000 Kč |
| SP zaměstnanec (7,1%) | -2 840 Kč |
| ZP zaměstnanec (4,5%) | -1 800 Kč |
| Základ daně | 35 360 Kč |
| Záloha na daň (15%) | 5 304 Kč |
| Sleva na poplatníka | -2 570 Kč |
| Záloha po slevě | 2 734 Kč |
| Zvýhodnění 1. dítě | -1 267 Kč |
| Zvýhodnění 2. dítě | -1 860 Kč |
| Záloha k úhradě | 0 Kč (bonus -393 Kč) |
| **Čistá mzda** | **36 553 Kč** |

### Odvody zaměstnavatele

| Odvod | Sazba |
|-------|-------|
| SP zaměstnavatel | **24,8%** |
| ZP zaměstnavatel | **9%** |
| **Celkem zaměstnavatel** | **33,8%** |
| **Celkové náklady na zaměstnance** | HM × 1,338 |', NULL, 1);

INSERT INTO knowledge_base (category, title, content, source_url, sort_order) VALUES
('payroll', 'DPP a DPČ — pravidla a limity', '## Dohody mimo pracovní poměr

### Dohoda o provedení práce (DPP)

| Parametr | Hodnota |
|----------|---------|
| Max rozsah | **300 hodin/rok** u jednoho zaměstnavatele |
| Limit pro odvody | **10 000 Kč/měsíc** |
| Pod limit | Bez SP a ZP, srážková daň 15% (bez prohlášení) |
| Nad limit | Plné odvody jako HPP |
| Sledování od 2025 | Souhrn DPP u VŠECH zaměstnavatelů (**77 500 Kč/rok**) |

### Dohoda o pracovní činnosti (DPČ)

| Parametr | Hodnota |
|----------|---------|
| Max rozsah | **20 hodin/týden** (průměr za období) |
| Limit pro odvody | **4 000 Kč/měsíc** |
| Pod limit | Bez SP a ZP |
| Nad limit | Plné odvody |
| Doba trvání | Na dobu určitou i neurčitou |
| Výpovědní doba | 15 dnů (není-li sjednáno jinak) |

### Porovnání DPP vs. DPČ vs. HPP

| | HPP | DPP | DPČ |
|---|---|---|---|
| Max hodiny | Plný úvazek | 300h/rok | 20h/týden |
| Odvody | Vždy | Od 10 001 Kč | Od 4 001 Kč |
| Dovolená | Ano | Ne (pokud nesjednána) | Ne (pokud nesjednána) |
| Výpovědní doba | 2 měsíce | 15 dnů | 15 dnů |
| Nemocenská | Ano | Od 15. dne (nad limit) | Od 15. dne (nad limit) |

### Nová pravidla od 2025
- **Oznámení DPP**: zaměstnavatel musí hlásit všechny DPP na ČSSZ
- **Souběh DPP**: sleduje se celkový příjem ze všech DPP (limit 77 500 Kč/rok)
- **Při překročení**: zpětné dopočítání odvodů', NULL, 2);

INSERT INTO knowledge_base (category, title, content, source_url, sort_order) VALUES
('payroll', 'Roční zúčtování daně zaměstnanců', '## Roční zúčtování daně

### Co to je
Náhrada za podání daňového přiznání. Zaměstnavatel provede výpočet roční daně a vrátí/doplatí rozdíl oproti měsíčním zálohám.

### Kdo může požádat
Zaměstnanec, který:
- Měl příjmy pouze od **jednoho zaměstnavatele** (nebo postupně od více, ale ne současně)
- Podepsal **prohlášení poplatníka** u zaměstnavatele
- **Neměl** jiné příjmy > 6 000 Kč (§ 7–10)
- **Nepodává** daňové přiznání z jiného důvodu

### Termíny
- **15. února** — zaměstnanec požádá o roční zúčtování + doloží podklady
- **31. března** — zaměstnavatel provede zúčtování
- **Nejbližší výplata po zúčtování** — vrácení přeplatku zaměstnanci

### Co zaměstnanec dokládá
- Potvrzení o úrocích z hypotéky/úvěru na bydlení
- Potvrzení o platbách penzijního připojištění
- Potvrzení o platbách životního pojištění
- Potvrzení o darech (potvrzení příjemce)
- Potvrzení o příjmech manžela/manželky (pro slevu na manžela)
- Rodné listy dětí (pro daňové zvýhodnění)
- Potvrzení o studiu (pro slevu na studenta)
- Potvrzení o invaliditě (pokud invalidní)

### Výpočet roční daně
1. Roční příjem (úhrn HM za rok)
2. Minus roční odvody SP + ZP
3. = Roční základ daně
4. Minus nezdanitelné části (§ 15): úroky, penzijko, životko, dary
5. = Upravený základ daně (zaokrouhleno na 100 dolů)
6. × 15% (23% z přebytku nad 36násobek)
7. = Roční daň
8. Minus slevy (§ 35ba): poplatník, invalidita, student, manžel/ka
9. Minus zvýhodnění na děti (§ 35c)
10. = Roční daň po slevách (může být záporná = bonus)
11. Minus zaplacené zálohy = přeplatek/nedoplatek', NULL, 3);

INSERT INTO knowledge_base (category, title, content, source_url, sort_order) VALUES
('payroll', 'Minimální mzda a zaručená mzda 2025', '## Minimální a zaručená mzda 2025

### Minimální mzda
- **20 800 Kč/měsíc** (při 40h/týden)
- **124,40 Kč/hodina**

### Zaručená mzda (8 skupin)

Minimální úroveň mzdy dle složitosti práce:

| Skupina | Popis | Měsíčně | Hodinově |
|---------|-------|---------|----------|
| 1. | Jednoduché práce (uklízečka, vrátný) | 20 800 Kč | 124,40 Kč |
| 2. | Jednoduché odborné (prodavačka, řidič) | 22 000 Kč | 131,60 Kč |
| 3. | Odborné (účetní asistent, technik) | 24 300 Kč | 145,30 Kč |
| 4. | Složitější odborné (hlavní účetní) | 26 800 Kč | 160,20 Kč |
| 5. | Specializované (daňový poradce) | 29 600 Kč | 177,00 Kč |
| 6. | Systémové (manažer, hlavní inženýr) | 32 700 Kč | 195,50 Kč |
| 7. | Tvůrčí systémové (ředitel úseku) | 36 100 Kč | 215,80 Kč |
| 8. | Nejsložitější (top management) | 41 600 Kč | 248,80 Kč |

### Minimální zálohy OSVČ 2025
- **SP (sociální pojištění)**: minimální záloha 3 852 Kč/měs (29,2% z min. vyměřovacího základu)
- **ZP (zdravotní pojištění)**: minimální záloha 2 968 Kč/měs (13,5% z min. VZ = 1/2 průměrné mzdy)

### Paušální daň OSVČ 2025
Jednoduché řešení pro OSVČ s příjmy do 2 mil. Kč (neplátce DPH):

| Pásmo | Příjmy do | Měsíční paušál |
|-------|-----------|----------------|
| 1. pásmo | 1 000 000 Kč | **7 498 Kč** |
| 2. pásmo | 1 500 000 Kč | **16 000 Kč** |
| 3. pásmo | 2 000 000 Kč | **26 000 Kč** |

Paušální daň zahrnuje: zálohu na SP + ZP + daň z příjmů. Žádné přiznání!', NULL, 4);


-- ============================================================================
-- CATEGORY: laws (Účetní zákony)
-- ============================================================================

INSERT INTO knowledge_base (category, title, content, source_url, sort_order) VALUES
('laws', 'Zákon č. 563/1991 Sb., o účetnictví', '## Zákon o účetnictví

Základní právní norma upravující účetnictví v České republice. Stanoví rozsah a způsob vedení účetnictví, požadavky na jeho průkaznost a podmínky předávání účetních záznamů.

### Klíčová ustanovení
- **§ 1** — Předmět úpravy: rozsah a způsob vedení účetnictví
- **§ 2** — Účetní jednotky: kdo je povinen vést účetnictví
- **§ 3** — Účetní období: kalendářní nebo hospodářský rok (12 měsíců)
- **§ 4** — Povinnosti účetní jednotky: vést účetnictví úplně, průkazně, správně
- **§ 7** — Věrný a poctivý obraz: účetní závěrka musí podávat věrný obraz
- **§ 8** — Účetní knihy: deník, hlavní kniha, knihy analytických a podrozvahových účtů
- **§ 9** — Jednoduché účetnictví: podmínky pro vedení
- **§ 19** — Účetní závěrka: rozvaha, výkaz zisku a ztráty, příloha
- **§ 20** — Ověření účetní závěrky auditorem
- **§ 29** — Inventarizace majetku a závazků
- **§ 31** — Úschova účetních záznamů (účetní závěrka 10 let, doklady 5 let)

### Kategorie účetních jednotek (od 2016)
| Kategorie | Aktiva | Obrat | Zaměstnanci |
|-----------|--------|-------|-------------|
| Mikro | < 9 mil. | < 18 mil. | < 10 |
| Malá | < 100 mil. | < 200 mil. | < 50 |
| Střední | < 500 mil. | < 1 mld. | < 250 |
| Velká | ≥ 500 mil. | ≥ 1 mld. | ≥ 250 |

### Poslední významné novely
- Novela 2024: elektronické účetní doklady, digitální archivace
- Novela 2016: kategorizace účetních jednotek (transpozice EU směrnice)', 'https://www.zakonyprolidi.cz/cs/1991-563', 1);

INSERT INTO knowledge_base (category, title, content, source_url, sort_order) VALUES
('laws', 'Zákon č. 235/2004 Sb., o DPH', '## Zákon o DPH

Upravuje daň z přidané hodnoty v ČR, implementuje evropské směrnice o DPH.

### Klíčová ustanovení
- **§ 2** — Předmět daně: dodání zboží, poskytnutí služby, pořízení z EU, dovoz
- **§ 5** — Osoby povinné k dani
- **§ 6** — Registrace: obrat > 2 mil. Kč za 12 měsíců (od 2025)
- **§ 21** — Uskutečnění zdanitelného plnění (DUZP)
- **§ 36** — Základ daně
- **§ 47** — Sazby daně (základní 21%, snížená 12%)
- **§ 72-79** — Odpočet daně, nárok, podmínky
- **§ 92a-92i** — Reverse charge
- **§ 101a** — Kontrolní hlášení

### Sazby DPH (od 1.1.2024)
| Sazba | % | Příklady |
|-------|---|---------|
| Základní | 21% | Většina zboží a služeb |
| Snížená | 12% | Potraviny, léky, knihy, stavební práce, ubytování |', 'https://www.zakonyprolidi.cz/cs/2004-235', 2);

INSERT INTO knowledge_base (category, title, content, source_url, sort_order) VALUES
('laws', 'Zákon č. 586/1992 Sb., o daních z příjmů', '## Zákon o daních z příjmů (ZDP)

Upravuje daň z příjmů fyzických osob (DPFO) i právnických osob (DPPO).

### Struktura zákona
| Část | Obsah |
|------|-------|
| Část 1 (§ 1–16b) | Daň z příjmů FO |
| Část 2 (§ 17–21a) | Daň z příjmů PO |
| Část 3 (§ 22–38s) | Společná ustanovení |
| Část 4 (§ 38t-38x) | Zvláštní ustanovení |

### Klíčové sazby
- DPFO: **15%** (23% nad limit)
- DPPO: **21%** (od 2024)
- Srážková daň: **15%** (dividendy, DPP pod limit bez prohlášení)', 'https://www.zakonyprolidi.cz/cs/1992-586', 3);

INSERT INTO knowledge_base (category, title, content, source_url, sort_order) VALUES
('laws', 'Zákon č. 262/2006 Sb., zákoník práce', '## Zákoník práce

Základní předpis pracovního práva ČR.

### Pro účetní nejdůležitější části

**Mzda a plat (§ 109–150)**
- Minimální mzda, zaručená mzda
- Příplatky: přesčas (+25%), noční (+10%), sobota/neděle (+10%), svátek (+100%)
- Náhrada mzdy za dovolenou, svátek, nemoc (prvních 14 dní)

**Cestovní náhrady (§ 151–189)**
- Stravné, jízdné, ubytování
- Sazby: vyhláška MPSV (aktualizace ročně)
- Zahraniční stravné: vyhláška MF

**Dovolená (§ 211–223)**
- Zákonný nárok: **4 týdny** (5 týdnů u státních zaměstnanců)
- Výpočet: poměrně dle odpracovaných dnů

**Dohody o pracích konaných mimo pracovní poměr (§ 74–77)**
- DPP: max 300h/rok, limit 10 000 Kč
- DPČ: max 20h/týden, limit 4 000 Kč

**Srážky ze mzdy (§ 145–150)**
- Exekuce, alimenty, insolvence
- Nezabavitelná částka, třetiny', 'https://www.zakonyprolidi.cz/cs/2006-262', 4);


-- ============================================================================
-- CATEGORY: standards (Účetní standardy)
-- ============================================================================

INSERT INTO knowledge_base (category, title, content, source_url, sort_order) VALUES
('standards', 'Přehled ČÚS 001–024', '## České účetní standardy pro podnikatele

Účetní standardy zpřesňují postupy účtování podle vyhlášky 500/2002 Sb.

| ČÚS | Název | Hlavní obsah |
|-----|-------|-------------|
| **001** | Účty a zásady účtování | Otevírání/uzavírání účtů, účtový rozvrh |
| **002** | Otevírání a uzavírání účetních knih | Zahajovací rozvaha, uzávěrkové operace |
| **003** | Odložená daň | Výpočet a účtování odložené daně |
| **004** | Rezervy | Zákonné a účetní rezervy, tvorba a rozpouštění |
| **005** | Opravné položky | Tvorba a zúčtování OP k majetku |
| **006** | Kurzové rozdíly | Přepočet cizích měn, účtování kurzových rozdílů |
| **007** | Inventarizační rozdíly | Manka, přebytky, škody — zaúčtování |
| **008** | Operace s CP a podíly | Pořízení, prodej, přecenění cenných papírů |
| **009** | Deriváty | Zajišťovací a spekulativní deriváty |
| **011** | Operace s podnikem | Koupě, vklad, nájem podniku |
| **012** | Změny VK | ZK, fondy, nerozdělený zisk |
| **013** | DHM a DNM | Pořízení, odpisy, technické zhodnocení, vyřazení |
| **014** | Dlouhodobý finanční majetek | Pořízení, přecenění, prodej podílů |
| **015** | Zásoby | Pořízení, skladování, úbytek, inventura |
| **016** | Krátkodobý finanční majetek | Peníze, bankovní účty, ceniny |
| **017** | Zúčtovací vztahy | Pohledávky, závazky, zaměstnanci, instituce |
| **018** | Kapitálové účty | ZK, kapitálové fondy, fondy ze zisku |
| **019** | Náklady a výnosy | Časové rozlišení, dohadné položky |
| **020** | Konsolidace | Konsolidovaná účetní závěrka |
| **021** | Vyrovnání, nucené vyrovnání, konkurz | Účtování v insolvenci |
| **023** | Přehled o peněžních tocích | Cash flow — přímá a nepřímá metoda |
| **024** | Srovnatelné období | Opravy minulých období |

### Nejpoužívanější standardy
- **ČÚS 013** (DHM) — odpisy, technické zhodnocení, pořízení a vyřazení
- **ČÚS 015** (Zásoby) — metody oceňování (FIFO, vážený průměr)
- **ČÚS 017** (Zúčtovací vztahy) — pohledávky a závazky
- **ČÚS 019** (Náklady a výnosy) — časové rozlišení', NULL, 1);


-- ============================================================================
-- CATEGORY: decrees (Vyhlášky)
-- ============================================================================

INSERT INTO knowledge_base (category, title, content, source_url, sort_order) VALUES
('decrees', 'Vyhláška č. 500/2002 Sb. — pro podnikatele', '## Vyhláška č. 500/2002 Sb.

Prováděcí vyhláška k zákonu o účetnictví **pro podnikatele** účtující v soustavě podvojného účetnictví. Nejdůležitější vyhláška pro běžnou účetní praxi.

### Hlavní části

**Účetní závěrka (§ 3–44)**
- Rozvaha: uspořádání aktiv a pasiv
- VZZ: druhové a účelové členění
- Příloha: informace o účetních metodách, doplňující údaje

**Směrná účtová osnova (§ 45–46)**
- Účtové třídy 0–9 a jejich skupiny
- Závazné na úrovni skupin, syntetické účty si volí ÚJ

**Účetní metody (§ 47–61b)**
- **Oceňování**: pořizovací cena, reprodukční PC, vlastní náklady
- **Odpisy**: rovnoměrné, zrychlené, výkonové
- **Zásoby**: FIFO, vážený průměr
- **Opravné položky a rezervy**: tvorba a zúčtování
- **Časové rozlišení**: 381, 383, 384, 385, 388, 389

### Mikro a malé ÚJ
- Zjednodušený rozsah rozvahy a VZZ
- Nemusí sestavovat přehled o peněžních tocích
- Zjednodušená příloha', 'https://www.zakonyprolidi.cz/cs/2002-500', 1);

INSERT INTO knowledge_base (category, title, content, source_url, sort_order) VALUES
('decrees', 'Pokyn GFŘ D-59 — daňové odpisy', '## Pokyn GFŘ D-59

Pokyn Generálního finančního ředitelství k uplatňování některých ustanovení zákona o daních z příjmů. Praktický výklad pravidel pro odpisy a další oblasti.

### Odpisy hmotného majetku

#### Odpisové skupiny

| Skupina | Doba odpisu | Příklady majetku |
|---------|-------------|------------------|
| 1 | 3 roky | Počítače, kancelářské stroje, telefony |
| 2 | 5 let | Osobní automobily, nábytek, stroje |
| 3 | 10 let | Klimatizace, výtahy, turbíny |
| 4 | 20 let | Budovy ze dřeva a plastů, oplocení |
| 5 | 30 let | Budovy (kromě sk. 4 a 6) |
| 6 | 50 let | Budovy hotelů, administrativní, obchodní domy |

#### Rovnoměrné odpisy (§ 31)
| Skupina | 1. rok | Další roky |
|---------|--------|------------|
| 1 | 20% | 40% |
| 2 | 11% | 22,25% |
| 3 | 5,5% | 10,5% |
| 4 | 2,15% | 5,15% |
| 5 | 1,4% | 3,4% |
| 6 | 1,02% | 2,02% |

#### Zrychlené odpisy (§ 32)
- 1. rok: PC / koeficient pro 1. rok
- Další roky: (2 × ZC) / (koeficient - počet let)
- Koeficienty: sk.1 (3,4), sk.2 (5,6), sk.3 (10,11), atd.

### Technické zhodnocení
- Limit: > **80 000 Kč** za zdaňovací období (od 2021)
- Pod limit: jednorázový náklad (pokud se ÚJ nerozhodne aktivovat)
- Nad limit: zvýší vstupní/zůstatkovou cenu majetku, pokračuje se v odpisování', 'https://www.financnisprava.cz/cs/dane/novinky/2023/pokyn-gfr-d-59', 2);


-- ============================================================================
-- CATEGORY: chart_of_accounts (Účtová osnova)
-- ============================================================================

INSERT INTO knowledge_base (category, title, content, source_url, sort_order) VALUES
('chart_of_accounts', 'Přehled účtových tříd 0–9', '## Účtová osnova — přehled tříd

### Rozvahové účty (třídy 0–4)

| Třída | Název | Typ | Příklady účtů |
|-------|-------|-----|---------------|
| **0** | Dlouhodobý majetek | Aktiva | 01x DHM, 02x DHM, 07x oprávky, 08x oprávky |
| **1** | Zásoby | Aktiva | 11x materiál, 12x zásoby, 13x zboží |
| **2** | Krátkodobý fin. majetek | Aktiva | 21x peníze, 22x banka, 23x kr. úvěry |
| **3** | Zúčtovací vztahy | Aktiva/Pasiva | 31x pohledávky, 32x závazky, 33x zaměstnanci, 34x daně |
| **4** | Kapitálové účty | Pasiva | 41x ZK, 42x fondy, 43x VH |

### Výsledkové účty (třídy 5–6)

| Třída | Název | Příklady účtů |
|-------|-------|---------------|
| **5** | Náklady | 50x spotřeba, 51x služby, 52x osobní náklady, 53x daně, 54x jiné provozní, 56x finanční |
| **6** | Výnosy | 60x tržby za výrobky, 60x tržby za služby, 64x jiné provozní, 66x finanční |

### Závěrkové a podrozvahové účty

| Třída | Název | Použití |
|-------|-------|---------|
| **7** | Závěrkové účty | 710 počáteční účet rozvažný, 702 konečný účet rozvažný, 710 účet zisků a ztrát |
| **8–9** | Vnitropodnikové účetnictví | Volitelné, pro nákladové střediska, kalkulace |

### Nejpoužívanější účty (syntetické)

| Účet | Název |
|------|-------|
| 211 | Pokladna |
| 221 | Bankovní účty |
| 311 | Pohledávky z obchodních vztahů |
| 321 | Závazky z obchodních vztahů |
| 331 | Zaměstnanci |
| 336 | Zúčtování s institucemi SP a ZP |
| 341 | Daň z příjmů |
| 343 | DPH |
| 381 | Náklady příštích období |
| 384 | Výnosy příštích období |
| 395 | Vnitřní zúčtování |
| 411 | Základní kapitál |
| 431 | Výsledek hospodaření ve schvalovacím řízení |
| 501 | Spotřeba materiálu |
| 502 | Spotřeba energie |
| 511 | Opravy a udržování |
| 518 | Ostatní služby |
| 521 | Mzdové náklady |
| 524 | Zákonné sociální pojištění |
| 551 | Odpisy DHM a DNM |
| 601/602 | Tržby za vlastní výrobky/služby |', NULL, 1);
