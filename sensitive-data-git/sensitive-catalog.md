# Sensitive data catalog (predictive)

Use this when deciding whether a file, field, log line, or fixture is safe for
git. It is **not** limited to HR exports — cover whatever domain the user’s
repo touches.

**Heuristic:** if a reasonable outsider could identify, contact, impersonate,
charge, diagnose, locate, or exploit a real person or system from the data,
treat it as sensitive.

## 1. Identity and contact (PII)

| Examples | Notes |
|---|---|
| Legal name, preferred name, username tied to a real person | Fixtures: `Sample User One` |
| Email, phone, messaging handles | Use `@example.com`, fake numbers |
| Home / shipping / billing address, precise lat-long of a home | Coarse city OK if non-identifying |
| National ID, tax ID, SSN, passport, driver’s license, visa numbers | Never real values |
| Date of birth, place of birth (when combined with other fields) | High risk in combinations |
| Photos of faces / ID documents | Prefer synthetic or heavily redacted |

## 2. Authentication and secrets

| Examples | Notes |
|---|---|
| Passwords, password hashes (even “test” copies of prod), PINs, recovery codes | Fake only |
| Session cookies, JWT, refresh tokens, CSRF secrets | |
| API keys, webhook secrets, OAuth client secrets | Placeholders in `.env.example` |
| Private keys (`*.pem`, `*.key`, `id_rsa`, `id_ed25519`), client certs, PKCS12 | |
| SSH **public** keys that belong with local/deploy identities (`id_ed25519.pub`, deploy `*.pub`) | Do not commit “just the .pub” — store deploy material in GitHub Actions secrets. **Agents must skip** reading/searching these files |
| Cloud credential JSON / INI (AWS, GCP, Azure, etc.) | |
| MFA seeds / TOTP secrets, SSH host keys | |
| `.env`, `.env.*` (except documented `.env.example`) | |

## 3. Financial and commercial

| Examples | Notes |
|---|---|
| Bank account / IBAN / routing numbers | |
| Payment card PAN, CVV, expiry (PCI) | Never in git or logs |
| Payroll, salary, commission sheets with real people | |
| Invoices / receipts that name real customers + amounts | Anonymize or keep private |
| Wallet addresses linked to known individuals (context-dependent) | |

## 4. Health, biometrics, and care

| Examples | Notes |
|---|---|
| Diagnoses, prescriptions, lab results, medical record numbers | |
| Insurance member IDs tied to people | |
| Face embeddings, fingerprints, voiceprints, raw biometric payloads | Facts/scores OK; raw vectors not in git/logs |
| Genetic / lab export files | |

## 5. Customers, CRM, support, and comms

| Examples | Notes |
|---|---|
| CRM exports, lead lists, customer CSVs | |
| Support tickets / chat / email dumps with real users | |
| Call recordings / transcripts with PII | |
| Marketing lists with consent + contact data | |

## 6. Employment, education, and access control

| Examples | Notes |
|---|---|
| Employee / contractor rosters, attendance, leave, performance notes | |
| Student records, grades, guardian contacts | Extra care for minors |
| Badge IDs, access-card dumps, visitor logs naming people | |
| Background-check or HR screening packs | |

## 7. Location, device, and behavioral

| Examples | Notes |
|---|---|
| Precise GPS tracks, geofence hits tied to a person | |
| Device IDs / IMEI / advertising IDs linked to identity | |
| Raw analytics event dumps that re-identify users | Prefer aggregated / synthetic |
| IP + identity combinations in debug logs | |

## 8. Legal, government, and regulated packs

| Examples | Notes |
|---|---|
| Contracts with personal data, NDAs with home addresses | |
| Court / case files, government form submissions | |
| KYC / AML document packs | |

## 9. Infrastructure and operational dumps

| Examples | Notes |
|---|---|
| Database dumps (`*.sql`, `*.dump`, `*.backup`) | Even “sanitized” dumps need review |
| Redis / Elasticsearch / Mongo exports containing user docs | |
| Terraform state, Kubernetes secrets, Docker secret files | |
| CI/CD logs, deploy logs, HAR files with tokens or PII | |
| Heap dumps, core dumps, debug archives | Often contain secrets in memory |
| Message-queue snapshots with real payloads | |

## 10. High-risk file shapes (path or extension signals)

Treat as **guilty until proven anonymized** when tracked under app trees:

```text
.xlsx .xls .xlsm .ods .csv .tsv
.sql .dump .backup .bak .parquet .avro
.env .env.*  (except .env.example)
.pem .key .p12 .pfx
id_rsa  id_rsa.pub  id_ed25519  id_ed25519.pub  *_ed25519  *_ed25519.pub
deploy_key  deploy_key.pub  vps_key  vps_key.pub
*credentials*.json  *service*account*.json  *.kubeconfig
.har  .pcap  heapdump*  core.*
```

Directories that usually must stay gitignored if they hold real ops data:

```text
.ssh/
storage/private/  storage/app/private/  var/private/  .data/private/
credentials/  secrets/  bak/  deploy-logs/  ci-logs/
tmp/imports/  tmp/exports/  uploads/private/
```

## Domain quick map (what users often forget)

| Domain | Often-missed sensitive artifacts |
|---|---|
| SaaS / B2B | Tenant exports, admin impersonation logs, webhook payloads |
| E-commerce | Order CSVs with addresses, payment provider exports |
| Fintech | Ledger dumps, KYC zips, card-tokenization debug logs |
| Health / wellness | Appointment exports, wearable raw exports |
| EdTech | Class rosters, guardian phones, grade CSVs |
| Marketplaces | Seller/buyer PII, dispute attachments |
| IoT / mobile | Device + user join tables, crash logs with tokens |
| Internal tools | “Temp” Excel from ops, Slack export zips, screenshot PNGs of dashboards |
| VPS / deploy | Local `id_ed25519` / `id_ed25519.pub`, deploy keys “for CI” — use Actions secrets instead |

## Safe substitutes (all domains)

| Instead of real… | Use |
|---|---|
| Person names | `Sample User One`, Faker names |
| Emails | `user.test@example.com` |
| Phones | `+15550000001` or Faker |
| Government IDs | Obvious zeros / documented fake patterns |
| API keys | `YOUR_API_KEY=` / clearly non-functional placeholders |
| Addresses | Faker address in a fake city |
| Prod tenant IDs | `TST-TENANT-01`, `DEV-ORG-01` |

## Agent decision flow

```text
Is it real production / staging people or secret material?
  ├─ yes → private gitignored storage only; never commit
  ├─ unsure → treat as sensitive; ask user or keep out of git
  └─ no, fully fictional / public reference
         → OK in git if docs/tests need it; still no live credentials
```
