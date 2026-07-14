#!/usr/bin/env bash
set -euo pipefail

DEPLOY_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(cd "$DEPLOY_DIR/.." && pwd)"
RELEASE_ENV_PATH="$DEPLOY_DIR/release.env"
SMOKE_TEST_CONFIRM="${SMOKE_TEST_CONFIRM:-0}"

compose() {
  env_file="$RELEASE_ENV_PATH"

  if [ ! -f "$env_file" ]; then
    env_file="$DEPLOY_DIR/release.env.example"
  fi

  docker compose --env-file "$env_file" -f "$DEPLOY_DIR/compose.yaml" "$@"
}

load_release_env() {
  set -a
  . "$RELEASE_ENV_PATH"
  set +a
}

print_failure_context() {
  echo >&2
  echo "========== SMOKE TEST FAILURE CONTEXT ==========" >&2
  compose ps >&2 || true
  compose logs --no-color migrate >&2 || true
  compose logs --no-color backend >&2 || true
  compose logs --no-color frontend >&2 || true
  compose logs --no-color updater >&2 || true
}

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Comando richiesto mancante: $1" >&2
    exit 1
  }
}

require_confirmation() {
  echo "ATTENZIONE: questo smoke test elimina volumi Docker, database, secret e configurazioni locali." >&2
  echo "Per continuare usa: SMOKE_TEST_CONFIRM=1 ./deployment/test-install-smoke.sh" >&2

  if [ "$SMOKE_TEST_CONFIRM" != "1" ]; then
    exit 1
  fi
}

wait_http() {
  url="$1"
  attempts="${2:-60}"

  while [ "$attempts" -gt 0 ]; do
    if curl -fsS "$url" >/dev/null 2>&1; then
      return 0
    fi

    attempts=$((attempts - 1))
    sleep 2
  done

  echo "Timeout su $url" >&2
  exit 1
}

wait_backend_health() {
  path="$1"
  attempts="${2:-60}"

  while [ "$attempts" -gt 0 ]; do
    if compose exec -T backend node -e "fetch('http://127.0.0.1:3000$path').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"; then
      return 0
    fi

    attempts=$((attempts - 1))
    sleep 2
  done

  echo "Timeout backend $path" >&2
  exit 1
}

wait_service_running() {
  service="$1"
  attempts="${2:-60}"

  while [ "$attempts" -gt 0 ]; do
    if [ "$(compose ps --status running --services | rg "^${service}$" || true)" = "$service" ]; then
      return 0
    fi

    attempts=$((attempts - 1))
    sleep 2
  done

  echo "Servizio non running: $service" >&2
  exit 1
}

assert_clean_generated_files() {
  if [ -n "$(git -C "$REPO_DIR" status --short -- deployment/secrets deployment/state deployment/release.env)" ]; then
    echo "Artifact deploy visibili in git status" >&2
    git -C "$REPO_DIR" status --short -- deployment/secrets deployment/state deployment/release.env >&2
    exit 1
  fi
}

need_cmd docker
need_cmd curl
need_cmd rg
need_cmd node
require_confirmation
trap print_failure_context ERR

compose down -v --remove-orphans || true
rm -rf "$DEPLOY_DIR/secrets" "$DEPLOY_DIR/state" "$DEPLOY_DIR/release.env"

"$DEPLOY_DIR/install.sh"
assert_clean_generated_files

load_release_env

wait_service_running backend
wait_service_running frontend
wait_service_running updater
wait_backend_health /health/live
wait_backend_health /health/ready
wait_http "http://127.0.0.1:${APP_PORT}/health"
wait_http "http://127.0.0.1:${UPDATER_PORT}/health"
wait_http "http://127.0.0.1:${UPDATER_PORT}/updater/setup/status"

curl -fsS \
  -X POST \
  -H 'Content-Type: application/json' \
  -d '{"displayName":"Mario","contactEmail":"mario@example.com","locale":"it-IT","timezone":"Europe/Rome","scrapingConsent":true,"confirmSetup":true}' \
  "http://127.0.0.1:${UPDATER_PORT}/updater/setup/complete" >/dev/null

if curl -fsS \
  -X POST \
  -H 'Content-Type: application/json' \
  -d '{"displayName":"Mario","contactEmail":"mario@example.com","locale":"it-IT","timezone":"Europe/Rome","scrapingConsent":true,"confirmSetup":true}' \
  "http://127.0.0.1:${UPDATER_PORT}/updater/setup/complete" >/dev/null 2>&1
then
  echo "Setup completato piu di una volta" >&2
  exit 1
fi

compose exec -T backend node -e "fetch('http://127.0.0.1:3000/api/settings/profile', {method: 'PATCH', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({displayName: 'Mario Due', contactEmail: 'mario2@example.com', locale: 'en-GB', timezone: 'Europe/London'})}).then(async (response) => { if (!response.ok) { console.error(await response.text()); process.exit(1); } }).catch((error) => { console.error(error); process.exit(1); })"

compose down
compose up -d migrate backend frontend updater

wait_service_running backend
wait_backend_health /health/ready

compose exec -T backend node -e "fetch('http://127.0.0.1:3000/api/settings').then((response) => response.json()).then((payload) => { const data = payload.data || {}; if (data.displayName !== 'Mario Due' || data.contactEmail !== 'mario2@example.com' || data.locale !== 'en-GB' || data.timezone !== 'Europe/London') { console.error(JSON.stringify(payload)); process.exit(1); } }).catch((error) => { console.error(error); process.exit(1); })"

compose down -v --remove-orphans
rm -rf "$DEPLOY_DIR/secrets" "$DEPLOY_DIR/state" "$DEPLOY_DIR/release.env"

"$DEPLOY_DIR/install.sh"
assert_clean_generated_files
load_release_env
wait_http "http://127.0.0.1:${UPDATER_PORT}/updater/setup/status"

setup_phase="$(curl -fsS "http://127.0.0.1:${UPDATER_PORT}/updater/setup/status" | node -e "let raw=''; process.stdin.on('data', (chunk) => raw += chunk); process.stdin.on('end', () => { const payload = JSON.parse(raw); process.stdout.write(payload.data.phase || ''); });")"

if [ "$setup_phase" != "ready" ]; then
  echo "Installazione pulita dopo down -v non pronta: $setup_phase" >&2
  exit 1
fi

compose down -v --remove-orphans
rm -rf "$DEPLOY_DIR/secrets" "$DEPLOY_DIR/state" "$DEPLOY_DIR/release.env"
