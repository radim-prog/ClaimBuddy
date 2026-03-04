# Disclaimer a právní informace pro web

**Verze:** 1.0
**Účinnost od:** 1. ledna 2026

---

## O tomto dokumentu

Tento dokument obsahuje **krátké disclaimery a právní texty** pro různá místa na webu Pojistná Pomoc:
- Footer (patička)
- Modals (vyskakovací okna)
- Landing pages
- Formuláře
- Emails

**Použití:** Copy-paste do HTML/React komponent

---

## 1. Hlavní disclaimer (pro homepage)

### Varianta A: Krátká (2-3 věty)

```
Pojistná Pomoc poskytuje asistenční služby při řešení pojistných událostí.
NEJSME pojišťovací zprostředkovatel ani advokátní kancelář.
Konečné rozhodnutí o výši plnění vždy dělá pojišťovna, ne Pojistná Pomoc.
```

### Varianta B: Dlouhá (1 odstavec)

```
Pojistná Pomoc s.r.o. poskytuje asistenční služby při řešení pojistných
událostí – pomáháme s dokumentací, komunikací s pojišťovnami a reklamacemi.
NEJSME pojišťovací zprostředkovatel ve smyslu zákona o distribuci pojištění
(nemáme licenci ČNB) a NEJSME advokátní kancelář (neposkytujeme právní
zastoupení před soudem). Konečné rozhodnutí o uznání nebo zamítnutí pojistné
události a o výši plnění vždy činí pojišťovna na základě pojistných podmínek.
Pojistná Pomoc neručí za výsledek řízení.
```

### Varianta C: Bullets (pro vizuální prezentaci)

```markdown
**Co děláme:**
✅ Pomáháme s dokumentací pojistné události
✅ Komunikujeme s pojišťovnami za vás
✅ Reklamujeme zamítnuté nároky

**Co NEDĚLÁME:**
❌ Nejsme pojišťovací zprostředkovatel (nemáme licenci ČNB)
❌ Nejsme advokátní kancelář (nechodíme k soudu)
❌ Negarantujeme výsledek (rozhoduje pojišťovna)
```

---

## 2. Footer (patička webu)

### Kompletní footer text

```html
<footer>
  <div class="footer-content">
    <div class="footer-column">
      <h4>Pojistná Pomoc</h4>
      <p>
        Asistenční služby při řešení pojistných událostí.
        <br>Nejsme pojišťovací zprostředkovatel.
      </p>
    </div>

    <div class="footer-column">
      <h4>Právní dokumenty</h4>
      <ul>
        <li><a href="/obchodni-podminky">Obchodní podmínky</a></li>
        <li><a href="/ochrana-osobnich-udaju">Ochrana osobních údajů</a></li>
        <li><a href="/cookie-policy">Cookies</a></li>
        <li><a href="/reklamacni-rad">Reklamační řád</a></li>
      </ul>
    </div>

    <div class="footer-column">
      <h4>Kontakt</h4>
      <p>
        Email: info@pu.zajcon.cz<br>
        Telefon: [doplnit]<br>
        GDPR: gdpr@pu.zajcon.cz<br>
        Reklamace: reklamace@pu.zajcon.cz
      </p>
    </div>

    <div class="footer-column">
      <h4>Firma</h4>
      <p>
        Pojistná Pomoc s.r.o.<br>
        IČO: [doplnit]<br>
        Sídlo: [adresa]<br>
        <br>
        <small>
          Nejsme pojišťovací zprostředkovatel podle zákona
          č. 170/2018 Sb. Nejsme zapsáni v registru ČNB.
        </small>
      </p>
    </div>
  </div>

  <div class="footer-bottom">
    <p>
      © 2026 Pojistná Pomoc s.r.o. Všechna práva vyhrazena.
      | <a href="/disclaimer">Disclaimer</a>
      | <a href="/sitemap">Mapa webu</a>
    </p>
  </div>
</footer>
```

---

## 3. Modals a pop-ups

