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

if [ "$(id -u)" = "0" ]; then
  read_secret SETUP_TOKEN SETUP_TOKEN_FILE
  exec gosu node "$@"
fi

exec "$@"
