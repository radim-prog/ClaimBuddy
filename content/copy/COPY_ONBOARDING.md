# Onboarding Flow Copy - ClaimBuddy

## Onboarding Strategy

**Cíle:**
1. Minimalizovat friction (co nejméně kroků)
2. Vysvětlit proces průběžně (ne vše najednou)
3. Budovat trust (transparentnost, security)
4. Motivovat k dokončení (progress indicators)

**Průměrná délka:** 3-5 minut
**Completion rate cíl:** >80%

---

## Onboarding Flow Structure

```
1. Welcome Screen
2. Typ pojistné události (výběr kategorie)
3. Základní informace (co se stalo)
4. Kontaktní údaje
5. Plná moc (právní souhlas)
6. Potvrzení & Next steps
```

---

## Krok 1: Welcome Screen

### Headline
**"Vyříďíme vaši pojistnou událost za vás"**

### Subheadline
**"Zbývá jen pár jednoduchých kroků. Celé to zabere max. 5 minut."**

### Body copy
```
Co budeme potřebovat:

✓ Základní popis události (co se stalo, kdy)
✓ Informace o pojistce (název pojišťovny, číslo smlouvy)
✓ Kontaktní údaje (email, telefon)
✓ Souhlas k zastupování (elektronický podpis)

Všechny informace jsou šifrované a bezpečné 🔒
```

### Progress indicator
**"Krok 1 z 6"**

### CTA Button
**"Začít"**

### Footer link
*"Potřebujete pomoc? Zavolejte nám: +420 XXX XXX XXX"*

---

## Krok 2: Typ pojistné události

### Headline
**"Jaký typ pojistné události řešíte?"**

### Subheadline (optional)
*"Pomůže nám to přiřadit správného specialistu"*

### Kategorie (velké klikací karty)

```
🚗 AUTONEHODA / HAVÁRIE
Poškození auta, nehoda, kolize

🏠 NEMOVITOST / BYT
Zatečení, požár, povodně, krádež

💊 ZDRAVOTNÍ ÚRAZ
Úraz, nemoc, invalidita

🚲 MAJETEK / ODCIZENÍ
Krádež kola, telefonu, batohu

🔧 ODPOVĚDNOST ZA ŠKODU
Způsobili jste někomu škodu

🌍 CESTOVNÍ POJIŠTĚNÍ
Storno, léčba v zahraničí, zpoždění

❓ NĚCO JINÉHO
Popište nám situaci
```

### Progress indicator
**"Krok 2 z 6"**

### CTA
Po kliknutí na kategorii → automatický přechod na další krok

### Footer
**"← Zpět"** | **"Uložit a pokračovat později"**

---

## Krok 3: Základní informace

*(Formulář se dynamicky mění podle vybrané kategorie)*

### Pro AUTONEHODA:

**Headline:**
"Řekněte nám, co se stalo"

**Form fields:**

```
📅 Kdy k tomu došlo?
[Datum picker]

📍 Kde k tomu došlo?
[Text input - město, ulice]

🚗 Jaké je vaše auto?
[Značka] [Model] [Rok]
*Pomůže nám odhadnout hodnotu*

💥 Co přesně se stalo?
[Text area - multiline]
Příklad: "Při odbočování do mě narazilo jiné auto. Mám poškozen levý bok a přední světlo."

📸 Máte fotky škody?
[Drag & drop upload nebo Browse]
*Volitelné teď, můžete dodat později*

🔍 Byla přivolána policie?
○ Ano - mám protokol
○ Ano - nemám protokol
○ Ne

💼 Vaše pojišťovna:
[Dropdown: ČPP, Allianz, Kooperativa, Generali, ČSOB, Uniqa, Direct, Jiná]

📄 Číslo pojistné smlouvy: (pokud ho máte)
[Text input]
*Volitelné - pomůžeme dohledat pokud ho nemáte*
```

### Progress indicator
**"Krok 3 z 6 - 50% hotovo"**

### CTA Button
**"Pokračovat"**

### Auto-save indicator
*"✓ Automaticky uloženo"* (každých 30 sec)

