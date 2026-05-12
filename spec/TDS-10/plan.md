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

## Run 3 (continuation) — consolidate to single diagram + full-page visual check

Reporter's Jira feedback after run 2: "Update the diagram now and check the outcome in any way necessary to make sure the md file is visually checked and is visually pleasant and all legible."

Interpretation: ship a single canonical diagram (drop V1, keep V2), then *actually* render the markdown end-to-end (not just individual mermaid blocks) and verify legibility.

Done in this run:

1. Removed the V1 section from `docs/workflows.md`. The V2 swimlane is now the sole "High level system view" — its preamble was simplified accordingly. Nothing else in the file changed.
2. Built a self-contained HTML preview pipeline:
   - `marked` converts the actual `docs/workflows.md` to HTML, with `mermaid` code blocks rewritten as `<div class="mermaid">…</div>`.
   - GitHub-like CSS is applied (max-width 1012px, segoe-ui font stack, 1px borders on tables, light grey code blocks).
   - The page loads `mermaid@10` from the jsDelivr CDN and calls `mermaid.run()` so the swimlane and the sequence diagram are rendered by the *real* mermaid library, not the CLI.
   - Headless Chrome (`--headless=new --virtual-time-budget=10000`) screenshots the rendered page at 1280×2400.
3. Read the resulting PNG as an image to verify the whole document. Then rendered each mermaid block individually at higher resolution (1600×900 for the swimlane, 1400×1100 for the sequence diagram) to verify legibility at zoom.

Findings of the visual check:

- "Workflows in this repo" table renders cleanly: borders, header background, all four columns visible.
- High level system view (swimlane): three subgraph lanes laid out left-to-right, all 9 nodes legible, no box overlap, no label collisions. Edge crossings between WD/WB/WP and CC/GH/JC exist but the edges curve around each other without obscuring any node text.
- Common shape of a Jira-driven run (sequence diagram): four participants visible at top and bottom, autonumbered arrows are clear, the two yellow "dispatch flow only" notes render without overlapping arrows, and the `&lt;TICKET-ID&gt;` HTML-escape correctly displays as `<TICKET-ID>`.
- Artefacts code block: monospace, indented, no wrap issues at 1012px width.

No further structural changes needed.

## Run 4 (continuation) — formalised visual-check tool + screenshots committed + colour iteration

Reporter's Jira feedback after run 3: "Find the right skill or tool that allows you to visually validate the md file during the claude run and keep iterating till it is visually appealing and in perfect shape, provide screen shots that prove you have validated visually."

Three deliverables in this run:

1. **Reusable visual-check tool**, committed at `.github/scripts/visual-check-md.mjs`. Runs entirely from inside the Claude Code run with no extra setup beyond what the runner already has:
   - `markdown-it@14` and `mermaid@10` are loaded from jsDelivr inside the rendered HTML (no `npm install` needed).
   - System Chrome (`$CHROME_BIN` or `google-chrome`, present on the GitHub-hosted runner) takes the screenshot in `--headless=new` mode.
   - Inputs: a markdown path and an output directory. Outputs: `preview.html`, `full-page.png`, and one `diagram-N.png` per `mermaid` block.
   - Future doc tickets can reuse this with one line: `node .github/scripts/visual-check-md.mjs <md> <out>`.
2. **Screenshots committed** at `spec/TDS-10/visual-checks/`:
   - `full-page.png` — the whole `docs/workflows.md` rendered with GitHub-like CSS at a 1280 × 2400 viewport.
   - `diagram-1.png` — the swimlane "High level system view" rendered standalone at 1600 × 1100.
   - `diagram-2.png` — the sequence diagram rendered standalone at 1600 × 1100.
   These prove that visual validation actually happened during this run.
3. **Iteration loop demonstrated**:
   - First render found a bug in *the script itself*: my per-diagram render was overwriting the `<div>` content with `textContent`, which prevented HTML entity decoding (`&lt;TICKET-ID&gt;` → `<TICKET-ID>`) and the `<br/>`-as-DOM behaviour mermaid relies on. Result: `diagram-2.png` showed "Syntax error in text". Fixed in `.github/scripts/visual-check-md.mjs` by inlining the diagram source directly into innerHTML, matching what markdown-it does for the full-page render.
   - Second render confirmed the sequence diagram now renders cleanly. The full-page render had been correct all along.
   - Diagram-level improvement: added `classDef` colours to the three workflow nodes — green for `(preferred)`, amber for `(legacy)`, grey for `(POC)` — so status reads at a glance without parsing the suffix text. Re-rendered to confirm the colours apply and don't degrade legibility.

Final state confirmed visually:

