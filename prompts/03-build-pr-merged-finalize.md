# Step 3 — Add the PR-merged finalize flow

## What this prompt produces

- `.github/workflows/jira-pr-merged.yml` (new)
- `transition-done` mode added to `.github/scripts/jira-dispatch.mjs`

When a `tdf/<key>` PR merges, the Jira ticket transitions to Done and the head branch is deleted. Closes the loop.

## Preconditions

- Steps 1 and 2 complete: dispatch flow shipped, In Progress transition shipped.

## The prompt (paste verbatim into a Jira ticket; label `claude:pr`)

```markdown
Mirror of the In Progress feature for the post-merge side: when a dispatch PR merges, transition the Jira ticket to Done and delete the per-ticket branch automatically.

## Goal

Add a new GitHub Actions workflow that fires on PR merge and:
1. Transitions the linked Jira ticket to a "Done" status.
2. Deletes the per-ticket head branch (`tdf/<ticket-id>`) from `origin`.

Both steps are best-effort. Failures log warnings and never block the workflow.

## Scope

- New workflow file: `.github/workflows/jira-pr-merged.yml`.
- Trigger: `pull_request:` with `types: [closed]`. The job runs only when `github.event.pull_request.merged == true`.
- The job must also gate on the head branch matching `tdf/<key>` (case-insensitive). Skip non-dispatch PRs silently.
- Add a new helper mode in `.github/scripts/jira-dispatch.mjs`: `transition-done`. The mode reads `ISSUE_KEY` from env, fetches the issue, and transitions to a Done status using the same pattern as `transitionToInProgress` but matching `to.statusCategory.key === "done"` first, then a name match for `Done`/`Resolved`/`Closed` (case-insensitive). Skip if the ticket is already in `done` category. Warn-and-continue on every failure.
- Branch deletion: call `DELETE /repos/{owner}/{repo}/git/refs/heads/{branch}` using `secrets.GH_PR_TOKEN`. 422 (branch already deleted) is acceptable and logged as info, not warning.

## Workflow shape

```yaml
on:
  pull_request:
    types: [closed]

permissions:
  contents: write
  pull-requests: read

jobs:
  finalize:
    if: github.event.pull_request.merged == true && startsWith(github.event.pull_request.head.ref, 'tdf/')
    runs-on: ubuntu-latest
    steps:
      - actions/checkout@v4
      - Compute ISSUE_KEY from head.ref ("tdf/tds-12" -> "TDS-12")
      - node .github/scripts/jira-dispatch.mjs transition-done
      - Delete the head branch via REST API
```

## Acceptance criteria

1. When a dispatch PR (head `tdf/<key>`) is merged, the workflow runs and the Jira ticket transitions to a "Done" status category.
2. When a dispatch PR is closed without merging, the workflow is a no-op.
3. When a non-dispatch PR (any other head branch) is merged, the workflow is a no-op.
4. After a successful run, the head branch no longer exists on `origin`.
5. If the Jira workflow has no available "Done" transition, log a warning and continue. The branch must still be deleted.
6. If branch deletion returns 422 (already gone), the workflow still completes successfully.
7. Reuses `secrets.JIRA_BASE_URL` / `secrets.JIRA_EMAIL` / `secrets.JIRA_API_TOKEN` / `secrets.GH_PR_TOKEN`. No new secrets.

## Files expected to change

- `.github/workflows/jira-pr-merged.yml` (new).
- `.github/scripts/jira-dispatch.mjs` (extend with `transition-done` mode).

## Files NOT to change

- `.github/workflows/jira-dispatch.yml` and `.github/workflows/poc-session.yml`.
- Any other script.
- `CLAUDE.md`, `README.md`, `github_actions_claude_spec.md`.
- Any existing `spec/<TICKET-ID>/` folder other than this ticket's.

## Notes for Claude

- This is a `claude:pr` ticket. Make changes on the per-ticket branch `tdf/<this-key>` and let the workflow open the PR.
- Update `spec/<this-key>/plan.md` with the implementation plan.
- Write a short Jira-facing summary to `spec/<this-key>/response.md`.
- Reference: `transitionToInProgress` in `jira-dispatch.mjs` for the transition pattern. The new helper mode and the In-Progress helper may share a `transitionTo({key, issue, categoryKey, nameMatchers})` if the duplication is worth refactoring; otherwise inline a separate function. Use your judgement.
- Self-bootstrap: this ticket's own merge will trigger the new workflow and immediately transition this ticket to Done and delete its branch. By design.

## Risks

- `pull_request` events from forks have restricted secrets. Internal-only repo, so this risk is moot here.
- If the bot lacks branch-deletion rights, log a warning. The ticket transition still completes.
- GitHub repo setting "Automatically delete head branches" could be enabled in parallel; that does not conflict because both paths converge on "branch deleted".
```

## Why this works as a build prompt

The "self-bootstrap" line is the cheekiest and most useful part: the very PR that adds the finalize flow gets finalized BY the new flow on its own merge. It's a built-in end-to-end test.

The shared helper hint (`transitionTo({key, issue, categoryKey, nameMatchers})`) is optional but produces cleaner code; Claude chose to take the refactor when given this prompt verbatim.
