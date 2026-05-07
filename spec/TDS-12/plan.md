# TDS-12 Plan: Move Ticket to In Progress as soon as work starts

## Summary
Add a Jira transition step inside `prepareDispatch` (in `.github/scripts/jira-dispatch.mjs`) that flips the ticket to "In Progress" right after the issue fetch and before any branch/file work. Transition lookup uses Jira's transitions API and is best-effort: any failure logs a warning and lets the run continue.

## Approach

1. Add a new helper `transitionToInProgress(key, issue)` in `jira-dispatch.mjs`:
   - Read `issue.fields.status.statusCategory.key` (already present because the existing fetch requests `fields=...,status,...`).
   - Skip if the category is `indeterminate` (already In Progress) or `done` (already finished). Log the skip reason.
   - `GET /rest/api/3/issue/{key}/transitions` to list available transitions.
   - Pick a transition where `to.statusCategory.key === "indeterminate"`. If none, fall back to the first transition whose `name` matches `"in progress"` (case-insensitive).
   - If no match, log a warning and return — do not fail the run.
   - `POST /rest/api/3/issue/{key}/transitions` with body `{"transition": {"id": <id>}}`. The endpoint returns 204 No Content on success, so use raw `fetch` (not `fetchJson`, which expects JSON).
   - Wrap network calls in try/catch so any HTTP/network error becomes a warning, not a thrown error.

2. Call `transitionToInProgress(key, issue)` inside `prepareDispatch` immediately after the issue fetch (line 126-129) and before the PR-branch checkout block (line 140). This guarantees the status flip happens for both `pr` and `answer` modes, and before any code or filesystem mutations.

3. No new env vars or secrets — reuse `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN` via the existing `initJira()` already called at the top of `prepareDispatch`.

## Files changed
- `.github/scripts/jira-dispatch.mjs` — add helper + one call site.

## Validation
- `node --check .github/scripts/jira-dispatch.mjs` for syntax.
- Acceptance criteria mapped:
  1. New "To Do" ticket → transition fires before PR work. ✅ (call placed before checkout/file writes)
  2. Re-run on "In Progress" ticket → skipped via `indeterminate` guard. ✅
  3. Re-run on "Done" ticket → skipped via `done` guard. ✅
  4. No matching transition → warn + continue. ✅ (returns silently on no match; try/catch on fetches)
  5. Reuses existing Jira creds. ✅

## Risks
- Some Jira workflows expose multiple `indeterminate` transitions (e.g., "Start Work" vs "Reopen In Progress"). The helper picks the first match, which is the documented behaviour for `Array.prototype.find`. This matches the spec ("category match … or fall back to name match") and is acceptable for the listed acceptance criteria.
- The transitions API could respond slowly. The dispatch flow has no tight time budget here, so an extra round trip is fine.
- Cannot exercise live Jira from this run; relying on Jira REST v3 contract that `status.statusCategory.key` is returned with the standard `status` field. This is documented and stable.
