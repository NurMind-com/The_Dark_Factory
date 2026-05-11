# Product web deploy (Jira button)

User-facing sites and SPAs built under **`clients/<client>/<delivery>/web/`** are deployed by GitHub Actions when Jira sends a **`repository_dispatch`** event. This is separate from [local Supabase + ngrok](../.github/workflows/deploy-on-merge.yml) for `clients/**/backend/**`.

## Repository layout (contract)

| Path | Purpose |
|------|---------|
| `clients/<client>/<delivery>/web/package.json` | Defines `npm run build` |
| `clients/<client>/<delivery>/web/dist/` | **Required output** after `build` (static files published to **GitHub Pages**) |

- `<client>` and `<delivery>` are **lowercase slugs**: letters, digits, hyphens only (e.g. `example`, `demo`).
- A reference scaffold lives at [`clients/example/demo/web/`](../clients/example/demo/web).

## Git ref (v1)

The workflow **always checks out `main`**. The deploy reflects whatever is currently on `main` for that web folder; merge product PRs before clicking Deploy in Jira.

## Hosting: GitHub Pages (current)

The workflow publishes **`dist/`** to [**GitHub Pages**](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site#publishing-with-a-custom-github-actions-workflow) using `actions/upload-pages-artifact` and `actions/deploy-pages`.

### One-time repo settings

1. **Settings → Pages → Build and deployment**
2. **Source:** **GitHub Actions** (not "Deploy from a branch").
3. First run may prompt you to approve the **`github-pages`** environment (deployment protection).

### URL shape

- **Project site:** `https://<owner>.github.io/<repo>/` (or your custom domain on Pages).
- **Important:** There is **one** Pages site per repository. Any Jira deploy from any `client`/`delivery` updates **the same** site (last successful run wins). For multiple public sites, use separate repos or move to per-site hosting (e.g. Netlify) later.

Repository secrets **`JIRA_BASE_URL`**, **`JIRA_EMAIL`**, and **`JIRA_API_TOKEN`** are used to post the result comment (same as the dispatch flow). No Netlify secrets are required for Pages.

## Jira automation (manual button)

Ready JSON (and the shared HTTP setup) is in [`jira-repository-dispatch-examples.md`](./jira-repository-dispatch-examples.md) and [`examples/jira-dispatch/jira_deploy_product.json`](../examples/jira-dispatch/jira_deploy_product.json).

Create an automation rule (e.g. "Deploy product to GitHub Pages") using **Send web request**:

- **URL:** `https://api.github.com/repos/<ORG>/<REPO>/dispatches`
- **Headers:**
  - `Accept: application/vnd.github+json`
  - `Authorization: Bearer <GITHUB_PAT>` (must be allowed to call [`repository_dispatch`](https://docs.github.com/en/rest/repos/repos#create-a-repository-dispatch-event) for this repo; the workflow uses `GITHUB_TOKEN` for checkout and Pages)
- **Body (JSON):**

```json
{
  "event_type": "jira_deploy_product",
  "client_payload": {
    "issue_key": "{{issue.key}}",
    "client": "example",
    "delivery": "demo"
  }
}
```

Map `client` and `delivery` from Jira labels (`client:`, `delivery:`), custom fields, or fixed values per rule. They must match the folder names under `clients/`.

## Manual test (without Jira)

In GitHub: **Actions → Jira product deploy → Run workflow**, and set `issue_key`, `client`, `delivery` (e.g. `TDS-1`, `example`, `demo`).

## Workflow file

[`../.github/workflows/jira-product-deploy.yml`](../.github/workflows/jira-product-deploy.yml)

## Backend vs frontend

| Trigger | Path | Behaviour |
|---------|------|-----------|
| Push to `main` touching `clients/**/backend/**` | [`deploy-on-merge.yml`](../.github/workflows/deploy-on-merge.yml) | Local Supabase + ngrok on self-hosted runner |
| Jira button → `jira_deploy_product` | `clients/**/web/**` via this doc | `ubuntu-latest`: `npm ci` / `npm install`, `npm run build`, publish **`dist/`** to **GitHub Pages** |
