# Next Steps (co dodělat)

## P0 (nutné před ostrou reklamou)
1. Zapnout produkční email notifikace (Resend klíče) a ověřit doručitelnost.
2. Zapnout Stripe checkout + webhook end-to-end test.
3. Zapnout Gemini OCR/chat a provést limit/abuse test.
4. Upravit kontaktní identity v legal textech (emaily/ICO/telefon/obchodní údaje).
5. Přidat základní monitoring + alerty (service down, API 5xx spike).

## P1 (doporučené)
1. Audit log export + retence.
2. Backup/export Notion dat (denní snapshot do souboru).
3. Hardening: rate limits per endpoint, upload malware scan, security headers review.
4. Admin UX polish: bulk status changes, quick filters, saved views.

## P2 (produkt)
1. Klientský self-service portál (tracking případu + upload klienta).
2. Rozšíření notifikací (SMS/WhatsApp fallback).
3. Reporting panel (konverze, SLA, revenue by status).
