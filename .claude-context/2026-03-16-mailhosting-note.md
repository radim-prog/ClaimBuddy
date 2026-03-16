# Mailhosting zajcon.cz — Wedos
**Datum:** 2026-03-16
**Kategorie:** infrastruktura

## Stav
Radim zaplatil Wedos mailhosting za zajcon.cz. Čeká se na zprovoznění (hodiny).

## Akční body po zprovoznění

### 1. Vytvořit emailové schránky
- [ ] noreply@zajcon.cz
- [ ] fakturace@zajcon.cz
- [ ] info@zajcon.cz
- [ ] podpora@zajcon.cz
- [ ] kancelar@zajcon.cz

### 2. Nastavit v aplikaci (.env.local)
```
SENDGRID_FROM_EMAIL=noreply@zajcon.cz
DOCUMENT_INBOX_EMAIL=kancelar@zajcon.cz
ADMIN_EMAIL=radim.zajicek@icloud.com
```

### 3. Nakonfigurovat v Ecomail
- Přidat zajcon.cz jako odesílací doménu
- Nastavit DKIM + SPF záznamy (Wedos DNS)
- Přidat ECOMAIL_API_KEY do .env.local (viz BOD-066)
- Přidat ECOMAIL_LIST_ID_ACCOUNTANTS + ECOMAIL_LIST_ID_CLIENTS

### 4. SPF/DKIM DNS záznamy (přidat ve Wedos DNS)
- SPF: `v=spf1 include:_spf.ecomail.cz include:sendgrid.net ~all`
- DKIM: dle instrukcí Ecomailu

### 5. Admin sekce email (BOD-087 ✅)
Jde do Admin > Provoz > Email adresy a zadat adresy přes UI.
API: POST /api/accountant/admin/email-settings
