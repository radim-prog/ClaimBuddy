# Compliance Checklist pro ClaimBuddy

**Verze:** 1.0
**Účinnost od:** 1. ledna 2026

---

## O tomto dokumentu

Tento checklist obsahuje **všechny právní a compliance požadavky** které MUSÍ být splněny před spuštěním ClaimBuddy.

**Struktura:**
- ❗ **KRITICKÉ** - MUSÍ být před launchem (může vést k pokutám/zákazu provozu)
- ⚠️ **DŮLEŽITÉ** - Mělo by být co nejdříve (riziko sporů s klienty)
- 💡 **DOPORUČENÉ** - Nice-to-have (zlepšuje důvěru, ale není povinné)

---

## 1. Založení společnosti a registrace

### ❗ KRITICKÉ (před launchem)

- [ ] **Založení s.r.o.**
  - Základní kapitál: Min. 1 Kč (doporučeno 100 000 Kč pro serióznost)
  - Společenská smlouva
  - Zápis do obchodního rejstříku
  - **Termín:** 2-4 týdny
  - **Náklady:** Cca 5 000-10 000 Kč (notář, soud, razítko)

- [ ] **IČO přiděleno** (automaticky při zápisu do OR)

- [ ] **DIČ registrace** (Finanční úřad)
  - Online žádost: [formulář na financnisprava.cz]
  - **Termín:** Do 15 dnů od zápisu do OR
  - **Sankce za nesplnění:** Pokuta až 50 000 Kč

- [ ] **Datová schránka** (povinná pro s.r.o.)
  - Aktivace na: [info.cz]
  - **Termín:** Do 15 dnů od zápisu do OR
  - **Náklady:** Zdarma

- [ ] **Živnostenský list** (pokud je nutný)
  - Volná živnost: "Poradenská a konzultační činnost, zpracování odborných studií a posudků"
  - Podání na: [portal.gov.cz]
  - **Termín:** 1 den (elektronicky)
  - **Náklady:** 1 000 Kč

### ⚠️ DŮLEŽITÉ (do 3 měsíců)

- [ ] **Registrace jako likvidátor škod** (doporučeno, NENÍ povinné)
  - **Proč:** Zvyšuje důvěryhodnost, ale není legal requirement
  - **Jak:** Profesní organizace (např. Česká asociace pojišťoven nemá veřejný registr likvidátorů)
  - **Alternativa:** Absolvovat kurz "Likvidátor pojistných událostí" (např. na VŠE, Akademie ČAP)
  - **Náklady:** 10 000-30 000 Kč

- [ ] **Pojištění odpovědnosti** (Professional Indemnity Insurance)
  - Pro případ škody způsobené klientovi (např. zmeškaná lhůta)
  - Doporučený limit: 5 000 000 Kč
  - **Pojišťovny:** Allianz, Generali, Kooperativa
  - **Náklady:** 10 000-30 000 Kč/rok

### 💡 DOPORUČENÉ

- [ ] **Ochranná známka "ClaimBuddy"**
  - Podání na: [Úřad průmyslového vlastnictví, upv.gov.cz]
  - **Termín:** 12-18 měsíců do rozhodnutí
  - **Náklady:** 2 900 Kč (1 třída), + 1 000 Kč za další třídu
  - **Doporučené třídy:**
    - Třída 36: Pojišťovací služby
    - Třída 42: Počítačové služby (SaaS)

---

## 2. GDPR compliance

### ❗ KRITICKÉ (před launchem)

- [ ] **Jmenování správce osobních údajů**
  - = ClaimBuddy s.r.o.
  - Kontakt: gdpr@claimbuddy.cz

- [ ] **Zásady ochrany osobních údajů** (Privacy Policy)
  - ✅ Vytvořeno: `/legal/PRIVACY_POLICY.md`
  - [ ] Publikováno na webu: www.claimbuddy.cz/ochrana-osobnich-udaju
  - [ ] Link v patičce webu

