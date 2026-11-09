# Examples

## Finding triage

### Real secret in committed `.env`

```text
Finding: generic-api-key
File: .env
```

Actions:

1. Rotate/revoke the key at the provider
2. Remove `.env` from the tree; confirm `.gitignore` covers it
3. Ensure only `.env.example` with placeholders remains tracked
4. Re-run `gitleaks detect`
5. Do not rewrite history unless the user explicitly asks

### Placeholder trips entropy rule

```text
Finding: high-entropy
File: .env.example
Line: API_KEY=replace_me_with_a_long_random_string_1234567890
```

Prefer fixing the example to an obvious placeholder:

```bash
API_KEY=
# or
API_KEY=YOUR_API_KEY_HERE
```

Allowlist `.env.example` only if placeholders still false-positive after cleanup.

### Anonymized fixture false positive

```text
Finding: generic-api-key
File: tests/Fixtures/sample_webhook.json
Value: "sk_test_sample_not_a_real_key_000"
```

Options (in order):

1. Change the fixture value to a clearly fake non-matching placeholder
2. If the format must match a vendor shape for the test, allowlist **that file
   or fixtures directory** with a note in the PR
3. Never allowlist the whole `tests/` tree casually

### Broad allowlist anti-pattern

```toml
# Bad — hides almost everything
paths = ['''.*''']

# Bad — too wide for most repos
paths = ['''tests/.*''', '''docs/.*''', '''.*\.json''']

# Better — single known stub path
paths = ['''tests/Fixtures/sample_webhook\.json''']
```

## CI failure response

```text
Error: leaks found: 1
```

1. Open the redacted CI log; note rule + file path
2. Reproduce locally with the same config
3. Fix content or apply a **narrow** allowlist with justification
4. Push again — do not skip the job

## Pairing with path blocklist

| Event | Path check | Gitleaks |
|---|---|---|
| `employees.xlsx` force-added under `data/` | Fail | May pass (not a secret regex) |
| AWS key in `config/local.php` | May pass | Fail |
| `.env` tracked | Fail (if script blocks it) | Fail |
| Anonymized `Sample User` fixture | Pass | Pass (if no secret-like strings) |

Use both guards; neither replaces the other.

## Good allowlist PR description

```text
Allowlist tests/Fixtures/sample_webhook.json for gitleaks.

Fixture uses a non-functional placeholder shaped like a vendor key so the
parser test can assert header format. No live credentials. Narrow path only.
```
