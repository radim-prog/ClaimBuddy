#!/bin/bash
set -euo pipefail

APP_DIR="${APP_DIR:-/root/Projects/ClaimBuddy}"
BRANCH="${BRANCH:-claimbuddy-split}"
SERVICE="${SERVICE:-claimbuddy-webapp}"
HOST="${HOST:-127.0.0.1}"
PORT="${PORT:-3020}"
ENV_FILE="${ENV_FILE:-$APP_DIR/.env.local}"
LOG="${LOG:-/var/log/claimbuddy-deploy.log}"
HEALTHCHECK_URL="${HEALTHCHECK_URL:-http://${HOST}:${PORT}/api/health}"
BOOTSTRAP_SQL="${BOOTSTRAP_SQL:-$APP_DIR/supabase/claimbuddy.bootstrap.sql}"
INSTALL_CMD="${INSTALL_CMD:-npm ci}"
BUILD_CMD="${BUILD_CMD:-npm run build}"
START_CMD="${START_CMD:-npm run start -- -H ${HOST} -p ${PORT}}"
RUN_DB_BOOTSTRAP="${RUN_DB_BOOTSTRAP:-1}"
RUN_SMOKE_TEST="${RUN_SMOKE_TEST:-0}"
SMOKE_TEST_CMD="${SMOKE_TEST_CMD:-$APP_DIR/scripts/claimbuddy-smoke.sh}"

mkdir -p "$(dirname "$LOG")"
touch "$LOG"

log() {
  echo "$(date '+%Y-%m-%d %H:%M:%S') | $*" | tee -a "$LOG"
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    log "Missing required command: $1"
    exit 1
  fi
}

load_env_file() {
  if [ ! -f "$ENV_FILE" ]; then
    log "Missing env file: $ENV_FILE"
    exit 1
  fi

  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a

  export NODE_ENV=production
}

require_env() {
  local name="$1"
  if [ -z "${!name:-}" ]; then
    log "Missing required env: $name"
    exit 1
  fi
}

verify_required_envs() {
  require_env AUTH_SECRET
  require_env NEXT_PUBLIC_APP_URL
  require_env NEXT_PUBLIC_CLAIMS_SUPABASE_URL
  require_env NEXT_PUBLIC_CLAIMS_SUPABASE_ANON_KEY
  require_env CLAIMS_SUPABASE_SERVICE_ROLE_KEY
}

bootstrap_database() {
  if [ "${RUN_DB_BOOTSTRAP}" != "1" ]; then
    log "Skipping DB bootstrap (RUN_DB_BOOTSTRAP=${RUN_DB_BOOTSTRAP})"
    return
  fi

  if [ -z "${CLAIMBUDDY_DB_URL:-}" ]; then
    log "Skipping DB bootstrap (CLAIMBUDDY_DB_URL not set)"
    return
  fi

  if [ ! -f "$BOOTSTRAP_SQL" ]; then
    log "Missing bootstrap SQL: $BOOTSTRAP_SQL"
    exit 1
  fi

  log "Applying ClaimBuddy bootstrap schema"
  psql "$CLAIMBUDDY_DB_URL" -v ON_ERROR_STOP=1 -f "$BOOTSTRAP_SQL" >> "$LOG" 2>&1
}

rollback_to_previous_commit() {
  if [ -z "${PREVIOUS_SHA:-}" ]; then
    log "Rollback skipped: PREVIOUS_SHA not set"
    return
  fi

  log "Rolling back to ${PREVIOUS_SHA}"
  git checkout --detach "$PREVIOUS_SHA" >> "$LOG" 2>&1
  load_env_file
  verify_required_envs
  eval "$INSTALL_CMD" >> "$LOG" 2>&1
  eval "$BUILD_CMD" >> "$LOG" 2>&1
  systemctl restart "$SERVICE" >> "$LOG" 2>&1
}

run_smoke_test() {
  if [ "${RUN_SMOKE_TEST}" != "1" ]; then
    log "Skipping smoke test (RUN_SMOKE_TEST=${RUN_SMOKE_TEST})"
    return 0
  fi

  if [ ! -x "$SMOKE_TEST_CMD" ]; then
    log "Smoke test script missing or not executable: $SMOKE_TEST_CMD"
    return 1
  fi

  log "Running post-deploy smoke test"
  BASE_URL="http://${HOST}:${PORT}" "$SMOKE_TEST_CMD" >> "$LOG" 2>&1
}

check_health() {
  local http_code
  http_code=$(curl -sS -o /tmp/claimbuddy-health.json -w "%{http_code}" "$HEALTHCHECK_URL" || true)
  if [ "$http_code" != "200" ]; then
    log "Healthcheck failed: HTTP ${http_code}"
    if [ -f /tmp/claimbuddy-health.json ]; then
      cat /tmp/claimbuddy-health.json >> "$LOG" 2>&1 || true
    fi
    return 1
  fi
  return 0
}

main() {
  require_command git
  require_command npm
  require_command curl
  require_command systemctl
  if [ "${RUN_DB_BOOTSTRAP}" = "1" ] && [ -n "${CLAIMBUDDY_DB_URL:-}" ]; then
    require_command psql
  fi

  cd "$APP_DIR"
  PREVIOUS_SHA="$(git rev-parse HEAD)"
  log "Starting ClaimBuddy deploy from ${PREVIOUS_SHA}"

  git fetch origin >> "$LOG" 2>&1
  git checkout "$BRANCH" >> "$LOG" 2>&1
  git pull --ff-only origin "$BRANCH" >> "$LOG" 2>&1

  local new_sha
  new_sha="$(git rev-parse HEAD)"
  log "Checked out ${new_sha}"

  load_env_file
  verify_required_envs
  bootstrap_database

  log "Installing dependencies"
  eval "$INSTALL_CMD" >> "$LOG" 2>&1

  log "Building application"
  eval "$BUILD_CMD" >> "$LOG" 2>&1

  log "Restarting ${SERVICE}"
  systemctl restart "$SERVICE" >> "$LOG" 2>&1
  sleep 10

  if ! check_health; then
    log "Deploy healthcheck failed, starting rollback"
    rollback_to_previous_commit
    exit 1
  fi

  if ! run_smoke_test; then
    log "Deploy smoke test failed, starting rollback"
    rollback_to_previous_commit
    exit 1
  fi

  log "ClaimBuddy deploy successful: ${PREVIOUS_SHA} -> ${new_sha}"
}

main "$@"
