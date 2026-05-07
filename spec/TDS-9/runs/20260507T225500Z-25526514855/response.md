# TDS-9 — Two-pizza self-contained HTML

## What changed
- Added `two-pizzas.html` at the repository root.
- Single self-contained file: inline CSS, no JavaScript, no external links,
  fonts, or images. The two pizzas (Pepperoni and Margherita) are drawn with
  pure CSS (radial gradients + positioned topping divs).
- Responsive layout: side-by-side on wider viewports, stacked under 640 px.

## Why this interpretation
The ticket has no description or comments — only the title "create a two
pizza self contained html". I read "self contained" as a hard requirement:
no network dependencies, the file must work when opened directly from disk
(`file://`). Two distinct pizzas were rendered to make the deliverable
unambiguous.

## Risks / unverified
- Visual rendering was not exercised in a real browser from this run; HTML
  tag balance was verified programmatically but the actual look of the CSS
  pizzas is best confirmed by opening `two-pizzas.html` locally.
- If the ticket actually meant "two-pizza team" (Amazon's small-team idea)
  rather than literal pizzas, the page can be repurposed or replaced — happy
  to redo on a follow-up comment.

## Files
- `two-pizzas.html` (new)
- `spec/TDS-9/plan.md` (new)
- `spec/TDS-9/response.md` (this file)