### 3.1 Při první registraci

```html
<div class="modal" id="registration-disclaimer">
  <h3>Důležité informace</h3>
  <p>
    Pojistná Pomoc <strong>NENÍ pojišťovací zprostředkovatel</strong>
    ani advokátní kancelář. Poskytujeme pouze asistenční služby.
  </p>
  <p>
    Konečné rozhodnutí o výši plnění dělá <strong>pojišťovna</strong>,
    ne Pojistná Pomoc. Negarantujeme výsledek.
  </p>
  <label>
    <input type="checkbox" required>
    Rozumím a souhlasím s <a href="/obchodni-podminky">Obchodními podmínkami</a>
  </label>
  <button onclick="closeModal()">Rozumím</button>
</div>
```

### 3.2 Před podáním případu

```html
<div class="modal" id="case-submission-warning">
  <h3>Než začneme...</h3>
  <ul>
    <li>✅ Zkontrolujte, že máte <strong>platné pojištění</strong> (smlouva není vypovězena)</li>
    <li>✅ Pojistná událost nastala <strong>v době trvání pojištění</strong></li>
    <li>✅ Připravte si <strong>veškeré dokumenty</strong> (lékařské zprávy, fotky, faktury)</li>
    <li>✅ Události popisujte <strong>pravdivě</strong> (podvodné nároky trestně stíháme)</li>
  </ul>
  <p>
    <strong>Důležité:</strong> Pojistná Pomoc nemůže ovlivnit rozhodnutí pojišťovny.
    Pomůžeme vám s dokumentací a komunikací, ale finální slovo má pojišťovna.
  </p>
  <button onclick="proceedToForm()">Rozumím, chci pokračovat</button>
</div>
```

### 3.3 Po zamítnutí pojišťovnou

```html
<div class="modal" id="claim-rejected">
  <h3>Pojišťovna zamítla váš nárok</h3>
  <p>
    Je nám líto, ale pojišťovna rozhodla o zamítnutí.
    Pojistná Pomoc bohužel nemůže změnit rozhodnutí pojišťovny.
  </p>
  <p><strong>Co můžeme udělat:</strong></p>
  <ul>
    <li>📄 Připravit reklamaci s odůvodněním</li>
    <li>📧 Komunikovat s ombudsmanem pojišťovny</li>
    <li>🏛️ Eskalovat k Finančnímu arbitrovi (pokud je to relevantní)</li>
    <li>⚖️ Doporučit advokáta (pokud je nutné soudní řízení)</li>
  </ul>
  <p>
    <strong>Upozornění:</strong> I přes reklamaci nemusí být pojišťovna
    změnit své rozhodnutí. Úspěšnost závisí na důvodech zamítnutí.
  </p>
  <button onclick="startComplaint()">Chci podat reklamaci</button>
  <button onclick="closeCase()">Ukončit případ</button>
</div>
```

---

## 4. Landing pages (prodejní stránky)

### 4.1 Hero sekce (nahoře stránky)

```html
<section class="hero">
  <h1>Vymůžeme vám peníze z pojišťovny</h1>
  <p class="subtitle">
    Profesionální asistence při pojistné události.
    Platíte jen když vybereme peníze.
  </p>
  <button class="cta">Začít zdarma</button>

  <p class="disclaimer">
    <small>
      Nejsme pojišťovací zprostředkovatel. Pomáháme s dokumentací
      a komunikací. Konečné rozhodnutí dělá pojišťovna.
    </small>
  </p>
</section>
```

### 4.2 Pricing sekce

