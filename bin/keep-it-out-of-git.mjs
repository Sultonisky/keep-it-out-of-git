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

Commands:
  init      Install portable core into the current project
  help      Show this help

Default init (portable core):
  skills → .agents/skills/
  path script → scripts/check-sensitive-paths.sh
  AGENTS.md block (marker-managed)
  gitleaks.toml
  .github/workflows/sensitive-data.yml   (separate workflow; does not edit your existing CI files)

Options:
  --minimal      Skills + path script only (old bare init)
  --cursor       Also copy skills → .cursor/skills/
  --pr           Also copy .github/pull_request_template.md
  --all          Portable core + --cursor + --pr
  --agents-md    (redundant) included in default; kept for compatibility
  --gitleaks     (redundant) included in default
  --ci           (redundant) included in default
  --force        Overwrite existing managed files
  --dry-run      Print actions without writing
  --target DIR   Project root (default: cwd)
`);
}

function parseArgs(argv) {
  const flags = new Set();
  let target = process.cwd();
  let command = "help";

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--cursor") flags.add("cursor");
    else if (a === "--agents-md") flags.add("agentsMd");
    else if (a === "--pr") flags.add("pr");
    else if (a === "--gitleaks") flags.add("gitleaks");
    else if (a === "--ci") flags.add("ci");
    else if (a === "--all") flags.add("all");
    else if (a === "--minimal") flags.add("minimal");
    else if (a === "--force") flags.add("force");
    else if (a === "--dry-run") flags.add("dryRun");
    else if (a === "--target") {
      target = path.resolve(argv[++i] || "");
    } else if (a === "--help" || a === "-h") command = "help";
    else if (a.startsWith("-")) {
      throw new Error(`Unknown option: ${a}`);
    } else {
      command = a;
    }
  }

  const all = flags.has("all");
  const minimal = flags.has("minimal");
  // Portable core is the default for `init` (skills+script always; docs+guards unless --minimal).
  const core = !minimal;

  return {
    command,
    cursor: all || flags.has("cursor"),
    agentsMd: all || flags.has("agentsMd") || core,
    pr: all || flags.has("pr"),
    gitleaks: all || flags.has("gitleaks") || core,
    ci: all || flags.has("ci") || core,
    force: flags.has("force"),
    dryRun: flags.has("dryRun"),
    minimal,
    target,
  };
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

### Agent: post-install setup required

\`npx … init\` is only a **bootstrap**. It may skip files that already existed.
Before treating this pack as fully active, the coding agent for **this repo**
must complete project-specific setup:

1. Read \`.agents/keep-it-out-of-git.POST_INSTALL.md\` (written by the installer)
2. Audit what was installed vs skipped (AGENTS, gitleaks, CI, path script, skills)
3. Fill **This repo uses** private-storage path below for this stack
4. Wire guards into *this* project's real workflow (merge CI steps if the repo
   already has \`ci-cd.yml\` / \`tests.yml\` instead of relying only on a new workflow)
5. Adapt \`scripts/check-sensitive-paths.sh\` allow/block regexes to this tree
6. Apply \`safe-demo-data\` to seeders/factories (fictional rows, production refuse,
   passwords from env) — do not assume demo data was fixed by init
7. Ask the human before overwriting existing AGENTS/CI/gitleaks they already tuned

### Private storage (not git)

- **This repo uses:** \`<FILL: e.g. storage/app/private/ or storage/private/>\`
- Never force-add gitignored private storage
- Real dumps/imports stay local; use anonymized \`Sample…\` / \`Test…\` / Faker in tests

### Guards

- Path check: \`bash scripts/check-sensitive-paths.sh\` (Git Bash/WSL on Windows)
- Secret scan: gitleaks (see \`gitleaks.toml\` / CI) when present
- Skills: \`.agents/skills/\` (optional \`.cursor/skills/\`)

### Safe demo data

- Seeders/factories/fixtures: fictional only
- Demo seeders must refuse production
- Bootstrap passwords from env/config — never hardcode live secrets

Skill details: \`.agents/skills/*/SKILL.md\` and \`templates.md\`.
${AGENTS_MARKER_END}
`;
}

