# RADIM CHECKLIST — Co zbývá
**Datum:** 2026-03-16 | **Stav:** 77✅ 41⚠️ 8❌ 22🔧

---

## 🔧 CO MUSÍŠ UDĚLAT TY (API klíče + fyzické akce)

### 🔴 P0 — Bez toho nefungují emaily (KRITICKÉ)

| Co | Kde nastavit |
|----|-------------|
| `ECOMAIL_API_KEY` | .env.local — bez toho se NEPOSÍLAJÍ ŽÁDNÉ emaily |
| `ECOMAIL_LIST_ID_ACCOUNTANTS` | .env.local — seznam pro účetní |
| `ECOMAIL_LIST_ID_CLIENTS` | .env.local — seznam pro klienty |
| `SENDGRID_API_KEY` | .env.local — fallback emailový provider |
| `SENDGRID_FROM_EMAIL` | .env.local — odesílací adresa |
| `DOCUMENT_INBOX_EMAIL` | .env.local — sběrný email pro doklady |

### 🟠 P1 — Stripe (platby nefungují bez toho)

| Co | Kde nastavit |
|----|-------------|
| `STRIPE_PRICE_EXTRACTION_SINGLE` | .env.local — 9 Kč/doklad |
| `STRIPE_PRICE_EXTRACTION_BULK` | .env.local — 7 Kč/bulk |
| `STRIPE_PRICE_EXTRACTION_OPUS` | .env.local — 19 Kč/Opus |
| `STRIPE_PRICE_EXTRA_USER` | .env.local — 99 Kč/user |
| `STRIPE_PRICE_EXTRA_COMPANY` | .env.local — 49 Kč/firma |
| `STRIPE_PRICE_RANDOMIZER` | .env.local — 990 Kč |
| 3× Travel price IDs | .env.local — TRAVEL_YEARLY_SINGLE/FLEET/REGEN |

### 🟡 P2 — Integrace (zapnout až budeš chtít)

| Co | Akce |
|----|------|
| `SIGNI_API_KEY` | .env.local — e-podpisy |
| **Signi DB migrace** | Spustit v Supabase SQL: `ALTER TABLE users ADD COLUMN IF NOT EXISTS signi_api_key TEXT;` |
| `TELEGRAM_BOT_TOKEN` | .env.local |
| `NOTION_TOKEN` | .env.local |
| `EVOLUTION_API_KEY` | .env.local — WhatsApp |

### 🔵 Fyzické akce

| Co | Proč |
|----|------|
| Poslat SIM kartu na **TELFA.cz** | BOD-077 — potřeba pro telefonní připomínky |
| Zkontrolovat **Supabase** kapacitu | Free tier = 500MB limit |
| Koupit **Hetzner disk** | Pro snapshoty/zálohy (BOD-081) |

### Ostatní

| Co | Akce |
|----|------|
| `NEXT_PUBLIC_APP_URL` | .env.local (volitelné — fallback je app.zajcon.cz) |
| Stripe Billing Portal URL | Nastavit v Stripe dashboard |
| Ecomail automation IDs | `ECOMAIL_AUTOMATION_*` — nakonfigurovat v .env.local po aktivaci Ecomail |

---

## ❌ CO JEŠTĚ CHYBÍ V KÓDU (agenti dodělají)

| BOD | Co | Poznámka |
|-----|----|---------|
| BOD-011 | Master matice — barevná kolečka jako click-to-filter | UX feature, P2 |
| BOD-014 | Zpracované doklady → automaticky do profilu klienta | Workflow uzávěrky |
| BOD-043 | Time tracking při zpracování dokladů v inbox | Pro billing hodinové sazby |
| BOD-046 | Automatické třídění dokumentů do složek | Složitá AI feature |
| BOD-056 | TELFA.cz API napojení | ⚠️ Čeká na fyzickou SIM (BOD-077) |
| BOD-072 | Signi.com DOCX šablony s auto-fill | Čeká na šablony od tebe |
| BOD-078 | TELFA.cz API integrace | = BOD-056, závisí na SIM |
| BOD-106 | Reklama Google Ads/Meta | Není kód — business akce |

---

## ✅ CO JE HOTOVO (pro přehled)

- **77 bodů implementováno** — crash bugy, auth, Raynet CRM, monetizace, snapshots, WhatsApp multi-instance, junior/senior role, krizový chatbot, PU checklist, cross-selling, marketplace matching, email config, freemium UX, urgovat tooltips, a much more
- **Kill switch:** `MONETIZATION_ENABLED=false` — zapni až ověříš v produkci
- **Reverse trial:** 30 dní Professional pro nové registrace — funguje

---

## 🚀 DOPORUČENÝ POSTUP PRO LAUNCH

1. **Dnes:** Nastav ECOMAIL (P0 emaily) + STRIPE price IDs
2. **Tento týden:** Ověř v produkci — přihlas se, projdi hlavní flows
3. **Před launch:** Zapni `MONETIZATION_ENABLED=true` v .env.local + rebuild
4. **Po launch:** Monitoruj Supabase kapacitu (BOD-080)
