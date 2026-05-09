# Skills

Agent skills for Cursor and Claude Code. Each subdirectory is one skill, with a `SKILL.md` the agent reads when invoked.

These are runbooks, not scripts. The agent (Cursor or Claude Code) reads the SKILL and executes its steps inline using its own tools (Shell, Write, AskQuestion, browser/Playwright MCP). No driver scripts to maintain.

## Skills in this repo

| Skill | Trigger phrases | What it does |
|---|---|---|
| [`dark-factory-installer`](dark-factory-installer/SKILL.md) | `install dark factory`, `bootstrap dark factory` | End-to-end bootstrap of a Dark Factory orchestrator: collects tokens, creates the GitHub repo, sets secrets, wires the Jira manual-trigger automation rule via Playwright/CDP, optionally registers a self-hosted Mac runner and scaffolds the first client/delivery, runs smoke tests, captures the initial benchmark. |

## Installing a skill on a new machine

Each skill is one Markdown file. To install one locally so Cursor / Claude Code can invoke it:

```bash
SKILL=dark-factory-installer
mkdir -p ~/.claude/skills/${SKILL}
curl -fsSL "https://raw.githubusercontent.com/NurMind-com/The_Dark_Factory/main/skills/${SKILL}/SKILL.md" \
  > ~/.claude/skills/${SKILL}/SKILL.md
```

Then in Cursor or Claude Code, use the trigger phrase from the table above.

## Authoring a new skill

A skill is a single `SKILL.md` file with YAML frontmatter and a runbook body. Conventions:

- **Frontmatter**: `name`, `description`, `user_invocable: true` if the user can invoke it directly by trigger phrase.
- **Runbook**: numbered steps the agent executes inline. Each step has a precondition check ("skip if already done"), actions, and a postcondition (e.g., update a state file). No external scripts.
- **State**: if the skill needs to remember progress across invocations, it maintains `~/.claude/skills/<name>/.state.json` itself. Format documented in the SKILL.
- **Secrets**: only on disk under `~/.credentials/credentials` at `0600`, suffix per-skill (e.g., `*_DARK_FACTORY`). Never echo to chat. For one-shot transfer to a UI field, use `pbcopy`.
- **Templates**: if the skill needs to drop files into another repo, it fetches them at install time from the source repo via `https://raw.githubusercontent.com/<owner>/<repo>/<ref>/<path>` rather than duplicating them.
