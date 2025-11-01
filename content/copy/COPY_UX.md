# UX Copy & Microcopy - ClaimBuddy

## UX Copy Philosophy

**Principy:**
1. **Conversational** - Píšeme jako lidé, ne roboti
2. **Clear over clever** - Srozumitelnost > vtipnost
3. **Helpful** - Vždy vysvětlujeme "proč"
4. **Honest** - Žádné skrývání problémů nebo chyb
5. **Empathetic** - Rozumíme, že pojistné události jsou stresující

**Tone:**
- Přátelský, ale ne příliš casual
- Professionální, ale ne formální
- Podporující, ale ne patronizující

---

## Error Messages

### Formuláře - Validace

**Prázdné povinné pole:**
```
❌ "Toto pole je povinné"
✅ "Potřebujeme vaše jméno, abychom vás mohli kontaktovat"
```

**Neplatný email:**
```
❌ "Invalid email format"
✅ "Zkontrolujte email - vypadá to, že tam chybí @ nebo tečka"
```

**Neplatný telefon:**
```
❌ "Phone number must be 9 digits"
✅ "Telefonní číslo by mělo mít 9 číslic (např. 603 123 456)"
```

**Příliš krátký text:**
```
❌ "Minimum 10 characters required"
✅ "Popište to trochu podrobněji (min. 10 znaků)"
```

**Příliš velký soubor:**
```
❌ "File size exceeds limit"
✅ "Tento soubor je příliš velký (max. 10 MB). Zkuste menší verzi nebo ho rozdělte."
```

**Neplatný formát souboru:**
```
❌ "File type not supported"
✅ "Tento formát nepodporujeme. Nahrajte JPG, PNG nebo PDF."
```

**Datum v minulosti (kde by mělo být v budoucnu):**
```
❌ "Date must be in future"
✅ "Toto datum už proběhlo. Zkontrolujte, jestli je správně."
```

**Datum v budoucnu (kde by mělo být v minulosti - např. datum nehody):**
```
❌ "Date cannot be in future"
✅ "Událost nemůže být v budoucnu. Zkontrolujte datum."
```

---

### Systémové chyby

**Obecná chyba (500):**
```
❌ "Internal server error"
✅ "Jejda, něco se pokazilo na naší straně.
    Zkuste to prosím za chvíli znovu.

    [Zkusit znovu]

    Pokud problém přetrvává, napište nám: info@claimbuddy.cz"
```

**Network error:**
```
❌ "Network connection failed"
✅ "Zdá se, že nemáte připojení k internetu.
    Zkontrolujte WiFi nebo mobilní data a zkuste to znovu.

    [Zkusit znovu]"
```

**Upload failed:**
```
❌ "Upload failed"
✅ "Nepodařilo se nahrát soubor.

    Možné příčiny:
    • Slabé připojení - zkuste to znovu
    • Soubor je příliš velký (max 10 MB)
    • Neplatný formát (podporujeme JPG, PNG, PDF)

    [Zkusit znovu] [Kontaktovat podporu]"
```

**Session expired:**
```
❌ "Session expired. Please login again."
✅ "Z bezpečnostních důvodů jsme vás odhlásili po delší neaktivitě.
    Přihlaste se prosím znovu.

    Váš postup je uložen, nic jste neztratili.

    [Přihlásit se]"
```

**Payment failed:**
```
❌ "Payment declined"
✅ "Platba se nezdařila.

    Možné důvody:
    • Nedostatek prostředků
    • Banka zablokovala transakci
    • Nesprávné údaje karty

    Zkuste jinou platební metodu nebo kontaktujte svou banku.

    [Zkusit znovu] [Jiná platba] [Kontaktovat podporu]"
```

---

### 404 & Empty States

**404 - Stránka nenalezena:**
```
Headline: "Hledaná stránka neexistuje"

Body:
"Zkusili jste adresu, která u nás není.
Možná špatně zkopírovaný odkaz nebo stránka byla přesunuta.

Co teď?
→ [Zpět na hlavní stránku]
→ [Přehled případů]
→ [Kontaktovat podporu]"

Visual: 404 ilustrace (ne strašidelná, spíš vtipná/přátelská)
```