- [ ] **Formulář souhlasu se zpracováním citlivých údajů**
  - ✅ Vytvořeno: `/legal/GDPR_CONSENT_FORM.md`
  - [ ] Implementováno v aplikaci (checkbox + modal s plným zněním)
  - [ ] Uložení souhlasů v databázi (timestamp, IP adresa)

- [ ] **Evidence činností zpracování** (čl. 30 GDPR)
  - = Interní dokument popisující jaké údaje zpracováváme, proč, jak dlouho
  - **Šablona:** Stáhnout z [uoou.cz]
  - **Uchovávat:** Interně (předložit na žádost ÚOOÚ)

- [ ] **Zpracovatelské smlouvy** (čl. 28 GDPR) s IT poskytovateli
  - [ ] Hosting (AWS, Google Cloud, atd.)
  - [ ] Email (Google Workspace, Microsoft 365)
  - [ ] CRM (HubSpot, Pipedrive)
  - [ ] Analytics (Google Analytics - přes Google Ads Data Processing Terms)
  - [ ] Platební brána (Comgate, GoPay)
  - **Co musí obsahovat:** Povinnosti zpracovatele, bezpečnost, podílení
  - **Tip:** Většina velkých poskytovatelů má standardní DPA (Data Processing Agreement)

- [ ] **Šifrování osobních údajů**
  - [ ] HTTPS (TLS 1.3) na celém webu
  - [ ] Šifrování databáze (AES-256 at rest)
  - [ ] Šifrování health data (separate encrypted storage)
  - [ ] Šifrované zálohy

- [ ] **Proces pro uplatnění práv subjektů** (přístup, výmaz, oprava)
  - [ ] Formulář na webu: www.claimbuddy.cz/gdpr-zadost
  - [ ] Email: gdpr@claimbuddy.cz (automatická odpověď do 24h)
  - [ ] Interní SOP (Standard Operating Procedure) pro vyřízení žádostí
  - **Lhůta:** 30 dnů od obdržení žádosti

- [ ] **Cookie banner a Cookie Policy**
  - ✅ Cookie Policy vytvořena: `/legal/COOKIE_POLICY.md`
  - [ ] Publikováno na webu
  - [ ] Implementovat cookie consent banner (OneTrust, Cookiebot, nebo custom)
  - [ ] **Požadavky:**
    - Před nastavením cookies musí být souhlas (kromě nezbytných)
    - "Odmítnout vše" stejně viditelné jako "Přijmout"
    - Možnost granulární volby (analytické ANO, marketing NE)

### ⚠️ DŮLEŽITÉ (do 3 měsíců)

- [ ] **Jmenování DPO (Data Protection Officer)**
  - **NENÍ povinné** pro ClaimBuddy (není veřejný orgán ani rozsáhlé zpracování citlivých dat)
  - **Doporučeno:** Externe DPO na konzultační bázi
  - **Poskytovatelé:** [seznam na uoou.cz]
  - **Náklady:** 5 000-15 000 Kč/měsíc (dle rozsahu)

- [ ] **DPIA (Data Protection Impact Assessment)**
  - = Posouzení dopadu na ochranu osobních údajů
  - **Nutné pokud:** Zpracováváme rozsáhlé množství health data (což budeme)
  - **Jak:** Šablona na [uoou.cz]
  - **Obsah:** Popis zpracování, rizika, opatření k minimalizaci
  - **Termín:** Před zahájením rozsáhlého zpracování

- [ ] **Incident response plán** (data breach)
  - Co dělat v případě úniku dat
  - **Lhůta:** Oznámit ÚOOÚ do **72 hodin**
  - **Šablona:** [uoou.cz/incident-response]

- [ ] **Pravidelné audity GDPR compliance**
  - Interní audit každý půlrok
  - Externí audit 1x za rok (doporučeno)

### 💡 DOPORUČENÉ

- [ ] **ISO 27001 certifikace** (informační bezpečnost)
  - Prestižní, ale nákladné (cca 200 000 Kč)
  - Alternativa: SOC 2 compliance (pro USA klienty)

---

## 3. Webové stránky a obchodní podmínky

