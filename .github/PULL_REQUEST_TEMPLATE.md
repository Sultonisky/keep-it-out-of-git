## Summary

<!-- 1–3 bullets: what changed and why -->

-

## Type

- [ ] `feat`
- [ ] `fix`
- [ ] `refactor`
- [ ] `docs`
- [ ] `test`
- [ ] `chore`
- [ ] `ci`

## Test plan

- [ ] Docs / templates reviewed for clarity
- [ ] Path-script regex changes sanity-checked (if touched)
- [ ] Catalog / examples stay fictional (`Sample…` / `Test…`)

## Sensitive data / security

- [ ] No real people-data, financial/health dumps, credentials, `bak/`, or hard-coded real PII
- [ ] No SSH/VPS/deploy keys in git (`id_ed25519`, `.pub`, `.ssh/` — use Actions secrets)
- [ ] Sensitive operational files stay in gitignored private storage (not git)
- [ ] New/changed examples use `Sample…` / `Test…` / Faker only
- [ ] Demo seeder guidance includes production refuse + env-based secrets
- [ ] Logs / docs never include passwords, PINs, tokens, government IDs, phones, or card data
- [ ] No infra dumps (sql/tfstate/kubeconfig/HAR) with secrets or PII
- [ ] No product-specific fingerprints from private source repos
- [ ] Path blocklist / gitleaks guidance stays fail-closed; allowlist advice stays narrow

## Checklist

- [ ] Portable core still works without Cursor/Copilot
- [ ] `README.md` / `ROADMAP.md` updated if needed
- [ ] I follow [CONTRIBUTING.md](../CONTRIBUTING.md)
