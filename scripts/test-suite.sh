#!/bin/bash
# Test Suite for UcetniWebApp
# Usage: bash scripts/test-suite.sh
# Exit code: 0 = all pass, 1 = any fail

set -e

PORT=3099
BASE_URL="http://localhost:$PORT"
PASS=0
FAIL=0
RESULTS=""

log_pass() {
  PASS=$((PASS + 1))
  RESULTS="$RESULTS\n  ✅ $1"
}

log_fail() {
  FAIL=$((FAIL + 1))
  RESULTS="$RESULTS\n  ❌ $1"
}

cleanup() {
  if [ -n "$SERVER_PID" ]; then
    kill $SERVER_PID 2>/dev/null || true
    wait $SERVER_PID 2>/dev/null || true
  fi
}
trap cleanup EXIT

echo "=========================================="
echo "  UcetniWebApp Test Suite"
echo "=========================================="
echo ""

# ==========================================
# TEST-1: Build
# ==========================================
echo "TEST-1: Build"
if npm run build > /tmp/test-build.log 2>&1; then
  log_pass "Build successful"
else
  log_fail "Build failed (see /tmp/test-build.log)"
  echo ""
  echo "RESULTS:$RESULTS"
  echo ""
  echo "PASS: $PASS  FAIL: $FAIL"
  exit 1
fi
echo ""

# ==========================================
# TEST-2: Smoke test (start server + curl)
# ==========================================
echo "TEST-2: Smoke test"

# Start standalone server
PORT=$PORT node .next/standalone/server.js > /tmp/test-server.log 2>&1 &
SERVER_PID=$!

# Wait for server to be ready (max 15s)
for i in $(seq 1 30); do
  if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL" 2>/dev/null | grep -q "200\|302\|307"; then
    break
  fi
  sleep 0.5
done

# Test public pages
for path in "/" "/login" "/pricing"; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$path" 2>/dev/null)
  if [ "$STATUS" = "200" ] || [ "$STATUS" = "302" ] || [ "$STATUS" = "307" ]; then
    log_pass "GET $path → $STATUS"
  else
    log_fail "GET $path → $STATUS (expected 200/302/307)"
  fi
done
echo ""

# ==========================================
# TEST-3: Auth flow
# ==========================================
echo "TEST-3: Auth flow"

# Login attempt with wrong credentials should fail
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"invalid_user","password":"wrong_pass"}' 2>/dev/null)
if [ "$STATUS" = "401" ] || [ "$STATUS" = "400" ]; then
  log_pass "Invalid login rejected → $STATUS"
else
  log_fail "Invalid login not rejected → $STATUS (expected 401/400)"
fi

# Login with valid credentials
RESPONSE=$(curl -s -D /tmp/test-headers.txt -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"radim\",\"password\":\"${TEST_PASSWORD:-admin123}\"}" 2>/dev/null)
STATUS=$(grep -o "HTTP/[0-9.]* [0-9]*" /tmp/test-headers.txt | tail -1 | grep -o "[0-9]*$")
if [ "$STATUS" = "200" ]; then
  log_pass "Valid login accepted → 200"
  # Extract cookie
  COOKIE=$(grep -i "set-cookie" /tmp/test-headers.txt | head -1 | sed 's/.*: //' | sed 's/;.*//')
else
  log_fail "Valid login failed → $STATUS (expected 200)"
  COOKIE=""
fi

# Test /api/auth/me with cookie
if [ -n "$COOKIE" ]; then
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/auth/me" \
    -H "Cookie: $COOKIE" 2>/dev/null)
  if [ "$STATUS" = "200" ]; then
    log_pass "Auth /me with cookie → 200"
  else
    log_fail "Auth /me with cookie → $STATUS (expected 200)"
  fi
fi

# Test unauthenticated access to protected route
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/auth/me" 2>/dev/null)
if [ "$STATUS" = "401" ] || [ "$STATUS" = "403" ] || [ "$STATUS" = "307" ]; then
  log_pass "Unauthenticated /me rejected → $STATUS"
else
  log_fail "Unauthenticated /me not rejected → $STATUS (expected 401/403/307)"
fi
echo ""

# ==========================================
# TEST-4: Regression (key API endpoints)
# ==========================================
echo "TEST-4: Regression"

if [ -n "$COOKIE" ]; then
  for endpoint in "/api/client/companies" "/api/client/drafts" "/api/client/cases"; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$endpoint" \
      -H "Cookie: $COOKIE" 2>/dev/null)
    if [ "$STATUS" = "200" ]; then
      log_pass "GET $endpoint → 200"
    else
      log_fail "GET $endpoint → $STATUS (expected 200)"
    fi
  done
else
  log_fail "Skipped regression tests — no auth cookie"
fi
echo ""

# ==========================================
# TEST-5: Security checks
# ==========================================
echo "TEST-5: Security"

# Check for leaked credentials in source
LEAKED=$(grep -rn "SUPABASE_SERVICE_ROLE_KEY\|service_role.*eyJ\|sk-[a-zA-Z0-9]\{20,\}" \
  --include="*.ts" --include="*.tsx" --include="*.js" \
  --exclude-dir=node_modules --exclude-dir=.next \
  app/ lib/ components/ 2>/dev/null | grep -v "process.env" | grep -v "\.example" | head -5)
if [ -z "$LEAKED" ]; then
  log_pass "No leaked credentials in source"
else
  log_fail "Potential leaked credentials found:\n$LEAKED"
fi

# Check .env not committed
if git ls-files --cached | grep -q "^\.env$\|^\.env\.local$"; then
  log_fail ".env file is tracked by git"
else
  log_pass ".env files not tracked by git"
fi
echo ""

# ==========================================
# SUMMARY
# ==========================================
echo "=========================================="
echo "  RESULTS"
echo "=========================================="
echo -e "$RESULTS"
echo ""
echo "=========================================="
echo "  PASS: $PASS  FAIL: $FAIL"
echo "=========================================="

if [ $FAIL -gt 0 ]; then
  exit 1
fi
exit 0
