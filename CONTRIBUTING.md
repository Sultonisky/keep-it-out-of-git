# Contributing to Keep It Out of Git

Thanks for helping keep people data and secrets out of git.

## Ground rules

1. **No real people data or live credentials** in issues, PRs, examples, or screenshots.
2. Keep the **portable core** agent-agnostic (`AGENTS.md` + scripts + CI first).
3. Cursor / Copilot / Laravel wiring may improve DX, but must not become the only path.
4. Prefer small, focused PRs over large rewrites.
5. When unsure whether something is sensitive, treat it as sensitive.

## Ways to contribute

| Type | Examples |
|---|---|
| Catalog gaps | Missing sensitive categories in `sensitive-catalog.md` |
| Path patterns | New high-risk path/extension regexes (without product fingerprints) |
| Stack presets | Nest monorepo, Django, Python services path examples |
| Docs | Clearer install steps, translations later |
| Bug reports | False positives/negatives in the path script or templates |
| Tool packs | Cursor / Copilot packaging (see `ROADMAP.md`) |

## Development setup

```bash
git clone https://github.com/Sultonisky/keep-it-out-of-git.git
cd keep-it-out-of-git
```

No build step. Skills are markdown + a bash script.

Optional local check after editing the path script:

```bash
bash sensitive-path-guard/scripts/check-sensitive-paths.sh
```

(Requires a git repo; run from a throwaway test repo if you need to validate regex changes.)

## Pull request process

1. Fork and create a branch from `main`
2. Make your change; keep examples fictional (`Sample…` / `Test…` / Faker)
3. Update linked docs if behavior or install steps change (`README.md`, skill `templates.md`, `ROADMAP.md` as needed)
4. Open a PR using the template — complete the sensitive-data checklist
5. Expect review on: generality, no source-product leakage, and CI/path safety

### PR title

Prefer conventional style:

```text
feat(catalog): add IoT crash-dump category
fix(path-guard): block *.tfstate backups
docs: clarify Nest private storage preset
```

## Issue reports

- Use the issue templates when possible
- Redact secrets/PII before pasting logs
- For vulnerabilities in *this* repository, see [SECURITY.md](SECURITY.md)

## Code of conduct

Participation is governed by [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
