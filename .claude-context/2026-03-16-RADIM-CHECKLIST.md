# SOUHRNNÝ CHECKLIST PRO RADIMA
**Datum:** 2026-03-16
**Stav:** Po 2 dnech agent team development

---

## ✅ OPRAVENO (co jsme opravili za oba dny)

### Den 1 (2026-03-15):
- 4 CRITICAL IDOR zranitelnosti (documents, download, messages, chat-attachments)
- 5 HIGH security fixů (cron auth, impersonate cookie, setup endpoint)
- Dead code cleanup (-5659 LOC, -10 deps)
- Landing page (12 sekcí, nové tarify)
- Stripe live (6 produktů, 8 cen, webhook)
- Dohodáři modul (DPP/DPČ, PDF, kalkulačka)
- Daňový dotazník (32 otázek, 7 sekcí)
- Onboarding dotazník (30 otázek)
- Notion↔App sync
- Realtime presence v extraction
- Znalostní báze (43→72 článků)

### Den 2 (2026-03-16):
- Multi-firma klientský portál (přidání firmy, ARES, portal sections toggle)
- Randomizér knihy jízd (5 fází, Opus AI, OSRM, PDF export)
- Měsíční uzávěrky — CORE FEATURE (6 fází: výpis→párování→dopad→closure→urgence→dashboard)
- Marketplace (registrace, katalog, matchmaking, recenze)
- Revenue sharing (priceback, markup, výplaty)
- Billing-as-a-service (Stripe subscriptions, fee, neplacení)
- Email systém (14 šablon, registrace fix, password reset, Ecomail)
- Notifikační systém (engine, cron, účetní+klient UI, WhatsApp)
- Sběrný email (inbox, třídění, auto-kategorizace)
- Signi.com podepisování (DOCX šablony, webhook)
- Lead generation (upsell, formulář, emaily)
- Koš/zálohy (soft-delete, trash UI, retence)
- Pojistné události modul (DB, API, UI, intake formulář, landing page)
- Krizové řízení (AI plánovač, FMEA, checklist)
- Cookie consent + legal pages
- Security hardening (7 headers, secrets encryption)
- 5 crashujících stránek opraveno (travel, taxes, dohodari, profile, extraction)
- Attention bar UX (confirmation dialogy, kompaktní, kontextové)
- Dashboard (peníze skryté, filtry, přejmenování)
- GTD inbox opraveno (nový tab s kartami)
- Extraction spinner opraveno (race condition fix)
- Termíny (8→31 šablon zákonných termínů)
- Dark mode klientský portál
- Onboarding wizard (7→14 kroků)
- Zod validace na klíčových routes
- Fakturace B2B opraveno (fixer)
- Admin → Lidé tab opraveno (fixer)
- Admin Koš 500 error opraveno (fixer)
- 41 security fixů (role guards na 14 API routes, IDOR fixy, input validation, FK cascade)
- Inbox UX redesign (grouping po klientech, time tracking integration)
- Simplify pass (-147 LOC dead code, -30 console.log, -14 unused imports)
- Multi-tenant správa (accounting_firms tabulka, admin panel)
- Sidebar zjednodušení (probíhá)
- Složky — předdefinovaná struktura šablon (probíhá)

---

## ❌ NEFUNGUJE / POTŘEBUJE OPRAVU

1. **Emaily se neposílají** — chybí ECOMAIL_API_KEY (KRITICKÉ pro registraci, reset hesla, notifikace)
2. ~~**Fakturace B2B**~~ → ✅ OPRAVENO (fixer)
3. ~~**Admin → Lidé tab**~~ → ✅ OPRAVENO (fixer)
4. **Master matice záložky Platby/DPH/Daň** — kód OK ale runtime problém (data?)
5. **Klientský pohled** — 500 error (pravděpodobně build issue, potřeba rebuild+deploy)
6. **Soubory/složky** — předdefinovaná struktura šablon probíhá

---

## ⚠️ POTŘEBUJE RADIMOVU AKCI (ruční nastavení)

### P0 — KRITICKÉ (bez toho appka nefunguje plně):
1. **ECOMAIL_API_KEY** — získat z Ecomail.cz → přidat do .env.local
   - Bez tohoto: registrace neposílá verifikační email, reset hesla nefunguje, notifikace nejdou
2. **ECOMAIL_LIST_ID_CLIENTS + ECOMAIL_LIST_ID_ACCOUNTANTS** — vytvořit seznamy v Ecomail

