---
name: gitleaks-guard
description: >-
  Set up and operate gitleaks secret scanning: gitleaks.toml, CI job, local
  detect/protect commands, allowlist hygiene, and finding triage. Use when
  adding secret scanning, fixing gitleaks CI failures, editing allowlists,
  reviewing leaked credentials, or pairing with sensitive-data / path-blocklist
  guards. Complements the sensitive-data-git skill.
---

# Gitleaks Guard

Add secret scanning that fails CI when credentials leak into the tree. Pair with
path blocklists and anonymized-fixture policy (`sensitive-data-git`) — gitleaks
catches **secret-shaped content**; path checks catch dumps/PII files that are
not secret regex hits. For the full sensitive taxonomy (PII beyond secrets),
see [`sensitive-catalog.md`](../sensitive-data-git/sensitive-catalog.md).

## When this skill applies

- Adding or updating `gitleaks.toml`
- Wiring a `sensitive-data` (or equivalent) CI job
- Triaging `gitleaks detect` failures
- Deciding whether an allowlist entry is justified
- Running local scans before commit/PR

## Core rules

1. **Extend defaults** — start from `[extend] useDefault = true`; do not invent a
   full rule set unless required.
2. **Fail closed** — CI must use `--exit-code 1` (or equivalent) so findings block
   merge.
3. **Redact in logs** — always pass `--redact` in CI so secrets are not echoed.
4. **Pin the version** — pin `GITLEAKS_VERSION` in CI; do not float to `latest`.
5. **Allowlist sparingly** — allow only known non-secret paths (e.g. `.env.example`,
   anonymized fixtures). Never allowlist real credential paths “to make CI green”.
6. **Do not weaken guards** without an explicit user request.
7. **On real leak:** rotate/revoke, remove from tree, stop. Do not rewrite history
   unless the user explicitly asks.

## Relationship to sibling skills

| Guard | Catches |
|---|---|
| [`sensitive-path-guard`](../sensitive-path-guard/SKILL.md) | Tracked dumps, `.env`, people xlsx/csv under bad paths |
| This skill (gitleaks) | API keys, tokens, private keys, high-entropy secrets in content |
| [`sensitive-data-git`](../sensitive-data-git/SKILL.md) | Policy + anonymized fixtures (PII that is not a secret regex hit) |

Use all three when possible.

## Minimal config

Repo-root `gitleaks.toml`:

```toml
title = "Project gitleaks"

[extend]
useDefault = true

[allowlist]
description = "Non-secret project paths"
paths = [
  '''gitleaks\.toml''',
  '''\.env\.example''',
]
```

Add path allowlist entries only for tracked files that are intentionally
non-secret and known to false-positive. Prefer fixing the file (use placeholders)
over growing the allowlist.

Full templates: [templates.md](templates.md).

## Local commands

From the repo root (config present):

```bash
# Scan working tree + git history (CI-style)
gitleaks detect --source . --config gitleaks.toml --verbose --redact --exit-code 1

# Scan uncommitted changes only (pre-commit style)
gitleaks protect --staged --config gitleaks.toml --verbose --redact --exit-code 1
```

Install: https://github.com/gitleaks/gitleaks#installing

## CI expectations

Recommended job shape (run **before** app tests):

1. `actions/checkout` with `fetch-depth: 0` (history scan)
2. Optional: `bash scripts/check-sensitive-paths.sh`
3. Install pinned gitleaks release binary
4. `gitleaks detect --source . --config gitleaks.toml --verbose --redact --exit-code 1`

Do not continue the pipeline if this job fails.

## Allowlist hygiene

**OK to allowlist**

- `gitleaks.toml` itself
- `.env.example` with placeholders
- Documented anonymized fixtures that trip entropy rules
- Generated docs that contain fake example keys clearly marked as examples

**Not OK**

- `.env`, `.env.production`, service-account JSON, private keys
- “Temporary” allowlist for a real key to unblock a PR
- Broad globs like `.*\.json` or `tests/.*` without reviewing contents
- Allowlisting a path that still contains a live credential

When adding an allowlist path: document **why** in the allowlist `description`
or a short comment in the PR.

## Triage workflow

1. Read the finding (rule, file, line) — values should be redacted in CI logs
2. Classify:
   - **Real secret** → rotate/revoke, remove from tree, ensure `.gitignore`, re-scan
   - **Placeholder / fake** → replace with obvious fake (`YOUR_API_KEY=`, `sk_test_…`
     only if truly non-functional) or allowlist that **single** path if policy allows
   - **False positive on reference data** → narrow allowlist path regex
3. Re-run `gitleaks detect` locally before pushing
4. Do not commit `--no-verify` / skip CI to bypass

Examples: [examples.md](examples.md).

## Agent checklist

When adding or changing gitleaks in a repo:

- [ ] `gitleaks.toml` exists at repo root with `useDefault = true`
- [ ] Allowlist is minimal and justified
- [ ] CI job pins version, uses `--redact` and `--exit-code 1`
- [ ] Checkout uses sufficient history (`fetch-depth: 0` for full detect)
- [ ] Path blocklist job/step still present or proposed alongside
- [ ] No real secrets introduced to make the scanner pass

## Install into a repo

**Portable core:** add `gitleaks.toml` + CI from [templates.md](templates.md),
document `gitleaks detect` in `AGENTS.md`, triage with [examples.md](examples.md).

**Cursor / Copilot:** same core; optionally also load this skill folder in
`.cursor/skills/` or mirror the AGENTS snippet into Copilot instructions.
Other agents rely on `AGENTS.md` + CI. See root [README.md](../README.md).
