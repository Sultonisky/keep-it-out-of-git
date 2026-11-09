# Templates

## Drop-in script

Use the starter at [`scripts/check-sensitive-paths.sh`](scripts/check-sensitive-paths.sh).

```bash
mkdir -p scripts
cp /path/to/SKILLS-OSS/sensitive-path-guard/scripts/check-sensitive-paths.sh scripts/
chmod +x scripts/check-sensitive-paths.sh
bash scripts/check-sensitive-paths.sh
```

## Stack / product blocked patterns (examples)

Starter script already blocks common private dirs, dumps, keys, and ops
artifacts across domains. Add product-specific paths only when needed:

```bash
# Monorepo app private dirs
'(^|/)apps/api/storage/private/'
'(^|/)backend/storage/app/private/'

# Domain exports with stable filenames
'(^|/)billing/exports/.+\.csv$'
'(^|/)clinical/exports/.+\.zip$'
```

Keep the private path in sync with `AGENTS.md` (see `sensitive-data-git` stack
presets: Laravel vs Nest/Express vs generic).

## Allowed patterns (examples)

```bash
# Non-PII geographic / reference masters
'(^|/)data/geo_regions\.(json|js)$'

# Anonymized stub required by the product
'(^|/)data/reference_stub\.json$'

# Fictional fixtures
'(^|/)tests/Fixtures/.*_(sample|invalid)\.(csv|json)$'
```

## Optional stub content guard

When a tracked stub must stay anonymized, add a content marker check after the
path loop (Python 3 example):

```bash
if git ls-files --error-unmatch data/reference_stub.json >/dev/null 2>&1; then
  if command -v python3 >/dev/null 2>&1; then
    python3 - <<'PY'
import json, sys
from pathlib import Path
path = Path("data/reference_stub.json")
rows = json.loads(path.read_text(encoding="utf-8"))
if not isinstance(rows, list) or not rows:
    print("data/reference_stub.json must be a non-empty anonymized stub list")
    sys.exit(1)
# Fill only in the private product repo — never commit real markers here:
blocked_markers = ()
raw = path.read_text(encoding="utf-8")
for marker in blocked_markers:
    if marker in raw:
        print(f"data/reference_stub.json contains blocked marker: {marker}")
        sys.exit(1)
print("data/reference_stub.json anonymized-stub check passed.")
PY
  fi
fi
```

Do not paste real people names into published OSS examples — fill
`blocked_markers` only inside the private product repo.

## CI step

```yaml
- name: Block sensitive tracked paths
  run: bash scripts/check-sensitive-paths.sh
```

Place this in the same job as gitleaks (see `gitleaks-guard` templates), before
application tests.

## AGENTS.md snippet

```markdown
## Path blocklist

- Script: `scripts/check-sensitive-paths.sh`
- Run locally before commits that touch data/tests/storage paths
- CI `sensitive-data` job runs this script + gitleaks
- Keep real dumps under gitignored storage; allowlist only anonymized stubs
```

## PR checklist

Use the shared template
[`templates/pull_request_template.md`](../templates/pull_request_template.md).
Path-only lines if you already have a PR template:

```markdown
- [ ] No new tracked dumps, `.env`, credential JSON, or `bak/` paths
- [ ] Path-check script still passes (`bash scripts/check-sensitive-paths.sh`)
- [ ] Any new allowlist regex is narrow and documented
```
