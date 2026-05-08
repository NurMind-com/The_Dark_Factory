## TDS-13 — Move ticket to Done and delete branch on dispatch PR merge

### What changed
- New workflow `.github/workflows/jira-pr-merged.yml` triggers on `pull_request: closed` and gates on `merged == true` plus a `tdf/<key>` head-ref prefix. It extracts and uppercases the Jira key (case-insensitive regex), calls the script to transition the ticket to Done, and deletes the head branch via the GitHub REST API using `secrets.GH_PR_TOKEN`.
- `.github/scripts/jira-dispatch.mjs` gains a `transition-done` mode. The shared parts of the existing In-Progress logic are factored into a single `transitionToCategory(...)` helper; the Done path adds matchers for `Done` / `Resolved` / `Closed` and a "skip if already Done" guard. All failures warn-and-continue.

### Why
Mirrors the post-merge side of TDS-12: closes the loop so a merged dispatch PR automatically advances the Jira ticket and cleans up the per-ticket branch, with no manual follow-up.

### Behaviour
- Merged dispatch PR (`tdf/<key>`) → Jira → Done; head branch deleted.
- Closed-without-merging or non-`tdf/` PR → silent no-op (job filtered out).
- HTTP `422` on branch delete (already gone) → logged as info, workflow still green.
- No "Done" transition available → warning, branch deletion still runs.
- Reuses existing secrets only: `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`, `GH_PR_TOKEN`.

### Risks / unverified
- The first real-world trigger is the merge of this PR itself (self-bootstrap, by design). Cannot dry-run a `pull_request:closed` event from this run.
- `pull_request` events from forks have restricted secrets; repo is internal so this is moot today. If that changes, both steps will warn and the workflow will still complete.
- If "Automatically delete head branches" is enabled at the repo level, the API delete may race with GitHub's own deletion. The 422 branch in the case statement covers that path explicitly.

### Validation
- `node --check .github/scripts/jira-dispatch.mjs` passes.
- Workflow YAML parses cleanly.
- Head-ref regex was smoke-tested locally against `tdf/tds-13`, `TDF/TDS-13`, `tdf/Tds-7`, `feature/foo`, `tdf/`, and `tdf/abc` — all behave as expected.
