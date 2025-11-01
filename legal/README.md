# Právní dokumentace ClaimBuddy

**Vytvořeno:** 1. listopadu 2025
**Autor:** Claude Code (Anthropic)
**Pro:** Radim (radim@wikiporadce.cz)

---

## Obsah této složky

Tato složka obsahuje **kompletní sadu právních dokumentů** pro spuštění služby ClaimBuddy - asistence při pojistných událostech.

### Dokumenty vytvořené:

| # | Dokument | Velikost | Účel |
|---|----------|----------|------|
| 1 | `TERMS_AND_CONDITIONS.md` | 9.5 KB | Obchodní podmínky |
| 2 | `PRIVACY_POLICY.md` | 12 KB | Zásady ochrany osobních údajů (GDPR) |
| 3 | `GDPR_CONSENT_FORM.md` | 10 KB | Souhlas se zpracováním citlivých údajů |
| 4 | `CLIENT_CONTRACT_TEMPLATE.md` | 17 KB | Vzorová smlouva s klientem |
| 5 | `COMPLAINTS_POLICY.md` | 12 KB | Reklamační řád |
| 6 | `COOKIE_POLICY.md` | 15 KB | Zásady používání cookies |
| 7 | `WEBSITE_DISCLAIMER.md` | 19 KB | Disclaimery pro web, emaily, modals |
| 8 | `COMPLIANCE_CHECKLIST.md` | 24 KB | Checklist pro compliance před launchem |

**CELKEM:** 8 dokumentů | ~120 KB textu | ~35 000 slov

---

## Quick Start

### Co udělat HNED:

1. **Přečíst:** `COMPLIANCE_CHECKLIST.md` - obsahuje timeline a prioritizaci úkolů
2. **Zkontrolovat:** Všechny `[doplnit]` placeholdery a vyplnit vaše údaje:
   - IČO
   - Adresa sídla
   - Telefon
   - Email
   - Čísla účtů

3. **Nechat právně zrevidovat:** Kontaktovat advokáta specializujícího se na pojištění a GDPR

### Co udělat PŘED LAUNCHEM:

- [ ] Publikovat `TERMS_AND_CONDITIONS.md` na web
- [ ] Publikovat `PRIVACY_POLICY.md` na web
- [ ] Implementovat cookie banner + `COOKIE_POLICY.md`
- [ ] Implementovat GDPR consent form (zdravotní data)
- [ ] Připravit generování smluv z `CLIENT_CONTRACT_TEMPLATE.md`
- [ ] Vyplnit všechny `[doplnit]` části

---

## Struktura dokumentů

### 1. Obchodní podmínky (`TERMS_AND_CONDITIONS.md`)

**Pro koho:** Všichni uživatelé služby
**Kdy:** Musí odsouhlasit při registraci
**Obsahuje:**
- Rozsah služeb (co děláme, co NE)
- Cenová politika (success fee 15-20% vs. fixed fee 490-1990 Kč)
- Povinnosti klienta a ClaimBuddy
- Omezení odpovědnosti
- Ukončení smlouvy
- GDPR základy

**Klíčové disclaimery:**
- ❌ Nejsme pojišťovací zprostředkovatel
- ❌ Nejsme advokátní kancelář
- ❌ Negarantujeme výsledek (rozhoduje pojišťovna)

**Použití:**
- Link v patičce: `www.claimbuddy.cz/obchodni-podminky`
- Checkbox při registraci: "Souhlasím s Obchodními podmínkami"

---

### 2. Zásady ochrany osobních údajů (`PRIVACY_POLICY.md`)

**Pro koho:** Všichni uživatelé (GDPR povinnost)
**Kdy:** Před sběrem jakýchkoliv osobních údajů
**Obsahuje:**
- Jaké údaje zpracováváme (běžné + citlivé)
- Proč je zpracováváme (právní titul)
- Jak dlouho je uchováváme (3 roky)
- Komu je předáváme (pojišťovny, IT poskytovatelé)
- Vaše práva (přístup, výmaz, oprava, odvolání)
- Kontakt: gdpr@claimbuddy.cz

**Speciální focus:**
- Zdravotní údaje (Article 9 GDPR) - vyžaduje explicitní souhlas
- Biometrické údaje (fotografie zranění)
- Předání do USA (Google, Facebook) - Adequacy Decision

