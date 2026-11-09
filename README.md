# Keep It Out of Git

**People data and secrets do not belong in git.**

Agent skills + portable templates to keep PII, credentials, and dumps out of
version control — and to commit **safe** demo seeders/fixtures when you need
reproducible data. Predictive across domains (identity, auth, finance, health,
CRM, education, infra), not limited to one product shape.

One portable core for every coding agent — and a smoother path if you already
use Cursor or GitHub Copilot. The door stays open for other agents too.

**Author:** [Sultonisky](https://github.com/Sultonisky)  
**License:** MIT  
**Stage:** early — ship the general pack, welcome feedback, deepen tool-native
packs over time

## Concept

```text
                         ┌─ Cursor / Copilot     ← nicer agent DX
  portable core ─────────┼─ Laravel path preset  ← clearer default paths
  (policy + CI + script) └─ Nest/Express/other   ← same rules, mapped paths
```

Two sides of the same rule:

1. **Keep out** — real people data, live secrets, dumps  
2. **Safe in git** — fictional seeders/factories/fixtures with env guards  

## Skills (use together)

| Skill | Role |
|---|---|
| [`sensitive-data-git`](./sensitive-data-git/) | Policy: what stays out; private storage; catalog; log redaction |
| [`safe-demo-data`](./safe-demo-data/) | What may stay **in** git: seeders/factories/fixtures with guards |
| [`sensitive-path-guard`](./sensitive-path-guard/) | Enforcement: `scripts/check-sensitive-paths.sh` tracked-path blocklist |
| [`gitleaks-guard`](./gitleaks-guard/) | Enforcement: gitleaks config, CI, allowlist hygiene, finding triage |

```text
sensitive-data-git          ← what must stay OUT of git
safe-demo-data              ← what may stay IN git (safely)
        │
        ├─► sensitive-path-guard   ← block bad tracked paths
        └─► gitleaks-guard         ← scan file contents for secrets
```

## Install

You can use **any** of these. Preferred path is marked.

### Preferred — `npx` (cross-platform)

Works on Windows, macOS, and Linux (Node 18+):

```bash
# from your project root — portable core (recommended)
npx github:Sultonisky/keep-it-out-of-git init
```

**Default `init` installs the portable core** (not skills-only):

| Written | Purpose |
|---|---|
| `.agents/skills/*` | Agent skills |
| `scripts/check-sensitive-paths.sh` | Path blocklist |
| `AGENTS.md` block | Document private path + guards for agents/humans |
| `gitleaks.toml` | Secret content scan config |
| `.github/workflows/sensitive-data.yml` | CI job (separate file — does **not** edit your existing `ci-cd.yml`) |

Common options:

```bash
npx github:Sultonisky/keep-it-out-of-git init --cursor
npx github:Sultonisky/keep-it-out-of-git init --pr
npx github:Sultonisky/keep-it-out-of-git init --all
npx github:Sultonisky/keep-it-out-of-git init --minimal
npx github:Sultonisky/keep-it-out-of-git init --dry-run
npx github:Sultonisky/keep-it-out-of-git --help
```

| Flag | Effect |
|---|---|
| *(default)* | Portable core (table above) |
| `--minimal` | Skills + path script only |
| `--cursor` | Also copy skills → `.cursor/skills/` |
| `--pr` | Also copy `.github/pull_request_template.md` |
| `--all` | Portable core + `--cursor` + `--pr` |
| `--force` | Overwrite existing managed files |
| `--dry-run` | Print actions only |

Files from `init` start **untracked** — `git add` + commit/PR them so CI can run.

**Post-install (required):** `init` is bootstrap only. It writes
`.agents/keep-it-out-of-git.POST_INSTALL.md` and an AGENTS checklist so **your
coding agent** can finish project-specific wiring (private path, CI merge,
gitleaks, safe seeders). Existing `AGENTS.md` / CI files are not blindly
overwritten — skipped pieces must be integrated by the agent.

On Windows, run the path script via **Git Bash or WSL** (`bash` is not always on PATH in PowerShell).

After npm publish you can also use `npx keep-it-out-of-git init`.

### Alternate — `install.sh` (Unix / Git Bash)

Use when you already cloned the repo or prefer a shell entrypoint.
If Node is available, the script **delegates to the same CLI** as npx.

```bash
git clone https://github.com/Sultonisky/keep-it-out-of-git.git
cd your-project
bash /path/to/keep-it-out-of-git/install.sh init --cursor
```

Without Node, bash falls back to a **default init only** (skills + path script).
Full flags → use the preferred `npx` path.

### Manual — clone + guided copy

1. Clone this repository (or browse the skill folders online)
2. Copy skill folders into your project:
   - Portable: `.agents/skills/<skill-name>/`
   - Cursor (optional): `.cursor/skills/<skill-name>/`
3. Copy
   [`sensitive-path-guard/scripts/check-sensitive-paths.sh`](./sensitive-path-guard/scripts/check-sensitive-paths.sh)
   → `scripts/check-sensitive-paths.sh` and adapt allow/block regexes
4. Paste policy blocks from each skill’s `templates.md` into `AGENTS.md`
5. Optional: `gitleaks.toml`, CI job, and
   [`templates/pull_request_template.md`](./templates/pull_request_template.md)
   → `.github/pull_request_template.md`

### After install (all methods)

1. Document **this repo’s** private storage path in `AGENTS.md`
2. Run `bash scripts/check-sensitive-paths.sh`
3. Point your agent (Cursor / Copilot / other) at `AGENTS.md` and/or skill folders

## When to use which skill

| Situation | Skill |
|---|---|
| Commit review, dumps, private storage, “is this sensitive?” | `sensitive-data-git` |
| Writing/reviewing seeders, factories, fixtures | `safe-demo-data` |
| Path blocklist CI failures | `sensitive-path-guard` |
| Gitleaks failures / allowlists | `gitleaks-guard` |

## Design notes

- Portable **rules** first; stack paths and IDE wiring are additive presets
- Document *this repo’s* private storage path in `AGENTS.md` (required)
- Instructions stay concise; details live in `templates.md` / `examples.md`
- Examples use fictional identities only (`Sample…` / `Test…`)
- No real operational people data in this repo
- Path checks and gitleaks complement each other — neither replaces the other
- Installer preference: **npx first**, `install.sh` alternate, manual always available

## Community

| Doc | Purpose |
|---|---|
| [CONTRIBUTING.md](./CONTRIBUTING.md) | How to propose changes, PR process |
| [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) | Community standards |
| [SECURITY.md](./SECURITY.md) | Private vulnerability / leak reporting |
| [ROADMAP.md](./ROADMAP.md) | What’s next |

Issues and PRs welcome — catalog gaps, path false positives/negatives, stack
presets, and agent/tool feedback. Keep contributions generic; never add real
people data or live credentials.

## License

MIT — Copyright (c) 2026 Sultonisky. See [LICENSE](./LICENSE).
