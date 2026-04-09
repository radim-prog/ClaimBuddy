#!/bin/bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:3020}"
TEST_USERNAME="${TEST_USERNAME:-}"
TEST_PASSWORD="${TEST_PASSWORD:-}"
TEST_COMPANY_ID="${TEST_COMPANY_ID:-}"
RUN_UPLOAD_DELETE_CHECK="${RUN_UPLOAD_DELETE_CHECK:-0}"

COOKIE_JAR="$(mktemp /tmp/claimbuddy-smoke-cookies.XXXXXX)"
UPLOAD_FILE="$(mktemp /tmp/claimbuddy-smoke-upload.XXXXXX.txt)"
PASS=0
FAIL=0

cleanup() {
  rm -f "$COOKIE_JAR" "$UPLOAD_FILE"
}
trap cleanup EXIT

log_pass() {
  PASS=$((PASS + 1))
  echo "PASS  $1"
}

log_fail() {
  FAIL=$((FAIL + 1))
  echo "FAIL  $1"
}

expect_code() {
  local expected="$1"
  local url="$2"
  local label="$3"
  local extra_args=("${@:4}")
  local code
  code=$(curl -sS -o /dev/null -w "%{http_code}" "${extra_args[@]}" "$url")
  if [ "$code" = "$expected" ]; then
    log_pass "${label} -> ${code}"
  else
    log_fail "${label} -> ${code} (expected ${expected})"
  fi
}

echo "=== ClaimBuddy Smoke ==="

expect_code "200" "$BASE_URL/claims" "GET /claims"
expect_code "200" "$BASE_URL/auth/login" "GET /auth/login"
expect_code "200" "$BASE_URL/api/health" "GET /api/health"

if [ -z "$TEST_USERNAME" ] || [ -z "$TEST_PASSWORD" ]; then
  echo "Skipping authenticated smoke: TEST_USERNAME / TEST_PASSWORD not set"
  [ "$FAIL" -eq 0 ] && exit 0 || exit 1
fi

LOGIN_CODE=$(curl -sS -c "$COOKIE_JAR" -o /tmp/claimbuddy-login.json -w "%{http_code}" \
  -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"${TEST_USERNAME}\",\"password\":\"${TEST_PASSWORD}\"}")

if [ "$LOGIN_CODE" = "200" ]; then
  log_pass "POST /api/auth/login -> 200"
else
  log_fail "POST /api/auth/login -> ${LOGIN_CODE}"
  [ "$FAIL" -eq 0 ] && exit 0 || exit 1
fi

expect_code "200" "$BASE_URL/api/auth/me" "GET /api/auth/me" -b "$COOKIE_JAR"
expect_code "200" "$BASE_URL/accountant/claims/dashboard" "GET /accountant/claims/dashboard" -b "$COOKIE_JAR"

if [ -n "$TEST_COMPANY_ID" ]; then
  expect_code "200" "$BASE_URL/api/claims/company-profile?company_id=${TEST_COMPANY_ID}" "GET /api/claims/company-profile" -b "$COOKIE_JAR"
  expect_code "200" "$BASE_URL/api/claims/messages?company_id=${TEST_COMPANY_ID}" "GET /api/claims/messages" -b "$COOKIE_JAR"
  expect_code "200" "$BASE_URL/api/claims/tasks?company_id=${TEST_COMPANY_ID}" "GET /api/claims/tasks" -b "$COOKIE_JAR"
  expect_code "200" "$BASE_URL/api/claims/files?company_id=${TEST_COMPANY_ID}" "GET /api/claims/files" -b "$COOKIE_JAR"
  expect_code "200" "$BASE_URL/claims/clients/${TEST_COMPANY_ID}/messages" "GET /claims/clients/[companyId]/messages" -b "$COOKIE_JAR"
  expect_code "200" "$BASE_URL/claims/clients/${TEST_COMPANY_ID}/tasks" "GET /claims/clients/[companyId]/tasks" -b "$COOKIE_JAR"
  expect_code "200" "$BASE_URL/claims/clients/${TEST_COMPANY_ID}/files" "GET /claims/clients/[companyId]/files" -b "$COOKIE_JAR"

  if [ "$RUN_UPLOAD_DELETE_CHECK" = "1" ]; then
    printf 'claimbuddy smoke upload delete\n' > "$UPLOAD_FILE"
    UPLOAD_RESPONSE=$(curl -sS -b "$COOKIE_JAR" \
      -F "company_id=${TEST_COMPANY_ID}" \
      -F "file=@${UPLOAD_FILE};type=text/plain" \
      "$BASE_URL/api/claims/files?company_id=${TEST_COMPANY_ID}")
    FILE_ID=$(printf '%s' "$UPLOAD_RESPONSE" | node -e "const fs=require('fs');const input=fs.readFileSync(0,'utf8');const data=JSON.parse(input);process.stdout.write(data.file?.id||'')")

    if [ -n "$FILE_ID" ]; then
      log_pass "POST /api/claims/files -> created ${FILE_ID}"
      expect_code "200" "$BASE_URL/api/claims/files/${FILE_ID}" "DELETE /api/claims/files/[id]" -b "$COOKIE_JAR" -X DELETE
    else
      log_fail "POST /api/claims/files -> invalid response"
    fi
  fi
else
  echo "Skipping company-specific smoke: TEST_COMPANY_ID not set"
fi

echo "=== Result: ${PASS} passed, ${FAIL} failed ==="
[ "$FAIL" -eq 0 ]
