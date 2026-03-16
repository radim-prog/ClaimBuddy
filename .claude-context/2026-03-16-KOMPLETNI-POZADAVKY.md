# KOMPLETNÍ SEZNAM POŽADAVKŮ — UcetniWebApp
**Datum:** 2026-03-16
**Zdroje:** monetizace-a-verzovani, danovy-dotaznik-uol, lead-generation-marketplace, email-system, mesicni-uzaverky-klient, pojistne-udalosti-vize, krizove-rizeni-integrace, go-to-market, testing-feedback-01 až 05, RADIM-CHECKLIST, missing-integrations-checklist, navrh-tarifu
**Celkem:** 143 bodů

---

## UI/UX

- [ ] BOD-001: Attention bar — "Urgovat všechny klienty" musí mít confirmation dialog + výběr klientů k urgování — zdroj: testing-feedback-01
- [ ] BOD-002: Attention bar — kompaktní formát (jeden řádek místo 3): "Výpis ✅ Náklady ❌ 2/3 Příjmy ✅" — zdroj: testing-feedback-01
- [ ] BOD-003: Attention bar — "Označit jako hotové" automaticky při dodání dokladů (ne manuálně) — zdroj: testing-feedback-01
- [ ] BOD-004: Attention bar — sjednotit/odstranit "Urgovat" vs "Delegovat" (nejasný rozdíl) — zdroj: testing-feedback-01
- [ ] BOD-005: Attention bar — kontextová (jiná info na komunikaci vs. na uzávěrkách; na nevhodných stránkách skrýt) — zdroj: testing-feedback-01
- [ ] BOD-006: Attention bar — informovat uživatele CO se stane po kliknutí Urgovat (email? WhatsApp? SMS?) — zdroj: testing-feedback-01
- [ ] BOD-007: Attention bar — "Přidat poznámku" → jasně ukázat kde se poznámka zobrazí — zdroj: testing-feedback-01
- [ ] BOD-008: Dashboard — horní 3 dlaždice (Úkoly, Firmy, Hodiny) → buď funkční kliky nebo odebrat — zdroj: testing-feedback-02
- [ ] BOD-009: Dashboard — skrýt finanční data (kolik firma vydělá) před řadovými účetními (demotivující) — zdroj: testing-feedback-02
- [ ] BOD-010: Master matice — přejmenovat "Čeká na schválení" (nic nečeká na schválení) — zdroj: testing-feedback-02
- [ ] BOD-011: Master matice — barevná kolečka klikatelná jako filtr (klik oranžové → zobrazit jen oranžové) — zdroj: testing-feedback-02
- [ ] BOD-012: Inbox dokladů — přejmenovat na "Inbox podkladů" nebo "Inbox materiálů" — zdroj: testing-feedback-02
- [ ] BOD-013: Inbox dokladů — seskupit podle klientů (jako komunikace má nadpisy firem) — zdroj: testing-feedback-03
- [ ] BOD-014: Inbox dokladů — zpracované doklady přesunout do profilu klienta (ne zůstat v inboxu navždy) — zdroj: testing-feedback-03
- [ ] BOD-015: GTD/Práce — 3 taby: Inbox | Úkoly | Projekty (inbox jako prominentní tab) — zdroj: testing-feedback-03
- [ ] BOD-016: Navigace — rozdělit sidebar na "denní práce" vs "extras" (příliš mnoho položek) — zdroj: testing-feedback-04
- [ ] BOD-017: Marketplace — admin vidí automaticky, bez nutnosti se "registrovat" — zdroj: testing-feedback-04
- [ ] BOD-018: Revenue analytika — přesunout do sekce Analytika nebo Admin — zdroj: testing-feedback-04
- [ ] BOD-019: Krizový plán — nenápadný, ne vlastní záložka; umístit pod "Firma" nebo jako banner/tlačítko — zdroj: krizove-rizeni-integrace
- [ ] BOD-020: Role — rozlišit účetní junior vs senior (senior má víc práv: marketplace, revenue, připomínky) — zdroj: testing-feedback-04
- [ ] BOD-021: Landing page pro klienty — jednodušší verze, jiné barvy (odlišit od účetnické landing) — zdroj: go-to-market
- [ ] BOD-022: Přidaná firma/klient — pozitivní UX: jasný indikátor co dostávají zdarma vs co je placené — zdroj: navrh-tarifu
- [ ] BOD-023: Randomizér cesťáku — ukázat odhadovanou cenu zpracování PŘEDEM — zdroj: monetizace-a-verzovani

