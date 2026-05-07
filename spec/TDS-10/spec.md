# TDS-10: Workflow Diagram

Generated from Jira on 2026-05-07T23:13:25.951Z.

## Issue Details

| Field | Value |
|---|---|
| Key | TDS-10 |
| Title | Workflow Diagram |
| Type | Task |
| Status | To Do |
| Priority | Medium |
| Assignee | - |
| Reporter | Roland Abou Younes |
| Labels | - |
| Components | - |
| Created | 2026-05-08T02:04:24.145+0300 |
| Updated | 2026-05-08T02:13:03.336+0300 |

## Description

Make a very high level diagram of the workflows we have in the solution

## Comments (2)

### Roland Abou Younes on 2026-05-08T02:08:16.781+0300

[TDF-bot] Claude Code processed TDS-10 (conclusion: success).

Branch: [https://github.com/NurMind-com/The_Dark_Factory/tree/tdf%2Ftds-10](https://github.com/NurMind-com/The_Dark_Factory/tree/tdf%2Ftds-10)

Pull request: [https://github.com/NurMind-com/The_Dark_Factory/pull/11](https://github.com/NurMind-com/The_Dark_Factory/pull/11)

# TDS-10: Workflow Diagram

## What changed

Added a new high-level overview at [`docs/workflows.md`](../../docs/workflows.md):

- A table listing the three workflows in `.github/workflows/` (`jira-dispatch.yml`, `jira-branch-readme.yml`, `poc-session.yml`) with trigger, purpose, and status (preferred / legacy / POC).
- A Mermaid `flowchart` showing the system at a glance: Jira, the three workflows, Claude Code, the GitHub Actions cache, and the repo / PR.
- A Mermaid `sequenceDiagram` for the common Jira → workflow → Claude → PR → Jira-comment shape that both Jira-driven workflows follow.
- The artefact layout under `spec/<TICKET-ID>/`.

The doc points to the workflow YAML files and to the existing `github_actions_claude_spec.md` as the source of truth for deeper detail, so the diagram does not need to be re-derived if behaviour changes.

## Why

Ticket asks for a "very high level diagram of the workflows we have in the solution". Mermaid renders natively on github.com inside a `.md` file, so no images, external tooling, or build step are required.

## Why README was not modified

The current `README.md` is itself a stale auto-generated stub from the legacy branch-creation flow (for TDS-4). Other root-level docs (`github_actions_claude_spec.md`, `two-pizzas.html`) are not linked from it either, so adding a link would be inconsistent and out of scope.

## Risks

- Mermaid rendering can only be visually confirmed once the PR loads on GitHub. The syntax used (`flowchart LR`, `sequenceDiagram`) is the most common Mermaid subset and is unlikely to fail to render.
- The diagram can drift from reality as workflows evolve. The doc explicitly points to the YAML files as the source of truth to mitigate this.

No code paths or workflow behaviour change.

### Roland Abou Younes on 2026-05-08T02:13:03.336+0300

## High level system view, the workflow under it has overlaping boxes, please validate visually before making a second version of it call it V2
