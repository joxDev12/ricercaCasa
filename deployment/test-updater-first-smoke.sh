#!/usr/bin/env bash
set -Eeuo pipefail

if [[ "${UPDATER_SMOKE_CONFIRM:-}" != 1 ]]; then
  echo "Smoke distruttivo: imposta UPDATER_SMOKE_CONFIRM=1" >&2
  exit 1
fi
need_cmd() { command -v "$1" >/dev/null || { echo "Comando richiesto mancante: $1" >&2; exit 1; }; }
need_cmd docker
need_cmd curl
docker compose version >/dev/null
wait_http() {
  url="$1"
  for _ in {1..60}; do curl -fsS "$url" >/dev/null && return 0; sleep 2; done
  return 1
}
fail() { echo "$1" >&2; return 1; }

registry_name="ricercacasa-smoke-registry-$$"
registry_port="${UPDATER_SMOKE_REGISTRY_PORT:-5501}"
project="ricercacasa-smoke-$$"
backend_port="${UPDATER_SMOKE_BACKEND_PORT:-$((13000 + $$ % 1000))}"
home_dir="$(mktemp -d "$PWD/.updater-smoke.XXXXXX")"
last_body_file="$home_dir/last-response.body"
last_body=""
registry="127.0.0.1:${registry_port}"
control_network="${project}-control"

cleanup() {
  set +e
  trap - ERR
  docker compose -p "$project" --env-file "$home_dir/release.env" -f "$home_dir/compose.yaml" down -v --remove-orphans
  docker compose -p "$project" --env-file "$home_dir/release.env" -f "$home_dir/bootstrap-compose.yaml" down -v --remove-orphans
  docker network rm "$control_network" >/dev/null 2>&1
  docker rm -f "$registry_name" >/dev/null 2>&1
  rm -rf "$home_dir"
}
on_error() {
  code=$?
  echo "Smoke updater-first fallito (exit $code)" >&2
  echo "Ultimo body ricevuto:" >&2
  if [[ -n "$last_body" ]]; then printf '%s\n' "$last_body" >&2; else echo "<vuoto>" >&2; fi
  echo "Bootstrap compose ps:" >&2
  docker compose -p "$project" --env-file "$home_dir/release.env" -f "$home_dir/bootstrap-compose.yaml" ps >&2 || true
  echo "Release compose ps:" >&2
  docker compose -p "$project" --env-file "$home_dir/release.env" -f "$home_dir/compose.yaml" ps >&2 || true
  docker compose -p "$project" --env-file "$home_dir/release.env" -f "$home_dir/compose.yaml" logs --no-color migrate backend frontend updater >&2 || true
  echo "Bootstrap updater logs:" >&2
  docker compose -p "$project" --env-file "$home_dir/release.env" -f "$home_dir/bootstrap-compose.yaml" logs --no-color updater >&2 || true
  echo "installation.json:" >&2
  stat -c '%n uid=%u gid=%g mode=%a size=%s' "$home_dir/state/installation.json" >&2 || true
  cat "$home_dir/state/installation.json" >&2 || true
  echo "PID1 UID/GID:" >&2
  docker compose -p "$project" --env-file "$home_dir/release.env" -f "$home_dir/bootstrap-compose.yaml" exec -T --user root updater awk '/^(Uid|Gid):/{print $1, $2}' /proc/1/status >&2 || true
  for path in "$home_dir" "$home_dir/state" "$home_dir/secrets" "$home_dir/backups"; do
    stat -c '%n uid=%u gid=%g mode=%a' "$path" >&2 || true
  done
  exit "$code"
}
trap on_error ERR
trap cleanup EXIT

docker run -d --name "$registry_name" -p "${registry_port}:5000" registry:2 >/dev/null
for _ in {1..30}; do curl -fsS "http://${registry}/v2/" >/dev/null && break || sleep 1; done
for image in backend frontend updater; do
  context="$image"
  [[ "$image" == frontend ]] && context="ricercaCasa"
  docker build -t "${registry}/ricercacasa-${image}:smoke" "$context"
  docker push "${registry}/ricercacasa-${image}:smoke" >/dev/null
done

mkdir -p "$home_dir/secrets" "$home_dir/state" "$home_dir/backups" "$home_dir/config"
for name in postgres_password app_secret setup_token; do
  head -c 32 /dev/urandom | base64 | tr -d '\n' >"$home_dir/secrets/$name"
  chmod 600 "$home_dir/secrets/$name"
done
cp deployment/compose.release.yaml "$home_dir/compose.yaml"
cp deployment/bootstrap-compose.yaml "$home_dir/bootstrap-compose.yaml"
cp deployment/release.env.example "$home_dir/release.env"
chmod 600 "$home_dir/release.env"
sed -i "s#ghcr.io/joxdev12/ricercacasa-backend:3.0.0#${registry}/ricercacasa-backend:smoke#g; s#ghcr.io/joxdev12/ricercacasa-frontend:3.0.0#${registry}/ricercacasa-frontend:smoke#g; s#ghcr.io/joxdev12/ricercacasa-updater:1.0.0#${registry}/ricercacasa-updater:smoke#g" "$home_dir/compose.yaml" "$home_dir/bootstrap-compose.yaml"