---

### Pro ZATEČENÍ BYTU:

**Headline:**
"Řekněte nám, co se stalo"

**Form fields:**

```
📅 Kdy k tomu došlo?
[Datum picker]

📍 Co zateklo?
○ Byt (vlastní)
○ Byt (pronájem)
○ Dům

💧 Odkud voda přišla?
○ Střecha
○ Soused shora
○ Prasklé potrubí
○ Pračka/myčka
○ Něco jiného

💥 Co je poškozeno?
[Checklist]
☐ Strop/omítka
☐ Podlaha
☐ Nábytek
☐ Elektronika
☐ Osobní věci
☐ Jiné

💬 Popište škodu vlastními slovy:
[Text area]

📸 Fotky škody:
[Upload]
*Čím více fotek, tím lépe*

💼 Vaše pojišťovna:
[Dropdown]

📄 Číslo smlouvy: (pokud máte)
[Text input]
```

**CTA:** "Pokračovat"

---

### Pro všechny ostatní kategorie:
Podobná struktura, adaptovaná na kontext.

---

## Krok 4: Kontaktní údaje

### Headline
**"Jak se vám ozveme?"**

### Subheadline
*"Během 24 hodin vás kontaktujeme s cenovou nabídkou a dalšími kroky"*

### Form fields

```
👤 Jméno a příjmení *
[Text input]

📧 Email *
[Email input]
*Sem pošleme potvrzení a přístup do aplikace*

📞 Telefon *
[Phone input with country code]
*Pro rychlou konzultaci*

🏢 Jsem:
○ Fyzická osoba
○ OSVČ (potřebuji fakturu na IČO)
○ Firma (s.r.o., a.s.)

[Pokud zvolí OSVČ/Firma]
📝 IČO:
[Text input]

🔔 Chci dostávat:
☑ SMS notifikace o změnách v případu (doporučeno)
☑ Týdenní email update
☐ Marketing & tipy (můžete odhlásit kdykoli)
```

### Progress indicator
**"Krok 4 z 6 - 70% hotovo"**

### CTA Button
**"Pokračovat"**

### Security badge
🔒 *"Vaše data jsou šifrovaná a chráněná dle GDPR"*

---

## Krok 5: Plná moc a souhlasy

### Headline
**"Posledním krokem je právní souhlas"**

### Subheadline
*"Aby jsme mohli komunikovat s pojišťovnou vaším jménem, potřebujeme plnou moc. Je to standardní postup."*

### Explainer box (expandable)

```
💡 Co je plná moc?

Plná moc nám umožňuje:
✓ Komunikovat s pojišťovnou za vás
✓ Získávat informace o vašem případu
✓ Vyjednávat podmínky

❌ Plná moc nám NEUMOŽŇUJE:
✗ Přístup k vašemu bankovnímu účtu
✗ Měnit vaši pojistnou smlouvu
✗ Cokoliv jiného mimo tento konkrétní případ

[Přečíst celou plnou moc] (link na PDF)
```

### Document Preview

```
┌─────────────────────────────────┐
│ PLNÁ MOC                         │
│                                  │
│ Já, {Jméno z kroku 4},          │
│ tímto zmocňuji společnost       │
│ ClaimBuddy s.r.o....            │
│                                  │
│ [Preview prvních 10 řádků]      │
│                                  │
│ [Číst celé ↓]                   │
└─────────────────────────────────┘
```

### Checkboxes (required)

```
☐ Souhlasím s plnou mocí *
   [Link: Přečíst celou plnou moc]

☐ Souhlasím se zpracováním osobních údajů dle GDPR *
   [Link: Zásady ochrany osobních údajů]

☐ Souhlasím s obchodními podmínkami ClaimBuddy *
   [Link: Obchodní podmínky]
```

### Elektronický podpis

```
✍️ Elektronický podpis

[Canvas pro podpis myší/prstem]
nebo
[Zadat jméno] (typ: "Jakub Novák")

[Vymazat] [Hotovo]
```

### Progress indicator
**"Krok 5 z 6 - 90% hotovo"**

