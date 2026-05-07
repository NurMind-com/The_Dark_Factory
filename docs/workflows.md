# Workflows Overview

A very high level view of how Jira tickets become repository changes in The Dark Factory.

The source of truth for behaviour is always the workflow files themselves under
[`.github/workflows/`](../.github/workflows). For a deeper spec of the dispatch
flow and Claude session continuity, see
[`../github_actions_claude_spec.md`](../github_actions_claude_spec.md).

## Workflows in this repo

| Workflow | Trigger | Purpose | Status |
|---|---|---|---|
| [`jira-dispatch.yml`](../.github/workflows/jira-dispatch.yml) | `repository_dispatch: jira_manual_button` from Jira automation, or manual `workflow_dispatch` | Turn a Jira ticket into reviewable repo work or a Jira-facing answer. Resumes Claude across runs. | Preferred |
| [`jira-branch-readme.yml`](../.github/workflows/jira-branch-readme.yml) | Branch creation (`on: create`) | One-shot: when Jira creates a branch, generate a spec, run Claude once, open a PR. No session continuity. | Legacy, kept for compatibility |
| [`poc-session.yml`](../.github/workflows/poc-session.yml) | Manual `workflow_dispatch` | Proof-of-concept that Claude Code sessions can be resumed across runner invocations. | POC only |

## High level system view

```mermaid
flowchart LR
    Jira["Jira (abouyounes.atlassian.net)"]
    GH["GitHub repo<br/>NurMind-com/The_Dark_Factory"]
    Claude["Claude Code<br/>(anthropics/claude-code-base-action)"]
    Cache["actions/cache<br/>(~/.claude/projects)"]

    Jira -- "manual button<br/>(repository_dispatch)" --> WD["jira-dispatch.yml"]
    Jira -- "branch created<br/>(on: create)" --> WB["jira-branch-readme.yml"]
    User["Engineer"] -- "workflow_dispatch" --> WP["poc-session.yml"]
    User -- "workflow_dispatch" --> WD

    WD -- "fetch ticket / post comment" --> Jira
    WB -- "fetch ticket / post comment" --> Jira

    WD -- "commit + push branch<br/>open / update PR" --> GH
    WB -- "commit + push branch<br/>open PR" --> GH
    WP -- "commit POC state<br/>to main" --> GH

    WD <-- "resume / persist session" --> Cache
    WP <-- "resume / persist session" --> Cache

    WD --> Claude
    WB --> Claude
    WP --> Claude
```

## Common shape of a Jira-driven run

Both `jira-dispatch.yml` and `jira-branch-readme.yml` follow the same overall
shape, just with different trigger semantics and different artefact layouts.
`jira-dispatch.yml` adds session-cache restore/save around the Claude step.

```mermaid
sequenceDiagram
    autonumber
    participant J as Jira
    participant W as GitHub Actions workflow
    participant C as Claude Code
    participant R as Repo / PR

    J->>W: trigger (button or branch create)
    W->>J: fetch ticket (REST)
    W->>W: prepare spec/<TICKET-ID>/ artefacts
    Note over W: dispatch flow only:<br/>restore ~/.claude/projects from cache
    W->>C: run with prompt + ticket context
    C->>W: edits, plan.md, response.md
    Note over W: dispatch flow only:<br/>save ~/.claude/projects to cache
    W->>R: commit, push branch, open / update PR
    W->>J: comment back with PR link or answer
```

## Artefacts each run produces

```
spec/<TICKET-ID>/
  spec.md          ticket snapshot (refreshed each run)
  plan.md          implementation plan owned by Claude
  response.md      Jira-facing summary or answer
  state.json       last_session_id, run_count, kind
  transcript.md    one section per run
  runs/<ts>-<id>/  per-run prompt and response copies
```

The legacy `jira-branch-readme.yml` flow uses the older flat layout
(`spec/<KEY>-<slug>.md` and `<KEY>-<slug>-plan.md` at repo root) for backwards
compatibility.
