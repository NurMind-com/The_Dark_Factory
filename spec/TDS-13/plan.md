# TDS-13 Plan: Move ticket to Done and delete branch when dispatch PR merges

## Goal
On merge of a dispatch PR (head branch `tdf/<key>`), transition the linked Jira
ticket to a "Done" status category and delete the head branch. Both steps are
best-effort: failures log warnings and never block the workflow.

## Files changed

1. `.github/scripts/jira-dispatch.mjs` — extend with a `transition-done` mode and
   factor the shared transition wiring into a small helper used by both the
   existing `transitionToInProgress` and the new `transitionToDone`.
2. `.github/workflows/jira-pr-merged.yml` — new workflow.

## Script changes (`jira-dispatch.mjs`)

- Add `transition-done` to the mode dispatcher and to the usage error.
- Introduce a private `transitionToCategory(key, issue, opts)` helper that:
  - Skips early when the current `statusCategory.key` is in `opts.skipCategories`.
  - Fetches available transitions (warn-and-return on fetch failure).
  - Picks the first transition whose `to.statusCategory.key === opts.categoryKey`,
    falling back to a transition whose `name` (lowercased) is in `opts.nameMatchers`.
  - POSTs the transition (warn-and-return on HTTP / network failure).
  - Logs the chosen transition on success.
- Reimplement `transitionToInProgress` as a thin caller of the helper:
  - `skipCategories: ["indeterminate", "done"]`
  - `categoryKey: "indeterminate"`
  - `nameMatchers: ["in progress"]`
  - `label: "In Progress"`
- Add `transitionToDone(key, issue)`:
  - `skipCategories: ["done"]`
  - `categoryKey: "done"`
  - `nameMatchers: ["done", "resolved", "closed"]`
  - `label: "Done"`
- Add `transitionDone()` mode handler: init Jira, normalize `ISSUE_KEY`, fetch
  the issue with `?fields=status`, call `transitionToDone`. Warn-and-return on
  fetch failure.

The refactor keeps existing call sites intact and reuses validated error/log
shapes, which matters because the in-progress flow is already in production.

## Workflow (`jira-pr-merged.yml`)

```
on:
  pull_request:
    types: [closed]

permissions:
  contents: write       # branch deletion uses GH_PR_TOKEN, but keep for parity
  pull-requests: read

jobs:
  finalize:
    if: github.event.pull_request.merged == true
        && startsWith(github.event.pull_request.head.ref, 'tdf/')
    runs-on: ubuntu-latest
    timeout-minutes: 5
```

Steps:

1. `actions/checkout@v4` on `main` (no token needed for the script).
2. **Extract issue key** — bash with `shopt -s nocasematch` parses the head ref
   against `^tdf/([a-z][a-z0-9]+-[0-9]+)$`. On match, exports
   `ISSUE_KEY=<UPPERCASED>` and `should_run=true`. On miss, logs and sets
   `should_run=false`. This implements the case-insensitive `tdf/<key>` gate
   while letting the cheap job-level `startsWith` shortcut filter the common
   case.
3. **Transition Jira to Done** (when `should_run`): runs
   `node .github/scripts/jira-dispatch.mjs transition-done` with the Jira
   secrets injected as env. Best-effort — the script warns on any failure and
   exits 0.
4. **Delete head branch** (when `should_run`): one `curl -X DELETE` to
   `repos/{owner}/{repo}/git/refs/heads/{branch}` with `secrets.GH_PR_TOKEN`.
   - HTTP `204`/`200` → log success.
   - HTTP `422` → log info ("already deleted"), still success.
   - Anything else → `::warning::` and continue (workflow still completes
     successfully because the `case` arm doesn't fail).

The Jira and branch-delete steps are independent — branch deletion runs even
when the Jira transition warned, satisfying acceptance criterion 5.

## Acceptance criteria mapping

1. Dispatch PR merged → ticket transitions to Done category — covered by step 3.
2. Dispatch PR closed unmerged → no-op — `merged == true` job gate filters this.
3. Non-dispatch PR merged → no-op — `startsWith(...,'tdf/')` job gate plus the
   regex validation in step 2 short-circuit the rest of the steps.
4. Head branch removed from `origin` after a successful run — step 4.
5. No "Done" transition available → warn-and-continue, branch still deleted —
   step 3 returns early on warn; step 4 runs unconditionally on `should_run`.
6. Branch deletion `422` → workflow still completes — handled by `case 422)`.
7. Reuses existing secrets only — `JIRA_*` and `GH_PR_TOKEN`. No new secrets.

## Verification done

- `node --check .github/scripts/jira-dispatch.mjs` passes.
- The new helper is invoked through both old and new call sites; the
  `transitionToInProgress` log strings, skip semantics, and error shapes are
  preserved verbatim so the existing in-progress flow keeps behaving
  identically.

## Risks / unverified

- Cannot exercise the live `pull_request:closed` event from this run; the
  self-bootstrap merge of TDS-13 is the first real-world trigger. Spec
  acknowledges this.
- The Jira project must expose a transition whose target is in the `done`
  category (or named Done/Resolved/Closed). If neither is available, the
  warning is logged and the workflow continues — by design.
- `pull_request` events from forks have restricted secrets; repo is internal,
  so this is moot today. If that changes, both Jira and delete steps will
  silently warn and the workflow will still go green.
