# Step 1 — Build the dispatch flow

## What this prompt produces

- `.github/workflows/jira-dispatch.yml`
- `.github/scripts/jira-dispatch.mjs` (modes: `prepare-dispatch`, `record-run`, `commit-changes`, `ensure-pr`, `comment-result`)
- `CLAUDE.md` (orchestrator operating contract)

## Preconditions

- A GitHub repo exists for the orchestrator. Empty is fine.
- The repo has these GitHub Actions secrets set:
  - `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`
  - `CLAUDE_CODE_OAUTH_TOKEN`
  - `GH_PR_TOKEN` (PAT with `repo` + `workflow`)
- A Jira project exists, with API token access.
- The user is willing to set up a Jira "Send web request" automation rule that POSTs `repository_dispatch` events to GitHub. (Documented in step 1's output, configured by the user after step 1 lands.)

## The prompt (give to a fresh agent in Cursor or Claude Code)

```
Build a self-driving Jira → GitHub Actions → Claude Code loop in this orchestrator
repo. Goal: pressing a Jira manual-trigger button on any ticket sends a
repository_dispatch to GitHub, GitHub fetches the ticket and runs Claude Code
on it, then either opens a PR (code mode) or posts a Jira comment (answer mode).

Architectural constraints (non-negotiable):

1. Use anthropics/claude-code-base-action@main, NOT @beta. The @beta tag is
   too old: it lacks the claude_args input and the session_id output, both of
   which we need.

2. Pass --permission-mode bypassPermissions via claude_args. The action's
   default interactive prompts cannot be answered in CI; without bypass,
   Write and shell redirection to repo paths are silently blocked.

3. Session continuity across runs: cache ~/.claude/projects via
   actions/cache (key prefix tdf-claude-<TICKET-KEY>-, save key includes
   ${{ github.run_id }} so duplicate exact keys don't error). Pass
   --resume <session_id> via claude_args when a prior session is known.
   Save the new session_id (from the action's output, or fallback by
   parsing execution_file with jq) into spec/<TICKET-ID>/state.json so
   the next dispatch can resume.

4. Per-ticket artefacts under spec/<TICKET-ID>/:
   spec.md (Jira snapshot, refreshed each run; Claude does not edit it),
   plan.md (Claude owns), response.md (Jira-facing message, Claude owns),
   state.json (workflow owns: last_session_id, run_count, kind, conclusion),
   transcript.md (workflow appends one section per run),
   runs/<ts>-<run_id>/ (workflow archives prompt, response, execution.json).

5. Routing rules (decided in prepare-dispatch from Jira labels + issue type):
   label `claude:answer` → answer mode (no code edits outside the ticket folder).
   label `claude:pr`    → PR mode.
   issue type `Question` → answer mode (default if no claude:* label).
   anything else → PR mode.

6. Branch strategy: PR mode commits to tdf/<ticket-id-lowercase> and the
   workflow opens (or reuses) a PR. Answer mode commits only the ticket
   folder to main directly.

7. Concurrency group: tdf-dispatch-${ISSUE_KEY}, cancel-in-progress: false.
   Two presses on the same ticket queue, never race.

8. Branch checkout ordering: in PR mode, the helper script must check out
   tdf/<key> from origin (if it exists) BEFORE writing any files. Otherwise
   git checkout will refuse to overwrite the freshly written untracked
   files. The PR-branch checkout MUST live inside the helper script's
   prepare-dispatch mode, after the Jira fetch but before any file writes.

9. The action's @main version hides assistant text from the public step log.
   Read the assistant text out of execution_file (JSON) with jq when you
   need to capture it for transcript.md or for the Jira comment.

Helper script (.github/scripts/jira-dispatch.mjs) modes:

- prepare-dispatch:
    - read ISSUE_KEY from env
    - GET issue + comments via Jira REST v3 (HTTP Basic with email + API token)
    - decide kind from labels/issue type
    - PR mode: git ls-remote origin tdf/<key>; if it exists,
      git fetch origin tdf/<key>; git checkout -B tdf/<key> origin/tdf/<key>
    - read or create spec/<KEY>/state.json
    - regenerate spec.md from current Jira state (overwrite)
    - write the run prompt to spec/<KEY>/runs/<ts>-<run_id>/prompt.md
    - export to GITHUB_ENV: SHOULD_RUN, ISSUE_KEY, ISSUE_TITLE,
      JIRA_ISSUE_URL, KIND, BRANCH_NAME, IS_NEW, LAST_SESSION_ID,
      TICKET_FOLDER, STATE_FILE, TRANSCRIPT_FILE, SPEC_FILE, PLAN_FILE,
      RESPONSE_FILE, RUN_DIR, PROMPT_FILE, CLAUDE_ARGS

- record-run:
    - read ACTION_SESSION_ID, CONCLUSION, EXECUTION_FILE from env
    - capture session_id (output preferred; jq fallback over execution_file)
    - update state.json with last/prev session id, last_run_at,
      last_conclusion, run_count
    - append a transcript.md entry (run_kind, prev/new session id,
      session_id_rotated, conclusion, prompt, response excerpt from
      execution_file via jq)
    - copy execution_file, prompt.md, response.md into runs/<ts>/
    - export NEW_SESSION_ID to GITHUB_ENV

- commit-changes:
    - PR mode: git checkout -B tdf/<key>; git add -A; commit; push tdf/<key>.
      git diff --quiet does NOT see untracked files; you MUST git add first
      then check git diff --cached --quiet.
    - Answer mode: stay on main; git add -A spec/<KEY>/; commit only that;
      push main.
    - Set COMMITTED=true|false in env so ensure-pr can decide whether to
      run.

- ensure-pr (PR mode only, only if COMMITTED=true):
    - GET open PRs head=<owner>:tdf/<key>; reuse if found.
    - else POST /pulls with title `${ISSUE_KEY}: ${ISSUE_TITLE}` and a body
      pointing to the ticket folder + Jira issue URL.
    - export PR_URL.

- comment-result:
    - PR mode: post a [TDF-bot]-prefixed Jira comment with branch URL,
      PR URL, and the response.md content as ADF.
    - Answer mode: post the response.md content as an ADF comment.
    - Read last_conclusion from state.json if CONCLUSION env is empty.

Workflow (.github/workflows/jira-dispatch.yml):

- on: repository_dispatch types: [jira_manual_button]
- on: workflow_dispatch with input issue_key (manual fallback for testing)
- permissions: contents: write, pull-requests: write
- concurrency: tdf-dispatch-${ISSUE_KEY}, cancel-in-progress: false
- timeout-minutes: 30
- Steps in order:
    actions/checkout@v4 (ref: main, token: GH_PR_TOKEN, fetch-depth: 0)
    git config user.name + user.email
    Prepare ticket context (node helper prepare-dispatch)
    actions/cache/restore@v4 path: ~/.claude/projects
        key: tdf-claude-${ISSUE_KEY}-${{ github.run_id }}
        restore-keys: tdf-claude-${ISSUE_KEY}-
    Show cache restore result (echo cache-hit, cache-matched-key, ls dir)
    anthropics/claude-code-base-action@main
        claude_code_oauth_token, settings (model: opus, effortLevel: high),
        prompt_file, claude_args
    Record run outputs (helper record-run, with ACTION_SESSION_ID,
        CONCLUSION, EXECUTION_FILE in env)
    actions/cache/save@v4 (only if NEW_SESSION_ID != '')
    Commit changes (helper commit-changes)
    Ensure pull request (helper ensure-pr, only if KIND == 'pr')
    Comment back on Jira (helper comment-result)

CLAUDE.md (orchestrator operating contract):

Open with: "IMPORTANT: NEVER expose, print, or commit secrets."
Then explain: this is the orchestrator; the dispatch flow runs you on every
Jira manual button; document the env vars exported by prepare-dispatch
(ISSUE_KEY, ISSUE_TITLE, JIRA_ISSUE_URL, KIND, IS_NEW, LAST_SESSION_ID,
TICKET_FOLDER, STATE_FILE, TRANSCRIPT_FILE, SPEC_FILE, PLAN_FILE,
RESPONSE_FILE, RUN_DIR); document the routing rules; remind the agent
that PR creation, commits, and Jira commenting are workflow concerns,
not Claude concerns.

Smoke validation after the build:

- Trigger the workflow_dispatch fallback with a real Jira ticket key.
  Verify it runs to success.
- Trigger it again on the same ticket.
  Verify the second run uses --resume with the session_id from the first.
  Verify state.json updates.
  Verify the Jira ticket gets a [TDF-bot] comment.

Document everything you wrote and validated in github_actions_claude_spec.md
at the repo root (gotchas, validated POC results, schemas).
```

## Notes for the agent receiving this prompt

- The eight non-negotiable architectural constraints are not opinions. Each one is a real bug we hit during development. Do not relax them.
- The concurrency group choice (`tdf-dispatch-${ISSUE_KEY}`, `cancel-in-progress: false`) is what allows multi-press tickets to queue and continue cleanly. Do not use `cancel-in-progress: true` here.
- Jira's REST v3 issue fetch must include `comment` in the `fields` query and use `expand=renderedFields` if you ever need ADF→markdown conversion (we do — for spec.md).
- Per-ticket artefacts under `spec/<TICKET-ID>/` is the single most important storage convention. Diverge and the rest of the system breaks.
