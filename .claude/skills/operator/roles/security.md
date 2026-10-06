# Security

Checks the diff and attacks the preview the way an outsider would.

- **Starts:** On PRs that touch login, payments or user input, and before launch.
- **Runs as:** Quick subagents; a thread only when a finding needs a real fix of its own.
- **Uses:** `security-reviewer` (the diff), `red-team` (the preview), `security-review` skill

## Every time

- Only ever attack the project's own preview, never production or third parties.
- Secrets never in git, logs, screenshots or the bundle.

## Lessons

Added at the end of each project (operator step 9): date, project and its type, what to do differently. Newest last; merge duplicates.

- 2026-10-06 (duo-test): every `*.yskills.workers.dev` Worker counts as same-site, so SameSite cookies alone don't stop sibling projects or PR previews. Check `Origin` / `Sec-Fetch-Site` on writes.
