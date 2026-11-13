#!/usr/bin/env bash
# Keep It Out of Git — alternate installer (Unix / Git Bash / curl).
# Preferred entry for most users: npx (cross-platform). See README.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# If this script was curled into bash without a checkout, clone a temp copy.
if [[ ! -f "$ROOT/bin/keep-it-out-of-git.mjs" ]]; then
  echo "install.sh must run from a keep-it-out-of-git checkout,"
  echo "or use the preferred installer:"
  echo "  npx github:Sultonisky/keep-it-out-of-git init"
  exit 1
fi

if command -v node >/dev/null 2>&1; then
  exec node "$ROOT/bin/keep-it-out-of-git.mjs" "$@"
fi

echo "Node.js not found — using bash fallback (skills + path script only)."
echo "For full portable core / updates, prefer:"
echo "  npx --yes github:Sultonisky/keep-it-out-of-git@main init"
echo "  npx --yes github:Sultonisky/keep-it-out-of-git@main update"
echo

TARGET="${PWD}"
FORCE=0
CURSOR=0
DRY=0
CMD="${1:-init}"
shift || true

while [[ $# -gt 0 ]]; do
  case "$1" in
    --target) TARGET="$(cd "$2" && pwd)"; shift 2 ;;
    --force) FORCE=1; shift ;;
    --cursor) CURSOR=1; shift ;;
    --dry-run) DRY=1; shift ;;
    --all|--agents-md|--pr|--gitleaks|--ci)
      echo "Flag '$1' requires Node. Prefer: npx github:Sultonisky/keep-it-out-of-git init $1"
      shift
      ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

if [[ "$CMD" != "init" ]]; then
  echo "Bash fallback only supports: init"
  echo "Prefer: npx github:Sultonisky/keep-it-out-of-git $CMD"
  exit 1
fi

SKILLS=(sensitive-data-git safe-demo-data sensitive-path-guard gitleaks-guard)

copy_dir() {
  local src="$1" dest="$2"
  if [[ -e "$dest" && "$FORCE" -ne 1 ]]; then
    echo "skip (exists): $dest  (use --force)"
    return
  fi
  if [[ "$DRY" -eq 1 ]]; then
    echo "[dry-run] copy dir $src -> $dest"
    return
  fi
  mkdir -p "$(dirname "$dest")"
  rm -rf "$dest"
  cp -R "$src" "$dest"
  echo "wrote $dest/"
}

copy_file() {
  local src="$1" dest="$2"
  if [[ -e "$dest" && "$FORCE" -ne 1 ]]; then
    echo "skip (exists): $dest  (use --force)"
    return
  fi
  if [[ "$DRY" -eq 1 ]]; then
    echo "[dry-run] copy $src -> $dest"
    return
  fi
  mkdir -p "$(dirname "$dest")"
  cp "$src" "$dest"
  chmod +x "$dest" 2>/dev/null || true
  echo "wrote $dest"
}

echo "Keep It Out of Git — init (bash fallback)"
echo "target: $TARGET"
mkdir -p "$TARGET/.agents/skills"

for skill in "${SKILLS[@]}"; do
  copy_dir "$ROOT/$skill" "$TARGET/.agents/skills/$skill"
done

if [[ "$CURSOR" -eq 1 ]]; then
  mkdir -p "$TARGET/.cursor/skills"
  for skill in "${SKILLS[@]}"; do
    copy_dir "$ROOT/$skill" "$TARGET/.cursor/skills/$skill"
  done
fi

copy_file \
  "$ROOT/sensitive-path-guard/scripts/check-sensitive-paths.sh" \
  "$TARGET/scripts/check-sensitive-paths.sh"

echo
echo "Next: fill AGENTS.md private path; run bash scripts/check-sensitive-paths.sh"
echo "Full options: npx github:Sultonisky/keep-it-out-of-git init --help"
