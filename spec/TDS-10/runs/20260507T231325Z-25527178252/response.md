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
