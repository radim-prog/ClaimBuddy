-- Knowledge Base v2: Comprehensive Czech accounting content
-- Adds missing categories (decrees) + expands all existing categories
-- Run via Supabase Management API

-- ============================================================================
-- CATEGORY: decrees (Vyhlášky) — currently EMPTY
-- ============================================================================

INSERT INTO knowledge_base (category, title, content, source_url, sort_order) VALUES
('decrees', 'Vyhláška č. 500/2002 Sb. — pro podnikatele', '## Vyhláška č. 500/2002 Sb.

Prováděcí vyhláška k zákonu o účetnictví **pro podnikatele** účtující v soustavě podvojného účetnictví. Nejdůležitější vyhláška pro běžnou účetní praxi.

### Struktura vyhlášky

**Část první — Předmět úpravy (§ 1–2)**
- Rozsah a způsob sestavování účetní závěrky
- Uspořádání a označování položek rozvahy a VZZ
- Směrná účtová osnova

**Část druhá — Účetní závěrka (§ 3–44)**
- **§ 3–4** Rozvaha: uspořádání aktiv a pasiv
- **§ 5–19** Obsah jednotlivých položek rozvahy:
  - § 6: Dlouhodobý nehmotný majetek (zřizovací výdaje, software, goodwill)
  - § 7: Dlouhodobý hmotný majetek (stavby, pozemky, samostatné movité věci)
  - § 8: Dlouhodobý finanční majetek (podíly, dluhopisy)
  - § 9: Zásoby (materiál, nedokončená výroba, výrobky, zboží)
  - § 10: Pohledávky (krátkodobé, dlouhodobé)
  - § 12: Vlastní kapitál (ZK, fondy, VH)
  - § 17: Rezervy
  - § 18: Závazky
- **§ 20–38** Výkaz zisku a ztráty (druhové a účelové členění)
- **§ 39–44** Příloha v účetní závěrce

**Část třetí — Směrná účtová osnova (§ 45–46)**
- Účtové třídy 0–9
- Účtové skupiny v rámci tříd

**Část čtvrtá — Účetní metody (§ 47–61b)**
- **§ 47** Oceňování DHM a DNM: pořizovací cena, reprodukční PC, vlastní náklady
- **§ 48** Odpisování: rovnoměrné, zrychlené, výkonové
- **§ 49** Oceňování podílů ekvivalencí
- **§ 50** Oceňování zásob: FIFO, vážený průměr, pevná skladová cena
- **§ 51** Oceňování pohledávek: jmenovitá hodnota, pořizovací cena
- **§ 55** Opravné položky: postup tvorby a zúčtování
- **§ 57** Rezervy: zákonné a účetní
- **§ 58** Náklady příštích období (381)
- **§ 59** Výdaje příštích období (383)
- **§ 60** Výnosy příštích období (384)
- **§ 61** Příjmy příštích období (385)
- **§ 61a** Dohadné účty aktivní (388) a pasivní (389)

### Přílohy vyhlášky
| Příloha | Obsah |
|---------|-------|
| č. 1 | Uspořádání a označování položek rozvahy (bilance) |
| č. 2 | Uspořádání položek VZZ — druhové členění |
| č. 3 | Uspořádání položek VZZ — účelové členění |
| č. 4 | Směrná účtová osnova (účtové třídy a skupiny) |

### Praktické poznámky
- Mikro a malé účetní jednotky mají zjednodušený rozsah rozvahy a VZZ
- Střední a velké ÚJ sestavují přehled o peněžních tocích a přehled o změnách VK
- Příloha ÚZ musí obsahovat informace dle § 39 (obecné údaje, účetní metody, doplňující informace)', 'https://www.zakonyprolidi.cz/cs/2002-500', 1);

INSERT INTO knowledge_base (category, title, content, source_url, sort_order) VALUES
('decrees', 'Vyhláška č. 501/2002 Sb. — pro banky a finanční instituce', '## Vyhláška č. 501/2002 Sb.

Prováděcí vyhláška k zákonu o účetnictví **pro banky a ostatní finanční instituce**.

### Koho se týká
- Banky
- Spořitelní a úvěrní družstva (kampeličky)
- Obchodníci s cennými papíry
- Investiční společnosti a fondy
- Pojišťovny a zajišťovny
- Penzijní společnosti

### Hlavní odlišnosti od vyhlášky 500
- Specifická struktura rozvahy (aktiva: pokladní hotovost, pohledávky za bankami, úvěry klientům)
- Odlišný VZZ: výnosy/náklady z úroků, poplatků, finančních operací
- Specifické položky: goodwill z konsolidace, deriváty, opravné položky k úvěrům
- Oceňování reálnou hodnotou (fair value) u finančních nástrojů
- Přísnější požadavky na přílohu a zveřejňování

### Kdy se s ní účetní setká
V běžné účetní praxi (malé a střední firmy) se s touto vyhláškou nesetkáte. Relevantní je pouze pro specializované účetní pracující v bankovním a finančním sektoru.', 'https://www.zakonyprolidi.cz/cs/2002-501', 2);

INSERT INTO knowledge_base (category, title, content, source_url, sort_order) VALUES
('decrees', 'Vyhláška č. 502/2002 Sb. — pro pojišťovny', '## Vyhláška č. 502/2002 Sb.

Prováděcí vyhláška k zákonu o účetnictví **pro pojišťovny a zajišťovny**.

### Specifika
- Technické rezervy pojišťoven (rezerva na nezasloužené pojistné, rezerva na pojistná plnění)
- Specifická struktura rozvahy a VZZ pro pojišťovací činnost
- Oceňování finančního umístění (investic pojišťovny)
- Přiřazení nákladů a výnosů k neživotnímu a životnímu pojištění

### Pro běžnou praxi
Tato vyhláška je relevantní pouze pro účetní specializované na pojišťovnictví.', 'https://www.zakonyprolidi.cz/cs/2002-502', 3);

INSERT INTO knowledge_base (category, title, content, source_url, sort_order) VALUES
('decrees', 'Vyhláška č. 504/2002 Sb. — pro nepodnikatelské subjekty', '## Vyhláška č. 504/2002 Sb.

Prováděcí vyhláška k zákonu o účetnictví pro účetní jednotky, u kterých hlavním předmětem činnosti **není podnikání** (neziskovky).

### Koho se týká
- Spolky (dříve občanská sdružení)
- Nadace a nadační fondy
- Obecně prospěšné společnosti (OPS)
- Ústavy
- Církve a náboženské společnosti
- Politické strany a hnutí
- Zájmová sdružení právnických osob
- Honební společenstva

### Hlavní odlišnosti od vyhlášky 500
- Odlišná struktura rozvahy: vlastní jmění (ne vlastní kapitál)
- Specifické položky: přijaté příspěvky, fondy
- VZZ: hlavní činnost vs. hospodářská (vedlejší) činnost
- Zjednodušený rozsah pro malé neziskové organizace
- Specifická pravidla pro přijaté dary a dotace

### Praktické poznámky pro účetní
- Neziskové organizace s obratem nad 3 mil. Kč musí vést podvojné účetnictví
- Malé spolky (obrat < 3 mil., aktiva < 1,5 mil.) mohou vést jednoduché účetnictví
- Účtová osnova se liší od podnikatelské (jiná třída 9)
- Audit: povinný pro nadace s nadačním jměním > 5 mil. nebo přijímající veřejné prostředky', 'https://www.zakonyprolidi.cz/cs/2002-504', 4);

INSERT INTO knowledge_base (category, title, content, source_url, sort_order) VALUES
('decrees', 'Pokyn D-59 (GFŘ) — k dani z příjmů', '## Pokyn GFŘ D-59 k zákonu o daních z příjmů

Výkladový pokyn Generálního finančního ředitelství k jednotnému postupu při uplatňování ZDP. Není právně závazný, ale správci daně se jím řídí.

### Nejdůležitější výklady

**K § 4 — Osvobození od daně**
- Definice „vlastního bydlení" pro osvobození prodeje nemovitosti
- Podmínky pro osvobození příjmů z prodeje CP po 3 letech

**K § 6 — Příjmy ze závislé činnosti**
- Co se zahrnuje do příjmů zaměstnance (benefity, naturální mzda)
- Poskytování stravování zaměstnancům
- Používání služebního vozidla pro soukromé účely (1% PC/měsíc)

**K § 7 — Příjmy z podnikání**
- Přechod z daňové evidence na účetnictví (a naopak)
- Uplatnění paušálních výdajů vs. skutečné výdaje

**K § 24 — Daňově uznatelné náklady**
- Škody na majetku: do výše náhrady od pojišťovny (nad to neuznatelné)
- Cestovní náhrady: viz § 156–189 ZP
- Reprezentace: pohoštění vždy neuznatelné, reklamní předměty do 500 Kč bez loga = neuznatelné
- Odpis pohledávek: podmínky pro daňovou uznatelnost

**K § 25 — Neuznatelné náklady**
- Pokuty a penále (kromě smluvních)
- Tvorba účetních opravných položek (nad rámec zákonných)
- Náklady na osobní potřebu poplatníka

### Kdy používat
- Při řešení sporných případů daňové uznatelnosti
- Při kontrole ze strany finančního úřadu
- Jako argument při odvolání proti platebnímu výměru', 'https://www.financnisprava.cz/cs/dane/novinky/2024', 5);

-- ============================================================================
-- CATEGORY: procedures — expand with app workflows, FAQ, templates
-- ============================================================================

INSERT INTO knowledge_base (category, title, content, source_url, sort_order) VALUES
('procedures', 'Práce s aplikací — průvodce pro účetní', '## Průvodce aplikací UčetníOS

### Přihlášení a navigace
1. Přihlaste se na adrese aplikace pomocí svého účtu
2. Po přihlášení se zobrazí **Dashboard** s přehledem klientů a úkolů
3. Hlavní navigace: Dashboard → Klienti → Úkoly → Vytěžování → Znalostní báze

### Správa klientů
- **Seznam klientů:** Dashboard → „Klienti" v levém menu
- **Detail klienta:** Klikněte na firmu → zobrazí se sekce: Doklady, Faktury, Daně, Zprávy
- **Přepnutí na klienta:** Ikona „oko" vedle firmy → přepne pohled na klientský portál (impersonace)

### Vytěžování dokladů (AI extrakce)
1. Klient nahraje dokument (PDF/JPG/PNG) přes klientský portál
2. AI automaticky rozpozná typ dokladu a extrahuje data (dodavatel, částky, DPH)
3. Účetní zkontroluje a schválí/opraví extrahovaná data
4. Schválený doklad je připraven k zaúčtování

### Úkoly (R-Tasks systém)
- Každý úkol má **R-Tasks skóre**: Money (0-3), Fire (0-3), Time (0-3), Distance (0-2), Personal (0-1)
- Celkové skóre (0-12) určuje prioritu
- Stavy: Draft → Pending → In Progress → Completed
- Delegace: přiřazení jinému účetnímu nebo čekání na klienta

### Komunikace s klientem
- **Zprávy:** Každý klient má vlákno zpráv (podobné chatu)
- **Upozornění:** Systém generuje notifikace o důležitých událostech

### Fakturace
- Přehled vydaných/přijatých faktur klienta
- Export dat pro účetní software (Pohoda, Money)', NULL, 4);

INSERT INTO knowledge_base (category, title, content, source_url, sort_order) VALUES
('procedures', 'FAQ — časté dotazy účetních', '## Nejčastější otázky a odpovědi

### Daně a přiznání

**Q: Kdy musí OSVČ podat přiznání k dani z příjmů?**
A: Do 1. dubna (papírově), 2. května (elektronicky), nebo 1. července (s daňovým poradcem). Pokud příjmy ze závislé činnosti byly zdaněny srážkou nebo zaměstnavatel provedl roční zúčtování a OSVČ nemá jiné příjmy > 20 000 Kč, přiznání podávat nemusí.

**Q: Musí OSVČ s paušální daní podávat přiznání k DPH?**
A: Ne. Paušální daň je určena pro OSVČ, které NEJSOU plátci DPH. Pokud se OSVČ stane plátcem DPH, musí z paušálního režimu vystoupit.

**Q: Jak se počítá obrat pro povinnou registraci k DPH?**
A: Obrat = souhrn úplat za uskutečněná plnění s místem plnění v tuzemsku (bez plnění osvobozených bez nároku na odpočet). Sleduje se za 12 po sobě jdoucích měsíců, limit 2 000 000 Kč (od 2025).

**Q: Mohu uplatnit DPH z firemního oběda?**
A: Stravování poskytované zaměstnavatelem zaměstnancům je osvobozeno (§ 57 ZDPH). Nárok na odpočet DPH u stravovacích služeb ANO existuje (od 2024), ale pouze pokud jde o firemní akci/pracovní oběd, ne osobní spotřebu.

### Zaměstnanci a mzdy

**Q: Jaké jsou odvody u DPP do 10 000 Kč?**
A: Pouze srážková daň 15% (pokud zaměstnanec nepodepsal prohlášení). Sociální a zdravotní pojištění se neodvádí. Od 2025: sleduje se souhrn DPP u všech zaměstnavatelů přes registr DPP.

**Q: Zaměstnanec onemocněl — co platí zaměstnavatel?**
A: První 3 dny karanténa/nemoc = nic (karenční doba zrušena, od 2019 se platí od 1. dne). Zaměstnavatel platí náhradu mzdy prvních **14 kalendářních dnů** (60% DVZ od 4. pracovního dne, první 3 pracovní dny náhrada mzdy 60% redukovaného DVZ). Od 15. dne platí ČSSZ nemocenské.

**Q: Může mít zaměstnanec více DPP u jednoho zaměstnavatele?**
A: Ano, ale limit 300 hodin ročně se sčítá za všechny DPP u téhož zaměstnavatele. Odměny ze všech DPP u jednoho zaměstnavatele se pro účely pojistného sčítají.

### Účetní uzávěrky

**Q: Musí mikro účetní jednotka sestavovat cash flow?**
A: Ne. Přehled o peněžních tocích je povinný pouze pro **střední a velké** účetní jednotky (§ 18/2 ZoÚ).

**Q: Kdy je povinný audit účetní závěrky?**
A: Povinný audit má: a) velké ÚJ vždy, b) střední ÚJ vždy, c) malé ÚJ akciové společnosti, d) malé ÚJ ostatní, pokud překročí 2 ze 3 kritérií: aktiva 40 mil., obrat 80 mil., zaměstnanci 50.

**Q: Jak dlouho uchovávat účetní doklady po uzavření firmy?**
A: I po zániku firmy platí archivační lhůty. Likvidátor musí zajistit úschovu: účetní závěrka 10 let, doklady 5 let, mzdové listy 30 let. Doklady předá do archivu.', NULL, 5);

INSERT INTO knowledge_base (category, title, content, source_url, sort_order) VALUES
('procedures', 'Šablony — vnitřní směrnice', '## Šablony vnitřních směrnic

Každá účetní jednotka by měla mít zpracované vnitřní směrnice. Níže jsou osnovy klíčových směrnic.

### 1. Směrnice o systému zpracování účetnictví
- Účetní období (kalendářní/hospodářský rok)
- Používaný software
- Účtový rozvrh (odkaz na přílohu)
- Oběh účetních dokladů
- Oprávněné osoby k podepisování
- Časový harmonogram zpracování

### 2. Směrnice o odpisování dlouhodobého majetku
- Hranice pro zařazení do DHM (účetní vs. daňová — 80 000 Kč od 2021)
- Hranice pro DNM (60 000 Kč od 2021)
- Metoda účetních odpisů (rovnoměrné/zrychlené/výkonové)
- Doba odpisování podle skupin a typů majetku
- Zbytkova hodnota
- Technické zhodnocení vs. oprava

### 3. Směrnice o oceňování zásob
- Metoda oceňování: FIFO / vážený průměr / pevná cena
- Vedlejší pořizovací náklady (doprava, clo, pojistné)
- Normy přirozených úbytků
- Postup inventarizace zásob

### 4. Směrnice o cestovních náhradách
- Tuzemské stravné (sazby dle vyhlášky MPSV)
- Zahraniční stravné (dle vyhlášky MF)
- Sazba za 1 km (2025: 5,60 Kč)
- Průměrná cena PHM (dle vyhlášky)
- Schvalování pracovních cest
- Vzor cestovního příkazu a vyúčtování

### 5. Směrnice o inventarizaci
- Termíny inventarizace (fyzická: 4 měsíce před až 2 měsíce po rozvahovém dni)
- Inventarizační komise (min. 2 osoby)
- Postup při zjištění mank a přebytků
- Tvorba opravných položek na základě inventarizace
- Archivace inventurních soupisů (5 let)

### 6. Směrnice o časovém rozlišení
- Hranice významnosti (obvykle 10 000–50 000 Kč)
- Druhy časového rozlišení (381–385)
- Dohadné položky (388, 389)
- Příklady: nájemné placené předem, pojistné, předplatné', NULL, 6);

INSERT INTO knowledge_base (category, title, content, source_url, sort_order) VALUES
('procedures', 'Tipy a best practices', '## Tipy pro efektivní účetní praxi

### Organizace práce
1. **Pravidelný rytmus:** Zpracovávejte doklady průběžně (týdně), ne naráz na konci měsíce
2. **Jednotný systém:** Stejný postup pro všechny klienty — snižuje chybovost
3. **Checklist:** Používejte checklisty pro měsíční a roční uzávěrky (viz sekce Postupy)
4. **Dokumentace:** Vše důležité zapište — za rok si nebudete pamatovat

### Komunikace s klientem
1. **Termíny:** Na začátku spolupráce jasně definujte termíny dodání dokladů
2. **Formát dokladů:** Požadujte elektronické doklady (PDF) — snazší zpracování
3. **Připomínky:** Nastavte si automatické připomínky pro klienty (DPH, mzdy)
4. **Kontrolní otázky:** Na konci roku proaktivně zjišťujte: pořízení/vyřazení majetku, dary, úvěry, změny

### Prevence chyb
1. **Kontrolní vazby:** Vždy kontrolujte: DPH na vstupu vs. kontrolní hlášení, salda 311/321
2. **Měsíční odsouhlasení:** Zůstatek pokladny, banky, salda odběratelů/dodavatelů
3. **Kurzové rozdíly:** Přepočítávejte cizoměnové položky měsíčně (ne jen na konci roku)
4. **Archivace:** Elektronické doklady ukládejte systematicky: Rok/Měsíc/Typ_dokladu

### Daňová optimalizace (legální)
1. **Odpisy:** Zvažte přerušení odpisů v ziskových letech
2. **Opravné položky:** Tvořte zákonné OP k pohledávkám po splatnosti (šetří daň)
3. **Rezervy:** Zákonná rezerva na opravu DHM (podmínky § 7 ZoR 593/1992)
4. **Ztráta:** Nezapomínejte uplatňovat daňovou ztrátu (5 let zpětně)
5. **Dary:** Připomínejte klientům možnost odpočtu darů (min 2%/1000 Kč, max 15% ZD)

### Digitalizace
1. **Elektronické doklady:** Od 2024 plně akceptovány zákonem
2. **Datová schránka:** Povinná pro všechny PO a OSVČ od 2023
3. **Elektronické podání:** DPH, KH, DPPO, DPFO — preferujte EPO/datovou schránku
4. **Cloud archivace:** Bezpečné, s verzováním a zálohami', NULL, 7);

INSERT INTO knowledge_base (category, title, content, source_url, sort_order) VALUES
('procedures', 'Kalendář povinností 2025/2026', '## Roční kalendář účetních povinností

### Leden
- **15.1.** Záloha SP/ZP za prosinec (zaměstnanci)
- **20.1.** Přehled ČSSZ a ZP za prosinec
- **20.1.** Záloha na daň ze závislé činnosti za prosinec
- **25.1.** DPH přiznání + KH za prosinec (měsíční plátci)
- **31.1.** Daň z nemovitých věcí — přiznání (pokud změna)
- **31.1.** Silniční daň — přiznání za předchozí rok

### Únor
- **15.2.** Záloha SP/ZP za leden
- **17.2.** Vyúčtování daně ze závislé činnosti za předchozí rok
- **20.2.** Přehled ČSSZ a ZP za leden
- **25.2.** DPH přiznání + KH za leden
- **28.2.** Potvrzení o zdanitelných příjmech zaměstnancům (pro roční zúčtování)

### Březen
- **15.3.** Záloha SP/ZP za únor + Roční zúčtování daně zaměstnanců
- **20.3.** Přehled ČSSZ a ZP za únor
- **25.3.** DPH přiznání + KH za únor

### Duben
- **1.4.** DPFO/DPPO přiznání (papírové podání)
- **25.4.** DPH přiznání + KH za březen / za Q1
- **30.4.** Přehled OSSZ za OSVČ

### Květen
- **2.5.** DPFO/DPPO přiznání (elektronické podání)
- **25.5.** DPH přiznání + KH za duben
- **31.5.** Daň z nemovitých věcí — splatnost 1. splátky

### Červen
- **25.6.** DPH přiznání + KH za květen
- **30.6.** Přehled ZP za OSVČ

### Červenec
- **1.7.** DPFO/DPPO přiznání (s daňovým poradcem/auditorem)
- **25.7.** DPH přiznání + KH za červen / za Q2

### Srpen–Prosinec
- **25. každý měsíc** DPH přiznání + KH
- **15. každý měsíc** Zálohy SP/ZP za zaměstnance
- **20. každý měsíc** Přehledy ČSSZ a ZP
- **30.11.** Daň z nemovitých věcí — splatnost 2. splátky
- **31.12.** Inventarizace majetku a závazků
- **31.12.** Uzávěrkové operace, přecenění cizoměnových položek', NULL, 8);

-- ============================================================================
-- CATEGORY: payroll — expand with practical guides
-- ============================================================================

INSERT INTO knowledge_base (category, title, content, source_url, sort_order) VALUES
('payroll', 'Výpočet čisté mzdy 2025 — krok za krokem', '## Výpočet čisté mzdy zaměstnance (2025)

### Vstupní údaje (příklad)
- Hrubá mzda: **40 000 Kč**
- Podepsané prohlášení poplatníka: ANO
- 1 dítě, žádná další zvýhodnění

### Krok 1: Pojistné zaměstnance
| Pojistné | Sazba | Částka |
|----------|-------|--------|
| Sociální pojištění | 7,1% | 2 840 Kč |
| Zdravotní pojištění | 4,5% | 1 800 Kč |
| **Celkem srážky zaměstnance** | **11,6%** | **4 640 Kč** |

### Krok 2: Pojistné zaměstnavatel (nad rámec HM)
| Pojistné | Sazba | Částka |
|----------|-------|--------|
| Sociální pojištění | 24,8% | 9 920 Kč |
| Zdravotní pojištění | 9% | 3 600 Kč |
| **Celkem odvody zaměstnavatel** | **33,8%** | **13 520 Kč** |

### Krok 3: Záloha na daň z příjmů
1. Základ daně = hrubá mzda = **40 000 Kč**
2. Daň 15% = **6 000 Kč**
3. Sleva na poplatníka: **-2 570 Kč** (30 840/12)
4. Záloha na daň po slevách = **3 430 Kč**
5. Daňové zvýhodnění na 1. dítě: **-1 267 Kč** (15 204/12)
6. **Záloha na daň celkem = 2 163 Kč**

### Krok 4: Čistá mzda
| Položka | Částka |
|---------|--------|
| Hrubá mzda | 40 000 Kč |
| - SP zaměstnanec (7,1%) | -2 840 Kč |
| - ZP zaměstnanec (4,5%) | -1 800 Kč |
| - Záloha na daň | -2 163 Kč |
| **= Čistá mzda** | **33 197 Kč** |

### Celkové náklady zaměstnavatele
| Položka | Částka |
|---------|--------|
| Hrubá mzda | 40 000 Kč |
| + SP zaměstnavatel (24,8%) | +9 920 Kč |
| + ZP zaměstnavatel (9%) | +3 600 Kč |
| **= Superhrubé náklady** | **53 520 Kč** |

**Pozn.:** Superhrubá mzda jako základ daně byla zrušena od 2021. Základ daně = hrubá mzda.', NULL, 3);

INSERT INTO knowledge_base (category, title, content, source_url, sort_order) VALUES
('payroll', 'Roční zúčtování daně zaměstnanců', '## Roční zúčtování záloh na daň z příjmů

### Kdo má nárok
Zaměstnanec, který:
- Měl příjmy pouze od jednoho (nebo postupně od více) zaměstnavatelů
- Podepsal u každého prohlášení poplatníka
- Nemá povinnost podat daňové přiznání (jiné příjmy > 20 000 Kč, příjmy od více zaměstnavatelů současně)

### Termíny
- **Zaměstnanec požádá:** do 15. února následujícího roku
- **Zaměstnavatel provede:** do 15. března
- **Přeplatek vyplatí:** nejpozději se mzdou za březen

### Postup
1. Zaměstnanec doloží potvrzení:
   - Úroky z hypotéky (potvrzení z banky + LV)
   - Penzijní připojištění (potvrzení od penzijní společnosti)
   - Životní pojištění (potvrzení od pojišťovny)
   - Dary (potvrzení o daru)
   - Odborové příspěvky
   - Potvrzení o studiu (u studenta)
   - Potvrzení ZTP/P

2. Zaměstnavatel porovná:
   - Zaplacené zálohy na daň za rok
   - Vypočtenou roční daňovou povinnost
   - Uplatněné slevy a zvýhodnění

3. Výsledek:
   - **Přeplatek** → vrátí zaměstnanci
   - **Nedoplatek** → nesráží se (zákonná úprava), zaměstnanec si může podat přiznání

### Co zaměstnavatel nesmí zapomenout
- Zohlednit solidární zvýšení daně (příjmy > 48× PM)
- Správně sečíst úhrn příjmů od všech předchozích zaměstnavatelů (dle potvrzení)
- Zohlednit nezdanitelné části ZD dle § 15 ZDP
- Vystavit potvrzení o zdanitelných příjmech (§ 38j ZDP)', NULL, 4);

INSERT INTO knowledge_base (category, title, content, source_url, sort_order) VALUES
('payroll', 'Paušální daň OSVČ 2025', '## Paušální daň pro OSVČ

### Podmínky vstupu do režimu
- OSVČ — fyzická osoba
- **Není plátce DPH** (ani dobrovolný)
- Příjmy ze samostatné činnosti za předchozí rok **< 2 000 000 Kč**
- Nemá příjmy ze závislé činnosti (výjimka: DPP do limitu)
- Není společník veřejné obchodní společnosti
- Není dlužník v insolvenčním řízení

### Pásma paušální daně 2025
| Pásmo | Příjmy do | Měsíční záloha |
|-------|-----------|---------------|
| 1. pásmo | 1 000 000 Kč | cca 7 500 Kč |
| 2. pásmo | 1 500 000 Kč | cca 16 000 Kč |
| 3. pásmo | 2 000 000 Kč | cca 26 000 Kč |

**Záloha zahrnuje:** daň z příjmů + SP + ZP (vše v jedné platbě)

### Výhody
- Žádné daňové přiznání
- Žádné přehledy pro ČSSZ a ZP
- Jedna měsíční platba
- Jednoduchost — nemusí vést daňovou evidenci ani účetnictví

### Nevýhody
- Nelze uplatnit slevy na dani (manžel/ka, děti, invalidita)
- Nelze uplatnit nezdanitelné části ZD (hypotéka, penzijko)
- Nelze uplatnit daňovou ztrátu
- Může být dražší než klasický režim (zejména pro OSVČ s nízkým ziskem)
- Nemůže být plátce DPH

### Oznámení
- Vstup: do **10. ledna** roku, od kterého chce OSVČ režim využívat
- Výstup: do **10. ledna** (nebo se stane plátcem DPH / překročí limit)', NULL, 5);

-- ============================================================================
-- CATEGORY: vat — expand with practical guides
-- ============================================================================

INSERT INTO knowledge_base (category, title, content, source_url, sort_order) VALUES
('vat', 'Souhrnné hlášení', '## Souhrnné hlášení (§ 102 ZDPH)

### Kdo podává
Plátce DPH, který v daném období:
- Dodal zboží do jiného členského státu EU osobě registrované k DPH
- Přemístil obchodní majetek do jiného členského státu
- Poskytl službu s místem plnění v jiném členském státě (reverse charge)
- Dodal zboží v rámci třístranného obchodu jako prostřední osoba

### Termín podání
- **Měsíčně** — do 25. dne po skončení kalendářního měsíce
- Výjimka: čtvrtletní podání, pokud plátce pouze poskytuje služby dle § 9/1 ZDPH

### Obsah
| Kód | Typ transakce |
|-----|---------------|
| 0 | Dodání zboží do EU |
| 1 | Přemístění obchodního majetku |
| 2 | Dodání zboží — třístranný obchod (prostřední osoba) |
| 3 | Poskytnutí služby dle § 9/1 (reverse charge) |

### Praktické poznámky
- Podání pouze elektronicky (EPO portál nebo datová schránka)
- Uvádí se: DIČ odběratele, kód země, kód plnění, hodnota v Kč
- Opravné/následné souhrnné hlášení: oprava chyb z předchozích období
- **Nepodání:** pokuta 50 000 Kč (§ 102/5 ZDPH)', 'https://www.zakonyprolidi.cz/cs/2004-235#p102', 4);

INSERT INTO knowledge_base (category, title, content, source_url, sort_order) VALUES
('vat', 'Reverse charge — přenesení daňové povinnosti', '## Reverse charge (přenesení daňové povinnosti)

### Princip
Daň přiznává **příjemce** plnění (ne dodavatel). Dodavatel vystaví doklad bez DPH, příjemce si daň sám dopočte a zároveň si uplatní odpočet.

### Tuzemský reverse charge (§ 92a–92i ZDPH)
Trvale platí pro:
| Plnění | Podmínka |
|--------|----------|
| Dodání zlata | Vždy |
| Dodání zboží z přílohy č. 5 (šrot, odpady) | Vždy |
| Obchodování s povolenkami na emise | Vždy |
| Stavební a montážní práce (CZ-CPA 41–43) | Mezi plátci |
| Dodání nemovité věci (§ 56) | Pokud se dodavatel rozhodne zdanit |
| Poskytnutí pracovníků (stavebnictví) | Mezi plátci |
| Dodání zboží po postoupení výhrady vlastnictví | Vždy |

Dočasně (na základě nařízení vlády):
- Dodání mobilních telefonů, tabletů, notebooků (nad 100 000 Kč bez DPH na jednom dokladu)
- Dodání obilovin, technických plodin, kovů (nad 100 000 Kč)

### Přeshraniční reverse charge
- **Služby z EU:** příjemce přiznává DPH (§ 108/1c), dodavatel fakturuje bez DPH
- **Pořízení zboží z EU:** příjemce přiznává DPH (§ 108/1b)
- **Dovoz ze třetích zemí:** DPH vybírá celní úřad (nebo reverse charge dle § 23/3-4)

### Povinnosti příjemce
1. Doplnit na dokladu sazbu a výši daně
2. Přiznat daň v přiznání k DPH (řádek 10/11 pro zboží z EU, řádek 12/13 pro služby z EU, řádek 25 pro tuzemský RC)
3. Uplatnit odpočet (řádek 43/44)
4. Vykázat v kontrolním hlášení (sekce A.1 pro dodavatele, B.1 pro příjemce)', 'https://www.zakonyprolidi.cz/cs/2004-235#p92a', 5);

-- ============================================================================
-- CATEGORY: income_tax — expand
-- ============================================================================

INSERT INTO knowledge_base (category, title, content, source_url, sort_order) VALUES
('income_tax', 'Daňově uznatelné vs. neuznatelné náklady', '## Přehled daňově uznatelných a neuznatelných nákladů

### Daňově uznatelné náklady (§ 24 ZDP)
Náklady vynaložené na dosažení, zajištění a udržení příjmů:

**Vždy uznatelné:**
- Spotřeba materiálu, energie, služeb (v rozsahu podnikání)
- Mzdy a odvody SP/ZP za zaměstnance
- Nájemné (pokud souvisí s podnikáním)
- Odpisy DHM/DNM (daňové, dle ZDP)
- Cestovní náhrady (dle zákoníku práce)
- Pojistné (majetkové, odpovědnostní)
- Úroky z úvěrů na podnikání
- Zákonné opravné položky k pohledávkám (dle ZoR 593/1992)
- Zákonné rezervy (na opravu DHM dle ZoR 593/1992)
- Vzdělávání zaměstnanců (souvisí s předmětem činnosti)
- Reklamní předměty do 500 Kč s logem firmy (bez alkoholu a tabáku)

**Podmíněně uznatelné:**
- Odpis pohledávek: pouze pokud k nim byla tvořena zákonná OP, nebo dlužník v insolvenci
- Škody: do výše náhrady od pojišťovny (živelní pohromy — celá výše)
- Stravování zaměstnanců: příspěvek do limitu dle vyhlášky MPSV (55% z horní hranice stravného)
- Smluvní pokuty a penále: uznatelné, pokud zaplaceny
- Členské příspěvky: v právnických osobách povinné ze zákona

### Daňově neuznatelné náklady (§ 25 ZDP)
**Vždy neuznatelné:**
- Reprezentace (pohoštění, občerstvení, dary obchodním partnerům)
- Pokuty a penále od státních orgánů (FÚ, ČSSZ, ZP, pořádkové)
- Účetní odpisy přesahující daňové
- Tvorba účetních opravných položek (nad rámec zákonných)
- Manka a škody přesahující náhrady (mimo živelní pohromy)
- Výdaje na osobní potřebu poplatníka
- DPH uplatněná na vstupu (pokud je plátce)
- Splátky úvěrů (jistina — úrok je uznatelný)
- Podíly na zisku vyplácené společníkům
- Technické zhodnocení účtované do nákladů (nad 80 000 Kč)

### Šedá zóna — nejčastější spory s FÚ
| Náklad | Pozice FÚ | Doporučení |
|--------|-----------|------------|
| Automobil pro soukromé i firemní účely | Krácení dle podílu | Vést knihu jízd |
| Školení zaměstnanců | Musí souviset s činností | Dokumentovat účel |
| Pronájem od spojených osob | Cena obvyklá (§ 23/7) | Doložit znaleckým posudkem |
| Home office | Poměrná část nákladů | Dohoda o home office + výpočet |', 'https://www.zakonyprolidi.cz/cs/1992-586#p24', 3);

INSERT INTO knowledge_base (category, title, content, source_url, sort_order) VALUES
('income_tax', 'Daňová evidence OSVČ', '## Daňová evidence (§ 7b ZDP)

### Kdo vede daňovou evidenci
- OSVČ (fyzické osoby s příjmy dle § 7 ZDP)
- Které nejsou účetní jednotkou (obrat < 25 mil. Kč nebo dobrovolně nevedou účetnictví)
- A neuplatňují paušální výdaje

### Co obsahuje
1. **Evidence příjmů a výdajů** — peněžní deník
2. **Evidence majetku a dluhů** — karty DHM, kniha pohledávek a závazků

### Peněžní deník — struktura
| Datum | Doklad | Text | Příjem zdanitelný | Příjem nezdanitelný | Výdaj uznatelný | Výdaj neuznatelný |
|-------|--------|------|-------------------|--------------------|-----------------|--------------------|
| 15.1. | FV001 | Tržba za služby | 50 000 | | | |
| 18.1. | PF001 | Nákup materiálu | | | 12 100 | |
| 20.1. | INT01 | Osobní výběr | | | | 10 000 |

### Pravidla
- **Příjmy a výdaje se evidují v okamžiku platby** (ne vystavení faktury) — cash basis
- Odpisy DHM se uplatňují jako výdaj na konci roku (i když nebyly zaplaceny)
- Pohledávky a závazky se neevidují ve výnosech/nákladech, ale v přehledu majetku
- Na konci roku: **uzavření deníku**, výpočet základu daně = příjmy − výdaje ± korekce

### Přechod na účetnictví
- Povinný: obrat > 25 mil. Kč za předchozí rok
- Dobrovolný: kdykoli od 1. ledna
- Úpravy při přechodu (§ 5 odst. 8 ZDP):
  - + Neuhrazené pohledávky k 31.12. (zvyšují základ)
  - − Neuhrazené závazky k 31.12. (snižují základ)
  - + Zásoby k 31.12. (zvyšují základ)
  - − Přijaté zálohy (snižují základ)

### Přechod z účetnictví na daňovou evidenci
- Možný pouze pokud pomine důvod vedení účetnictví
- Úpravy jsou opačné: − pohledávky, + závazky, − zásoby', 'https://www.zakonyprolidi.cz/cs/1992-586#p7b', 4);

-- ============================================================================
-- CATEGORY: chart_of_accounts — expand with detailed account descriptions
-- ============================================================================

INSERT INTO knowledge_base (category, title, content, source_url, sort_order) VALUES
('chart_of_accounts', 'Třída 0 — Dlouhodobý majetek (detailně)', '## Účtová třída 0 — Dlouhodobý majetek

### 01x — Dlouhodobý nehmotný majetek (DNM)
| Účet | Název | Popis |
|------|-------|-------|
| **011** | Zřizovací výdaje | Výdaje na založení ÚJ (notář, rejstřík) — max 60 000 Kč (zrušen od 2016, existující se doodpisují) |
| **012** | Nehmotné výsledky výzkumu a vývoje | Výsledky vývoje pro vlastní potřebu |
| **013** | Software | Zakoupený software > 60 000 Kč (od 2021: > 60 000 Kč) |
| **014** | Ostatní ocenitelná práva | Licence, patenty, know-how > 60 000 Kč |
| **015** | Goodwill | Kladný/záporný rozdíl při koupi podniku |
| **019** | Ostatní DNM | Ostatní DNM nespadající jinam |

### 02x — Dlouhodobý hmotný majetek (DHM)
| Účet | Název | Popis |
|------|-------|-------|
| **021** | Stavby | Budovy, haly, stavby bez ohledu na PC |
| **022** | Hmotné movité věci | Stroje, přístroje, dopravní prostředky > 80 000 Kč (od 2021) |
| **025** | Pěstitelské celky | Trvalé porosty, vinice, chmelnice |
| **026** | Dospělá zvířata a jejich skupiny | Stáda, hejna (nad stanovený limit) |
| **029** | Jiný DHM | Umělecká díla, sbírky |
| **031** | Pozemky | Vždy DHM bez ohledu na PC, neodpisují se |
| **032** | Umělecká díla a sbírky | Neodpisují se |

### 03x — Nedokončený a pořizovaný DM
| Účet | Název |
|------|-------|
| **041** | Pořízení DNM (kalkulační účet) |
| **042** | Pořízení DHM (kalkulační účet) |
| **043** | Pořízení DFM (kalkulační účet) |

### 04x — Oprávky (kumulované odpisy)
| Účet | K účtu | Název |
|------|--------|-------|
| **071** | 011 | Oprávky ke zřizovacím výdajům |
| **072** | 012 | Oprávky k NV výzkumu a vývoje |
| **073** | 013 | Oprávky k software |
| **074** | 014 | Oprávky k ocenitelným právům |
| **075** | 015 | Oprávky ke goodwillu |
| **081** | 021 | Oprávky ke stavbám |
| **082** | 022 | Oprávky k HMV |
| **085** | 025 | Oprávky k pěstitelským celkům |
| **086** | 026 | Oprávky ke zvířatům |

### Účtování — typické operace
```
Pořízení DHM:     042/321 (přijatá faktura)
Zařazení do užívání: 022/042
Roční odpis:      551/082
Vyřazení (likvidace): 082/022 (oprávky) + 551/082 (zůstatková cena do nákladů)
Prodej:           082/022 (oprávky) + 541/022 (ZC do nákladů) + 311/641 (tržba z prodeje)
```', NULL, 2);

INSERT INTO knowledge_base (category, title, content, source_url, sort_order) VALUES
('chart_of_accounts', 'Třída 3 — Zúčtovací vztahy (detailně)', '## Účtová třída 3 — Zúčtovací vztahy

### 31x — Pohledávky
| Účet | Název | Použití |
|------|-------|---------|
| **311** | Odběratelé | Pohledávky z obchodních vztahů (vystavené faktury) |
| **312** | Směnky k inkasu | Přijaté směnky od odběratelů |
| **313** | Pohledávky za eskontované CP | Směnky předané bance k eskontu |
| **314** | Poskytnuté zálohy | Zálohy dodavatelům (provozní) |
| **315** | Ostatní pohledávky | Ostatní provozní pohledávky |

### 32x — Závazky
| Účet | Název | Použití |
|------|-------|---------|
| **321** | Dodavatelé | Závazky z obchodních vztahů (přijaté faktury) |
| **322** | Směnky k úhradě | Vystavené směnky dodavatelům |
| **324** | Přijaté zálohy | Zálohy od odběratelů |
| **325** | Ostatní závazky | Ostatní provozní závazky |

### 33x — Zaměstnanci a instituce
| Účet | Název | Použití |
|------|-------|---------|
| **331** | Zaměstnanci | Závazky vůči zaměstnancům (čisté mzdy k výplatě) |
| **333** | Ostatní závazky vůči zaměstnancům | Cestovné, náhrady |
| **335** | Pohledávky za zaměstnanci | Zálohy, poskytnuté půjčky |
| **336** | Zúčtování s institucemi SP a ZP | Závazky vůči ČSSZ a zdravotním pojišťovnám |

### 34x — Daně
| Účet | Název | Použití |
|------|-------|---------|
| **341** | Daň z příjmů | Zálohy a doplatky DPFO/DPPO |
| **342** | Ostatní přímé daně | Srážková daň, daň z příjmů ze závislé činnosti |
| **343** | DPH | DPH na vstupu/výstupu, vypořádání |
| **345** | Ostatní daně a poplatky | Silniční daň, daň z nemovitostí |
| **346** | Dotace ze SR | Nároky na dotace ze státního rozpočtu |

### 35x — Pohledávky za společníky
| Účet | Název |
|------|-------|
| **351** | Pohledávky — ovládající a řídící osoba |
| **353** | Pohledávky za upsaný ZK |
| **355** | Ostatní pohledávky za společníky |

### 36x — Závazky ke společníkům
| Účet | Název |
|------|-------|
| **361** | Závazky — ovládající a řídící osoba |
| **364** | Závazky ke společníkům při rozdělování zisku |
| **365** | Ostatní závazky ke společníkům |

### 37x — Jiné pohledávky a závazky
| Účet | Název |
|------|-------|
| **371** | Pohledávky z prodeje podniku |
| **372** | Závazky z koupě podniku |
| **378** | Jiné pohledávky (pohledávky z titulu náhrad škod) |
| **379** | Jiné závazky |

### 38x — Přechodné účty aktiv a pasiv
| Účet | Název | Příklad |
|------|-------|---------|
| **381** | Náklady příštích období | Předplacené nájemné, pojistné |
| **382** | Komplexní náklady příštích období | Náklady na přípravu a záběh výroby |
| **383** | Výdaje příštích období | Nájemné placené pozadu |
| **384** | Výnosy příštích období | Předem přijaté nájemné |
| **385** | Příjmy příštích období | Nevyfakturované dodávky |
| **388** | Dohadné účty aktivní | Pojistná náhrada (čekáme na potvrzení výše) |
| **389** | Dohadné účty pasivní | Nevyfakturovaná dodávka energie |', NULL, 3);

INSERT INTO knowledge_base (category, title, content, source_url, sort_order) VALUES
('chart_of_accounts', 'DPH účtování — praktický průvodce (účet 343)', '## DPH na účtu 343 — praktický průvodce

### Princip účtu 343
Účet 343 slouží ke sledování DPH na **vstupu** (odpočet) a **výstupu** (povinnost přiznat). Na konci zdaňovacího období se zůstatek vyrovná přiznáním k DPH.

### Běžné účtování

**Přijatá faktura s DPH (nákup materiálu):**
```
Základ:  501/321  10 000 Kč (materiál do nákladů)
DPH:     343/321   2 100 Kč (DPH na vstupu — odpočet)
Celkem za fakturu:  12 100 Kč
```

**Vydaná faktura s DPH (prodej služby):**
```
Základ:  311/602  20 000 Kč (tržba za služby)
DPH:     311/343   4 200 Kč (DPH na výstupu — odvod)
Celkem faktura:     24 200 Kč
```

**Vyúčtování DPH za období:**
```
DPH na výstupu (Dal 343): 4 200 Kč
DPH na vstupu (MD 343):   2 100 Kč
→ Vlastní daňová povinnost: 2 100 Kč (odvod FÚ)
Zaúčtování: 343/221  2 100 Kč (úhrada DPH z BÚ)
```

### Analytické členění účtu 343
Doporučená analytika:
| Analytika | Význam |
|-----------|--------|
| **343.01** | DPH na vstupu — základní sazba 21% |
| **343.02** | DPH na vstupu — snížená sazba 12% |
| **343.11** | DPH na výstupu — základní sazba 21% |
| **343.12** | DPH na výstupu — snížená sazba 12% |
| **343.20** | DPH — reverse charge vstupy |
| **343.21** | DPH — reverse charge výstupy |
| **343.30** | DPH — pořízení z EU |
| **343.90** | DPH — vyrovnání s FÚ |

### Krácení odpočtu (§ 76 ZDPH)
Pokud plátce uskutečňuje osvobozená plnění bez nároku na odpočet:
- Vypočte koeficient: zdanitelná plnění / všechna plnění
- DPH na vstupu krátí tímto koeficientem
- Neodpočtená DPH = náklad (účet 538)

### Kontrola před podáním DPH přiznání
1. Odsouhlasení MD 343 = odpočet v přiznání (ř. 40–46)
2. Odsouhlasení Dal 343 = daň na výstupu (ř. 1–13, 25)
3. Kontrola: zůstatek 343 = vlastní daňová povinnost / nadměrný odpočet', NULL, 4);

-- ============================================================================
-- CATEGORY: standards — expand
-- ============================================================================

INSERT INTO knowledge_base (category, title, content, source_url, sort_order) VALUES
('standards', 'ČÚS 013 — Dlouhodobý hmotný a nehmotný majetek', '## ČÚS 013 — Dlouhodobý hmotný a nehmotný majetek

### Pořízení majetku
Způsoby pořízení a jejich ocenění:
| Způsob pořízení | Ocenění | Příklad |
|-----------------|---------|---------|
| Koupě | Pořizovací cena (cena + vedlejší náklady) | Stroj + doprava + montáž |
| Vlastní činnost | Vlastní náklady (přímé + nepřímé) | Stavba vlastními zaměstnanci |
| Dar | Reprodukční pořizovací cena (znalecký posudek) | Darovaný automobil |
| Vklad | Znalecký posudek nebo účetní hodnota | Vklad společníka |

**Vedlejší pořizovací náklady (součást PC):**
- Doprava, montáž, clo, pojistné při přepravě
- Průzkumy, projektové práce, příprava staveniště
- Licence, patenty nutné k provozu
- Zkoušky, zabezpečení staveniště

**NEJSOU součástí PC:**
- Úroky z úvěru (volitelně lze zahrnout — rozhodnutí ve směrnici)
- Kurzové rozdíly
- Smluvní pokuty
- Náklady na zaškolení zaměstnanců

### Technické zhodnocení vs. oprava
| | Technické zhodnocení (TZ) | Oprava |
|-|---------------------------|--------|
| **Definice** | Nástavba, přístavba, modernizace, rekonstrukce | Uvedení do předchozího stavu |
| **Hranice** | > 80 000 Kč za rok na 1 majetek (od 2021) | Bez limitu |
| **Účtování** | Zvyšuje PC majetku (04x/321, pak 02x/04x) | Do nákladů (511/321) |
| **Odpisy** | Zvýšená vstupní cena → nové odpisy | Ihned do nákladů |

### Odpisování

**Účetní odpisy:**
- Povinné dle § 28 ZoÚ a § 56 vyhlášky 500
- Metody: rovnoměrné, zrychlené (DDB), výkonové, komponentní
- Odpisový plán schvaluje ÚJ ve vnitřní směrnici
- Zahájení: měsíc po zařazení do užívání (nebo dle směrnice)

**Daňové odpisy (§ 26–33 ZDP):**
- 6 odpisových skupin (3–50 let)
- Rovnoměrné nebo zrychlené (volba při zařazení, nelze změnit)
- Roční odpis — nezáleží na měsíci zařazení (celý rok)
- Lze přerušit (výhodné v ztrátovém roce)

### Vyřazení majetku
| Důvod | Účtování oprávek | Účtování ZC |
|-------|------------------|-------------|
| Likvidace | 08x/02x | 551/08x |
| Prodej | 08x/02x | 541/08x + 311/641 |
| Dar | 08x/02x | 543/08x |
| Manko/škoda | 08x/02x | 549/08x |
| Vklad | 08x/02x | 367/08x |', 'https://www.mfcr.cz/cs/verejny-sektor/ucetnictvi-a-ucetni-vykaznictvi/ucetni-standardy', 3);

INSERT INTO knowledge_base (category, title, content, source_url, sort_order) VALUES
('standards', 'ČÚS 015 — Zásoby', '## ČÚS 015 — Zásoby

### Druhy zásob
- **Materiál** (účtová skupina 11): suroviny, pomocné látky, obaly, náhradní díly
- **Nedokončená výroba a polotovary** (skupina 12): produkty v procesu výroby
- **Výrobky** (skupina 12): dokončené vlastní výrobky
- **Mladá zvířata** (skupina 12): zvířata ve výchově
- **Zboží** (skupina 13): nakoupené za účelem dalšího prodeje

### Oceňování zásob
| Způsob pořízení | Ocenění |
|-----------------|---------|
| Koupě | Pořizovací cena (cena + vedlejší náklady: doprava, clo, pojistné) |
| Vlastní výroba | Vlastní náklady (přímé materiálové + mzdové + výrobní režie) |
| Dar / bezúplatné nabytí | Reprodukční pořizovací cena |

**Metody oceňování při výdeji:**
| Metoda | Popis | Vhodné pro |
|--------|-------|-----------|
| **FIFO** | First In, First Out — první nakoupené = první vydané | Standardní volba |
| **Vážený průměr** | Průměrná cena z nákupů (průběžný nebo periodický) | Velké objemy |
| **Pevná skladová cena** | Předem stanovená cena + oceňovací odchylky | Výrobní firmy |

**LIFO není v ČR povoleno!**

### Způsob A vs. Způsob B

**Způsob A — průběžné účtování:**
```
Příjem na sklad:     112/321 (nákup materiálu)
Výdej do spotřeby:   501/112 (spotřeba materiálu)
```
- Průběžná kontrola stavu skladu
- Vhodný pro firmy s velkým objemem zásob
- Zůstatek účtu 112 = skutečný stav skladu

**Způsob B — periodické účtování:**
```
Nákup (během roku):  501/321 (vše rovnou do nákladů)
Konec roku:          501/112 (rozpuštění PS)
                     112/501 (naskladnění KS dle inventury)
```
- Jednodušší průběžné účtování
- Stav skladu zjistitelný jen inventurou
- Vhodný pro malé firmy s malým objemem zásob

### Inventarizace zásob
- **Fyzická inventura:** přepočítání, přeměření, převážení
- **Dokladová inventura:** u zásob na cestě, u dodavatele
- **Normy přirozených úbytků:** schválené ve vnitřní směrnici (sesychání, rozprach, vypařování)
- **Manko nad normu:** účet 549 (škody)
- **Přebytek:** účet 648 (ostatní provozní výnosy)

### Opravné položky k zásobám
- Tvoří se při inventarizaci, pokud tržní cena < účetní hodnota
- Účtování: 559/196 (tvorba), 196/559 (zúčtování)
- Zásadně účetní (ne daňové) — daňově neuznatelné', 'https://www.mfcr.cz/cs/verejny-sektor/ucetnictvi-a-ucetni-vykaznictvi/ucetni-standardy', 4);
