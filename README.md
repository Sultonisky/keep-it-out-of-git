# Keep It Out of Git

**People data and secrets do not belong in git.**

Agent skills + portable templates to keep PII, credentials, and dumps out of
version control - and to commit **safe** demo seeders/fixtures when you need
reproducible data. Predictive across domains (identity, auth, finance, health,
CRM, education, infra), not limited to one product shape.

One portable core for every coding agent - and a smoother path if you already
use Cursor or GitHub Copilot. The door stays open for other agents too.

**Author:** [Sultonisky](https://github.com/Sultonisky)  
**License:** MIT  
**Stage:** early - ship the general pack, welcome feedback, deepen tool-native
packs over time

## Concept

```text
                         ┌─ Cursor / Copilot     ← nicer agent DX
  portable core ─────────┼─ Laravel path preset  ← clearer default paths
  (policy + CI + script) └─ Nest/Express/other   ← same rules, mapped paths
```

Two sides of the same rule:

1. **Keep out** - real people data, live secrets, dumps  
2. **Safe in git** - fictional seeders/factories/fixtures with env guards  

- **Core:** private storage + anonymize + path blocklist + gitleaks + safe demo data  
- **Laravel:** first-class presets for private paths and seeders  
- **Nest / Express / others:** same rules, mapped paths/seed scripts  
- **Cursor / Copilot:** additive wiring - door open to other agents  

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

Each skill folder has:

- `SKILL.md` - portable agent instructions (read this first)
- `templates.md` - drop into `AGENTS.md`, CI, PR checklists, IDE instruction files
- `examples.md` - cross-domain good vs bad decisions

`sensitive-data-git` also includes
[`sensitive-catalog.md`](./sensitive-data-git/sensitive-catalog.md) - a
predictive taxonomy of sensitive categories agents should watch for.

## Install

### 1. Portable core (every agent)

1. Copy policy blocks from each skill’s `templates.md` into repo `AGENTS.md`
2. Copy
   [`sensitive-path-guard/scripts/check-sensitive-paths.sh`](./sensitive-path-guard/scripts/check-sensitive-paths.sh)
   → `scripts/check-sensitive-paths.sh` and adapt allow/block regexes
3. Add `gitleaks.toml` + CI job from [`gitleaks-guard/templates.md`](./gitleaks-guard/templates.md)
4. Copy [`templates/pull_request_template.md`](./templates/pull_request_template.md)
   → `.github/pull_request_template.md` (sensitive-data / security checklist on every PR)

CI + PR checklist enforce what prompts alone cannot. Any agent that reads
`AGENTS.md` can follow the same rules.

### 2. Better DX on Cursor / Copilot (optional, additive)

Do **not** skip the core. These layers make discovery nicer:

| If you use | Also do |
|---|---|
| **Cursor** | Copy skill folders → `.cursor/skills/` and/or add a rule from templates |
| **GitHub Copilot** | Reuse the same policy in `.github/copilot-instructions.md` |
| **Other agents** | Point their instruction file at the same `AGENTS.md` blocks |

Same policy, same CI - only the agent entrypoint changes.

Deeper vendor packs (Cursor marketplace plugin, richer Copilot layouts) come
later once feedback lands - see [ROADMAP.md](./ROADMAP.md).

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
- Path checks and gitleaks complement each other - neither replaces the other

## Community

| Doc | Purpose |
|---|---|
| [CONTRIBUTING.md](./CONTRIBUTING.md) | How to propose changes, PR process |
| [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) | Community standards |
| [SECURITY.md](./SECURITY.md) | Private vulnerability / leak reporting |
| [ROADMAP.md](./ROADMAP.md) | What’s next |

Issues and PRs welcome - catalog gaps, path false positives/negatives, stack
presets, and agent/tool feedback. Keep contributions generic; never add real
people data or live credentials.

## License

MIT - Copyright (c) 2026 Sultonisky. See [LICENSE](./LICENSE).