---

## Funkce

- [ ] BOD-024: Měsíční uzávěrky (CORE FEATURE) — nahrání bankovního výpisu (PDF/CSV) + AI extrakce příjmů a výdajů — zdroj: mesicni-uzaverky-klient
- [ ] BOD-025: Měsíční uzávěrky — automatické párování plateb na doklady (variabilní symbol, částka, ±datum) — zdroj: mesicni-uzaverky-klient
- [ ] BOD-026: Měsíční uzávěrky — zobrazit CHYBĚJÍCÍ doklady k výdajům — zdroj: mesicni-uzaverky-klient
- [ ] BOD-027: Měsíční uzávěrky — vyčíslit daňový dopad každého chybějícího dokladu ("bude tě to stát X Kč DPH + Y Kč SP + Z Kč ZP") — zdroj: mesicni-uzaverky-klient
- [ ] BOD-028: Měsíční uzávěrky — kumulativní graf daně z příjmu přes rok (leden Xk, únor +Yk = ...) — zdroj: mesicni-uzaverky-klient
- [ ] BOD-029: Měsíční uzávěrky — eskalační notifikace na chybějící doklady (3 dny, 7 dní, ...) — zdroj: mesicni-uzaverky-klient
- [ ] BOD-030: Měsíční uzávěrky — OSVČ: označit soukromé transakce (nemají účetní dopad) — zdroj: mesicni-uzaverky-klient
- [ ] BOD-031: Měsíční uzávěrky — SRO: označit vklad jednatele / příplatek mimo ZK / splátka dluhu jednatele — zdroj: mesicni-uzaverky-klient
- [ ] BOD-032: Měsíční uzávěrky — manuální kontrola a potvrzení výsledků vytěžení — zdroj: mesicni-uzaverky-klient
- [ ] BOD-033: Daňový dotazník — workflow: účetní odešle → klient vyplní v portálu → přiloží dokumenty → účetní vidí — zdroj: danovy-dotaznik-uol
- [ ] BOD-034: Daňový dotazník — napojit na modul daňového přiznání (data protékají celou aplikací) — zdroj: danovy-dotaznik-uol
- [ ] BOD-035: Daňový dotazník — upload dokumentu ke každé relevantní otázce — zdroj: danovy-dotaznik-uol
- [ ] BOD-036: Randomizér cesťáku — extrahovat tankování (nafta, litry, místo) z dokladů a přiřadit k vozidlu — zdroj: monetizace-a-verzovani
- [ ] BOD-037: Randomizér cesťáku — AI generuje věrohodné cesty zpětně (1-2 roky), sedí km × litry × nájezd — zdroj: monetizace-a-verzovani
- [ ] BOD-038: Randomizér cesťáku — jen Opus 4.6 (komplexní matice možností) — zdroj: monetizace-a-verzovani
- [ ] BOD-039: Termíny — doplnit SP zálohy/přehledy OSVČ — zdroj: testing-feedback-03
- [ ] BOD-040: Termíny — doplnit ZP zálohy/přehledy OSVČ — zdroj: testing-feedback-03
- [ ] BOD-041: Termíny — doplnit kompletní DPH (měsíční i čtvrtletní přiznání, kontrolní hlášení, souhrnné hlášení) — zdroj: testing-feedback-03
- [ ] BOD-042: Termíny — doplnit silniční daň a daň z nemovitostí — zdroj: testing-feedback-03
- [ ] BOD-043: Inbox dokladů — evidence odpracovaného času při zpracování (komu naúčtovat kolik) — zdroj: testing-feedback-03
- [ ] BOD-044: Soubory — předdefinovaná struktura složek (nastavuje manažer v Settings, platí pro VŠECHNY klienty) — zdroj: testing-feedback-02
- [ ] BOD-045: Soubory — přidání složky v Settings → automaticky se přidá u všech klientů — zdroj: testing-feedback-02
- [ ] BOD-046: Soubory — automatické třídění dokumentů do předem definovaných složek — zdroj: testing-feedback-02
- [ ] BOD-047: Snapshots/zálohy — monetizovaná funkce; každá účetní firma má vlastní snapshot — zdroj: go-to-market
- [ ] BOD-048: Snapshots/zálohy — obnovení z admin panelu (účetní si vyvolá sám) — zdroj: go-to-market
- [ ] BOD-049: GTD inbox — clarify flow: každá položka → rozhodnutí (úkol? projekt? smazat?) — zdroj: testing-feedback-03
- [ ] BOD-050: Pojistné události — spis události, komunikace s pojišťovnou, dokumentace škody, vyčíslení nároku — zdroj: pojistne-udalosti-vize
- [ ] BOD-051: Pojistné události — app switcher (účetnictví ↔ pojistné události) — zdroj: pojistne-udalosti-vize
- [ ] BOD-052: Pojistné události — sdílený profil klienta (jádro) — zdroj: pojistne-udalosti-vize
- [ ] BOD-053: Krizový plán — AI generátor: klient vyplní 5-6 údajů o firmě → Sonnet 4.6 navrhne plán — zdroj: krizove-rizeni-integrace
- [ ] BOD-054: Krizový plán — chatbot pro krizové řízení (nejvyšší tarif, max 10 otázek, omezené tokeny) — zdroj: krizove-rizeni-integrace
- [ ] BOD-055: Krizový plán — pro PU klienty: checklist "co dělat hned po pojistné události" — zdroj: krizove-rizeni-integrace
- [ ] BOD-056: Připomínky — napojit na TELFA.cz API (telefonní upomínky) — zdroj: testing-feedback-04
- [ ] BOD-057: Multi-tenant registrace — samoobslužná registrace účetní firmy (ověřit fungování) — zdroj: go-to-market
- [ ] BOD-058: WhatsApp — zprávy viditelné v sekci Komunikace v appce (ne jen v telefonu) — zdroj: go-to-market
- [ ] BOD-059: WhatsApp — skupinový přístup: kdokoliv v účetní firmě vidí WhatsApp zprávy — zdroj: go-to-market

