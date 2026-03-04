# Deployment Runbook (PU)

## 1. Ověření služby
```bash
systemctl is-active claimbuddy-pu.service caddy
curl -I https://pu.zajcon.cz
```

## 2. Build + restart
```bash
cd /root/Projects/PU/ClaimBuddy
npm run type-check
npm run build
systemctl restart claimbuddy-pu.service
```

## 3. Důležité konfigurace
- App env: `/etc/claimbuddy-pu.env`
- Service: `/etc/systemd/system/claimbuddy-pu.service`
- Reverse proxy: `/etc/caddy/Caddyfile`

## 4. Env minimální sada
- Povinné:
  - `NOTION_TOKEN`
  - `NOTION_CASES_DB_ID`
  - `ADMIN_PANEL_PASSWORD`
  - `ADMIN_SESSION_TOKEN`
  - `APP_URL`
  - `NEXT_PUBLIC_APP_URL`
- Volitelné (features):
  - `GOOGLE_AI_API_KEY`
  - `RESEND_API_KEY`
  - `RESEND_FROM_EMAIL`
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`

## 5. Smoke test
```bash
# public
curl -I https://pu.zajcon.cz
curl -I https://pu.zajcon.cz/cases/new

# admin guard
curl -I https://pu.zajcon.cz/admin

# login + admin API
curl -c /tmp/pp.cookies -X POST https://pu.zajcon.cz/api/admin/auth/login \
  -H 'content-type: application/json' \
  --data '{"password":"<ADMIN_PANEL_PASSWORD>"}'

curl -b /tmp/pp.cookies https://pu.zajcon.cz/api/admin/cases
```

## 6. Při změně Caddy configu
```bash
systemctl restart caddy
journalctl -u caddy -n 80 --no-pager
```