function postInstallDoc({ minimal, written, skipped }) {
  const writtenList =
    written.length > 0
      ? written.map((p) => `- ${p}`).join("\n")
      : "- (none written this run)";
  const skippedList =
    skipped.length > 0
      ? skipped.map((p) => `- ${p}`).join("\n")
      : "- (none skipped)";

  return `# Keep It Out of Git — post-install setup (for coding agents)

**Status: bootstrap only — not fully configured until you finish this checklist.**

The installer may have skipped files because this project already had AGENTS.md,
CI, gitleaks, or scripts. Do **not** assume every guard is active.

Profile this run: **${minimal ? "minimal" : "portable core"}**

## Written this run

${writtenList}

## Skipped this run (already existed, or not in profile)

${skippedList}

## Required agent tasks (adapt to THIS repo)

1. **Inventory** — Confirm which of these exist and are intended:
   - \`.agents/skills/sensitive-data-git\`
   - \`.agents/skills/safe-demo-data\`
   - \`.agents/skills/sensitive-path-guard\`
   - \`.agents/skills/gitleaks-guard\`
   - \`scripts/check-sensitive-paths.sh\`
   - \`gitleaks.toml\`
   - \`.github/workflows/sensitive-data.yml\` and/or steps inside existing CI
   - Keep It Out of Git block in \`AGENTS.md\`
2. **Private storage** — Set the real gitignored path for this stack in \`AGENTS.md\`
   (Laravel \`storage/app/private/\`, Nest \`storage/private/\`, etc.).
3. **Path script** — Adjust allow/block regexes to this tree; run
   \`bash scripts/check-sensitive-paths.sh\` (Git Bash/WSL on Windows).
4. **Gitleaks** — If \`gitleaks.toml\` is missing, add it from the skill templates.
   If the project already has secret scanning, integrate rather than duplicate blindly.
5. **CI** — Prefer wiring path check + gitleaks into the project's **existing**
   workflow if one exists; the starter \`sensitive-data.yml\` is optional/additive
   and must not silently replace \`ci-cd.yml\` / \`tests.yml\`.
6. **Safe demo data** — Review seeders/factories: fictional identities, refuse
   production, secrets from env. Init does **not** rewrite application seeders.
7. **Commit** — \`git add\` the bootstrap files the human wants to keep; open a PR
   if the default branch is protected.
8. **Ask before destructive merges** — Do not \`--force\` overwrite human-tuned
   AGENTS/CI/gitleaks without confirmation.

## Skills to read

- \`.agents/skills/sensitive-data-git/SKILL.md\`
- \`.agents/skills/safe-demo-data/SKILL.md\`
- \`.agents/skills/sensitive-path-guard/SKILL.md\`
- \`.agents/skills/gitleaks-guard/SKILL.md\`

Pack upstream: https://github.com/Sultonisky/keep-it-out-of-git
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

function track(result, written, skipped, label) {
  if (result) written.push(label);
  else skipped.push(label);
}

function writePostInstall(target, { minimal, written, skipped, dryRun }) {
  const dest = path.join(target, ".agents", "keep-it-out-of-git.POST_INSTALL.md");
  const body = postInstallDoc({ minimal, written, skipped });
  if (dryRun) {
    console.log(`[dry-run] write ${dest}`);
    return;
  }
  ensureDir(path.dirname(dest), false);
  fs.writeFileSync(dest, body, "utf8");
  console.log(`wrote ${path.relative(process.cwd(), dest)}`);
}

function initProject(args) {
  const target = args.target;
  const opts = { force: args.force, dryRun: args.dryRun };
  const written = [];
  const skipped = [];

  console.log(`Keep It Out of Git — init`);
  console.log(`target: ${target}`);
  console.log(`pack:   ${PACK_ROOT}`);
  console.log(
    `profile: ${args.minimal ? "minimal (skills + path script)" : "portable core (skills + script + AGENTS + gitleaks + CI workflow)"}`,
  );
  console.log("");

  const agentsSkills = path.join(target, ".agents", "skills");
  ensureDir(agentsSkills, args.dryRun);

  for (const skill of SKILLS) {
    const src = path.join(PACK_ROOT, skill);
    if (!fs.existsSync(src)) {
      throw new Error(`Missing skill in pack: ${skill}`);
    }
    const dest = path.join(agentsSkills, skill);
    track(
      copyDir(src, dest, opts),
      written,
      skipped,
      `.agents/skills/${skill}/`,
    );
  }

  if (args.cursor) {
    const cursorSkills = path.join(target, ".cursor", "skills");
    ensureDir(cursorSkills, args.dryRun);
    for (const skill of SKILLS) {
      const dest = path.join(cursorSkills, skill);
      track(
        copyDir(path.join(PACK_ROOT, skill), dest, opts),
        written,
        skipped,
        `.cursor/skills/${skill}/`,
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
  track(
    copyFile(scriptSrc, scriptDest, opts),
    written,
    skipped,
    "scripts/check-sensitive-paths.sh",
  );
  if (!args.dryRun && fs.existsSync(scriptDest)) {
    try {
      fs.chmodSync(scriptDest, 0o755);
    } catch {
      // Windows may ignore chmod; fine.
    }
  }

  if (args.agentsMd) {
    const agentsFile = path.join(target, "AGENTS.md");
    const before = fs.existsSync(agentsFile)
      ? fs.readFileSync(agentsFile, "utf8")
      : "";
    writeAgentsMd(target, opts);
    const after = !args.dryRun && fs.existsSync(agentsFile)
      ? fs.readFileSync(agentsFile, "utf8")
      : before;
    if (args.dryRun) {
      written.push("AGENTS.md (keep-it-out-of-git block)");
    } else if (after !== before) {
      written.push("AGENTS.md (keep-it-out-of-git block)");
    } else {
      skipped.push("AGENTS.md (keep-it-out-of-git block)");
    }
  } else {
    skipped.push("AGENTS.md (not in this profile)");
  }

  if (args.pr) {
    track(
      copyFile(
        path.join(PACK_ROOT, "templates", "pull_request_template.md"),
        path.join(target, ".github", "pull_request_template.md"),
        opts,
      ),
      written,
      skipped,
      ".github/pull_request_template.md",
    );
  }

  if (args.gitleaks) {
    const dest = path.join(target, "gitleaks.toml");
    if (fs.existsSync(dest) && !args.force) {
      console.log(`skip (exists): gitleaks.toml  (use --force)`);
      skipped.push("gitleaks.toml");
    } else if (args.dryRun) {
      console.log(`[dry-run] write gitleaks.toml`);
      written.push("gitleaks.toml");
    } else {
      fs.writeFileSync(dest, gitleaksToml(), "utf8");
      console.log(`wrote gitleaks.toml`);
      written.push("gitleaks.toml");
    }
  } else {
    skipped.push("gitleaks.toml (not in this profile)");
  }

  if (args.ci) {
    const dest = path.join(target, ".github", "workflows", "sensitive-data.yml");
    if (fs.existsSync(dest) && !args.force) {
      console.log(
        `skip (exists): .github/workflows/sensitive-data.yml  (use --force)`,
      );
      skipped.push(".github/workflows/sensitive-data.yml");
    } else if (args.dryRun) {
      console.log(`[dry-run] write ${dest}`);
      written.push(".github/workflows/sensitive-data.yml");
    } else {
      ensureDir(path.dirname(dest), false);
      fs.writeFileSync(dest, ciWorkflow(), "utf8");
      console.log(`wrote ${path.relative(process.cwd(), dest)}`);
      written.push(".github/workflows/sensitive-data.yml");
    }
  } else {
    skipped.push(".github/workflows/sensitive-data.yml (not in this profile)");
  }

  // Always leave agent-facing setup instructions (even when pieces were skipped).
  writePostInstall(target, {
    minimal: args.minimal,
    written,
    skipped,
    dryRun: args.dryRun,
  });
  if (!args.dryRun) {
    written.push(".agents/keep-it-out-of-git.POST_INSTALL.md");
  }

  console.log(`
IMPORTANT for coding agents:
  Init is bootstrap only. Read and follow:
    .agents/keep-it-out-of-git.POST_INSTALL.md
  Adapt AGENTS / CI / gitleaks / seeders to THIS project. Skipped files mean the
  repo already had its own setup — integrate, do not blindly overwrite.

Human next steps:
  1. Ask your coding agent to complete post-install setup for this repo
  2. Or follow .agents/keep-it-out-of-git.POST_INSTALL.md yourself
  3. git add + commit/PR the files you want to keep
  4. Optional DX: npx ... init --cursor   and/or   init --pr

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
