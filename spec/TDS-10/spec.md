# TDS-10: Workflow Diagram

Generated from Jira on 2026-05-07T23:34:03.785Z.

## Issue Details

| Field | Value |
|---|---|
| Key | TDS-10 |
| Title | Workflow Diagram |
| Type | Task |
| Status | To Do |
| Priority | Medium |
| Assignee | - |
| Reporter | Roland Abou Younes |
| Labels | - |
| Components | - |
| Created | 2026-05-08T02:04:24.145+0300 |
| Updated | 2026-05-08T02:33:35.005+0300 |

## Description

Make a very high level diagram of the workflows we have in the solution

## Comments (4)

### Roland Abou Younes on 2026-05-08T02:08:16.781+0300

[TDF-bot] Claude Code processed TDS-10 (conclusion: success).

Branch: [https://github.com/NurMind-com/The_Dark_Factory/tree/tdf%2Ftds-10](https://github.com/NurMind-com/The_Dark_Factory/tree/tdf%2Ftds-10)

Pull request: [https://github.com/NurMind-com/The_Dark_Factory/pull/11](https://github.com/NurMind-com/The_Dark_Factory/pull/11)

# TDS-10: Workflow Diagram

## What changed

Added a new high-level overview at [`docs/workflows.md`](../../docs/workflows.md):

- A table listing the three workflows in `.github/workflows/` (`jira-dispatch.yml`, `jira-branch-readme.yml`, `poc-session.yml`) with trigger, purpose, and status (preferred / legacy / POC).
- A Mermaid `flowchart` showing the system at a glance: Jira, the three workflows, Claude Code, the GitHub Actions cache, and the repo / PR.
- A Mermaid `sequenceDiagram` for the common Jira → workflow → Claude → PR → Jira-comment shape that both Jira-driven workflows follow.
- The artefact layout under `spec/<TICKET-ID>/`.

The doc points to the workflow YAML files and to the existing `github_actions_claude_spec.md` as the source of truth for deeper detail, so the diagram does not need to be re-derived if behaviour changes.

## Why

Ticket asks for a "very high level diagram of the workflows we have in the solution". Mermaid renders natively on github.com inside a `.md` file, so no images, external tooling, or build step are required.

## Why README was not modified

The current `README.md` is itself a stale auto-generated stub from the legacy branch-creation flow (for TDS-4). Other root-level docs (`github_actions_claude_spec.md`, `two-pizzas.html`) are not linked from it either, so adding a link would be inconsistent and out of scope.

## Risks

- Mermaid rendering can only be visually confirmed once the PR loads on GitHub. The syntax used (`flowchart LR`, `sequenceDiagram`) is the most common Mermaid subset and is unlikely to fail to render.
- The diagram can drift from reality as workflows evolve. The doc explicitly points to the YAML files as the source of truth to mitigate this.

No code paths or workflow behaviour change.

### Roland Abou Younes on 2026-05-08T02:13:03.336+0300

## High level system view, the workflow under it has overlaping boxes, please validate visually before making a second version of it call it V2

### Roland Abou Younes on 2026-05-08T02:18:40.887+0300

[TDF-bot] Claude Code processed TDS-10 (conclusion: success).

Branch: [https://github.com/NurMind-com/The_Dark_Factory/tree/tdf%2Ftds-10](https://github.com/NurMind-com/The_Dark_Factory/tree/tdf%2Ftds-10)

Pull request: [https://github.com/NurMind-com/The_Dark_Factory/pull/11](https://github.com/NurMind-com/The_Dark_Factory/pull/11)

# TDS-10: Workflow Diagram — V2

## What changed

`docs/workflows.md` now contains both versions of the "High level system view":

- **V1** kept as-is, with a short note explaining why it is being redrawn.
- **V2** added below: a three-lane swimlane — **Triggers → Workflows → Side effects** — implemented as Mermaid `subgraph`s.

V1 is unchanged on disk; only the section heading gained the `(V1)` suffix and a short note above the code block.

## Why V2 looks different

V1 was rendered locally to PNG and inspected. The reporter's feedback was correct: labels were overlapping in the rendered output. Concrete defects:

- "resume / persist session" stacked on top of "commit + push branch / open PR".
- "commit POC state to main" overlapped the second "resume / persist session" label.
- Edges from `jira-branch-readme.yml` to `Claude Code` ran through the "fetch ticket / post comment" label box.

Root cause: `flowchart LR` with bidirectional labelled edges between the same node pairs (e.g. `Jira ↔ jira-dispatch.yml`) and many free-floating cross-cutting edges. Mermaid's auto-layout cannot separate the labels.

V2 fixes this by:

- Constraining layout into three subgraph lanes (triggers, workflows, side effects).
- Moving trigger metadata (`repository_dispatch`, `on: create`, `workflow_dispatch`) into the trigger nodes, so all arrows can stay unlabelled.
- Splitting "Jira comment" into its own output node, so there are no bidirectional edges and no label stacking.
- Dropping `actions/cache` from the diagram (still mentioned in the workflow comparison table) to keep the high-level view uncluttered.

## Visual validation

Before committing V2 I rendered it locally to PNG with `@mermaid-js/mermaid-cli` + headless Chrome, inspected the image, and confirmed: no box overlaps, no stacked labels, no edges cutting through label boxes. Edge crossings still exist in the right lane (3 workflows → 3 side effects ⇒ unavoidable) but no label is obscured.

GitHub's own Mermaid renderer can occasionally differ from `mmdc` slightly in spacing, but the structural fixes (no bidirectional edges between same node pairs, no in-edge labels in dense regions) are layout-engine-agnostic.

## Risks

- The rendering tool used locally is not the exact engine GitHub uses, so very minor spacing differences are possible. The structural overlap risks present in V1 are gone.
- No code paths or workflow behaviour change. Documentation only.

### Roland Abou Younes on 2026-05-08T02:33:35.005+0300

Update the diagram now and check the outcome in any way necessary to make sure the md file is visually checked and is visually pleasant and all lesible
