# TDS-14: Codebase study, README refresh, doc hygiene

## What changed

- **`README.md`** — replaced the stale TDS-4 ticket stub (which still
  referenced files that no longer exist on `main`) with a real project
  README: what The Dark Factory is, how the dispatch flow works, the
  per-ticket artefact layout, repo map, required GitHub secrets, and
  manual-trigger commands. Pointers to `CLAUDE.md`, `docs/workflows.md`,
  and `github_actions_claude_spec.md`.
- **`CLAUDE.md`** — removed the "Legacy create-branch flow" bullet and
  the stray `CONTEXT_FILE` reference. Added a short note about
  `jira-pr-merged.yml` so future Claude runs don't reinvent
  merge-finalize logic. The agent's per-run job description is
  unchanged.
- **`github_actions_claude_spec.md`** — removed the trailing paragraph
  saying the legacy flow was "left untouched for now." TDS-11 retired
  it weeks ago.
- **`docs/workflows.md`** — dropped the `jira-branch-readme.yml` row,
  diagram node, and prose paragraph; added the missing
  `jira-pr-merged.yml` row; updated the system-view diagram to reflect
  the actual three live workflows; updated the sequence-diagram prose
  (no more "dispatch flow only" notes).

No code, scripts, or workflow YAML touched. No `spec/<TICKET-ID>/`
folders, `temp/`, or `two-pizzas.html` touched.

## Why

TDS-11 deleted the legacy `jira-branch-readme.yml` flow but, by
explicit instruction, left the doc cleanup to a follow-up ticket. TDS-14
is that follow-up, plus a long-overdue real README (the previous one
was a TDS-4 ticket-generation stub, not a project README).

## Risks

Markdown only — no risk to the dispatch pipeline. The only thing that
could regress is the mermaid diagram in `docs/workflows.md`; the edit
removed one node + two arrows and one classDef entry, and the syntax is
unchanged elsewhere. Diagram renders on GitHub view; if syntax slips
the page renders the source instead of the image.

## Verification

`grep -r "branch-readme\|jira-branch\|TDS-4-ticket\|create-branch flow\|legacy"
--include="*.md" --exclude-dir=spec --exclude-dir=temp` now returns no hits.
