---
name: sensitive-data-git
description: >-
  Keep real people data, credentials, and dumps out of git across any domain
  (identity, auth secrets, financial, health, CRM, education, infra dumps);
  prefer gitignored private storage; anonymize tests/factories/seeders; redact
  logs. Use when committing, staging, writing fixtures, importing
  CSV/Excel/JSON/SQL, reviewing PRs for PII/secrets, or when the user mentions
  anonymize, sensitive data, private storage, or gitleaks.
---

# Sensitive Data and Git

Stop real people data and secrets from entering version control — for **any**
product domain, not only HR-style exports. Prefer gitignored private storage.
Keep tests and demos fictional.

Stack-agnostic: the **rule** is portable; **paths** are chosen per framework.
Laravel gets a clear path preset; Nest / Express / others map the same rule.

**When unsure, treat as sensitive** until the user confirms it is public or
fully fictional. Full taxonomy: [sensitive-catalog.md](sensitive-catalog.md).

## Non-negotiables

1. **Never commit** real people rows, credentials, or operational dumps.
2. **Prefer gitignored local private storage** for sensitive-on-disk files
   (path depends on the stack — see below).
3. **Anonymize** all tests, factories, seeders, and fixtures.
4. **Never log** secrets or identity payloads (see redaction list).
5. **On leak:** rotate secrets, remove from the working tree, stop. Do **not**
   rewrite git history unless the user explicitly asks.
6. **User-private material is off-limits to agents** — see below (SSH/VPS keys,
   live `.env`, cloud creds). Do not hunt, open, quote, or “helpfully” surface them.

## User-private material — agents must skip

These belong to the human / ops host, not the agent context. If found or
requested in a way that would expose them:

**Do not**

- Search the disk for `id_ed25519`, `id_rsa`, `.ssh/`, deploy/vps `*.pub`/key files
  “to wire deploy”
- `Read` / `cat` / print private **or** matching public deploy keys
- Paste key bodies (or fingerprints that identify a live host key) into chat,
  commits, docs, CI logs, or screenshots
- Copy keys into the repo “temporarily” or into workflow YAML
- Ask the user to paste a private key into the chat

**Do**

- **Skip** those paths immediately; treat as private user property
- Tell the user deploy/VPS auth must stay in **GitHub Actions secrets** (or the
  local SSH agent) — never in git
- If a key is already tracked: instruct `git rm --cached`, rotate if exposed,
  strengthen `.gitignore` — still **do not** open or reprint the key material
- Continue the task using secret **names** / docs only (e.g. `SSH_PRIVATE_KEY`
  Actions secret), never the value

Same skip rule applies to live `.env`, cloud credential JSON, and other
catalog §2/§9 secrets: detect for guard purposes if needed, but do not load or
echo contents.

## Prefer local private storage — never git

Put real people / credential / dump files only under a **gitignored** private
directory in the app, or an external backup outside the repo.

### Portable rule

1. Pick one private directory for operational people-data / secrets-on-disk
2. Ensure it is gitignored (and never `git add -f`)
3. Keep tracked trees (`data/`, `tests/`, `fixtures/`, `public/`, docs) free of
   real people files — anonymized stubs only
4. Document the chosen path in `AGENTS.md` so every agent uses the same place

### Stack path presets (additive)

| Stack | Suggested private location (gitignored) |
|---|---|
| **Any / unknown** | `storage/private/` or `.data/private/` at repo or app root |
| **Laravel** | `storage/app/private/` (cloud credential JSON under a gitignored credentials/secrets subdir) |
| **NestJS / Express / Node** | `storage/private/` or `var/private/` (not `public/`, not committed `uploads/` with real PII) |
| **Django** | `var/private/` or media path that is gitignored — never under tracked fixtures |
| **External backup** | machine-local `bak/` **outside** the repo (all stacks) |

Laravel is listed as a first-class preset because the pattern is proven there —
not because other stacks are unsupported. Pick the row that matches; if none
fit, use **Any / unknown** and write the path into `AGENTS.md`.

Do **not** place real people files under tracked `data/`, `tests/`, `fixtures/`,
`public/`, or docs. Never `git add -f` gitignored private storage.

## What counts as sensitive (predict beyond one domain)

Block real instances of **any** of these categories (details in
[sensitive-catalog.md](sensitive-catalog.md)):