```html
<section class="pricing">
  <h2>Cenové modely</h2>

  <div class="pricing-card">
    <h3>Success Fee</h3>
    <p class="price">15-20%</p>
    <p class="description">z vyplaceného plnění</p>
    <ul>
      <li>✅ Platíte JEN když vybereme peníze</li>
      <li>✅ Žádné riziko</li>
      <li>✅ Vhodné pro složité případy</li>
    </ul>
    <button>Vybrat</button>
  </div>

  <div class="pricing-card">
    <h3>Fixed Fee</h3>
    <p class="price">490-1990 Kč</p>
    <p class="description">jednorázová platba</p>
    <ul>
      <li>✅ Pevná cena předem</li>
      <li>✅ Vhodné pro jednoduché případy</li>
      <li>⚠️ Nevratná (i když pojišťovna zamítne)</li>
    </ul>
    <button>Vybrat</button>
  </div>

  <p class="fine-print">
    <small>
      * Výše plnění určuje pojišťovna na základě pojistných podmínek.
      Pojistná Pomoc negarantuje úspěch ani konkrétní výši plnění.
    </small>
  </p>
</section>
```

### 4.3 Testimonials (reference)

```html
<section class="testimonials">
  <h2>Co říkají klienti</h2>

  <div class="testimonial">
    <blockquote>
      "Díky Pojistná Pomoc jsem dostal 45 000 Kč z úrazového pojištění,
      které jsem ani nevěděl, že mám. Success fee 18% byla stojí za to."
    </blockquote>
    <p class="author">— Jan N., Praha</p>
  </div>

  <p class="disclaimer">
    <small>
      Reference jsou od skutečných klientů. Výsledky se mohou lišit
      dle typu pojištění a okolností pojistné události. Každý případ
      je individuální.
    </small>
  </p>
</section>
```

---

## 5. Formuláře

### 5.1 Lead form (kontaktní formulář)

```html
<form id="lead-form">
  <h3>Nezávazná konzultace zdarma</h3>

  <input type="text" name="name" placeholder="Jméno a příjmení" required>
  <input type="email" name="email" placeholder="Email" required>
  <input type="tel" name="phone" placeholder="Telefon" required>

  <select name="insurance_type" required>
    <option value="">Typ pojištění</option>
    <option value="accident">Úrazové</option>
    <option value="travel">Cestovní</option>
    <option value="property">Majetkové</option>
    <option value="liability">Odpovědnosti</option>
    <option value="life">Životní</option>
  </select>

  <textarea name="description" placeholder="Stručný popis události" rows="4"></textarea>

  <label class="checkbox">
    <input type="checkbox" name="gdpr" required>
    Souhlasím se zpracováním osobních údajů dle
    <a href="/ochrana-osobnich-udaju" target="_blank">Zásad ochrany osobních údajů</a>
  </label>

  <label class="checkbox">
    <input type="checkbox" name="terms" required>
    Seznámil/a jsem se s
    <a href="/obchodni-podminky" target="_blank">Obchodními podmínkami</a>
  </label>

  <button type="submit">Odeslat nezávazně</button>

  <p class="fine-print">
    <small>
      Odesláním formuláře nevzniká smlouva. Kontaktujeme vás
      do 24 hodin s vyhodnocením vašeho případu. Nejsme pojišťovací
      zprostředkovatel ani advokátní kancelář.
    </small>
  </p>
</form>
```

### 5.2 Health data consent (před nahráním lékařských zpráv)

```html
<div class="gdpr-health-consent">
  <h3>⚠️ Budete nahrávat zdravotní údaje</h3>
  <p>
    Lékařské zprávy obsahují <strong>citlivé osobní údaje</strong>
    (diagnózy, zdravotní stav), které vyžadují Váš <strong>výslovný souhlas</strong>
    dle čl. 9 GDPR.
  </p>

  <div class="consent-box">
    <h4>Co se bude dít s vašimi daty:</h4>
    <ul>
      <li>✅ Budou předána pojišťovně (pro vyřízení nároku)</li>
      <li>✅ Uložena šifrovaně na našich serverech (EU)</li>
      <li>✅ Přístup pouze oprávněným zaměstnancům</li>
      <li>✅ Smazána 3 roky po ukončení případu</li>
    </ul>

    <h4>Vaše práva:</h4>
    <ul>
      <li>📧 Kdykoli odvolat souhlas (email: gdpr@pu.zajcon.cz)</li>
      <li>📄 Získat kopii všech údajů</li>
      <li>🗑️ Požádat o výmaz (po ukončení případu)</li>
    </ul>
  </div>

  <label class="checkbox">
    <input type="checkbox" name="health_consent" required>
    <strong>Souhlasím</strong> se zpracováním mých zdravotních údajů
    pro účely vyřízení pojistné události. Plné znění souhlasu:
    <a href="/gdpr-souhlas" target="_blank">zde</a>
  </label>

  <button onclick="uploadHealthData()">Pokračovat k nahrání</button>
  <button onclick="skipHealthData()">Přeskočit (nahraji později)</button>
</div>
```