digest="$(printf '%064d' 0)"
printf '%s\n' "{\"schemaVersion\":1,\"platformVersion\":\"3.0.0\",\"updaterVersion\":\"1.0.0\",\"minimumUpdaterVersion\":\"1.0.0\",\"images\":{\"backend\":{\"reference\":\"${registry}/ricercacasa-backend@sha256:${digest}\",\"version\":\"3.0.0\"},\"frontend\":{\"reference\":\"${registry}/ricercacasa-frontend@sha256:${digest}\",\"version\":\"3.0.0\"},\"updater\":{\"reference\":\"${registry}/ricercacasa-updater@sha256:${digest}\",\"version\":\"1.0.0\"}},\"assets\":{\"compose\":{\"name\":\"compose.yaml\",\"sha256\":\"${digest}\"},\"releaseEnv\":{\"name\":\"release.env.example\",\"sha256\":\"${digest}\"}},\"database\":{\"migrationMode\":\"forward-only\",\"backupRequired\":false},\"releaseNotes\":[]}" >"$home_dir/manifest.json"
chmod 600 "$home_dir/manifest.json"

export RICERCACASA_HOME="$home_dir" ALLOWED_IMAGE_NAMESPACE="$registry" COMPOSE_PROJECT_NAME="$project" BACKEND_PORT="$backend_port"
export HOST_UID="$(id -u)" HOST_GID="$(id -g)"
export RICERCACASA_CONTROL_NETWORK="$control_network"
docker compose -p "$project" --env-file "$home_dir/release.env" -f "$home_dir/bootstrap-compose.yaml" up -d
echo "[pre-install] verifica servizi applicativi assenti"
if docker compose -p "$project" --env-file "$home_dir/release.env" -f "$home_dir/compose.yaml" ps --status running --services | grep -Eq '^(database|migrate|backend|frontend)$'; then
  echo "FAIL pre-install: servizio applicativo attivo prima di install/start" >&2
  exit 1
fi
echo "[pre-install] updater health"
if ! wait_http http://127.0.0.1:8081/health; then
  echo "FAIL pre-install: updater health" >&2
  exit 1
fi
echo "[pre-install] docker info come utente runtime"
runtime_user="$(docker compose -p "$project" --env-file "$home_dir/release.env" -f "$home_dir/bootstrap-compose.yaml" exec -T --user root updater getent passwd "$HOST_UID" | cut -d: -f1 | tr -d '\r')"
if [[ -z "$runtime_user" ]] || ! docker compose -p "$project" --env-file "$home_dir/release.env" -f "$home_dir/bootstrap-compose.yaml" exec -T --user "$runtime_user" updater docker info >/dev/null; then
  echo "FAIL pre-install: docker info come utente runtime" >&2
  exit 1
fi
echo "[pre-install] docker compose version come utente runtime"
if ! docker compose -p "$project" --env-file "$home_dir/release.env" -f "$home_dir/bootstrap-compose.yaml" exec -T --user "$runtime_user" updater docker compose version >/dev/null; then
  echo "FAIL pre-install: docker compose version come utente runtime" >&2
  exit 1
fi
echo "[pre-install] UID numerico PID 1"
pid1_uid="$(docker compose -p "$project" --env-file "$home_dir/release.env" -f "$home_dir/bootstrap-compose.yaml" exec -T --user root updater awk '/^Uid:/{print $2}' /proc/1/status | tr -d '\r')" || {
  echo "FAIL pre-install: lettura UID PID 1" >&2
  exit 1
}
echo "UID PID 1: ${pid1_uid}"
pid1_gid="$(docker compose -p "$project" --env-file "$home_dir/release.env" -f "$home_dir/bootstrap-compose.yaml" exec -T --user root updater awk '/^Gid:/{print $2}' /proc/1/status | tr -d '\r')" || {
  echo "FAIL pre-install: lettura GID PID 1" >&2
  exit 1
}
if [[ "$pid1_uid" = 0 || "$pid1_uid" != "$HOST_UID" || "$pid1_gid" != "$HOST_GID" ]]; then
  echo "FAIL pre-install: PID1 uid/gid ${pid1_uid}/${pid1_gid}, atteso ${HOST_UID}/${HOST_GID}" >&2
  exit 1
fi
echo "[pre-install] POST /updater/install/start"
post_body="$home_dir/post-install.json"
post_status="$(curl -sS -o "$post_body" -w '%{http_code}' -X POST http://127.0.0.1:8081/updater/install/start || true)"
if [[ "$post_status" != 202 ]]; then
  echo "FAIL pre-install: POST /updater/install/start HTTP ${post_status}" >&2
  cat "$post_body" >&2
  exit 1