**Použití:**
- Link v patičce: `www.claimbuddy.cz/ochrana-osobnich-udaju`
- PDF ke stažení
- Odkaz z cookie banneru

---

### 3. Souhlas se zpracováním citlivých údajů (`GDPR_CONSENT_FORM.md`)

**Pro koho:** Klienti nahrávající lékařské zprávy nebo fotky zranění
**Kdy:** PŘED nahráním zdravotních údajů
**Obsahuje:**
- Výslovný souhlas s health data (čl. 9 GDPR)
- Rozsah souhlasu (co konkrétně zpracováváme)
- Účel zpracování
- Právo odvolat kdykoliv
- Bezpečnostní opatření

**Formy implementace:**
1. **Web:** Modal s checkboxem + link na plné znění
2. **PDF:** Vytisknout, podepsat, naskenovat
3. **Elektronický podpis:** DocuSign, Signi.com

**Uložení:**
- Databáze: Timestamp, IP adresa, user agent
- PDF: Šifrovaně na serveru

**KRITICKÉ:**
- Bez tohoto souhlasu NEMŮŽETE zpracovávat zdravotní údaje
- Pokuta za porušení: až 20 mil. EUR nebo 4% obratu

---

### 4. Smlouva s klientem (`CLIENT_CONTRACT_TEMPLATE.md`)

**Pro koho:** Každý klient (B2C i B2B)
**Kdy:** Při prvním podání případu
**Obsahuje:**
- Identifikace stran
- Popis pojistné události
- Rozsah služeb (checklist co uděláme)
- Cenový model (success fee nebo fixed fee)
- Povinnosti obou stran
- GDPR souhlas (integrace s formulářem)
- Plná moc pro komunikaci s pojišťovnou
- Ukončení smlouvy

**2 cenové modely:**

**A) Success Fee:**
- Platba: 15-20% z vyplaceného plnění
- Splatnost: Do 14 dnů od připsání
- Výhoda pro klienta: Platí jen při úspěchu
- Použití: Složité případy, vyšší částky

**B) Fixed Fee:**
- Platba: 490-1990 Kč (dle složitosti)
- Splatnost: Předem (do 7 dnů)
- Nevratná (i když pojišťovna zamítne)
- Použití: Jednoduché případy

**Přílohy:**
- Příloha č. 1: Plná moc
- Příloha č. 2: GDPR souhlas (health data)
- Příloha č. 3: Dokumentace (přidávána průběžně)

**Implementace:**
- Automatické generování (vyplnění jména, adresy z registrace)
- Elektronický podpis (DocuSign, Signi.com)
- Uložení šifrovaně

---

### 5. Reklamační řád (`COMPLAINTS_POLICY.md`)

**Pro koho:** Všichni klienti (spotřebitelé i podnikatelé)
**Kdy:** Při nespokojenosti se službou
**Obsahuje:**
- Co lze reklamovat (kvalita služby, fakturace, GDPR)
- Co NELZE reklamovat (rozhodnutí pojišťovny)
- Jak podat reklamaci (email, telefon, pošta, osobně)
- Lhůty vyřízení (30 dnů standardně, 60 dnů složitý případ)
- Možné výsledky (uznání, částečné uznání, zamítnutí)
- Mimosoudní řešení (ČOI, Finanční arbitr, ODR)
- Soudní řešení (jako ultima ratio)

**Kontakty:**
- Email: **reklamace@claimbuddy.cz**
- Odpověď do 5 pracovních dnů
- Vyřízení do 30 dnů

**Mimosoudní řešení:**
1. **Česká obchodní inspekce:** [coi.cz] - ochrana spotřebitele
2. **Finanční arbitr:** [finarbitr.cz] - pojistné spory
3. **EU ODR platforma:** [ec.europa.eu/consumers/odr] - online spory

---

### 6. Zásady cookies (`COOKIE_POLICY.md`)

**Pro koho:** Všichni návštěvníci webu
**Kdy:** Před nastavením cookies (kromě nezbytných)
**Obsahuje:**
- Co jsou cookies (vysvětlení pro ne-techniky)
- 3 kategorie cookies:
  1. **Nezbytné** (always active) - přihlášení, košík, bezpečnost
  2. **Analytické** (opt-in) - Google Analytics, Hotjar
  3. **Marketingové** (opt-in) - Facebook Pixel, Google Ads
- Jak spravovat cookies (náš banner, nastavení prohlížeče)
- Předání do USA (Google, Facebook)
- Práva uživatelů (odvolání, výmaz)