---

## Security

- [ ] BOD-060: Confirmation dialog pro VŠECHNY nebezpečné hromadné akce (nejen "Urgovat všechny") — zdroj: testing-feedback-01
- [ ] BOD-061: Skrýt příjmy/zisk klientů před řadovými účetními (pouze manažer/admin vidí) — zdroj: testing-feedback-02
- [ ] BOD-062: Role-based access: junior účetní < senior účetní < manažer < admin — zdroj: testing-feedback-04
- [ ] BOD-063: Snapshots — izolované per účetní firma (účetní firmy nesmí vidět snapshots jiných) — zdroj: go-to-market
- [ ] BOD-064: Billing-as-a-service — ověřit právní aspekty zprostředkování plateb (platební instituce?) — zdroj: lead-generation-marketplace
- [ ] BOD-065: Per-firma nastavení (Google Drive, WhatsApp, Signi klíče) — izolace klíčů mezi firmami — zdroj: go-to-market

---

## Integrace

- [ ] BOD-066: ECOMAIL_API_KEY — přidat do .env.local + Vercel (P0: bez toho žádné emaily!) — zdroj: missing-integrations-checklist
- [ ] BOD-067: Ecomail — vytvořit subscriber listy "Účetní" a "Klienti", přidat ID do .env — zdroj: missing-integrations-checklist
- [ ] BOD-068: Ecomail — nastavit automations (onboarding, trial expiry, upsell, winback) — zdroj: missing-integrations-checklist
- [ ] BOD-069: SendGrid — fallback email provider (SENDGRID_API_KEY + SENDGRID_FROM_EMAIL) — zdroj: missing-integrations-checklist
- [ ] BOD-070: Signi.com — přidat SIGNI_API_KEY do .env.local — zdroj: missing-integrations-checklist
- [ ] BOD-071: Signi.com — spustit v Supabase: `ALTER TABLE users ADD COLUMN IF NOT EXISTS signi_api_key TEXT;` — zdroj: missing-integrations-checklist
- [ ] BOD-072: Signi.com — vzory smluv (DOCX šablony s auto-fill poli: plná moc, smlouva o účetnictví) — zdroj: go-to-market
- [ ] BOD-073: Telegram — TELEGRAM_BOT_TOKEN (přes @BotFather) — zdroj: missing-integrations-checklist
- [ ] BOD-074: Notion — NOTION_TOKEN (přes notion.so → integrations) — zdroj: missing-integrations-checklist
- [ ] BOD-075: Evolution API — EVOLUTION_API_KEY (WhatsApp) — zdroj: missing-integrations-checklist
- [ ] BOD-076: WhatsApp — per účetní firma: vlastní číslo, QR připojení (Evolution API) — zdroj: go-to-market
- [ ] BOD-077: TELFA.cz — fyzicky poslat SIM kartu (Radim) — zdroj: go-to-market
- [ ] BOD-078: TELFA.cz — API integrace (telefonní brána, nahrávky hovorů) — zdroj: testing-feedback-04
- [ ] BOD-079: Google Drive — napojit pro KAŽDOU účetní firmu (ne jen Radimova firma) — zdroj: go-to-market
- [ ] BOD-080: Supabase — zkontrolovat kapacitu (free tier = 500MB), upgradovat pokud potřeba — zdroj: RADIM-CHECKLIST
- [ ] BOD-081: Hetzner — koupit disk pro snapshoty (20 firem × denní snapshot = velký objem) — zdroj: go-to-market
- [ ] BOD-082: Stripe — vytvořit 9 chybějících addon price IDs (viz. seznam v missing-integrations-checklist) — zdroj: missing-integrations-checklist
- [ ] BOD-083: Stripe — nastavit Billing Portal — zdroj: navrh-tarifu
- [ ] BOD-084: Stripe — ověřit webhook zpracování pro addon/credits purchase — zdroj: navrh-tarifu
- [ ] BOD-085: Raynet CRM — ověřit že sync funguje (cron každých 5 min, 8-20h) — zdroj: RADIM-CHECKLIST
- [ ] BOD-086: Sběrný email — každý klient dostane vlastní email adresu při založení profilu — zdroj: email-system
- [ ] BOD-087: Email adresy systému — nastavit noreply@, fakturace@, kancelar@, info@ — zdroj: email-system
- [ ] BOD-088: Email marketing — open rate, konverze, click tracking — zdroj: email-system
- [ ] BOD-089: DOCUMENT_INBOX_EMAIL — přidat do .env.local (adresa pro auto-stahování dokladů) — zdroj: missing-integrations-checklist
- [ ] BOD-090: NEXT_PUBLIC_APP_URL=https://app.zajcon.cz přidat do .env.local — zdroj: missing-integrations-checklist
- [ ] BOD-091: .env.local.example — aktualizovat (odstranit zastaralé GDrive service account vars + WhatsApp token vars) — zdroj: missing-integrations-checklist