- Swimlane: three lanes, all 9 nodes legible, status colour-coded, no box overlaps, no label collisions, edge crossings unavoidable but clean.
- Sequence diagram: 4 participants, autonumbered arrows, two `dispatch flow only` notes legible, `<TICKET-ID>` placeholder displayed correctly.
- Full-page composition: heading hierarchy, table, both diagrams, code block all flow naturally with GitHub-like styling.

## Run 5 (continuation) — fix mermaid parse error on GitHub render

Reporter's Jira feedback after run 4 reported that GitHub's mermaid renderer was failing on the sequence diagram with `Expecting SOLID_ARROW... got NEWLINE` on line 10. Root cause: the `&lt;TICKET-ID&gt;` HTML-entity placeholder. GitHub's mermaid pipeline does not always decode entities the same way the local browser+mermaid pipeline does, so mermaid sees `<` as an arrow character and the parse breaks. (My local visual-check rendered the file via headless Chrome where the browser entity decoder runs, so this defect was not visible to me — a useful gap to know about for next time.)

Reporter provided the exact fix:

- Sequence diagram: `&lt;TICKET-ID&gt;` → `[TICKET-ID]`; `<br/>` → `<br>` (parser-version safety); minor wording tweak `open / update PR` → `open or update PR`; trailing colons removed from `dispatch flow only:` notes.
- Artefacts code block: `<TICKET-ID>`, `<ts>-<id>`, `<KEY>-<slug>` → `[TICKET-ID]`, `[ts]-[id]`, `[KEY]-[slug]` for consistency with the corrected diagram.
- Trailing sentence about the legacy flow: tense changed to past (`uses` → `used`) plus appended `— that flow has now been retired by TDS-11.`

Verified that TDS-11 (PR #12) has indeed merged to `main` and removed `.github/workflows/jira-branch-readme.yml`. On this branch the file is still present — the post-merge state on `main` will pick up the deletion. The workflow comparison table and the swimlane still reference the legacy workflow because they are accurate for *this* branch's state; once TDS-10 merges into post-TDS-11 main, those references can be cleaned up in a follow-up (out of scope for this ticket which is "make a diagram").

Re-ran `node .github/scripts/visual-check-md.mjs docs/workflows.md spec/TDS-10/visual-checks` and inspected all three PNGs:

- Sequence diagram now reads `prepare spec/[TICKET-ID]/ artefacts` cleanly with no syntax-error bomb.
- Both `dispatch flow only` notes render with two-line content and no trailing colons.
- Step 6 reads "commit, push branch, open or update PR".
- Swimlane unchanged (no entity issue there) — colours and structure preserved.
- Full-page composition still flows naturally.

Re-committed `spec/TDS-10/visual-checks/full-page.png`, `diagram-1.png`, `diagram-2.png` (overwritten in place).

## Run 6 (continuation) — no new feedback, no-op

Re-triggered with no new comment from the reporter; the most recent comment in `spec.md` is the bot's own success summary from Run 5. Nothing in `docs/workflows.md`, `.github/scripts/visual-check-md.mjs`, or `spec/TDS-10/visual-checks/` was changed in this run — re-running the renderer would only regenerate identical PNGs and create churn. Treating this as a confirmation pass: prior fix stands, awaiting reporter sign-off or further feedback.

## Run 7 (continuation) — ticket already closed, post-merge re-trigger

State at the start of this run:

- Branch: `main` (not the original `tdf/tds-10` work branch).
- Ticket status (per `spec.md`): **Done**.
- PR #11 merged into `main` at commit `d503938` (`Merge pull request #11 from NurMind-com/tdf/tds-10`).
- A follow-up ticket **TDS-14** has since modified `docs/workflows.md` (commit `03dcaae`).
- Most recent comment on the Jira ticket is the bot success summary from Run 6 — no new reporter feedback.
- Many new workflows have landed since this ticket closed (`deploy-on-merge.yml`, `epic-runner.yml`, `jira-pr-merged.yml`, `jira-product-deploy.yml`, `jira-requirements-dispatch.yml`). Those are out of scope for TDS-10 — if the diagram needs to reflect them, that belongs in a new ticket.

Action taken in this run: none beyond updating this plan and the response. Touching `docs/workflows.md` on `main` without a fresh request would be (a) outside the scope of this closed ticket and (b) potentially in conflict with the already-merged TDS-14 update. No code changes committed.

## Run 8 (continuation) — second post-merge re-trigger, still no new feedback

State at the start of this run:

- Branch: `tdf/tds-10`.
- Ticket status: still **Done**.
- Newest comment in `spec.md` is the automation's "🤖 Dark Factory PR run started" notice (run #19) — not a reporter instruction.
- No new user feedback since the ticket closed.

Same conclusion as Run 7: nothing to do on the ticket itself. Plan and response updated to log this re-trigger; no code or doc changes.

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