**Implementace:**
- **Cookie banner** při první návštěvě:
  - Tlačítko "Přijmout vše"
  - Tlačítko "Odmítnout vše" (stejně viditelné!)
  - Tlačítko "Nastavení" (granulární volba)
- **Cookie policy page:** `www.claimbuddy.cz/cookies`
- **Ikona v patičce** pro změnu nastavení kdykoliv

**Compliance:**
- Zákon č. 127/2005 Sb. (elektronické komunikace)
- GDPR (čl. 6 a 7)
- ePrivacy Directive

**Nástroje:**
- OneTrust, Cookiebot (placené, 100-500 USD/měsíc)
- Custom řešení (viz code example v dokumentu)

---

### 7. Website Disclaimer (`WEBSITE_DISCLAIMER.md`)

**Pro koho:** Vývojáři, copywriteři, marketéři
**Kdy:** Při tvorbě obsahu webu, emailů, reklam
**Obsahuje:**
- Krátké disclaimery pro různá místa:
  - **Homepage:** "Nejsme pojišťovací zprostředkovatel"
  - **Footer:** Kompletní kontaktní info + disclaimer
  - **Modals:** Při registraci, podání případu, zamítnutí
  - **Landing pages:** Hero, pricing, testimonials
  - **Formuláře:** Lead form, health data consent
  - **Emaily:** Welcome, rejected, success
  - **FAQ:** Často kladené otázky s disclaimery
  - **Social media:** FB/LinkedIn post footer

**3 délky disclaimeru:**
1. **Krátký (1 věta):** "Nejsme pojišťovací zprostředkovatel. Konečné rozhodnutí dělá pojišťovna."
2. **Střední (1 odstavec):** + "Nejsme advokátní kancelář. Negarantujeme výsledek."
3. **Dlouhý (více odstavců):** Kompletní vysvětlení rozsahu služeb

**Pravidlo:**
VŽDY když říkáte "vymůžeme peníze" nebo "dostanete plnění" → přidejte disclaimer.

**Implementace:**
- React komponenta `<Disclaimer variant="short|medium|long" />`
- CSS třídy `.disclaimer`, `.fine-print`
- Copy-paste hotové texty

---

### 8. Compliance Checklist (`COMPLIANCE_CHECKLIST.md`)

**Pro koho:** Zakladatelé, projektový manažer, právník
**Kdy:** PŘED launchem a průběžně
**Obsahuje:**
- **19 sekcí** pokrývajících všechny aspekty compliance:
  1. Založení společnosti
  2. GDPR compliance
  3. Web a obchodní podmínky
  4. Smlouva s klientem
  5. Finance a účetnictví
  6. Marketing a komunikace
  7. Bezpečnost a IT
  8. Zaměstnanci
  9. Vztahy s pojišťovnami
  10. Zákaznická podpora
  11. Měření a analytika
  12. Právní podpora
  13. Timeline (časový plán)
  14. Nákladový odhad
  15. Pre-launch checklist
  16. Post-launch checklist
  17. Kontakty (užitečné)
  18. Soubory ke stažení
  19. Prohlášení

**Prioritizace:**
- ❗ **KRITICKÉ** - MUSÍ být před launchem (pokuta/zákaz)
- ⚠️ **DŮLEŽITÉ** - Do 3-6 měsíců (riziko sporů)
- 💡 **DOPORUČENÉ** - Nice-to-have (zlepšuje důvěru)

**Nákladový odhad:**
- **Jednorázové:** 155 000 Kč (setup)
- **Měsíční:** 28 500 Kč (running costs)

**Timeline:**
- Měsíc -2: Založení s.r.o.
- Měsíc -1: Vývoj webu
- Den 0: Launch
- Měsíc +1: Iterace
- Měsíc +3: Škálování
- Měsíc +6: Audit

---

## Co dělat TEĎ (akční kroky)

### 1. Právní review (KRITICKÉ)

**Najměte advokáta** specializujícího se na:
- Pojistné právo
- GDPR a ochrana osobních údajů
- Obchodní právo (smlouvy)

**Co nechat zrevidovat:**
- Všech 8 dokumentů v této složce
- Zejména `TERMS_AND_CONDITIONS.md` a `CLIENT_CONTRACT_TEMPLATE.md`

**Náklady:** 15 000-30 000 Kč (jednorázově)

