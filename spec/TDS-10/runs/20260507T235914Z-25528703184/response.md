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