### ❗ KRITICKÉ (před launchem)

- [ ] **Obchodní podmínky**
  - ✅ Vytvořeno: `/legal/TERMS_AND_CONDITIONS.md`
  - [ ] Publikováno na webu: www.claimbuddy.cz/obchodni-podminky
  - [ ] Checkbox při registraci: "Souhlasím s Obchodními podmínkami"
  - [ ] Verzování (při změně podmínek notifikovat klienty)

- [ ] **Reklamační řád**
  - ✅ Vytvořeno: `/legal/COMPLAINTS_POLICY.md`
  - [ ] Publikováno na webu
  - [ ] Email: reklamace@claimbuddy.cz (funkční, sledovaný)

- [ ] **Disclaimer na každé stránce**
  - ✅ Texty připraveny: `/legal/WEBSITE_DISCLAIMER.md`
  - [ ] Implementovat v footeru: "Nejsme pojišťovací zprostředkovatel"
  - [ ] Na landing pages: "Konečné rozhodnutí dělá pojišťovna"
  - [ ] V pricing sekci: "Negarantujeme výsledek"

- [ ] **Kontaktní údaje v patičce**
  - Název: ClaimBuddy s.r.o.
  - IČO: [doplnit]
  - Sídlo: [adresa]
  - Email: info@claimbuddy.cz
  - Telefon: [doplnit]
  - Odkaz na obchodní podmínky, GDPR, cookies

- [ ] **SSL certifikát** (HTTPS)
  - Let's Encrypt (zdarma) nebo Certum (placené)
  - **MUSÍ:** Celý web na HTTPS (ne mixed content)

### ⚠️ DŮLEŽITÉ (do 3 měsíců)

- [ ] **Přístupnost (accessibility)**
  - WCAG 2.1 úroveň AA (doporučeno)
  - Alt texty na obrázcích
  - Kontrastní barvy (min. 4.5:1)
  - Klávesová navigace
  - **Nástroj na test:** [wave.webaim.org]

- [ ] **Mapa webu (sitemap.xml)**
  - Pro SEO a indexaci
  - Generátor: [xml-sitemaps.com] nebo plugin (WordPress, Next.js)

### 💡 DOPORUČENÉ

- [ ] **Blog / Znalostní báze**
  - Jak podat pojistnou událost
  - Tipy jak na pojišťovny
  - FAQ
  - **Důvod:** SEO, důvěryhodnost, edukace klientů

---

## 4. Smlouva s klientem

### ❗ KRITICKÉ (před prvním klientem)

- [ ] **Vzorová smlouva s klientem**
  - ✅ Vytvořeno: `/legal/CLIENT_CONTRACT_TEMPLATE.md`
  - [ ] Implementovat generování smlouvy (automatické vyplnění jména, adresy, typu pojištění)
  - [ ] Elektronický podpis (DocuSign, Signi.com, Adobe Sign)
  - **Alternativa:** Checkbox "Souhlasím s podmínkami" = akceptace dle § 1740 OZ

- [ ] **Plná moc pro komunikaci s pojišťovnou**
  - Součást smlouvy (Příloha č. 1)
  - **Rozsah:** Podání hlášení, komunikace, reklamace
  - **NENÍ:** Přebírání plnění (to jde přímo klientovi)

- [ ] **Archivace podepsaných smluv**
  - Šifrované uložení (AWS S3, Google Drive Business)
  - Backup (min. 2 lokace)
  - Přístup pouze oprávněným osobám
  - **Doba:** 10 let (účetní doklady), 3 roky (ostatní)

### ⚠️ DŮLEŽITÉ (před škálováním)

- [ ] **Automatizace generování smluv**
  - Integrace s CRM (HubSpot, Pipedrive)
  - Template engine (Handlebars, Jinja2)
  - PDF generování (Puppeteer, wkhtmltopdf)

### 💡 DOPORUČENÉ

- [ ] **Právní review smluv** (externím advokátem)
  - Před použitím nechat zkontrolovat
  - Náklady: 5 000-15 000 Kč za review
  - **Doporučení:** Advokátní kancelář specializující se na pojistné právo

