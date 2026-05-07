# TDS-8: Smoke test: PR-mode dispatch creates a marker file

Generated from Jira on 2026-05-07T22:42:27.908Z.

## Issue Details

| Field | Value |
|---|---|
| Key | TDS-8 |
| Title | Smoke test: PR-mode dispatch creates a marker file |
| Type | Task |
| Status | To Do |
| Priority | Medium |
| Assignee | - |
| Reporter | Roland Abou Younes |
| Labels | claude:pr, smoke-test |
| Components | - |
| Created | 2026-05-08T01:36:30.818+0300 |
| Updated | 2026-05-08T01:37:54.859+0300 |

## Description

PR-mode smoke test for the dispatch flow. Create a short marker file at `temp/dispatch_pr_smoke.md` whose contents are exactly:

# Dispatch PR mode smoke test

This file is created by the Jira dispatch flow on a per-ticket branch and proves that PR mode works end-to-end.

Update `plan.md` to reflect this minimal scope. Write a short summary to `response.md`. Do not modify any other repository files.

## Comments (1)

### Roland Abou Younes on 2026-05-08T01:37:54.859+0300

[TDF-bot] Claude Code processed TDS-8 (conclusion: success).

Branch: [https://github.com/NurMind-com/The_Dark_Factory/tree/tdf%2Ftds-8](https://github.com/NurMind-com/The_Dark_Factory/tree/tdf%2Ftds-8)

Pull request: [https://github.com/NurMind-com/The_Dark_Factory/pull/9](https://github.com/NurMind-com/The_Dark_Factory/pull/9)

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
