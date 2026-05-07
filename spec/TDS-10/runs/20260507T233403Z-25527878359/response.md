# TDS-10: Workflow Diagram — visual pass

## What changed

`docs/workflows.md`:

- Removed the V1 ("overlapping") diagram entirely.
- The V2 swimlane is now the sole **"High level system view"** (heading no longer carries the `(V2)` suffix).
- Surrounding prose simplified to drop the V1/V2 comparison wording; the rest of the file is unchanged.

The file now contains, top to bottom:

1. Intro + pointer to the workflow YAML files and to `github_actions_claude_spec.md` for deeper detail.
2. **Workflows in this repo** — comparison table (trigger, purpose, status).
3. **High level system view** — Mermaid swimlane (Triggers → Workflows → Side effects).
4. **Common shape of a Jira-driven run** — Mermaid sequence diagram.
5. **Artefacts each run produces** — code block of the `spec/<TICKET-ID>/` layout.

## How it was visually checked

Per the request to check "in any way necessary":

1. Converted the actual `docs/workflows.md` to HTML with `marked`, with `mermaid` code blocks rewritten as `<div class="mermaid">…</div>`.
2. Applied GitHub-like CSS (1012px max-width, segoe-ui font stack, table borders, code-block tint).
3. Loaded the real `mermaid@10` library from CDN and rendered the page in headless Chrome (`--headless=new --virtual-time-budget=10000`).
4. Captured a full-page PNG (1280 × 2400) and inspected it.
5. Re-rendered each mermaid block individually at higher resolution to confirm legibility at zoom.

## Findings

- Comparison table: all four columns visible, borders and header tint render correctly.
- Swimlane: three lanes laid out left-to-right, all 9 nodes legible, no box overlap, no label collisions. Edges curve around each other without obscuring any text.
- Sequence diagram: four participants, autonumbered arrows, two "dispatch flow only" notes — all clearly visible. The `<TICKET-ID>` placeholder displays correctly thanks to HTML escaping.
- Artefact code block: monospace, no wrap issues.

The rendered output is visually pleasant and fully legible.

## Risks

- The local renderer is `mermaid@10` via jsDelivr; GitHub also uses Mermaid but a slightly different version and theme. Spacing may differ marginally, but the structural overlap risks present in V1 (bidirectional edges between same node pair, unlabelled cross-cuts) are gone.
- No code paths or workflow behaviour change. Documentation only.