---

## 5. Finance a účetnictví

### ❗ KRITICKÉ (od prvního příjmu)

- [ ] **Bankovní účet pro firmu**
  - Doporučené banky: Fio banka, Air Bank, Equa Bank (nízké poplatky)
  - **Náklady:** 0-500 Kč/měsíc

- [ ] **Účetní software**
  - Pohoda, Money S3, Fakturoid
  - **Náklady:** 300-1 000 Kč/měsíc
  - **Funkce:** Fakturace, účetnictví, mzdy (pokud máte zaměstnance)

- [ ] **Externí účetní** (doporučeno pro s.r.o.)
  - **Náklady:** 2 000-5 000 Kč/měsíc
  - **Alternativa:** Interní účetní (fixní náklady)

- [ ] **Registrace k DPH** (pokud obrat > 2 mil. Kč/rok)
  - Dobrovolně lze i dříve
  - **Výhoda:** Odpočet DPH na vstupu (SW, marketing)
  - **Nevýhoda:** Administrativní zátěž

### ⚠️ DŮLEŽITÉ (průběžně)

- [ ] **Daňová evidence**
  - Veškeré příjmy a výdaje
  - Archivace faktur (10 let)
  - **Sankce za nesplnění:** Pokuta až 500 000 Kč + doměření daně

- [ ] **Platby success fee**
  - Sledování kdy klient obdržel plnění od pojišťovny
  - Automatické generování faktur
  - Upomínky při nezaplacení (7, 14, 30 dnů)

- [ ] **Reporting**
  - Měsíční report pro jednatele (příjmy, výdaje, marže)
  - Roční účetní závěrka
  - Daňové přiznání

### 💡 DOPORUČENÉ

- [ ] **Fakturační API**
  - Automatizace fakturace (Stripe Invoicing, Fakturoid API)
  - Propojení s aplikací (po vyplacení plnění → automatická faktura)

---

## 6. Marketing a komunikace

### ❗ KRITICKÉ (před marketingem)

- [ ] **Souhlas s marketingovými emaily**
  - Checkbox při registraci: "Souhlasím s zasíláním novinek" (NENÍ předem zaškrtnutý!)
  - Možnost odhlášení v každém emailu (link "Odhlásit odběr")
  - **Zákon:** Zákon č. 480/2004 Sb. (nevyžádaná komunikace)
  - **Sankce:** Pokuta až 10 mil. Kč za spam

- [ ] **Disclaimer v reklamách**
  - Facebook Ads, Google Ads: Vždy uvést "Nejsme pojišťovací zprostředkovatel"
  - Neuvádět "Garantujeme výsledek" (není pravda)
  - **Kontroluje:** ČOI (Česká obchodní inspekce)

- [ ] **Reference klientů (testimonials)**
  - **MUSÍ:** Písemný souhlas klienta se zveřejněním (GDPR)
  - Anonymizovat citlivé údaje (ne plné jméno pokud je zdravotní případ)
  - **Formulář souhlasu:** "Souhlasím se zveřejněním mé reference na webu a v marketingových materiálech"

### ⚠️ DŮLEŽITÉ (před škálováním)

- [ ] **Transparentní ceny**
  - Jasně uvést success fee % nebo fixed fee Kč
  - Co je v ceně, co ne
  - **ČOI kontroluje:** Klamavé obchodní praktiky

- [ ] **Srovnávací reklama**
  - Pokud srovnáváte s konkurencí: Musí být pravdivé, ověřitelné
  - Nepoužívat "nejlepší", "nejlevnější" bez důkazů

### 💡 DOPORUČENÉ

- [ ] **Case studies**
  - Příběhy klientů (anonymizované)
  - "Jak jsme pomohli Janovi získat 45 000 Kč"
  - **Použití:** Blog, social media, landing pages

---

## 7. Bezpečnost a IT

### ❗ KRITICKÉ (před launchem)

