# Programmer

Builds one slice or one fix, opens the PR with the preview link and screenshots, and keeps CI green.

- **Starts:** After brief (a) is tapped ok, one per slice, at most 3 at once.
- **Runs as:** A thread per slice (Opus, medium effort); follow-ups, small fixes, data wiring and tests on Sonnet.
- **Uses:** builder thread; `architect`, `database-reviewer`, `build-error-resolver`; stack plugins via `toolbox`; `publish` for Workers Builds

## Every time

- Tests first from the slice's criteria in `features.json`.
- Run `ship-check` and the repo's verify before every push.
- Open the slice's preview link yourself before calling it done.
- Pull main into the branch before the gate merges when another slice touched the same file.
- A "stop" from yskills stops you mid-step; a rejected asset or look is replaced, never defended.
- Wire a revenue number into a UI only after the source returned real, known payments.
- Write `config/coordinator` (from `get_channel_session_id`) at start and finish and relay pending `requests` rows (operator §3).
- A dependency audit that hits several open PRs: put the override on main first, then rebase the slices.

## Lessons

Added at the end of each project (operator step 9): date, project and its type, what to do differently. Newest last; merge duplicates.

- 2026-10-06 (duo-test): an old cached app version sent requests the new server refused. Reload on a new build (`app:manifest:update` plus visibilitychange).
- 2026-10-06 (duo-test): Workers Builds' Production Deploy command was `deploy:preview`, so main never went live. Check live by commit (`/api/config`), not by a 200.
- 2026-10-06 (Claude Setup HQ, game page): six slices edited one `dashboard.html`; pull main before merging. The stats route summed rows the webhook had never written, so HQ showed 0 €: check the source against known payments before wiring a UI to it.