---

## Marketing

- [ ] BOD-092: Landing page účetní firmy — doladit existující (app.zajcon.cz nebo ucetnios.cz) — zdroj: go-to-market
- [ ] BOD-093: Landing page klienti — jednodušší, jiné barvy, zdůraznit freemium — zdroj: go-to-market
- [ ] BOD-094: Landing page pojistné události — claims.zajcon.cz — zdroj: go-to-market
- [ ] BOD-095: Lead capture stránky — jednoduché formuláře (jméno, email, firma) pro každý segment — zdroj: go-to-market
- [ ] BOD-096: Lead gen — kontextový upsell u složitých funkcí: "Potřebujete pomoc účetní?" (jen klienti BEZ přiřazené účetní) — zdroj: lead-generation-marketplace
- [ ] BOD-097: Lead gen — emailové kampaně (tipy, termíny, nabídky) POUZE pro klienty bez přiřazené účetní — zdroj: lead-generation-marketplace
- [ ] BOD-098: Marketplace — onboarding účetních firem jako poskytovatelů — zdroj: lead-generation-marketplace
- [ ] BOD-099: Marketplace — matchmaking: lokalita, kapacita, specializace — zdroj: lead-generation-marketplace
- [ ] BOD-100: Cross-selling — účetní klienti → pojistné události; PU klienti → účetnictví — zdroj: pojistne-udalosti-vize
- [ ] BOD-101: Cross-selling — emailové kampaně, 3 měsíce zdarma na druhou službu — zdroj: pojistne-udalosti-vize
- [ ] BOD-102: Soft launch — 3 měsíce Professional zdarma pro první uživatele (vlastní klienti Radima, účetní holky) — zdroj: go-to-market
- [ ] BOD-103: Revenue sharing — priceback model pro externí účetní firmy (klient platí nám → my pošleme účetní minus fee) — zdroj: lead-generation-marketplace
- [ ] BOD-104: Billing-as-a-service — vybírat kompletní účetní fee od klientů za účetní firmy — zdroj: lead-generation-marketplace
- [ ] BOD-105: Markup model — účetní může klientovi zdražit (rozdíl = marže) — zdroj: lead-generation-marketplace
- [ ] BOD-106: Reklama — cílit na účetní firmy (hlavní revenue stream) — zdroj: go-to-market
- [ ] BOD-107: Fee model — stanovit výši manipulačního poplatku (% nebo fixní) a frekvenci priceback — zdroj: lead-generation-marketplace

