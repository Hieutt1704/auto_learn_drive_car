# shellcheck shell=bash
# source file: cung cấp hàm retry <cmd...> — chạy tối đa 2 lần, cách nhau 0.4s.
retry() {
  if "$@"; then
    return 0
  fi
  sleep 0.4
  "$@"
}
