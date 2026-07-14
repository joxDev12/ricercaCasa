#!/usr/bin/env bash
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

if [ ! -f "$SECRETS_DIR/app_secret" ]; then
  random_secret >"$SECRETS_DIR/app_secret"
fi

if [ ! -f "$SECRETS_DIR/setup_token" ]; then
  random_secret >"$SECRETS_DIR/setup_token"
fi

if [ ! -f "$RELEASE_ENV_PATH" ]; then
  cp "$DEPLOY_DIR/release.env.example" "$RELEASE_ENV_PATH"
fi

echo "Directory installazione: $APP_DIR"
echo "Avvio stack..."
docker compose \
  --env-file "$RELEASE_ENV_PATH" \
  -f "$DEPLOY_DIR/compose.yaml" \
  up -d --build database backend frontend updater

echo "Wizard: http://127.0.0.1:8081/"
echo "Dashboard: http://127.0.0.1:8080/"