- [ ] **SSL certifikát** (TLS 1.3)
  - ✅ Již uvedeno v sekci Web

- [ ] **Autentizace uživatelů**
  - [ ] Silná hesla (min. 8 znaků, mix čísla/písmena/speciální)
  - [ ] Hashování hesel (bcrypt, Argon2)
  - [ ] Rate limiting (max. 5 pokusů o přihlášení)
  - [ ] 2FA (dvoufaktorová autentizace) - doporučeno pro admin

- [ ] **Firewall a DDoS ochrana**
  - Cloudflare (zdarma tier stačí na začátek)
  - WAF (Web Application Firewall)

- [ ] **Zálohy (backups)**
  - **Databáze:** Denní automatické zálohy
  - **Soubory (dokumenty klientů):** Continuous backup (AWS S3 Versioning)
  - **Uchovávání:** Min. 30 denní historie
  - **Test obnovení:** 1x za měsíc (zkontrolovat, že backup funguje)

- [ ] **Monitoring a logy**
  - Sledování chyb (Sentry, Rollbar)
  - Access logy (kdo přistoupil k citlivým datům)
  - Uptime monitoring (UptimeRobot, Pingdom)

### ⚠️ DŮLEŽITÉ (do 3 měsíců)

- [ ] **Penetration testing** (pen test)
  - Externí bezpečnostní audit
  - **Poskytovatelé:** [seznam na hackercz.cz]
  - **Náklady:** 30 000-100 000 Kč
  - **Frekvence:** 1x ročně

- [ ] **Vulnerability scanning**
  - Automatické skenování (Snyk, Dependabot)
  - Aktualizace závislostí (npm, pip)

- [ ] **Incident response plán**
  - Co dělat při data breach
  - Kontakty (ÚOOÚ, klienti, PR)

### 💡 DOPORUČENÉ

- [ ] **Bug bounty program**
  - Odměny za nalezené bezpečnostní chyby
  - Platformy: HackerOne, Bugcrowd
  - **Náklady:** 10 000-50 000 Kč za závažnou chybu

---

## 8. Zaměstnanci a spolupracovníci

### ❗ KRITICKÉ (před prvním zaměstnancem)

- [ ] **Pracovní smlouva / Smlouva o dílo**
  - Jasný popis práce, mzda, pracovní doba
  - **NDA (mlčenlivost)** o klientských datech
  - **GDPR povinnosti** zaměstnanců

- [ ] **Školení GDPR**
  - Před přístupem k osobním údajům
  - Osvědčení o proškolení (podpis)
  - **Frekvence:** Ročně

- [ ] **Přístupová práva**
  - Role-based access control (admin, liquidator, support)
  - Princip "least privilege" (jen nutná oprávnění)
  - 2FA pro přístup k produkčním systémům

### ⚠️ DŮLEŽITÉ (průběžně)

- [ ] **Background check** (prověrka)
  - Zejména pro pozice s přístupem k citlivým datům
  - Výpis z rejstříku trestů (vyžádat při nástupu)

- [ ] **Exit process**
  - Okamžité zrušení přístupů při odchodu
  - Vrácení zařízení (notebook, telefon)
  - Připomenutí NDA (mlčenlivost trvá i po odchodu)

### 💡 DOPORUČENÉ

- [ ] **Pojištění zaměstnanců**
  - Úrazové pojištění (ironie, že?)
  - Životní pojištění (benefit)

---

## 9. Vztahy s pojišťovnami

### ❗ KRITICKÉ (před prvním případem)

- [ ] **Seznámení s pojistnými podmínkami hlavních pojišťoven**
  - Česká pojišťovna, Kooperativa, Generali, Allianz, ČSOB, UniCredit, atd.
  - **Stáhnout:** Aktuální podmínky z webů pojišťoven
  - **Archivovat:** Pro pozdější referenci

- [ ] **Kontakty na likvidační oddělení**
  - Přímé kontakty na likvidátory (pokud možné)
  - Obecné kontakty (zákaznické linky)

### ⚠️ DŮLEŽITÉ (do 6 měsíců)

