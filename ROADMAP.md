# Roadmap — Keep It Out of Git

## Now (v1) — portable core + friendly Cursor/Copilot paths

- [x] Policy skill: `sensitive-data-git`
- [x] Safe-in-git skill: `safe-demo-data` (seeders/factories/fixtures + env guards)
- [x] Path enforcement: `sensitive-path-guard` + starter script
- [x] Secret scanning: `gitleaks-guard`
- [x] Installer: preferred `npx` CLI + alternate `install.sh` + manual guide
- [x] Default `init` = portable core (AGENTS + gitleaks + CI workflow); `--minimal` for bare
- [x] Post-install agent brief (`.agents/keep-it-out-of-git.POST_INSTALL.md` + AGENTS checklist)
- [x] Copilot-native instructions + INSTALL.json fingerprint; document npx `@main` cache bust
- [x] Block SSH/VPS/deploy key pairs (`id_ed25519` + `.pub`, `.ssh/`) — use Actions secrets
- [x] Agent skip/refuse: do not hunt, open, or print user-private SSH/VPS keys or live secrets
- [x] Portable templates for `AGENTS.md`, CI, PR checklists
- [x] Shared `.github/pull_request_template.md` drop-in (sensitive-data / security)
- [x] Document additive Cursor / Copilot wiring (skills, copilot-instructions)
- [x] Stack path presets (Laravel first-class; Nest/Express/generic mapped)
- [x] Predictive sensitive-data catalog (cross-domain, not one product shape)
- [x] Broader path-guard patterns (keys, tfstate, HAR, imports/exports, etc.)
- [x] OSS project hygiene (CONTRIBUTING, CoC, SECURITY, issue/PR templates)
- [x] GitHub rulesets on the remote (protect `main` + `v*` tags; not tracked in git)
- [ ] Community feedback: missing categories, false positives, stack gaps

Goal: one core for **any** agent, stack, and product domain; Laravel +
Cursor/Copilot get smoother presets without locking others out.

## Next — harden the core

- [ ] More stack examples (Nest monorepo, Django, Python services)
- [ ] Optional pre-commit snippets (still tool-agnostic)
- [ ] Clearer “minimal vs strict” allow/block presets
- [ ] Feedback-driven wording fixes in `SKILL.md` / templates
- [ ] Keep Cursor/Copilot template snippets in sync with the core (no policy fork)
- [ ] Publish `keep-it-out-of-git` to npm (so `npx keep-it-out-of-git` works without GitHub URL)
- [x] Installer `update` command (refresh managed files; preserve AGENTS private-storage line)
- [ ] Smarter update: merge local path-script regex customizations instead of full overwrite

## Later — deeper tool packs (same rules, richer packaging)

Optional layers on top of the same core — not replacements:

| Pack | Possible contents |
|---|---|
| Cursor | curated `.cursor/skills/` bundle, rules, plugin / marketplace packaging |
| GitHub Copilot | richer `.github/copilot-instructions.md` presets, custom agents |
| Other | Claude/`CLAUDE.md`, Windsurf, etc. as requested |

These will **reuse** the general skills, not maintain divergent policy copies.
