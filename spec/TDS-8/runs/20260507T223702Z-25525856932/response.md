# TDS-8 — PR-mode dispatch smoke test

**What changed**
- Added `temp/dispatch_pr_smoke.md` with the exact marker contents specified in the ticket.
- Updated `spec/TDS-8/plan.md` to capture the minimal scope.

**Why**
- Smoke test confirming that the Jira manual-trigger → `repository_dispatch` → branch → Claude run → PR path works end-to-end in PR mode.

**Risks**
- None. The marker file is documentation only and not referenced by any code or workflow.

**Next**
- Workflow opens the PR; reviewer confirms the marker file is present on the per-ticket branch.
