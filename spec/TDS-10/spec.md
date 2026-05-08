# TDS-10: Workflow Diagram

Generated from Jira on 2026-05-08T00:03:22.440Z.

## Issue Details

| Field | Value |
|---|---|
| Key | TDS-10 |
| Title | Workflow Diagram |
| Type | Task |
| Status | In Progress |
| Priority | Medium |
| Assignee | - |
| Reporter | Roland Abou Younes |
| Labels | - |
| Components | - |
| Created | 2026-05-08T02:04:24.145+0300 |
| Updated | 2026-05-08T03:03:04.530+0300 |

## Description

Make a very high level diagram of the workflows we have in the solution

## Comments (9)

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

### Roland Abou Younes on 2026-05-08T02:38:21.025+0300

[TDF-bot] Claude Code processed TDS-10 (conclusion: success).

Branch: [https://github.com/NurMind-com/The_Dark_Factory/tree/tdf%2Ftds-10](https://github.com/NurMind-com/The_Dark_Factory/tree/tdf%2Ftds-10)

Pull request: [https://github.com/NurMind-com/The_Dark_Factory/pull/11](https://github.com/NurMind-com/The_Dark_Factory/pull/11)

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

### Roland Abou Younes on 2026-05-08T02:45:09.839+0300

Find the right skill or tool that allows you to visually validate the md file during the claude run and keep iterating till it is visually appealing and in perfect shape, provide screen shots that prove you have validated visually

### Roland Abou Younes on 2026-05-08T02:53:24.547+0300

[TDF-bot] Claude Code processed TDS-10 (conclusion: success).

Branch: [https://github.com/NurMind-com/The_Dark_Factory/tree/tdf%2Ftds-10](https://github.com/NurMind-com/The_Dark_Factory/tree/tdf%2Ftds-10)

Pull request: [https://github.com/NurMind-com/The_Dark_Factory/pull/11](https://github.com/NurMind-com/The_Dark_Factory/pull/11)

# TDS-10: Workflow Diagram — visual-check tool + screenshots committed

## What changed

1. **Reusable visual-check tool added** at [`.github/scripts/visual-check-md.mjs`](../../.github/scripts/visual-check-md.mjs).
   - Renders any markdown file (with Mermaid blocks) to PNG via headless Chrome + `markdown-it` + `mermaid@10`.
   - No `npm install` needed: both libraries are loaded from jsDelivr inside the page; the only external requirement is system Chrome, which the GitHub-hosted runner already has.
   - Usage: `node .github/scripts/visual-check-md.mjs <md-path> <out-dir>`. Produces `full-page.png` plus one `diagram-N.png` per Mermaid block.
   - Future doc tickets can reuse this in one line.
2. **Diagram visual upgrade**: the workflow boxes in the swimlane now carry status colours via `classDef` — **green** for `(preferred)`, **amber** for `(legacy)`, **grey** for `(POC)` — so status reads at a glance without parsing suffix text.
3. **Screenshots committed** as proof of visual validation, at [`spec/TDS-10/visual-checks/`](visual-checks):
   - [`full-page.png`](visual-checks/full-page.png) — the whole `docs/workflows.md` rendered (1280 × 2400 viewport, GitHub-like styling).
   - [`diagram-1.png`](visual-checks/diagram-1.png) — swimlane "High level system view" standalone.
   - [`diagram-2.png`](visual-checks/diagram-2.png) — sequence diagram standalone.

## Iteration log (this run)

1. First run of the new tool surfaced a **bug in the tool itself**: the per-diagram renderer was overwriting the `<div>` content with `textContent`, which blocks HTML-entity decoding and stops Mermaid's `<br/>` markers from becoming real `<br>` nodes. Result: `diagram-2.png` showed "Syntax error in text".
2. Fixed: inlined the diagram source directly into `innerHTML`, matching exactly what `markdown-it` does for the full-page render.
3. Second run produced clean PNGs for both diagrams.
4. Diagram-level improvement: added `classDef` colours (preferred / legacy / POC). Re-rendered, confirmed the colours apply and contrast is readable on a white background.
5. Final inspection of all three screenshots: comparison table, swimlane (now colour-coded), sequence diagram, and code block all render clean — no overlaps, no truncation, no label collisions.

## Risks

- The local renderer is `mermaid@10` + `markdown-it@14` from jsDelivr. GitHub uses its own versions, so spacing may differ marginally — but the structural fixes (no bidirectional edges between same node pair, no in-edge labels in dense regions, colour via `classDef` which is widely supported) are layout-engine-agnostic.
- The new script depends on system Chrome being on `$PATH`. The dispatch-flow runner already has Chrome installed, so this is a no-op for CI.
- No code paths or workflow behaviour change. Documentation + tooling only.

### Roland Abou Younes on 2026-05-08T02:57:14.241+0300

### Recommended fix for the mermaid parse error

The error `Expecting SOLID_ARROW... got NEWLINE` on line 10 is mermaid choking on the angle-bracket placeholder `<TICKET-ID>` (the source had `&lt;TICKET-ID&gt;` from HTML-entity escaping). In mermaid sequence diagrams, message text containing `<` and `>` (or their HTML entities) is interpreted as arrow syntax and breaks the parse.

**Two changes fix it:**

- Replace `<TICKET-ID>` with a non-angle-bracket placeholder, e.g. `[TICKET-ID]`.
- Replace `<br/>` inside `Note over` with `<br>` for parser-version safety.

### Common shape of a Jira-driven run

Both `jira-dispatch.yml` and `jira-branch-readme.yml` follow the same overall shape, just with different trigger semantics and different artefact layouts. `jira-dispatch.yml` adds session-cache restore/save around the Claude step.

### Corrected mermaid

```
sequenceDiagram
    autonumber
    participant J as Jira
    participant W as GitHub Actions workflow
    participant C as Claude Code
    participant R as Repo / PR

    J->>W: trigger (button or branch create)
    W->>J: fetch ticket (REST)
    W->>W: prepare spec/[TICKET-ID]/ artefacts
    Note over W: dispatch flow only<br>restore ~/.claude/projects from cache
    W->>C: run with prompt + ticket context
    C->>W: edits, plan.md, response.md
    Note over W: dispatch flow only<br>save ~/.claude/projects to cache
    W->>R: commit, push branch, open or update PR
    W->>J: comment back with PR link or answer
```

### Artefacts each run produces

```
spec/[TICKET-ID]/
  spec.md          ticket snapshot (refreshed each run)
  plan.md          implementation plan owned by Claude
  response.md      Jira-facing summary or answer
  state.json       last_session_id, run_count, kind
  transcript.md    one section per run
  runs/[ts]-[id]/  per-run prompt and response copies
```

The legacy `jira-branch-readme.yml` flow uses the older flat layout (`spec/[KEY]-[slug].md` and `[KEY]-[slug]-plan.md` at repo root) for backwards compatibility — note: that flow has now been retired by TDS-11.

### Roland Abou Younes on 2026-05-08T03:03:04.530+0300

[TDF-bot] Claude Code processed TDS-10 (conclusion: success).

Branch: [https://github.com/NurMind-com/The_Dark_Factory/tree/tdf%2Ftds-10](https://github.com/NurMind-com/The_Dark_Factory/tree/tdf%2Ftds-10)

Pull request: [https://github.com/NurMind-com/The_Dark_Factory/pull/11](https://github.com/NurMind-com/The_Dark_Factory/pull/11)

# TDS-10: Workflow Diagram — mermaid parse fix

## What changed

Applied the recommended fix in `docs/workflows.md`:

- **Sequence diagram**: `&lt;TICKET-ID&gt;` → `[TICKET-ID]`, `<br/>` → `<br>`, trailing colons removed from `Note over` lines, and `open / update PR` → `open or update PR`.
- **Artefacts code block**: angle-bracket placeholders (`<TICKET-ID>`, `<ts>-<id>`, `<KEY>-<slug>`) replaced with square-bracket equivalents for consistency.
- **Trailing sentence**: tense changed to past (`uses` → `used`) and appended `— that flow has now been retired by TDS-11.`

## Why

GitHub's mermaid renderer was parsing `&lt;TICKET-ID&gt;` as arrow syntax (since `<` and `>` carry meaning in `sequenceDiagram` messages) and bombing with `Expecting SOLID_ARROW... got NEWLINE`. The local `headless Chrome + mermaid@10` pipeline had been masking the bug because the browser DOM decoded the entities to `<TICKET-ID>` *before* mermaid saw the source — useful gap to remember for future visual checks.

Confirmed `.github/workflows/jira-branch-readme.yml` is gone from `main` (deleted by TDS-11 / PR #12), so the past-tense wording about the legacy flow is accurate for the post-merge state.

## Visual validation

Re-ran the visual-check tool (`.github/scripts/visual-check-md.mjs`) against `docs/workflows.md` and inspected all three regenerated PNGs in [`spec/TDS-10/visual-checks/`](visual-checks):

- [`diagram-2.png`](visual-checks/diagram-2.png) — sequence diagram now reads `prepare spec/[TICKET-ID]/ artefacts` cleanly; both `dispatch flow only` notes render with two-line content and no trailing colons.
- [`diagram-1.png`](visual-checks/diagram-1.png) — swimlane unchanged (no entity issue there); status colours and lane layout preserved.
- [`full-page.png`](visual-checks/full-page.png) — overall composition still flows naturally with GitHub-like styling.

## Out of scope

The workflow comparison table and the swimlane still include `jira-branch-readme.yml` because it is still present on this branch. Cleaning those references up belongs in a follow-up after this PR rebases onto post-TDS-11 main — TDS-10 is "make the diagram", not "remove the legacy workflow from the docs".

## Risks

- Local mermaid renderer behaved differently from GitHub's renderer for HTML entities. Mitigation: avoid angle brackets in mermaid sequence diagrams entirely, regardless of escaping. Documented this in the plan for future reference.
- No code paths or workflow behaviour change. Documentation only.