---

## Bugy

- [ ] BOD-108: CRASH: záložka "Jízdy" v klientském detailu → prázdný screen — zdroj: testing-feedback-02
- [ ] BOD-109: CRASH: záložka "Daně" v klientském detailu → prázdný screen — zdroj: testing-feedback-02
- [ ] BOD-110: CRASH: záložka "Dohodáři" v klientském detailu → nefunguje — zdroj: testing-feedback-02
- [ ] BOD-111: CRASH: záložka "Firma" v klientském detailu → nefunguje — zdroj: testing-feedback-02
- [ ] BOD-112: CRASH: sekce Vytěžování (hlavní navigace) → přepne na prázdný screen — zdroj: testing-feedback-02
- [ ] BOD-113: BUG: Vytěžování → klik na klienta → spinner točí se nekonečně — zdroj: testing-feedback-03
- [ ] BOD-114: BUG: Fakturace B2B → "Chyba při načítání dat" — zdroj: testing-feedback-04
- [ ] BOD-115: BUG: Admin → záložka "Lidé" → CHYBA — zdroj: testing-feedback-04
- [ ] BOD-116: BUG: Admin → "Koš" → 500 Internal Server Error — zdroj: testing-feedback-04
- [ ] BOD-117: BUG: Klientský pohled (např. Wikiporadce.cz) → 500 Internal Server Error — zdroj: testing-feedback-05
- [ ] BOD-118: BUG: Master matice → záložka Platby → nefunguje — zdroj: testing-feedback-02
- [ ] BOD-119: BUG: Master matice → záložka DPH → nefunguje — zdroj: testing-feedback-02
- [ ] BOD-120: BUG: Master matice → záložka Daň z příjmu → nefunguje — zdroj: testing-feedback-02
- [ ] BOD-121: BUG: GTD inbox → ukazuje číslo "4" ale seznam položek je neviditelný — zdroj: testing-feedback-03
- [ ] BOD-122: BUG: Soubory → tlačítko "Vytvořit složku" nefunguje — zdroj: testing-feedback-02
- [ ] BOD-123: BUG: Master matice → filtr "Chybí 108" zobrazí všechny firmy (nefiltruje správně) — zdroj: testing-feedback-02
- [ ] BOD-124: INFO: Znalostní báze → prázdná po prvním načtení (sessionStorage cache) → fix: hard refresh Ctrl+Shift+R — zdroj: testing-feedback-04