### P1 — DŮLEŽITÉ:
3. **SENDGRID_API_KEY + SENDGRID_FROM** — fallback email provider
4. **SIGNI_API_KEY + SIGNI_API_URL** — elektronické podepisování (Signi.com účet)
5. **TELEGRAM_BOT_TOKEN** — pro Telegram notifikace klientům
6. **9× STRIPE_PRICE_*** — vytvořit v Stripe Dashboard:
   - STRIPE_PRICE_EXTRACTION_SINGLE, _BULK, _OPUS
   - STRIPE_PRICE_EXTRA_USER, _EXTRA_COMPANY
   - STRIPE_PRICE_RANDOMIZER
   - STRIPE_PRICE_TRAVEL_YEARLY_SINGLE, _FLEET, _REGEN

### P2 — NICE TO HAVE:
7. **NOTION_TOKEN** — pro Notion↔App sync úkolů
8. **EVOLUTION_API_KEY + EVOLUTION_INSTANCE** — WhatsApp notifikace
9. **SETUP_SECRET** — zabezpečení first-admin endpointu
10. **Supabase tier** — zkontrolovat kapacitu DB (free tier = 500MB)
11. **Hetzner disk** — pro snapshoty/zálohy (pokud monetizujeme)

### Fyzické akce:
12. **TELFA.cz** — poslat SIM kartu pro telefonní bránu
13. **Google Drive** — napojit pro svou firmu (OAuth setup)
14. **Vzory smluv** — připravit DOCX šablony (plná moc, smlouva o účetnictví)

---

## 🔍 K VIZUÁLNÍ KONTROLE (Radim musí projít v prohlížeči)

### Účetnický portál (app.zajcon.cz/accountant/):
- [ ] Dashboard — dlaždice, matice, filtry
- [ ] Klienti → detail → VŠECHNY záložky (travel, taxes, dohodari, firma, extraction)
- [ ] Komunikace — chat funguje?
- [ ] Inbox dokladů — třídění, akce
- [ ] Práce — GTD inbox tab, úkoly, projekty
- [ ] Vytěžování — klienti se načtou? Verifikace?
- [ ] Termíny — 31 šablon, kompletní?
- [ ] Připomínky — nová připomínka, doručování
- [ ] Znalostní báze — 72 článků, kategorie, obsah
- [ ] Marketplace — registrace, katalog
- [ ] Revenue — přehled příjmů
- [ ] Fakturace B2B (opraveno — ověřit)
- [ ] Billing — správa klientů
- [ ] Administrace — přehled, lidé (opraveno), koš (opraveno)
- [ ] Podepisování (BETA)

### Klientský portál:
- [ ] Dashboard — widgety, daňový přehled
- [ ] Doklady — upload, inbox
- [ ] Faktury — CRUD
- [ ] Cestovní deník — jízdy, randomizér
- [ ] Zprávy — chat s účetní
- [ ] Dotazník daňový
- [ ] Dotazník onboarding
- [ ] Dohodáři
- [ ] Krizový plán (bonus)
- [ ] Dark mode — konzistentní?

### Landing pages:
- [ ] / — hlavní landing (nepřihlášený)
- [ ] /pricing — ceník
- [ ] /pro-ucetni — lead capture (pokud hotová)
- [ ] /pro-podnikatele — lead capture (pokud hotová)
- [ ] /claims — pojistné události landing
- [ ] /claims/new — intake formulář
- [ ] /marketplace — katalog účetních
- [ ] /legal/* — terms, privacy, cookies

### Claims modul:
- [ ] /claims/dashboard — přehled
- [ ] /claims/cases — seznam spisů
- [ ] /claims/cases/new — nový případ
- [ ] App switcher — přepínání účetnictví ↔ claims

---

## 📋 NEDOKONTROLOVÁNO (nestihli jsme otestovat)

1. Stripe checkout flow (platba kartou → webhook → plan update)
2. Email registrace flow (registrace → verifikační email → klik → login)
3. Password reset flow (forgot → email → klik → nové heslo)
4. Notion sync (obousměrný — závisí na NOTION_TOKEN)
5. WhatsApp notifikace (závisí na EVOLUTION_API_KEY)
6. Telegram notifikace (závisí na TELEGRAM_BOT_TOKEN)
7. Ecomail marketing kampaně (závisí na ECOMAIL_API_KEY)
8. Google Drive sync
9. Raynet CRM sync
10. Randomizér knihy jízd (end-to-end s Opus AI)
11. Sběrný email (příjem příloh přes Gmail)
12. Multi-tenant: registrace jiné účetní firmy
13. Billing-as-a-service: nastavení ceny + inkaso
14. Krizový plán: AI generátor
15. Mobile responsivita celé appky
