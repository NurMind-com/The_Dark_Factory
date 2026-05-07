## TDS-12 — Move ticket to In Progress when work starts

**What changed**

`.github/scripts/jira-dispatch.mjs` (only) now transitions the Jira ticket to "In Progress" inside `prepareDispatch`, immediately after the issue fetch and before any branch checkout or file write. A new helper `transitionToInProgress(key, issue)` does the work; the existing `initJira()` / `fetchJson()` patterns are reused, so no new secrets are needed.

**How status detection works**

1. Read `status.statusCategory.key` from the already-fetched issue (the existing fetch already requests the `status` field).
2. If the category is `indeterminate` (already In Progress) or `done`, log and skip — re-runs on those tickets are silent no-ops.
3. Otherwise, `GET /rest/api/3/issue/{key}/transitions` and pick a transition whose `to.statusCategory.key === "indeterminate"`. If none, fall back to the first transition whose `name` matches `"in progress"` case-insensitively.
4. `POST /rest/api/3/issue/{key}/transitions` with `{"transition": {"id": "<id>"}}`.

**Fallback behaviour**

- No matching transition for the current state → log a warning and continue. The dispatch run is never aborted.
- Transitions API request fails or the POST returns non-2xx → log a warning and continue.
- All failures are best-effort; the ticket workflow is never blocked by a status-flip problem.

**Risks**

- If a Jira workflow exposes more than one `indeterminate` transition for a state (unusual), the helper picks the first one returned by Jira. This matches the spec.
- Could not exercise live Jira from this run; relying on the documented Jira REST v3 contract that `status.statusCategory.key` is returned with the standard `status` field, and that the transitions endpoint returns `{transitions: [...]}`.
