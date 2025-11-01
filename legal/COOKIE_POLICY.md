# Zásady používání cookies

**Účinnost od:** 1. ledna 2026
**Verze:** 1.0

---

## 1. Co jsou cookies

### 1.1 Definice
**Cookies** jsou malé textové soubory, které webová stránka uloží do Vášho prohlížeče nebo zařízení.

**Účel:**
- Zapamatovat si Vaše preference (jazyk, přihlášení)
- Analyzovat návštěvnost webu
- Personalizovat reklamy
- Zajistit bezpečnost

**Velikost:** Obvykle pár KB (nejsou škodlivé)

### 1.2 Jak fungují
1. Navštívíte web ClaimBuddy
2. Server pošle cookie do Vašeho prohlížeče
3. Prohlížeč cookie uloží
4. Při další návštěvě prohlížeč cookie odešle zpět serveru
5. Server Vás "pozná" (například Vás automaticky přihlásí)

### 1.3 Kdo cookies používá
- **ClaimBuddy** (first-party cookies)
- **Třetí strany** (Google Analytics, Facebook Pixel) - third-party cookies

---

## 2. Jaké cookies používáme

### 2.1 Nezbytné cookies (Always Active)

**Účel:** Zajištění základní funkčnosti webu

**Nemůžete odmítnout** - bez nich web nefunguje.

**Příklady:**

| Název | Účel | Platnost |
|-------|------|----------|
| `session_id` | Přihlášení do účtu | Do odhlášení |
| `csrf_token` | Ochrana před útoky | 1 hodina |
| `cookie_consent` | Zapamatování Vašeho souhlasu s cookies | 1 rok |
| `language` | Váš preferovaný jazyk (CS/EN) | 1 rok |
| `cart_id` | Identifikace košíku | 7 dnů |

**Právní základ:** Čl. 6 odst. 1 písm. f) GDPR (oprávněný zájem na funkčnosti služby)

**Dodavatel:** ClaimBuddy s.r.o. (first-party)

---

### 2.2 Analytické cookies

**Účel:** Měření návštěvnosti a chování uživatelů

**MŮŽETE ODMÍTNOUT** - web funguje i bez nich.

**Co měříme:**
- Počet návštěvníků
- Nejnavštěvovanější stránky
- Průměrná doba na webu
- Míra opuštění (bounce rate)
- Zdroj návštěvy (Google, Facebook, přímý vstup)

**Používáme:**

#### A) Google Analytics 4

**Poskytovatel:** Google LLC (USA)
**Privacy Policy:** policies.google.com/privacy

**Cookies:**

| Název | Účel | Platnost |
|-------|------|----------|
| `_ga` | Rozlišení uživatelů | 2 roky |
| `_ga_XXXXXXXXXX` | Stav relace | 2 roky |
| `_gid` | Rozlišení uživatelů | 24 hodin |
| `_gat` | Omezení rychlosti dotazů | 1 minuta |

**Anonymizace IP:** ANO (poslední oktety IP jsou anonymizovány)

**Předání do USA:** ANO (na základě Adequacy Decision EU-USA)

**Jak vypnout:**
- V našem cookie banneru (tlačítko "Odmítnout analytické")
- Pomocí Google Analytics Opt-out: tools.google.com/dlpage/gaoptout

#### B) Hotjar (heatmapy a nahrávky relací)

**Poskytovatel:** Hotjar Ltd. (Malta, EU)
**Privacy Policy:** hotjar.com/legal/policies/privacy

**Účel:**
- Heatmapy (kde klikají uživatelé)
- Nahrávky relací (jak se pohybují po webu)
- Formulářové analýzy (kde uživatelé "uvíznou")

**Cookies:**

| Název | Účel | Platnost |
|-------|------|----------|
| `_hjSessionUser_*` | Identifikace uživatele | 1 rok |
| `_hjSession_*` | Identifikace relace | 30 minut |
| `_hjIncludedInPageviewSample` | Zda je relace nahrávána | 30 minut |

**Anonymizace:** ANO (citlivé informace jako hesla, email, čísla karet jsou automaticky maskovány)

**Jak vypnout:**
- V našem cookie banneru
- Do Not Track v prohlížeči (Hotjar to respektuje)

**DŮLEŽITÉ:** Pokud zadáváte zdravotní údaje v aplikaci, Hotjar je VYPNUT na těchto stránkách (GDPR compliance).

---

### 2.3 Marketingové cookies

**Účel:** Personalizované reklamy a remarketing

**MŮŽETE ODMÍTNOUT** - web funguje i bez nich.