---

## Monetizace

- [ ] BOD-125: Klientský tarif FREE (0 Kč): faktury neomezeno, adresář max 5, základní cesťák (1 vozidlo), zprávy — zdroj: navrh-tarifu
- [ ] BOD-126: Klientský tarif PLUS (199 Kč/měs | 1990/rok): neomezený adresář, plný cesťák, 5 extrakcí/měs — zdroj: navrh-tarifu
- [ ] BOD-127: Klientský tarif PREMIUM (399 Kč/měs | 3990/rok): 20 extrakcí, proforma→faktura→dobropis, QR platby, stats — zdroj: navrh-tarifu
- [ ] BOD-128: Účetní tarif ZÁKLAD (0 Kč): max 10 firem, 1 user, základní funkce bez projektů a vytěžování — zdroj: navrh-tarifu
- [ ] BOD-129: Účetní tarif PROFI (699 Kč/měs | 6990/rok): max 100 firem, 5 users, uzávěrky, DPH, komunikace — zdroj: navrh-tarifu
- [ ] BOD-130: Účetní tarif BUSINESS (1499 Kč/měs | 14990/rok): neomezeno, 100 extrakcí, health score, admin panel, API — zdroj: navrh-tarifu
- [ ] BOD-131: Per-use: vytěžování nad limit 9 Kč/doklad — zdroj: navrh-tarifu
- [ ] BOD-132: Per-use: bulk vytěžování (100+ ks) 7 Kč/doklad — zdroj: navrh-tarifu
- [ ] BOD-133: Per-use: AI Opus analýza 19 Kč/doklad — zdroj: navrh-tarifu
- [ ] BOD-134: Per-use: přidaný uživatel 99 Kč/měsíc — zdroj: navrh-tarifu
- [ ] BOD-135: Per-use: firma nad limit 49 Kč/měsíc/firma — zdroj: navrh-tarifu
- [ ] BOD-136: Per-use: randomizér cesťáku od 990 Kč/zpracování (klientský tarif) — zdroj: navrh-tarifu
- [ ] BOD-137: Reverse trial — 30 dní PROFI/PREMIUM zdarma pro nové uživatele — zdroj: navrh-tarifu
- [ ] BOD-138: MONETIZATION_ENABLED=true — zapnout po ověření v produkci (aktuálně false = kill switch) — zdroj: RADIM-CHECKLIST
- [ ] BOD-139: Stripe Billing Portal — umožnit klientům spravovat předplatné sami — zdroj: navrh-tarifu

---

## Architektura

- [ ] BOD-140: Architektura jádro + deriváty: sdílené DB/backend, dvě "tváře" (účetnictví + pojistné události) — zdroj: pojistne-udalosti-vize
- [ ] BOD-141: Sdílený klientský profil (jádro) napříč účetnictvím i pojistnými událostmi — zdroj: pojistne-udalosti-vize
- [ ] BOD-142: Multi-tenant: admin (Radim + manažerka) vidí VŠECHNY účetní firmy v jednom panelu — zdroj: go-to-market
- [ ] BOD-143: Sdílená infrastruktura pro obě služby: Stripe, Ecomail, Telegram, WhatsApp, Notion, ARES — zdroj: pojistne-udalosti-vize

---

## SOUHRN PODLE PRIORITY

| Priorita | Počet | Klíčové body |
|----------|-------|--------------|
| 🔴 P0 (kritické bugy + emaily) | 9 | BOD-066, BOD-108–113, BOD-116, BOD-117 |
| 🟠 P1 (důležité funkce + integrace) | 18 | BOD-024–032, BOD-070–071, BOD-073, BOD-082 |
| 🟡 P2 (monetizace, marketing) | 25 | BOD-092–107, BOD-125–139 |
| 🟢 P3 (UX vylepšení) | 23 | BOD-001–023 |
| ⚪ Backlog (architektura, dlouhodobé) | 68 | Ostatní |
