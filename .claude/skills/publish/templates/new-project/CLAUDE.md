# __NAME__

Made by claude-setup's `new-project` workflow. Rules live in yskills/claude-setup (`CLAUDE.md`,
`publish` skill): a thread without that repo adds it with `add_repo` and reads its `CLAUDE.md` first.

- Deploys: Workers Builds builds every push with `npm run check && npm run build`; `main` runs
  `npm run deploy`, other branches `npm run deploy:preview`. No keys in git or GitHub.
- `/api/config` returns the built `commit` (`WORKERS_CI_COMMIT_SHA`) for the live check.
- Migrations (`migrations/`) stay additive and are never renamed once pushed.
