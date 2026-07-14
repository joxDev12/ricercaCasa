#!/usr/bin/env sh
set -eu
umask 077

RELEASE_URL="${RELEASE_URL:-https://github.com/joxDev12/ricercaCasa/releases/download/v3.0.0}"
HOME_DIR="${RICERCACASA_HOME:-$HOME/.ricercacasa}"
BOOTSTRAP_COMPOSE="$HOME_DIR/bootstrap-compose.yaml"

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || { echo "Comando richiesto mancante: $1" >&2; exit 1; }
}

need_cmd curl
need_cmd docker
docker compose version >/dev/null 2>&1 || { echo "Docker Compose v2 richiesto" >&2; exit 1; }

mkdir -p "$HOME_DIR" "$HOME_DIR/secrets" "$HOME_DIR/state/jobs" "$HOME_DIR/state/logs" "$HOME_DIR/state/manifests" "$HOME_DIR/backups" "$HOME_DIR/config"

download() {
  file="$1"
  tmp="$HOME_DIR/.${file}.tmp"
  curl -fsSL "$RELEASE_URL/$file" -o "$tmp"
  mv "$tmp" "$HOME_DIR/$file"
}

download checksums.txt
for file in install.sh bootstrap-compose.yaml compose.yaml release.env.example manifest.json manifest.schema.json; do
  download "$file"
done

if command -v sha256sum >/dev/null 2>&1; then
  (cd "$HOME_DIR" && sha256sum -c checksums.txt)
else
  (cd "$HOME_DIR" && shasum -a 256 -c checksums.txt)
fi

for name in postgres_password app_secret setup_token; do
  if [ ! -f "$HOME_DIR/secrets/$name" ]; then
    if command -v openssl >/dev/null 2>&1; then
      openssl rand -hex 32 >"$HOME_DIR/secrets/$name"
    else
      head -c 48 /dev/urandom | base64 | tr -d '\n' >"$HOME_DIR/secrets/$name"
    fi
  fi
  chmod 600 "$HOME_DIR/secrets/$name"
done

if [ ! -f "$HOME_DIR/release.env" ]; then
  cp "$HOME_DIR/release.env.example" "$HOME_DIR/release.env"
  chmod 600 "$HOME_DIR/release.env"
fi

export RICERCACASA_HOME="$HOME_DIR"
export HOST_UID="$(id -u)" HOST_GID="$(id -g)"
docker compose --env-file "$HOME_DIR/release.env" -f "$BOOTSTRAP_COMPOSE" up -d
echo "Updater: http://127.0.0.1:${UPDATER_PORT:-8081}"
