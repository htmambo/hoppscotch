#!/usr/bin/env bash
set -euo pipefail

# build-desktop-macos-x64.sh
# 本地在 macOS x86_64 上复现 .github/workflows/build-hoppscotch-desktop.yml (macos-x64 job)
# 用法:
#   ./scripts/build-desktop-macos-x64.sh [--skip-signing] [--verbose]
# 说明:
#  - 不带 --skip-signing 时，脚本会尝试正常触发 tauri 打包（是否真正 codesign 取决于本地 keychain / 环境变量是否配置）
#  - 可通过 ENV_FILE_CONTENT 环境变量注入 .env 内容（与 workflow 行为一致）

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEB_PATH="$REPO_ROOT/packages/hoppscotch-selfhost-web"
DESKTOP_PATH="$REPO_ROOT/packages/hoppscotch-desktop"
BUNDLER_PATH="$DESKTOP_PATH/crates/webapp-bundler"
DIST_DIR="$REPO_ROOT/dist"

SKIP_SIGNING=false
VERBOSE=false
CROSS_WINDOWS=false

while [[ ${#} -gt 0 ]]; do
  case "$1" in
    -s|--skip-signing) SKIP_SIGNING=true; shift ;;
    -v|--verbose) VERBOSE=true; shift ;;
    -w|--cross-windows) CROSS_WINDOWS=true; shift ;;
    -h|--help)
      cat <<'USAGE'
Usage: build-desktop-macos-x64.sh [--skip-signing] [--verbose] [--cross-windows]

Options:
  --skip-signing    Skip Apple code signing steps and produce unsigned artifacts
  --verbose         Show more logs
  --cross-windows   Cross-compile an unsigned Windows build (x86_64)
  --help            Show this help
USAGE
      exit 0
      ;;
    *) echo "Unknown arg: $1"; exit 2 ;;
  esac
done

if $VERBOSE; then set -x; fi

info(){ echo "[INFO] $*"; }
warn(){ echo "[WARN] $*"; }
err(){ echo "[ERROR] $*"; exit 1; }

