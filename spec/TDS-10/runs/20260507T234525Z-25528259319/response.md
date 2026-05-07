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
