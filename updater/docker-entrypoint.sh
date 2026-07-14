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
  usermod --append --groups "$group_name" "$runtime_user"
}

validate_id() {
  case "$2" in
    ''|*[!0-9]*) echo "$1 must be a positive integer" >&2; exit 1 ;;
  esac
  [ "$2" -gt 0 ] || { echo "$1 must be a positive integer" >&2; exit 1; }
}

configure_runtime_user() {
  uid="${HOST_UID:-1000}"
  gid="${HOST_GID:-1000}"
  validate_id HOST_UID "$uid"
  validate_id HOST_GID "$gid"
  runtime_user=node

  existing_group="$(getent group "$gid" | cut -d: -f1 || true)"
  if [ -n "$existing_group" ]; then
    runtime_group="$existing_group"
  else
    runtime_group=runtime
    if getent group "$runtime_group" >/dev/null 2>&1; then
      echo "group runtime exists with incompatible GID" >&2
      exit 1
    fi
    groupadd --gid "$gid" "$runtime_group"
  fi

  existing_user="$(getent passwd "$uid" | cut -d: -f1 || true)"
  if [ -n "$existing_user" ]; then
    runtime_user="$existing_user"
    user_gid="$(id -g "$runtime_user")"
    [ "$user_gid" = "$gid" ] || usermod --gid "$gid" "$runtime_user"
  elif [ "$uid" = "1000" ]; then
    runtime_user=node
    usermod --uid "$uid" --gid "$gid" node
  else
    runtime_user=runtime
    if id "$runtime_user" >/dev/null 2>&1; then
      echo "user runtime exists with incompatible UID" >&2
      exit 1
    fi
    useradd --uid "$uid" --gid "$gid" --no-create-home --shell /usr/sbin/nologin "$runtime_user"
  fi
}

if [ "$(id -u)" = "0" ]; then
  read_secret SETUP_TOKEN SETUP_TOKEN_FILE
  configure_runtime_user
  configure_docker_socket_group
  exec gosu "$runtime_user" "$@"
fi

exec "$@"
