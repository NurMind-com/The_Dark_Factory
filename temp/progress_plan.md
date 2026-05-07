# Progress Plan: Jira Manual Button -> GitHub Actions -> Claude Code

Status: research and plan only. No implementation in this pass.

## Goal

A Jira ticket has a manual-trigger button. Pressing it dispatches a GitHub event with only the ticket ID. GitHub Actions does everything else:

1. Pull the full Jira ticket (and comments) using GitHub-side Jira credentials.
2. Decide if this ticket is new or already has Claude Code state.
3. New ticket: start a fresh Claude session.
4. Existing ticket: resume the prior Claude session.
5. Persist all ticket artefacts under `spec/<TICKET-ID>/`.
6. If the ticket expects code change: commit a branch and open or update a PR.
7. If the ticket is a question: post an answer back as a Jira comment.

## Current Repo State (verified)

- Repo: `~/workspace/projects/The_Dark_Factory` (mirrors `NurMind-com/The_Dark_Factory`).
- Branch: `main` clean against `origin/main`.
- Existing workflow: `.github/workflows/jira-branch-readme.yml` (create-branch flow, triggered by Jira creating a branch). Uses `anthropics/claude-code-base-action@beta` with Opus high.
- Existing helper: `.github/scripts/jira-branch-automation.mjs` with modes `prepare` and `comment`.
- Existing artefacts under root and `spec/` are mixed (TDS-4 has README + spec but no per-ticket folder).
- `CLAUDE.md` exists at repo root with model use guidance.
- Jira side now has a manual-trigger flow (the button) ready to send `repository_dispatch`.

## Research Findings (verified)

### Claude Code Base Action

`anthropics/claude-code-base-action` (`action.yml` on `main`) exposes:

- Inputs: `prompt`, `prompt_file`, `settings`, `claude_args`, `anthropic_api_key`, `claude_code_oauth_token`, `model` (via settings JSON), `path_to_claude_code_executable`, `plugins`, `plugin_marketplaces`, `show_full_output`.
- Outputs: `conclusion`, `execution_file`, `structured_output`, `session_id`.

`claude_args` is the right place to inject CLI flags like `--resume <id>`, `--max-turns N`, `--allowedTools "..."`, `--mcp-config ./mcp.json`.

### Claude Code Session Resume

From the official CLI reference and Claude Code SDK:

- `claude --resume <session-id> --print "prompt"` continues a prior session.
- `--fork-session` forks a new session id off a resumed one.
- A resumed session emits a different `session_id` than the original. The new id must be captured each run.
- Session state is stored locally in `~/.claude/projects/...` on disk. **A fresh GitHub Actions runner has no state**, so `--resume <id>` will not work unless we cache or restore that directory between runs.

### Implication

To make session continuation actually work in GitHub Actions, we must do one of:

- A. Cache `~/.claude/projects/` per ticket via `actions/cache`.
- B. Always start a fresh session, but feed the prior plan + transcript markdown back as context.
- C. Hybrid: cache when available; if cache miss, fall back to context replay so a ticket never gets stuck.

Recommendation: **C (hybrid)**. Strict resume gives best continuity when cache is fresh; markdown transcript guarantees recoverability if cache is evicted (GitHub Actions evicts caches after 7 days of inactivity).

## Repository Layout

Single canonical home for ticket artefacts:

```text
spec/
  <TICKET-ID>/                 # e.g. spec/TDS-7/
    spec.md                    # ticket info + comments snapshot
    plan.md                    # implementation plan, maintained by Claude
    transcript.md              # rolling log of all runs, appended by workflow
    decisions.md               # optional, key decisions
    response.md                # latest Jira-facing response
    state.json                 # run state metadata (see below)
    runs/
      <ISO-timestamp>-<short-id>/
        prompt.md              # exact prompt sent
        response.md            # response Claude produced this run
        execution.json         # uploaded copy of action's execution_file
```

`state.json` schema:

```json
{
  "ticket_id": "TDS-7",
  "kind": "pr|answer",
  "branch": "tdf/tds-7",
  "pr_url": "https://github.com/NurMind-com/The_Dark_Factory/pull/123",
  "last_session_id": "uuid-...",
  "last_run_at": "2026-05-08T00:55:00Z",
  "run_count": 3
}
```

## Branch Strategy

