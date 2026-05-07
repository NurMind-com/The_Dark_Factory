# TDS-10 Implementation Plan

## Summary

Add a very high level diagram of the workflows that exist in this repository, so a reader can see at a glance how Jira events drive GitHub Actions, Claude Code, and the resulting PR / Jira comment loop.

## Run 2 (continuation) — V2 redraw

Reporter's Jira feedback after run 1: the "High level system view" diagram had **overlapping boxes / labels** in the rendered GitHub view, with a request to validate visually before producing a "V2".

Validation done in this run by rendering the Mermaid source to PNG with `@mermaid-js/mermaid-cli` (headless Chrome) and reading the image back. Confirmed concrete defects in V1:

- "resume / persist session" label stacked on top of "commit + push branch / open / update PR".
- "commit POC state to main" overlapped the second "resume / persist session" label.
- Edges from `jira-branch-readme.yml` to `Claude Code` cut across the "fetch ticket / post comment" label box.
- Two separate edges between `Jira` ↔ `jira-dispatch.yml` (forward + reverse) caused the labels to collide.

Root cause: `flowchart LR` with bidirectional labelled edges between the same node pairs and many cross-cutting unconstrained edges. Mermaid's auto-layout has no way to separate the labels.

V2 design (rendered and visually verified before commit, see `/tmp/mmd/v2c.png` during this run):

- Three-lane swimlane: **Triggers → Workflows → Side effects** as Mermaid `subgraph`s. Provides a layout constraint Mermaid will honour.
- Trigger metadata (`repository_dispatch`, `on: create`, `workflow_dispatch`) moves into the trigger nodes so the arrows stay unlabelled.
- No bidirectional edges between the same node pair: "Jira comment" is a separate output node so `WD -> JC` and `WB -> JC` are forward-only.
- `actions/cache` is dropped from the diagram (an implementation detail of session continuity, already captured in the workflow comparison table).

V1 is kept above V2 in `docs/workflows.md` with a short note explaining the redraw, so the reader can see what changed and the reporter's comment is honoured (V2 sits next to V1 rather than replacing it).

No code or workflow behaviour changes. Only `docs/workflows.md` is edited.

## Scope

The repo has three GitHub Actions workflows under `.github/workflows/`:

- `jira-dispatch.yml` — preferred flow. Triggered by `repository_dispatch: jira_manual_button` from Jira automation, or by manual `workflow_dispatch`. Drives the full Jira → branch → Claude → PR → Jira-comment loop with cross-run Claude session continuity.
- `jira-branch-readme.yml` — legacy flow. Triggered by branch creation. Older one-shot path with no session continuity.
- `poc-session.yml` — proof-of-concept for Claude session continuity, kept for reference and manual testing.

A "very high level" diagram should:

- show the three workflows on one page,
- show what triggers each,
- show the shared external systems they interact with (Jira, the repo / PRs, Claude Code, the Actions cache),
- show the artefacts produced under `spec/<TICKET-ID>/`,
- not redo the step-by-step detail that already lives in `github_actions_claude_spec.md`.

Mermaid diagrams render natively on github.com when committed inside a `.md` file, so no external tooling or images are needed.

## Files to create / change

- New: `docs/workflows.md` — single overview page with Mermaid diagrams and one-paragraph descriptions of each workflow.

`README.md` is intentionally **not** modified: it is itself a stale auto-generated stub from the legacy `jira-branch-readme.yml` flow for ticket TDS-4, and the repo's other top-level docs (`github_actions_claude_spec.md`, `two-pizzas.html`) are also not linked from it. Adding a link there would be inconsistent and out of scope for "make a very high level diagram".

## Implementation steps

1. Create `docs/` and add `docs/workflows.md` containing:
   - a top-level Mermaid `flowchart` showing Jira ↔ GitHub Actions ↔ Claude Code ↔ Repo / PR, with the three workflows as named nodes and their triggers,
   - a second Mermaid block (sequence-style) summarising the common shape of a Jira-driven run,
   - a short table per workflow: trigger, purpose, status (preferred / legacy / POC),
   - links to the actual workflow files and to the existing `github_actions_claude_spec.md` for deeper detail.
2. Keep the diagram intentionally coarse: no per-step boxes, no secret names, no env-var enumeration.

## Secrets / configuration

None. This is documentation only.

## Testing

- Diagram is Mermaid embedded in markdown, so it will render on github.com without extra tooling. Verified locally only by inspecting the source — visual rendering will only be confirmed once the PR view loads on GitHub. Flagged as a low-risk unverified visual.
- No code paths change. Workflows continue to behave exactly as before.

## Risks and rollback

- Risk: Mermaid syntax error would break rendering of the doc. Mitigation: keep the syntax simple and well-known (`flowchart TD`, `sequenceDiagram`).
- Risk: diagram drifts from reality as workflows evolve. Mitigation: doc explicitly points to the `.github/workflows/*.yml` files as the source of truth.
- Rollback: revert the PR; only adds a new doc and a one-line README change.
