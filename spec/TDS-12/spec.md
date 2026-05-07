# TDS-12: Move Ticket to in progress as soon as work starts

Generated from Jira on 2026-05-07T23:37:03.929Z.

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
| Updated | 2026-05-08T02:36:14.674+0300 |

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

## Comments (0)

_No comments._
