# Templates

Copy and adapt these into a target repository. Replace paths and product names.

## AGENTS.md section

```markdown
## Sensitive Data — Git and Tests

Real people data and secrets must never enter git — across **any** domain
(identity, auth, financial, health, CRM, education, infra dumps). Prefer
gitignored **private** local storage (path depends on the stack — document it).

When unsure whether something is sensitive, treat it as sensitive.

### Preferred local location (not git)

- **This repo uses:** `<FILL: e.g. storage/app/private/ or storage/private/>`
- Credential / key material under a gitignored credentials/secrets path
- Optional machine-local backup outside the repo (e.g. external `bak/`)

Presets: Laravel `storage/app/private/`; Nest/Express/Node `storage/private/`
or `var/private/`; unknown stack `storage/private/` or `.data/private/`.

Do **not** place real people or secret files under tracked `data/`, `tests/`,
`public/`, or docs. Never force-add gitignored storage files.

### Never commit (examples — not exhaustive)

- Identity/CRM/HR/education exports (xlsx/csv/json) with real people
- Financial or health payloads naming real individuals
- Seed/snapshot JSON with real identities or live secrets
- `.env*`, private keys, tokens, cloud credential JSON, tfstate, kubeconfigs
- SSH/VPS/deploy key pairs (`id_ed25519`, matching `.pub`, `.ssh/`) — use Actions secrets
- DB/search/queue dumps, HAR/CI/deploy logs, heap/core dumps with PII/secrets

### Allowed in git

- Non-PII reference masters
- Fully fictional test fixtures
- `.env.example` (placeholders only)

### Tests, factories, seeders

- Use `Sample…` / `Test…` or Faker only — never production rows
- Prefer fake codes `TST…` / `DEV…` unless asserting a product code-prefix
- Demo seeders must not run in production without a documented exception

### Logging / history

- Never log government IDs, phones, passwords/PINs, tokens, card data, or raw
  biometric / identity-document payloads
- If secrets leaked into git: rotate + remove from tree; do not rewrite history
  unless explicitly requested

### Agents: user-private material (skip)

- Do **not** search, open, or print SSH/VPS/deploy keys (`id_ed25519`, `.pub`,
  `.ssh/`), live `.env`, or cloud credential JSON
- Deploy auth belongs in GitHub Actions secrets / local SSH agent — never git
- If keys are tracked: untrack + rotate guidance only — do not load key contents
```

## Cursor rule (`.cursor/rules/sensitive-data-git.mdc`) — additive

Same policy as `AGENTS.md`. Add this for nicer Cursor discovery; keep `AGENTS.md`
+ CI as the source of truth so other agents still work.

```markdown
---
description: Keep real people data and secrets out of git; anonymize tests
alwaysApply: true
---

# Sensitive data and anonymized tests

Follow the repo AGENTS.md sensitive-data policy: prefer gitignored local
storage, never commit real people dumps or credentials, anonymize
tests/factories/seeders (`Sample…` / `Test…` / Faker), redact identity fields
from logs, and do not rewrite git history unless explicitly asked.
```

## Pull request template

Prefer the shared drop-in:
[`templates/pull_request_template.md`](../templates/pull_request_template.md)
→ copy to `.github/pull_request_template.md`.

Sensitive-data section only (if you already have a PR template):

```markdown
## Sensitive data / security

- [ ] No real people-data files, credentials, `bak/`, or hard-coded real PII
- [ ] Sensitive operational files stay in gitignored local storage (not git)
- [ ] New/changed tests & seeders use `Sample…` / `Test…` / Faker only
- [ ] Logs / audit diffs never include passwords, PINs, tokens, national IDs, or phones
- [ ] Path blocklist / gitleaks (if present) still pass — allowlist changes are narrow and justified
```

## Path-check script

Prefer the maintained starter in sibling skill
[`sensitive-path-guard/scripts/check-sensitive-paths.sh`](../sensitive-path-guard/scripts/check-sensitive-paths.sh)
(blocked/allowed regex arrays, CI-ready). Adapt allow/block lists per product.
Keep scanning diffs for hard-coded PII — the script is a guard, not a guarantee.

## GitHub Copilot / other instruction files — additive

Reuse the same `AGENTS.md` sensitive-data section (or this short form) in
`.github/copilot-instructions.md` or any agent instruction file:

```markdown
## Sensitive data

Never add real people data or credentials to the repository. Prefer gitignored
local storage for imports and dumps. Tests and seeders must use fictional
`Sample…` / `Test…` identities or Faker. Never log passwords, PINs, tokens,
national IDs, or phone numbers. If secrets leak: rotate and remove from the
tree; do not rewrite history unless explicitly requested.
```