---

## 6. Emaily

### 6.1 Welcome email (po registraci)

```
Předmět: Vítejte v Pojistná Pomoc 👋

Ahoj [Jméno],

děkujeme za registraci! Jsme rádi, že vám můžeme pomoci s pojistnou událostí.

**Co se teď bude dít:**
1. Vyplníte detaily o pojistné události (cca 5 minut)
2. Nahrajete dokumenty (fotky, lékařské zprávy, faktury)
3. My zkontrolujeme kompletnost a podáme hlášení pojišťovně
4. Budeme vás průběžně informovat o stavu vyřizování

**Důležité:**
- Nejsme pojišťovací zprostředkovatel ani advokátní kancelář
- Pomáháme s dokumentací a komunikací, ale konečné rozhodnutí dělá pojišťovna
- Platíte jen když pojišťovna vyplatí plnění (success fee model)

Máte dotazy? Odpovězte na tento email nebo zavolejte: [telefon]

S pozdravem,
Tým Pojistná Pomoc

---
Pojistná Pomoc s.r.o. | IČO: [doplnit] | info@pu.zajcon.cz
Odhlásit marketing: [odkaz]
```

### 6.2 Case rejected by insurer (pojišťovna zamítla)

```
Předmět: Pojišťovna zamítla nárok – co dál? ❌

Ahoj [Jméno],

bohužel máme špatnou zprávu. Pojišťovna [název] zamítla váš nárok
z důvodu: "[důvod zamítnutí]".

**Co to znamená:**
- Pojišťovna nevyplatí žádné plnění (0 Kč)
- My NEPLATÍTE success fee (platíte jen při úspěchu)

**Co můžeme udělat:**
1. **Podat reklamaci** – Připravíme odůvodnění a zkusíme přesvědčit pojišťovnu
2. **Kontaktovat ombudsmana** – Nezávislé přezkoumání
3. **Eskalovat k Finančnímu arbitrovi** – Pokud je to relevantní
4. **Doporučit advokáta** – Pokud je nutné soudní řízení

**UPOZORNĚNÍ:**
I přes reklamaci nemusí pojišťovna změnit rozhodnutí. Úspěšnost
závisí na důvodech zamítnutí a pojistných podmínkách.

Chcete podat reklamaci? Odpovězte na tento email nebo klikněte: [odkaz]

S pozdravem,
Tým Pojistná Pomoc

---
P.S. Rozhodnutí pojišťovny není naše vina. Pojistná Pomoc nemůže
ovlivnit finální rozhodnutí pojišťovny. Pomáháme s dokumentací
a komunikací.
```

### 6.3 Success - payment received (úspěch, pojišťovna vyplatila)

```
Předmět: 🎉 Pojišťovna vyplatila 45 000 Kč!

Ahoj [Jméno],

máme skvělou zprávu! Pojišťovna [název] vyplatila plnění: **45 000 Kč** 🎉

**Co se teď stane:**
1. Peníze by měly být na vašem účtu do **5-10 pracovních dnů**
2. Po připsání nám prosím zaplaťte success fee: **8 100 Kč** (18%)
3. Faktura již byla vystavena (příloha tohoto emailu)

**Platební údaje:**
Číslo účtu: [účet]
Variabilní symbol: [VS]
Splatnost: Do 14 dnů od připsání plnění

**Děkujeme za důvěru!**
Jsme rádi, že jsme vám mohli pomoci. Pokud budete mít v budoucnu
další pojistnou událost, budeme tu pro vás.

Hodnocení našich služeb: [odkaz na Google Reviews]

S pozdravem,
Tým Pojistná Pomoc

---
Pojistná Pomoc s.r.o. | IČO: [doplnit] | info@pu.zajcon.cz
```