**Co dělají:**
- Sledují Vaše návštěvy na našem webu
- Zobrazují Vám relevantní reklamy na Facebooku, Google
- Měří efektivitu reklamních kampaní

**Používáme:**

#### A) Facebook Pixel

**Poskytovatel:** Meta Platforms Inc. (USA)
**Privacy Policy:** facebook.com/privacy

**Cookies:**

| Název | Účel | Platnost |
|-------|------|----------|
| `_fbp` | Sledování návštěv z Facebook reklam | 3 měsíce |
| `fr` | Personalizace reklam | 3 měsíce |

**Účel:**
- Zobrazení reklam lidem, kteří navštívili náš web (remarketing)
- Měření konverzí (kolik lidí se registrovalo po kliknutí na reklamu)
- Lookalike audiences (cílení na podobné uživatele)

**Předání do USA:** ANO (na základě Adequacy Decision)

**Jak vypnout:**
- V našem cookie banneru
- V nastavení Facebooku: facebook.com/settings?tab=ads

#### B) Google Ads (AdWords)

**Poskytovatel:** Google LLC (USA)
**Privacy Policy:** policies.google.com/privacy

**Cookies:**

| Název | Účel | Platnost |
|-------|------|----------|
| `_gcl_au` | Měření konverzí | 3 měsíce |
| `IDE` | Personalizace reklam | 1 rok |
| `test_cookie` | Test zda prohlížeč podporuje cookies | 15 minut |

**Účel:**
- Remarketing (zobrazení reklam v Google Search, YouTube, Gmail)
- Měření ROI kampaní

**Předání do USA:** ANO

**Jak vypnout:**
- V našem cookie banneru
- V nastavení Google: adssettings.google.com

#### C) LinkedIn Insight Tag

**Poskytovatel:** LinkedIn Corporation (USA)
**Privacy Policy:** linkedin.com/legal/privacy-policy

**Cookies:**

| Název | Účel | Platnost |
|-------|------|----------|
| `li_sugr` | Sledování konverzí | 3 měsíce |
| `UserMatchHistory` | Synchronizace ID | 30 dnů |

**Účel:**
- Cílení B2B reklam (pokud oslovujeme podnikatele)
- Měření konverzí z LinkedIn kampaní

**Předání do USA:** ANO

**Jak vypnout:**
- V našem cookie banneru
- V nastavení LinkedIn: linkedin.com/psettings/guest-controls

---

### 2.4 Další technologie

#### A) Local Storage a Session Storage

**Co je to:**
- Podobné cookies, ale větší kapacita (až 10 MB)
- Neuposílá se automaticky na server (bezpečnější)

**Používáme pro:**
- Dočasné uložení formulářových dat (aby se neztratila při refreshi)
- Cache pro rychlejší načítání aplikace
- Offline režim

**Platnost:**
- **Session Storage:** Do zavření prohlížeče
- **Local Storage:** Trvale (dokud ručně neodstraníte)

**Jak odstranit:**
- Vymazání dat prohlížeče (History → Clear browsing data)

#### B) Web Beacons (Tracking Pixels)

**Co je to:**
- 1x1 pixel obrázek vložený do emailu nebo webu
- Při zobrazení odešle info na server (že jste email otevřeli)

**Používáme pro:**
- Měření otevření marketingových emailů
- Sledování konverzí (např. "Klient otevřel email → navštívil web → zaregistroval se")

**Jak vypnout:**
- Blokování obrázků v emailovém klientovi
- Použití ad-blockeru (uBlock Origin, AdBlock Plus)

---

## 3. Jak spravovat cookies

### 3.1 Náš Cookie Banner

**Při první návštěvě** webu se zobrazí banner:

**Tlačítka:**
- **Přijmout vše** - Souhlasíte se všemi cookies (nezbytné + analytické + marketingové)
- **Odmítnout vše** - Pouze nezbytné cookies
- **Nastavení** - Vyberte si jednotlivě (doporučeno)

**Vaše volba je uložena** po dobu 1 roku. Pak se banner zobrazí znovu.

### 3.2 Změna nastavení

**Kdykoliv můžete změnit:**
- Klikněte na ikonu cookies v patičce webu
- Nebo navštivte: www.claimbuddy.cz/nastaveni-cookies
- Upravte preference
- Uložte

**Účinkuje okamžitě.**

### 3.3 Nastavení v prohlížeči

**Všechny prohlížeče umožňují:**
- Blokovat všechny cookies
- Blokovat third-party cookies (od třetích stran)
- Vymazat stávající cookies

**Návody:**

#### Google Chrome
1. Nastavení (⋮) → Nastavení
2. Soukromí a zabezpečení → Soubory cookie a další údaje webu
3. Vyberte: "Blokovat soubory cookie třetích stran"