# 检查平台
arch=$(uname -m)
if [[ "$arch" != "x86_64" ]]; then
  warn "当前架构: $arch ，此脚本针对 macOS x86_64 (x86_64) 设计。继续执行可能失败。"
  read -p "继续执行? [y/N]: " yn
  if [[ ! "$yn" =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

cd "$REPO_ROOT"
info "工作区: $REPO_ROOT"

# 检查 pnpm 版本与 package.json 声明（尽力检查并提示）
if command -v pnpm >/dev/null 2>&1; then
  installed_pnpm=$(pnpm -v 2>/dev/null || echo "")
  if command -v jq >/dev/null 2>&1 && [[ -f package.json ]]; then
    declared=$(jq -r '.packageManager // empty' package.json || echo "")
    if [[ -n "$declared" ]]; then
      declared_ver=${declared#*pnpm@}
      if [[ -n "$installed_pnpm" && "$installed_pnpm" != "$declared_ver" ]]; then
        warn "本地 pnpm ($installed_pnpm) 与 package.json (pnpm@$declared_ver) 不一致，可能会导致错误。"
      fi
    fi
  fi
else
  warn "未检测到 pnpm，请先安装 pnpm（例如：corepack enable && corepack prepare pnpm@<version> --activate 或 brew install pnpm）。"
fi

# rust target
if command -v rustup >/dev/null 2>&1; then
  info "确保 Rust target: x86_64-apple-darwin"
  rustup target add x86_64-apple-darwin || true
else
  warn "未检测到 rustup，跳过 rust target 安装。若没有 rust，请安装 rust（https://www.rust-lang.org/）。"
fi

# 安装 cargo-tauri (与 workflow 相同的二进制形式)，如果本地已有 tauri 命令则跳过
if command -v tauri >/dev/null 2>&1; then
  info "tauri 命令已存在，跳过下载步骤。"
else
  info "下载并安装 cargo-tauri 二进制到 /usr/local/bin/tauri（需要 sudo）"
  tmpdir=$(mktemp -d -t tauri-bin-XXXX)
  trap 'rm -rf "$tmpdir"' EXIT
  cd "$tmpdir"
  curl -LO "https://github.com/tauri-apps/tauri/releases/download/tauri-cli-v2.2.0/cargo-tauri-x86_64-apple-darwin.zip"
  unzip cargo-tauri-x86_64-apple-darwin.zip
  chmod +x cargo-tauri
  sudo mv cargo-tauri /usr/local/bin/tauri
  cd "$REPO_ROOT"
fi

# .env 管理（与 workflow 保持一致）
if [[ -n "${ENV_FILE_CONTENT:-}" ]]; then
  info "使用 ENV_FILE_CONTENT 环境变量创建 .env"
  echo "$ENV_FILE_CONTENT" > "$REPO_ROOT/.env"
elif [[ -f "$REPO_ROOT/.env" ]]; then
  info "使用仓库内已有 .env"
else
  if [[ -f "$REPO_ROOT/.env.example" ]]; then
    cp "$REPO_ROOT/.env.example" "$REPO_ROOT/.env"
    info "复制 .env.example -> .env"
  else
    warn "未找到 .env 或 .env.example，请手动创建 .env 或通过 ENV_FILE_CONTENT 注入。"
  fi
fi

# 安装 desktop 依赖
info "安装 $DESKTOP_PATH 依赖 (pnpm install)"
pnpm install --dir "$DESKTOP_PATH"

# Build web app
info "安装并构建 web 应用 ($WEB_PATH)"
pnpm install --dir "$WEB_PATH"
pnpm --dir "$WEB_PATH" generate

# Build webapp-bundler
info "构建 webapp-bundler 并打包 webdist -> bundle.zip"
if [[ ! -f "$BUNDLER_PATH/Cargo.toml" ]]; then
  err "找不到 $BUNDLER_PATH/Cargo.toml，请确认路径是否正确。"
fi
cargo build --release --manifest-path "$BUNDLER_PATH/Cargo.toml"
BUNDLER_BIN="$BUNDLER_PATH/target/release/webapp-bundler"
if [[ ! -x "$BUNDLER_BIN" ]]; then
  err "未能找到或执行 $BUNDLER_BIN"
fi
"$BUNDLER_BIN" --input "$WEB_PATH/dist" --output "$DESKTOP_PATH/bundle.zip" --manifest "$DESKTOP_PATH/manifest.json"

# Build Tauri app
info "开始 tauri 构建 (macos x86_64)"

if $CROSS_WINDOWS; then
  info "Cross-compiling for Windows (x86_64)"

  # Ensure mingw toolchain available
  if ! command -v x86_64-w64-mingw32-gcc >/dev/null 2>&1; then
    warn "未检测到 mingw-w64 的交叉编译器 x86_64-w64-mingw32-gcc。尝试通过 Homebrew 安装。"
    if command -v brew >/dev/null 2>&1; then
      info "运行: brew install mingw-w64"
      brew install mingw-w64 || warn "brew 安装 mingw-w64 失败，请手动安装。"
    else
      warn "未检测到 Homebrew，请手动安装 mingw-w64（例如：brew install mingw-w64）然后重试。"
    fi
  fi

  # Add rust target
  if command -v rustup >/dev/null 2>&1; then
    rustup target add x86_64-pc-windows-gnu || true
  fi

  # Set cross linker env vars
  export CC_x86_64_pc_windows_gnu=$(command -v x86_64-w64-mingw32-gcc || true)
  export CARGO_TARGET_X86_64_PC_WINDOWS_GNU_LINKER="$CC_x86_64_pc_windows_gnu"
  export PKG_CONFIG_ALLOW_CROSS=1

  # Build the Windows binary (cargo build only) to avoid running NSIS (makensis)
  info "使用 cargo 进行交叉编译（仅生成可执行文件，不走 tauri bundler）"
  cargo build --release --target x86_64-pc-windows-gnu --manifest-path "$DESKTOP_PATH/src-tauri/Cargo.toml" || err "Windows cargo build failed"

  # Locate built exe(s)
  EXE_DIR="$DESKTOP_PATH/src-tauri/target/x86_64-pc-windows-gnu/release"
  mkdir -p "$DIST_DIR"
  exe_files=( "$EXE_DIR"/*.exe )
  if [[ -e "${exe_files[0]}" ]]; then
    tmpzip="$DIST_DIR/Hoppscotch_SelfHost_win_x64_$(date +%s).zip"
    info "将 Windows 可执行文件打包为 zip: $tmpzip"
    (cd "$EXE_DIR" && zip -r "$tmpzip" *.exe *.dll *.pdb 2>/dev/null) || (zip -r "$tmpzip" *.exe 2>/dev/null) || warn "未能创建 windows zip 包"
    info "Windows 构建产物: $tmpzip"
  else
    warn "未找到 Windows 可执行文件 (expected in $EXE_DIR), 请检查构建输出"
  fi

else
  if $SKIP_SIGNING; then
    info "跳过签名，使用: pnpm --dir $DESKTOP_PATH tauri build --verbose --target x86_64-apple-darwin"
    pnpm --dir "$DESKTOP_PATH" tauri build --verbose --target x86_64-apple-darwin
  else
    info "尝试进行带签名构建（如果本地已正确配置签名与 keychain）"
    # 注意：本地签名需要你已在 keychain 中安装证书并设置相应环境变量
    pnpm --dir "$DESKTOP_PATH" tauri build --verbose --target x86_64-apple-darwin
  fi
fi

# 准备 artifacts
mkdir -p "$DIST_DIR"
info "拷贝产物到 $DIST_DIR"
# dmg
if comp=( $DESKTOP_PATH/src-tauri/target/x86_64-apple-darwin/release/bundle/dmg/*.dmg ); then
  for f in "$DESKTOP_PATH"/src-tauri/target/x86_64-apple-darwin/release/bundle/dmg/*.dmg; do
    if [[ -f "$f" ]]; then
      cp "$f" "$DIST_DIR/Hoppscotch_SelfHost_mac_x64.dmg"
      break
    fi
  done
fi
# tar.gz
if [[ -f "$DESKTOP_PATH/src-tauri/target/x86_64-apple-darwin/release/bundle/macos/Hoppscotch.app.tar.gz" ]]; then
  cp "$DESKTOP_PATH/src-tauri/target/x86_64-apple-darwin/release/bundle/macos/Hoppscotch.app.tar.gz" "$DIST_DIR/Hoppscotch_SelfHost_mac_x64.tar.gz"
  # 签名文件（如果有）
  if [[ -f "$DESKTOP_PATH/src-tauri/target/x86_64-apple-darwin/release/bundle/macos/Hoppscotch.app.tar.gz.sig" ]]; then
    cp "$DESKTOP_PATH/src-tauri/target/x86_64-apple-darwin/release/bundle/macos/Hoppscotch.app.tar.gz.sig" "$DIST_DIR/Hoppscotch_SelfHost_mac_x64.tar.gz.sig"
  fi
fi

info "构建完成，产物目录: $DIST_DIR"
ls -lah "$DIST_DIR" || true

exit 0
