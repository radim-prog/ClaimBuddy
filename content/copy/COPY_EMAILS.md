# Email Templates - ClaimBuddy

## Email Strategy Overview

**Tone of voice:**
- Přátelský, ale profesionální
- Empatický (rozumíme stresu z pojistných událostí)
- Transparentní (jasně komunikujeme co se děje)
- Proaktivní (informujeme před tím, než se ptají)

**Best practices:**
- Krátké předmět (max 50 znaků)
- Jasné CTA (jeden primární action per email)
- Personalizace (jméno, typ případu)
- Mobile-first (70%+ čte na mobilu)

---

## 1. Welcome Email - Potvrzení registrace

**Subject:** "Vítejte v ClaimBuddy, {Jméno}! 👋"

**Body:**

```
Ahoj {Jméno},

Děkujeme, že jste se zaregistrovali do ClaimBuddy!

Jsme rádi, že nám svěřujete vyřízení pojistné události. Rozumíme, že je to stresující situace, a proto jsme tu pro vás – abychom vám vzali starosti ze hřbet a vyjednali maximální pojistné plnění.

🎯 CO SE DĚJE TEĎKA?

Během 24 hodin:
→ Váš případ prověříme
→ Přidělíme vám osobního case managera
→ Pošleme vám cenovou nabídku a časový odhad

📱 MEZITÍM MŮŽETE:

- Přihlásit se do aplikace: [Link na app]
- Nahrát další dokumenty/fotky (pokud máte)
- Přečíst si FAQ: [Link na FAQ]

💬 MÁTE OTÁZKU?

Odpovíte na tento email nebo zavolejte: +420 XXX XXX XXX
(Po-Pá 9:00-18:00)

Jsme tady pro vás,
Tým ClaimBuddy

---

P.S. Prosím zkontrolujte spam folder pro další emaily od nás (info@claimbuddy.cz). Přidejte nás do kontaktů, ať nic nezmeškáte.

ClaimBuddy s.r.o.
[Adresa]
IČO: XXXXXXXX
www.claimbuddy.cz
```

**Design notes:**
- Welcome banner grafika (brand colors)
- Icons pro each bullet point
- Prominent CTA button pro app login

---

## 2. Case Accepted - Potvrzení přijetí případu

**Subject:** "Váš případ je v dobrých rukách ✅"

**Body:**

```
Ahoj {Jméno},

Máme skvělé zprávy – přijali jsme váš případ!

📋 DETAILY VAŠEHO PŘÍPADU

Číslo případu: #{CaseID}
Typ události: {Typ události - auto/byt/zdraví...}
Pojišťovna: {Název pojišťovny}
Case manager: {Jméno case managera}

💰 CENOVÁ NABÍDKA

Balíček: {Basic/Premium/Pro}
Cena: {490/990/1990} Kč

⏱️ ČASOVÝ ODHAD

Odhadovaná doba vyřízení: {14} pracovních dní
Předpokládané dokončení: {Datum}

📊 ODHAD VÝSLEDKU

Na základě podobných případů odhadujeme:
→ Původní nabídka pojišťovny: cca {15,000} Kč
→ Po našem vyjednání: cca {22,000} Kč
→ Vaš potenciální zisk: +{7,000} Kč*

*Toto je pouze odhad. Skutečný výsledek závisí na mnoha faktorech.

🚀 CO BUDE NÁSLEDOVAT?

Krok 1 (2-3 dny): Shromáždíme všechny potřebné dokumenty
Krok 2 (3-5 dní): Kontaktujeme pojišťovnu a podáme hlášení
Krok 3 (7-10 dní): Vyjednáme podmínky a výši plnění
Krok 4 (1-2 dny): Finalizace a výplata pojistky

Máte přístup do aplikace, kde vidíte live updates: [Link na app dashboard]

💳 PLATBA

Aktivační poplatek: {50% z ceny} Kč
Splatnost: do 3 dnů
Platební údaje: [Link na payment]

Zbývající {50%} zaplatíte až po úspěšném vyřízení.

❓ MÁTE DOTAZ?

Váš case manager {Jméno}:
📧 Email: {email@claimbuddy.cz}
📞 Telefon: +420 XXX XXX XXX

Nebo odpovězte na tento email.

Makáme na tom! 💪
Tým ClaimBuddy

---

ClaimBuddy s.r.o. | www.claimbuddy.cz
```

