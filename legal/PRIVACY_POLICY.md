# Zásady ochrany osobních údajů

**Účinnost od:** 1. ledna 2026
**Verze:** 1.0

---

## 1. Kdo jsme a jak nás kontaktovat

### 1.1 Správce osobních údajů
**ZajCon s.r.o.**
IČO: 123 45 678
Sídlo: Praha, Česká republika
Email: gdpr@zajcon.cz

### 1.2 Co děláme
Provozujeme webovou aplikaci Účetní OS — platformu pro spolupráci účetních firem s jejich klienty. Umožňujeme nahrávání dokladů, sledování uzávěrek, komunikaci a správu účetních agend.

---

## 2. Jaké osobní údaje zpracováváme

### 2.1 Identifikační údaje
**Co sbíráme:** Jméno, příjmení, IČO, DIČ (u podnikatelů)
**Proč:** Identifikace uživatele, správa klientských firem
**Právní titul:** Čl. 6 odst. 1 písm. b) GDPR (plnění smlouvy)

### 2.2 Kontaktní údaje
**Co sbíráme:** Emailová adresa, telefonní číslo
**Proč:** Komunikace, notifikace, podpora
**Právní titul:** Čl. 6 odst. 1 písm. b) GDPR (plnění smlouvy)

### 2.3 Účetní dokumenty
**Co sbíráme:** Faktury, pokladní doklady, bankovní výpisy, smlouvy
**Proč:** Zpracování účetnictví, vedení agendy
**Právní titul:** Čl. 6 odst. 1 písm. b) GDPR (plnění smlouvy)

**DŮLEŽITÉ:**
- Dokumenty nahrává uživatel dobrovolně
- Za obsah dokumentů odpovídá uživatel
- Dokumenty jsou přístupné pouze oprávněným uživatelům (účetní + klient)

### 2.4 Finanční údaje
**Co sbíráme:** Bankovní spojení, platební údaje (při platbě předplatného)
**Proč:** Fakturace, správa předplatného
**Právní titul:** Čl. 6 odst. 1 písm. b) GDPR + čl. 6 odst. 1 písm. c) (daňová povinnost)

### 2.5 Komunikační data
**Co sbíráme:** Zprávy v aplikaci, přílohy
**Proč:** Evidence komunikace mezi účetním a klientem
**Právní titul:** Čl. 6 odst. 1 písm. b) GDPR (plnění smlouvy)

### 2.6 Technické údaje
**Co sbíráme:** IP adresa, typ zařízení a prohlížeče, cookies, logy přihlášení
**Proč:** Bezpečnost účtu, technická podpora
**Právní titul:** Čl. 6 odst. 1 písm. f) GDPR (oprávněný zájem na bezpečnosti)

---

## 3. Jak dlouho údaje uchováváme

| Typ údajů | Doba uchovávání | Důvod |
|-----------|-----------------|-------|
| Smlouva a základní údaje | 3 roky po ukončení smlouvy | Promlčecí lhůta |
| Účetní dokumenty | 10 let | Zákonná povinnost (zákon o účetnictví) |
| Účetní doklady (faktury) | 10 let | Daňová povinnost |
| Komunikace | 3 roky po ukončení smlouvy | Dokumentace |
| Technické logy | 6 měsíců | Bezpečnost |

**Po uplynutí lhůty:** Data jsou bezpečně smazána nebo anonymizována.

---

## 4. Komu předáváme vaše údaje

### 4.1 Hostingové služby
**Komu:** Vercel (hosting aplikace), Supabase (databáze)
**Co:** Veškeré zpracovávané údaje
**Bezpečnost:** Šifrování, EU servery, zpracovatelská smlouva

### 4.2 Platební brána
**Komu:** Stripe
**Co:** Platební údaje
**Bezpečnost:** PCI-DSS certifikace

### 4.3 Emailové služby
**Komu:** SendGrid
**Co:** Emailová adresa, obsah notifikací
**Bezpečnost:** Zpracovatelská smlouva

### 4.4 Podepisování
**Komu:** Signi.com
**Co:** Jméno, email, dokumenty k podpisu
**Bezpečnost:** eIDAS certifikace, zpracovatelská smlouva

### 4.5 Státní orgány
**Komu:** Finanční úřad (na zákonný požadavek)
**Právní titul:** Čl. 6 odst. 1 písm. c) GDPR (právní povinnost)

**NEPŘEDÁVÁME:**
- Marketingovým firmám
- Datovým brokerům
- Do zemí mimo EU (kromě USA s Adequacy Decision — Vercel, Stripe)

---

## 5. Jak chráníme vaše údaje

### 5.1 Technická opatření
- **Šifrování:** TLS 1.3 pro přenos, AES-256 pro uložení
- **Autentizace:** HMAC-SHA256, PBKDF2 hashování hesel
- **Firewall:** Ochrana před neoprávněným přístupem
- **Zálohování:** Denní šifrované zálohy
- **Audit log:** Monitoring všech přístupů

### 5.2 Organizační opatření
- Přístup pouze oprávněným osobám
- Role-based access control (RBAC)
- IDOR ochrana na všech API endpoints

### 5.3 Incident management
V případě data breach:
- Oznámení ÚOOÚ do 72 hodin
- Informování dotčených osob
- Nápravná opatření

---

## 6. Vaše práva

### 6.1 Právo na přístup (čl. 15 GDPR)
Získat kopii všech dat. Email: gdpr@zajcon.cz. Lhůta: 30 dnů.

### 6.2 Právo na opravu (čl. 16 GDPR)
Opravit nepřesné údaje — v aplikaci nebo emailem.

### 6.3 Právo na výmaz (čl. 17 GDPR)
Smazání údajů po ukončení smlouvy (s ohledem na zákonné archivační lhůty).

### 6.4 Právo na omezení zpracování (čl. 18 GDPR)
Zmrazení dat pokud zpochybňujete přesnost nebo zákonnost zpracování.

### 6.5 Právo na přenositelnost (čl. 20 GDPR)
Export dat ve strojově čitelném formátu (JSON, CSV). Lhůta: 30 dnů.

### 6.6 Právo vznést námitku (čl. 21 GDPR)
Nesouhlasit se zpracováním na základě oprávněného zájmu.

### 6.7 Právo podat stížnost (čl. 77 GDPR)
**Úřad pro ochranu osobních údajů (ÚOOÚ)**
- Web: uoou.cz
- Email: posta@uoou.cz
- Telefon: +420 234 665 111
- Adresa: Pplk. Sochora 27, 170 00 Praha 7

---

## 7. Cookies

Viz samostatný dokument: [Zásady používání cookies](/legal/cookies)

---

## 8. Změny zásad

- O změnách informujeme emailem min. 30 dní předem
- Nesouhlasíte? Máte právo smlouvu ukončit bez sankcí

---

## 9. Kontakt

**Obecné dotazy k GDPR:** gdpr@zajcon.cz
**Uplatnění práv:** gdpr@zajcon.cz (uveďte jméno, email a typ žádosti)

---

*Tyto Zásady ochrany osobních údajů jsou v souladu s nařízením GDPR (EU) 2016/679 a zákonem č. 110/2019 Sb.*
*Verze 1.0 | ZajCon s.r.o.*
