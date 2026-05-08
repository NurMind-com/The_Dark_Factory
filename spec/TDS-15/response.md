# TDS-15 — 2 pizza website

## What changed

Rewrote `two-pizzas.html` from a visual-only POC (left over from TDS-9) into a real one-page website describing the two-pizza team concept for software teams.

The page covers:

- **What it means** — the 4–8 person rule.
- **Where it comes from** — Jeff Bezos / Amazon, and the later move toward single-threaded ownership.
- **Why it works** — communication overhead grows as `n*(n-1)/2`, with cards on coordination, shared context, ownership, and feedback loops.
- **Signs your team is too big** — concrete symptoms.
- **How to apply it** — practical steps (cut along service lines, single owner, push autonomy down, keep dependencies few, split before it hurts).
- **When it doesn't fit** — honest caveats.

The hero keeps the original two CSS pizzas as a lightweight illustration so the file still does what its name says.

## Why

The ticket asks for a website *describing the concept*, not just a picture. The existing `two-pizzas.html` only showed two pizzas with no text, so it didn't satisfy the ticket on its own. Rewriting in place keeps the repo tidy (no new top-level files) and keeps the well-known filename.

## Risks

- Single self-contained HTML file, no JS, no external assets — opens with `file://` in any modern browser.
- HTML structure validated via parser (no unclosed/mismatched tags).
- Visual rendering across browsers was not opened in a real browser from this CI run; the layout uses only standard CSS (grid, flexbox, `clamp`, `prefers-color-scheme`), so cross-browser surprises are unlikely but not formally verified.

## Files

- `two-pizzas.html` — rewritten.
- `spec/TDS-15/plan.md` — implementation plan.
- `spec/TDS-15/response.md` — this summary.