fi

status=""
for _ in {1..180}; do
  status="$(curl -fsS http://127.0.0.1:8081/updater/install/status)"
  grep -q '"status":"completed"' <<<"$status" && break
  grep -q '"status":"failed"' <<<"$status" && { echo "$status" >&2; exit 1; }
  sleep 2
done
grep -q '"status":"completed"' <<<"$status"
echo "[post-install] backend health/ready via rete control"
if ! docker compose -p "$project" --env-file "$home_dir/release.env" -f "$home_dir/bootstrap-compose.yaml" exec -T --user "$runtime_user" updater curl -fsS http://backend:3000/health/ready >/dev/null; then
  echo "FAIL post-install: backend health/ready via rete control" >&2
  exit 1
fi
echo "[post-install] frontend health"
docker compose -p "$project" --env-file "$home_dir/release.env" -f "$home_dir/compose.yaml" ps
wait_http http://127.0.0.1:8080/health
echo "[post-install] backend ready"
wait_http http://127.0.0.1:8081/health
for _ in {1..60}; do
  docker compose -p "$project" --env-file "$home_dir/release.env" -f "$home_dir/compose.yaml" exec -T backend node -e "fetch('http://127.0.0.1:3000/health/ready').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))" && break
  sleep 2
done
echo "[post-install] setup status"
setup_status=""
for _ in {1..60}; do
  setup_status="$(curl -fsS http://127.0.0.1:8081/updater/setup/status 2>/dev/null || true)"
  grep -q '"ready":true' <<<"$setup_status" && break
  sleep 2
done
if ! grep -q '"ready":true' <<<"$setup_status"; then
  echo "FAIL post-install: setup status non ready: ${setup_status:-<vuoto>}" >&2
  exit 1
fi
echo "[post-install] secret ownership"
test "$(stat -c '%a' "$home_dir/secrets/postgres_password")" = 600
for secret in postgres_password app_secret setup_token; do
  secret_stat="$(stat -c '%u %g %a' "$home_dir/secrets/$secret")"
  [[ "$secret_stat" == "$HOST_UID $HOST_GID 600" ]] || {
    echo "Secret $secret owner/mode non valido: $secret_stat" >&2
    exit 1
  }
done
test -s "$home_dir/state/installation.json"
job_id="$(printf '%s' "$status" | sed -n 's/.*"jobId":"\([^"]*\)".*/\1/p')"
completed_at="$(printf '%s' "$status" | sed -n 's/.*"completedAt":"\([^"]*\)".*/\1/p')"
[[ -n "$job_id" && -n "$completed_at" ]]
test -s "$home_dir/state/logs/${job_id}.log"
echo "[post-install] state/log persistence"
echo "[post-install] restart updater"
docker compose -p "$project" --env-file "$home_dir/release.env" -f "$home_dir/bootstrap-compose.yaml" restart updater
healthy=0
for _ in {1..60}; do
  if http_code="$(curl -sS --max-time 2 -o "$last_body_file" -w '%{http_code}' http://127.0.0.1:8081/health 2>/dev/null)"; then
    last_body="$(<"$last_body_file")"
    if [[ "$http_code" = 200 ]]; then
      healthy=1
      break
    fi
  fi
  sleep 2
done
if [[ "$healthy" != 1 ]]; then
  fail "FAIL post-install: updater non tornato healthy dopo restart"
fi

status_reachable=0
post_restart_status=""
for _ in {1..60}; do
  if http_code="$(curl -sS --max-time 2 -o "$last_body_file" -w '%{http_code}' http://127.0.0.1:8081/updater/install/status 2>/dev/null)"; then
    last_body="$(<"$last_body_file")"
    if [[ "$http_code" = 200 ]]; then
      status_reachable=1
      post_restart_status="$last_body"
      grep -q '"status":"completed"' <<<"$post_restart_status" && break
    fi
  fi
  sleep 2
done
if [[ "$status_reachable" != 1 ]]; then
  fail "FAIL post-install: endpoint install/status non raggiungibile dopo restart"
fi
if ! grep -q '"status":"completed"' <<<"$post_restart_status"; then
  fail "FAIL post-install: stato dopo restart diverso da completed"
fi
post_restart_job_id="$(printf '%s' "$post_restart_status" | sed -n 's/.*"jobId":"\([^"]*\)".*/\1/p')"
post_restart_completed_at="$(printf '%s' "$post_restart_status" | sed -n 's/.*"completedAt":"\([^"]*\)".*/\1/p')"
if [[ "$post_restart_job_id" != "$job_id" || "$post_restart_completed_at" != "$completed_at" ]]; then
  fail "FAIL post-install: jobId/completedAt cambiati dopo restart"
fi
