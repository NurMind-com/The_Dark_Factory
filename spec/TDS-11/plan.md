# TDS-11 Plan: Delete legacy Jira create-branch flow

## Goal
Remove the legacy create-branch flow now that the dispatch flow is validated in production. Touch nothing else.

## Deletions (exactly these, per spec)
1. `.github/workflows/jira-branch-readme.yml` — legacy workflow triggered by GitHub `create` events.
2. `.github/scripts/jira-branch-automation.mjs` — helper script used only by the legacy workflow above.
3. `spec/TDS-4-ticket-artefacts-in-the-same-folder.md` — flat-layout spec file from the old artefact convention; TDS-4 is Done and superseded by the per-ticket folder layout.

## Untouched (per spec "do NOT touch" list)
- `.github/workflows/jira-dispatch.yml`, `.github/workflows/poc-session.yml`
- `.github/scripts/jira-dispatch.mjs`
- `CLAUDE.md`, `README.md`, `github_actions_claude_spec.md`
- All `spec/<TICKET-ID>/` per-ticket folders
- All `temp/poc/` artefacts

These docs still mention the legacy flow (e.g. `CLAUDE.md` "Legacy create-branch flow", `README.md` references to the old TDS-4 spec, `github_actions_claude_spec.md` retirement note). The spec explicitly forbids modifying them in this ticket, so doc cleanup is left as a follow-up.

## Verification
- `git ls-files .github/workflows .github/scripts` returns exactly `jira-dispatch.yml`, `poc-session.yml`, `jira-dispatch.mjs` (confirmed locally).
- No new files created outside `spec/TDS-11/`.

## Risks
- Anyone still relying on Jira's create-branch automation will silently no-op after merge. The dispatch flow has been validated end-to-end, so this is the intended retirement.

## Follow-ups (not in this ticket)
- Remove stale references to the legacy flow from `CLAUDE.md`, `README.md`, and `github_actions_claude_spec.md` in a separate ticket.
