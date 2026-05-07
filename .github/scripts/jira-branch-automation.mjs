import { mkdir, writeFile } from "node:fs/promises";

const mode = process.argv[2] ?? "prepare";
const {
  BRANCH_NAME,
  GITHUB_ENV,
  GITHUB_REPOSITORY,
  JIRA_BASE_URL,
  JIRA_EMAIL,
  JIRA_API_TOKEN,
  ISSUE_KEY,
  ISSUE_SLUG,
  ISSUE_TITLE,
  SPEC_FILE,
  PLAN_FILE,
  PR_URL,
} = process.env;

if (!BRANCH_NAME) {
  throw new Error("Missing required environment variable: BRANCH_NAME");
}

const branchIssueKey = extractIssueKey(BRANCH_NAME);
if (!branchIssueKey) {
  console.log(`Branch "${BRANCH_NAME}" does not start with a Jira issue key. Skipping.`);
  await appendGithubEnv({ SHOULD_RUN: "false" });
  process.exit(0);
}

const required = { JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN };
for (const [name, value] of Object.entries(required)) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
}

const jiraBaseUrl = JIRA_BASE_URL.replace(/\/+$/, "");
const headers = {
  Authorization: `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString("base64")}`,
  Accept: "application/json",
  "Content-Type": "application/json",
};

if (mode === "prepare") {
  await prepareBranchFiles();
} else if (mode === "comment") {
  await commentOnJira();
} else if (mode === "respond") {
  await respondToComment();
} else {
  throw new Error(`Unknown mode: ${mode}`);
}

async function prepareBranchFiles() {
  const issue = await getIssue(branchIssueKey);
  const fields = issue.fields ?? {};
  const slug = slugify(fields.summary ?? branchIssueKey);
  const folderName = `${branchIssueKey}-${slug}`;
  const specFile = `${folderName}/spec.md`;
  const planFile = `${folderName}/plan.md`;
  const issueTitle = fields.summary ?? branchIssueKey;
  const jiraIssueUrl = `${jiraBaseUrl}/browse/${branchIssueKey}`;

  await mkdir(folderName, { recursive: true });
  await writeFile("README.md", buildReadme({ issue, issueKey: branchIssueKey, slug, folderName }), "utf8");
  await writeFile(specFile, buildSpec({ issue, issueKey: branchIssueKey, branchName: BRANCH_NAME }), "utf8");

  await appendGithubEnv({
    SHOULD_RUN: "true",
    BRANCH_NAME,
    ISSUE_KEY: branchIssueKey,
    ISSUE_SLUG: slug,
    ISSUE_TITLE: issueTitle,
    JIRA_ISSUE_URL: jiraIssueUrl,
    SPEC_FILE: specFile,
    PLAN_FILE: planFile,
  });

  console.log(`Created README.md and ${specFile}. Claude Code should create ${planFile}.`);
}

async function commentOnJira() {
  const issueKey = ISSUE_KEY || branchIssueKey;
  const slug = ISSUE_SLUG || slugify(issueKey);
  const folderName = `${issueKey}-${slug}`;
  const specFile = SPEC_FILE || `${folderName}/spec.md`;
  const planFile = PLAN_FILE || `${folderName}/plan.md`;

  const branchUrl = `https://github.com/${GITHUB_REPOSITORY}/tree/${encodeURIComponent(BRANCH_NAME)}`;
  const specUrl = `https://github.com/${GITHUB_REPOSITORY}/blob/${encodeURIComponent(BRANCH_NAME)}/${specFile}`;
  const planUrl = `https://github.com/${GITHUB_REPOSITORY}/blob/${encodeURIComponent(BRANCH_NAME)}/${planFile}`;
  const prUrl = PR_URL || "";

  await fetchJson(`${jiraBaseUrl}/rest/api/3/issue/${encodeURIComponent(issueKey)}/comment`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      body: {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Branch automation created the Jira spec and Claude Code plan." }],
          },
          linkParagraph("Branch", branchUrl),
          linkParagraph("Spec", specUrl),
          linkParagraph("Plan", planUrl),
          ...(prUrl ? [linkParagraph("Pull request", prUrl)] : []),
        ],
      },
    }),
  });

  console.log(`Commented on ${issueKey} with spec and plan links.`);
}

async function respondToComment() {
  // This function can be extended to handle comment-specific logic
  // For now, it provides a hook for future comment response features
  const { COMMENT_BODY, COMMENT_AUTHOR, ISSUE_NUMBER } = process.env;
  
  if (!COMMENT_BODY || !ISSUE_NUMBER) {
    throw new Error("Missing required environment variables for comment response");
  }
  
  console.log(`Processing comment from ${COMMENT_AUTHOR} on issue/PR #${ISSUE_NUMBER}`);
  
  // Check if this is a Jira-linked issue
  if (branchIssueKey) {
    console.log(`Comment is on Jira-linked issue: ${branchIssueKey}`);
    
    // Optionally, we could post a summary back to Jira
    // For now, we'll just log that we processed it
    console.log("Comment processing complete. Response will be handled by Claude Code action.");
  }
  
  return { success: true };
}

