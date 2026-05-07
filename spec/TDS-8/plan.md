# TDS-8 Plan

## Status
Implemented in the prior run. PR #9 opened on branch `tdf/tds-8`. This continuation run was triggered by the bot's own success-comment webhook; no additional repo changes are required.

## Scope
PR-mode smoke test of the Jira dispatch flow. Add a single marker file proving the end-to-end path (Jira button → dispatch workflow → branch → Claude run → PR) works.

## Changes (already on branch)
- `temp/dispatch_pr_smoke.md` — exact heading + one-line body required by the ticket.
- `spec/TDS-8/plan.md` — this file.
- `spec/TDS-8/response.md` — Jira-facing summary.

## Out of scope
- Any other repository file edits.
- Workflow, CLAUDE.md, or script changes.
- Tests or CI configuration.

## Verification
- `temp/dispatch_pr_smoke.md` is present with the exact required contents.
- No files outside that marker and the `spec/TDS-8/` artefacts have been modified on this branch.
- PR #9 carries only those changes.

## Risks
- None substantive: marker file is documentation-only and not referenced by any code path.
