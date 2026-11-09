# Examples

## Good vs bad seed rows

| Bad | Good |
|---|---|
| Name/email copied from staging | `Sample User One` / `sample.user.one@example.com` |
| Prod password in seeder source | `config('seeding.initial_user_password')` from env |
| Demo seeder runs on production deploy | `isProduction()` → throw; orchestrator skips demo |
| `User::create` from tracked `customers_prod.csv` | Import command + gitignored private file |
| Factory uses “real looking” national IDs from a dump | Documented fake pattern / Faker |

## Case A — Laravel demo people

**Good**

```php
if (app()->isProduction()) {
    throw new RuntimeException('Demo seeder must not run in production.');
}
// Sample User One … fictional rows, firstOrCreate by stable fake email/id
```

`DatabaseSeeder` calls it only when `env !== production`.

**Bad**

```php
// No guard; rows pasted from a spreadsheet export
User::insert(json_decode(file_get_contents(base_path('data/users.json')), true));
```

## Case B — bootstrap admin (documented exception)

**Good**

- Email/name may be configured (still prefer non-personal `admin@example.com` in OSS)
- Password **only** from env/config (e.g. `SEED_BOOTSTRAP_PASSWORD`, min length enforced)
- Skip create if user already exists

**Bad**

```php
'password' => 'CompanyProdPassword2024!',
```

## Case C — E2E user

**Good**

- Allowed only when `env === local` (or equivalent)
- Email/password from env; if unset → skip with a message

**Bad**

- E2E user seeded on staging/production with a shared password in git

## Case D — Nest Prisma

**Good**

```ts
if (process.env.NODE_ENV === "production") {
  throw new Error("Demo seed must not run in production.");
}
await prisma.user.upsert({ where: { email: "sample.user.one@example.com" }, ... });
```

**Bad**

Default `prisma migrate deploy` in prod also runs a seed that inserts real-looking staff.

## Case E — fixture file

**Good:** `tests/fixtures/orders_sample.json` with `Sample Customer One`  
**Bad:** `tests/fixtures/orders_last_week.json` exported from prod

## Decision flow

```text
Need data in the repo for demos/tests?
  ├─ Real people or live secrets? → NO — private storage + import command
  └─ Fictional?
        ├─ Add Sample/Test or Faker rows
        ├─ Guard: refuse production
        ├─ Secrets from env if any
        └─ Commit seeder/fixture — this is the safe path
```