**Design notes:**
- Progress bar graphic (Step 1 of 4)
- Card layout pro case details
- Prominent payment CTA button

---

## 3. Progress Update - Týdenní update o postupu

**Subject:** "Update: Váš případ #{CaseID} - {Fáze}"

**Body:**

```
Ahoj {Jméno},

Jen rychlý update ohledně vašeho případu #{CaseID}.

📍 KDE PRÁVĚ JSME

✅ Shromáždění dokumentů - HOTOVO
✅ Kontakt s pojišťovnou - HOTOVO
⏳ Vyjednávání podmínek - PROBÍHÁ (60% hotovo)
⌛ Finalizace - ČEKÁ

🔄 CO SE STALO TENTO TÝDEN

→ {Den}: Poslali jsme kompletní hlášení škody pojišťovně {Název}
→ {Den}: Pojišťovna potvrdila příjem a přidělila likvidátora
→ {Den}: První kontakt s likvidátorem – vyžádali si dodatečné fotky
→ {Den}: Odeslali jsme doplňující dokumentaci

📅 CO BUDE NÁSLEDOVAT

Tento týden:
→ Čekáme na první nabídku od pojišťovny (očekáváme {datum})
→ Připravujeme argumenty pro vyjednávání vyšší částky

Příští týden:
→ Začne samotné vyjednávání

⏱️ AKTUÁLNÍ ČASOVÝ ODHAD

Původní odhad: {14 dní}
Aktuální progress: Na plánu ✅
Předpokládané dokončení: {Datum}

💬 POTŘEBUJEME OD VÁS

{Pokud něco potřebujeme - jinak skip tuto sekci}

Abychom mohli pokračovat, potřebovali bychom:
→ {Co potřebujeme - fotka, dokument, atd.}

Můžete to nahrát přímo v aplikaci: [Link]

---

Všechno běží hladce. Ozveme se, jakmile budou novinky!

Váš case manager,
{Jméno}

P.S. Live status sledujte v aplikaci: [Link]

---

ClaimBuddy s.r.o. | www.claimbuddy.cz
Odpovědět na tento email | Zavolat: +420 XXX XXX XXX
```

**Variants:**
- Pokud je delay: Explainer proč + nový timeline
- Pokud je good news (vyšší nabídka než čekali): Celebratory tone
- Pokud je setback (odmítnutí): Reassuring tone + plan B

---

## 4. Important Action Required - Potřebujeme něco od vás

**Subject:** "⚠️ Akce potřeba: Váš případ #{CaseID}"

**Body:**

```
Ahoj {Jméno},

Potřebujeme vaši pomoc s případem #{CaseID}.

⚡ CO POTŘEBUJEME

{Konkrétní popis - např.:}
Pojišťovna vyžaduje dodatečné potvrzení o {XXX}. Potřebovali bychom od vás:

→ {Dokument 1}
→ {Dokument 2}
→ {Info/potvrzení}

📅 DEADLINE

Prosíme do: {Datum} (zbývá {X dní})

Bez těchto podkladů bohužel nemůžeme pokračovat dál. Pojišťovna pozastaví vyřizování.

📤 JAK TO POSLAT

Nejjednodušeji v aplikaci:
[Link na upload] - klikněte a nahrajte

Nebo odpovězte na tento email s přílohami.

💬 NEVÍTE, KDE TO SEHNAT?

Zavolejte nám a pomůžeme:
{Jméno case managera}: +420 XXX XXX XXX

Případně odpovězte na tento email s dotazem.

Děkujeme za spolupráci!
{Jméno}

---

ClaimBuddy s.r.o. | www.claimbuddy.cz
```

**Design notes:**
- Warning icon (orange, ne red - nechceme alarmovat)
- Deadline prominentně zvýrazněný
- Easy upload CTA button

**Variant - Urgent (do 48 hodin):**
Subject: "🚨 URGENTNÍ: Akce potřeba do 48h - #{CaseID}"

---

## 5. Offer Received - Pojišťovna nabídla částku

**Subject:** "Nabídka pojišťovny: {Částka} Kč | Váš případ #{CaseID}"

**Body:**

