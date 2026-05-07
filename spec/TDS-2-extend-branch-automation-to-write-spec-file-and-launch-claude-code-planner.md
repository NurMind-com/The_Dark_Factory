# TDS-2: Extend branch automation to write spec file and launch Claude Code planner

Generated from Jira on 2026-05-07T18:31:04.156Z.

## Links

- Jira: https://abouyounes.atlassian.net/browse/TDS-2
- Branch: TDS-2-test-final-pr-workflow
- Repository: https://github.com/NurMind-com/The_Dark_Factory

## Issue Details

| Field | Value |
|---|---|
| Key | TDS-2 |
| Title | Extend branch automation to write spec file and launch Claude Code planner |
| Type | Task |
| Status | In Progress |
| Priority | Medium |
| Assignee | - |
| Reporter | Roland Abou Younes |
| Labels | automation, claude-code, github-actions, jira |
| Components | - |
| Created | 2026-05-07T20:35:18.083+0300 |
| Updated | 2026-05-07T21:29:48.481+0300 |

## Full Description

## Goal

Update the existing GitHub Actions branch-created automation in `NurMind-com/The_Dark_Factory` so that, when a branch starts with a Jira ticket key, the workflow not only creates a branch README from the Jira ticket but also creates a durable spec file and launches a Claude Code planning pass.

This ticket is requirements-only. Do **not** update the GitHub Actions workflow as part of this ticket.

## Current behavior

The repository currently has a GitHub Actions workflow that runs on branch creation, extracts the Jira ticket key from the start of the branch name, fetches Jira issue details, writes `README.md` to the created branch, and comments back on the Jira ticket.

## Required future behavior

When a branch is created and the branch name begins with a Jira key such as `TDS-123`:

1. Extract the Jira issue key from the branch name.
2. Fetch the Jira ticket content.
3. Create a `spec/` folder in the branch if it does not exist.
4. Create a markdown spec file inside `spec/` using a filename based on the ticket key and title.
   Required filename format:
   ```
   spec/<ticket_id>-<ticket_title_slug>.md
   ```
   Example:
   ```
   spec/TDS-123-extend-branch-automation-to-write-spec-file-and-launch-claude-code-planner.md
   ```
5. The spec file must contain the full Jira ticket content in markdown, including at minimum:
   - ticket key
   - title/summary
   - Jira URL
   - branch name
   - status
   - issue type
   - priority
   - assignee
   - reporter
   - labels/components
   - full description
   - timestamp of generation
6. Launch a Claude Code instance from the GitHub Action.
7. The Claude Code instance must be instructed to:
   - clone or check out the repository branch
   - find the newly created ticket spec markdown file in `spec/`
   - read the ticket requirements
   - create an implementation plan only, without making production code changes
   - store the plan as a markdown file in the repo
8. The plan file must use this filename format:
   ```
   <ticket_id>-<ticket_title_slug>-plan.md
   ```
   Example:
   ```
   TDS-123-extend-branch-automation-to-write-spec-file-and-launch-claude-code-planner-plan.md
   ```
9. Commit and push both generated files to the created branch:
   - `spec/<ticket_id>-<ticket_title_slug>.md`
   - `<ticket_id>-<ticket_title_slug>-plan.md`
10. Comment back on the Jira ticket after the plan is created.
11. The Jira comment must include links to:

- the generated spec markdown file
- the generated plan markdown file
- the branch

## Claude Code prompt requirements

The GitHub Action must pass Claude Code an explicit instruction similar to:

```
You are working on branch <branch_name> of NurMind-com/The_Dark_Factory.
Clone or check out the repo, find spec/<ticket_id>-<ticket_title_slug>.md, read it fully, and create an implementation plan only.
Do not change product code.
Write the plan to <ticket_id>-<ticket_title_slug>-plan.md.
Commit and push only the plan file if the workflow does not handle committing it for you.
```

## Non-goals

- Do not implement the GitHub Actions change in this ticket.
- Do not modify application code.
- Do not auto-merge branches.
- Do not create pull requests unless a separate ticket requests it.
- Do not expose Jira or GitHub credentials in generated markdown files, logs, or comments.

## Acceptance criteria

- A future implementation updates the branch-created workflow to generate the `spec/` markdown file.
- The spec file name includes both the Jira ticket key and a slugified ticket title.
- The spec file contains the full Jira ticket content in markdown.
- A Claude Code planning run is launched by the workflow after the spec file is created.
- The Claude Code run creates a plan file named `<ticket_id>-<ticket_title_slug>-plan.md`.
- The workflow commits and pushes the generated spec and plan files to the branch.
- The workflow comments on the Jira ticket with links to the spec file, plan file, and branch.
- Secrets are provided through GitHub Actions secrets or an approved secret manager and are never written to repo files or logs.

## Suggested implementation notes

- Reuse the existing branch-created workflow and Jira REST integration where possible.
- Keep the implementation simple: one workflow plus small scripts is preferred unless Claude Code invocation requires a separate action.
- The branch-name Jira key parser should keep the current convention: `^([A-Z][A-Z0-9]+-\\d+)`.
- Slugify the Jira title using lowercase alphanumeric words joined with hyphens.
- If the branch does not begin with a Jira key, the workflow should skip cleanly.
