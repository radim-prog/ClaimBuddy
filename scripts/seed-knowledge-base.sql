-- Seed Knowledge Base with Czech accounting laws, standards, and procedures
-- Run via Supabase Management API

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
- Novela 2016: kategorizace účetních jednotek (transpozice EU směrnice)', 'https://www.zakonyprolidi.cz/cs/1991-563', 1),

('laws', 'Zákon č. 235/2004 Sb., o dani z přidané hodnoty', '## Zákon o DPH

Upravuje daň z přidané hodnoty v ČR, implementuje evropské směrnice o DPH.

### Klíčová ustanovení
- **§ 2** — Předmět daně: dodání zboží, poskytnutí služby, pořízení z EU, dovoz
- **§ 4** — Vymezení pojmů: úplata, jednotková cena, obrat
- **§ 5** — Osoby povinné k dani
- **§ 6** — Registrace: obrat > 2 mil. Kč za 12 měsíců (od 2025)
- **§ 21** — Uskutečnění zdanitelného plnění
- **§ 36** — Základ daně
- **§ 47** — Sazby daně (základní 21%, snížená 12%)
- **§ 72-79** — Odpočet daně, nárok, podmínky
- **§ 92a-92i** — Režim přenesení daňové povinnosti (reverse charge)
- **§ 101a** — Kontrolní hlášení: povinnost, termíny, sankce

### Sazby DPH (od 1.1.2024)
| Sazba | Procento | Příklady |
|-------|----------|---------|
| Základní | 21% | Většina zboží a služeb |
| Snížená | 12% | Potraviny, léky, knihy, stavební práce, ubytování |

**Pozn.:** Od 2024 sloučeny dvě snížené sazby (10% a 15%) do jedné 12%.

### Zdaňovací období
- **Měsíční** — obrat > 10 mil. Kč, nebo první rok po registraci
- **Čtvrtletní** — obrat ≤ 10 mil. Kč (volitelně)

### Kontrolní hlášení
- Termín: 25. den po skončení zdaňovacího období
- Podání pouze elektronicky (datová schránka)
- Sankce za nepodání: 10 000–500 000 Kč', 'https://www.zakonyprolidi.cz/cs/2004-235', 2),

('laws', 'Zákon č. 586/1992 Sb., o daních z příjmů', '## Zákon o daních z příjmů

Upravuje daň z příjmů fyzických osob (DPFO) a daň z příjmů právnických osob (DPPO).

### Část první: DPFO (§ 2–16b)
- **§ 6** — Příjmy ze závislé činnosti (zaměstnání)
- **§ 7** — Příjmy ze samostatné činnosti (podnikání, OSVČ)
- **§ 8** — Příjmy z kapitálového majetku
- **§ 9** — Příjmy z nájmu
- **§ 10** — Ostatní příjmy
- **§ 15** — Nezdanitelná část základu daně (dary, úroky z hypo, penzijko, životko)
- **§ 16** — Sazba daně: **15%** (do 36× průměrné mzdy), **23%** (nad 36× PM)
- **§ 35ba** — Slevy na dani (viz sekce Daň z příjmů)

### Část druhá: DPPO (§ 17–21a)
- **§ 17** — Poplatníci: právnické osoby se sídlem v ČR
- **§ 18** — Předmět daně
- **§ 21** — Sazba daně: **21%** (od 2024, dříve 19%)
- **§ 23** — Základ daně: výsledek hospodaření ± úpravy
- **§ 24** — Daňově uznatelné náklady
- **§ 25** — Daňově neuznatelné náklady

### Paušální výdaje (§ 7 odst. 7)
| Činnost | Procento | Max. částka |
|---------|----------|-------------|
| Zemědělství, řemesla | 80% | 1 600 000 Kč |
| Živnostenské podnikání | 60% | 1 200 000 Kč |
| Nájem | 30% | 600 000 Kč |
| Ostatní příjmy § 7 | 40% | 800 000 Kč |', 'https://www.zakonyprolidi.cz/cs/1992-586', 3),

('laws', 'Zákon č. 89/2012 Sb., občanský zákoník (NOZ)', '## Občanský zákoník — relevantní části pro účetnictví

### Obchodní korporace (ve vazbě na ZOK 90/2012)
- **§ 420** — Podnikatel: definice
- **§ 421** — Obchodní firma
- **§ 502** — Obchodní závod
- **§ 1721–1745** — Závazky ze smluv: vznik, změna, zánik

### Smlouvy relevantní pro účetnictví
- **§ 2079** — Kupní smlouva
- **§ 2201** — Smlouva o dílo
- **§ 2201** — Nájemní smlouva
- **§ 2395** — Smlouva o úvěru
- **§ 2631** — Smlouva příkazní

### Promlčení (důležité pro pohledávky)
- **§ 629** — Obecná promlčecí lhůta: **3 roky**
- **§ 630** — Maximální promlčecí lhůta: 15 let
- Opravné položky k pohledávkám se tvoří dle stáří pohledávky', 'https://www.zakonyprolidi.cz/cs/2012-89', 4),

('laws', 'Zákon č. 262/2006 Sb., zákoník práce', '## Zákoník práce — mzdová a účetní relevance

### Pracovněprávní vztahy
- **§ 33** — Pracovní poměr: vznik pracovní smlouvou
- **§ 34** — Náležitosti pracovní smlouvy
- **§ 74–77** — Dohody mimo pracovní poměr (DPP, DPČ)

### Mzdy a odměny
- **§ 109** — Mzda, plat, odměna z dohody
- **§ 111** — Minimální mzda (2025: 20 800 Kč/měsíc, 124,40 Kč/hod)
- **§ 112** — Zaručená mzda: 8 skupin podle složitosti práce
- **§ 114** — Mzda za práci přesčas: +25% (příplatek)
- **§ 115** — Mzda za svátek
- **§ 116** — Mzda za noční práci: +10%
- **§ 117** — Mzda za práci v sobotu/neděli: +10%
- **§ 118** — Mzda za práci ve ztíženém prostředí

### Dovolená
- **§ 211** — Základní výměra: 4 týdny (5 týdnů u zaměstnavatelů dle § 109/3)
- **§ 222** — Náhrada mzdy za dovolenou: průměrný výdělek

### Cestovní náhrady
- **§ 151–189** — Tuzemské a zahraniční pracovní cesty
- **§ 157** — Stravné: výše dle vyhlášky MPSV
- **§ 158** — Základní sazba náhrady za 1 km (2025: 5,60 Kč)

### DPP a DPČ (2025)
| Typ | Limit | Pojistné |
|-----|-------|----------|
| DPP | max 300 hod/rok u 1 zaměstnavatele | od 10 001 Kč (souhrn) SP+ZP |
| DPČ | max ½ týdenního úvazku | od 4 000 Kč (rozhodný příjem) SP+ZP |', 'https://www.zakonyprolidi.cz/cs/2006-262', 5);

-- ============================================================================
-- CATEGORY: standards (Účetní standardy)
-- ============================================================================

INSERT INTO knowledge_base (category, title, content, source_url, sort_order) VALUES
('standards', 'České účetní standardy (ČÚS) — přehled', '## České účetní standardy pro podnikatele

Vydávány MF ČR, upřesňují postupy účtování dle zákona o účetnictví a prováděcích vyhlášek.

| ČÚS | Název | Klíčový obsah |
|------|-------|--------------|
| 001 | Účty a zásady účtování na účtech | Směrná účtová osnova, otevírání/uzavírání knih |
| 002 | Otevírání a uzavírání účetních knih | Počáteční a konečný účet rozvažný |
| 003 | Odložená daň | Výpočet a účtování odložené daně |
| 004 | Rezervy | Tvorba a čerpání rezerv |
| 005 | Opravné položky | Tvorba a zúčtování opravných položek |
| 006 | Kurzové rozdíly | Přepočet cizích měn, kurzové zisky/ztráty |
| 007 | Inventarizační rozdíly | Manka, přebytky, postup vypořádání |
| 008 | Operace s CP a podíly | Nákup, prodej, přecenění cenných papírů |
| 009 | Deriváty | Zajišťovací a spekulativní deriváty |
| 011 | Operace s obchodním závodem | Prodej/koupě podniku |
| 012 | Změny vlastního kapitálu | Zvýšení/snížení ZK, fondy |
| 013 | Dlouhodobý hmotný a nehmotný majetek | Pořízení, odpisy, vyřazení |
| 014 | Dlouhodobý finanční majetek | Podíly, dluhopisy, půjčky |
| 015 | Zásoby | Způsob A a B, oceňování |
| 016 | Krátkodobý finanční majetek a bankovní úvěry | Pokladna, BÚ, úvěry |
| 017 | Zúčtovací vztahy | Pohledávky a závazky |
| 018 | Kapitálové účty a dlouhodobé závazky | ZK, fondy, dlouhodobé půjčky |
| 019 | Náklady a výnosy | Časové rozlišení, dohadné položky |
| 020 | Konsolidace | Plná, poměrná, ekvivalenční metoda |
| 021 | Vyrovnání, nucené vyrovnání, konkurz | Specifické postupy |
| 022 | Inventarizace majetku a závazků | Postup, termíny, dokumentace |
| 023 | Přehled o peněžních tocích (cash flow) | Přímá a nepřímá metoda |
| 024 | Srovnatelné období za účetní období | Korekce minulého období |', 'https://www.mfcr.cz/cs/verejny-sektor/ucetnictvi-a-ucetni-vykaznictvi/ucetni-standardy', 1),

('standards', 'Vyhláška č. 500/2002 Sb.', '## Vyhláška č. 500/2002 Sb.

Prováděcí vyhláška k zákonu o účetnictví **pro podnikatele** účtující v soustavě podvojného účetnictví.

### Klíčový obsah
- **Část 1** — Předmět úpravy a působnost
- **Část 2** — Účetní závěrka (rozvaha, VZZ, příloha, přehled o změnách VK, cash flow)
- **Část 3** — Směrná účtová osnova (účtové třídy 0–9)
- **Část 4** — Účetní metody
  - § 47 — Oceňování dlouhodobého majetku (pořizovací cena, vlastní náklady, reprodukční PC)
  - § 48 — Odpisování (účetní odpisy dle odpisového plánu)
  - § 50 — Oceňování zásob (FIFO, vážený průměr)
  - § 55 — Tvorba a použití opravných položek
  - § 57 — Rezervy
  - § 58–60 — Časové rozlišení a dohadné položky

### Přílohy
- **Příloha č. 1** — Uspořádání a označování položek rozvahy
- **Příloha č. 2** — Uspořádání a označování položek VZZ (druhové členění)
- **Příloha č. 3** — Uspořádání a označování položek VZZ (účelové členění)
- **Příloha č. 4** — Směrná účtová osnova', 'https://www.zakonyprolidi.cz/cs/2002-500', 2);

-- ============================================================================
-- CATEGORY: chart_of_accounts (Účtová osnova)
-- ============================================================================

INSERT INTO knowledge_base (category, title, content, source_url, sort_order) VALUES
('chart_of_accounts', 'Účtové třídy 0–9 — přehled', '## Směrná účtová osnova — přehled tříd

| Třída | Název | Obsah |
|-------|-------|-------|
| **0** | Dlouhodobý majetek | DNM, DHM, DFM, oprávky, opravné položky |
| **1** | Zásoby | Materiál, nedokončená výroba, zboží |
| **2** | Krátkodobý finanční majetek | Pokladna, bankovní účty, krátkodobé CP |
| **3** | Zúčtovací vztahy | Pohledávky, závazky, daně, dotace |
| **4** | Kapitálové účty a dlouhodobé závazky | ZK, fondy, VH, rezervy, úvěry |
| **5** | Náklady | Spotřeba, služby, mzdy, odpisy, daně |
| **6** | Výnosy | Tržby, aktivace, finanční výnosy |
| **7** | Závěrkové a podrozvahové účty | Počáteční/konečný rozvažný účet, podrozvaha |
| **8–9** | Vnitropodnikové účetnictví | Volné pro manažerské účetnictví |

## Nejpoužívanější účty

### Třída 2 — Finanční majetek
- **211** Pokladna
- **221** Bankovní účty
- **261** Peníze na cestě

### Třída 3 — Zúčtovací vztahy
- **311** Odběratelé (pohledávky za fakturace)
- **321** Dodavatelé (závazky z přijatých faktur)
- **331** Zaměstnanci
- **336** Zúčtování s institucemi SP a ZP
- **341** Daň z příjmů
- **343** DPH

### Třída 5 — Náklady
- **501** Spotřeba materiálu
- **502** Spotřeba energie
- **511** Opravy a udržování
- **518** Ostatní služby
- **521** Mzdové náklady
- **524** Zákonné sociální pojištění
- **531** Daň silniční
- **538** Ostatní daně a poplatky
- **551** Odpisy DNM a DHM
- **563** Kurzové ztráty

### Třída 6 — Výnosy
- **601** Tržby za vlastní výrobky
- **602** Tržby z prodeje služeb
- **604** Tržby za zboží
- **662** Úroky
- **663** Kurzové zisky', 'https://www.zakonyprolidi.cz/cs/2002-500#p14', 1);

-- ============================================================================
-- CATEGORY: vat (DPH pravidla)
-- ============================================================================

INSERT INTO knowledge_base (category, title, content, source_url, sort_order) VALUES
('vat', 'Sazby DPH 2024–2026', '## Sazby DPH

### Platné od 1.1.2024
| Sazba | Procento | Uplatnění |
|-------|----------|-----------|
| **Základní** | 21% | Většina zboží a služeb |
| **Snížená** | 12% | Potraviny, nealkoholické nápoje, léky, knihy, časopisy, ubytovací služby, stavební práce (bytová výstavba), vstupné na kulturní/sportovní akce, stravovací služby, dětské autosedačky, zdravotnické prostředky |
| **Osvobozeno** | 0% | Poštovní služby, zdravotní služby, sociální pomoc, výchova a vzdělávání, finanční služby, pojišťovací služby, dodání nemovitosti (po 5 letech) |

### Změny 2024 (konsolidační balíček)
- Sloučení dvou snížených sazeb (10% + 15%) → **jedna 12%**
- Přeřazení položek: např. kadeřnické služby, řezané květiny → 21%
- Zrušení 0% sazby na knihy → nyní 12%', 'https://www.zakonyprolidi.cz/cs/2004-235#p47', 1),

('vat', 'Registrace k DPH', '## Registrace k DPH

### Povinná registrace
- **Obrat > 2 000 000 Kč** za 12 po sobě jdoucích kalendářních měsíců (od 2025)
- Registrace do 15 dnů po skončení měsíce překročení obratu
- Plátcem se stává od 1. dne druhého měsíce po překročení

### Dobrovolná registrace
- Kdykoli, pokud uskutečňuje ekonomickou činnost
- Výhodné pro B2B firmy (odpočet DPH z nákupů)

### Zrušení registrace
- Obrat < 2 000 000 Kč za 12 měsíců (nejdříve po 1 roce od registrace)
- Na žádost plátce

### Identifikovaná osoba (§ 6g-6l)
- Pořízení zboží z EU > 326 000 Kč
- Přijetí služby z EU (reverse charge)
- Nepodává kontrolní hlášení', 'https://www.zakonyprolidi.cz/cs/2004-235#p6', 2),

('vat', 'Kontrolní hlášení', '## Kontrolní hlášení

### Kdo podává
- Všichni plátci DPH (ne identifikované osoby)
- Pokud za dané období uskutečnili/přijali zdanitelné plnění

### Termíny podání
| Subjekt | Frekvence | Termín |
|---------|-----------|--------|
| Právnické osoby | Měsíčně | 25. den po skončení měsíce |
| Fyzické osoby (měsíční DPH) | Měsíčně | 25. den po skončení měsíce |
| Fyzické osoby (čtvrtletní DPH) | Čtvrtletně | 25. den po skončení čtvrtletí |

### Struktura
- **A.1** — Uskutečněná plnění v režimu přenesení daňové povinnosti
- **A.2** — Přijatá plnění, u nichž je příjemce povinen přiznat daň (§ 108)
- **A.3** — Uskutečněná plnění, povinnost přiznat daň (§ 108 odst. 1a) — DUZP
- **A.4/A.5** — Uskutečněná plnění nad/pod 10 000 Kč s DIČ odběratele
- **B.1** — Přijatá plnění v režimu přenesení daňové povinnosti
- **B.2/B.3** — Přijatá plnění nad/pod 10 000 Kč s DIČ dodavatele

### Sankce
| Porušení | Pokuta |
|----------|--------|
| Nepodání na výzvu (5 dnů) | 10 000 Kč |
| Nepodání po náhradní výzvě | 50 000 Kč |
| Nepodání ani v náhradní lhůtě | až 500 000 Kč |
| Uvedení nesprávných údajů | 1 000 Kč (pokuty se sčítají) |', 'https://www.zakonyprolidi.cz/cs/2004-235#p101a', 3);

-- ============================================================================
-- CATEGORY: income_tax (Daň z příjmů)
-- ============================================================================

INSERT INTO knowledge_base (category, title, content, source_url, sort_order) VALUES
('income_tax', 'DPFO — Daň z příjmů fyzických osob', '## Daň z příjmů fyzických osob (§ 2–16b ZDP)

### Sazba daně (od 2024)
| Základ daně | Sazba |
|-------------|-------|
| Do 36× průměrné mzdy (cca 1 582 812 Kč v 2025) | **15%** |
| Nad 36× průměrné mzdy | **23%** |

### Slevy na dani 2025 (§ 35ba)
| Sleva | Roční částka |
|-------|-------------|
| Na poplatníka | 30 840 Kč |
| Na manžela/manželku (příjmy < 68 000) | 24 840 Kč |
| Na invaliditu I./II. stupně | 2 520 Kč |
| Na invaliditu III. stupně | 5 040 Kč |
| Držitel ZTP/P | 16 140 Kč |
| Student | 4 020 Kč |

### Daňové zvýhodnění na děti 2025
| Dítě | Roční částka |
|------|-------------|
| 1. dítě | 15 204 Kč |
| 2. dítě | 22 320 Kč |
| 3. a další | 27 840 Kč |
| ZTP/P dítě | dvojnásobek |

### Nezdanitelná část základu daně (§ 15)
- Dary (min 2%/1000 Kč, max 15% ZD)
- Úroky z hypotéky (max 150 000 Kč/rok, od 2024)
- Penzijní připojištění (max 24 000 Kč, po odečtení 12 000)
- Životní pojištění (max 24 000 Kč)
- Odborové příspěvky (max 3 000 Kč)

### Termíny
- Podání přiznání: **1. dubna** (papírové), **2. května** (elektronicky), **1. července** (s daňovým poradcem)
- Zálohy: čtvrtletně nebo pololetně dle poslední daňové povinnosti', 'https://www.zakonyprolidi.cz/cs/1992-586#p16', 1),

('income_tax', 'DPPO — Daň z příjmů právnických osob', '## Daň z příjmů právnických osob (§ 17–21a ZDP)

### Sazba daně
- **21%** od roku 2024 (dříve 19%)
- 5% — investiční fondy, podfondy
- 0% — penzijní fondy (splňující podmínky)
- 15% — srážková daň z dividend, podílů na zisku

### Základ daně
1. Výsledek hospodaření (zisk/ztráta) z účetnictví
2. **+ Připočitatelné položky** (daňově neuznatelné náklady)
   - Reprezentace (pohoštění, dary mimo §15)
   - Penále, pokuty (kromě smluvních)
   - Tvorba účetních rezerv a opravných položek (nad rámec zákonných)
   - Odpisy nad daňovou výši
3. **- Odčitatelné položky**
   - Daňová ztráta (max 5 let zpětně)
   - Odpočet na výzkum a vývoj (až 100%)
   - Odpočet na odborné vzdělávání

### Daňové odpisy (§ 26–33)
| Skupina | Doba | Příklady |
|---------|------|---------|
| 1 | 3 roky | Počítače, kancelářské stroje |
| 2 | 5 let | Automobily, nábytek |
| 3 | 10 let | Výtahy, klimatizace |
| 4 | 20 let | Budovy ze dřeva, plotu |
| 5 | 30 let | Budovy, haly, stavby |
| 6 | 50 let | Administrativní budovy, hotely |

### Termíny
- Přiznání: **1. dubna** (standardně), **1. července** (s poradcem/auditorem)
- Zálohy: dle výše poslední daňové povinnosti', 'https://www.zakonyprolidi.cz/cs/1992-586#p21', 2);

-- ============================================================================
-- CATEGORY: payroll (Mzdové účetnictví)
-- ============================================================================

INSERT INTO knowledge_base (category, title, content, source_url, sort_order) VALUES
('payroll', 'Sociální a zdravotní pojištění 2025', '## Pojistné na sociální zabezpečení a zdravotní pojištění

### Sociální pojištění (SP)
| Subjekt | Sazba | Z čeho |
|---------|-------|--------|
| **Zaměstnavatel** | 24,8% | Z hrubé mzdy |
| **Zaměstnanec** | 7,1% | Z hrubé mzdy (6,5% důchod + 0,6% nemocenské) |
| **OSVČ** | 29,2% | Z vyměřovacího základu (min 50% zisku) |

### Zdravotní pojištění (ZP)
| Subjekt | Sazba | Z čeho |
|---------|-------|--------|
| **Zaměstnavatel** | 9% | Z hrubé mzdy |
| **Zaměstnanec** | 4,5% | Z hrubé mzdy |
| **OSVČ** | 13,5% | Z vyměřovacího základu (min 50% zisku) |

### Minimální vyměřovací základy 2025
- **ZP zaměstnanec:** minimální mzda = 20 800 Kč → min pojistné 2 808 Kč (13,5%)
- **ZP OSVČ:** 50% průměrné mzdy × 12 → min záloha cca 3 000 Kč/měs
- **SP OSVČ:** 25% průměrné mzdy × 12 → min záloha cca 4 000 Kč/měs

### Maximální vyměřovací základ (strop)
- **SP:** 48× průměrné mzdy (cca 2 110 416 Kč v 2025)
- **ZP:** strop zrušen (od 2013 neomezen)

### Nemocenské pojištění zaměstnanců
- 1.–3. den: **karanténní příplatek** nebo náhrada mzdy (60% DVZ od 4. dne nemoci zaměstnavatel platí prvních 14 dnů)
- Od 15. dne: nemocenské od ČSSZ', 'https://www.zakonyprolidi.cz/cs/1992-589', 1),

('payroll', 'Minimální a zaručená mzda 2025', '## Minimální a zaručená mzda

### Minimální mzda 2025
- **Měsíční:** 20 800 Kč
- **Hodinová:** 124,40 Kč (pro 40hod/týden)

### Zaručená mzda — 8 skupin
| Skupina | Kč/hod | Kč/měs | Příklady prací |
|---------|--------|--------|----------------|
| 1 | 124,40 | 20 800 | Pomocné, nekvalifikované práce |
| 2 | 129,80 | 21 800 | Jednoduché odborné práce |
| 3 | 143,30 | 24 100 | Odborné práce |
| 4 | 158,20 | 26 600 | Složitější odborné práce |
| 5 | 174,70 | 29 400 | Systémové odborné práce |
| 6 | 192,90 | 32 400 | Tvůrčí systémové práce |
| 7 | 213,10 | 35 800 | Komplexní tvůrčí práce |
| 8 | 235,20 | 39 500 | Nejsložitější koncepční práce |

**Pozn.:** Zaručená mzda se vztahuje pouze na zaměstnance u zaměstnavatelů uvedených v § 109/3 ZP (veřejný sektor). V soukromém sektoru platí pouze min. mzda a nařízení vlády.', 'https://www.zakonyprolidi.cz/cs/2006-262#p111', 2);

-- ============================================================================
-- CATEGORY: procedures (Postupy a best practices)
-- ============================================================================

INSERT INTO knowledge_base (category, title, content, source_url, sort_order) VALUES
('procedures', 'Měsíční uzávěrka — checklist', '## Měsíční účetní uzávěrka

### Checklist
1. ☐ **Zpracování bankovních výpisů** — zaúčtování všech pohybů na BÚ
2. ☐ **Pokladna** — zaúčtování pokladních dokladů, odsouhlasení zůstatku
3. ☐ **Přijaté faktury** — zaúčtování všech došlých faktur, kontrola DUZP
4. ☐ **Vydané faktury** — zaúčtování tržeb, ověření úhrad
5. ☐ **Interní doklady** — odpisy, časové rozlišení, mzdové náklady
6. ☐ **DPH** — kontrola, přiznání k DPH, kontrolní hlášení
7. ☐ **Odsouhlasení saldokonta** — pohledávky (311) a závazky (321)
8. ☐ **Mzdy** — výpočet mezd, odvody SP/ZP, záloha na daň
9. ☐ **Kontrola účtů** — odsouhlasení zůstatků s fyzickým stavem
10. ☐ **Předání přehledů** — reporting klientovi/vedení

### Termíny v měsíci
| Termín | Povinnost |
|--------|-----------|
| 15. | Záloha na SP a ZP zaměstnanců |
| 20. | Odvod zálohy na daň z příjmů ze závislé činnosti |
| 20. | Měsíční přehled pro ČSSZ |
| 20. | Měsíční přehled pro zdravotní pojišťovny |
| 25. | Přiznání k DPH |
| 25. | Kontrolní hlášení |
| 25. | Souhrnné hlášení (pokud plnění do EU) |', NULL, 1),

('procedures', 'Roční uzávěrka — kroky', '## Roční účetní uzávěrka

### Přípravné práce
1. ☐ **Inventarizace** — fyzická i dokladová (majetek, zásoby, pohledávky, závazky)
2. ☐ **Opravné položky** — k pohledávkám dle ZoR č. 593/1992
3. ☐ **Rezervy** — tvorba/rozpuštění zákonných i účetních rezerv
4. ☐ **Odpisy** — výpočet účetních a daňových odpisů za celý rok
5. ☐ **Časové rozlišení** — příjmy/výdaje příštích období (381–385)
6. ☐ **Dohadné položky** — aktivní (388) a pasivní (389)
7. ☐ **Kurzové rozdíly** — přecenění cizoměnových pohledávek/závazků k 31.12.
8. ☐ **Kontrola DPH** — odsouhlasení s přiznáními za celý rok

### Uzávěrkové operace
9. ☐ **Výpočet daně z příjmů** — základ daně, položky snižující/zvyšující
10. ☐ **Odložená daň** — výpočet a zaúčtování (ČÚS 003)
11. ☐ **Uzavření účtů** — převod zůstatků nákladů a výnosů na 710
12. ☐ **Výsledek hospodaření** — zisk/ztráta běžného období

### Účetní závěrka
13. ☐ **Rozvaha** — aktiva = pasiva
14. ☐ **Výkaz zisku a ztráty** — druhové nebo účelové členění
15. ☐ **Příloha** — doplňující informace dle vyhlášky 500/2002
16. ☐ **Přehled o peněžních tocích** — povinný pro střední a velké ÚJ
17. ☐ **Přehled o změnách VK** — povinný pro střední a velké ÚJ

### Termíny
- Sestavení ÚZ: do 6 měsíců po konci účetního období (§ 19 ZoÚ)
- Zveřejnění ve sbírce listin: do 12 měsíců
- Audit: střední a velké ÚJ (§ 20 ZoÚ)', NULL, 2),

('procedures', 'Archivace účetních dokladů — lhůty', '## Archivace účetních dokladů

### Zákonné lhůty úschovy (§ 31 ZoÚ + § 27 DŘ)

| Typ dokladu | Lhůta | Zákon |
|-------------|-------|-------|
| **Účetní závěrka, výroční zpráva** | 10 let | § 31/2a ZoÚ |
| **Účetní doklady** (faktury, pokladní doklady) | 5 let | § 31/2b ZoÚ |
| **Účetní knihy** (deník, hlavní kniha) | 5 let | § 31/2b ZoÚ |
| **Inventurní soupisy** | 5 let | § 31/2b ZoÚ |
| **Účtový rozvrh** | 5 let | § 31/2b ZoÚ |
| **Odpisový plán** | 5 let | § 31/2b ZoÚ |
| **Mzdové listy** | 30 let | § 35a/4 ZoODz |
| **Evidenční listy důchodového pojištění** | 30 let | § 35a/4 ZoODz |
| **Daňové doklady pro DPH** | 10 let | § 35 ZDPH |
| **Smlouvy** | dle promlčení + 5 let | Občanský zákoník |

### Forma archivace
- Od 2024: plně akceptována **elektronická archivace** (novela ZoÚ)
- Podmínky: čitelnost, nezměnitelnost, dohledatelnost
- Elektronické doklady: formát PDF/A, XML, nebo dle standardu
- Papírové doklady: lze digitalizovat s autorizovanou konverzí

### Praktické rady
- Archivovat systematicky podle účetních období
- Doklady DPH: uchovávat minimálně 10 let (delší lhůta než účetní)
- Mzdové dokumenty: 30 let — pozor na bezpečné uložení
- Po uplynutí lhůty: skartace s protokolem', NULL, 3);
