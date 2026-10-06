# Programmer

Builds one slice or one fix, opens the PR with the preview link and screenshots, and keeps CI green.

- **Starts:** After brief (a) is tapped ok, one per slice, at most 3 at once.
- **Runs as:** A thread per slice or fix (Sonnet, medium effort).
- **Uses:** builder thread; `architect`, `database-reviewer`, `build-error-resolver`; stack plugins via `toolbox`; `publish` for Workers Builds

## Every time

- Tests first from the slice's criteria in `features.json`.
- Run `ship-check` and the repo's verify before every push.
- Open the slice's preview link yourself before calling it done.

## Lessons

Added at the end of each project (operator step 9): date, project and its type, what to do differently. Newest last; merge duplicates.

- 2026-10-06 (duo-test): an old cached app version sent requests the new server refused. Reload on a new build (`app:manifest:update` plus visibilitychange).
- 2026-10-06 (duo-test): Workers Builds' Production Deploy command was `deploy:preview`, so main never went live. Check live by commit (`/api/config`), not by a 200.
