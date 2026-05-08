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

Three-lane swimlane: **Triggers → Workflows → Side effects**. Trigger metadata
(`repository_dispatch`, `on: create`, `workflow_dispatch`) is encoded in the
trigger nodes so all arrows stay unlabelled. `actions/cache` is intentionally
omitted from this view — it is an implementation detail of session continuity
and is captured in the workflow comparison table above.

```mermaid
flowchart LR
    subgraph TR["Triggers"]
        direction TB
        JM["Jira: manual button<br/>(repository_dispatch)"]
        JB["Jira: branch created<br/>(on: create)"]
        MD["Manual workflow_dispatch"]
    end

    subgraph WF["Workflows (.github/workflows)"]
        direction TB
        WD["jira-dispatch.yml<br/>(preferred)"]:::pref
        WB["jira-branch-readme.yml<br/>(legacy)"]:::legacy
        WP["poc-session.yml<br/>(POC)"]:::poc
    end

    subgraph OUT["Side effects"]
        direction TB
        CC["Claude Code run"]
        GH["Branch + PR"]
        JC["Jira comment"]
    end

    JM --> WD
    JB --> WB
    MD --> WP
    MD --> WD

    WD --> CC
    WB --> CC
    WP --> CC

    WD --> GH
    WB --> GH
    WP --> GH

    WD --> JC
    WB --> JC

    classDef pref fill:#d1f0d8,stroke:#28a745,color:#1f2328
    classDef legacy fill:#fff3cd,stroke:#d39e00,color:#1f2328
    classDef poc fill:#e7e9ec,stroke:#868e96,color:#1f2328
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
    W->>W: prepare spec/[TICKET-ID]/ artefacts
    Note over W: dispatch flow only<br>restore ~/.claude/projects from cache
    W->>C: run with prompt + ticket context
    C->>W: edits, plan.md, response.md
    Note over W: dispatch flow only<br>save ~/.claude/projects to cache
    W->>R: commit, push branch, open or update PR
    W->>J: comment back with PR link or answer
```

## Artefacts each run produces

```
spec/[TICKET-ID]/
  spec.md          ticket snapshot (refreshed each run)
  plan.md          implementation plan owned by Claude
  response.md      Jira-facing summary or answer
  state.json       last_session_id, run_count, kind
  transcript.md    one section per run
  runs/[ts]-[id]/  per-run prompt and response copies
```

The legacy `jira-branch-readme.yml` flow used the older flat layout
(`spec/[KEY]-[slug].md` and `[KEY]-[slug]-plan.md` at repo root) for backwards
compatibility — that flow has now been retired by TDS-11.
