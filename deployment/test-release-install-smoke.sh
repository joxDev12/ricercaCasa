#!/usr/bin/env bash
set -euo pipefail

if [[ "${RELEASE_SMOKE_CONFIRM:-}" != 1 ]]; then
  echo "Questo test elimina container, volumi, database e file temporanei. Imposta RELEASE_SMOKE_CONFIRM=1." >&2
  exit 1
fi

need_cmd() { command -v "$1" >/dev/null || { echo "Comando richiesto mancante: $1" >&2; exit 1; }; }
need_cmd docker
need_cmd curl
docker compose version >/dev/null

assets="${RELEASE_ASSET_DIR:?RELEASE_ASSET_DIR richiesto}"
home_dir="$(mktemp -d)"
cleanup() {
  docker compose --env-file "$home_dir/release.env" -f "$home_dir/bootstrap-compose.yaml" down -v >/dev/null 2>&1 || true
  rm -rf "$home_dir"
}
trap cleanup EXIT

cp "$assets"/{bootstrap-compose.yaml,compose.yaml,release.env.example,manifest.json,manifest.schema.json,checksums.txt} "$home_dir/"
(cd "$home_dir" && sha256sum -c checksums.txt)
mkdir -p "$home_dir/secrets" "$home_dir/state" "$home_dir/backups" "$home_dir/config"
for name in postgres_password app_secret setup_token; do
  head -c 32 /dev/urandom | base64 | tr -d '\n' >"$home_dir/secrets/$name"
  chmod 600 "$home_dir/secrets/$name"
done
cp "$home_dir/release.env.example" "$home_dir/release.env"
chmod 600 "$home_dir/release.env"
export RICERCACASA_HOME="$home_dir"
docker compose --env-file "$home_dir/release.env" -f "$home_dir/bootstrap-compose.yaml" up -d

for _ in {1..60}; do curl -fsS http://127.0.0.1:8081/health >/dev/null && break || sleep 2; done
curl -fsS -X POST http://127.0.0.1:8081/updater/install/start >/dev/null
for _ in {1..180}; do
  status="$(curl -fsS http://127.0.0.1:8081/updater/install/status)"
  grep -q '"status":"completed"' <<<"$status" && break
  grep -q '"status":"failed"' <<<"$status" && { echo "$status" >&2; exit 1; }
  sleep 2
done
grep -q '"status":"completed"' <<<"$status"
curl -fsS http://127.0.0.1:8081/updater/status >/dev/null