- One branch per ticket: `tdf/<ticket-id-lowercase>`. Reused across runs.
- For answer-only tickets, branch is **not** required. Spec/transcript updates go straight to `main` because they are documentation, not code.
- Concurrency group per ticket prevents overlapping runs.

## PR vs Answer Decision

Order of precedence:

1. Jira label `claude:answer` -> answer-only.
2. Jira label `claude:pr` -> PR work.
3. Jira issue type:
   - `Question` -> answer-only.
   - Anything else -> PR work.
4. Default: PR work.

Optional: also let Claude declare `kind` in `response.md` frontmatter, but it must not override an explicit Jira label.

## Workflow Design

### New file

`.github/workflows/jira-dispatch.yml`

```yaml
name: Handle Jira Manual Trigger

on:
  repository_dispatch:
    types: [jira_manual_button]

permissions:
  contents: write
  pull-requests: write

concurrency:
  group: tdf-${{ github.event.client_payload.issue_key }}
  cancel-in-progress: false

jobs:
  handle:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    env:
      ISSUE_KEY: ${{ github.event.client_payload.issue_key }}

    steps:
      - name: Checkout main
        uses: actions/checkout@v4
        with:
          ref: main
          token: ${{ secrets.GH_PR_TOKEN }}
          fetch-depth: 0

      - name: Prepare ticket context
        env:
          GITHUB_REPOSITORY: ${{ github.repository }}
          JIRA_BASE_URL: ${{ secrets.JIRA_BASE_URL }}
          JIRA_EMAIL: ${{ secrets.JIRA_EMAIL }}
          JIRA_API_TOKEN: ${{ secrets.JIRA_API_TOKEN }}
        run: node .github/scripts/jira-branch-automation.mjs prepare-dispatch

      - name: Restore Claude session cache
        if: env.LAST_SESSION_ID != ''
        uses: actions/cache/restore@v4
        with:
          path: ~/.claude/projects
          key: claude-session-${{ env.ISSUE_KEY }}-${{ env.LAST_SESSION_ID }}
          restore-keys: |
            claude-session-${{ env.ISSUE_KEY }}-

      - name: Run Claude Code
        id: claude
        uses: anthropics/claude-code-base-action@beta
        with:
          claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
          settings: |
            { "model": "opus", "effortLevel": "high" }
          prompt_file: ${{ env.PROMPT_FILE }}
          claude_args: ${{ env.CLAUDE_ARGS }}

      - name: Record run
        env:
          NEW_SESSION_ID: ${{ steps.claude.outputs.session_id }}
          EXECUTION_FILE: ${{ steps.claude.outputs.execution_file }}
          GITHUB_REPOSITORY: ${{ github.repository }}
        run: node .github/scripts/jira-branch-automation.mjs record-run

      - name: Save Claude session cache
        if: env.NEW_SESSION_ID != ''
        uses: actions/cache/save@v4
        with:
          path: ~/.claude/projects
          key: claude-session-${{ env.ISSUE_KEY }}-${{ env.NEW_SESSION_ID }}

      - name: Commit and push (PR or main)
        env:
          GH_TOKEN: ${{ secrets.GH_PR_TOKEN }}
        run: node .github/scripts/jira-branch-automation.mjs commit-changes

      - name: Open or update PR (kind=pr only)
        if: env.KIND == 'pr'
        env:
          GH_TOKEN: ${{ secrets.GH_PR_TOKEN }}
        run: node .github/scripts/jira-branch-automation.mjs ensure-pr

      - name: Comment back on Jira
        env:
          JIRA_BASE_URL: ${{ secrets.JIRA_BASE_URL }}
          JIRA_EMAIL: ${{ secrets.JIRA_EMAIL }}
          JIRA_API_TOKEN: ${{ secrets.JIRA_API_TOKEN }}
        run: node .github/scripts/jira-branch-automation.mjs comment-result
```

### Helper Script New Modes

`.github/scripts/jira-branch-automation.mjs` gains these modes (existing `prepare` and `comment` stay for the legacy create-branch flow until it is retired):