| Category | Examples agents should watch for |
|---|---|
| Identity / contact | Names, emails, phones, addresses, national IDs, passports |
| Auth / secrets | Passwords, PINs, JWT, API keys, `.env`, cloud creds, SSH/VPS keys (**private and `.pub`**) |
| Financial | Bank/IBAN, card data, payroll, invoices naming real customers |
| Health / biometrics | Diagnoses, medical IDs, face embeddings, raw biometric payloads |
| CRM / comms | Customer exports, ticket/chat/email dumps with real users |
| Work / school | Employee rosters, student records, guardian contacts |
| Location / device | Precise GPS tracks, device IDs joined to identity |
| Infra dumps | SQL/Redis/ES dumps, TF state, kube secrets, HAR/CI logs with tokens |

**High-risk shapes:** `xlsx/csv/sql/dump/parquet`, `.env*`, `*.pem`/`*.key`,
`id_ed25519` / `id_ed25519.pub` / deploy key pairs, `*credentials*.json`, `.har`,
heap/core dumps — guilty until proven anonymized.

## Never commit

Treat as blocked unless the user explicitly requests a one-off exception **and**
the file is fully anonymized / non-secret:

- Spreadsheets or data files with real people or regulated payloads
- Seed / snapshot JSON with real identities or live secrets
- Credentials and key material (see catalog §2 and §9)
- **SSH / VPS / deploy key pairs** (`id_ed25519`, `id_rsa`, matching `.pub`,
  `.ssh/`, deploy/vps key files) — no exceptions for “public key only”; keep
  deploy material in **GitHub Actions secrets** (or the host SSH agent), not git
- Backups and DB/search/queue dumps
- Deploy/CI logs, screenshots, or HAR files that expose PII or secrets

## Allowed in git (reference / anonymized only)

- Non-PII reference masters (geo, currencies, public taxonomies)
- Fully fictional test fixtures
- `.env.example` with placeholders only (no real secrets)

## Tests, factories, seeders, fixtures

Summary (full how-to: [`safe-demo-data`](../safe-demo-data/SKILL.md)):

- Use fictional identities only: `Sample…` / `Test…` labels or Faker/`fake()`
- Demo seeders must refuse `production`; secrets from env/config, not literals
- Prefer obvious fake codes (`TST…`, `DEV…`) unless asserting a product code-prefix
- Before commit: scan the diff for real names, government IDs, phones, live keys

## Logging and audit redaction

Never log or persist raw values for:

- Government IDs, phones, emails (unless product-required and minimized)
- Passwords, PINs, tokens, session values, MFA seeds
- Cloud credential JSON / private keys
- Card numbers, bank accounts
- Raw CV, face, biometric, or identity-document payloads
- Full request/response bodies that contain the above

Prefer opaque IDs + outcome messages. Audit diffs may note that a sensitive
field **changed**, but must never store the new/old secret or PII value.

## Git history hygiene

If secrets or people data were committed by mistake:

1. Rotate the secret / invalidate exposed credentials
2. Remove the file from the working tree
3. Stop

Do **not** run history rewrite (`filter-repo`, force-push) unless the user
explicitly requests it.

## Agent commit / PR checklist

Before any commit or PR the user requests:

- [ ] Staged set has no blocked people-data files
- [ ] No hard-coded real PII in source, tests, or seeders
- [ ] New fixtures use fictional identities only
- [ ] No credential files (`.env`, SSH/VPS keys, tokens) staged
- [ ] Agent did not open/print user-private keys or live secret files
- [ ] Logs/audit paths do not print identity or secret values

If blocked material is found: **stop**, warn the user, and keep it out of the
commit.

## Optional repo guards

When the repo already has them, run before commits that touch data/tests:

```bash
bash scripts/check-sensitive-paths.sh
```

CI should also run a tracked-path blocklist and secret scanning. Path checks
catch people dumps by location; gitleaks catches credentials in file content.
Do not weaken those checks without an explicit request.

Sibling skills:

- [`sensitive-path-guard`](../sensitive-path-guard/SKILL.md) — `check-sensitive-paths.sh`
- [`gitleaks-guard`](../gitleaks-guard/SKILL.md) — gitleaks config + CI

## Install into a repo

**Portable core (every agent):**

1. Paste the `AGENTS.md` section from [templates.md](templates.md) into the
   repo’s agent instructions file
2. Add PR checklist snippets from the same templates
3. Pair with [`sensitive-path-guard`](../sensitive-path-guard/SKILL.md) and
   [`gitleaks-guard`](../gitleaks-guard/SKILL.md) for enforcement

**Better DX if you use Cursor / Copilot (additive):** copy into
`.cursor/skills/` and/or `.github/copilot-instructions.md` — same policy, nicer
discovery. Other agents keep using `AGENTS.md`. See root [README.md](../README.md).

Also see:

- [examples.md](examples.md) — cross-domain commit / fixture decisions
- [sensitive-catalog.md](sensitive-catalog.md) — full predictive taxonomy