**403 - Přístup odmítnut:**
```
Headline: "K této stránce nemáte přístup"

Body:
"Tato sekce je určena jen pro {adminy / Premium členy / atd.}.

Pokud si myslíte, že je to chyba, kontaktujte nás.

→ [Zpět na hlavní stránku]
→ [Kontaktovat podporu]"
```

---

## Empty States (prázdné stavy)

**Dashboard - žádné případy:**
```
Headline: "Zatím žádné případy"

Body:
"Nemáte žádný aktivní případ.
Máte pojistnou událost, kterou potřebujete vyřídit?

[+ Vytvořit nový případ]"

Visual: Prázdný ilustrace (např. prázdná složka s usmívajícím se ikonou)
```

**Žádné dokumenty:**
```
Headline: "Zatím žádné dokumenty"

Body:
"Jakmile začneme pracovat na vašem případu,
všechny dokumenty se objeví zde.

Mezitím můžete nahrát vlastní dokumenty/fotky.

[+ Nahrát dokument]"
```

**Žádné notifikace:**
```
Headline: "Vše je vyřízené 👍"

Body:
"Žádné nové notifikace.
Ozveme se, jakmile bude něco nového."

Visual: Checkmark nebo poklidný emoji
```

**Žádné zprávy (chat empty):**
```
Headline: "Konverzace začíná teď"

Body:
"Napište svůj první dotaz nebo problém.
Odpovíme do 24 hodin.

Placeholder v input fieldu:
"Napište zprávu..."
```

---

## Loading States

**Obecný loading:**
```
"Načítání..."
```

**Odesílání formuláře:**
```
"Odesíláme váš případ... ⏳"
```

**Upload probíhá:**
```
"Nahrávání souboru... 45%"
(s progress barem)
```

**Dlouhý proces (něco co trvá 10+ sekund):**
```
"Zpracováváme váš případ...

Tohle může chvíli trvat. Neodcházejte prosím z této stránky.

☕ Čas si dát kafé!"
```

**Platba probíhá:**
```
"Zpracováváme platbu...

Neobnovujte stránku a neopouštějte ji.
Platba probíhá bezpečně přes šifrované spojení."
```

**Generování PDF/dokumentu:**
```
"Připravujeme váš dokument...

Stahování začne automaticky za chvíli.

[Nebo klikněte zde pro ruční stažení]"
```

---

## Success Messages

**Případ úspěšně vytvořen:**
```
✅ "Hotovo! Váš případ #{ID} je u nás."

"Ozveme se do 24 hodin s cenovou nabídkou.
Mezitím můžete sledovat průběh v aplikaci."

[Přejít na dashboard]
```

**Dokument nahrán:**
```
✅ "Soubor nahrán úspěšně!"

"Máme ho. Děkujeme!"
```

**Platba provedena:**
```
✅ "Platba úspěšná!"

"Obdrželi jsme vaši platbu {částka} Kč.
Potvrzení jsme poslali na {email}.

[Stáhnout potvrzení] [Přejít na dashboard]"
```

**Profil aktualizován:**
```
✅ "Změny uloženy"

"Váš profil byl aktualizován."
```

**Email změněn:**
```
✅ "Email změněn"

"Poslali jsme potvrzovací email na {nový email}.
Klikněte na odkaz v emailu pro potvrzení změny."
```

**Heslo změněno:**
```
✅ "Heslo změněno úspěšně"

"Z bezpečnostních důvodů jsme vás odhlásili.
Přihlaste se prosím novým heslem.

[Přihlásit se]"
```

**Zpráva odeslána:**
```
✅ "Zpráva odeslána"

"Odpovíme co nejdříve (obvykle do 24 hodin)."
```

**Hodnocení odesláno:**
```
✅ "Děkujeme za hodnocení!"

"Vaše zpětná vazba nám pomáhá být lepší.

Chcete nám pomoci ještě víc?
Sdílejte své zkušenosti na Google nebo Facebooku.

[Hodnotit na Google] [Ne, díky]"
```

