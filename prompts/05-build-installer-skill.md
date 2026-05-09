# Step 5 — Build the installer skill

## What this prompt produces

`skills/dark-factory-installer/SKILL.md` plus `skills/README.md`. A runbook the AI agent (Cursor or Claude Code) executes inline using its own tools to bootstrap a brand-new orchestrator on a fresh machine. No driver scripts, no duplicated templates — the skill fetches files from the source repo at install time.

## Preconditions

- Steps 1–4 complete: orchestrator + finalize + In Progress + architecture doc all live on `main` of the source repo.

## The prompt

```
Package the install procedure as a skill at
skills/dark-factory-installer/SKILL.md (canonical source) and add a brief
skills/README.md that explains the skills folder.

Hard rules for the skill:

1. The skill is a runbook the AI agent (Cursor or Claude Code) executes
   inline using its own tools (Shell, Write, AskQuestion, browser MCP).
   Zero driver scripts. No install.sh, no scripts/00-*.py, nothing the
   user runs from a terminal apart from the one-line skill install.

2. Zero duplication. The orchestrator workflow files, helper script,
   CLAUDE.md, architecture.md, etc. all live in the source repo's
   canonical paths. The skill fetches them at install time via
   raw.githubusercontent.com. The skill itself does NOT carry copies of
   these files in a templates/ subfolder.

3. Idempotent. Each step starts with a precondition check ("is this
   already done?"). If yes, skip and log it. Re-runs converge.

4. Resumable across chats. Maintain ~/.claude/skills/dark-factory-
   installer/.state.json with a documented schema. After every successful
   step, write done.<step-id> = ISO-8601-UTC. A new chat re-reads it and
   resumes from where the prior chat stopped.

5. Front-load all credential prompts in step 1. Never interrupt a later
   step to ask for a token.

6. Never echo a secret to chat. The only on-disk location for tokens is
   ~/.credentials/credentials at 0600. When a value must be visible (the
   Jira automation Authorization header), put it in the user's clipboard
   via pbcopy and tell them where to paste.

7. One failure surface at a time. When something fails, name the step,
   name the fix, write the failure to .state.json under last_error, and
   exit. Do not keep going.

The procedure (10 steps):

Step 1  - Preflight + collect tokens.
         macOS check, ~/.credentials/ permissions, network reachability,
         then prompt for: source repo override (default
         NurMind-com/The_Dark_Factory), Jira site/email/API token,
         project key, GitHub owner + repo + PAT, Claude Code OAuth
         token, optional ngrok auth token. Validate Jira /myself, GitHub
         /user (require repo + workflow scopes), Claude format-check.
         Save with _DARK_FACTORY suffix.

Step 2  - Install dependencies.
         Brew-install whatever's missing: Homebrew itself, git, gh,
         node, jq, python3, supabase (tap), ngrok (tap), colima + docker
         (only if neither Docker Desktop nor colima is present).
         gh auth login --with-token. ngrok config add-authtoken.
         colima start if installed.

Step 3  - Create the orchestrator GitHub repo and seed it from source.
         gh repo view; create if missing; clone into ~/code/<repo>.
         Fetch each canonical file from the source repo's main via
         raw.githubusercontent.com. Skip files that already exist in
         the clone (never overwrite the user's edits). For files not
         yet on source-repo main (e.g. deploy-on-merge.yml on a PR
         branch), fall back to writing the body verbatim from
         architecture.md §5. Commit + push.

Step 4  - Set repo secrets via gh secret set. Map ~/.credentials/
         credentials keys to GitHub secret names. Verify with
         gh secret list.

Step 5  - Wire the Jira automation rule. The only step that needs a
         one-time Chrome restart so Playwright can attach to the user's
         logged-in Atlassian session via CDP on port 9222. Tell the
         user clearly to quit Chrome (Cmd-Q), then relaunch:
           open -na "Google Chrome" --args \
             --remote-debugging-port=9222 \
             --user-data-dir="$HOME/Library/Application Support/Google/Chrome"
         Wait for CDP up (curl localhost:9222/json/version). Drive the
         Atlassian Automation UI via the agent's browser MCP (cursor-
         ide-browser in Cursor, user-Playwright in Claude Code). Create
         a Manual trigger → Send web request rule named "Dark Factory
         dispatch", URL https://api.github.com/repos/<owner>/<repo>/
         dispatches, POST, Custom data body {"event_type":
         "jira_manual_button","client_payload":{"issue_key":"{{issue.
         key}}"}}, headers Accept/Content-Type/Authorization. Hand the
         Authorization value via pbcopy never via chat. Validate against
         an existing ticket (expect HTTP 204). Tick Hidden on the
         Authorization header. Manual fallback path if Chrome cannot
         be reattached or UI drifts.

Step 6  - Register the self-hosted Mac runner. Skipped if no
         NGROK_AUTHTOKEN. Detect arch, download runner tarball, get
         registration token via gh api, ./config.sh with labels
         self-hosted,macos,dark-factory, sudo ./svc.sh install/start.
         Verify the runner appears online via gh api.

Step 7  - Scaffold the first client/delivery. Skipped if no
         NGROK_AUTHTOKEN. Ask client_slug + delivery_slug, create
         clients/<c>/<d>/backend/, supabase init, write .delivery.json
         + .env.local, supabase start, capture the local anon +
         service_role keys, write into .env.local. Commit + push.

Step 8  - Smoke tests. Create three Jira tickets with labels and
         descriptions documented inline in the SKILL: BOOT-1
         (claude:answer), BOOT-2 (claude:pr), BOOT-3 (claude:pr +
         client/delivery labels, only if ngrok). For each: trigger
         dispatch via gh api, find the new run, poll to completion,
         capture metrics. Append to .state.json.smoke. If any fails,
         do not continue.

Step 9  - Initial benchmark. Build a markdown table from .state.json.
         smoke, write to ~/code/<repo>/benchmarks/initial.md, commit +
         push. Best-effort post a Jira comment on BOOT-1 with the
         benchmark URL.

Step 10 - Handoff. Print the orchestrator URL, architecture URL,
         benchmark URL, first delivery's live ngrok URL, total Claude
         cost during install, total install time, and the next-step
         instruction (open Jira, write a ticket, label it,
         click the manual button).

Reset (destructive, separate trigger phrase): walk the user through
each destructive step with a confirmation. Wipe .state.json. Remove
*_DARK_FACTORY entries from credentials. Delete the orchestrator GH
repo (asks for owner/name). Uninstall the self-hosted runner.

What the skill does NOT do (document explicitly):
- No Flutter (web or mobile) deploys. Deferred.
- No Supabase Cloud. Local only.
- No iOS/Android signing or store submissions.
- No customer product code. The dispatch flow does that, ticket by
  ticket, after install.

skills/README.md (separate file):
Brief index of skills in this repo. Documents the install one-liner
pattern (curl raw.githubusercontent.com SKILL.md → ~/.claude/skills/
<name>/). Documents the authoring conventions: frontmatter, runbook
style (no driver scripts), state file location, secrets-only-in-
~/.credentials rule, fetch-don't-duplicate templates rule.

Style guide for the SKILL:
- Frontmatter: name, description, user_invocable: true.
- Section ordering: install + trigger phrase + source repo + when to
  invoke + execution principles + state file format + the 10 steps +
  reset + what-it-does-not-do + see-also.
- Each step has a Precondition / Actions / Postcondition structure.
- Tables for prompt schedules, secret mappings, smoke specs.
- Total length target: ~450-500 lines.
```

## Why this works as a build prompt

- "Zero driver scripts" is the most important constraint. Without it the agent will reflexively reach for `bash install.sh` and you end up with hundreds of lines of duplicated logic that doesn't run in Cursor anyway.
- The "fetch don't duplicate templates" rule is what keeps the skill from drifting against the orchestrator. Update the live workflow file → next install picks it up automatically.
- The "front-load credentials" rule is what makes the install feel professional to a non-technical user — they answer everything at the start, then watch the agent work uninterrupted.
- The "never echo a secret" + pbcopy pattern is the only safe way to surface a token value (the Authorization header) when an external system needs to see it.

## Closing the loop

After step 5 ships, the orchestrator can install itself: the SKILL is committed in the source repo at `skills/dark-factory-installer/SKILL.md`, so a fresh user can run the install one-liner pointing at the source repo and end up with the same orchestrator on their own GitHub account.