**Kde najít:**
- [cak.cz/adresar] - Advokátní komora ČR
- Filtr: Specializace "Pojištění", "GDPR", "IT právo"

### 2. Vyplnění placeholderů

V dokumentech najdete `[doplnit]` - vyplňte:

**Firemní údaje:**
- IČO: __________
- DIČ: __________
- Sídlo: __________
- Spisová značka: __________
- Jméno jednatele: __________

**Kontakty:**
- Telefon: __________
- Číslo účtu: __________/______ (kód banky)

**Automatizace:**
```bash
# Najít všechny [doplnit] v souborech
grep -r "\[doplnit\]" /Users/Radim/Projects/claimbuddy/legal/

# Nahradit pomocí sed nebo ručně
sed -i '' 's/\[doplnit IČO\]/12345678/g' *.md
```

### 3. Publikace na web

**Struktura URL:**
```
www.claimbuddy.cz/obchodni-podminky
www.claimbuddy.cz/ochrana-osobnich-udaju
www.claimbuddy.cz/cookies
www.claimbuddy.cz/reklamacni-rad
www.claimbuddy.cz/gdpr-souhlas
```

**Formáty:**
- HTML (primary) - konvertovat Markdown → HTML
- PDF (download) - generovat z HTML (Puppeteer, wkhtmltopdf)

**SEO:**
- Meta title: "Obchodní podmínky | ClaimBuddy"
- Meta description: "Přečtěte si obchodní podmínky služby ClaimBuddy..."
- Canonical URL

### 4. Implementace features

**GDPR:**
- [ ] Cookie consent banner (OneTrust, Cookiebot, custom)
- [ ] GDPR consent form pro health data (modal před uploadem)
- [ ] Proces pro GDPR žádosti (email gdpr@claimbuddy.cz → ticket)
- [ ] Databáze pro uložení souhlasů (timestamp, IP, user agent)

**Smlouvy:**
- [ ] Generování PDF smluv (template + data → PDF)
- [ ] Elektronický podpis (DocuSign API, Signi.com API)
- [ ] Archivace podepsaných smluv (AWS S3, šifrovaně)

**Emails:**
- [ ] Nastavit info@claimbuddy.cz
- [ ] Nastavit reklamace@claimbuddy.cz
- [ ] Nastavit gdpr@claimbuddy.cz
- [ ] Auto-reply (potvrzení přijetí do 24h)
- [ ] Templates pro emaily (welcome, rejected, success)

### 5. Registrace a compliance

**Před launchem:**
- [ ] Založit s.r.o. (notář, soud) - 2-4 týdny
- [ ] Registrace IČO, DIČ (automaticky + FÚ)
- [ ] Datová schránka (info.cz)
- [ ] Živnostenský list (portal.gov.cz)
- [ ] Bankovní účet (Fio, Air Bank, Equa)
- [ ] Pojištění odpovědnosti (Allianz, Generali)

**Po launchu:**
- [ ] Evidence činností zpracování (GDPR)
- [ ] Zpracovatelské smlouvy s IT poskytovateli
- [ ] Interní GDPR audit (6 měsíců)
- [ ] Bezpečnostní audit / pen test (6 měsíců)

---

## Časté dotazy (FAQ)

### Q: Musím mít všechny tyto dokumenty?
**A:** ANO, pokud:
- Provozujete službu v EU (GDPR je povinné)
- Zpracováváte citlivé údaje (health data vyžaduje explicitní souhlas)
- Máte klienty-spotřebitele (Reklamační řád je povinný)
- Používáte cookies (Cookie Policy + banner je povinný)

### Q: Můžu použít tyto dokumenty bez právního review?
**A:** NEDOPORUČUJEME. Tyto dokumenty jsou:
- Obecné (ne šité na míru vaší konkrétní situaci)
- Vytvořené AI (i když kvalitní, není to člověk-právník)
- Bez záruky (použití na vlastní riziko)

**Doporučení:** Investujte 15-30k do právního review. Pokuta za GDPR může být až 20 mil. EUR.

### Q: Co když nenajdu právníka specializujícího se na pojištění?
**A:** Použijte právníka specializujícího se na:
1. **Obchodní právo** (smlouvy, obchodní podmínky)
2. **GDPR** (ochrana osobních údajů)

Kombinace těchto dvou pokryje 90% potřeb.