#### Mozilla Firefox
1. Menu (☰) → Nastavení
2. Soukromí a zabezpečení
3. Vylepšená ochrana proti sledování → Přísná

#### Safari
1. Safari → Předvolby
2. Soukromí
3. Zaškrtněte "Blokovat všechny cookies" (POZOR: může zlomit některé weby)

#### Microsoft Edge
1. Nastavení (…) → Nastavení
2. Soukromí, vyhledávání a služby
3. Prevence sledování → Striktní

### 3.4 Doplňky do prohlížeče

**Pro lepší kontrolu:**
- **uBlock Origin** - Blokuje reklamy a trackery
- **Privacy Badger** - Blokuje neviditelné trackery
- **Ghostery** - Zobrazuje kdo Vás sleduje
- **Cookie AutoDelete** - Automaticky maže cookies po zavření záložky

**Stažení:** Z obchodu Vašeho prohlížeče (Chrome Web Store, Firefox Add-ons)

---

## 4. Vaše práva (GDPR)

### 4.1 Právo odvolat souhlas

**Kdykoliv můžete:**
- Odvolat souhlas s analytickými nebo marketingovými cookies
- Změnit nastavení na: www.claimbuddy.cz/nastaveni-cookies
- Nebo vymazat cookies v prohlížeči

**Účinkuje okamžitě** (pro budoucnost, minulá data zůstávají).

### 4.2 Právo na přístup

**Co víme o Vás z cookies:**
- Čas návštěvy
- Navštívené stránky
- Zdroj návštěvy (odkud jste přišli)
- Typ zařízení a prohlížeče

**Jak získat:**
- Email na: gdpr@claimbuddy.cz
- Pošleme export do 30 dnů

### 4.3 Právo na výmaz

**Po odvolání souhlasu:**
- Data z cookies budou anonymizována nebo smazána
- Může trvat až 90 dnů (dle retention policy poskytovatelů)

**Jak požádat:**
- Email na: gdpr@claimbuddy.cz

### 4.4 Právo na námitku

**Pokud nesouhlasíte s analytickými cookies:**
- Klikněte "Odmítnout vše" v cookie banneru
- Nebudeme sledovat Vaše chování na webu

### 4.5 Stížnost u ÚOOÚ

**Pokud si myslíte, že porušujeme GDPR:**

**Úřad pro ochranu osobních údajů**
Web: uoou.cz
Email: posta@uoou.cz
Telefon: +420 234 665 111

---

## 5. Předání dat do třetích zemí

### 5.1 USA (Google, Facebook, LinkedIn)

**Jak zajišťujeme bezpečnost:**
- **Adequacy Decision** (EU-USA Data Privacy Framework) - EU uznává, že USA má přiměřenou ochranu
- **Standard Contractual Clauses** (SCC) - Smluvní doložky schválené EU
- **Encryption** - Data přenášena šifrovaně (TLS 1.3)

**Více info:**
- Google: policies.google.com/privacy/frameworks
- Facebook: facebook.com/about/privacy

### 5.2 EU (Hotjar, další služby)

**Servery v EU:**
- Data zůstávají v Evropě
- GDPR compliance garantována

---

## 6. Cookies a mobilní aplikace

### 6.1 ClaimBuddy iOS/Android aplikace

**Nepoužíváme cookies v aplikaci** (aplikace nepotřebují browser cookies).

**Místo toho:**
- **Device ID:** Unikátní identifikátor zařízení
- **Push Notification Token:** Pro zasílání notifikací
- **Local Storage:** Pro offline režim

**Účel:**
- Přihlášení
- Synchronizace dat
- Push notifikace

**Právní základ:** Čl. 6 odst. 1 písm. b) GDPR (plnění smlouvy)

### 6.2 Analytika v aplikaci

**Používáme:**
- **Firebase Analytics** (Google)
- **Sentry** (monitoring chyb)

**Co sledujeme:**
- Které obrazovky navštěvujete
- Kde dochází k chybám
- Čas strávený v aplikaci

**Anonymizace:** ANO (žádné osobní údaje, jen agregovaná data)

**Jak vypnout:**
- V nastavení aplikace: Nastavení → Soukromí → Analytika → Vypnout

---

## 7. Změny těchto zásad

### 7.1 Aktualizace

Tyto zásady můžeme změnit pokud:
- Přidáme nový typ cookies
- Změníme poskytovatele služby
- Upravíme účel zpracování

### 7.2 Informování

**O změnách Vás informujeme:**
- Notifikace na webu (po přihlášení)
- Email (pro registrované uživatele)
- Nový cookie banner (pokud je nutný souhlas)