- [ ] **Partnerství s pojišťovnami** (pokud možné)
  - Některé pojišťovny mají programy pro externí likvidátory
  - **Výhoda:** Rychlejší komunikace, vyšší úspěšnost

- [ ] **Registr pojišťoven**
  - Seznam všech pojišťoven působících v ČR
  - **Zdroj:** [cnb.cz/dohled-financni-trh/registr-pojistoven]

### 💡 DOPORUČENÉ

- [ ] **Databáze precedentů**
  - Jaké případy byly úspěšné
  - Argumentace která fungovala
  - **Použití:** Interní knowledge base

---

## 10. Zákaznická podpora

### ❗ KRITICKÉ (od prvního klienta)

- [ ] **Funkční email: info@claimbuddy.cz**
  - Odpověď do 24 hodin (pracovní den)
  - Auto-reply: "Děkujeme za email, odpovíme do 24 hodin"

- [ ] **Funkční email: reklamace@claimbuddy.cz**
  - Sledován denně
  - Odpověď do 5 pracovních dnů
  - Eskalace pro urgentní případy

- [ ] **Funkční email: gdpr@claimbuddy.cz**
  - GDPR žádosti (přístup, výmaz, oprava)
  - Odpověď do 30 dnů (zákonná lhůta)

- [ ] **Telefon**
  - Pracovní doba: Po-Pá 9:00-17:00 (minimálně)
  - Záznamník hlasové schránky (mimo pracovní dobu)

### ⚠️ DŮLEŽITÉ (do 3 měsíců)

- [ ] **Ticketing systém**
  - Freshdesk, Zendesk, Intercom
  - **Funkce:** Sledování stavu dotazu, automatické upomínky
  - **Náklady:** 0-1 000 Kč/měsíc

- [ ] **Znalostní báze (FAQ)**
  - Nejčastější dotazy
  - Návody (jak nahrát dokumenty, jak sledovat stav případu)
  - **Umístění:** www.claimbuddy.cz/faq

- [ ] **Live chat**
  - Intercom, Tawk.to (má free tier)
  - Pracovní doba: Lidé online
  - Mimo pracovní dobu: Automatický bot + formulář

### 💡 DOPORUČENÉ

- [ ] **Chatbot (AI)**
  - Automatické odpovědi na časté dotazy
  - Integrace s GPT-4 (přes API)
  - **Náklady:** 20-100 USD/měsíc (API calls)

---

## 11. Měření a analytika

### ❗ KRITICKÉ (od spuštění)

- [ ] **Google Analytics 4**
  - Sledování návštěvnosti webu
  - Konverze (registrace, odeslání případu)
  - **Cookie consent nutný!**

- [ ] **Konverze tracking**
  - Kolik lidí se registruje
  - Kolik případů je podáno
  - Kolik případů je úspěšných (pojišťovna vyplatila)
  - Success rate (%)

- [ ] **Finanční metriky**
  - MRR (Monthly Recurring Revenue) - pokud máte předplatné
  - Průměrná success fee na klienta
  - CAC (Customer Acquisition Cost)
  - LTV (Lifetime Value)

### ⚠️ DŮLEŽITÉ (do 3 měsíců)

- [ ] **Dashboard pro KPIs**
  - Metabase, Tableau, Google Data Studio (zdarma)
  - Denní update metrik
  - **Metriky:**
    - Počet aktivních případů
    - Průměrná doba vyřízení
    - Úspěšnost (% uznaných nároků)
    - Průměrná výše plnění
    - NPS (Net Promoter Score)

- [ ] **CRM integrace**
  - HubSpot, Pipedrive
  - **Funkce:** Sledování klientů, automatizace emailů
  - **Náklady:** 0-1 500 Kč/měsíc

### 💡 DOPORUČENÉ

- [ ] **A/B testing**
  - Testování různých verzí landing pages
  - Optimalizace conversion rate
  - **Nástroje:** Google Optimize, Optimizely

---

## 12. Právní podpora

### ❗ KRITICKÉ (před launchem)

