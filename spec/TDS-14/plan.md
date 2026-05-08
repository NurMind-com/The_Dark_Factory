# TDS-14 Plan: Study the codebase, refresh README, and tidy stale docs

## Context

TDS-11 deleted the legacy `jira-branch-readme.yml` flow but explicitly
deferred doc cleanup ("Remove stale references to the legacy flow from
`CLAUDE.md`, `README.md`, and `github_actions_claude_spec.md` in a separate
ticket."). TDS-14 is that follow-up plus a real top-level README.

## What this repo actually is (study summary)

A self-driving Jira→GitHub→Claude Code loop. A Jira ticket can be
turned into a PR or a Jira comment-answer entirely from GitHub Actions:

- **Trigger** — Jira automation fires `repository_dispatch:
  jira_manual_button` (or a manual `workflow_dispatch`).
- **Workflow** — `.github/workflows/jira-dispatch.yml` runs
  `.github/scripts/jira-dispatch.mjs` to fetch the ticket, set up
  `spec/<TICKET-ID>/{spec.md,plan.md,response.md,state.json,transcript.md,runs/}`,
  decide PR-vs-answer mode from labels, and route Claude.
- **Claude** — `anthropics/claude-code-base-action@main` runs Opus with
  the per-ticket prompt; session continuity is preserved across runs by
  caching `~/.claude/projects/` (key prefix `tdf-claude-<KEY>-`) plus
  resuming from `state.json.last_session_id`.
- **PR finalize** — `.github/workflows/jira-pr-merged.yml` listens for
  the `tdf/<key>` PR merge, transitions Jira to Done, deletes the head
  branch.
- **POC** — `.github/workflows/poc-session.yml` is the original
  session-continuity proof retained for reference.

Authoritative reference: `github_actions_claude_spec.md` (370 lines,
end-to-end spec validated 2026-05-08). Higher-level overview:
`docs/workflows.md`.

Other top-level files: `two-pizzas.html` (deliverable from TDS-9),
`temp/poc/` and `temp/dispatch_pr_smoke.md` (intentional history per
TDS-11), `temp/progress_plan.md` (pre-implementation research log).

## Edits

1. **`README.md`** — replace the stale TDS-4 ticket stub with a real
   project README: one-paragraph what-it-is, quick map of the two
   workflows, link out to `docs/workflows.md` and
   `github_actions_claude_spec.md`, repo layout, secrets/permissions
   summary, link to `CLAUDE.md`.
2. **`CLAUDE.md`** — drop the "Two flows trigger you in this repo"
   bullet describing `jira-branch-readme.yml`; collapse to the one
   remaining flow. Drop the parenthetical `or CONTEXT_FILE in the
   dispatch flow` (that env var name doesn't exist in the dispatch
   script). Add `jira-pr-merged.yml` as a sibling so future Claude
   runs know not to invent merge-finalize logic.
3. **`github_actions_claude_spec.md`** — remove the trailing paragraph
   that says the legacy flow is "left untouched for now"; it's been
   gone since TDS-11.
4. **`docs/workflows.md`** — remove the legacy row from the workflow
   table, drop the `WB` node and `legacy` edge from the mermaid
   diagram, and the closing prose paragraph about the flat layout. Add
   `jira-pr-merged.yml` to the table so the doc actually inventories
   the workflows that exist. Update the "common shape" prose to stop
   contrasting the two flows.

No deletes. No changes under `spec/`, `.github/scripts/`,
`.github/workflows/`, `temp/`, or `two-pizzas.html`.

## Out of scope (intentional)

- Moving `github_actions_claude_spec.md` into `docs/` — would break
  the cross-link from `CLAUDE.md` and `docs/workflows.md`; keep as
  follow-up.
- Pruning `temp/` — TDS-11 spec explicitly preserves POC artefacts as
  history.
- Touching `two-pizzas.html` — it's the deliverable from TDS-9.

## Risks

- Markdown only; no scripts or workflow files change. Risk to the
  automation pipeline is zero.
- Mermaid diagram in `docs/workflows.md` is rendered by GitHub at view
  time; if syntax slips, the page renders the source instead of the
  image. Mitigation: keep the edit minimal (delete one node and two
  edges, update one classDef block).

## Verification

- `grep -r "branch-readme\|jira-branch\|TDS-4-ticket" --include="*.md"`
  returns no hits outside `spec/`.
- `README.md` no longer references TDS-4 paths that no longer exist.
- `docs/workflows.md` table lists exactly the three live workflows
  (`jira-dispatch.yml`, `jira-pr-merged.yml`, `poc-session.yml`).
