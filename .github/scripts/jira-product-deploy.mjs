/**
 * Product deploy workflow helper: validate client_payload / workflow_dispatch inputs
 * and write GitHub Actions step outputs (GITHUB_OUTPUT).
 *
 * Usage: node jira-product-deploy.mjs prepare-outputs
 * Env: ISSUE_KEY_IN, CLIENT_IN, DELIVERY_IN (set by the workflow)
 */
import { appendFileSync } from "node:fs";

const env = process.env;

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

function appendOutput(line) {
  const p = env.GITHUB_OUTPUT;
  if (!p) fail("GITHUB_OUTPUT is not set");
  appendFileSync(p, `${line}\n`);
}

function lowerSlug(s) {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function assertSlug(label, slug) {
  if (!slug) fail(`${label} is empty after normalisation`);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    fail(`${label} "${slug}" must match ^[a-z0-9]+(-[a-z0-9]+)*$ (use lowercase letters, digits, hyphens)`);
  }
}

function assertIssueKey(key) {
  const k = String(key ?? "").trim();
  if (!/^[A-Za-z][A-Za-z0-9]+-\d+$/.test(k)) {
    fail(`issue_key "${key}" must look like PROJ-123`);
  }
  return k.toUpperCase();
}

function prepareOutputs() {
  const issueKey = assertIssueKey(env.ISSUE_KEY_IN);
  const clientSlug = lowerSlug(env.CLIENT_IN);
  const deliverySlug = lowerSlug(env.DELIVERY_IN);
  assertSlug("client", clientSlug);
  assertSlug("delivery", deliverySlug);
  const envName = `product-deploy-${clientSlug}-${deliverySlug}`;
  appendOutput(`issue_key=${issueKey}`);
  appendOutput(`client_slug=${clientSlug}`);
  appendOutput(`delivery_slug=${deliverySlug}`);
  appendOutput(`env_name=${envName}`);
  appendOutput(`web_root=clients/${clientSlug}/${deliverySlug}/web`);
  console.log(`Prepared: ${issueKey} web_root=clients/${clientSlug}/${deliverySlug}/web environment=${envName}`);
}

const mode = process.argv[2];
if (mode === "prepare-outputs") {
  prepareOutputs();
} else {
  console.error("Usage: jira-product-deploy.mjs prepare-outputs");
  process.exit(1);
}
