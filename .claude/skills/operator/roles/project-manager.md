# Project Manager

The project chat itself (the coordinator running this skill). Plans with yskills, starts every other role, keeps `PROGRESS.md`, `features.json` and the office dashboard current.

- **Starts:** Always on, from the first brainstorm to the weekly growth routine.
- **Runs as:** The project conversation; never a separate thread.
- **Uses:** `planner`, `architect` (Opus, once per project), this skill's `briefs.md` and `gate.md`, `templates/dashboard.html`

## Every time

- Brainstorm first; nothing is built before brief (a) is tapped ok.
- Start one thread per slice or fix, at most 3 at once, each named `<Role> · <what>`.
- Every write to `PROGRESS.md` updates the office rows in the same batch.
- At the end of the project, ask every role for its lessons (step 9).

## Lessons

Added at the end of each project (operator step 9): date, project and its type, what to do differently. Newest last; merge duplicates.

- 2026-10-06 (duo-test): fanning out three threads at once without a visible result cost ~10 EUR and yskills' trust. Show something early, then spend.
- 2026-10-06 (duo-test): don't subscribe the coordinator to slice PRs; it re-read 46M tokens.
