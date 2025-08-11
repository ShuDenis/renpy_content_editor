#!/usr/bin/env sh
if [ -z "$husky_skip_init" ]; then
  debug () {
    [ "$HUSKY_DEBUG" = "1" ] && echo "husky (debug) - $1"
  }

  readonly hook="$0"
  readonly husky_dir="$(dirname -- "$hook")"

  debug "starting $hook"
  if [ "$HUSKY" = "skip" ]; then
    debug "HUSKY env variable is set to skip, skipping hook"
    exit 0
  fi

  readonly husky_skip_init=1
  export husky_skip_init

  sh -e "$husky_dir/../../node_modules/husky/lib/bin.js" "$hook" "$@"
  exitCode="$?"

  if [ "$exitCode" != 0 ]; then
    echo "husky - $hook failed (exit code $exitCode)"
  fi

  exit "$exitCode"
fi