**Předem:** Min. 30 dnů před účinností změny (pokud je to zásadní změna)

---

## 8. Kontakt

### 8.1 Dotazy k cookies
**Email:** gdpr@claimbuddy.cz
**Telefon:** [Kontaktní telefon bude doplněn před launch]

### 8.2 GDPR žádosti
**Email:** gdpr@claimbuddy.cz

**Můžete požádat o:**
- Přístup k datům z cookies
- Výmaz dat
- Kopii nastavení souhlasů

---

## 9. Užitečné odkazy

### 9.1 Oficiální info o cookies
- **O cookies obecně:** allaboutcookies.org
- **GDPR:** gdpr.eu
- **ÚOOÚ (CZ):** uoou.cz

### 9.2 Jak spravovat cookies
- **Google Analytics Opt-out:** tools.google.com/dlpage/gaoptout
- **Google Ads nastavení:** adssettings.google.com
- **Facebook Ads nastavení:** facebook.com/settings?tab=ads
- **Your Online Choices (EU):** youronlinechoices.eu

### 9.3 Privacy-friendly alternativy
**Prohlížeče:**
- **Brave:** brave.com (vestavěný ad-blocker)
- **Firefox Focus:** (mobilní, automaticky maže data)

**Vyhledávače:**
- **DuckDuckGo:** duckduckgo.com (nesleduje vás)
- **Startpage:** startpage.com (anonymní Google Search)

---

## 10. Přílohy

### 10.1 Seznam všech cookies (kompletní)

**Nezbytné:**
```
session_id | Přihlášení | Session | ClaimBuddy
csrf_token | Bezpečnost | 1 hodina | ClaimBuddy
cookie_consent | Souhlas s cookies | 1 rok | ClaimBuddy
language | Jazyk | 1 rok | ClaimBuddy
cart_id | Košík | 7 dnů | ClaimBuddy
```

**Analytické:**
```
_ga | Google Analytics | 2 roky | Google
_gid | Google Analytics | 24 hodin | Google
_gat | Google Analytics | 1 minuta | Google
_hjSessionUser_* | Hotjar | 1 rok | Hotjar
_hjSession_* | Hotjar | 30 minut | Hotjar
```

**Marketingové:**
```
_fbp | Facebook Pixel | 3 měsíce | Meta
fr | Facebook | 3 měsíce | Meta
_gcl_au | Google Ads | 3 měsíce | Google
IDE | Google DoubleClick | 1 rok | Google
li_sugr | LinkedIn | 3 měsíce | LinkedIn
```

### 10.2 Vzorový Cookie Banner (pro implementaci)

```html
<div id="cookie-banner" class="cookie-banner">
  <div class="cookie-content">
    <h3>Používáme cookies 🍪</h3>
    <p>
      Tento web používá cookies pro zajištění funkcí,
      analýzu návštěvnosti a personalizaci reklam.
      <a href="/cookie-policy">Více informací</a>
    </p>
    <div class="cookie-buttons">
      <button onclick="acceptAll()">Přijmout vše</button>
      <button onclick="rejectAll()">Odmítnout vše</button>
      <button onclick="showSettings()">Nastavení</button>
    </div>
  </div>
</div>

<!-- Settings Modal -->
<div id="cookie-settings" class="modal">
  <h3>Nastavení cookies</h3>

  <div class="cookie-category">
    <label>
      <input type="checkbox" checked disabled>
      Nezbytné cookies (Always Active)
    </label>
    <p>Tyto cookies jsou nutné pro fungování webu.</p>
  </div>

  <div class="cookie-category">
    <label>
      <input type="checkbox" id="analytics-cookies">
      Analytické cookies
    </label>
    <p>Pomáhají nám porozumět návštěvnosti webu. (Google Analytics, Hotjar)</p>
  </div>

  <div class="cookie-category">
    <label>
      <input type="checkbox" id="marketing-cookies">
      Marketingové cookies
    </label>
    <p>Personalizují reklamy na Facebooku a Google. (Facebook Pixel, Google Ads)</p>
  </div>

  <button onclick="savePreferences()">Uložit nastavení</button>
</div>
```

---

**Máte otázky k cookies?**
Napište nám: gdpr@claimbuddy.cz

**Nastavení cookies:**
[www.claimbuddy.cz/nastaveni-cookies]

---

*Tyto Zásady používání cookies jsou v souladu s nařízením GDPR (EU) 2016/679 a zákonem č. 127/2005 Sb. (o elektronických komunikacích).*
*Verze 1.0 | ClaimBuddy s.r.o. | IČO: [IČO bude doplněno před launch]*