```
Ahoj {Jméno},

Máme nabídku od pojišťovny {Název}!

💰 JEJICH NABÍDKA

Nabízejí: {18,000} Kč

📊 NAŠE ANALÝZA

Podle našich zkušeností a srovnání:

→ Tato nabídka je: {pod průměrem / průměrná / nadprůměrná}
→ U podobných případů pojišťovny platí: {20,000-25,000} Kč
→ Reálná tržní hodnota/škoda: cca {24,000} Kč

🎯 NAŠE DOPORUČENÍ

❌ NEDOPORUČUJEME přijmout zatím
✅ DOPORUČUJEME vyjednávat vyšší částku

Odhadujeme, že můžeme vyjednat: {22,000-26,000} Kč

📈 CO UDĚLÁME TEĎKA

1. Odpovíme pojišťovně, že nabídka je nedostatečná
2. Předložíme argumenty a důkazy pro vyšší částku:
   → {Argument 1 - např. srovnání tržních cen}
   → {Argument 2 - např. znalecký posudek}
   → {Argument 3 - např. dodatečné škody}
3. Vyjednáme navýšení

⏱️ TIMELINE

Očekáváme odpověď pojišťovny: {3-5 pracovních dní}

Samozřejmě vás budeme informovat o každém kroku.

💬 CHCETE NABÍDKU PŘIJMOUT I TAK?

Pokud z nějakého důvodu chcete přijmout aktuální nabídku hned (např. potřebujete peníze rychle), dejte nám vědět.

Je to vaše rozhodnutí a my ho respektujeme. Ale doporučujeme počkat na výsledek vyjednávání.

Jsme na tom!
{Jméno case managera}

---

ClaimBuddy s.r.o. | www.claimbuddy.cz
Odpovědět | Zavolat: +420 XXX XXX XXX
```

**Variant - Good offer:**
Pokud je nabídka nad očekávání:
"Máme skvělé zprávy! Pojišťovna nabídla {částka}, což je nad průměrem. Doporučujeme přijmout."

---

## 6. Negotiation Success - Vyjednali jsme víc

**Subject:** "🎉 Úspěch! Vyjednali jsme {vyšší částka} Kč"

**Body:**

```
Ahoj {Jméno},

Máme skvělé zprávy! 🎉

💰 VYJEDNALI JSME VÍCEJ

Původní nabídka: {18,000} Kč
Finální schválená částka: {26,000} Kč

➕ Vyjednali jsme navíc: +{8,000} Kč (+44%)

🏆 JAK JSME TO UDĚLALI

→ Předložili jsme srovnání tržních cen podobných {aut/nemovitostí...}
→ Argumentovali jsme aktuálním stavem a péčí o {majetek}
→ Poskytli jsme odborný posudek, který potvrdil vyšší hodnotu

📅 CO BUDE NÁSLEDOVAT

1. Pojišťovna vám pošle oficiální rozhodnutí (1-2 dny)
2. Peníze obdržíte na účet (3-5 dní od rozhodnutí)
3. Zašlete nám potvrzení o přijetí → vystavíme finální fakturu

💳 NAŠE ODMĚNA

Dle smlouvy ({Success fee model / Fixní cena}):
→ Celková cena naší služby: {990 Kč / 15% z navýšení = 1,200 Kč}
→ Již zaplaceno (aktivační poplatek): {490 Kč}
→ Zbývá doplatit: {500/710 Kč}

💚 VÁŠ ČISTÝ ZISK

Celkem jste získali navíc: +{8,000} Kč
Náš poplatek: -{990 Kč}
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Čistý zisk: +{7,010} Kč

🙏 BYLI JSME RÁDI, ŽE JSME VÁM POMOHLI!

Pokud jste byli spokojeni s našimi službami, budeme rádi za:

⭐ Hodnocení na Google: [Link]
💬 Recenzi na našem webu: [Link]
🎁 Doporučení přátelům (oba dostanete -10% slevu): [Referral link]

Děkujeme za důvěru!
Tým ClaimBuddy

---

P.S. Pokud budete mít v budoucnu další pojistnou událost, jsme tu pro vás. Věrní klienti mají -10% slevu.

ClaimBuddy s.r.o. | www.claimbuddy.cz
```

**Design notes:**
- Celebratory colors (zelená, zlatá)
- Big numbers (finální částka prominentní)
- Social sharing buttons

