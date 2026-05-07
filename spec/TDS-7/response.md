# Dispatch flow — end-to-end summary

The `jira-dispatch.yml` workflow listens for a `repository_dispatch` event of type `jira_manual_button` (sent by the Jira manual-trigger button, with `workflow_dispatch` available as a manual fallback) and uses the issue key from the payload to drive a single ticket-handling job. It checks out `main`, then runs `jira-dispatch.mjs prepare-dispatch` to pull the latest Jira issue, lay out the per-ticket artefacts under `spec/<KEY>/` (spec, plan, transcript, response, prompt), decide whether the run is `pr` or `answer`, and export the env vars the rest of the job needs; in PR mode it also checks out the existing work branch from origin if one is already there. Claude Code then runs on Opus with high effort against the generated prompt, after which the workflow records outputs, commits the ticket-folder updates (and code changes in PR mode), ensures the pull request exists in PR mode, and posts the contents of `response.md` back as a Jira comment.

## Role of `state.json`

`spec/<KEY>/state.json` is the per-ticket durable pointer kept in the repo. It tracks the `ticket_id`, `run_count`, `kind` (`pr` or `answer`), the work `branch`, and — after the first run — the last Claude `session_id`. The workflow reads it during `prepare-dispatch` so each new dispatch knows whether to start a NEW Claude session or CONTINUE the previous one, and `record-run` updates it after Claude finishes.

## Role of the `actions/cache` step

The cache step saves and restores `~/.claude/projects` between runs, keyed by issue key (with run-id specificity and an issue-key prefix as the restore fallback). That directory is Claude Code's per-project session store, so restoring it re-hydrates the prior conversation transcript and lets the next dispatch resume the same Claude session referenced by `state.json` instead of starting cold.
