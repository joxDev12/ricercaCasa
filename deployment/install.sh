#!/usr/bin/env bash
umask 077
set -eu

DEPLOY_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$(cd "$DEPLOY_DIR/.." && pwd)"
SECRETS_DIR="$DEPLOY_DIR/secrets"
STATE_DIR="$DEPLOY_DIR/state"
MANIFEST_DIR="$STATE_DIR/manifests"
RELEASE_ENV_PATH="$DEPLOY_DIR/release.env"

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Comando richiesto mancante: $1" >&2
    exit 1
  }
}

stat_mode() {
  stat -c '%a' "$1"
}

verify_private_file() {
  mode="$(stat_mode "$1")"

  if [ "$mode" != "600" ]; then
    echo "Permessi non sicuri per $1: $mode" >&2
    exit 1
  fi
}

random_secret() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex 32
    return
  fi

  tr -dc 'A-Za-z0-9' </dev/urandom | head -c 64
}

need_cmd docker

mkdir -p "$SECRETS_DIR" "$MANIFEST_DIR"

if [ ! -f "$SECRETS_DIR/postgres_password" ]; then
  random_secret >"$SECRETS_DIR/postgres_password"
fi
chmod 600 "$SECRETS_DIR/postgres_password"
verify_private_file "$SECRETS_DIR/postgres_password"

if [ ! -f "$SECRETS_DIR/app_secret" ]; then
  random_secret >"$SECRETS_DIR/app_secret"
fi
chmod 600 "$SECRETS_DIR/app_secret"
verify_private_file "$SECRETS_DIR/app_secret"

if [ ! -f "$SECRETS_DIR/setup_token" ]; then
  random_secret >"$SECRETS_DIR/setup_token"
fi
chmod 600 "$SECRETS_DIR/setup_token"
verify_private_file "$SECRETS_DIR/setup_token"

if [ ! -f "$RELEASE_ENV_PATH" ]; then
  cp "$DEPLOY_DIR/release.env.example" "$RELEASE_ENV_PATH"
fi
chmod 600 "$RELEASE_ENV_PATH"

echo "Directory installazione: $APP_DIR"
echo "Esecuzione migrazioni..."
if ! docker compose \
  --env-file "$RELEASE_ENV_PATH" \
  -f "$DEPLOY_DIR/compose.yaml" \
  up --build --abort-on-container-exit --exit-code-from migrate migrate
then
  echo "Migrazioni fallite. Installazione interrotta." >&2
  exit 1
fi

echo "Avvio stack..."
docker compose \
  --env-file "$RELEASE_ENV_PATH" \
  -f "$DEPLOY_DIR/compose.yaml" \
  up -d backend frontend updater

echo "Wizard: http://127.0.0.1:8081/"
echo "Dashboard: http://127.0.0.1:8080/"
