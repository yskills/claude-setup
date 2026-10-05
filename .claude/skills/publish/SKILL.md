---
name: publish
description: How a web app deploys - Cloudflare Workers Builds for the live site, a Worker Preview per branch, no keys in GitHub. Use when setting up, changing or debugging a project's deploys or previews.
---

# Publish a web app

Decided 2026-10-05 on duo-test (Nuxt + D1 + secrets) and MyPage (static site).
Cloudflare Workers Builds, Cloudflare's GitHub app, builds the repo. GitHub only runs the tests.
No deploy keys in GitHub, in the cloud environment or in chat.

## How it works

- The default branch deploys to the live Worker. Every other branch gets a
  [Worker Preview](https://developers.cloudflare.com/workers/previews/):
  `https://<branch>-<worker>.<subdomain>.workers.dev`, which Cloudflare links on the PR.
- Previews inherit nothing from production. The `previews` block in `wrangler.jsonc` gives them
  their own resources, and the dashboard's **Previews Base** settings give them their own secrets.
  So a PR never touches live data or live keys at runtime.
- GitHub Actions runs `verify` and holds no keys. Threads can't reach Cloudflare's API, so they
  deploy by merging and read the result from the `Workers Builds: <worker>` check on the commit.
  Build logs are only in the dashboard; Cloudflare's dashboard AI can read them for yskills.

## A new project

yskills, once:

1. [github.com/new](https://github.com/new): a **private** repo. Claude adds it with `add_repo`.
2. Cloudflare dashboard: Workers & Pages → Create → **Import a repository** → pick the repo.
   - Project name: the `name` in `wrangler.jsonc`.
   - Build command: `npm run build`, or `npm run generate` for a static Nuxt site.
   - Deploy command: `npm run deploy` if the app has a D1 database, else `npx wrangler deploy`.
   - Production branch: the repo's default branch (MyPage's is `origin`, not `main`).
   - Leave non-production branch builds on: they are what makes the previews.
3. Apps with D1:
   - Create the D1 databases `<name>` and `<name>-preview` on the
     [D1 page](https://dash.cloudflare.com/?to=/:account/workers/d1) and send Claude both ids. Ids aren't secrets.
   - The build token (named under the Worker's Settings → Build) needs Account · D1 · Edit. Add it
     at [API Tokens](https://dash.cloudflare.com/profile/api-tokens) → the token's **…** →
     **Edit**. The default build token has no D1 permission, so migrations fail without it.
4. Runtime secrets: Worker → Settings → Variables and secrets.
   - **Production** holds the real keys.
   - **Previews Base** holds only what previews need, e.g. their own `BETTER_AUTH_SECRET`, never
     a production value. Set them before the first PR: a Base secret only reaches previews
     created after it.

Claude:

- `wrangler.jsonc` (wrangler 4.147 or newer, which is what knows the block):
  - a `previews` block, required even as `{}`
  - every binding repeated in `previews` with its own resource, because previews inherit none
  - D1 ids committed, and `preview_database_id` set to the preview database's id
  - `"workers_dev": true` and `"preview_urls": true`, so each deploy switches the live address and
    the preview links back on. Without `preview_urls` the PR comment says "No Preview URL", and
    without `workers_dev` the live address answers Cloudflare's "error code: 1042". Only
    `wrangler deploy` applies them, so a change reaches previews after the next deploy of the
    production branch.
  - no `build.command`: the dashboard builds, so the build runs before any migration
- `npm run deploy` (D1 apps):

  ```
  wrangler d1 migrations apply DB --remote && wrangler deploy && (wrangler d1 migrations apply DB --remote --preview || echo "previews may miss the newest tables")
  ```

  It migrates live, deploys, then migrates the preview database. So the preview database only
  gets migrations from a deploy of the production branch: on a branch that adds one, the preview's
  pages that use the new schema fail until it is merged.
- A unit test that checks the `previews` block: same binding names, no live resource ids
  (duo-test `tests/unit/wrangler-config.test.ts`).
- `.github/workflows/ci.yml` with the verify job only (`sell` skill's `templates/ci.yml`).
  Optional live smoke test on `check_run` `completed`, filtered to the exact name
  `Workers Builds: <worker>`, `conclusion == 'success'`,
  `check_suite.head_branch == '<production branch>'` and `head_sha == github.sha`
  (duo-test `live.yml`). Without the conclusion filter it would smoke-test a failed build.

## The tradeoff, decided

Workers Builds uses one API token per Worker for main and branch builds alike. It only accepts
user tokens, and those can't be limited to one Worker. So code on any pushed branch runs with a
key that could deploy the live site.

That is accepted: only yskills and Claude push, and both can merge to main anyway, so a branch
build adds no new way in. It holds as long as these guards do:

- Repos stay private. Cloudflare's docs don't say whether pull requests from forks get built.
- No outside collaborators.
- Before a live payment key goes in: Worker → Settings → Build → turn off non-production branch
  builds. Previews stop, and only merged code ever runs with the key.
- Merge only green PRs. A red `verify` doesn't stop Cloudflare's deploy, and branch protection
  needs a paid GitHub plan on private repos.

Revisit when Workers Builds accepts account-owned tokens scoped to one Worker.

## Replaced

Replaced on 2026-10-05, so that no project gets them again:

- GitHub Actions deploys with `CLOUDFLARE_API_TOKEN` in a main-only environment.
- PR previews uploaded to a separate `<name>-preview` Worker with `PREVIEW_CLOUDFLARE_API_TOKEN`.
- `scripts/deploy.mjs`, which copied keys from CI into the Worker and recreated the Stripe webhook
  on every deploy. Runtime keys are now dashboard secrets and the webhook is made once by hand
  (`sell` skill's `keys.md`).

Also looked at and dropped: Cloudflare's **Deploy to Cloudflare** button (it only copies a
**public** repo, so a private project can't use it) and wrangler's resource auto-provisioning (it
would create the live database on the first deploy, but `d1 migrations apply --remote` needs a
`database_id`, and a preview database still has to exist with its id committed). Revisit either
when that changes.