async function getIssue(issueKey) {
  return fetchJson(
    `${jiraBaseUrl}/rest/api/3/issue/${encodeURIComponent(issueKey)}?fields=summary,description,status,assignee,reporter,priority,issuetype,labels,components,created,updated`,
    { headers },
  );
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Jira request failed (${response.status} ${response.statusText}): ${body}`);
  }

  return response.json();
}

async function appendGithubEnv(values) {
  if (!GITHUB_ENV) return;
  const body = Object.entries(values)
    .map(([key, value]) => {
      const normalized = String(value ?? "");
      if (normalized.includes("\n")) {
        return `${key}<<EOF_${key}\n${normalized}\nEOF_${key}`;
      }
      return `${key}=${normalized}`;
    })
    .join("\n");
  await writeFile(GITHUB_ENV, `${body}\n`, { flag: "a" });
}

function buildReadme({ issue, issueKey, slug }) {
  const fields = issue.fields ?? {};
  const specFile = `spec/${issueKey}-${slug}.md`;
  const planFile = `${issueKey}-${slug}-plan.md`;

  return `# ${issueKey}: ${fields.summary ?? "Untitled Jira issue"}

Generated from Jira when branch \`${BRANCH_NAME}\` was created.

## Generated Files

- Spec: \`${specFile}\`
- Plan: \`${planFile}\`

## Links

- Jira: ${jiraBaseUrl}/browse/${issueKey}
- Repository: https://github.com/${GITHUB_REPOSITORY}
`;
}

function buildSpec({ issue, issueKey, branchName }) {
  const fields = issue.fields ?? {};
  const description = adfToMarkdown(fields.description).trim() || "_No description provided._";

  return `# ${issueKey}: ${fields.summary ?? "Untitled Jira issue"}

Generated from Jira on ${new Date().toISOString()}.

## Links

- Jira: ${jiraBaseUrl}/browse/${issueKey}
- Branch: ${branchName}
- Repository: https://github.com/${GITHUB_REPOSITORY}

## Issue Details

| Field | Value |
|---|---|
| Key | ${markdownTableValue(issueKey)} |
| Title | ${markdownTableValue(fields.summary)} |
| Type | ${markdownTableValue(fields.issuetype?.name)} |
| Status | ${markdownTableValue(fields.status?.name)} |
| Priority | ${markdownTableValue(fields.priority?.name)} |
| Assignee | ${markdownTableValue(fields.assignee?.displayName)} |
| Reporter | ${markdownTableValue(fields.reporter?.displayName)} |
| Labels | ${markdownTableValue((fields.labels ?? []).join(", "))} |
| Components | ${markdownTableValue((fields.components ?? []).map((component) => component.name).join(", "))} |
| Created | ${markdownTableValue(fields.created)} |
| Updated | ${markdownTableValue(fields.updated)} |

## Full Description

${description}
`;
}

function extractIssueKey(branchName) {
  return branchName.match(/^([a-z][a-z0-9]+-\d+)/i)?.[1].toUpperCase() ?? null;
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "ticket";
}

function markdownTableValue(value) {
  return String(value || "-").replace(/\|/g, "\\|").replace(/\n/g, "<br>");
}

function linkParagraph(label, href) {
  return {
    type: "paragraph",
    content: [
      { type: "text", text: `${label}: ` },
      { type: "text", text: href, marks: [{ type: "link", attrs: { href } }] },
    ],
  };
}

function adfToMarkdown(node) {
  if (!node) return "";
  if (Array.isArray(node)) return node.map(adfToMarkdown).join("");

  switch (node.type) {
    case "doc":
      return blockContent(node).join("\n\n");
    case "paragraph":
      return inlineContent(node);
    case "heading":
      return `${"#".repeat(node.attrs?.level ?? 2)} ${inlineContent(node)}`;
    case "bulletList":
      return listContent(node, "-");
    case "orderedList":
      return orderedListContent(node);
    case "listItem":
      return blockContent(node).join("\n");
    case "blockquote":
      return blockContent(node)
        .join("\n")
        .split("\n")
        .map((line) => `> ${line}`)
        .join("\n");
    case "codeBlock":
      return `\`\`\`\n${textContent(node)}\n\`\`\``;
    case "rule":
      return "---";
    case "hardBreak":
      return "\n";
    case "text":
      return applyMarks(node.text ?? "", node.marks ?? []);
    default:
      return blockContent(node).join("\n");
  }
}

function blockContent(node) {
  return (node.content ?? []).map(adfToMarkdown).filter(Boolean);
}

function inlineContent(node) {
  return (node.content ?? []).map(adfToMarkdown).join("");
}

function listContent(node, marker) {
  return (node.content ?? [])
    .map((item) =>
      adfToMarkdown(item)
        .split("\n")
        .map((line, index) => (index === 0 ? `${marker} ${line}` : `  ${line}`))
        .join("\n"),
    )
    .join("\n");
}

function orderedListContent(node) {
  const start = node.attrs?.order ?? 1;
  return (node.content ?? [])
    .map((item, index) =>
      adfToMarkdown(item)
        .split("\n")
        .map((line, lineIndex) => (lineIndex === 0 ? `${start + index}. ${line}` : `   ${line}`))
        .join("\n"),
    )
    .join("\n");
}

function textContent(node) {
  if (node.type === "text") return node.text ?? "";
  return (node.content ?? []).map(textContent).join("");
}

function applyMarks(text, marks) {
  return marks.reduce((value, mark) => {
    switch (mark.type) {
      case "strong":
        return `**${value}**`;
      case "em":
        return `_${value}_`;
      case "code":
        return `\`${value}\``;
      case "link":
        return `[${value}](${mark.attrs?.href ?? value})`;
      default:
        return value;
    }
  }, text);
}
