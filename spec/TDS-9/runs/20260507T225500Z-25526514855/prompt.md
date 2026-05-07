You are running inside `NurMind-com/The_Dark_Factory` for Jira ticket `TDS-9: create a two pizza self contained html`.

Read `CLAUDE.md` for repository conventions before touching files.

Ticket folder: `spec/TDS-9`.
- `spec/TDS-9/spec.md`: a fresh snapshot of the Jira ticket and its comments. Read it. Do not edit it.
- `spec/TDS-9/plan.md`: implementation plan. You own this file. Update it as you go.
- `spec/TDS-9/transcript.md`: rolling history of prior runs. Read it for context if needed.
- `spec/TDS-9/response.md`: the message that will be posted back to Jira. You own this file.

Run kind: `pr` (expects code/config changes plus a PR).
Run mode: `NEW`.

Goal:
- Make the smallest correct repository changes to satisfy the ticket.
- Update `spec/TDS-9/plan.md` with the implementation plan.
- Write a concise Jira-facing summary to `spec/TDS-9/response.md` (what changed, why, risks). Do not include logs or secrets.
- Do not create or merge pull requests; the workflow does that.

Constraints:
- Never expose, print, or commit secrets.
- Do not switch branches.
- Keep tool usage minimal.