- `prepare-dispatch`
  - Read `ISSUE_KEY` from env (`{{client_payload.issue_key}}` already in env).
  - Fetch ticket + comments + labels via Jira REST.
  - Determine `KIND` (pr vs answer) using rules above.
  - Determine `BRANCH_NAME = tdf/<lower-issue-key>`.
  - Locate `spec/<ISSUE_KEY>/`.
    - If missing: `IS_NEW=true`. Create folder. Initialize `state.json` with `run_count: 0`.
    - If present: `IS_NEW=false`. Read `state.json`. Pull `LAST_SESSION_ID` if present.
  - Always rewrite `spec/<ISSUE_KEY>/spec.md` from current Jira state (overwrite).
  - Build the run prompt at `spec/<ISSUE_KEY>/runs/<ts>/prompt.md`. Prompt includes:
    - Pointer to repo `CLAUDE.md`.
    - Pointer to `spec/<ISSUE_KEY>/spec.md` and existing `plan.md`/`transcript.md`/`decisions.md`.
    - Whether the ticket expects PR or answer.
    - Acceptance criteria for both modes (must produce `plan.md`, `response.md`, only edit allowed paths).
    - For continuation runs: brief reminder that this is a continuation; transcript is the source of prior context if cache is missing.
  - Build `CLAUDE_ARGS` env var:
    - Always include `--max-turns 60`.
    - Include `--resume ${LAST_SESSION_ID}` only when `LAST_SESSION_ID` is present.
    - Allowed tools: `Read,Write,Edit,MultiEdit,Glob,Grep,Bash(git status),Bash(git diff),Bash(ls),Bash(pwd),Bash(node --check *)`.
  - Export to `GITHUB_ENV`: `ISSUE_KEY`, `KIND`, `BRANCH_NAME`, `IS_NEW`, `LAST_SESSION_ID`, `TICKET_FOLDER`, `PROMPT_FILE`, `CLAUDE_ARGS`, `JIRA_ISSUE_URL`, `RUN_DIR`.

- `record-run`
  - Read `NEW_SESSION_ID`, `EXECUTION_FILE`.
  - Append a transcript entry to `spec/<ISSUE_KEY>/transcript.md` with timestamp, kind, session id, summary line.
  - Update `spec/<ISSUE_KEY>/state.json` (`last_session_id`, `last_run_at`, `run_count++`, `kind`, `branch`).
  - Copy `${EXECUTION_FILE}` into `spec/<ISSUE_KEY>/runs/<ts>/execution.json` if present (size-guarded).

- `commit-changes`
  - Always commit any updates inside `spec/<ISSUE_KEY>/` plus, if `KIND=pr`, any other code changes Claude made.
  - For `KIND=pr`: `git checkout -B "${BRANCH_NAME}"`, then commit + push to `${BRANCH_NAME}`.
  - For `KIND=answer`: stay on `main`, commit only `spec/<ISSUE_KEY>/` updates, push to `main`.
  - Commit message: `${ISSUE_KEY}: <summary from response.md first line, truncated>`.

- `ensure-pr`
  - If open PR exists for `${BRANCH_NAME}` -> reuse, set `PR_URL` env.
  - Else create one, set `PR_URL` env.
  - PR title `${ISSUE_KEY}: ${ISSUE_TITLE}`.
  - PR body links to `spec/<ISSUE_KEY>/spec.md`, `plan.md`, `response.md`, `transcript.md`, and the Jira issue.

- `comment-result`
  - For `KIND=pr`: post a Jira comment with branch URL, PR URL, and links to the spec/plan files in the branch.
  - For `KIND=answer`: read `spec/<ISSUE_KEY>/response.md` and post that as the Jira comment body. Strip secrets/log-style content.
  - All Jira comments include `[TDF-bot]` prefix so the workflow does not loop on its own comments if a future automation listens to comments.

## Prompt Skeleton (built per run)