---

## Confirmation Prompts (před důležitou akcí)

**Smazání případu:**
```
Headline: "Opravdu smazat případ?"

Body:
"Tato akce je nevratná.
Případ #{ID} a všechny související dokumenty budou trvale smazány.

Jste si jistí?

[Zrušit] [Ano, smazat]"
```

**Zrušení spolupráce:**
```
Headline: "Zrušit spolupráci?"

Body:
"Chcete zrušit spolupráci na případu #{ID}?

Co se stane:
• Přestaneme pracovat na vašem případu
• Vrátíme poměrnou část poplatku (pokud náleží)
• Poskytneme vám všechny dokumenty
• Případ zůstane v archivu 90 dní

Jste si jistí?

[Ne, pokračovat] [Ano, zrušit]"
```

**Odhlášení z newsletteru:**
```
Headline: "Odhlásit se z emailů?"

Body:
"Budeme smutní 😢

Co už nebudete dostávat:
• Týdenní tipy o pojistkách
• Info o novinkách ClaimBuddy
• Speciální nabídky

Důležité: Update emails o vašem případu BUDETE DOSTÁVAT i nadále.

[Zrušit] [Ano, odhlásit]"
```

---

## Tooltips & Helper Text

**Číslo pojistné smlouvy (?):**
```
"Najdete ho na pojistné smlouvě nebo v potvrzení o pojištění.

Příklad: 123456789/01

Pokud ho nemáte, nevadí - pomůžeme dohledat."
```

**VIN číslo (?):**
```
"VIN (Vehicle Identification Number) je unikátní 17-místný kód auta.

Najdete ho:
• V technickém průkazu
• Na štítku u čelního skla
• Na sloupku u dveří řidiče

Příklad: WVWZZZ1KZBW123456"
```

**Spoluúčast (?):**
```
"Spoluúčast je částka, kterou platíte vy ze své kapsy při každé pojistné události.

Příklad:
Škoda: 50,000 Kč
Spoluúčast: 5,000 Kč
Pojišťovna zaplatí: 45,000 Kč

Obvykle platí: Vyšší spoluúčast = nižší pojistné."
```

**Časová cena (?):**
```
"Časová cena je hodnota věci snížená o opotřebení.

Příklad:
Nákupní cena (před 3 lety): 20,000 Kč
Opotřebení 30%: -6,000 Kč
Časová cena: 14,000 Kč

Pojišťovny často počítají časovou cenu, i když by měly hradit vyšší 'obvyklou cenu'."
```

**Success fee (?):**
```
"Platíte procento z toho, co vyjednáme NAVÍC oproti původní nabídce pojišťovny.

Příklad:
Původní nabídka: 18,000 Kč
Vyjednáno: 26,000 Kč
Rozdíl: 8,000 Kč

Náš poplatek (15%): 1,200 Kč
Váš čistý zisk: +6,800 Kč

Pokud nevyjednáme navýšení = platíte 0 Kč."
```

---

## Navigation & Buttons

### Primary CTAs (hlavní akce)

**Začít proces:**
"Začít hned" / "Odeslat případ" / "Vytvořit případ"

**Pokračovat:**
"Pokračovat" / "Další krok" / "Hotovo"

**Odeslat:**
"Odeslat" / "Poslat" / "Potvrdit"

**Platba:**
"Zaplatit {částka} Kč" / "Přejít k platbě"

### Secondary CTAs (vedlejší akce)

**Zpět:**
"← Zpět" / "Vrátit se"

**Zrušit:**
"Zrušit" / "Zavřít"

**Více info:**
"Zjistit více" / "Přečíst více" / "Detaily"

**Kontakt:**
"Kontaktovat nás" / "Napsat nám" / "Zavolat"

---

### Menu Labels (hlavní navigace)

```
🏠 Dashboard / Přehled
📋 Moje případy
📄 Dokumenty
💬 Zprávy
👤 Profil
❓ Nápověda
⚙️ Nastavení
```

---

### Breadcrumbs

