#!/usr/bin/env sh
set -eu

read_secret() {
  value_name="$1"
  file_name="$2"
  file_path="$(eval "printf '%s' \"\${$file_name:-}\"")"

  if [ -z "$file_path" ]; then
    return
  fi

  if [ ! -r "$file_path" ]; then
    echo "$file_name points to unreadable file: $file_path" >&2
    exit 1
  fi

  value="$(cat "$file_path")"
  export "$value_name=$value"
  unset "$file_name"
}

configure_docker_socket_group() {
  socket="/var/run/docker.sock"
  [ -S "$socket" ] || return 0

  socket_gid="$(stat -c '%g' "$socket")"
  group_name="$(getent group "$socket_gid" | cut -d: -f1 || true)"
  if [ -z "$group_name" ]; then
    group_name="dockerhost"
    groupadd --gid "$socket_gid" "$group_name"
  fi
  usermod --append --groups "$group_name" node
}

if [ "$(id -u)" = "0" ]; then
  read_secret SETUP_TOKEN SETUP_TOKEN_FILE
  configure_docker_socket_group
  exec gosu node "$@"
fi

exec "$@"
