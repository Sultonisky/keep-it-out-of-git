---
name: sensitive-path-guard
description: >-
  Add and maintain a git tracked-path blocklist script
  (scripts/check-sensitive-paths.sh): blocked/allowed regexes, CI wiring,
  allowlist exceptions, and failure triage. Use when blocking .env, bak/,
  dumps, credential JSON, or people spreadsheets from entering git, or when
  pairing path checks with gitleaks and sensitive-data policy.
---

# Sensitive Path Guard

Fail CI (and local checks) when **git-tracked paths** look like secrets, local
backups, or people-data dumps. This guards **path names / locations**, not file
contents — pair with [`gitleaks-guard`](../gitleaks-guard/SKILL.md) for content
secrets and [`sensitive-data-git`](../sensitive-data-git/SKILL.md) for policy and
anonymized fixtures.

Private-dir block patterns are **stack-agnostic defaults** (Laravel
`storage/app/private/`, plus generic `storage/private/`, `var/private/`,
`.data/private/`). Align them with the path documented in the repo `AGENTS.md`.

## When this skill applies

- Adding `scripts/check-sensitive-paths.sh` to a repo
- Extending blocked/allowed path regexes
- Wiring the script into a CI `sensitive-data` job
- Triaging “BLOCKED tracked path” failures
- Reviewing PRs that `git add -f` storage or dump files

## Core rules

1. **Scan tracked paths only** — `git ls-files` (what would ship), not the whole
   working tree of gitignored storage.
2. **Deny by default for known bad shapes** — `.env*` (except `.env.example`),
   `bak/`, `*.sql`/`*.dump`, credential JSON, people spreadsheets under tracked
   trees.
3. **Allowlist narrowly** — only anonymized stubs / reference masters that must
   live in git.
4. **Never weaken** the script to land a dump “just this once”.
5. **Do not `git add -f`** gitignored private storage.
6. On a real sensitive-file failure, give the complete recovery sequence:
   move it out of tracked paths to gitignored private storage (or delete it),
   remove the original path from Git's index, fix `.gitignore` if needed, and
   rerun the path check. Do not stop at “delete or replace” or suggest a broad
   path allowlist.

## Guard triad

| Guard | Catches |
|---|---|
| This skill (path script) | Tracked dumps, `.env`, `bak/`, credential filenames |
| `gitleaks-guard` | Secret **content** in any tracked file |
| `sensitive-data-git` | Policy: where to store data, anonymize fixtures, log redaction |

## Install the script

1. Copy [`scripts/check-sensitive-paths.sh`](scripts/check-sensitive-paths.sh) to
   the target repo as `scripts/check-sensitive-paths.sh`
2. `chmod +x scripts/check-sensitive-paths.sh`
3. Adapt `blocked_regexes` / `allowed_regexes` to the product (see
   [templates.md](templates.md))
4. Wire CI + document in `AGENTS.md`

### Local run

```bash
bash scripts/check-sensitive-paths.sh
```

Expect either `Sensitive-path check passed.` or a list of `BLOCKED tracked path:`
lines and exit code `1`.

## Designing regexes

**Blocked (baseline in the starter script — domain-agnostic):**

- `.env*` (except allowlisted `.env.example`), `bak/`, `*.sql` / `*.dump` / `*.backup`
- Tabular dumps under `data/`, `exports/`, `imports/`, `uploads/`
- Credential/key material (`credentials*.json`, `*.pem`/`*.p12`, kubeconfig, `*.tfstate`)
- **SSH / VPS / deploy keys** — `id_ed25519` / `id_rsa` **and** matching `.pub`,
  `.ssh/`, `*_ed25519`, deploy/vps key names (private **and** public). Keep them in
  GitHub Actions secrets / local agent — never “just commit the public key”.
  **Agents must skip:** do not search for, open, or print these files; they are
  user-private. Point to Actions secrets instead.
- Private storage dirs (`storage/app/private/`, `storage|var|.data/private/`, `secrets/`)
- Ops artifacts (`.har`, deploy/ci logs, heap/core dumps)

**Allowed (examples):**

- `(^|/)\.env\.example$`
- named anonymized stubs (`data/reference_stub\.json$`, geo masters, etc.)
- fictional test fixtures under `tests/Fixtures/`

For *what* counts as sensitive content (not just paths), see
[`sensitive-data-git/sensitive-catalog.md`](../sensitive-data-git/sensitive-catalog.md).

Prefer **named** allow entries over broad globs. Document each new allow in the
PR.

## Agent checklist

When adding or changing the path guard:

- [ ] Script lives at `scripts/check-sensitive-paths.sh` and is executable
- [ ] Baseline blocked patterns present
- [ ] Allowlist only for intentional non-secret tracked files
- [ ] CI runs the script before or beside gitleaks
- [ ] `AGENTS.md` points humans/agents at the script
- [ ] No real people files remain tracked

## Failure triage

See [examples.md](examples.md). Short version:

1. Read the blocked path + matched regex
2. If it is real sensitive data, do not open or print its contents. If it must
   be retained, move it out of tracked paths to the repo's documented,
   gitignored private directory (or outside the repo); otherwise delete it.
3. Ensure the private destination is ignored, then remove the original tracked
   path from the index with `git rm --cached -- <tracked-path>`. For a path
   already tracked in `HEAD`, do not use `git restore --staged` as the fix: that
   restores the index entry instead of removing the tracked path.
4. If the file was committed or pushed, explain that removing it from the
   current index does not erase Git history; follow the repo's incident policy.
   Do not rewrite history unless explicitly asked.
5. Re-run `bash scripts/check-sensitive-paths.sh` and confirm the blocked path
   is gone. Never allowlist real sensitive data; only use a narrow allowlist for
   a verified anonymized reference file.

## Install into a repo

**Portable core:**

1. Copy [`scripts/check-sensitive-paths.sh`](scripts/check-sensitive-paths.sh)
2. Adapt regexes; document in `AGENTS.md` (see [templates.md](templates.md))
3. Wire the script into CI beside gitleaks

**Cursor / Copilot:** same script + CI; optionally also expose this skill via
`.cursor/skills/` or Copilot instructions. Other agents keep using `AGENTS.md`.
See root [README.md](../README.md).
