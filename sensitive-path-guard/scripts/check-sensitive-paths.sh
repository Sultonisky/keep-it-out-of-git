#!/usr/bin/env bash
# Fail if git-tracked paths look like real people data, secrets, or local backups.
# Copy into a target repo as scripts/check-sensitive-paths.sh and adapt regexes.
# Patterns are predictive across domains (not HR-only). Extend from AGENTS.md.
set -euo pipefail

root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$root"

blocked_regexes=(
  # Env / backups / DB
  '(^|/)\.env($|\.)'
  '(^|/)bak/'
  '\.bak$'
  '\.(sql|dump|backup)$'

  # People / ops tabular dumps under tracked data trees
  '(^|/)data/.*\.(xlsx|xls|xlsm|ods|csv|tsv)$'
  '(^|/)(exports|imports|uploads)/.*\.(xlsx|xls|xlsm|ods|csv|tsv|zip)$'

  # Credential / key material filenames
  'service[-_]?account.*\.json$'
  'credentials\.json$'
  '(^|/).*credentials.*\.(json|ini|yml|yaml)$'
  '\.(pem|p12|pfx)$'
  # SSH / VPS / deploy keys — private AND public stay out of git
  # (use GitHub Actions secrets / local SSH agent; never commit "just the .pub")
  '(^|/)\.ssh/'
  '(^|/)id_(rsa|ed25519|ecdsa|dsa)(|\.pub)$'
  '(^|/).*_(rsa|ed25519|ecdsa|dsa)(|\.pub)$'
  '(^|/)(deploy|vps|server|github|ci|actions?)[_-]?.*(key|ssh)(|\.pub)$'
  '(^|/).*ed25519.*\.(key|pem|pub)$'
  '(^|/)\.kube/config$'
  'kubeconfig'
  '\.tfstate(|\.backup)$'

  # Private app storage (Laravel + generic)
  '(^|/).*storage/app/private/'
  '(^|/)(storage|var|\.data)/private/'
  '(^|/).*/(credentials|secrets)/'
  '(^|/)uploads/private/'

  # Ops / debug artifacts that often contain tokens or PII
  '(^|/)deploy[-_]?logs?/'
  '(^|/)ci-logs?/'
  '\.har$'
  'heapdump'
  '(^|/)core\.[0-9]+$'
)

allowed_regexes=(
  '(^|/)\.env\.example$'
  # '(^|/)data/reference_stub\.json$'
  # '(^|/)data/geo_regions\.(json|js)$'
  # '(^|/)tests/Fixtures/.*_(sample|invalid)\.(csv|json)$'
)

is_allowed() {
  local path="$1"
  local re
  for re in "${allowed_regexes[@]}"; do
    if [[ "$path" =~ $re ]]; then
      return 0
    fi
  done
  return 1
}

fail=0
while IFS= read -r path; do
  [[ -z "$path" ]] && continue
  if is_allowed "$path"; then
    continue
  fi
  for re in "${blocked_regexes[@]}"; do
    if [[ "$path" =~ $re ]]; then
      echo "BLOCKED tracked path: $path  (matched /$re/)"
      fail=1
      break
    fi
  done
done < <(git ls-files -z | tr '\0' '\n')

if [[ "$fail" -ne 0 ]]; then
  echo
  echo "Sensitive-path check failed. Keep real people data, credentials, and bak/ out of git."
  echo "Prefer gitignored private storage (see AGENTS.md for this repo's path)."
  exit 1
fi

echo "Sensitive-path check passed."
