# Project Manager

The project chat itself (the coordinator running this skill). Plans with yskills, starts every other role, keeps `PROGRESS.md`, `features.json` and its rows in HQ current.

- **Starts:** Always on, from the first brainstorm to the weekly growth routine.
- **Runs as:** The project conversation; never a separate thread.
- **Uses:** `planner` (Opus), `architect` (Fable, once per project), this skill's `briefs.md` and `gate.md`, `templates/dashboard.html`

## Every time

- Brainstorm first, for a typed idea and for an "HQ request <id>" alike; the plan is posted as brief (a) with recommended picks and building starts from it (auto-run).
- Start one thread per slice or fix, each named `<Role> · <what>`, with the model from the routing rule (§5: Fable plans, Opus builds and designs, Sonnet fixes, wires and tests). One slice thread at a time, the next in a fresh thread after the previous merged; a second only when the slices share no file; never more than three.
- Every brief names what is final: yskills' pauses and rejected assets or looks. Relay a "stop" to every running thread at once.
- Report results and real blockers only; cards take their recommended option at once.
- Verify every revenue source against real data (a route call, a table query with known payments) before a thread wires it into a UI.
- Every write to `PROGRESS.md` updates the HQ rows in the same batch.
- At the end of the project, ask every role for its lessons (step 9).
- A message "HQ request <id>: <idea>" is yskills' New project tap in HQ: start one brainstorm thread for it (step 1) with the id in its brief, once per id; that thread marks `requests/<id>` started with its link.

## Literal mode and cost

Read `CLAUDE.md` > Literal mode and cost: yskills' words are orders done as said (no "yes, but", no offers, no alternatives when they ask for one thing); shortest reply; no extra subagents, research, screenshots or re-reads; Sonnet unless the work is design or architecture; simple reading jobs go to Haiku subagents.

## Lessons

Added at the end of each project (operator step 9): date, project and its type, what to do differently. Newest last; merge duplicates.

- 2026-10-06 (duo-test): fanning out three threads at once without a visible result cost ~10 EUR and yskills' trust. Show something early, then spend.
- 2026-10-06 (duo-test): don't subscribe the coordinator to slice PRs; it re-read 46M tokens.
- 2026-10-06 (Claude Setup HQ, game page, 6 slices, PRs 29 to 36): a thread kept building after yskills' pause and another argued to keep the Kenney animals yskills had rejected; the brief now says both are final. The money feed went live reading rows nobody had stored (0 € for 28 €); verify the data first. Six slices in one file: pull main before every merge. One slice at a time kept cost inside the 30 to 50 USD estimate.
