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
const COPILOT_MARKER_START = "<!-- keep-it-out-of-git:start -->";
const COPILOT_MARKER_END = "<!-- keep-it-out-of-git:end -->";

function packVersion() {
  try {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(PACK_ROOT, "package.json"), "utf8"),
    );
    return pkg.version || "0.0.0";
  } catch {
    return "0.0.0";
  }
}

function printHelp() {
  console.log(`Keep It Out of Git — installer (v${packVersion()})

Preferred (bust cache if re-testing):
  npx --yes github:Sultonisky/keep-it-out-of-git@main init

Alternate (Unix / Git Bash):
  ./install.sh init [options]

Commands:
  init      Install portable core into the current project
  update    Refresh managed pack files (same as init --force)
  help      Show this help

Default init / update (portable core):
  skills → .agents/skills/
  path script → scripts/check-sensitive-paths.sh
  AGENTS.md block (marker-managed; preserves filled private-storage path on update)
  .github/copilot-instructions.md block (for GitHub Copilot discovery)
  gitleaks.toml
  .github/workflows/sensitive-data.yml
  .agents/keep-it-out-of-git.POST_INSTALL.md  (agent must finish setup)
  .agents/keep-it-out-of-git.INSTALL.json     (what this run wrote/skipped)

Update (recommended for existing installs):
  npx --yes github:Sultonisky/keep-it-out-of-git@main update

Options:
  --minimal      Skills + path script only
  --cursor       Also copy skills → .cursor/skills/
  --pr           Also copy .github/pull_request_template.md
  --all          Portable core + --cursor + --pr
  --force        Overwrite existing managed files (implied by update)
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
    else if (a === "--copilot") flags.add("copilot");
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
    // Copilot does not reliably read .agents/ — ship instructions into its native file.
    copilot: all || flags.has("copilot") || core,
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

function defaultPrivateStorageLine() {
  return "- **This repo uses:** `<FILL: e.g. storage/app/private/ or storage/private/>`";
}

function extractPrivateStorageLine(agentsMarkdown) {
  if (!agentsMarkdown) return null;
  const start = agentsMarkdown.indexOf(AGENTS_MARKER_START);
  const end = agentsMarkdown.indexOf(AGENTS_MARKER_END);
  if (start === -1 || end === -1 || end <= start) return null;
  const block = agentsMarkdown.slice(start, end);
  const match = block.match(/^- \*\*This repo uses:\*\*.+$/m);
  if (!match) return null;
  const line = match[0];
  if (line.includes("<FILL:")) return null;
  return line;
}

function agentsBlock(privateStorageLine) {
  const storageLine = privateStorageLine || defaultPrivateStorageLine();
  return `${AGENTS_MARKER_START}
## Keep It Out of Git

People data and secrets do not belong in git. Demo seeders/fixtures may stay in
git only when fictional and environment-guarded.

### Agent: post-install setup required

\`npx … init\` / \`update\` is only a **bootstrap**. It may skip files that already
existed (unless \`update\` / \`--force\`). Before treating this pack as fully active,
the coding agent for **this repo** must complete project-specific setup:

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

${storageLine}
- Never force-add gitignored private storage
- Real dumps/imports stay local; use anonymized \`Sample…\` / \`Test…\` / Faker in tests

### Guards

- Path check: \`bash scripts/check-sensitive-paths.sh\` (Git Bash/WSL on Windows)
- Secret scan: gitleaks (see \`gitleaks.toml\` / CI) when present
- Never commit SSH/VPS/deploy keys (\`id_ed25519\`, \`.pub\`, \`.ssh/\`) — use Actions secrets
- **Agents must skip** user-private keys: do not search, open, or print
  \`id_ed25519\` / \`.pub\` / \`.ssh/\` / live \`.env\` / cloud cred JSON. Point to
  Actions secret **names** only — never ask the user to paste private key material
- Skills: \`.agents/skills/\` (optional \`.cursor/skills/\`)

### Safe demo data

- Seeders/factories/fixtures: fictional only
- Demo seeders must refuse production
- Bootstrap passwords from env/config — never hardcode live secrets

Skill details: \`.agents/skills/*/SKILL.md\` and \`templates.md\`.
${AGENTS_MARKER_END}
`;
}

function postInstallDoc({ minimal, written, skipped, version }) {
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

Installer version: **${version}**  
Also see machine-readable: \`.agents/keep-it-out-of-git.INSTALL.json\`

The installer may have skipped files because this project already had AGENTS.md,
CI, gitleaks, or scripts. Do **not** assume every guard is active.

If \`gitleaks.toml\`, \`AGENTS.md\`, or CI workflow are listed under **Skipped** or
missing from disk, you must create/wire them for THIS repo (do not only report
gaps — implement when the human asks to finish setup).

Profile this run: **${minimal ? "minimal" : "portable core"}**

## Written this run

${writtenList}

## Skipped this run (already existed, or not in profile)

${skippedList}

## Required agent tasks (adapt to THIS repo)

1. **Verify install freshness** — Read INSTALL.json. If \`packVersion\` is older than
   upstream or written[] lacks gitleaks/AGENTS/CI while profile is portable core,
   ask human to re-run:
   \`npx --yes github:Sultonisky/keep-it-out-of-git@main init --force\`
2. **Inventory** — Confirm which guards exist on disk (not from memory/prior chats).
3. **Private storage** — Set the real gitignored path in \`AGENTS.md\`.
4. **Path script** — Adapt regexes; run \`bash scripts/check-sensitive-paths.sh\`
   (Git Bash/WSL on Windows PowerShell).
5. **Gitleaks** — Ensure \`gitleaks.toml\` exists; integrate with existing scanners.
6. **CI** — If \`ci-cd.yml\` / \`tests.yml\` already exist, **add steps there** (or
   keep additive \`sensitive-data.yml\`). Do not claim CI is missing without checking
   both the new workflow and existing pipelines.
7. **Safe demo data** — Fix seeders/factories (fictional, refuse production, env
   passwords). Init never rewrites app seeders.
8. **Copilot** — Follow \`.github/copilot-instructions.md\` Keep It Out of Git block.
9. **User-private keys** — Never hunt/open/print SSH/VPS/deploy keys (\`id_ed25519\`,
   \`.pub\`, \`.ssh/\`) or live \`.env\` / cloud creds. Skip; use Actions secret names only.
10. **Commit** — \`git add\` + PR; ask before force-overwriting tuned files.

## Skills to read

- \`.agents/skills/sensitive-data-git/SKILL.md\`
- \`.agents/skills/safe-demo-data/SKILL.md\`
- \`.agents/skills/sensitive-path-guard/SKILL.md\`
- \`.agents/skills/gitleaks-guard/SKILL.md\`

Pack upstream: https://github.com/Sultonisky/keep-it-out-of-git
`;
}

function upsertMarkedFile(file, block, startMarker, endMarker, { force, dryRun }, createTitle) {
  if (!fs.existsSync(file)) {
    if (dryRun) {
      console.log(`[dry-run] create ${file}`);
      return "written";
    }
    ensureDir(path.dirname(file), false);
    const body = createTitle ? `${createTitle}\n\n${block}\n` : `${block}\n`;
    fs.writeFileSync(file, body, "utf8");
    console.log(`wrote ${path.relative(process.cwd(), file)}`);
    return "written";
  }

  const current = fs.readFileSync(file, "utf8");
  const start = current.indexOf(startMarker);
  const end = current.indexOf(endMarker);

  let next;
  if (start !== -1 && end !== -1 && end > start) {
    if (!force) {
      console.log(
        `skip (${path.relative(process.cwd(), file)} block exists): use --force to refresh`,
      );
      return "skipped";
    }
    next =
      current.slice(0, start) + block + current.slice(end + endMarker.length);
  } else {
    next = `${current.trimEnd()}\n\n${block}\n`;
  }

  if (dryRun) {
    console.log(`[dry-run] update ${file}`);
    return "written";
  }
  fs.writeFileSync(file, next, "utf8");
  console.log(`updated ${path.relative(process.cwd(), file)}`);
  return "written";
}

function writeAgentsMd(target, opts) {
  const file = path.join(target, "AGENTS.md");
  const existing = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  const preserved = extractPrivateStorageLine(existing);
  return upsertMarkedFile(
    file,
    agentsBlock(preserved),
    AGENTS_MARKER_START,
    AGENTS_MARKER_END,
    opts,
    "# Agent instructions",
  );
}

function copilotBlock() {
  return `${COPILOT_MARKER_START}
## Keep It Out of Git (required follow-up)

Bootstrap may be incomplete if this repo already had AGENTS/CI/gitleaks.

1. Read \`.agents/keep-it-out-of-git.POST_INSTALL.md\` and
   \`.agents/keep-it-out-of-git.INSTALL.json\` first.
2. Do not assume every guard file was written — check INSTALL.json written vs skipped.
3. Complete project-specific setup: private storage path, path-script regexes,
   gitleaks, CI wiring into *existing* workflows if present, safe-demo-data for seeders.
4. Skills live under \`.agents/skills/\` (sensitive-data-git, safe-demo-data,
   sensitive-path-guard, gitleaks-guard). Read those SKILL.md files when relevant.
5. Ask before overwriting human-tuned AGENTS/CI/gitleaks.
6. **User-private keys:** never search/open/print \`id_ed25519\`, \`.pub\`, \`.ssh/\`,
   live \`.env\`, or cloud cred JSON. Deploy auth stays in GitHub Actions secrets.
${COPILOT_MARKER_END}
`;
}

function writeCopilotMd(target, opts) {
  return upsertMarkedFile(
    path.join(target, ".github", "copilot-instructions.md"),
    copilotBlock(),
    COPILOT_MARKER_START,
    COPILOT_MARKER_END,
    opts,
    "# GitHub Copilot instructions",
  );
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

function writePostInstall(target, { minimal, written, skipped, dryRun, version }) {
  const dest = path.join(target, ".agents", "keep-it-out-of-git.POST_INSTALL.md");
  const body = postInstallDoc({ minimal, written, skipped, version });
  if (dryRun) {
    console.log(`[dry-run] write ${dest}`);
    return;
  }
  ensureDir(path.dirname(dest), false);
  fs.writeFileSync(dest, body, "utf8");
  console.log(`wrote ${path.relative(process.cwd(), dest)}`);
}

function writeInstallJson(target, { minimal, written, skipped, dryRun, version }) {
  const dest = path.join(target, ".agents", "keep-it-out-of-git.INSTALL.json");
  const payload = {
    pack: "keep-it-out-of-git",
    packVersion: version,
    profile: minimal ? "minimal" : "portable-core",
    installedAt: new Date().toISOString(),
    written,
    skipped,
    agentMustRead: [
      ".agents/keep-it-out-of-git.POST_INSTALL.md",
      ".agents/keep-it-out-of-git.INSTALL.json",
      ".github/copilot-instructions.md",
      "AGENTS.md",
    ],
    verifyOnDisk: [
      ".agents/skills/sensitive-data-git/SKILL.md",
      ".agents/skills/safe-demo-data/SKILL.md",
      ".agents/skills/sensitive-path-guard/SKILL.md",
      ".agents/skills/gitleaks-guard/SKILL.md",
      "scripts/check-sensitive-paths.sh",
      "gitleaks.toml",
      ".github/workflows/sensitive-data.yml",
      "AGENTS.md",
      ".github/copilot-instructions.md",
    ],
  };
  if (dryRun) {
    console.log(`[dry-run] write ${dest}`);
    return;
  }
  ensureDir(path.dirname(dest), false);
  fs.writeFileSync(dest, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
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
    const status = writeAgentsMd(target, opts);
    if (status === "written") written.push("AGENTS.md (keep-it-out-of-git block)");
    else skipped.push("AGENTS.md (keep-it-out-of-git block)");
  } else {
    skipped.push("AGENTS.md (not in this profile)");
  }

  if (args.copilot) {
    const status = writeCopilotMd(target, opts);
    if (status === "written") {
      written.push(".github/copilot-instructions.md (keep-it-out-of-git block)");
    } else {
      skipped.push(".github/copilot-instructions.md (keep-it-out-of-git block)");
    }
  } else {
    skipped.push(".github/copilot-instructions.md (not in this profile)");
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

  const version = packVersion();

  // Always leave agent-facing setup instructions (even when pieces were skipped).
  writePostInstall(target, {
    minimal: args.minimal,
    written: [...written],
    skipped: [...skipped],
    dryRun: args.dryRun,
    version,
  });
  written.push(".agents/keep-it-out-of-git.POST_INSTALL.md");

  writeInstallJson(target, {
    minimal: args.minimal,
    written: [...written],
    skipped: [...skipped],
    dryRun: args.dryRun,
    version,
  });
  written.push(".agents/keep-it-out-of-git.INSTALL.json");

  const expectCore = [
    "scripts/check-sensitive-paths.sh",
    "gitleaks.toml",
    "AGENTS.md",
    ".github/copilot-instructions.md",
    ".github/workflows/sensitive-data.yml",
    ".agents/keep-it-out-of-git.POST_INSTALL.md",
  ];

  console.log(`
IMPORTANT for coding agents:
  Init is bootstrap only (pack v${version}). Read:
    .agents/keep-it-out-of-git.POST_INSTALL.md
    .agents/keep-it-out-of-git.INSTALL.json
  Verify files on disk (do not reuse prior-chat summaries). Skipped = integrate.

Expected portable-core artifacts:
${expectCore.map((p) => `  - ${p}`).join("\n")}

Human next steps:
  1. Re-test with cache bust if artifacts missing:
       npx --yes github:Sultonisky/keep-it-out-of-git@main init
  2. Ask your coding agent to finish POST_INSTALL for this repo
  3. git add + commit/PR the files you want to keep
  4. Optional: init --cursor   and/or   init --pr

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

  if (args.command === "update") {
    // Refresh managed pack files without requiring users to delete/reinstall.
    args.force = true;
    console.log("Keep It Out of Git — update (refresh managed files with --force)\n");
    initProject(args);
    return;
  }

  console.error(`Unknown command: ${args.command}`);
  printHelp();
  process.exit(1);
}

main();
