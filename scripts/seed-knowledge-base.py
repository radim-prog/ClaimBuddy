#!/usr/bin/env python3
"""Seed knowledge base with comprehensive Czech accounting data."""
import json
import urllib.request
import urllib.error

SUPABASE_URL = "https://ybcubkuskirbspyoxpak.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliY3Via3Vza2lyYnNweW94cGFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzkxNzE1OCwiZXhwIjoyMDc5NDkzMTU4fQ.zVg4FIzm-DT3bRZZMXHF5a1647MGwFaGg-SLEEq5880"

def upsert_article(category, title, content, source_url=None, sort_order=0):
    """Insert article, skip if title+category already exists."""
    headers = {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=ignore-duplicates",
    }
    data = json.dumps({
        "category": category,
        "title": title,
        "content": content,
        "source_url": source_url,
        "sort_order": sort_order,
    }).encode("utf-8")
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/knowledge_base",
        data=data,
        headers=headers,
        method="POST"
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return True
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        if "duplicate" in body.lower() or e.code == 409:
            return False  # already exists
        print(f"  ERROR {e.code}: {body[:200]}")
        return False

ARTICLES = [

# ============================================================
# ÚČTOVÁ OSNOVA — třídy 1, 2, 4, 5, 6, 7
# ============================================================
("chart_of_accounts", "Třída 1 — Zásoby (detailně)", """## Třída 1 — Zásoby

Zásoby jsou krátkodobý majetek spotřebovaný zpravidla jednorázově nebo v krátkém časovém horizontu.

### Syntetické účty

| Účet | Název |
|------|-------|
| **111** | Pořízení materiálu |
| **112** | Materiál na skladě |
| **119** | Materiál na cestě |
| **121** | Nedokončená výroba |
| **122** | Polotovary vlastní výroby |
| **123** | Výrobky |
| **124** | Mladá a ostatní zvířata a jejich skupiny |
| **131** | Pořízení zboží |
| **132** | Zboží na skladě a v prodejnách |
| **139** | Zboží na cestě |
| **151** | Poskytnuté zálohy na zásoby |

### Způsoby účtování zásob

**Způsob A** — průběžná inventura: zásoby se účtují na sklad průběžně
- Příjem materiálu: MD 112 / D 111
- Spotřeba materiálu: MD 501 / D 112

**Způsob B** — periodická inventura: zásoby se účtují přímo do nákladů, na konci roku se zaúčtuje stav skladu
- Nákup materiálu: MD 501 / D 321
- Na konci roku: MD 112 / D 501 (stav skladu)

### Ocenění zásob
- **Pořizovací cenou** (nákupní cena + vedlejší pořizovací náklady)
- **Vlastními náklady** (zásoby vyrobené vlastní činností)
- **Reprodukční pořizovací cenou** (bezúplatné nabytí)

### Metody oceňování výdeje ze skladu
- **FIFO** (první dovnitř, první ven) — nejčastější
- **Vážený aritmetický průměr** — průběžný nebo periodický
- **Pevná cena** s odchylkami

**Zdroj:** Zákon č. 563/1991 Sb. (§ 25), ČÚS 015, Vyhláška č. 500/2002 Sb.
**Aktuálnost:** 2025""", "https://www.zakonyprolidi.cz/cs/1991-563", 10),

("chart_of_accounts", "Třída 2 — Krátkodobý finanční majetek a bankovní úvěry", """## Třída 2 — Krátkodobý finanční majetek a krátkodobé bankovní úvěry

### Syntetické účty

| Účet | Název |
|------|-------|
| **211** | Pokladna |
| **213** | Ceniny (stravenky, kolky, poštovní známky) |
| **221** | Bankovní účty |
| **231** | Krátkodobé bankovní úvěry |
| **232** | Eskontní úvěry |
| **241** | Emitované krátkodobé dluhopisy |
| **249** | Ostatní krátkodobé finanční výpomoci |
| **251** | Majetkové cenné papíry k obchodování |
| **252** | Vlastní akcie a vlastní obchodní podíly |
| **253** | Dluhové cenné papíry k obchodování |
| **255** | Vlastní dluhopisy |
| **256** | Dluhové cenné papíry se splatností do 1 roku držené do splatnosti |
| **259** | Pořizování krátkodobého finančního majetku |
| **261** | Peníze na cestě |

### Pokladna (účet 211)
- Max. zůstatek stanovuje vnitřní směrnice
- Každý pohyb doložen dokladem (příjmový / výdajový pokladní doklad)
- Záporný zůstatek není přípustný!

### Bankovní účty (účet 221)
- Analytické členění dle jednotlivých bankovních účtů
- Základ pro odsouhlasení s bankovním výpisem

### Ceniny (účet 213)
- Poštovní známky, kolky, stravenky, dálniční kupóny
- Účtují se jako krátkodobý majetek, spotřeba do nákladů

**Zdroj:** Vyhláška č. 500/2002 Sb., ČÚS 016
**Aktuálnost:** 2025""", "https://www.zakonyprolidi.cz/cs/2002-500", 20),

("chart_of_accounts", "Třída 4 — Kapitálové účty a dlouhodobé závazky", """## Třída 4 — Kapitálové účty a dlouhodobé závazky

### Syntetické účty — Vlastní kapitál

| Účet | Název |
|------|-------|
| **411** | Základní kapitál |
| **412** | Ážio a kapitálové fondy |
| **413** | Ostatní kapitálové fondy |
| **414** | Oceňovací rozdíly z přecenění majetku a závazků |
| **418** | Oceňovací rozdíly z přecenění při přeměnách obchodních korporací |
| **419** | Změny základního kapitálu |
| **421** | Rezervní fond |
| **422** | Statutární fondy |
| **423** | Ostatní fondy |
| **426** | Jiný výsledek hospodaření minulých let |
| **427** | Nerozdělený zisk minulých let |
| **428** | Neuhrazená ztráta minulých let |
| **431** | Výsledek hospodaření ve schvalovacím řízení |

### Syntetické účty — Rezervy a dlouhodobé závazky

| Účet | Název |
|------|-------|
| **441** | Rezervy podle zvláštních právních předpisů |
| **451** | Rezervy |
| **461** | Bankovní úvěry |
| **473** | Emitované dluhopisy |
| **474** | Závazky z pronájmu |
| **475** | Dlouhodobé přijaté zálohy |
| **478** | Dlouhodobé směnky k úhradě |
| **479** | Ostatní dlouhodobé závazky |

### Důležité vazby
- Základní kapitál (411) = zapsaný v obchodním rejstříku
- Výsledek hospodaření (431) se po schválení převádí na 427 (zisk) nebo 428 (ztráta)
- Rezervy (451) — daňově uznatelné jen zákonné rezervy (zákon č. 593/1992 Sb.)

**Zdroj:** Vyhláška č. 500/2002 Sb., ČÚS 012, ČÚS 018
**Aktuálnost:** 2025""", "https://www.zakonyprolidi.cz/cs/2002-500", 40),

("chart_of_accounts", "Třída 5 — Náklady (detailně)", """## Třída 5 — Náklady

### Syntetické účty

| Účet | Název |
|------|-------|
| **501** | Spotřeba materiálu |
| **502** | Spotřeba energie |
| **503** | Spotřeba ostatních neskladovatelných dodávek |
| **504** | Prodané zboží |
| **511** | Opravy a udržování |
| **512** | Cestovné |
| **513** | Náklady na reprezentaci (50 % daňově uznatelné) |
| **518** | Ostatní služby |
| **521** | Mzdové náklady |
| **522** | Příjmy společníků a členů ze závislé činnosti |
| **523** | Odměny členům orgánů obchodní korporace |
| **524** | Zákonné sociální pojištění (SP + ZP hrazené zaměstnavatelem) |
| **525** | Ostatní sociální pojištění |
| **526** | Sociální náklady individuálního podnikatele |
| **527** | Zákonné sociální náklady |
| **528** | Ostatní sociální náklady |
| **531** | Daň silniční |
| **532** | Daň z nemovitých věcí |
| **538** | Ostatní daně a poplatky |
| **541** | Zůstatková cena prodaného dlouhodobého nehmotného a hmotného majetku |
| **542** | Prodaný materiál |
| **543** | Dary |
| **544** | Smluvní pokuty a úroky z prodlení |
| **545** | Ostatní pokuty a penále |
| **546** | Odpis pohledávky |
| **548** | Ostatní provozní náklady |
| **549** | Manka a škody z provozní činnosti |
| **551** | Odpisy dlouhodobého nehmotného a hmotného majetku |
| **552** | Tvorba a zúčtování rezerv podle zvláštních zákonů |
| **554** | Tvorba a zúčtování ostatních rezerv |
| **557** | Zúčtování oprávky k oceňovacímu rozdílu k nabytému majetku |
| **558** | Tvorba a zúčtování zákonných opravných položek |
| **559** | Tvorba a zúčtování opravných položek v provozní činnosti |
| **561** | Prodané cenné papíry a podíly |
| **562** | Úroky |
| **563** | Kursové ztráty |
| **564** | Náklady z přecenění cenných papírů |
| **568** | Ostatní finanční náklady |
| **569** | Manka a škody na finančním majetku |
| **574** | Tvorba a zúčtování finančních rezerv |
| **579** | Tvorba a zúčtování opravných položek ve finanční činnosti |
| **581** | Náklady na změnu metody |
| **582** | Škody |
| **584** | Tvorba a zúčtování mimořádných rezerv |
| **588** | Ostatní mimořádné náklady |
| **591** | Daň z příjmů z běžné činnosti — splatná |
| **592** | Daň z příjmů z běžné činnosti — odložená |
| **593** | Daň z příjmů z mimořádné činnosti — splatná |
| **594** | Daň z příjmů z mimořádné činnosti — odložená |
| **595** | Dodatečné odvody daně z příjmů |

### Klíčová pravidla
- Náklady na reprezentaci (513) — **50 % daňově neuznatelné**
- Mzdové náklady (521) + zákonné SP/ZP (524) = základ pro výpočet personálních nákladů
- Odpisy (551) — účetní odpisy mohou být jiné než daňové!

**Zdroj:** Vyhláška č. 500/2002 Sb., Zákon č. 586/1992 Sb.
**Aktuálnost:** 2025""", "https://www.zakonyprolidi.cz/cs/2002-500", 50),

("chart_of_accounts", "Třída 6 — Výnosy (detailně)", """## Třída 6 — Výnosy

### Syntetické účty

| Účet | Název |
|------|-------|
| **601** | Tržby za vlastní výrobky |
| **602** | Tržby z prodeje služeb |
| **604** | Tržby za zboží |
| **611** | Změna stavu nedokončené výroby |
| **612** | Změna stavu polotovarů vlastní výroby |
| **613** | Změna stavu výrobků |
| **614** | Změna stavu zvířat |
| **621** | Aktivace materiálu a zboží |
| **622** | Aktivace vnitropodnikových služeb |
| **623** | Aktivace dlouhodobého nehmotného majetku |
| **624** | Aktivace dlouhodobého hmotného majetku |
| **641** | Tržby z prodeje dlouhodobého nehmotného a hmotného majetku |
| **642** | Tržby z prodeje materiálu |
| **644** | Smluvní pokuty a úroky z prodlení |
| **648** | Ostatní provozní výnosy |
| **661** | Tržby z prodeje cenných papírů a podílů |
| **662** | Úroky |
| **663** | Kursové zisky |
| **664** | Výnosy z přecenění cenných papírů |
| **665** | Výnosy z dlouhodobého finančního majetku |
| **666** | Výnosy z krátkodobého finančního majetku |
| **667** | Výnosy z derivátových operací |
| **668** | Ostatní finanční výnosy |
| **681** | Výnosy ze změny metody |
| **688** | Ostatní mimořádné výnosy |

### Aktivace (účty 621–624)
Aktivace = zaúčtování majetku vytvořeného vlastní činností do výnosů (souvztažně s náklady). Zároveň se majetek/zásoby zachytí na příslušném aktivním účtu.

Příklad: Firma si postaví vlastní sklad (náklady 500 000 Kč):
- MD 042 / D 624 — aktivace DHM (500 000 Kč)
- Po dokončení: MD 022 / D 042

**Zdroj:** Vyhláška č. 500/2002 Sb., ČÚS 019
**Aktuálnost:** 2025""", "https://www.zakonyprolidi.cz/cs/2002-500", 60),

("chart_of_accounts", "Třída 7 — Závěrkové a podrozvahové účty", """## Třída 7 — Závěrkové a podrozvahové účty

### Závěrkové účty

| Účet | Název | Použití |
|------|-------|---------|
| **701** | Počáteční účet rozvažný | Otevření účetních knih (MD/D dle bilanční rovnice) |
| **702** | Konečný účet rozvažný | Uzavření rozvahových účtů |
| **710** | Účet zisků a ztrát | Uzavření nákladových a výnosových účtů |

### Podrozvahové účty (třída 75–79)

Podrozvahové účty zachycují majetek, který nepatří účetní jednotce, ale je jí svěřen, nebo závazky a pohledávky podmíněné (možné, ne jisté).

| Rozsah | Příklady |
|--------|---------|
| **750–759** | Najatý majetek, leasing, majetek v zástavě |
| **760–769** | Pohledávky z leasingu, podmíněné pohledávky |
| **770–779** | Závazky z leasingu, záruky, ručení |
| **780–789** | Odepsané pohledávky (sledování pro případné vymáhání) |

### Jak probíhá uzávěrka

1. **Přeúčtování nákladů a výnosů** → na účet 710 (Účet zisků a ztrát)
   - MD 710 / D 5xx (přeúčtování nákladů)
   - MD 6xx / D 710 (přeúčtování výnosů)

2. **Zjištění HV** — rozdíl na účtu 710 = výsledek hospodaření
   - Zisk: MD 710 / D 702
   - Ztráta: MD 702 / D 710

3. **Uzavření rozvahových účtů** → na účet 702
   - Aktiva: MD 702 / D Axx
   - Pasiva: MD Pxx / D 702

4. **Otevření v novém roce** → účet 701
   - Aktiva: MD Axx / D 701
   - Pasiva: MD 701 / D Pxx

**Zdroj:** ČÚS 002, Zákon č. 563/1991 Sb. § 17
**Aktuálnost:** 2025""", "https://www.zakonyprolidi.cz/cs/1991-563", 70),

# ============================================================
# PŘEDKONTACE — procedures category
# ============================================================
("procedures", "Předkontace — nákup a prodej", """## Předkontace: Nákup a prodej (plátce DPH)

### Nákup materiálu na fakturu (způsob A)

| Operace | MD | D | Částka |
|---------|----|---|--------|
| Přijatá faktura za materiál (základ) | 111 | 321 | cena bez DPH |
| DPH 21 % na vstupu | 343 | 321 | DPH |
| Příjem materiálu na sklad | 112 | 111 | cena bez DPH |
| Úhrada faktury | 321 | 221 | celkem s DPH |

### Nákup zboží na fakturu

| Operace | MD | D |
|---------|----|---|
| Přijatá faktura (základ DPH) | 131 | 321 |
| DPH 21 % | 343 | 321 |
| Příjem zboží na sklad | 132 | 131 |
| Úhrada | 321 | 221 |

### Prodej zboží na fakturu

| Operace | MD | D |
|---------|----|---|
| Vydaná faktura (základ DPH) | 311 | 604 |
| DPH 21 % na výstupu | 311 | 343 |
| Výdej zboží ze skladu | 504 | 132 |
| Příjem platby | 221 | 311 |

### Nákup v hotovosti (přes pokladnu)

| Operace | MD | D |
|---------|----|---|
| Nákup materiálu za hotovost | 501 | 211 |
| DPH (pokud plátce, doklad s DPH) | 343 | 211 |
| Nákup PHM (výdajový pokladní doklad) | 501 | 211 |

### Nákup dlouhodobého hmotného majetku

| Operace | MD | D |
|---------|----|---|
| Faktura za DHM (základ) | 042 | 321 |
| DPH na vstupu | 343 | 321 |
| Zařazení do majetku | 022 | 042 |
| Úhrada | 321 | 221 |

> **Pozor:** DPH z pořízení DHM se uplatní na vstupu stejně jako u zásob. Základ DHM = cena bez DPH.

**Zdroj:** ČÚS 015, ČÚS 013, Zákon č. 235/2004 Sb. (DPH)
**Aktuálnost:** 2025""", "https://www.zakonyprolidi.cz/cs/2004-235", 15),

("procedures", "Předkontace — mzdy a odvody", """## Předkontace: Mzdy a odvody (2025)

### Výpočet a zaúčtování mezd

Příklad: Zaměstnanec, hrubá mzda **40 000 Kč**, podepsal Prohlášení, 1 dítě

| Položka | Výpočet | Kč |
|---------|---------|-----|
| Hrubá mzda | | 40 000 |
| SP zaměstnanec (7,1 %) | 40 000 × 7,1 % | 2 840 |
| ZP zaměstnanec (4,5 %) | 40 000 × 4,5 % | 1 800 |
| Základ daně | 40 000 | 40 000 |
| Záloha na daň (15 %) | 40 000 × 15 % | 6 000 |
| Sleva poplatník | | − 2 570 |
| Daň. zvýhodnění (1. dítě) | | − 1 267 |
| Záloha na daň po slevách | | 2 163 |
| **Čistá mzda** | 40 000 − 2 840 − 1 800 − 2 163 | **33 197** |

### Zaúčtování mezd

| Operace | MD | D | Kč |
|---------|----|---|-----|
| Hrubá mzda | 521 | 331 | 40 000 |
| SP zaměstnanec (7,1 %) | 331 | 336 | 2 840 |
| ZP zaměstnanec (4,5 %) | 331 | 336 | 1 800 |
| Záloha na daň z příjmu | 331 | 342 | 2 163 |
| SP zaměstnavatel (24,8 %) | 524 | 336 | 9 920 |
| ZP zaměstnavatel (9,0 %) | 524 | 336 | 3 600 |
| Výplata čisté mzdy | 331 | 221 | 33 197 |
| Odvod SP (celkem) | 336 | 221 | 12 760 |
| Odvod ZP (celkem) | 336 | 221 | 5 400 |
| Odvod zálohy na daň | 342 | 221 | 2 163 |

### Termíny odvodů
- **Záloha na daň:** do 20. dne následujícího měsíce
- **SP:** do 20. dne následujícího měsíce
- **ZP:** do 8. dne druhého měsíce po zúčtovacím období

### Analytic pro účet 336
- 336.100 — sociální pojištění zaměstnanců
- 336.200 — zdravotní pojištění zaměstnanců
- 336.300 — SP zaměstnavatel
- 336.400 — ZP zaměstnavatel

**Zdroj:** Zákon č. 586/1992 Sb. § 38h, Zákon č. 589/1992 Sb., Zákon č. 592/1992 Sb.
**Aktuálnost:** 2025""", "https://www.zakonyprolidi.cz/cs/1992-589", 16),

("procedures", "Předkontace — odpisy a majetek", """## Předkontace: Odpisy a majetek

### Účetní odpisy (měsíční)

Příklad: Stroj pořizovací cena **120 000 Kč**, životnost 5 let → měsíční odpis = 2 000 Kč

| Operace | MD | D | Kč |
|---------|----|---|----|
| Účetní odpis (měsíčně) | 551 | 082 | 2 000 |

> **Pozor:** Účet 082 = Oprávky k samostatným movitým věcem.
> Stroj zůstane na účtu 022 v pořizovací ceně, oprávky ho snižují.

### Daňové odpisy (roční) — odpisové skupiny 2025

| Skupina | Příklady | Roky |
|---------|---------|------|
| 1 | Počítače, nástroje | 3 |
| 2 | Auta, stroje, nábytek | 5 |
| 3 | Klimatizace, výtahy, kotle | 10 |
| 4 | Budovy ze dřeva, prefabrikáty | 20 |
| 5 | Budovy, haly, mosty | 30 |
| 6 | Administrativní budovy, hotely | 50 |

### Vyřazení majetku (prodej)

| Operace | MD | D |
|---------|----|---|
| Prodejní faktura (základ DPH) | 311 | 641 |
| DPH 21 % | 311 | 343 |
| Vyřazení — zůstatková cena | 541 | 082 |
| Vyřazení — pořizovací cena | 082 | 022 |

### Vyřazení majetku (likvidace)

| Operace | MD | D |
|---------|----|---|
| Zůstatková cena → náklady | 549 | 082 |
| Vyřazení z evidence | 082 | 022 |

### Technické zhodnocení (TZ)
- TZ > 80 000 Kč ročně = zvyšuje pořizovací cenu majetku: MD 042 / D 321
- Po dokončení: MD 022 / D 042
- TZ restartuje daňové odpisy v příslušné odpisové skupině

**Zdroj:** Zákon č. 586/1992 Sb. § 26–33, ČÚS 013
**Aktuálnost:** 2025""", "https://www.zakonyprolidi.cz/cs/1992-586", 17),

("procedures", "Předkontace — DPH a daň z příjmů", """## Předkontace: DPH a daň z příjmů

### DPH — zúčtování (měsíčně / čtvrtletně)

| Operace | MD | D |
|---------|----|---|
| DPH na vstupu (nákupy) | 343 | různé | → kumuluje se jako pohledávka |
| DPH na výstupu (prodeje) | různé | 343 | → kumuluje se jako závazek |
| **Nadměrný odpočet** (vstup > výstup) | 343 | — | zůstatek na MD = pohledávka za FÚ |
| **Vlastní daňová povinnost** (výstup > vstup) | — | 343 | zůstatek na D = závazek vůči FÚ |
| Odvod DPH na FÚ | 343 | 221 | |
| Vrácení nadměrného odpočtu | 221 | 343 | |

### Silniční daň (roční)

| Operace | MD | D |
|---------|----|---|
| Zálohy na silniční daň (čtvrtletně) | 531 | 345 |
| Doplatek / přeplatek po podání DP | 531/345 | 345/531 |
| Odvod na FÚ | 345 | 221 |

### Daň z příjmů právnické osoby (roční uzávěrka)

| Operace | MD | D |
|---------|----|---|
| Zálohy na DPPO (průběžně) | 341 | 221 |
| Výpočet splatné daně (DP) | 591 | 341 |
| Doplatek daně | 341 | 221 |
| Přeplatek (vrácení) | 221 | 341 |
| Odložená daň (tvorba) | 592 | 481 |
| Odložená daň (zrušení) | 481 | 592 |

### Zálohy na daň z příjmů (DPPO)

| Základ (daňová povinnost za rok) | Zálohy |
|----------------------------------|--------|
| Do 30 000 Kč | Žádné zálohy |
| 30 000 – 150 000 Kč | Pololetní zálohy — 40 % posl. daně (duben, říjen) |
| Nad 150 000 Kč | Čtvrtletní zálohy — 25 % posl. daně (duben, červen, září, prosinec) |

**Zdroj:** Zákon č. 235/2004 Sb., Zákon č. 586/1992 Sb. § 38a
**Aktuálnost:** 2025""", "https://www.zakonyprolidi.cz/cs/2004-235", 18),

("procedures", "Předkontace — bankovní a kurzové operace", """## Předkontace: Bankovní a kurzové operace

### Bankovní operace

| Operace | MD | D |
|---------|----|---|
| Příchozí platba od odběratele | 221 | 311 |
| Odchozí platba dodavateli | 321 | 221 |
| Výběr hotovosti z banky | 211 | 221 |
| Vklad hotovosti do banky | 221 | 211 |
| Bankovní poplatky | 568 | 221 |
| Přijaté úroky z bankovního účtu | 221 | 662 |
| Zaplacené úroky z úvěru | 562 | 221 |

### Peníze na cestě (účet 261)

Použití: přeúčtování mezi pokladnou a bankou, kdy pohyb trvá více dnů:
1. Výběr z bankomatu: MD 261 / D 221
2. Příjem do pokladny: MD 211 / D 261

### Kurzové rozdíly (účet 563 a 663)

Při platbách v cizí měně:

| Situace | Operace | MD | D |
|---------|---------|----|----|
| Kurzová ztráta (závazek) | záv. v EUR vyšší v Kč než při vzniku | 563 | 321 |
| Kurzový zisk (závazek) | záv. v EUR nižší v Kč než při vzniku | 321 | 663 |
| Kurzová ztráta (pohledávka) | pohl. v EUR nižší v Kč než při vzniku | 563 | 311 |
| Kurzový zisk (pohledávka) | pohl. v EUR vyšší v Kč než při vzniku | 311 | 663 |

### Kurzy pro přepočet (ČNB)

- **Denní kurz** ČNB — vždy nejpřesnější
- **Pevný kurz** — firma si zvolí na zúčtovací období (max. 1 rok), schválí vnitřní směrnicí
- **Roční přepočet** — k 31.12. se přeceňují všechny cizoměnové pohledávky a závazky kurzem ČNB

**Zdroj:** ČÚS 006, Zákon č. 563/1991 Sb. § 4 odst. 12, Vyhláška č. 500/2002 Sb.
**Aktuálnost:** 2025""", "https://www.cnb.cz/cs/financni_trhy/devizovy_trh/kurzy_devizoveho_trhu/", 19),

# ============================================================
# DPH — doplnění
# ============================================================
("vat", "Sazby DPH 2025 — aktuální přehled", """## Sazby DPH v ČR 2025

Od **1. ledna 2024** platí pouze **dvě sazby DPH**:

| Sazba | Výše | Použití |
|-------|------|---------|
| **Základní** | **21 %** | Většina zboží a služeb |
| **Snížená** | **12 %** | Viz níže |

### Co patří do 12 % (snížená sazba)

- Potraviny a nápoje (kromě alkoholu)
- Léky a zdravotnické prostředky
- Knihy, noviny, časopisy
- Ubytovací služby
- Vodné a stočné
- Pohostinské a stravovací služby (jídlo)
- Zdravotní péče
- Hromadná pravidelná přeprava cestujících
- Vstupné na kulturní a sportovní akce
- Dětské pleny a autosedačky
- Domácí péče (zdravotní a sociální)

### Co se přesunulo do 21 % od 1.1.2024

Oproti předchozím sazbám (10 % / 15 %) přesunuto do 21 %:
- Točené pivo v restauracích
- Kadeřnické a holičské služby
- Opravy obuvi a textilu
- Opravy a úpravy jízdních kol
- Autorské výkony (živé)
- Palivové dřevo
- Řezané květiny
- Letecká hromadná přeprava
- Komunální odpad
- Úklidové služby domácností

### Registrační práh 2025

Od roku 2025 se registrační povinnost počítá z **kalendářního roku** (nikoliv z posledních 12 měsíců):
- Práh: **2 000 000 Kč** obratu za kalendářní rok
- Povinná registrace: do 10 dnů po překročení
- Plátcem se stává od 1. dne druhého měsíce po překročení

### Dobrovolná registrace k DPH

Kdykoli, i pod prahem. Výhodné pro plátce pracující hlavně s jinými plátci DPH.

**Zdroj:** Zákon č. 235/2004 Sb. o DPH, novelizace zákonem č. 349/2023 Sb.
**Aktuálnost:** 2025""", "https://www.zakonyprolidi.cz/cs/2004-235", 1),

("vat", "Termíny DPH přiznání a plateb 2025", """## Termíny DPH — přiznání a platby 2025

### Zdaňovací období

| Plátce | Období | Podmínky |
|--------|--------|----------|
| **Čtvrtletní** | Každé čtvrtletí | Obrat < 10 mil. Kč/rok (nebo méně) |
| **Měsíční** | Každý měsíc | Obrat ≥ 10 mil. Kč/rok NEBO povinně první rok plátcovství |

### Termíny podání a platby

Přiznání k DPH se podává do **25 dnů po skončení zdaňovacího období**:

| Zdaňovací období | Termín podání |
|------------------|---------------|
| Leden 2025 | 25. února 2025 |
| Únor 2025 | 25. března 2025 |
| Březen (Q1) | 25. dubna 2025 |
| Červen (Q2) | 25. července 2025 |
| Září (Q3) | 27. října 2025 (pondělí) |
| Prosinec (Q4) | 26. ledna 2026 (pondělí) |

> Při víkendu/svátku se přesouvá na nejbližší pracovní den.

### Povinné elektronické podání

Od 1. 1. 2016 **všichni plátci DPH povinně elektronicky** přes:
- Daňový portál Finanční správy (EPO): https://adisspr.mfcr.cz
- Datová schránka
- Daňový poradce / účetní software

### Nadměrný odpočet

Pokud vstupní DPH > výstupní DPH → vzniká nárok na vrácení:
- FÚ vrátí do **30 dnů** od podání přiznání (bez výzvy)
- Pokud je součástí místního šetření → lhůta se prodlužuje

### Identifikovaná osoba (IO)

Firma, která překročí práh pro přijetí služby z EU nebo pořízení zboží z EU:
- Musí se registrovat jako IO (neplatí DPH z tuzemských plnění)
- Přiznání podává jen za zdaňovací období, ve kterém měla plnění

**Zdroj:** Zákon č. 235/2004 Sb. o DPH § 99–101b
**Aktuálnost:** 2025""", "https://www.zakonyprolidi.cz/cs/2004-235", 2),

# ============================================================
# DANĚ Z PŘÍJMŮ — rozšíření
# ============================================================
("income_tax", "DPFO — Slevy na dani a daňové zvýhodnění 2025", """## DPFO: Slevy na dani 2025

### Přehled slev pro fyzické osoby

| Sleva | Roční výše (Kč) | Měsíční (Kč) | Podmínky |
|-------|----------------|--------------|----------|
| **Základní sleva poplatník** | **30 840** | **2 570** | Každý daňový rezident ČR |
| **Manžel/manželka** | **24 840** | — | Příjem partnera ≤ 68 000 Kč/rok; jen v DP |
| **Invalidita I.–II. stupeň** | **2 520** | **210** | Rozhodnutí ČSSZ |
| **Invalidita III. stupeň** | **5 040** | **420** | Rozhodnutí ČSSZ |
| **Průkaz ZTP/P** | **16 140** | **1 345** | Průkaz ZTP/P |

> **Zrušeno od roku 2024:**
> - Sleva na studenta (dříve 4 020 Kč/rok)
> - Sleva na školkovné (dříve až 17 300 Kč/rok)

### Daňové zvýhodnění na děti (daňový bonus)

| Dítě | Roční výše (Kč) | Měsíční (Kč) |
|------|----------------|--------------|
| **1. dítě** | **15 204** | **1 267** |
| **2. dítě** | **22 320** | **1 860** |
| **3. a každé další** | **27 840** | **2 320** |

**Daňový bonus** = část zvýhodnění nad výši daňové povinnosti → stát ji vyplatí!
- Podmínka: příjem ≥ 6× minimální mzda = 6 × 20 800 = **124 800 Kč/rok**
- Max. bonus: bez limitu

### Sazby DPFO 2025

| Roční základ daně | Sazba |
|-------------------|-------|
| Do **1 676 052 Kč** | **15 %** |
| Nad 1 676 052 Kč | **23 %** |

Měsíčně: 23 % od hrubé mzdy nad cca **139 671 Kč/měs.**

### Postup výpočtu zálohy na daň (zaměstnanci)

1. Hrubá mzda
2. − Základ daně (= hrubá mzda, od 2021 zrušeno SHM)
3. × sazba (15 % nebo 23 %)
4. − sleva na poplatníka (2 570 Kč/měs.)
5. − daňové zvýhodnění (děti)
6. = záloha na daň

**Zdroj:** Zákon č. 586/1992 Sb. § 35ba, § 35c, § 16
**Aktuálnost:** 2025""", "https://www.zakonyprolidi.cz/cs/1992-586", 10),

("income_tax", "OSVČ — Paušální výdaje a paušální daň 2025/2026", """## OSVČ: Paušální výdaje a paušální daň 2025/2026

### Paušální výdaje (% z příjmů)

| Typ činnosti | Paušál | Max. výdaje |
|-------------|--------|-------------|
| Zemědělská výroba, lesnictví, vodní hospodářství | **80 %** | 1 600 000 Kč |
| **Řemeslné živnosti** (elektrikář, instalatér, zedník...) | **80 %** | 1 600 000 Kč |
| Ostatní živnosti (volné, vázané, koncesované) | **60 %** | 1 200 000 Kč |
| Jiná SVČ (autoři, lékaři, advokáti, tlumočníci) | **40 %** | 800 000 Kč |
| **Pronájem** majetku (§ 9) | **30 %** | 600 000 Kč |

> Paušál se počítá z příjmů do **2 000 000 Kč** (nad tuto částku nelze paušál uplatnit).

### Paušální daň — pásma 2025 a 2026

Paušální daň = SP + ZP + daň z příjmů — vše v jedné platbě.

| Pásmo | Měsíční platba 2025 | Měsíční platba 2026 | Podmínky příjmů |
|-------|--------------------|--------------------|-----------------|
| **1. pásmo** | **8 716 Kč** | **9 984 Kč** | Příjmy do 2 mil. Kč, 80 % paušál; nebo do 1,5 mil. při 60–80 %; nebo do 1 mil. při 40 % |
| **2. pásmo** | **16 745 Kč** | **16 745 Kč** | Příjmy 1,5–2 mil. (60–80 %); nebo 1–1,5 mil. (40 %) |
| **3. pásmo** | **27 139 Kč** | **27 139 Kč** | Příjmy 1,5–2 mil. při 40 % paušálu (právníci, auditoři, poradci) |

### Podmínky pro vstup do paušální daně

- Příjmy ze SVČ ≤ 2 000 000 Kč/rok
- NEPLATCE DPH (nebo jen příležitostný plátce)
- Nemá příjmy ze závislé činnosti (§ 6) nad 20 000 Kč
- Nemá příjmy z podílu na s.r.o. nad 20 000 Kč
- Nemá daňovou ztrátu z minulých let

**Vstup/výstup/změna pásma:** Oznámení finančnímu úřadu do **10. ledna** daného roku.

### OSVČ přehled SP/ZP — termíny

| Doklad | Termín |
|--------|--------|
| Přehled OSVČ pro ČSSZ | Do 31. 8. (při daňovém poradci do 31. 10.) |
| Přehled OSVČ pro ZP | Do 31. 8. (při DP do 31. 10.) |
| Zálohy — první po podání přehledu | Měsíčně, do 20. dne |

### Minimální zálohy OSVČ 2025

| | Hlavní činnost | Vedlejší činnost |
|-|----------------|-----------------|
| **SP** | 3 852 Kč/měs. | 1 556 Kč/měs. |
| **ZP** | 2 944 Kč/měs. | — (podle výdělku) |

**Zdroj:** Zákon č. 586/1992 Sb. § 7, § 38lc, Zákon č. 589/1992 Sb.
**Aktuálnost:** 2025/2026""", "https://www.zakonyprolidi.cz/cs/1992-586", 11),

("income_tax", "DPPO — Daň z příjmů právnických osob 2025", """## DPPO: Daň z příjmů právnických osob 2025

### Sazba daně

| Typ | Sazba 2025 |
|-----|------------|
| **Obecná sazba** | **21 %** |
| Investiční fondy (splňující podmínky) | 5 % |
| Penzijní fondy | 0 % |
| Podílové fondy | 5 % |

### Základ daně

1. **Hospodářský výsledek** (HV před zdaněním = výnosy − náklady)
2. **+ připočitatelné položky** (daňově neuznatelné náklady)
3. **− odčitatelné položky** (daňové úlevy, odpočty)
4. = **daňový základ** (zaokrouhlený na celé tisíce dolů)
5. × **21 %** = daňová povinnost

### Připočitatelné položky (zvyšují základ daně)

- Náklady na reprezentaci (§ 25/1/t) — 100 %
- Manka a škody nad náhradu
- Penále a pokuty (ne smluvní)
- Daň z příjmů (591) — sama o sobě není nákladem
- Přirážky k zákonným odpisům (účetní > daňové odpisy)
- Tvorba rezerv nad zákonné rezervy
- Neuznatelné opravné položky

### Odčitatelné položky

- **Daňová ztráta** z minulých let (max. 5 let zpětně)
- **Výzkum a vývoj** — odpočet až 200 % nákladů (§ 34a)
- **Dary** — max. 10 % základu daně, min. 2 000 Kč (§ 20 odst. 8)
- **Reinvestiční odpočet** — 50 % pořizovací ceny nového majetku

### Zálohy na DPPO

| Poslední daňová povinnost | Zálohy |
|--------------------------|--------|
| Do 30 000 Kč | Žádné |
| 30 000 – 150 000 Kč | 2× ročně (40 % − duben, 40 % − říjen) |
| Nad 150 000 Kč | 4× ročně (25 % − duben, červen, září, prosinec) |

### Termín podání DPPO

| Situace | Termín |
|---------|--------|
| Standardní | Do **1. dubna** následujícího roku |
| S daňovým poradcem | Do **1. července** (potvrzení plné moci do 1.4.) |
| Povinný audit | Do **1. července** |

**Zdroj:** Zákon č. 586/1992 Sb. § 17–21a, § 34, § 38a
**Aktuálnost:** 2025""", "https://www.zakonyprolidi.cz/cs/1992-586", 12),

# ============================================================
# MZDOVÉ ÚČETNICTVÍ — rozšíření
# ============================================================
("payroll", "Odvody ze mzdy 2025 — kompletní přehled", """## Odvody ze mzdy 2025 — zaměstnanec + zaměstnavatel

### Sazby pojistného

| | Zaměstnavatel | Zaměstnanec | Celkem |
|-|---------------|-------------|--------|
| **Sociální pojištění** | **24,8 %** | **7,1 %** | 31,9 % |
| — z toho důchodové pojištění | 21,5 % | 6,5 % | |
| — z toho nemocenské pojištění | 2,1 % | 0,6 % | |
| — z toho příspěvek na st. pol. zam. | 1,2 % | — | |
| **Zdravotní pojištění** | **9,0 %** | **4,5 %** | 13,5 % |
| **Celkem** | **33,8 %** | **11,6 %** | 45,4 % |

### Maximální vyměřovací základ SP 2025

- **48× průměrná mzda** = 48 × 46 557 = **2 234 736 Kč/rok**
- = cca **186 228 Kč/měsíc** (průměr)
- Nad tímto stropem SP zaměstnanec neplatí!
- ZP — **BEZ STROPU**

### Minimální mzda 2025 / 2026

| Rok | Měsíční | Hodinová |
|-----|---------|----------|
| **2025** | **20 800 Kč** | **124,40 Kč** |
| **2026** | **22 400 Kč** | **134,40 Kč** |

### Dohody o pracích konaných mimo pracovní poměr 2025

**DPP (dohoda o provedení práce):**
- Max. **300 hodin/rok** u jednoho zaměstnavatele
- Do odměny **10 499 Kč/měs.** — není odvod SP/ZP (u jednoho zaměstnavatele)
- Od 10 500 Kč — odvody jako ze závislé činnosti
- Srážková daň 15 % (podepsal-li prohlášení: záloha)

**DPČ (dohoda o pracovní činnosti):**
- Max. **20 hodin týdně** průměrně za dobu dohody
- Do odměny **3 999 Kč/měs.** — není odvod SP/ZP
- Od 4 000 Kč — odvody jako ze závislé činnosti

> **Pozor:** Od roku 2024 platí nová pravidla pro „oznámené DPP" — FÚ eviduje agregaci dohod přes více zaměstnavatelů.

### Termíny odvodů zaměstnavatele

| Odvod | Termín |
|-------|--------|
| Záloha na daň z příjmů | Do **20. dne** následujícího měsíce |
| Sociální pojištění | Do **20. dne** následujícího měsíce |
| Zdravotní pojištění | Do **8. dne** druhého měsíce po zúčtovacím období |

**Zdroj:** Zákon č. 589/1992 Sb., Zákon č. 592/1992 Sb., Zákon č. 586/1992 Sb. § 38h
**Aktuálnost:** 2025""", "https://www.zakonyprolidi.cz/cs/1992-589", 1),

("payroll", "DPP a DPČ — limity a odvody 2025", """## Dohody o pracích mimo pracovní poměr 2025

### DPP — Dohoda o provedení práce

| Parametr | Hodnota |
|----------|---------|
| Max. rozsah | **300 hodin/rok** u jednoho zaměstnavatele |
| Osvobozená odměna (bez SP/ZP) | Do **10 499 Kč/měs.** |
| Povinné odvody SP/ZP | Od **10 500 Kč/měs.** |
| Daňový režim (bez prohlášení) | **Srážková daň 15 %** (odměna ≤ 10 499 Kč) |
| Daňový režim (s prohlášením) | Záloha na daň (standard) |

### DPČ — Dohoda o pracovní činnosti

| Parametr | Hodnota |
|----------|---------|
| Max. rozsah | **20 hodin týdně** průměrně |
| Osvobozená odměna (bez SP/ZP) | Do **3 999 Kč/měs.** |
| Povinné odvody SP/ZP | Od **4 000 Kč/měs.** |
| Daňový režim (bez prohlášení) | Srážková daň 15 % (odměna ≤ 3 999 Kč) |

### Výpočet při překročení limitu DPP

Příklad: Odměna DPP = **15 000 Kč**, bez prohlášení:

| Položka | Výpočet | Kč |
|---------|---------|-----|
| Hrubá odměna | | 15 000 |
| SP zaměstnanec (7,1 %) | 15 000 × 7,1 % | 1 065 |
| ZP zaměstnanec (4,5 %) | 15 000 × 4,5 % | 675 |
| Záloha daň 15 % | 15 000 × 15 % − 0 (bez prohlášení) | 2 250 |
| **Čistá odměna** | 15 000 − 1 065 − 675 − 2 250 | **11 010** |
| SP zaměstnavatel (24,8 %) | 15 000 × 24,8 % | 3 720 |
| ZP zaměstnavatel (9 %) | 15 000 × 9 % | 1 350 |
| **Celkové náklady** | 15 000 + 3 720 + 1 350 | **20 070** |

### Dovolená u dohod (od 1. 1. 2024)

Od roku 2024 mají pracovníci na DPP/DPČ nárok na **dovolenou** za podmínek:
- DPP: při odpracování ≥ 300 hodin u jednoho zaměstnavatele v daném roce
- DPČ: při trvání dohody min. 4 týdny a odpracování ≥ 80 hodin

**Zdroj:** Zákon č. 262/2006 Sb. (ZP), Zákon č. 586/1992 Sb., Zákon č. 589/1992 Sb.
**Aktuálnost:** 2025""", "https://www.zakonyprolidi.cz/cs/2006-262", 6),

# ============================================================
# ZÁKONÍK PRÁCE — detailní obsah
# ============================================================
("laws", "Zákoník práce 2025 — klíčová ustanovení", """## Zákoník práce 2025 — klíčová ustanovení

Zákon č. 262/2006 Sb. — **novelizace účinná od 1. června 2025**

### Dovolená (§ 212–218)

| Kategorie pracovníka | Min. dovolená |
|----------------------|---------------|
| Zaměstnanci v soukromém sektoru | **4 týdny/rok** |
| Pedagogičtí pracovníci a akademičtí pracovníci | **8 týdnů/rok** |
| Veřejný sektor (ostatní) | **5 týdnů/rok** |

- Dovolená v hodinách od 2021: výpočet = týdny × týdenní pracovní doba
- Čerpání: zaměstnavatel určuje termín, aspoň 14 dní předem
- Nevybraná dovolená: nutno vyčerpat do konce roku; max. přesun 3 roky zpět

### Výpovědní lhůta (§ 329 — od 1. 6. 2025)

**NOVÁ PRAVIDLA od 1. 6. 2025:**
- Lhůta začíná běžet **dnem doručení výpovědi** (dříve: 1. dne měsíce po doručení)
- Standardní lhůta: **2 měsíce**
- Zkrácení na **1 měsíc**: nesplňování předpokladů / závažné porušení

### Odstupné (§ 67)

| Délka pracovního poměru | Výše odstupného |
|------------------------|-----------------|
| Méně než 1 rok | **1× průměrný měsíční výdělek** |
| 1 rok až méně než 2 roky | **2× průměrný měsíční výdělek** |
| 2 roky a více | **3× průměrný měsíční výdělek** |
| Pracovní úraz / nemoc z povolání | **12× průměrný měsíční výdělek** |

> Odstupné při prac. úrazu od 1.6.2025: osvobozeno od SP a ZP, ale **zdaněno DPFO**.

### Přesčas (§ 93)

| Limit | Počet hodin |
|-------|-------------|
| Nařízený přesčas | max. **150 hodin/rok** |
| Smluvní přesčas | max. **cca 266 hodin/rok** navíc |
| Celkový max. přesčas | nesmí překročit **8 hod/týden průměrně** |
| Příplatek za přesčas | min. **25 % průměrného výdělku** nebo náhradní volno |

### Zkušební doba (§ 35 — od 1. 6. 2025)

| Pracovník | Dříve | Od 1. 6. 2025 |
|-----------|-------|----------------|
| Řadový zaměstnanec | max. 3 měsíce | max. **4 měsíce** |
| Vedoucí pracovník | max. 6 měsíců | max. **8 měsíců** |

### Pracovní doba (§ 79)

- Standardní týdenní pracovní doba: **40 hodin/týden**
- Zkrácená pracovní doba (podzemí, pracoviště s rizikem): 37,5 hod/týden
- Přestávka v práci: min. 30 minut při práci > 6 hodin

### Home office / práce na dálku (§ 317)

- Zaměstnavatel musí uzavřít **písemnou dohodu**
- Zaměstnanec pracuje z jiného místa než pracoviště
- Náhrada nákladů (elektřina, internet) dle vnitřní směrnice nebo paušálem

**Zdroj:** Zákon č. 262/2006 Sb. — zákoník práce, novelizace 2025
**Aktuálnost:** 2025""", "https://www.zakonyprolidi.cz/cs/2006-262", 6),

# ============================================================
# DANĚ — silniční a z nemovitosti
# ============================================================
("decrees", "Silniční daň 2025", """## Silniční daň 2025

> **Pozor:** Zákonem č. 142/2022 Sb. byla silniční daň od **1. 1. 2022 zrušena** pro osobní automobily a většinu vozidel. Zůstala jen pro nákladní vozidla nad 3,5 t.

### Kdo podléhá silniční dani od 2022

| Vozidlo | Silniční daň |
|---------|-------------|
| Osobní automobily (do 3,5 t) | **ZRUŠENA** od 1. 1. 2022 |
| Dodávky do 3,5 t | **ZRUŠENA** |
| Nákladní automobily nad 3,5 t | **Stále platí** |
| Autobusy | **Stále platí** |
| Přípojná vozidla nad 3,5 t | **Stále platí** |
| Motocykly | **ZRUŠENA** |

### Sazby pro nákladní vozidla (2025)

Sazba závisí na počtu náprav a celkové hmotnosti vozidla:

| Počet náprav | Hmotnost | Roční sazba |
|-------------|---------|-------------|
| 2 nápravy | 3,5–12 t | 1 800 – 9 600 Kč |
| 2 nápravy | nad 12 t | 14 400 – 34 200 Kč |
| 3 nápravy | nad 3,5 t | 3 900 – 34 200 Kč |
| 4+ nápravy | nad 18 t | 9 600 – 50 400 Kč |

### Zálohy na silniční daň

Zálohy se platí čtvrtletně:
- Do **15. dubna** (záloha za leden–březen)
- Do **15. července** (záloha za duben–červen)
- Do **15. října** (záloha za červenec–září)
- Do **15. prosince** (záloha za říjen–listopad)

### Termín podání DP a zaplacení

- Daňové přiznání: do **31. ledna** roku následujícího
- Splatnost doplatku: do 31. ledna

### Účtování silniční daně

| Operace | MD | D |
|---------|----|---|
| Záloha na silniční daň | 531 | 345 |
| Odvod zálohy | 345 | 221 |
| Roční zúčtování (doplatek) | 531 | 345 |
| Roční zúčtování (přeplatek) | 345 | 531 |

**Zdroj:** Zákon č. 16/1993 Sb. o dani silniční, novelizace zákonem č. 142/2022 Sb.
**Aktuálnost:** 2025""", "https://www.zakonyprolidi.cz/cs/1993-16", 6),

("decrees", "Daň z nemovitých věcí 2025", """## Daň z nemovitých věcí 2025

### Přehled

Zákon č. 338/1992 Sb. — daň z pozemků + daň ze staveb a jednotek.

Od **roku 2024** výrazné zvýšení koeficientů, **od 2025** inflační koeficient 1,5×.

### Daň z pozemků

| Typ pozemku | Sazba |
|-------------|-------|
| Orná půda, chmelnice, vinice, ovocné sady, trvalé travní porosty | 0,75 % ze základu |
| Hospodářské lesy, rybníky (chov ryb) | 0,25 % ze základu |
| Zastavěné plochy a nádvoří | 0,20 Kč/m² × koeficient |
| Stavební pozemky | 2,00 Kč/m² × koeficient |
| Ostatní plochy | 0,20 Kč/m² |

### Daň ze staveb a jednotek

| Typ | Základní sazba |
|-----|---------------|
| Obytný dům (RD) | 2 Kč/m² zastavěné plochy |
| Bytová jednotka | 2 Kč/m² podlahové plochy |
| Garáž | 8 Kč/m² |
| Stavby pro podnikání (zemědělství) | 2 Kč/m² |
| Stavby pro průmysl, energetiku | 10 Kč/m² |
| Stavby pro ostatní podnikání | 10 Kč/m² |
| Ostatní stavby | 6 Kč/m² |

### Koeficienty dle počtu obyvatel (2025)

| Obec | Koeficient |
|------|-----------|
| Do 1 000 obyvatel | 1,0 |
| 1 000–6 000 | 1,4 |
| 6 000–10 000 | 1,6 |
| 10 000–25 000 | 2,0 |
| 25 000–50 000 | 2,5 |
| Praha | 4,5 |
| Obce mohou zvýšit/snížit 1 pásmo |

### Termíny platby 2025

| Poplatník | Termín |
|-----------|--------|
| Daň ≤ 5 000 Kč | Do **31. května** celá daň |
| Daň > 5 000 Kč | ½ do 31. 5., ½ do 30. 11. |
| Zemědělci | ½ do 31. 8., ½ do 30. 11. |

### Termín podání DP

- Do **31. ledna** — pouze při změně (nová nemovitost, přestavba, převod)
- Beze změny: DP se znovu nepodává, FÚ zasílá složenku

### Účtování

| Operace | MD | D |
|---------|----|---|
| Daň z nemovitostí | 532 | 345 |
| Odvod | 345 | 221 |

**Zdroj:** Zákon č. 338/1992 Sb., novelizace zákonem č. 349/2023 Sb.
**Aktuálnost:** 2025""", "https://www.zakonyprolidi.cz/cs/1992-338", 7),

# ============================================================
# ÚČETNÍ STANDARDY ČÚS — rozšíření
# ============================================================
("standards", "ČÚS 001 — Účty a zásady účtování", """## ČÚS 001 — Účty a zásady účtování na účtech

**Vydán:** MF ČR | **Pro:** Podnikatelé (Vyhláška č. 500/2002 Sb.)

### Základní zásady účtování

1. **Zásada věrného a poctivého zobrazení** — účetnictví musí věrně zobrazovat skutečnost
2. **Zásada účetní jednotky** — účtuje se za účetní jednotku jako celek
3. **Zásada přednosti obsahu před formou** — rozhoduje ekonomická podstata transakce
4. **Zásada konzistentnosti** — metodické postupy nelze měnit v průběhu účetního období bez závažného důvodu
5. **Zásada opatrnosti** — zahrnout do výsledků jen zisky skutečně dosažené, ale všechna předvídatelná rizika a ztráty

### Struktura účtové osnovy

- **Třída 0–9** — syntetické účty
- **Analytické účty** — povinné pro: pohledávky/závazky (dle splatnosti, měny), majetek (dle druhu), mzdy (dle zaměstnance)
- **Podrozvahové účty** — třída 75–99 (podmíněné závazky, leasing, záruky)

### Základní pravidla účtování

- Každá operace musí být doložena **účetním dokladem** (§ 11 ZoÚ)
- Účtuje se metodou **podvojného zápisu** (MD a D musí být vždy vyrovnané)
- **Okamžik uskutečnění účetního případu:** den vzniku povinnosti plnit nebo den doručení

### Opravné položky a rezervy

- Opravné položky = snížení hodnoty aktiv (MD 559 / D 391)
- Rezervy = pravděpodobný závazek (MD 554 / D 451)
- Nesmí se kompenzovat s aktivy — zásada zákazu kompenzace

**Zdroj:** ČÚS 001, Zákon č. 563/1991 Sb. o účetnictví
**Aktuálnost:** 2025""", "https://www.mfcr.cz/cs/legislativa/ucetnictvi/ceske-ucetni-standardy", 1),

("standards", "ČÚS 002 — Otevírání a uzavírání účetních knih", """## ČÚS 002 — Otevírání a uzavírání účetních knih

### Uzavírání účetních knih

Účetní knihy se uzavírají **k rozvahovému dni** (zpravidla 31. 12.) nebo k jinému okamžiku dle § 17 ZoÚ.

**Postup:**
1. Zaúčtovat všechny operace daného období (faktury, opravné položky, odpisy, reservy, kurzové přepočty)
2. Uzavřít **výsledkové účty** (třídy 5 a 6) přes účet **710 (Účet zisků a ztrát)**
3. Uzavřít **rozvahové účty** (třídy 0–4) přes účet **702 (Konečný účet rozvažný)**
4. Výsledek hospodaření přenést: MD 710 / D 702 (zisk) nebo MD 702 / D 710 (ztráta)

### Otevírání účetních knih

**Na začátku nového účetního období:**
1. Otevřít rozvahové účty pomocí účtu **701 (Počáteční účet rozvažný)**
   - Aktiva: MD Aktivní účty / D 701
   - Pasiva: MD 701 / D Pasivní účty
2. HV minulého roku přenést na:
   - Nerozdělený zisk: MD 431 / D 427
   - Neuhrazená ztráta: MD 428 / D 431

### Způsob zpracování

- Uzavírání probíhá k rozvahovému dni, **nejpozději do termínu sestavení ÚZ** (§ 18 ZoÚ)
- Pohybové účty (třídy 5, 6) nemají počáteční zůstatek = každý rok začínají od nuly

### Opravné zaúčtování po uzavření

Po uzavření lze provádět opravy jen prostřednictvím **opravného účetního záznamu** (storno / opravný doklad) s vysvětlením.

**Zdroj:** ČÚS 002, Zákon č. 563/1991 Sb. § 17
**Aktuálnost:** 2025""", "https://www.mfcr.cz/cs/legislativa/ucetnictvi/ceske-ucetni-standardy", 2),

("standards", "ČÚS 003 — Odložená daň", """## ČÚS 003 — Odložená daň

### Co je odložená daň

Odložená daň vzniká z **přechodných rozdílů** mezi účetní a daňovou hodnotou aktiv a závazků.

- **Odložený daňový závazek** (ODZ): účetní hodnota aktiva > daňová základna → budoucí zdanění
- **Odložená daňová pohledávka** (ODP): účetní hodnota aktiva < daňová základna → budoucí daňová úspora

### Povinnost účtovat odložnou daň

**Povinně:**
- Účetní jednotky sestavující konsolidovanou ÚZ
- Účetní jednotky, které jsou **účetní jednotkou vyšší kategorie** (obrat > 40 mil. Kč, aktiva > 20 mil. Kč nebo zaměstnanci > 50)

**Dobrovolně:** Ostatní podnikatelé.

### Sazba pro výpočet

Odložená daň = přechodný rozdíl × **sazba daně platná v období, kdy rozdíl zanikne** (typicky sazba platná v příštím roce).

### Nejčastější zdroje odložené daně

| Příčina | Typ |
|---------|-----|
| Účetní odpisy > daňové odpisy | Odložený závazek |
| Daňové odpisy > účetní odpisy | Odložená pohledávka |
| Opravné položky k pohledávkám (nedaňové) | Odložená pohledávka |
| Rezervy (nedaňové) | Odložená pohledávka |
| Přecenění cenných papírů | Záleží na směru |

### Zaúčtování

| Operace | MD | D |
|---------|----|---|
| Tvorba odloženého závazku | 592 | 481 |
| Zrušení odloženého závazku | 481 | 592 |
| Tvorba odložené pohledávky | 481 | 592 |
| Zrušení odložené pohledávky | 592 | 481 |

**Zdroj:** ČÚS 003, Zákon č. 563/1991 Sb. § 59
**Aktuálnost:** 2025""", "https://www.mfcr.cz/cs/legislativa/ucetnictvi/ceske-ucetni-standardy", 3),

("standards", "ČÚS 004 — Rezervy", """## ČÚS 004 — Rezervy

### Definice rezervy

Rezerva = závazek s nejistou výší nebo časem plnění. Musí splňovat:
1. **Pravděpodobný závazek** (> 50 % pravděpodobnost)
2. **Spolehlivě odhadnutelná výše**
3. **Vznik z minulé události**

### Druhy rezerv

**Zákonné rezervy** (daňově uznatelné):
- Rezerva na opravy DHM (zákon č. 593/1992 Sb.)
- Rezerva v pojišťovnictví, bankovnictví
- Rezerva na nakládání s radioaktivními odpady

**Ostatní rezervy** (daňově neuznatelné):
- Rezerva na záruční opravy
- Rezerva na restrukturalizaci
- Rezerva na soudní spory

### Podmínky pro zákonnou rezervu na opravy DHM

- Majetek v odpisové **skupině 2–6** (ne osobní auta, budovy na 30/50 let)
- Tvorba min. **2 zdaňovací období** před opravou
- Bankovní účet oddělený = **povinný** (u rezerv tvořených od 2009)
- Nedočerpané rezervy → zrušit (daňový výnos)
- Max. výše = předpokládané náklady na opravu / počet let tvorby

### Zaúčtování

| Operace | MD | D |
|---------|----|---|
| Tvorba zákonné rezervy | 552 | 451 |
| Čerpání rezervy (provedena oprava) | 451 | 221 |
| Zrušení (rezerva nevyčerpána) | 451 | 552 |
| Tvorba ostatní rezervy | 554 | 451 |

**Zdroj:** ČÚS 004, Zákon č. 593/1992 Sb. o rezervách pro zjištění základu daně z příjmů
**Aktuálnost:** 2025""", "https://www.zakonyprolidi.cz/cs/1992-593", 4),

("standards", "ČÚS 005 — Opravné položky", """## ČÚS 005 — Opravné položky

### Co jsou opravné položky

Opravné položky (OP) vyjadřují **přechodné snížení hodnoty** majetku. Jsou vždy pasivní. Na rozdíl od odpisů jsou **dočasné** — zruší se, pokud důvod zániku pomine.

### Druhy opravných položek

**Zákonné OP k pohledávkám** (§ 8–8c zákona o rezervách) — daňově uznatelné:

| Lhůta po splatnosti | Max. OP |
|--------------------|---------|
| Více než 18 měsíců | 50 % nominální hodnoty |
| Více než 30 měsíců | 100 % nominální hodnoty |
| V insolvenčním řízení | 100 % ihned |

**Ostatní OP** (daňově neuznatelné):
- OP k zásobám (technologická zastaralost)
- OP k DHM/DNM
- OP k pohledávkám (pod 18 měs., nebo pohledávky do 30 tis. Kč)

### Malé pohledávky — zjednodušený postup

Pro pohledávky do **30 000 Kč** s lhůtou po splatnosti > 12 měsíců lze vytvořit 100% OP bez soudního vymáhání.

### Zaúčtování

| Operace | MD | D |
|---------|----|---|
| Tvorba OP k pohledávkám (zákonná) | 558 | 391 |
| Tvorba OP k pohledávkám (ostatní) | 559 | 391 |
| Tvorba OP k zásobám | 559 | 196 |
| Zrušení OP (pohledávka zaplacena) | 391 | 558/559 |
| Odpis pohledávky | 546 | 311 |

**Zdroj:** ČÚS 005, Zákon č. 593/1992 Sb. § 8–8c
**Aktuálnost:** 2025""", "https://www.zakonyprolidi.cz/cs/1992-593", 5),

("standards", "ČÚS 006 — Kursové rozdíly", """## ČÚS 006 — Kursové rozdíly

### Kdy vznikají kursové rozdíly

Při přepočtu cizoměnových pohledávek, závazků, pokladny, bankovních účtů a cenných papírů denominovaných v cizí měně.

### Kdy se přepočítává

1. **Ke dni uskutečnění účetního případu** (faktura, platba)
2. **K rozvahovému dni** (31. 12.) — povinný přepočet všech cizoměnových zůstatků kurzem ČNB

### Kurzy pro přepočet

| Metoda | Popis |
|--------|-------|
| **Denní kurz ČNB** | Kurz ČNB platný v den účetního případu — nejpřesnější |
| **Pevný kurz** | Firma si stanoví pevný kurz na zúčtovací období (max. 1 rok), schválí vnitřní směrnicí |

### Zaúčtování kursových rozdílů

| Situace | MD | D |
|---------|----|---|
| Kursová ztráta (pohledávky) | 563 | 311 |
| Kursový zisk (pohledávky) | 311 | 663 |
| Kursová ztráta (závazky) | 563 | 321 |
| Kursový zisk (závazky) | 321 | 663 |
| Kursová ztráta (valutová pokladna) | 563 | 211 |
| Kursový zisk (valutová pokladna) | 211 | 663 |

### Příklad

Firma fakturovala 10 000 EUR v kurzu 25,00 CZK/EUR = pohledávka 250 000 Kč.
K 31.12. je kurz ČNB 24,50 CZK/EUR → pohledávka přeceněna na 245 000 Kč.
→ Kursová ztráta 5 000 Kč: MD 563 / D 311

**Daňové dopady:** Kursové rozdíly jsou **daňově relevantní** (563 = daňový náklad, 663 = daňový výnos).

**Zdroj:** ČÚS 006, Zákon č. 563/1991 Sb. § 4 odst. 12, Vyhláška č. 500/2002 Sb.
**Aktuálnost:** 2025""", "https://www.mfcr.cz/cs/legislativa/ucetnictvi/ceske-ucetni-standardy", 6),

("standards", "ČÚS 007–012 — Inventarizace, CP, podnik, VK", """## ČÚS 007–012 — Přehled

### ČÚS 007 — Inventarizační rozdíly a ztráty přirozených úbytků

- **Manko**: skutečný stav < účetní stav → MD 549 / D zásoby
- **Přebytek**: skutečný > účetní → MD zásoby / D 648
- **Přirozené úbytky**: ztráty v rámci norem (vyschnutí, rozpyl) → MD 501 / D zásoby

### ČÚS 008 — Cenné papíry a podíly

Přecenění k rozvahovému dni:
- CP k obchodování: na reálnou hodnotu → MD/D 251, výsledkový dopad
- CP k prodeji: na reálnou hodnotu → MD/D 414 (přes vlastní kapitál)
- CP držené do splatnosti: amortizovaná cena (žádné přecenění)

### ČÚS 011 — Operace s podnikem (vklad, prodej)

- Vklad podniku nebo jeho části: ocenění reálnou hodnotou ke dni vkladu
- Prodej podniku: MD 395 / D majetek (v zůstatková ceně), tržba MD 311 / D 641

### ČÚS 012 — Změny vlastního kapitálu

Změny VK jen z titulů:
- HV běžného roku (výsledek hospodaření)
- Rozdělení zisku / úhrada ztráty
- Vklady vlastníků, výběry

Přímé dopady do VK (bez výsledovky):
- Přecenění CP k prodeji → účet 414
- Kursové rozdíly z konsolidace
- Oceňovací rozdíly při přeměnách (414, 418)

**Zdroj:** ČÚS 007–012, Vyhláška č. 500/2002 Sb.
**Aktuálnost:** 2025""", "https://www.mfcr.cz/cs/legislativa/ucetnictvi/ceske-ucetni-standardy", 7),

("standards", "ČÚS 016–019 — KFM, zúčtování, VK, náklady a výnosy", """## ČÚS 016–019 — Přehled

### ČÚS 016 — Krátkodobý finanční majetek

- Pokladna (211), ceniny (213), bankovní účty (221)
- Krátkodobé cenné papíry (251, 253, 256)
- Přecenění k rozvahovému dni na reálnou hodnotu (CP k obchodování)

### ČÚS 017 — Zúčtovací vztahy

Pohledávky a závazky se zachycují v nominální hodnotě.

Klíčová analytická členění:
- Dle splatnosti (krátkodobé / dlouhodobé)
- Dle měny (CZK / cizí měna)
- Dle partnera

Opravné položky k pochybným pohledávkám: viz ČÚS 005.

### ČÚS 018 — Kapitálové účty a dlouhodobé závazky

- ZK se zachycuje ve výši zapsané v OR (411)
- Změny ZK: nesmí se účtovat bez rozhodnutí valné hromady
- Nerozdělený zisk (427) / neuhrazená ztráta (428) — přenos z minulých let

### ČÚS 019 — Náklady a výnosy

**Zásada akruálního principu** — náklady a výnosy se účtují do období, s nímž věcně a časově souvisejí:
- Časové rozlišení: 381 (náklady příštích období), 383 (výdaje příštích období)
- Dohadné položky: 388 (dohadné pohledávky), 389 (dohadné závazky)

Výnosové faktury: okamžik uskutečnění zdanitelného plnění = vznik výnosu (ne platba).
Nákladové faktury: přijatá faktura = vznik nákladu (ne platba).

**Zdroj:** ČÚS 016–019, Vyhláška č. 500/2002 Sb.
**Aktuálnost:** 2025""", "https://www.mfcr.cz/cs/legislativa/ucetnictvi/ceske-ucetni-standardy", 8),

("standards", "ČÚS 020–023 — Konsolidace, konkurs, přehled cash flow", """## ČÚS 020–023 — Přehled

### ČÚS 020 — Konsolidace

Povinnost sestavit konsolidovanou ÚZ: mateřská společnost, která tvoří konsolidační celek.

Metody konsolidace:
- **Plná** — ovládané osoby (> 50 % hlasovacích práv)
- **Ekvivalenční** — přidružené osoby (20–50 %)
- **Poměrová** — společná kontrola (joint venture)

### ČÚS 021 — Vyrovnání, nucené vyrovnání, konkurs a likvidace

**Při likvidaci:**
- ÚJ přechází na **likvidační základ** účetnictví
- Majetek se přeceňuje na realizovatelnou hodnotu
- Všechny závazky musí být zjištěny a zaúčtovány
- Uzávěrka: den vstupu do likvidace, pak každoroční ÚZ do ukončení

**Při insolvenčním řízení:**
- Okamžik prohlášení konkursu = uzávěrkový den
- Insolvenční správce přebírá správu, účtuje v majetkové podstatě

### ČÚS 023 — Přehled o peněžních tocích (Cash Flow)

Povinně sestavují ÚJ vyšší kategorie:
- **Přímá metoda**: zobrazení příjmů a výdajů přímo
- **Nepřímá metoda**: transformace HV na CF přes úpravy

Členění CF:
- **Provozní** (core business)
- **Investiční** (nákup/prodej majetku)
- **Finanční** (úvěry, dividendy, vklady)

**Zdroj:** ČÚS 020–023, Zákon č. 182/2006 Sb. (insolvenční zákon)
**Aktuálnost:** 2025""", "https://www.mfcr.cz/cs/legislativa/ucetnictvi/ceske-ucetni-standardy", 9),

]

def main():
    existing = set()
    import urllib.request
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/knowledge_base?select=category,title",
        headers={
            "apikey": SERVICE_KEY,
            "Authorization": f"Bearer {SERVICE_KEY}",
        }
    )
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read())
        for row in data:
            existing.add((row["category"], row["title"]))
    print(f"Stávající články: {len(existing)}")

    inserted = 0
    skipped = 0
    for i, article in enumerate(ARTICLES):
        cat, title, content, source_url, sort_order = article
        if (cat, title) in existing:
            print(f"  SKIP [{i+1}/{len(ARTICLES)}] {cat} | {title[:50]}")
            skipped += 1
            continue
        ok = upsert_article(cat, title, content, source_url, sort_order)
        if ok:
            print(f"  OK   [{i+1}/{len(ARTICLES)}] {cat} | {title[:50]}")
            inserted += 1
        else:
            print(f"  FAIL [{i+1}/{len(ARTICLES)}] {cat} | {title[:50]}")

    print(f"\nHotovo: {inserted} vloženo, {skipped} přeskočeno (duplicita)")

if __name__ == "__main__":
    main()