---

## 7. Case Closed - Dokončení případu

**Subject:** "Váš případ #{CaseID} je uzavřen ✅"

**Body:**

```
Ahoj {Jméno},

Váš případ #{CaseID} je oficiálně uzavřen!

✅ SOUHRN

Začátek případu: {Datum}
Dokončení případu: {Datum}
Doba vyřízení: {14 dní}

Původní nabídka pojišťovny: {18,000} Kč
Finální vyplaceno: {26,000} Kč
Váš zisk navíc: +{8,000} Kč
Náš poplatek: {990 Kč}
Čistý zisk: +{7,010} Kč

📄 DOKUMENTY

Všechny dokumenty najdete v aplikaci:
→ Finální rozhodnutí pojišťovny
→ Faktura od ClaimBuddy
→ Kompletní komunikace
→ Podklady k případu

[Stáhnout vše jako ZIP]

💾 UCHOVÁME PRO VÁS

Všechna data uchováme 7 let (dle zákona) pro případ budoucí potřeby.

📊 JAK JSME SI VEDLI?

Čas vyřízení: {14 dní} (průměr v odvětví: 28 dní) ✅
Navýšení oproti původní nabídce: +{44%} ✅
Vaše spokojenost: {Čekáme na váš feedback} ⏳

🌟 ŘEKNĚTE NÁM, JAK JSE SE VÁM LÍBILO

Pomohlo by nám vaše hodnocení (zabere 2 minuty):

[★★★★★ Ohodnotit na Google]

Nebo napište krátkou recenzi:
[💬 Napsat recenzi]

🎁 DOPORUČTE PŘÁTELE

Znáte někoho, kdo řeší pojistnou událost?
Pošlete jim svůj referral link a oba dostanete -10% slevu:

{Váš unikátní referral link}

💚 DĚKUJEME ZA DŮVĚRU

Byli jsme rádi, že jsme vám pomohli. Pokud budete mít v budoucnu jakýkoliv problém s pojistkami, jsme tu pro vás.

S pozdravem,
Tým ClaimBuddy

---

P.S. Jako věrný klient máte -10% slevu na další případ. Kod: LOYAL10

ClaimBuddy s.r.o. | www.claimbuddy.cz
www.claimbuddy.cz | info@claimbuddy.cz
```

---

## 8. Request for Review - Žádost o recenzi (3 dny po uzavření)

**Subject:** "Jak se vám líbilo? ⭐"

**Body:**

```
Ahoj {Jméno},

Před pár dny jsme dokončili váš případ a doufáme, že jste spokojeni s výsledkem!

Pomohlo by nám vaše upřímné hodnocení.

⭐ HODNOCENÍ (2 minuty)

[★★★★★ 5 hvězd - Skvělé!]
[★★★★☆ 4 hvězdy - Dobré]
[★★★☆☆ 3 hvězdy - Průměrné]
[★★☆☆☆ 2 hvězdy - Mohlo být líp]
[★☆☆☆☆ 1 hvězda - Nebylo to ono]

💬 NEBO NAPIŠTE PAAR SLOV

Co se vám líbilo nejvíc?
Co bychom mohli zlepšit?

[Napsat feedback]

🎁 PODĚKOVÁNÍ

Za váš čas vám pošleme voucher na kávu do oblíbené kavárny (100 Kč).

Děkujeme!
Tým ClaimBuddy

---

P.S. Pokud jste super spokojeni, budeme rádi za veřejnou recenzi na Google: [Link]

ClaimBuddy s.r.o. | www.claimbuddy.cz
```

**Variant - Pro nespokojené (klikli 1-2 stars):**
→ Redirect na private feedback form (ne public review)
→ Offer phone call with manager to resolve

---

## 9. Upsell - Další služby (měsíc po uzavření)

**Subject:** "Zkontrolovali jste si svou pojistnou smlouvu? 🔍"

**Body:**

