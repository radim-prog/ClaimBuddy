#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${1:-}"

if [[ -n "$ENV_FILE" ]]; then
  if [[ ! -f "$ENV_FILE" ]]; then
    echo "FAIL env file not found: $ENV_FILE" >&2
    exit 1
  fi
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

fail() {
  echo "FAIL $1" >&2
  exit 1
}

warn() {
  echo "WARN $1"
}

pass() {
  echo "PASS $1"
}

require_var() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    fail "missing env $name"
  fi
  pass "env $name"
}

check_file() {
  local path="$1"
  if [[ ! -f "$path" ]]; then
    fail "missing file $path"
  fi
  pass "file $path"
}

check_http() {
  local label="$1"
  local url="$2"
  local code
  code="$(curl -L -sS -o /dev/null -w '%{http_code}' --max-time 10 "$url" || true)"
  if [[ "$code" =~ ^2|3|401|403$ ]]; then
    pass "$label ($code)"
    return 0
  fi
  fail "$label unreachable: $url returned $code"
}

echo "== ClaimBuddy preflight =="
echo "root: $ROOT_DIR"
if [[ -n "$ENV_FILE" ]]; then
  echo "env:  $ENV_FILE"
fi

check_file "$ROOT_DIR/package.json"
check_file "$ROOT_DIR/supabase/claimbuddy.bootstrap.sql"
check_file "$ROOT_DIR/scripts/claimbuddy-deploy.sh"
check_file "$ROOT_DIR/scripts/claimbuddy-smoke.sh"

require_var AUTH_SECRET
require_var NEXT_PUBLIC_APP_URL
require_var NEXT_PUBLIC_CLAIMS_SUPABASE_URL
require_var NEXT_PUBLIC_CLAIMS_SUPABASE_ANON_KEY
require_var CLAIMS_SUPABASE_SERVICE_ROLE_KEY

if [[ "${ALLOW_ACCOUNTING_DB_FALLBACK:-false}" != "false" ]]; then
  warn "ALLOW_ACCOUNTING_DB_FALLBACK is not false"
else
  pass "ALLOW_ACCOUNTING_DB_FALLBACK=false"
fi

check_http "claims supabase auth settings" "${NEXT_PUBLIC_CLAIMS_SUPABASE_URL%/}/auth/v1/settings"

if [[ -n "${BASE_URL:-}" ]]; then
  check_http "claimbuddy app health" "${BASE_URL%/}/api/health"
fi

echo "Preflight OK"
