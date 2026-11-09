---
name: safe-demo-data
description: >-
  Write seeders, factories, and fixtures that are safe to commit: fictional
  Sample/Test identities, environment guards so demo data never runs in
  production, secrets from env not hardcoded, idempotent seeds. Use when
  creating or reviewing seeders, factories, fixtures, DatabaseSeeder,
  demo/bootstrap data, or when the user asks how to keep demo data in git
  safely. Complements sensitive-data-git (what must stay out of git).
---

# Safe Demo Data (in git)

Keep It Out of Git is not “never commit any data.” It is:

1. **Never** commit real people data or live secrets
2. **Do** commit fictional seeders / factories / fixtures so demos stay
   reproducible — with hard guards

This skill covers (2). For (1), dumps, private storage, and catalogs see
[`sensitive-data-git`](../sensitive-data-git/SKILL.md).

## Non-negotiables

1. **Fictional identities only** — `Sample…` / `Test…` or Faker/`fake()`
2. **Environment guards** — demo seeders must refuse `production` (throw or no-op)
3. **Secrets from env/config** — never hardcode real or “almost prod” passwords
4. **Idempotent where practical** — safe to re-run (`firstOrCreate` / upsert / skip)
5. **Real ops data ≠ seeder** — imports of live dumps stay in private storage +
   explicit import commands, not committed seed arrays
6. **Scan the diff** before commit for real names, IDs, phones, live keys

## What may live in git

| OK to commit | Not OK |
|---|---|
| `Sample User One`, `user.test@example.com` | Production/staging people rows |
| Obvious fake PINs only in **non-prod** demos | Production passwords/PINs in source |
| Password/PIN values read from `.env` / config | Secrets pasted into seeder PHP/TS |
| Tiny anonymized `*_sample.json` fixtures | Live CRM/HR/SQL dumps |
| Reference masters without PII | “Sanitized” dumps that still identify people |

## Naming conventions

```text
Sample User One
Sample Customer Two
Test Reviewer Alpha
SAMPLE-SITE-A
TSTUSER001
TST-TENANT-01
DEV-ORG-01
user.test@example.com
```

Reviewers should recognize fiction at a glance. Prefer `TST…` / `DEV…` codes
unless the test asserts a real product code-prefix generator.

## Environment guard patterns

### Portable rule

```text
if environment is production:
  refuse demo / people seeders (throw or skip with clear message)
bootstrap accounts (if any):
  documented exception + secrets from env, never from committed literals
local-only helpers (E2E users, etc.):
  allow only in local (or equivalent)
```

### Laravel preset (first-class)

```php
// Inside a demo seeder
if (app()->isProduction()) {
    throw new RuntimeException('Demo seeder must not run in production.');
}

// DatabaseSeeder orchestration
if (config('app.env') !== 'production') {
    $this->call(DemoPeopleSeeder::class);
}

if (config('app.env') === 'local') {
    $this->call(E2eUserSeeder::class);
}
```

Bootstrap passwords:

```php
$password = config('seeding.bootstrap_password'); // from env
if (! is_string($password) || strlen($password) < 12) {
    throw new RuntimeException('Set SEED_BOOTSTRAP_PASSWORD before seeding.');
}
```

### Nest / Prisma / Node

- Guard with `process.env.NODE_ENV === 'production'` → throw/skip
- Put seed scripts behind `npm run seed:demo` (not default prod migrate)
- Read passwords from env; use `Sample…` rows in seed TS/JSON

### Django

- Demo data in a management command guarded by `not settings.DEBUG` / explicit
  `--allow-prod` that defaults off
- Prefer factories in tests; keep `Sample…` in fixtures YAML/JSON

## Factories vs seeders vs fixtures

| Kind | Role | Git rule |
|---|---|---|
| **Factory** | Build fake rows in tests | Always fictional / Faker |
| **Seeder** | Bootstrap or demo DB | Fictional + env guard |
| **Fixture file** | Static sample for tests/docs | `*_sample` / clearly fake |
| **Import command** | Load real ops data locally | Input file gitignored; command OK in git |

Do not “seed from a tracked prod CSV.” Point imports at private storage.

## Agent checklist

When writing or reviewing seed/factory/fixture changes:

- [ ] No real names, emails, phones, government IDs, or live API keys
- [ ] Demo seeder has an explicit production refuse
- [ ] Orchestrator does not call demo seeders in production
- [ ] Passwords/PINs for bootstrap come from env/config (or obvious fakes in non-prod only)
- [ ] Idempotent enough for re-run
- [ ] Real dumps stay out of git (private storage + import command)

## Sibling skills

- [`sensitive-data-git`](../sensitive-data-git/SKILL.md) — what must stay out; catalog
- [`sensitive-path-guard`](../sensitive-path-guard/SKILL.md) — block dump paths
- [`gitleaks-guard`](../gitleaks-guard/SKILL.md) — secret content scan

## Install

Paste the AGENTS section from [templates.md](templates.md). See
[examples.md](examples.md) for good vs bad seeders across stacks.
