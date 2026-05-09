# Step 4 — Build the architecture doc

## What this prompt produces

`architecture.md` at the orchestrator repo root. Six sections, progressive depth: executive line, 5-min pitch, 30-min pitch with diagrams, 120-min pitch with all helper modes and API contracts, 300-min pitch with full state machine and failure modes, plus a "cold-start rebuild data" section with full file bodies so a model could rebuild from scratch.

## Preconditions

- Steps 1, 2, 3 complete: the system this doc describes actually exists.
- `github_actions_claude_spec.md` already exists with the eight production gotchas (so this doc can reference it).

## The prompt

```
Write a single architecture.md at the orchestrator repo root. It is the
single source of truth for the system. Six sections, progressive depth.
Read top-down for whatever depth your audience needs.

Section 0 — Executive line.
One sentence. What it is, what it produces, what it costs nothing to use.

Section 1 — The 5-minute pitch.
Roughly 300 words. What it is, who it is for, the loop in 4-5 numbered
bullets, ballpark cost shape, ballpark time shape, why it works.

Section 2 — The 30-minute pitch.
Roughly 1500 words plus two mermaid diagrams.
- A flowchart-style "system view" diagram showing Jira (ticket, manual
  trigger button, automation rule), GitHub (the workflows, helper script,
  Claude Code action, repo + branches + PRs, ticket artefacts), and the
  self-hosted Mac runner (Supabase + ngrok). Arrows labelled with the
  actual events / payload names.
- A components table: each piece, what it does, in one row.
- Routing rules table: label/issue-type → mode.
- Per-ticket artefact layout block.
- One paragraph "session continuity in 60 seconds" explaining the cache
  + state.json + transcript hybrid.

Section 3 — The 120-minute pitch.
Roughly 5000 words plus a sequence diagram.
- A mermaid sequenceDiagram of the dispatch flow showing every step from
  user click to Jira comment, including cache restore, Claude run, record,
  cache save, commit, ensure-pr, comment-result.
- A "helper script modes" table: mode | inputs (env) | effect | outputs
  (GITHUB_ENV). One row per mode (prepare-dispatch, record-run,
  commit-changes, ensure-pr, comment-result, transition-done).
- API contracts: list every Jira REST v3 endpoint used, every GitHub REST
  endpoint used, and every Claude Code action input/output relied upon.
  Use plain endpoint signatures, not full request bodies.
- All eight production gotchas cross-referenced from
  github_actions_claude_spec.md, plus a couple new ones discovered after
  it was written (the answer-mode push-tip-to-main risk; the routing
  decision-point ambiguity if a ticket has both client/delivery labels
  missing and only one delivery exists).
- A short "validated POC results" subsection with the smoke ticket
  outcomes.
- A short "deploy on merge" subsection with a flowchart-style mermaid
  diagram showing push → detect → matrix → supabase up → migrate →
  ngrok → commit live URL.
- A self-hosted runner setup snippet (one shell block).

Section 4 — The 300-minute pitch.
Roughly 8000 words plus three more diagrams.
- A sequenceDiagram of the state machine across runs (Run 1 NEW vs Run 2
  CONTINUATION) showing state.json, cache, Claude session id stability.
- The state.json schema as a JSON block.
- ADF snippets used (link comment, code-styled inline mark) as JSON blocks.
- A failure-mode matrix: what fails | how detected | how it recovers.
  Cover at least 12 failure modes including all eight gotchas plus
  ngrok session expiry, runner offline, cache eviction past TTL, and the
  Jira comment 4xx / branch DELETE 422 cases.
- A cost model table with Sonnet vs Opus per-ticket cost lines.
- Scaling considerations (concurrency per ticket, across tickets, cache
  eviction at scale, Jira/GitHub rate limits).
- Security boundaries: token storage, secret isolation per delivery via
  GitHub Environments, workflow trigger surface, hidden header rule,
  bot loop prevention prefix, ngrok exposure surface.

Section 5 — Cold-start rebuild data.
Reference material, no narrative. This section must contain enough to
let a fresh model rebuild the system without access to the live repo:
- Full repo skeleton tree.
- Required GitHub repo secrets table.
- Per-delivery secrets table (for GitHub Environments).
- The Jira automation rule body, headers, and validation step verbatim.
- Full file bodies for jira-dispatch.yml, jira-pr-merged.yml,
  deploy-on-merge.yml as fenced code blocks. Include the full helper
  script either inline or with an explicit pointer to .github/scripts/
  jira-dispatch.mjs as the source of truth.
- The Anthropic / Claude Code OAuth token acquisition command
  (`claude setup-token`).
- Self-hosted Mac runner registration commands (config.sh, svc.sh).
- Sample tickets used for smoke + benchmark (BOOT-1, BOOT-2, BOOT-3 with
  exact descriptions and labels).
- Benchmark threshold targets table.
- Operational checklist (Mac on, runner up, Docker up, ngrok up, cache
  size under 8 GB, no stale tdf/* branches).
- A closing "how another model can rebuild this" five-step recipe
  pointing back at the §5 file paths and §3 API contracts.

Style guide:
- No marketing fluff. Each paragraph earns its place.
- Code snippets are reference, not pedagogy. Show the file body verbatim.
- Tables wherever the structure is "thing | property | property | property".
- Mermaid diagrams must use [PLACEHOLDER] syntax in messages, never <KEY>
  (angle brackets break mermaid sequenceDiagram message parsing). Use <br>
  not <br/> in Notes for parser-version safety.
- Use horizontal rules (---) between top-level sections. Each section
  starts with a level-2 heading "## §N — Title".
- Total length target: ~750-1000 lines.
```

## Why this works as a build prompt

- The progressive-depth structure is what makes the doc actually get read. An exec reads §0, a partner reads §1, an engineer joining the team reads §2-3, a poweruser reads §4, and a model rebuilding from scratch reads §5.
- The mermaid syntax warnings are real bugs you hit if you skip them (`<TICKET-ID>` in a sequenceDiagram message produces "Expecting SOLID_ARROW... got NEWLINE"). Documenting them in the build prompt prevents the regression.
- Specifying the cold-start rebuild data section explicitly turns the doc into a one-document portable system — paste it into a fresh agent's context and they have everything to recreate the orchestrator.
