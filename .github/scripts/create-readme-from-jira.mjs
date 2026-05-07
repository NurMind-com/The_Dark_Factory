const {
  BRANCH_NAME,
  GITHUB_REPOSITORY,
  JIRA_BASE_URL,
  JIRA_EMAIL,
  JIRA_API_TOKEN,
} = process.env;

if (!BRANCH_NAME) {
  throw new Error("Missing required environment variable: BRANCH_NAME");
}

const issueKey = extractIssueKey(BRANCH_NAME);
if (!issueKey) {
  console.log(`Branch "${BRANCH_NAME}" does not start with a Jira issue key. Skipping.`);
  process.exit(0);
}

const required = { JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN };
for (const [name, value] of Object.entries(required)) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
}

const jiraBaseUrl = JIRA_BASE_URL.replace(/\/+$/, "");
const authHeader = `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString("base64")}`;
const headers = {
  Authorization: authHeader,
  Accept: "application/json",
  "Content-Type": "application/json",
};

const issue = await fetchJson(
  `${jiraBaseUrl}/rest/api/3/issue/${encodeURIComponent(issueKey)}?fields=summary,description,status,assignee,reporter,priority,issuetype,labels,components,created,updated`,
  { headers },
);

const readme = buildReadme({ issue, issueKey, branchName: BRANCH_NAME, jiraBaseUrl, repository: GITHUB_REPOSITORY });
await writeFile("README.md", readme);

await postJiraComment({
  jiraBaseUrl,
  issueKey,
  headers,
  branchName: BRANCH_NAME,
  repository: GITHUB_REPOSITORY,
});

console.log(`README.md created from ${issueKey}.`);

function extractIssueKey(branchName) {
  return branchName.match(/^([A-Z][A-Z0-9]+-\d+)/)?.[1] ?? null;
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Jira request failed (${response.status} ${response.statusText}): ${body}`);
  }

  return response.json();
}

async function writeFile(path, contents) {
  const { writeFile } = await import("node:fs/promises");
  await writeFile(path, contents, "utf8");
}

function buildReadme({ issue, issueKey, branchName, jiraBaseUrl, repository }) {
  const fields = issue.fields ?? {};
  const issueUrl = `${jiraBaseUrl}/browse/${issueKey}`;
  const repoUrl = repository ? `https://github.com/${repository}` : "";
  const description = adfToMarkdown(fields.description).trim() || "_No description provided._";

  return `# ${issueKey}: ${fields.summary ?? "Untitled Jira issue"}

Generated from Jira when branch \`${branchName}\` was created.

## Links

- Jira: ${issueUrl}
${repoUrl ? `- Repository: ${repoUrl}\n` : ""}
## Issue Details

| Field | Value |
|---|---|
| Type | ${markdownTableValue(fields.issuetype?.name)} |
| Status | ${markdownTableValue(fields.status?.name)} |
| Priority | ${markdownTableValue(fields.priority?.name)} |
| Assignee | ${markdownTableValue(fields.assignee?.displayName)} |
| Reporter | ${markdownTableValue(fields.reporter?.displayName)} |
| Labels | ${markdownTableValue((fields.labels ?? []).join(", "))} |
| Components | ${markdownTableValue((fields.components ?? []).map((component) => component.name).join(", "))} |
| Created | ${markdownTableValue(fields.created)} |
| Updated | ${markdownTableValue(fields.updated)} |

## Description

${description}
`;
}

function markdownTableValue(value) {
  return String(value || "-").replace(/\|/g, "\\|").replace(/\n/g, "<br>");
}

async function postJiraComment({ jiraBaseUrl, issueKey, headers, branchName, repository }) {
  const readmeUrl = repository
    ? `https://github.com/${repository}/blob/${encodeURIComponent(branchName)}/README.md`
    : `README.md on branch ${branchName}`;

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
            content: [
              { type: "text", text: "README.md was created for branch " },
              { type: "text", text: branchName, marks: [{ type: "code" }] },
              { type: "text", text: ": " },
              { type: "text", text: readmeUrl, marks: [{ type: "link", attrs: { href: readmeUrl } }] },
            ],
          },
        ],
      },
    }),
  });
}

function adfToMarkdown(node) {
  if (!node) return "";

  if (Array.isArray(node)) {
    return node.map(adfToMarkdown).join("");
  }

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