---

## 7. Právní stránky (standalone pages)

### 7.1 /disclaimer (kompletní disclaimer page)

```markdown
# Disclaimer

## 1. Povaha služeb

Pojistná Pomoc s.r.o. poskytuje **asistenční služby** při řešení pojistných
událostí. Pomáháme s přípravou dokumentace, komunikací s pojišťovnami
a reklamacemi.

**NEJSME:**
- ❌ Pojišťovací zprostředkovatel (dle zákona č. 170/2018 Sb.)
- ❌ Advokátní kancelář (dle zákona č. 85/1996 Sb.)
- ❌ Pojišťovna (nerozhodujeme o výši plnění)

## 2. Omezení odpovědnosti

Pojistná Pomoc **NERUČÍ** za:
- Rozhodnutí pojišťovny (uznání/zamítnutí)
- Výši vyplaceného plnění
- Délku vyřizování ze strany pojišťovny
- Změnu pojistných podmínek během vyřizování

**Pojišťovna má finální slovo.**

## 3. Žádné garance

Pojistná Pomoc **NEGARANTUJE:**
- Úspěch (pojišťovna může zamítnout)
- Konkrétní výši plnění
- Splnění termínů (závisí na pojišťovně)

**Success fee platíte jen při úspěchu** – není-li úspěch, neplatíte.

## 4. Informace na webu

Informace na tomto webu jsou:
- Obecné povahy (ne personalizovaná právní porada)
- Aktuální k datu publikace (mohou se změnit)
- Pouze orientační (nejsme odborníci na všechny typy pojištění)

**Pro konkrétní poradenství kontaktujte advokáta nebo pojišťovacího makléře.**

## 5. Odkazy na třetí strany

Web obsahuje odkazy na weby pojišťoven a dalších třetích stran.

Pojistná Pomoc **NEODPOVÍDÁ** za obsah těchto webů.

## 6. Technické informace

**Dostupnost webu:**
- Web může být dočasně nedostupný (údržba, výpadky)
- Pojistná Pomoc neručí za škody způsobené nedostupností

**Bezpečnost:**
- Používáme šifrování (TLS 1.3)
- Nicméně žádný systém není 100% bezpečný
- Doporučujeme silná hesla a 2FA

## 7. Kontakt

Máte dotazy?
Email: info@pu.zajcon.cz
Telefon: [doplnit]

---

*Poslední aktualizace: 1. ledna 2026*
```

---

## 8. Notifikace v aplikaci

### 8.1 Toast notification (při odeslání formuláře)

```
✅ Formulář odeslán!
Kontaktujeme vás do 24 hodin s vyhodnocením případu.

Nejsme pojišťovací zprostředkovatel – pomáháme s dokumentací a komunikací.
```

### 8.2 Banner (při prvním přihlášení)

```
👋 Vítejte v Pojistná Pomoc!

DŮLEŽITÉ: Nejsme pojišťovací zprostředkovatel ani advokátní kancelář.
Pomáháme s dokumentací a komunikací s pojišťovnami. Konečné rozhodnutí
o výši plnění dělá pojišťovna.

[Rozumím] [Více info]
```

---

## 9. FAQ sekce (často kladené otázky)

### Disclaimer v FAQ