```
Ahoj {Jméno},

Doufáme, že se vám daří!

Před měsícem jsme vám pomohli vyřídit pojistnou událost. Teď máme tip, jak se vyhnout problémům v budoucnu.

🔍 POJISTNÁ REVIZE (490 Kč)

Nabízíme kontrolu vaší aktuální pojistné smlouvy:

✅ Zkontrolujeme, jestli máte dobré podmínky
✅ Najdeme případné mezery v krytí
✅ Poradíme, jak ušetřit na pojistném (průměrně -20%)
✅ Doporučíme optimální nastavení

📊 CO ZÍSKÁTE

→ Detailní report (PDF)
→ Telefonickou konzultaci (30 min)
→ Doporučení konkrétních změn

💰 SPECIÁLNÍ CENA PRO VÁS

Běžná cena: 690 Kč
Pro věrné klienty: 490 Kč (-29%)

[Objednat revizi]

Nebo si prostě přečtěte náš blog o pojistkách zdarma:
[Link na blog]

Hezký den!
Tým ClaimBuddy

---

ClaimBuddy s.r.o. | www.claimbuddy.cz
Odhlásit | Upravit preference
```

---

## 10. Re-engagement - Inactive user (3 měsíce)

**Subject:** "Doufáme, že je všechno OK 💚"

**Body:**

```
Ahoj {Jméno},

Je to chvíle, co jsme se slyšeli!

Doufáme, že jste neměli žádné další pojistné události (to je dobře! 🙂).

💡 VÍTE, ŽE CLAIMBUDDY MŮŽE POMOCI I S:

→ Revizí pojistné smlouvy
→ Konzultací před uzavřením nové pojistky
→ Odvoláním starších odmítnutých případů (do 3 let zpět)
→ Kontrolou, jestli vám pojišťovna dluží nějaké benefity

📚 NOVÉ NA BLOGU

{Název nejnovějšího blog postu}
{Krátký popis}
[Číst více]

🎁 SPECIÁLNÍ NABÍDKA

Jako existující klient máte -10% slevu na další případ nebo službu.
Kód: LOYAL10

Pokud znáte někoho, kdo řeší pojistnou událost, pošlete mu náš odkaz.
Oba dostanete -10% slevu:

{Referral link}

Hezký den a snad žádné pojistné události! 🙂
Tým ClaimBuddy

---

ClaimBuddy s.r.o. | www.claimbuddy.cz
Odhlásit z newsletteru
```

---

## Email Automation Flow

### Onboarding Flow (pro nové klienty)

**Day 0:** Welcome email (hned po registraci)
**Day 1:** Case accepted (po přijetí případu)
**Day 3-7:** Progress update (týdně)
**Day X:** Offer received (když pojišťovna nabídne)
**Day X+2:** Negotiation success / Case closed
**Day X+5:** Request for review
**Day X+30:** Upsell / Educational content
**Day X+90:** Re-engagement

### Newsletter Flow (pro všechny)

**Frekvence:** 1x měsíčně (opt-in)

**Content mix:**
- 50% Educational (blog posts, tipy)
- 30% Company updates (new features, team)
- 20% Promotional (special offers, referral)

---

## Email Design Guidelines

**Header:**
- Logo ClaimBuddy
- Recipient name (personalizace)
- Case ID (pokud relevantní)

**Body:**
- Max 500 slov (kratší = lepší read rate)
- Krátké odstavce (2-3 řádky)
- Bullet points pro scannability
- Jeden primární CTA (button)
- Sekundární CTA (text link)

**Footer:**
- Kontaktní informace
- Unsubscribe link (legally required)
- Fyzická adresa (legally required)
- Social media links

**Mobile optimization:**
- Single column layout
- Minimum 14px font size
- Touch-friendly buttons (44x44px min)

---

## A/B Testing Ideas

### Subject lines
- Emoji vs. No emoji
- Question vs. Statement
- Urgency vs. Casual
- Personal vs. Brand voice

### Content
- Short vs. Long
- Formal vs. Casual
- Numbers heavy vs. Story-driven

### CTA
- Button color (blue vs. orange)
- Button text ("Začít" vs. "Pokračovat" vs. "Zjistit více")
- CTA placement (top vs. middle vs. bottom)

---

## Compliance Notes

**GDPR:**
- Všechny marketing emaily musí mít opt-in
- Easy unsubscribe (one-click)
- Data processing consent

**Legal requirements:**
- Fyzická adresa firmy ve footeru
- IČO ve footeru
- Možnost odhlášení

**Best practices:**
- Double opt-in pro newsletter
- Preference center (co chtějí dostávat)
- Email frequency control
