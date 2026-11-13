## Type

- [ ] `feat`
- [ ] `fix`
- [ ] `refactor`
- [ ] `docs`
- [ ] `test`
- [ ] `chore`
- [ ] `ci`
- [ ] `perf`
- [ ] `revert`

## Title

<!-- Conventional: type(scope): short summary -->



## Summary

<!-- 1–3 bullets: what changed and why -->

-

## Test plan

- [ ] Relevant checks run (note which, or why skipped)
- [ ]

## Sensitive data / security

- [ ] No real people-data, financial/health dumps, credentials, `bak/`, or hard-coded real PII
- [ ] No SSH/VPS/deploy keys in git (`id_ed25519`, `.pub`, `.ssh/` — use Actions secrets)
- [ ] Sensitive operational files stay in gitignored private storage (not git)
- [ ] New/changed tests & seeders use `Sample…` / `Test…` / Faker only
- [ ] Demo seeders refuse production; bootstrap secrets come from env/config
- [ ] Logs / audit diffs never include passwords, PINs, tokens, government IDs, phones, or card data
- [ ] No infra dumps (sql/tfstate/kubeconfig/HAR) with secrets or PII
- [ ] Path blocklist / gitleaks (if present) still pass — allowlist changes are narrow and justified
