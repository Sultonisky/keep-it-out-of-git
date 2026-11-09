# Examples

Cross-domain examples. Same rules apply whether the repo is HR, SaaS, fintech,
health, edtech, or internal tooling.

## Good vs bad fixtures

| Bad (do not ship) | Good |
|---|---|
| Real person name + national ID from a prod export | `Sample User One`, national ID `0000000000000001` |
| Production phone / email | `+15550000001`, `user.test@example.com` |
| Live API key or webhook secret in tests | `YOUR_API_KEY=` / non-functional placeholder |
| Real password/PIN pasted as “sample” | Obviously fake PIN like `000000` only in tests |
| Prod tenant / customer codes copied from live DB | `TST-TENANT-01`, `DEV-ORG-01` |
| Seeder that imports live CRM/HR CSV | Seeder builds fictional rows / anonymized fixture |

## Commit decisions by domain

### HR / workforce import

`employees-export.xlsx` with real rows for a local import command.

- **Do:** gitignored private dir (`storage/app/private/…` or `storage/private/…`)
- **Do not:** `data/`, `tests/Fixtures/`, or `git add`
- **Tests:** anonymized `employees_sample.csv`

### SaaS / CRM export

`customers_prod.csv` used to reproduce a billing bug.

- **Do:** private storage + scrubbed local copy
- **Do not:** commit “just the emails”
- **Tests:** `Sample Customer One` rows only

### Fintech / payments

Debug log containing card last-4 **plus** full PAN in an attachment.

- **Do:** delete PAN from artifacts; store only allowed PCI-minimized fields
- **Do not:** commit payment provider export zips or `.har` with auth headers

### Health / wellness

`appointments_export.json` with diagnoses and patient phones.

- **Do:** private storage; synthetic patients in fixtures
- **Do not:** track under `docs/examples/` even “temporarily”

### EdTech

Class roster CSV with guardian phone numbers.

- **Do:** private storage; treat minors’ data as high sensitivity
- **Do not:** use real student names in screenshots without redaction

### Infra / incident response

Postgres dump from staging that still has real user emails.

- **Do:** keep dump outside git (`bak/` external or private dir); scrub before sharing
- **Do not:** commit `*.sql` / `*.dump` “for teammates”

### Mobile / IoT

Crash archive with auth tokens in headers and device IDs joined to accounts.

- **Do:** redact tokens before attaching to tickets; synthetic devices in tests
- **Do not:** commit raw crash zips into the repo

## Factory / seed shapes

```text
# Bad
name: "Alex Example-Prod"
national_id: "<real national ID from staging dump>"
api_key: "sk_live_...."

# Good
name: "Sample User One"
national_id: "0000000000000001"
email: "sample.user.one@example.com"
api_key: "test_key_not_real"
```

## Accidental stage

Private-dir file staged via `git add -f` (any stack path).

1. Unstage immediately
2. Warn the user
3. Confirm `.gitignore` covers that private directory
4. Do not commit “just this once”

## Secret in git history

Cloud credential JSON or API key committed last week.

1. Rotate / revoke at the provider
2. Remove from the working tree; fix ignore rules
3. Stop
4. Rewrite history **only** if the user explicitly requests it

## PR review signals

**Block:**

- `tests/fixtures/people_prod.json`, live `.env`, credential JSON
- Docs screenshots of live dashboards with real names
- “Sanitized” SQL dump that still has real emails

**Accept:**

- `people_sample.json` with `Sample…` rows
- `.env.example` with `YOUR_API_KEY=`
- Redacted screenshots / synthetic demos

## Naming conventions (suggested)

```text
Sample User One
Sample Customer Two
Test Reviewer Alpha
SAMPLE-SITE-A
TSTUSER001
TST-TENANT-01
DEV-ORG-01
user.test@example.com
sample.user@example.com
```

Reviewers should recognize fiction at a glance. For a full category list, see
[sensitive-catalog.md](sensitive-catalog.md).
