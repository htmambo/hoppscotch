#!/usr/bin/env bash
set -euo pipefail

# tauri-build.sh
# Usage: tauri-build.sh <package_dir> <target> [sign_env_var_name]
# Example: tauri-build.sh packages/hoppscotch-desktop x86_64-apple-darwin TAURI_SIGNING_PRIVATE_KEY

if [ "$#" -lt 2 ]; then
  echo "Usage: $0 <package_dir> <target> [sign_env_var_name]" 1>&2
  exit 2
fi

PACKAGE_DIR="$1"
TARGET="$2"
SIGN_ENV_NAME="${3:-TAURI_SIGNING_PRIVATE_KEY}"

echo "[INFO] tauri-build: package=$PACKAGE_DIR target=$TARGET sign_env=$SIGN_ENV_NAME"

# If the signing env var is empty/unset, build without signing; otherwise build with signing.
if [ -z "${!SIGN_ENV_NAME:-}" ]; then
  echo "[INFO] No $SIGN_ENV_NAME provided; building without signing"
  pnpm --dir "$PACKAGE_DIR" tauri build --verbose --target "$TARGET"
else
  echo "[INFO] $SIGN_ENV_NAME provided; building with signing"
  pnpm --dir "$PACKAGE_DIR" tauri build --verbose --target "$TARGET"
fi
