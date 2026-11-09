# Security Policy

Keep It Out of Git exists to reduce accidental leaks of people data and secrets.
Please help us practice what we preach.

## Supported versions

| Version | Supported |
|---|---|
| `main` (latest) | Yes |

## Reporting a vulnerability

If you find a security issue **in this repository** (for example: a real secret
or real people data that landed in git, a docs example that exposes a live key
pattern that still works, or a script that unsafely prints secrets):

1. **Do not** open a public GitHub issue with the secret or PII
2. Use GitHub **Private vulnerability reporting** on this repo if enabled:
   `Security` → `Report a vulnerability`
3. Or email the maintainer via the address on
   [github.com/Sultonisky](https://github.com/Sultonisky)

Include:

- Description of the issue
- Affected files / commit if known
- Whether any credential needs rotation (yes/no) — **do not paste the raw secret**
  if it is still live; describe type and location instead

We aim to acknowledge reports within 7 days.

## What we will do

1. Confirm and assess impact
2. Remove or redact sensitive material from the tree
3. Ask reporters/operators to **rotate** any exposed credentials
4. Avoid force-pushing history rewrites unless explicitly coordinated

## Out of scope

- Generic advice about third-party product security unrelated to this pack
- False-positive gitleaks findings in *your* application repos (open a normal
  issue/discussion if you want pattern guidance — with redacted examples only)

## Safe contributions

Never commit:

- Real `.env` values, private keys, or cloud credential JSON
- Real people exports (xlsx/csv/json/sql) or screenshots with identifiable people
- Production-like dumps “for reproduction”

Use `Sample…` / `Test…` / Faker only. See `sensitive-data-git/sensitive-catalog.md`.