```markdown
## FAQ

### Jste pojišťovací zprostředkovatel?
**NE.** Nejsme pojišťovací zprostředkovatel ve smyslu zákona č. 170/2018 Sb.
Neprodáváme pojištění a nemáme licenci ČNB. Poskytujeme pouze asistenční
služby při řešení již vzniklých pojistných událostí.

### Jste advokátní kancelář?
**NE.** Nejsme advokátní kancelář a neposkytujeme právní zastoupení před soudem.
Pokud váš případ vyžaduje soudní řízení, doporučíme vám kvalitního advokáta.

### Garantujete výsledek?
**NE.** Nemůžeme garantovat, že pojišťovna nárok uzná nebo kolik vyplatí.
Konečné rozhodnutí dělá pojišťovna na základě pojistných podmínek.
My pomáháme s dokumentací a komunikací, abychom maximalizovali šanci na úspěch.

### Co když pojišťovna zamítne?
Pokud pojišťovna zamítne nárok, můžeme:
1. Připravit reklamaci s odůvodněním
2. Kontaktovat ombudsmana pojišťovny
3. Eskalovat k Finančnímu arbitrovi

Pokud používáte success fee model, **neplatíte nic** (platíte jen když pojišťovna vyplatí).

### Můžete ovlivnit rozhodnutí pojišťovny?
**Omezeně.** Můžeme:
- ✅ Připravit kompletní a přesvědčivou dokumentaci
- ✅ Vyjednávat o výši plnění
- ✅ Reklamovat nesprávná rozhodnutí

Ale **nemůžeme**:
- ❌ Změnit pojistné podmínky
- ❌ Donutit pojišťovnu vyplatit
- ❌ Ovlivnit interní směrnice pojišťovny

Finální slovo má vždy pojišťovna.
```

---

## 10. Social media (pro sdílení)

### Facebook/LinkedIn post disclaimer

```
🔹 DISCLAIMER:
Pojistná Pomoc není pojišťovací zprostředkovatel ani advokátní kancelář.
Poskytujeme pouze asistenční služby. Konečné rozhodnutí dělá pojišťovna.

#pojištění #pojistnáudalost #pojistnaPomoc
```

---

## Poznámky pro implementaci

### CSS pro disclaimer texty

```css
.disclaimer {
  font-size: 0.875rem;
  color: #666;
  margin-top: 1rem;
  padding: 1rem;
  background: #f9f9f9;
  border-left: 3px solid #ffcc00;
}

.fine-print {
  font-size: 0.75rem;
  color: #999;
  line-height: 1.4;
}

.disclaimer strong {
  color: #d32f2f; /* červená pro důležité */
}
```

### React komponenta

```jsx
export const Disclaimer = ({ variant = 'short' }) => {
  const disclaimers = {
    short: "Nejsme pojišťovací zprostředkovatel. Konečné rozhodnutí dělá pojišťovna.",
    medium: "Pojistná Pomoc poskytuje asistenční služby při řešení pojistných událostí. Nejsme pojišťovací zprostředkovatel ani advokátní kancelář. Konečné rozhodnutí o výši plnění dělá pojišťovna.",
    long: "Pojistná Pomoc s.r.o. poskytuje asistenční služby při řešení pojistných událostí – pomáháme s dokumentací, komunikací s pojišťovnami a reklamacemi. NEJSME pojišťovací zprostředkovatel ve smyslu zákona o distribuci pojištění (nemáme licenci ČNB) a NEJSME advokátní kancelář (neposkytujeme právní zastoupení před soudem). Konečné rozhodnutí o uznání nebo zamítnutí pojistné události a o výši plnění vždy činí pojišťovna na základě pojistných podmínek. Pojistná Pomoc neručí za výsledek řízení."
  };

  return (
    <div className="disclaimer">
      <small>{disclaimers[variant]}</small>
    </div>
  );
};
```

---

**Použití:**
Copy-paste tyto texty do příslušných sekcí webu a emailů.

**Pravidlo:** VŽDY když mluvíte o "vymůžeme peníze" nebo "dostanete plnění",
přidejte disclaimer že konečné rozhodnutí dělá pojišťovna.

---

*Verze 1.0 | Pojistná Pomoc s.r.o. | IČO: [doplnit]*
