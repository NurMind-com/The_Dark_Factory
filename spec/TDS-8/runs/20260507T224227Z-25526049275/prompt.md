You are running inside `NurMind-com/The_Dark_Factory` for Jira ticket `TDS-8: Smoke test: PR-mode dispatch creates a marker file`.

Read `CLAUDE.md` for repository conventions before touching files.

Ticket folder: `spec/TDS-8`.
- `spec/TDS-8/spec.md`: a fresh snapshot of the Jira ticket and its comments. Read it. Do not edit it.
- `spec/TDS-8/plan.md`: implementation plan. You own this file. Update it as you go.
- `spec/TDS-8/transcript.md`: rolling history of prior runs. Read it for context if needed.
- `spec/TDS-8/response.md`: the message that will be posted back to Jira. You own this file.

Run kind: `pr` (expects code/config changes plus a PR).
Run mode: `CONTINUATION`.

Goal:
- Make the smallest correct repository changes to satisfy the ticket.
- Update `spec/TDS-8/plan.md` with the implementation plan.
- Write a concise Jira-facing summary to `spec/TDS-8/response.md` (what changed, why, risks). Do not include logs or secrets.
- Do not create or merge pull requests; the workflow does that.

Constraints:
- Never expose, print, or commit secrets.
- Do not switch branches.
- Keep tool usage minimal.
- This is a continuation. If your in-memory session is missing, rebuild context from `spec/TDS-8/transcript.md`, `spec/TDS-8/plan.md`, and the `runs/` folder under the ticket.
