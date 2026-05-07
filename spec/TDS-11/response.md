# TDS-11: Delete legacy Jira create-branch flow

## What changed
Deleted exactly the three files listed in the ticket:

- `.github/workflows/jira-branch-readme.yml` (legacy workflow)
- `.github/scripts/jira-branch-automation.mjs` (helper used only by the legacy workflow)
- `spec/TDS-4-ticket-artefacts-in-the-same-folder.md` (legacy flat-layout spec, TDS-4 is Done and superseded)

## What was kept
Untouched per the spec's "do NOT touch" list:

- `.github/workflows/jira-dispatch.yml`, `.github/workflows/poc-session.yml`
- `.github/scripts/jira-dispatch.mjs`
- `CLAUDE.md`, `README.md`, `github_actions_claude_spec.md`
- All other `spec/<TICKET-ID>/` folders and `temp/poc/` artefacts

## Verification
`git ls-files .github/workflows .github/scripts` now returns only `jira-dispatch.yml`, `poc-session.yml`, and `jira-dispatch.mjs` — matches the acceptance criterion.

## Risks
Low. The dispatch flow has been validated end-to-end in production; the legacy create-branch flow is no longer needed. Anyone still triggering work via Jira's "create branch" action will need to use the manual dispatch button instead.

## Follow-ups
- Stale references to the legacy flow remain in `CLAUDE.md`, `README.md`, and `github_actions_claude_spec.md`. The spec forbade modifying them here, so a small doc-cleanup ticket is recommended next.
- After merge, re-run an open `claude:answer` ticket to smoke-test that the dispatch flow still works.