### Q: Můžu změnit cenový model (success fee %)?
**A:** ANO, ale:
- Musíte upravit v `TERMS_AND_CONDITIONS.md` a `CLIENT_CONTRACT_TEMPLATE.md`
- Informovat existující klienty o změně (pokud se jich to týká)
- Dát 30 denní předstihem (GDPR best practice)

### Q: Co když klient odmítne podepsat GDPR souhlas?
**A:** Nemůžete zpracovávat jeho zdravotní údaje. Máte 2 možnosti:
1. **Odmítnout případ** (pokud vyžaduje lékařské zprávy)
2. **Nechat klienta komunikovat přímo** (vy pouze poradíte, ale nepodáte za něj)

### Q: Jak často aktualizovat tyto dokumenty?
**A:**
- **Minimálně:** 1x ročně (check legislativy)
- **Při změnách:** Vždy když změníte službu, cenu, poskytovatele IT
- **GDPR změny:** 30 dní předem informovat klienty

### Q: Co když používám jiné IT poskytovatele (ne Google/AWS)?
**A:** Upravte sekce v `PRIVACY_POLICY.md` a `COOKIE_POLICY.md`:
- Uveďte správné názvy poskytovatelů
- Linky na jejich Privacy Policy
- Ověřte, že máte s nimi Zpracovatelskou smlouvu (DPA)

### Q: Potřebuji DPO (Data Protection Officer)?
**A:** Pravděpodobně NE, pokud:
- Nejste veřejný orgán
- Nezpracováváte "rozsáhlé množství" citlivých dat (threshold není definován, ale <10 000 klientů je obvykle OK)

**Doporučení:** Externí DPO na konzultační bázi (5-15k/měsíc) pro klid.

---

## Nástroje a integrace

### Doporučené služby:

**Elektronický podpis:**
- [DocuSign](https://www.docusign.com) - $10/měsíc (až 5 podpisů)
- [Signi.com](https://www.signi.com) - 99 Kč/podpis (CZ firma)
- [Adobe Sign](https://acrobat.adobe.com/sign) - $20/měsíc

**Cookie consent:**
- [OneTrust](https://www.onetrust.com) - $200+/měsíc (enterprise)
- [Cookiebot](https://www.cookiebot.com) - $10/měsíc (do 100 stránek)
- [Custom řešení](https://github.com/orestbida/cookieconsent) - zdarma (open source)

**GDPR compliance:**
- [Termly](https://termly.io) - Generátor Privacy Policy
- [iubenda](https://www.iubenda.com) - Compliance suite (Cookie + Privacy Policy)
- **Nevýhoda:** Drahé ($30-300/měsíc), neznají CZ legislativu dobře

**Právní databáze (CZ):**
- [epravo.cz](https://www.epravo.cz) - Články o aktuální legislativě
- [uoou.cz](https://www.uoou.cz) - ÚOOÚ guidelines
- [cnb.cz](https://www.cnb.cz) - ČNB dohled nad pojišťovnami

---

## Verze a changelog

### Verze 1.0 (1. ledna 2026)
- Iniciální vytvoření všech 8 dokumentů
- Kompletní GDPR compliance (Privacy Policy, Consent Form)
- Success fee (15-20%) a Fixed fee (490-1990 Kč) modely
- Disclaimery pro web, emaily, modals
- Compliance checklist s timeline a náklady

**Další verze:**
- Verzování pomocí Git (commit = změna dokumentů)
- Nebo manuální verzování v hlavičce dokumentů

---

## Kontakt

**Projekt:** ClaimBuddy
**Kontakt:** radim@wikiporadce.cz
**Složka:** `/Users/Radim/Projects/claimbuddy/legal/`

**Pro dotazy:**
- Technické: Claude Code (tento AI asistent)
- Právní: Konzultujte s advokátem
- GDPR: gdpr@claimbuddy.cz (po spuštění)

---

## Licence

Tyto dokumenty jsou vytvořeny pro interní použití ClaimBuddy s.r.o.

**Použití:**
- ✅ Můžete používat pro ClaimBuddy
- ✅ Můžete upravovat dle potřeb
- ❌ Neprodávejte jako šablony třetím stranám
- ❌ Negarantujeme právní správnost (konzultujte s advokátem)

---

**Poslední aktualizace:** 1. listopadu 2025
**Vytvořeno pomocí:** Claude Code (claude-sonnet-4-5-20250929)

---

*Držím palce s ClaimBuddy! 🚀*
*- Claude*
