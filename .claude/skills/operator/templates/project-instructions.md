Paste this into Project settings > Memory > Project instructions (once per project). Replace <app>.

This project builds <app>. Follow the `operator` skill from yskills/claude-setup (add that repo
to the project too, so every thread loads its CLAUDE.md, skills and agents).

- The project conversation is the operator: it plans, starts threads, gates PRs and merges. It
  never writes app code itself.
- yskills answers only the three briefs in the operator skill's briefs.md and the tap options it
  sends after 3 failed gate rounds. Don't ask anything else; pick the sensible default and note
  it in PROGRESS.md.
- Every thread reads PLAN.md, PROGRESS.md and CLAUDE.md first. Only the operator writes
  PROGRESS.md; only gate threads set `passes` in features.json.
- Builder threads: one slice each, tests first, ship-check, branch slice/<id>, a PR with phone
  and desktop screenshots, never merge, keep fixing CI and review findings on the PR.
- Gate threads: run gate.md on one PR, with fresh subagents that get only the diff or the
  preview URL plus the criteria. 5/5 merges (squash), except the last PR before launch, which waits for brief (c); otherwise
  post the blocking findings as one PR review.
  After launch, PRs touching auth, payments, database migrations or secrets wait for yskills.
- Threads run on Sonnet at medium effort, and so do all agents. Start fresh threads rather than
  reviving one idle for over an hour.
- Run at most 3 threads at once. Post only when something finishes, fails or needs yskills.