```
Domů > Moje případy > #CB-542 > Dokumenty
```

---

## Form Placeholders

**Jméno:**
"Jan Novák"

**Email:**
"jan.novak@example.com"

**Telefon:**
"603 123 456"

**Popis události:**
"Popište co se stalo, kde a kdy..."

**Hledat:**
"Hledat případy, dokumenty..."

**Zpráva:**
"Napište svou zprávu..."

---

## Status Labels (stav případu)

**Nový:**
```
🆕 Nový
"Právě jsme váš případ přijali"
```

**V přípravě:**
```
📋 Příprava podkladů
"Shromažďujeme dokumenty"
```

**Odesláno pojišťovně:**
```
📤 Odesláno pojišťovně
"Čekáme na odpověď"
```

**Vyjednávání:**
```
💬 Vyjednávání
"Jednáme o vyšším plnění"
```

**Schváleno:**
```
✅ Schváleno
"Úspěch! Pojišťovna schválila plnění"
```

**Vyplaceno:**
```
💰 Vyplaceno
"Peníze jsou na cestě k vám"
```

**Dokončeno:**
```
✓ Dokončeno
"Případ uzavřen"
```

**Odmítnuto:**
```
❌ Odmítnuto
"Pojišťovna odmítla - připravujeme odvolání"
```

**Pozastaveno:**
```
⏸️ Pozastaveno
"Čekáme na informace od vás"
```

---

## Progress Indicators

**Onboarding progress:**
```
"Krok 3 z 6 - 50% hotovo"
```

**Case progress (timeline view):**
```
✅ Příjem případu (1. 11. 2024)
✅ Příprava podkladů (3. 11. 2024)
⏳ Odesláno pojišťovně (5. 11. 2024)
⌛ Vyjednávání (odhadovaně 10-15. 11.)
⌛ Finalizace (odhadovaně 18. 11.)
```

**Upload progress:**
```
Nahrávání... ████████░░ 80%
```

---

## Notification Copy (in-app)

**Nový případ přijat:**
```
"✅ Váš případ #{ID} byl přijat"
"Během 24 hodin vás kontaktujeme s cenovou nabídkou."
```

**Case manager přiřazen:**
```
"👤 {Jméno} je váš case manager"
"Ozveme se vám dnes. Zatím můžete prozkoumat dashboard."
```

**Nový dokument:**
```
"📄 Nový dokument v případu #{ID}"
"Pojišťovna poslala odpověď. [Zobrazit]"
```

**Platba potřebná:**
```
"💳 Čeká platba {částka} Kč"
"Pro pokračování potřebujeme uhradit aktivační poplatek. [Zaplatit]"
```

**Vyžadována akce:**
```
"⚠️ Potřebujeme od vás něco"
"Pojišťovna vyžaduje dodatečné dokumenty. [Zobrazit detaily]"
```

**Případ aktualizován:**
```
"🔄 Nový status: {Status}"
"Váš případ postoupil do další fáze. [Zobrazit]"
```

**Případ dokončen:**
```
"🎉 Případ #{ID} dokončen!"
"Pojišťovna schválila {částka} Kč. [Zobrazit detaily]"
```

---

## Email Subject Lines (transactional)

**Potvrzení registrace:**
"Vítejte v ClaimBuddy, {Jméno}! 👋"

**Případ přijat:**
"Váš případ #{ID} je u nás ✅"

**Týdenní update:**
"Update: Váš případ #{ID} - {Fáze}"

**Vyžadována akce:**
"⚠️ Akce potřeba: Případ #{ID}"

**Platba potřebná:**
"Čeká platba pro případ #{ID}"

**Případ dokončen:**
"🎉 Úspěch! Vyjednali jsme {částka} Kč"

**Žádost o review:**
"Jak se vám líbilo? ⭐"

---

## Search & Filters

**Search placeholder:**
"Hledat podle čísla případu, pojišťovny..."

**No results:**
```
"Žádné výsledky pro '{search query}'"

"Zkuste:
• Zkontrolovat překlepy
• Použít obecnější hledaný výraz
• Zkusit jiná klíčová slova"
```

