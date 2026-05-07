# TDS-9 Plan

## Task
"create a two pizza self contained html" — Jira ticket has no description or
comments. Interpreting literally: a single HTML file that renders two pizzas
and pulls in no external assets (no remote CSS, JS, fonts, or images).

## Approach
- Add `two-pizzas.html` at the repository root.
- Everything inline: CSS in a `<style>` block, no `<script>`, no external
  links, pizzas drawn with pure CSS (radial gradients for crust, cheese,
  pepperoni). This satisfies "self contained" with zero network dependencies
  so the file works opened directly from disk.
- Two distinct pizzas side-by-side (responsive: stack on narrow viewports).
  Label them so the page reads as intentional ("Pepperoni" + "Margherita").
- Keep markup and styles minimal — no build step, no frameworks.

## Files touched
- `two-pizzas.html` (new)

## Verification
- Static syntax: HTML hand-written, no tools required to validate.
- Visual rendering only verifiable in a real browser; not available in CI
  here. Risk noted in response.

## Out of scope
- README updates, navigation, additional pages.
- Any backend or build tooling.
