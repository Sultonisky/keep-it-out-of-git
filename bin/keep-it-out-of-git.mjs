#!/usr/bin/env node
/**
 * Keep It Out of Git — project installer (preferred entry via npx).
 *
 * Usage:
 *   npx github:Sultonisky/keep-it-out-of-git init [options]
 *   npx keep-it-out-of-git init [options]   # after npm publish
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PACK_ROOT = path.resolve(__dirname, "..");

const SKILLS = [
  "sensitive-data-git",
  "safe-demo-data",
  "sensitive-path-guard",
  "gitleaks-guard",
];

const AGENTS_MARKER_START = "<!-- keep-it-out-of-git:start -->";
const AGENTS_MARKER_END = "<!-- keep-it-out-of-git:end -->";

function printHelp() {
  console.log(`Keep It Out of Git — installer

Preferred:
  npx github:Sultonisky/keep-it-out-of-git init [options]

Alternate (Unix / Git Bash):
  ./install.sh init [options]
  curl -fsSL https://raw.githubusercontent.com/Sultonisky/keep-it-out-of-git/main/install.sh | bash -s -- init

Commands:
  init      Install skills + path script into the current project
  help      Show this help

Options for init:
  --cursor       Also copy skills to .cursor/skills/
  --agents-md    Append/refresh AGENTS.md block (marker-managed)
  --pr           Copy .github/pull_request_template.md
  --gitleaks     Write starter gitleaks.toml (if missing, or --force)
  --ci           Write .github/workflows/sensitive-data.yml starter
  --all          Enable --cursor --agents-md --pr --gitleaks --ci
  --force        Overwrite existing managed files
  --dry-run      Print actions without writing
  --target DIR   Project root (default: cwd)
`);
}

function parseArgs(argv) {
  const args = {
    command: "help",
    cursor: false,
    agentsMd: false,
    pr: false,
    gitleaks: false,
    ci: false,
    force: false,
    dryRun: false,
    target: process.cwd(),
  };

  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--cursor") args.cursor = true;
    else if (a === "--agents-md") args.agentsMd = true;
    else if (a === "--pr") args.pr = true;
    else if (a === "--gitleaks") args.gitleaks = true;
    else if (a === "--ci") args.ci = true;
    else if (a === "--all") {
      args.cursor = args.agentsMd = args.pr = args.gitleaks = args.ci = true;
    } else if (a === "--force") args.force = true;
    else if (a === "--dry-run") args.dryRun = true;
    else if (a === "--target") {
      args.target = path.resolve(argv[++i] || "");
    } else if (a === "--help" || a === "-h") args.command = "help";
    else if (a.startsWith("-")) {
      throw new Error(`Unknown option: ${a}`);
    } else {
      positional.push(a);
    }
  }

  if (positional[0]) args.command = positional[0];
  return args;
}

function ensureDir(dir, dryRun) {
  if (dryRun) {
    console.log(`[dry-run] mkdir ${dir}`);
    return;
  }
  fs.mkdirSync(dir, { recursive: true });
}

function copyFile(src, dest, { force, dryRun }) {
  if (fs.existsSync(dest) && !force) {
    console.log(`skip (exists): ${path.relative(process.cwd(), dest)}  (use --force)`);
    return false;
  }
  if (dryRun) {
    console.log(`[dry-run] copy ${src} -> ${dest}`);
    return true;
  }
  ensureDir(path.dirname(dest), false);
  fs.copyFileSync(src, dest);
  console.log(`wrote ${path.relative(process.cwd(), dest)}`);
  return true;
}

function copyDir(src, dest, { force, dryRun }) {
  if (fs.existsSync(dest) && !force) {
    console.log(`skip (exists): ${path.relative(process.cwd(), dest)}  (use --force)`);
    return false;
  }
  if (dryRun) {
    console.log(`[dry-run] copy dir ${src} -> ${dest}`);
    return true;
  }
  fs.cpSync(src, dest, { recursive: true });
  console.log(`wrote ${path.relative(process.cwd(), dest)}/`);
  return true;
}

function agentsBlock() {
  return `${AGENTS_MARKER_START}
## Keep It Out of Git

People data and secrets do not belong in git. Demo seeders/fixtures may stay in
git only when fictional and environment-guarded.

### Private storage (not git)

- **This repo uses:** \`<FILL: e.g. storage/app/private/ or storage/private/>\`
- Never force-add gitignored private storage
- Real dumps/imports stay local; use anonymized \`Sample…\` / \`Test…\` / Faker in tests

### Guards

- Path check: \`bash scripts/check-sensitive-paths.sh\`
- Secret scan: gitleaks (see \`gitleaks.toml\` / CI) when enabled
- Skills (if installed): under \`.agents/skills/\` (and optionally \`.cursor/skills/\`)

### Safe demo data

- Seeders/factories/fixtures: fictional only
- Demo seeders must refuse production
- Bootstrap passwords from env/config — never hardcode live secrets

See skill templates in this pack for full AGENTS snippets.
${AGENTS_MARKER_END}
`;
}

function writeAgentsMd(target, { force, dryRun }) {
  const file = path.join(target, "AGENTS.md");
  const block = agentsBlock();

  if (!fs.existsSync(file)) {
    if (dryRun) {
      console.log(`[dry-run] create ${file}`);
      return;
    }
    fs.writeFileSync(file, `# Agent instructions\n\n${block}\n`, "utf8");
    console.log(`wrote ${path.relative(process.cwd(), file)}`);
    return;
  }

  const current = fs.readFileSync(file, "utf8");
  const start = current.indexOf(AGENTS_MARKER_START);
  const end = current.indexOf(AGENTS_MARKER_END);

  let next;
  if (start !== -1 && end !== -1 && end > start) {
    if (!force) {
      console.log(`skip (AGENTS.md block exists): use --force to refresh`);
      return;
    }
    next =
      current.slice(0, start) +
      block +
      current.slice(end + AGENTS_MARKER_END.length);
  } else {
    next = `${current.trimEnd()}\n\n${block}\n`;
  }

  if (dryRun) {
    console.log(`[dry-run] update ${file}`);
    return;
  }
  fs.writeFileSync(file, next, "utf8");
  console.log(`updated ${path.relative(process.cwd(), file)}`);
}

function gitleaksToml() {
  return `title = "Project gitleaks"

[extend]
useDefault = true

[allowlist]
description = "Non-secret project paths"
paths = [
  '''gitleaks\\.toml''',
  '''\\.env\\.example''',
]
`;
}

function ciWorkflow() {
  return `name: Sensitive data guards

on:
  pull_request:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read

jobs:
  sensitive-data:
    name: Sensitive data guards
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Block sensitive tracked paths
        run: bash scripts/check-sensitive-paths.sh

      - name: Install gitleaks
        env:
          GITLEAKS_VERSION: "8.24.0"
        run: |
          curl -sSL "https://github.com/gitleaks/gitleaks/releases/download/v\${GITLEAKS_VERSION}/gitleaks_\${GITLEAKS_VERSION}_linux_x64.tar.gz" \\
            | tar -xz gitleaks
          sudo mv gitleaks /usr/local/bin/gitleaks
          gitleaks version

      - name: Scan for secrets
        run: gitleaks detect --source . --config gitleaks.toml --verbose --redact --exit-code 1
`;
}

function initProject(args) {
  const target = args.target;
  const opts = { force: args.force, dryRun: args.dryRun };

  console.log(`Keep It Out of Git — init`);
  console.log(`target: ${target}`);
  console.log(`pack:   ${PACK_ROOT}`);
  console.log("");

  const agentsSkills = path.join(target, ".agents", "skills");
  ensureDir(agentsSkills, args.dryRun);

  for (const skill of SKILLS) {
    const src = path.join(PACK_ROOT, skill);
    if (!fs.existsSync(src)) {
      throw new Error(`Missing skill in pack: ${skill}`);
    }
    copyDir(src, path.join(agentsSkills, skill), opts);
  }

  if (args.cursor) {
    const cursorSkills = path.join(target, ".cursor", "skills");
    ensureDir(cursorSkills, args.dryRun);
    for (const skill of SKILLS) {
      copyDir(
        path.join(PACK_ROOT, skill),
        path.join(cursorSkills, skill),
        opts,
      );
    }
  }

  const scriptSrc = path.join(
    PACK_ROOT,
    "sensitive-path-guard",
    "scripts",
    "check-sensitive-paths.sh",
  );
  const scriptDest = path.join(target, "scripts", "check-sensitive-paths.sh");
  copyFile(scriptSrc, scriptDest, opts);
  if (!args.dryRun && fs.existsSync(scriptDest)) {
    try {
      fs.chmodSync(scriptDest, 0o755);
    } catch {
      // Windows may ignore chmod; fine.
    }
  }

  if (args.agentsMd) writeAgentsMd(target, opts);

  if (args.pr) {
    copyFile(
      path.join(PACK_ROOT, "templates", "pull_request_template.md"),
      path.join(target, ".github", "pull_request_template.md"),
      opts,
    );
  }

  if (args.gitleaks) {
    const dest = path.join(target, "gitleaks.toml");
    if (fs.existsSync(dest) && !args.force) {
      console.log(`skip (exists): gitleaks.toml  (use --force)`);
    } else if (args.dryRun) {
      console.log(`[dry-run] write gitleaks.toml`);
    } else {
      fs.writeFileSync(dest, gitleaksToml(), "utf8");
      console.log(`wrote gitleaks.toml`);
    }
  }

  if (args.ci) {
    const dest = path.join(target, ".github", "workflows", "sensitive-data.yml");
    if (fs.existsSync(dest) && !args.force) {
      console.log(
        `skip (exists): .github/workflows/sensitive-data.yml  (use --force)`,
      );
    } else if (args.dryRun) {
      console.log(`[dry-run] write ${dest}`);
    } else {
      ensureDir(path.dirname(dest), false);
      fs.writeFileSync(dest, ciWorkflow(), "utf8");
      console.log(`wrote ${path.relative(process.cwd(), dest)}`);
    }
  }

  console.log(`
Next steps:
  1. Fill private-storage path in AGENTS.md (or skill templates)
  2. Adapt scripts/check-sensitive-paths.sh allow/block regexes
  3. Run: bash scripts/check-sensitive-paths.sh
  4. Optional: npx ... init --all   # cursor + AGENTS + pr + gitleaks + ci

Manual guide: https://github.com/Sultonisky/keep-it-out-of-git#install
`);
}

function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(String(err.message || err));
    process.exit(1);
  }

  if (args.command === "help" || args.command === "--help") {
    printHelp();
    return;
  }

  if (args.command === "init") {
    initProject(args);
    return;
  }

  console.error(`Unknown command: ${args.command}`);
  printHelp();
  process.exit(1);
}

main();