### CTA Button
**"Potvrdit a pokračovat"**

### Reassurance text
*"Můžete zrušit kdykoliv. Plnou moc můžete odvolat emailem."*

---

## Krok 6: Potvrzení & Next steps

### Headline
**"✅ Hotovo! Váš případ je u nás."**

### Subheadline
**"Děkujeme za důvěru. Teď už to necháte na nás."**

### Confirmation box

```
┌─────────────────────────────────────────┐
│ 📋 SOUHRN VAŠEHO PŘÍPADU                │
│                                         │
│ Číslo případu: #CB-2024-00542         │
│ Typ: Autonehoda                        │
│ Datum události: 15. 10. 2024           │
│ Pojišťovna: ČPP                        │
│                                         │
│ ✉️ Potvrzení odesláno na:             │
│ {email@example.com}                    │
└─────────────────────────────────────────┘
```

### Co bude následovat (Timeline)

```
📅 BĚHEM 24 HODIN
→ Prověříme váš případ
→ Přidělíme case managera
→ Pošleme cenovou nabídku a časový odhad

📅 DEN 2-5
→ Shromáždíme všechny potřebné dokumenty
→ Připravíme podklady pro pojišťovnu

📅 DEN 6-14
→ Komunikujeme s pojišťovnou
→ Vyjednáváme maximální plnění

📅 DEN 15+
→ Finalizace a výplata pojistky
```

### CTA Buttons (primary)

```
[Přejít do aplikace] (primary button)
Sledujte průběh v reálném čase

[Přidat další dokumenty] (secondary button)
Nahrát další fotky nebo dokumenty
```

### Additional actions

```
📱 Stáhnout aplikaci
[App Store] [Google Play]

📧 Co se stane dál?
[Přečíst FAQ]

💬 Máte otázku?
[Kontaktovat podporu]
```

### Referral box

```
┌─────────────────────────────────────────┐
│ 🎁 DOPORUČTE PŘÍTELE                    │
│                                         │
│ Oba dostanete -10% slevu na další     │
│ případ. Váš referral link:             │
│                                         │
│ [claimbuddy.cz/r/XXXXX] [Kopírovat]   │
└─────────────────────────────────────────┘
```

### Social proof

```
⭐⭐⭐⭐⭐ 4.8/5 (500+ hodnocení)

"Vyřídili to za 10 dní. Vyjednali o 18 tisíc víc než pojišťovna nabídla. Super!"
- Martin K., Praha
```

---

## Micro-copy & UX Messages

### Loading states

**Při ukládání:**
"Ukládáme váš případ... ⏳"

**Po uložení:**
"✓ Uloženo!"

### Error messages

**Prázdné pole:**
"Toto pole je povinné"

**Neplatný email:**
"Zadejte prosím platný email (např. jan@example.com)"

**Neplatné datum:**
"Událost nemůže být v budoucnu"

**Upload failed:**
"Nepodařilo se nahrát soubor. Zkuste to znovu nebo vyberte menší soubor (max 10 MB)."

### Success messages

**Dokument nahrán:**
"✓ Soubor nahrán úspěšně!"

**Krok dokončen:**
"✓ Hotovo! Pokračujte dalším krokem."

**Email odeslán:**
"✓ Potvrzení odesláno na {email}"

### Empty states

**Žádné fotky:**
"Zatím žádné fotky. Nahrajte první."

**Žádné dokumenty:**
"Můžete dodat později. Ozveme se, pokud budeme něco potřebovat."

---

## Motivační messages (průběžně)

**Po kroku 2:**
"Skvělé! Zbývá už jen pár informací."

**Po kroku 3:**
"Jste v polovině! Pokračujte."

**Po kroku 4:**
"Skoro hotovo! Poslední kroky."

**Po kroku 5:**
"Máte to! Už jen poslední potvrzení."

---

## Exit Intent (pokud chtějí opustit onboarding)

### Popup

**Headline:**
"Chcete uložit rozpracovaný případ?"

**Body:**
"Váš postup je automaticky uložen. Můžete se kdykoli vrátit a pokračovat."

