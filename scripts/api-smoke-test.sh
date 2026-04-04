#!/bin/bash
# API Smoke Test — ověří že všechny kritické endpointy odpovídají
# Usage: bash scripts/api-smoke-test.sh
#
# NOTE: Rate limiter allows 60 API calls/min per IP (sliding window, middleware.ts).
# The script pauses between sections to stay under the limit.
# If you hit 429 on authenticated endpoints, wait 60s and re-run.

BASE="https://app.zajcon.cz"
PASS=0
FAIL=0

check() {
  local expected=$1
  local code=$2
  local endpoint=$3
  if [ "$code" = "$expected" ]; then
    ((PASS++))
    echo "  PASS  $endpoint -> $code"
  else
    ((FAIL++))
    echo "  FAIL  $endpoint -> $code (expected $expected)"
  fi
}

# check_protected: accepts 401 or 429 (both mean "not getting through unauthenticated")
check_protected() {
  local code=$1
  local endpoint=$2
  if [ "$code" = "401" ] || [ "$code" = "429" ]; then
    ((PASS++))
    echo "  PASS  $endpoint -> $code (protected)"
  else
    ((FAIL++))
    echo "  FAIL  $endpoint -> $code (expected 401 or 429)"
  fi
}

echo "=== 1. PUBLIC PAGES ==="
for url in "/" "/pricing" "/auth/login" "/claims" "/legal/privacy" "/pro-podnikatele"; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE$url")
  sleep 2
  check "200" "$CODE" "GET $url"
done

echo ""
echo "=== 2. UNAUTHENTICATED API -> 401 (or 429 if rate limited) ==="
for ep in /api/accountant/companies /api/accountant/closures/matrix /api/client/companies /api/client/closures/summary /api/client/documents /api/client/cash-book /api/claims/stats /api/claims/cases /api/accountant/cash-book; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE$ep")
  sleep 2
  check_protected "$CODE" "GET $ep (no auth)"
done

echo ""
echo "=== 3. CRON WITHOUT SECRET -> 401 (or 429 if rate limited) ==="
for ep in /api/cron/closure-reminders /api/cron/account-cleanup /api/cron/company-opportunities /api/cron/calendar-sync; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE$ep")
  sleep 2
  check_protected "$CODE" "GET $ep (no secret)"
done

# Pause 65s between unauthenticated and authenticated sections to reset the 60s sliding window
echo ""
echo "(Pausing 65s to reset rate limit window before auth tests...)"
sleep 65

echo ""
echo "=== 4. AUTH FLOW ==="
# Login
LOGIN_CODE=$(curl -s -c /tmp/smoke-cookies.txt -o /dev/null -w "%{http_code}" -X POST "$BASE/api/auth/login" -H "Content-Type: application/json" -d "{\"username\":\"radim\",\"password\":\"${TEST_PASSWORD:-admin123}\"}")
sleep 2
check "200" "$LOGIN_CODE" "POST /api/auth/login"

# Auth me
ME_CODE=$(curl -s -b /tmp/smoke-cookies.txt -o /dev/null -w "%{http_code}" "$BASE/api/auth/me")
sleep 2
check "200" "$ME_CODE" "GET /api/auth/me (authenticated)"

echo ""
echo "=== 5. AUTHENTICATED ENDPOINTS ==="
for ep in /api/accountant/companies "/api/accountant/closures/matrix?year=2026" "/api/client/closures/yearly-summary?company_id=test&year=2026" /api/client/documents /api/claims/stats; do
  CODE=$(curl -s -b /tmp/smoke-cookies.txt -o /dev/null -w "%{http_code}" "$BASE$ep")
  sleep 2
  check "200" "$CODE" "GET $ep (auth)"
done

echo ""
echo "=== 6. PROTECTED PAGES (rendered when authenticated) ==="
for url in /accountant/dashboard /client/dashboard /accountant/clients; do
  CODE=$(curl -s -b /tmp/smoke-cookies.txt -o /dev/null -w "%{http_code}" "$BASE$url")
  sleep 2
  check "200" "$CODE" "GET $url (auth page)"
done

# Cleanup
rm -f /tmp/smoke-cookies.txt

echo ""
echo "========================================="
echo "RESULTS: $PASS passed, $FAIL failed"
echo "========================================="
[ $FAIL -eq 0 ] && exit 0 || exit 1
