#!/usr/bin/env bash
set -Eeuo pipefail

if [[ "${RELEASE_SMOKE_CONFIRM:-}" != 1 ]]; then
  echo "Questo test elimina container, volumi, database e file temporanei. Imposta RELEASE_SMOKE_CONFIRM=1." >&2
  exit 1
fi

need_cmd() { command -v "$1" >/dev/null || { echo "Comando richiesto mancante: $1" >&2; exit 1; }; }
need_cmd docker
need_cmd curl
need_cmd sha256sum
docker compose version >/dev/null

assets="${RELEASE_ASSET_DIR:?RELEASE_ASSET_DIR richiesto}"
project="ricercacasa-release-smoke-$$"
control_network="${project}-control"
home_dir="$(mktemp -d)"
last_status=""

cleanup() {
  set +e
  docker compose -p "$project" --env-file "$home_dir/release.env" -f "$home_dir/compose.yaml" down -v --remove-orphans >/dev/null 2>&1 || true
  docker compose -p "$project" --env-file "$home_dir/release.env" -f "$home_dir/bootstrap-compose.yaml" down -v --remove-orphans >/dev/null 2>&1 || true
  docker network rm "$control_network" >/dev/null 2>&1 || true
  rm -rf "$home_dir"
}

on_error() {
  code=$?
  echo "Smoke release fallito (exit $code)" >&2
  echo "Ultimo stato installazione: ${last_status:-<vuoto>}" >&2
  docker compose -p "$project" --env-file "$home_dir/release.env" -f "$home_dir/bootstrap-compose.yaml" ps >&2 || true
  docker compose -p "$project" --env-file "$home_dir/release.env" -f "$home_dir/compose.yaml" ps >&2 || true
  docker compose -p "$project" --env-file "$home_dir/release.env" -f "$home_dir/bootstrap-compose.yaml" logs --no-color updater >&2 || true
  docker compose -p "$project" --env-file "$home_dir/release.env" -f "$home_dir/compose.yaml" logs --no-color database migrate backend frontend >&2 || true
  exit "$code"
}

trap on_error ERR
trap cleanup EXIT

for file in install.sh bootstrap-compose.yaml compose.yaml release.env.example manifest.json manifest.schema.json checksums.txt; do
  [[ -f "$assets/$file" ]] || { echo "Asset release mancante: $file" >&2; exit 1; }
done
cp "$assets"/{install.sh,bootstrap-compose.yaml,compose.yaml,release.env.example,manifest.json,manifest.schema.json,checksums.txt} "$home_dir/"
(cd "$home_dir" && sha256sum -c checksums.txt)

mkdir -p "$home_dir/secrets" "$home_dir/state" "$home_dir/backups" "$home_dir/config"
for name in postgres_password app_secret setup_token; do
  head -c 32 /dev/urandom | base64 | tr -d '\n' >"$home_dir/secrets/$name"
  chmod 600 "$home_dir/secrets/$name"
done
cp "$home_dir/release.env.example" "$home_dir/release.env"
chmod 600 "$home_dir/release.env"

export RICERCACASA_HOME="$home_dir"
export HOST_UID="$(id -u)" HOST_GID="$(id -g)"
export COMPOSE_PROJECT_NAME="$project"
export RICERCACASA_CONTROL_NETWORK="$control_network"

docker compose -p "$project" --env-file "$home_dir/release.env" -f "$home_dir/bootstrap-compose.yaml" up -d

updater_ready=0
for _ in {1..60}; do
  if curl -fsS --max-time 2 http://127.0.0.1:8081/health >/dev/null 2>&1; then
    updater_ready=1
    break
  fi
  sleep 2
done
[[ "$updater_ready" = 1 ]] || { echo "Updater bootstrap non healthy" >&2; exit 1; }

post_body="$home_dir/install-start.json"
post_status="$(curl -sS --max-time 10 -o "$post_body" -w '%{http_code}' -X POST http://127.0.0.1:8081/updater/install/start || true)"
if [[ "$post_status" != 202 ]]; then
  echo "POST /updater/install/start HTTP $post_status" >&2
  cat "$post_body" >&2 || true
  exit 1
fi

for _ in {1..180}; do
  last_status="$(curl -fsS --max-time 5 http://127.0.0.1:8081/updater/install/status 2>/dev/null || true)"
  grep -q '"status":"completed"' <<<"$last_status" && break
  grep -q '"status":"failed"' <<<"$last_status" && { echo "$last_status" >&2; exit 1; }
  sleep 2
done
grep -q '"status":"completed"' <<<"$last_status"

frontend_ready=0
for _ in {1..60}; do
  if curl -fsS --max-time 2 http://127.0.0.1:8080/health >/dev/null 2>&1; then
    frontend_ready=1
    break
  fi
  sleep 2
done
[[ "$frontend_ready" = 1 ]] || { echo "Frontend non healthy" >&2; exit 1; }

docker compose -p "$project" --env-file "$home_dir/release.env" -f "$home_dir/compose.yaml" exec -T backend \
  node -e "fetch('http://127.0.0.1:3000/health/ready').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

setup_status="$(curl -fsS --max-time 5 http://127.0.0.1:8081/updater/setup/status)"
grep -q '"ready":true' <<<"$setup_status"
curl -fsS --max-time 5 http://127.0.0.1:8081/updater/status >/dev/null

echo "Smoke release completato con successo"
