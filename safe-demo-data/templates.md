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

Map the local-only password through config; do not put its value in source
control:

```php
// config/seeding.php
return [
    'demo_user_password' => env('SEED_DEMO_USER_PASSWORD'),
];
```

Set `SEED_DEMO_USER_PASSWORD` in the local `.env` file. Do not commit that file
or provide a source-code fallback. The seeder fails clearly if the value is
missing or too short.

```php
<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use RuntimeException;

class DemoUsersSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->isProduction()) {
            throw new RuntimeException('Demo seeder must not run in production.');
        }

        $password = config('seeding.demo_user_password');

        if (! is_string($password) || strlen($password) < 12) {
            throw new RuntimeException('Set SEED_DEMO_USER_PASSWORD in the local environment (minimum 12 characters).');
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
                $attributes + ['password' => Hash::make($password)],
            );
        }
    }
}
```

`firstOrCreate` uses each fictional email as a stable key, so reruns do not
overwrite existing user changes. Keep the seeder's production guard even when
orchestration is guarded:

```php
// DatabaseSeeder::run()
if (config('app.env') !== 'production') {
    $this->call(DemoUsersSeeder::class);
}
```

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
