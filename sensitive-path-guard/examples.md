# Examples

## Failure: force-added private dump

```text
BLOCKED tracked path: storage/private/imports/people.csv
  (matched /(^|/)(storage|var|\.data)/private//)
```

(Laravel variant may show `…/storage/app/private/…` instead.)

Fix:

```bash
git rm --cached storage/private/imports/people.csv
# file can remain on disk if the private dir is gitignored
bash scripts/check-sensitive-paths.sh
```

Do not add an allowlist for private storage.

## Failure: tracked `.env`

```text
BLOCKED tracked path: .env  (matched /(^|/)\.env($|\.)/)
```

Fix:

1. Ensure secrets are rotated if the file was ever pushed
2. `git rm --cached .env`
3. Confirm `.gitignore` includes `.env`
4. Keep `.env.example` with placeholders only

## Failure: SSH / VPS ed25519 keys (private or public)

```text
BLOCKED tracked path: deploy/id_ed25519
BLOCKED tracked path: deploy/id_ed25519.pub
```

Fix:

1. `git rm --cached` both private and public key files
2. Store the deploy key in **GitHub Actions secrets** (or the server/agent), not the repo
3. Ensure `.gitignore` covers `.ssh/`, `id_ed25519`, `id_ed25519.pub`, `*_ed25519`, `*_ed25519.pub`
4. Do not re-add “just the `.pub`” — same policy as the private key
5. **Agents:** do not `Read`/print the key to “confirm” — skip contents; only fix paths/ignores

Gitleaks (content scan) should also catch OpenSSH private key bodies even if renamed.

## Intentional stub needs allowlist

Repo must track anonymized `data/reference_stub.json`.

1. Confirm contents are fictional (`Sample…` / obvious test data)
2. Add allow regex: `'(^|/)data/reference_stub\.json$'`
3. Optionally add a content marker check in the product repo
4. Document in the PR why the stub is required

## Anti-patterns

| Bad | Why |
|---|---|
| Comment out the CI step to merge | Leaves the hole open |
| Allow `'(^|/)data/.*'` | Permits future real dumps under `data/` |
| Allow all of `storage/` | Defeats the point of private storage |
| Move dump to `docs/` to dodge regex | Still people data in git |

## Pairing matrix

| File | Path script | Gitleaks | Policy skill |
|---|---|---|---|
| `data/employees.xlsx` tracked | Fail | Often pass | Forbids |
| AWS key in `app/config.php` | Pass | Fail | Forbids |
| `.env` tracked | Fail | Fail | Forbids |
| `tests/Fixtures/users_sample.json` fictional | Pass (if allowed/not blocked) | Pass | Requires Sample/Faker |
| Live dump only under gitignored private dir | Pass (not tracked) | Pass | Prefers this location |
