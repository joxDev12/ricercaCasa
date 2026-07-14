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

read_release_value() {
  key="$1"
  default_value="$2"
  value="$(grep -E "^${key}=" "$RELEASE_ENV_PATH" 2>/dev/null | tail -n 1 | cut -d '=' -f 2- || true)"

  if [ -n "$value" ]; then
    printf '%s\n' "$value"
    return
  fi

  printf '%s\n' "$default_value"
}

random_secret() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex 32
    return
  fi

  tr -dc 'A-Za-z0-9' </dev/urandom | head -c 64
}

need_cmd docker
if ! docker info >/dev/null 2>&1; then
  echo "Docker daemon non raggiungibile" >&2
  exit 1
fi

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

APP_PORT_VALUE="$(read_release_value APP_PORT 8080)"
UPDATER_PORT_VALUE="$(read_release_value UPDATER_PORT 8081)"

echo "Wizard: http://127.0.0.1:${UPDATER_PORT_VALUE}/"
echo "Dashboard: http://127.0.0.1:${APP_PORT_VALUE}/"