- [ ] **Právní review všech dokumentů**
  - Obchodní podmínky
  - Smlouva s klientem
  - GDPR dokumenty
  - **Náklady:** 15 000-30 000 Kč (jednorázově)
  - **Poskytovatel:** Advokátní kancelář specializující se na pojištění

### ⚠️ DŮLEŽITÉ (průběžně)

- [ ] **Retainer s advokátem**
  - Měsíční poplatek za dostupnost (např. 5 hodin měsíčně)
  - Pro ad-hoc konzultace
  - **Náklady:** 10 000-20 000 Kč/měsíc
  - **Alternativa:** Pay-per-hour (1 500-3 000 Kč/hod)

- [ ] **Monitorování legislativy**
  - Změny v pojišťovnictví (zákon o distribuci pojištění)
  - Změny v GDPR (guidelines ÚOOÚ)
  - **Zdroje:** [cnb.cz], [uoou.cz], [epravo.cz]

### 💡 DOPORUČENÉ

- [ ] **Členství v profesních organizacích**
  - Česká asociace pojišťoven (pokud mají program pro likvidátory)
  - **Výhody:** Školení, networking, aktualizace legislativy

---

## 13. Timeline (časový harmonogram)

### Měsíc -2 (příprava)
- [ ] Založení s.r.o.
- [ ] Registrace IČO, DIČ
- [ ] Bankovní účet
- [ ] Právní review dokumentů

### Měsíc -1 (finální příprava)
- [ ] Vývoj webu (design, implementace)
- [ ] Implementace GDPR features (consent forms, privacy policy)
- [ ] Nastavení analytiky (Google Analytics, Hotjar)
- [ ] Testování aplikace (beta testing)

### Den 0 (launch)
- [ ] Publikace webu
- [ ] Aktivace plateb (Stripe, Comgate)
- [ ] První marketingová kampaň (Google Ads, Facebook Ads)
- [ ] Monitoring (sledování chyb, Sentry)

### Měsíc +1 (post-launch)
- [ ] Iterace na základě feedbacku
- [ ] Optimalizace konverzí (A/B testing)
- [ ] Přidání funkcí (podle user requests)

### Měsíc +3 (škálování)
- [ ] Najímání zaměstnanců (pokud je to nutné)
- [ ] Partnership s pojišťovnami
- [ ] Expansion (nové typy pojištění)

### Měsíc +6 (audit)
- [ ] Interní GDPR audit
- [ ] Bezpečnostní audit (pen test)
- [ ] Právní review (update dokumentů)

---

## 14. Nákladový odhad (pro launch)

### Jednorázové náklady (setup)
| Položka | Cena |
|---------|------|
| Založení s.r.o. | 10 000 Kč |
| Právní review dokumentů | 25 000 Kč |
| Web development (pokud outsource) | 100 000 Kč |
| Design (logo, branding) | 20 000 Kč |
| **CELKEM** | **155 000 Kč** |

### Měsíční náklady (recurring)
| Položka | Cena/měsíc |
|---------|------------|
| Hosting (AWS, Vercel) | 2 000 Kč |
| Email (Google Workspace) | 500 Kč |
| CRM (HubSpot Starter) | 1 000 Kč |
| Účetní | 3 000 Kč |
| Pojištění odpovědnosti | 2 000 Kč |
| Marketing (Google Ads) | 20 000 Kč |
| **CELKEM** | **28 500 Kč/měsíc** |

**Pozn.:** Náklady jsou orientační, mohou se lišit dle konkrétní implementace.

---

## 15. Checklist před launchem (summary)

### Pre-launch checklist (must have)

**Právní:**
- [ ] S.r.o. založena, IČO/DIČ přiděleno
- [ ] Obchodní podmínky publikovány
- [ ] Privacy Policy publikována
- [ ] Cookie Policy + banner implementován
- [ ] Smlouva s klientem připravena
- [ ] GDPR consent forms implementovány

