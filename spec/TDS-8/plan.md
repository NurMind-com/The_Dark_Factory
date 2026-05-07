# TDS-8 Plan

## Scope
PR-mode smoke test of the Jira dispatch flow. Add a single marker file proving the end-to-end path (Jira button → dispatch workflow → branch → Claude run → PR) works.

## Changes
- Create `temp/dispatch_pr_smoke.md` with the exact contents specified in the ticket description (heading + one-line body).
- Update `spec/TDS-8/plan.md` (this file).
- Write `spec/TDS-8/response.md` with a short Jira-facing summary.

## Out of scope
- Any other repository file edits.
- Workflow, CLAUDE.md, or script changes.
- Tests or CI configuration.

## Verification
- `temp/dispatch_pr_smoke.md` exists with the exact required contents.
- No files outside `temp/dispatch_pr_smoke.md` and the `spec/TDS-8/` artefacts are modified.
- The dispatch workflow opens a PR carrying just these changes.

## Risks
- None substantive: marker file is documentation-only and not referenced by any code path.