**CTA Options:**
[Pokračovat v registraci] (primary)
[Odejít a dokončit později] (secondary)

### Email follow-up (pokud opustí)

**Subject:** "Dokončete registraci - zbývá jen pár kroků"

**Body:**

```
Ahoj {Jméno},

Všimli jsme si, že jste nedokončili registraci vašeho případu.

✓ Máme uloženo: {co už vyplnili}
⏱️ Zbývá: cca {2 minuty}

Dokončit registraci trvá jen chvíli a během 24 hodin vám pošleme cenovou nabídku.

[Dokončit registraci]

Potřebujete pomoc? Odpovězte na tento email nebo zavolejte: +420 XXX XXX XXX

Tým ClaimBuddy
```

---

## Mobile-First Considerations

**Design:**
- Large tap targets (min 44x44px)
- Single column layout
- Sticky CTA button at bottom
- Swipe gestures (next/back)

**Form inputs:**
- Appropriate keyboard types (email = email keyboard, phone = number keyboard)
- Auto-fill support (name, email, phone)
- Camera integration (fotky přímo z kamery)

**Progress indicator:**
- Always visible (sticky header)
- Clear percentage completion

---

## A/B Testing Ideas

### Length vs. Detail
- **Test A:** Dlouhý onboarding (všechny detaily hned)
- **Test B:** Krátký onboarding (jen základy, zbytek později)
- **Hypothesis:** Kratší = vyšší completion rate

### Form fields
- **Test A:** Všechna pole na jedné stránce
- **Test B:** Multi-step (jedno pole per screen)
- **Hypothesis:** Multi-step = nižší overwhelm

### CTA text
- **Test A:** "Začít" (generic)
- **Test B:** "Vyřídit pojistku" (benefit-focused)
- **Test C:** "Pokračovat" (neutral)

### Social proof placement
- **Test A:** Social proof na začátku (welcome screen)
- **Test B:** Social proof na konci (confirmation)
- **Test C:** Social proof průběžně (každý krok)

---

## Conversion Optimization

**Current funnel metrics to track:**

```
Step 1 (Welcome) → 100% (baseline)
Step 2 (Typ události) → Target: 95%
Step 3 (Základní info) → Target: 85%
Step 4 (Kontakt) → Target: 75%
Step 5 (Plná moc) → Target: 70%
Step 6 (Confirmation) → Target: 65%

Overall completion rate target: >65%
```

**Dropout points:**
- Highest dropout typically at Step 3 (most effort required)
- Second highest at Step 5 (legal concerns)

**Optimization strategies:**
- Progressive disclosure (don't show all fields at once)
- Inline validation (real-time error checking)
- Smart defaults (pre-fill where possible)
- Clear value proposition at each step

---

## Post-Onboarding Experience

### Immediate (within 1 minute)

**Confirmation email:**
Subject: "✓ Váš případ #{ID} je přijat"

**SMS confirmation:**
"ClaimBuddy: Váš případ #CB-542 je přijat. Ozveme se do 24h. Sledujte průběh: [link]"

### Within 24 hours

**Case manager assignment:**
Email + SMS: "Váš case manager {Jméno} se vám ozve dnes."

**Phone call:**
Osobní kontakt od case managera (pokud Premium/Pro)

### Dashboard access

**First login experience:**
- Welcome tour (5 tooltips explaining features)
- Quick actions prominently displayed
- Recent activity empty state: "Začneme pracovat na vašem případu během 24 hodin"

---

## Accessibility

**Screen readers:**
- All form fields have proper labels
- Error messages announced
- Progress indicator readable

**Keyboard navigation:**
- All interactive elements focusable
- Clear focus indicators
- Skip to main content link

**Color contrast:**
- WCAG AA compliant (min 4.5:1)
- Not relying on color alone for information

**Font sizes:**
- Minimum 16px (prevents zoom on mobile)
- Scalable text (em/rem units)

---

This onboarding flow balances conversion rate optimization with gathering necessary information. The key is progressive disclosure - not overwhelming users with too much at once, while still collecting what's needed to start their case.
