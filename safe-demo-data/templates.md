# Templates

## AGENTS.md section

```markdown
## Safe demo data (seeders / factories / fixtures)

Demo data **may** live in git only when it is fictional and guarded.

### Rules

- Use `Sample…` / `Test…` or Faker only — never production people rows
- Demo seeders must refuse `production` (throw or skip)
- Orchestrate demo seeds only in non-production environments
- Bootstrap passwords/PINs come from env/config — never hardcode live secrets
- Prefer idempotent seeds (`firstOrCreate` / upsert / skip-if-exists)
- Real ops imports use gitignored private storage + an explicit import command
  — do not commit live CSV/JSON into seeders

### This repo

- Private storage path: `<FILL — same as sensitive-data policy>`
- Demo seed entrypoint: `<FILL e.g. DatabaseSeeder / prisma/seed.ts>`
- Bootstrap password env var (if any): `<FILL e.g. SEED_BOOTSTRAP_PASSWORD>`
```

## Laravel sketch (demo seeder)

```php
<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use RuntimeException;

class DemoUsersSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->isProduction()) {
            throw new RuntimeException('Demo seeder must not run in production.');
        }

        $rows = [
            [
                'email' => 'sample.user.one@example.com',
                'name' => 'Sample User One',
            ],
            [
                'email' => 'sample.user.two@example.com',
                'name' => 'Sample User Two',
            ],
        ];

        foreach ($rows as $attributes) {
            User::query()->firstOrCreate(
                ['email' => $attributes['email']],
                $attributes + [
                    'password' => config('seeding.demo_user_password', 'password-not-for-prod'),
                ],
            );
        }
    }
}
```

Wire from `DatabaseSeeder` only when `config('app.env') !== 'production'`.

## Nest / Prisma sketch

```ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Demo seed must not run in production.");
  }

  await prisma.user.upsert({
    where: { email: "sample.user.one@example.com" },
    update: {},
    create: {
      email: "sample.user.one@example.com",
      name: "Sample User One",
    },
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Expose as `npm run seed:demo`, not as the default production migrate hook.

## PR checklist snippet

```markdown
### Safe demo data

- [ ] New seeders/factories/fixtures use `Sample…` / `Test…` / Faker only
- [ ] Demo seeders refuse production (explicit guard)
- [ ] No hardcoded live passwords/API keys (env/config only)
- [ ] Real dumps stay gitignored; imports are separate commands
```

## Copilot / other agents

Reuse the AGENTS.md section above in `.github/copilot-instructions.md` or any
instruction file. Pair with the sensitive-data policy so agents know both
“keep out” and “safe to commit.”
