# TDS-15 — 2 pizza website

## Ticket

> Create a website called 2 pizzas describing the 2 pizzas concept is software teams.

## Approach

The repo already had `two-pizzas.html` from TDS-9, but that page was a visual-only POC (two CSS pizzas, no explanatory text). TDS-15 specifically asks for a website that *describes the concept*. The smallest correct change is to rewrite `two-pizzas.html` in place: keep a slimmed-down pizza illustration as the hero, then add the actual content explaining the two-pizza rule for software teams.

Constraints honoured:

- **Self-contained**: a single HTML file, all CSS inline, no JS, no external assets — same shape as the previous file.
- **Renders anywhere**: light/dark via `prefers-color-scheme`, responsive layout (collapses to a single column under 560px), works opened directly with `file://`.
- **No new top-level files**: kept the existing path/name; no clutter at the repo root.

## Content outline

1. Hero — title, one-line definition, two CSS pizzas (pepperoni + margherita).
2. **What it means** — the rule itself (4–8 people, fits around a table).
3. **Where it comes from** — Bezos / Amazon, and the later evolution toward single-threaded ownership.
4. **Why it works** — communication overhead grows as `n*(n-1)/2`, plus four cards (less coordination, shared context, real ownership, faster feedback).
5. **Signs your team is too big** — concrete smells (long standups, stalled decisions, sub-groups forming).
6. **How to apply it** — five steps focused on ownership, autonomy, and clean splits.
7. **When it doesn't fit** — caveats so the page isn't dogmatic (tightly coupled platform work, scarce specialists, no real autonomy).

## Files changed

- `two-pizzas.html` — rewritten from a visual POC into a content page describing the two-pizza concept; reuses the existing pizza illustration as a smaller hero element.

## Verification

- HTML parsed with Python's `html.parser`: no unclosed tags, no mismatched closers.
- Layout uses standard CSS only (grid, flexbox, `clamp`, `prefers-color-scheme`); no features that require a server or a build step.
- Visual risk: the page was not opened in a real browser from this run, so exact spacing/colour rendering across browsers is unverified. The structure mirrors the previous working `two-pizzas.html`, which was already validated, so regressions are unlikely.

## Out of scope

- No changes to workflows, scripts, or other repository code.
- No new dependencies, build tooling, or routing — this stays a single static file.
