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
