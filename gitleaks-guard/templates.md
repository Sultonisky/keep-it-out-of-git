# Templates

Copy and adapt. Pin a current stable gitleaks release; bump intentionally.

## `gitleaks.toml` (starter)

```toml
title = "Project gitleaks"

[extend]
useDefault = true

[allowlist]
description = "Non-secret project paths"
paths = [
  '''gitleaks\.toml''',
  '''\.env\.example''',
  # '''tests/Fixtures/.*''',          # only if fixtures are anonymized + fake
  # '''docs/examples/.*\.md''',        # only if example secrets are placeholders
]
```

### Allowlist with intentional test stubs

```toml
title = "Project gitleaks"

[extend]
useDefault = true

[allowlist]
description = "Non-secret project paths and intentional test stubs"
paths = [
  '''gitleaks\.toml''',
  '''\.env\.example''',
  '''tests/Fixtures/.*''',
  '''.+\.test\.[jt]sx?$''',
  '''.+\.spec\.[jt]sx?$''',
]
```

Only enable test/fixture globs after confirming those files never hold live
credentials.

## GitHub Actions job (`sensitive-data`)

```yaml
jobs:
  sensitive-data:
    name: Sensitive data guards
    runs-on: ubuntu-latest
    steps:
      - name: Checkout source
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Block sensitive tracked paths
        run: bash scripts/check-sensitive-paths.sh

      - name: Install gitleaks
        env:
          GITLEAKS_VERSION: "8.24.0"
        run: |
          curl -sSL "https://github.com/gitleaks/gitleaks/releases/download/v${GITLEAKS_VERSION}/gitleaks_${GITLEAKS_VERSION}_linux_x64.tar.gz" \
            | tar -xz gitleaks
          sudo mv gitleaks /usr/local/bin/gitleaks
          gitleaks version

      - name: Scan for secrets
        run: gitleaks detect --source . --config gitleaks.toml --verbose --redact --exit-code 1
```

Point later jobs at `needs: [sensitive-data]` so app tests do not run if secrets
are found.

### Gitleaks-only (no path script yet)

Omit the `Block sensitive tracked paths` step only as a temporary bootstrap.
When the repo handles people data, add the path blocklist from
[`sensitive-path-guard`](../sensitive-path-guard/SKILL.md).

## Pre-commit hook sketch (optional)

```bash
#!/usr/bin/env bash
set -euo pipefail
gitleaks protect --staged --config gitleaks.toml --verbose --redact --exit-code 1
```

Keep CI as the source of truth even if local hooks exist.

## AGENTS.md snippet

```markdown
## Secret scanning (gitleaks)

- Config: `gitleaks.toml` (`useDefault = true`, minimal allowlist)
- CI job `sensitive-data` runs `gitleaks detect` with `--redact --exit-code 1`
- Local: `gitleaks detect --source . --config gitleaks.toml --verbose --redact --exit-code 1`
- Do not widen the allowlist to hide real secrets; rotate and remove instead
```

## PR checklist

Use the shared template
[`templates/pull_request_template.md`](../templates/pull_request_template.md)
(includes path/gitleaks gate). If you only need the secrets lines:

```markdown
- [ ] No new credentials, tokens, or private keys in the diff
- [ ] `gitleaks.toml` allowlist changes are justified and narrow
- [ ] CI `sensitive-data` / gitleaks job is green
```