**Web:**
- [ ] Funkční web (responsive, testován na Safari/Chrome/Firefox)
- [ ] HTTPS všude
- [ ] Disclaimer na každé stránce
- [ ] Kontaktní údaje v patičce
- [ ] Všechny linky fungují (404 check)

**Platby:**
- [ ] Bankovní účet
- [ ] Platební brána (Comgate/GoPay) nastavena
- [ ] Fakturační systém (Fakturoid)

**Support:**
- [ ] info@claimbuddy.cz funkční
- [ ] reklamace@claimbuddy.cz funkční
- [ ] gdpr@claimbuddy.cz funkční
- [ ] Telefon funkční (záznamník)

**Tech:**
- [ ] Zálohy nastaveny (denní)
- [ ] Monitoring (Sentry, UptimeRobot)
- [ ] SSL certifikát (TLS 1.3)
- [ ] Firewall (Cloudflare)

**GDPR:**
- [ ] Šifrování databáze
- [ ] Zpracovatelské smlouvy s poskytovateli
- [ ] Evidence činností zpracování
- [ ] Proces pro GDPR žádosti

---

## 16. Post-launch checklist (nice to have)

### Do 3 měsíců:
- [ ] Penetration testing
- [ ] DPO (externí konzultant)
- [ ] DPIA (Data Protection Impact Assessment)
- [ ] Pojištění odpovědnosti
- [ ] FAQ / Znalostní báze
- [ ] Dashboard s KPIs

### Do 6 měsíců:
- [ ] ISO 27001 certifikace (nebo plán na ni)
- [ ] Partnerství s pojišťovnami
- [ ] Likvidátorská certifikace (pro zakladatele)
- [ ] Retainer s advokátem

---

## 17. Kontakty (užitečné)

### Právní:
- **Advokátní komora ČR:** [cak.cz] - vyhledávání advokátů
- **Česká obchodní inspekce:** [coi.cz] - ochrana spotřebitele
- **Úřad pro ochranu osobních údajů:** [uoou.cz] - GDPR

### Finance:
- **Finanční úřad:** [financnisprava.cz]
- **Datová schránka:** [info.cz]

### Pojišťovnictví:
- **Česká národní banka (dohled):** [cnb.cz]
- **Česká asociace pojišťoven:** [cap.cz]
- **Finanční arbitr:** [finarbitr.cz]

### IT & Bezpečnost:
- **NÚKIB (kybernetická bezpečnost):** [nukib.cz]
- **CZ.NIC (registrace domén):** [nic.cz]

---

## 18. Soubory ke stažení (šablony)

**Vygenerované v tomto projektu:**
- `/legal/TERMS_AND_CONDITIONS.md`
- `/legal/PRIVACY_POLICY.md`
- `/legal/GDPR_CONSENT_FORM.md`
- `/legal/CLIENT_CONTRACT_TEMPLATE.md`
- `/legal/COMPLAINTS_POLICY.md`
- `/legal/COOKIE_POLICY.md`
- `/legal/WEBSITE_DISCLAIMER.md`

**Stáhnout odjinud (oficiální šablony):**
- Evidence činností zpracování: [uoou.cz/sablony]
- Zpracovatelská smlouva: [uoou.cz/zpracovatelska-smlouva]
- DPIA šablona: [uoou.cz/dpia]

---

**Máte otázky?**
Kontaktujte právníka specializujícího se na:
- Pojistné právo
- GDPR a ochrana osobních údajů
- Obchodní právo (smlouvy)

**Doporučené AK:**
- [Seznam advokátů na cak.cz/adresar]
- Specializace: Pojištění, GDPR, IT právo

---

## 19. Prohlášení

**Disclaimer:**
Tento checklist je informativní a nenahrazuje právní poradenství.
Pro konkrétní situaci konzultujte s advokátem.

ClaimBuddy s.r.o. neručí za úplnost nebo aktuálnost tohoto dokumentu.

**Poslední update:** 1. ledna 2026
**Autor:** [Radim / Claude Code]

---

*Verze 1.0 | ClaimBuddy s.r.o. | IČO: [doplnit]*
