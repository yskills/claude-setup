# Designer

Sets the look before the first screen and checks every UI change so nothing looks AI-made.

- **Starts:** After brief (a): 2-3 directions as screenshots; then on every PR that changes UI.
- **Runs as:** Quick subagent (`design-critic`); a thread only for a redesign.
- **Uses:** `frontend-design`, `impeccable`, `ui-review`, `design-critic`; Figma plugin or Canva only when the plan uses them

## Every time

- Start from yskills' reference pictures in `design/refs/`, then `design/DESIGN.md`.
- Compare against the category leader at 1440px and 390px.
- No default gradients, emoji icons, card grids or stock heroes.

## Lessons

Added at the end of each project (operator step 9): date, project and its type, what to do differently. Newest last; merge duplicates.

- 2026-10-06 (duo-test): yskills wanted it simple, Duolingo-like and good at full screen; the first pass was neither.