**Filter labels:**
```
📅 Datum: Vše / Tento týden / Tento měsíc / Vlastní rozsah
📊 Status: Všechny / Aktivní / Dokončené / Archivované
🏢 Pojišťovna: Všechny / ČPP / Allianz / Kooperativa...
```

---

## Settings & Preferences

**Email notifications:**
```
✓ Update emails (doporučeno)
  Důležité změny v případu

✓ SMS notifikace (Premium+)
  Okamžitá notifikace o změnách

☐ Týdenní souhrn
  Přehled všech případů 1x týdně

☐ Marketing emails
  Tipy, články, speciální nabídky
```

**Privacy settings:**
```
🔒 Soukromí dat

✓ Povolit zpracování dat pro vyřízení případu (povinné)
☐ Sdílet anonymizovaná data pro statistiky
☐ Povolit uchování dat po uzavření účtu (pro budoucí případy)
```

---

## Accessibility Labels (screen readers)

**Tlačítka bez textu (jen ikony):**
```
[🔍] aria-label="Hledat"
[✕] aria-label="Zavřít"
[☰] aria-label="Menu"
[←] aria-label="Zpět"
[⚙️] aria-label="Nastavení"
```

**Status indicators:**
```
[●] aria-label="Případ aktivní"
[✓] aria-label="Případ dokončen"
[⚠] aria-label="Vyžadována akce"
```

---

## Legal & Compliance Copy

**Cookie consent banner:**
```
"Používáme cookies"

"Používáme cookies pro zlepšení vašeho zážitku, analýzu návštěvnosti a marketingové účely.

[Přijmout vše] [Nastavit] [Odmítnout]

[Přečíst více o cookies]"
```

**GDPR compliance:**
```
"🔒 Vaše data jsou v bezpečí"

"Zpracováváme vaše osobní údaje dle GDPR. Máte právo:
• Získat kopii svých dat
• Opravit nepřesná data
• Smazat svá data
• Odvolat souhlas

[Stáhnout moje data] [Smazat účet] [Přečíst více]"
```

**Terms acceptance:**
```
☐ "Souhlasím s obchodními podmínkami a zásadami ochrany osobních údajů"
```

---

## Tone Examples (Formal vs. Casual)

### ❌ Příliš formální (AVOID)

"Vážený kliente,

obdrželi jsme Vaši žádost o vyřízení pojistné události evidence č. CB-2024-00542. Příslušný pracovník se s Vámi obratem spojí za účelem projednání dalších náležitostí.

S pozdravem,
ClaimBuddy s.r.o."

### ❌ Příliš casual (AVOID)

"Yo! 🤙

Máme tvůj případ, je to v cajku! Teď makáme na tom, aby sis vyšetřil co nejvíc love od pojišťovny lol.

TTYL!"

### ✅ Správný tón (USE THIS)

"Ahoj {Jméno},

Máme váš případ #{ID}. Během 24 hodin vás kontaktujeme s cenovou nabídkou a dalšími kroky.

Mezitím můžete sledovat průběh v aplikaci.

Máte otázku? Odpovězte na tento email.

Tým ClaimBuddy"

---

## Voice & Grammar Guidelines

**Používat:**
- Aktivní slovesa ("Vyřídíme" ne "Bude vyřízeno")
- Druhá osoba ("Dostanete" ne "Klient dostane")
- Krátké věty (max 20 slov)
- Seznamy/odrážky pro scannability
- Pozitivní formulace ("Ano" vs "Ne")

**Vyhýbat se:**
- Pojišťovacímu žargonu bez vysvětlení
- Pasivním konstrukcím
- Dlouhým souvětím
- Právnickému jazyku
- Anglicismům (kde existuje české slovo)

**Čísla:**
- Psát s mezerami: "18 000 Kč" ne "18000Kč"
- Vždy uvádět měnu: "990 Kč" ne "990"
- Procenta s %: "23%" ne "23 procent"

---

This comprehensive UX copy guide ensures consistent, friendly, and helpful communication across all touchpoints in the ClaimBuddy app!
