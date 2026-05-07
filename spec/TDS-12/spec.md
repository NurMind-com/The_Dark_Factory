# TDS-12: Move Ticket to in progress as soon as work starts

Generated from Jira on 2026-05-07T23:39:17.969Z.

## Issue Details

| Field | Value |
|---|---|
| Key | TDS-12 |
| Title | Move Ticket to in progress as soon as work starts |
| Type | Task |
| Status | To Do |
| Priority | Medium |
| Assignee | - |
| Reporter | Roland Abou Younes |
| Labels | claude:pr |
| Components | - |
| Created | 2026-05-08T02:34:18.586+0300 |
| Updated | 2026-05-08T02:38:53.776+0300 |

## Description

When the dispatch flow starts handling a Jira ticket, transition it to "In Progress" so the ticket reflects active work in real time.

## Goal

In `.github/scripts/jira-dispatch.mjs` (mode `prepare-dispatch`), after the Jira issue is fetched and we have decided to run, transition the ticket to "In Progress" if it is currently in a pre-work status.

## Scope

- Add a Jira transition step inside `prepareDispatch` after the Jira fetch and before the PR-branch checkout, so the ticket flips status before any code work begins.
- Source the transition target from Jira's transitions API (`GET /rest/api/3/issue/{key}/transitions`). Match by `to.statusCategory.key === "indeterminate"` (Jira's category for In Progress) or fall back to the transition whose name matches "In Progress" case-insensitively.
- Skip the transition if the issue is already in `indeterminate` (in progress) or `done` status category, so re-runs on Done tickets are no-ops.
- Skip the transition if no matching transition is available for the current status (some ticket types or workflows may not allow it). Log a warning. Do not fail the run.
- POST to `/rest/api/3/issue/{key}/transitions` with `{"transition": {"id": "<id>"}}`. No comments or fields to set, just status.

## Acceptance criteria

1. After a manual dispatch on a "To Do" ticket, the Jira ticket moves to "In Progress" before Claude finishes.
2. On a re-run of an "In Progress" ticket, the transition is skipped silently.
3. On a re-run of a "Done" ticket, the transition is skipped silently.
4. If the Jira workflow has no available "In Progress" transition for the current state, the dispatch run continues normally and logs a warning. Failure to transition must not abort the run.
5. The transition uses the existing `JIRA_BASE_URL` / `JIRA_EMAIL` / `JIRA_API_TOKEN` secrets. No new secrets.

## Files expected to change

- `.github/scripts/jira-dispatch.mjs` (only).

## Files NOT to change

- `.github/workflows/jira-dispatch.yml`, `.github/workflows/poc-session.yml`
- `.github/scripts/` (only `jira-dispatch.mjs` may change)
- `CLAUDE.md`, `README.md`, `github_actions_claude_spec.md`
- Any existing `spec/<TICKET-ID>/` folder other than this ticket's

## Notes for Claude

- This is a `claude:pr` ticket. Make changes on the per-ticket branch `tdf/<this-key>` and let the workflow open the PR.
- Update `spec/<this-key>/plan.md` with the implementation plan.
- Write a short Jira-facing summary to `spec/<this-key>/response.md`: which transition was used, how status detection works, fallback behaviour.
- Reference: existing `initJira()`, `fetchJson()`, and Jira REST patterns already in `jira-dispatch.mjs`.

## Follow-ups (not in this ticket)

- Transition back to "Done" / "Resolved" after PR merge. Requires a separate workflow listening for `pull_request: closed` merged PRs. Out of scope here.
- Add Jira label management hooks if the team wants `claude-code` activity tagged on the ticket.

## Comments (1)

### Roland Abou Younes on 2026-05-08T02:38:53.776+0300

[TDF-bot] Claude Code processed TDS-12 (conclusion: success).

Branch: [https://github.com/NurMind-com/The_Dark_Factory/tree/tdf%2Ftds-12](https://github.com/NurMind-com/The_Dark_Factory/tree/tdf%2Ftds-12)

Pull request: [https://github.com/NurMind-com/The_Dark_Factory/pull/13](https://github.com/NurMind-com/The_Dark_Factory/pull/13)

## TDS-12 — Move ticket to In Progress when work starts

**What changed**

`.github/scripts/jira-dispatch.mjs` (only) now transitions the Jira ticket to "In Progress" inside `prepareDispatch`, immediately after the issue fetch and before any branch checkout or file write. A new helper `transitionToInProgress(key, issue)` does the work; the existing `initJira()` / `fetchJson()` patterns are reused, so no new secrets are needed.

**How status detection works**

1. Read `status.statusCategory.key` from the already-fetched issue (the existing fetch already requests the `status` field).
2. If the category is `indeterminate` (already In Progress) or `done`, log and skip — re-runs on those tickets are silent no-ops.
3. Otherwise, `GET /rest/api/3/issue/{key}/transitions` and pick a transition whose `to.statusCategory.key === "indeterminate"`. If none, fall back to the first transition whose `name` matches `"in progress"` case-insensitively.
4. `POST /rest/api/3/issue/{key}/transitions` with `{"transition": {"id": "<id>"}}`.

**Fallback behaviour**

- No matching transition for the current state → log a warning and continue. The dispatch run is never aborted.
- Transitions API request fails or the POST returns non-2xx → log a warning and continue.
- All failures are best-effort; the ticket workflow is never blocked by a status-flip problem.

**Risks**

- If a Jira workflow exposes more than one `indeterminate` transition for a state (unusual), the helper picks the first one returned by Jira. This matches the spec.
- Could not exercise live Jira from this run; relying on the documented Jira REST v3 contract that `status.statusCategory.key` is returned with the standard `status` field, and that the transitions endpoint returns `{transitions: [...]}`.
