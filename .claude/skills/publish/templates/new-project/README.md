# __NAME__

Day-zero site made by claude-setup's `new-project` workflow. The scaffold thread replaces it with
the real app (`scaffold` skill); the deploy wiring stays as it is.

- `npm install`, `npm run verify` (what CI and Workers Builds run)
- Live: `https://__NAME__.<account>.workers.dev`, every other branch a Worker Preview
- Deploys: Cloudflare Workers Builds (`publish` skill in claude-setup)
