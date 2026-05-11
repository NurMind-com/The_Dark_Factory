/**
 * Install deps and build `clients/<client>/<delivery>/web` → `dist/`.
 * Writes a markdown summary to COMMENT_FILE for Jira (Pages URL is appended by the workflow).
 *
 * Env: WEB_ROOT, COMMENT_FILE, optional GITHUB_SHA, GITHUB_SERVER_URL, GITHUB_REPOSITORY, GITHUB_RUN_ID
 */
import { spawnSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const env = process.env;
const repoRoot = process.cwd();
const webRoot = env.WEB_ROOT?.trim();
const commentFile = env.COMMENT_FILE?.trim();

function fail(msg) {
  console.error(msg);
  process.exit(2);
}

if (!webRoot) fail("WEB_ROOT is required");
if (!commentFile) fail("COMMENT_FILE is required");

const root = join(repoRoot, webRoot);
const pkg = join(root, "package.json");
if (!existsSync(pkg)) {
  writeCommentAndExit(1, [
    "## Path",
    `Missing \`${webRoot}/package.json\`. Create the web app under that path (see \`docs/product-deploy.md\`).`,
  ]);
}

const lines = [];
let exitCode = 0;

const npm = "npm";

function run(cmd, args, opts = {}) {
  return spawnSync(cmd, args, {
    encoding: "utf8",
    cwd: opts.cwd ?? root,
    env: { ...process.env, ...opts.env },
    maxBuffer: 10 * 1024 * 1024,
    shell: opts.shell ?? process.platform === "win32",
  });
}

function tail(s, n = 6000) {
  if (!s) return "";
  return s.length <= n ? s : s.slice(-n);
}

const lock = join(root, "package-lock.json");
const installArgs = existsSync(lock) ? ["ci"] : ["install"];
let r = run(npm, installArgs, { cwd: root });
if (r.status !== 0) {
  lines.push("## npm install", "", "```", tail(r.stderr || r.stdout || "unknown error"), "```");
  writeCommentAndExit(1, lines);
}

r = run(npm, ["run", "build"], { cwd: root });
if (r.status !== 0) {
  lines.push("## Build", "", "```", tail(r.stderr || r.stdout || "unknown error"), "```");
  writeCommentAndExit(1, lines);
}

lines.push("## Build", "Succeeded.");

const dist = join(root, "dist");
if (!existsSync(dist)) {
  lines.push("", `_Note: expected output directory \`${webRoot}/dist\` is missing after build._`);
  exitCode = 1;
} else {
  lines.push(
    "",
    "## Publish",
    "Static files from `dist/` are uploaded by this workflow to **GitHub Pages** (repo Settings → Pages → Source: GitHub Actions). The live URL is appended below when deploy succeeds.",
  );
}

lines.push("", "## Git", `- **Commit:** \`${env.GITHUB_SHA || "unknown"}\``, "");
if (env.GITHUB_SERVER_URL && env.GITHUB_REPOSITORY && env.GITHUB_RUN_ID) {
  lines.push(
    `- **Workflow run:** ${env.GITHUB_SERVER_URL}/${env.GITHUB_REPOSITORY}/actions/runs/${env.GITHUB_RUN_ID}`,
  );
}

writeFileSync(commentFile, lines.join("\n"), "utf8");
process.exit(exitCode);

function writeCommentAndExit(code, parts) {
  const body = [...parts, "", "## Git", `- **Commit:** \`${env.GITHUB_SHA || "unknown"}\``].join("\n");
  writeFileSync(commentFile, body, "utf8");
  process.exit(code);
}