```text
You are running inside `${GITHUB_REPOSITORY}` for Jira ticket `${ISSUE_KEY}`.

Repo conventions live in `CLAUDE.md`. Read it first.

Ticket folder: `${TICKET_FOLDER}` (`spec/${ISSUE_KEY}/`).
- spec.md: full Jira ticket snapshot (read-only for you).
- plan.md: implementation plan. You own this file.
- transcript.md: history of prior runs. Use as context if you cannot resume.
- decisions.md: optional, append key decisions.
- response.md: the final Jira-facing message. You own this file.

Run mode: `${KIND}`.
Run kind: `${IS_NEW == "true" ? "NEW" : "CONTINUATION"}`.

Goals:
- If kind is `pr`: produce code changes implementing the ticket. Update plan.md.
  Stage: only commit changes inside the repo, do not open a PR; the workflow does that.
  Write a short summary to response.md (what changed, why, risks).
- If kind is `answer`: do not edit code outside `${TICKET_FOLDER}`. Update plan.md.
  Write the complete answer to response.md (markdown, Jira-friendly).

Constraints:
- Never expose, print, or commit secrets.
- Do not edit spec.md.
- Do not create or merge pull requests; the workflow handles that.
- Keep allowed_tools usage minimal.
- If you need state from prior runs, read transcript.md.
```

## Loop and Safety Notes

- The Jira automation is now a manual button only, so there is no risk of comment-driven loops yet.
- Future-proof: any Jira comment posted by this workflow is prefixed `[TDF-bot]`. If a comment-driven trigger is added later, it must skip comments containing that prefix.
- Concurrency group `tdf-${ISSUE_KEY}` prevents two simultaneous runs on the same ticket.
- Cache eviction risk (7-day inactivity) is bounded because the markdown transcript on disk allows recovery; new run will simply not pass `--resume` and rebuild context from transcript.
- Repository must keep its existing PAT-based checkout (`GH_PR_TOKEN`) so that workflow files inside generated changes can be pushed.

## Migration / Compatibility

- Keep `.github/workflows/jira-branch-readme.yml` running for now; it still serves the create-branch flow if Jira creates a branch. Mark it as legacy in code comments.
- Migrate active tickets gradually: any existing root-level plan/spec files for tickets that have not had a folder created will be folded into `spec/<TICKET-ID>/spec.md` on the first dispatch run for that ticket.

## Open Questions for Roland

1. Branch naming preference confirmed as `tdf/<ticket-id-lowercase>`?
2. Default to PR mode for unknown ticket types, with `claude:answer` label as override; OK?
3. For answer-only tickets, commit `spec/<TICKET>/` updates straight to `main`, or always behind a PR?
4. Should `transcript.md` include the actual Jira comment thread snapshot per run, or only metadata?
5. Cache only `~/.claude/projects/` or also project-local Claude state under `.claude/`? Needs a probe run to confirm where Claude Code stores state in this runtime.

## Implementation Order (when you greenlight)

1. Add `prepare-dispatch` and `record-run` modes to the helper script. Unit test locally with `GITHUB_ENV=$(mktemp)` and a real Jira ticket.
2. Add `commit-changes`, `ensure-pr`, `comment-result` modes. Test mode-by-mode locally.
3. Add `.github/workflows/jira-dispatch.yml`.
4. Update `CLAUDE.md` with the dispatch flow and new artefact paths.
5. Smoke test on a real Jira ticket: TDS-7 new -> answer; TDS-7 again -> continuation; TDS-8 new -> PR; TDS-8 again -> continuation.
6. Confirm cache hit on the second run, verify session ID rotates and is captured.
7. Retire the create-branch flow only after the dispatch flow is stable for 1 week.

## POC Results (validated 2026-05-07)

Workflow `.github/workflows/poc-session.yml` proved session continuity across ephemeral GitHub Actions runners.

Final run pair on ticket `POC-2`:
- Run 1 (NEW): prompt asked Claude to remember fuchsia. Response: `OK`. session_id captured: `ad71ec06-...`.
- Run 2 (CONTINUATION): prompt asked the favorite color. Response: `Fuchsia.` Same session_id.

Validated:
- `actions/cache` on `~/.claude/projects/` survives across runs.
- `claude_args: --resume <id>` is honored by `anthropics/claude-code-base-action@main`.
- `session_id` action output is reliable; fallback to parsing `execution_file` JSON also works.
- Session id was stable across one resume hop in our test.
- `restore-keys` prefix match restores correctly when exact key misses.
- Commit-back loop requires `git add -A` before `git diff --cached --quiet`.

Bugs found and fixed during POC:
- `@beta` is too old to accept `claude_args` or emit `session_id`. Pin `@main`.
- bash `printf '-...'` is parsed as a flag. Use `printf -- '-...'`.
- `git diff --quiet` does not see untracked files; stage first.

Decision: proceed to build the real Jira dispatch flow on this foundation when Roland greenlights.
