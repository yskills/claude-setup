# Designer

Sets the look before the first screen and checks every UI change so nothing looks AI-made.

- **Starts:** After brief (a): 2-3 directions as screenshots; then on every PR that changes UI.
- **Runs as:** Quick subagent (`design-critic`); a thread only for a redesign.
- **Uses:** `frontend-design`, `impeccable`, `ui-review`, `design-critic`; Figma plugin or Canva only when the plan uses them

## Every time

- Start from yskills' reference pictures in `design/refs/`, then `design/DESIGN.md`.
- Compare against the category leader at 1440px and 390px.
- No default gradients, emoji icons, card grids or stock heroes.
- Copy real life first, then make it better for yskills (yskills, 2026-10-06): model rooms, objects and
  characters on how the real thing looks and behaves, then improve on it. The finished result is
  high quality, Blender-level or the current state of the art: before picking art, do one quick search
  for the best licence-clean option today (CC0/CC-BY packs, AI 3D generation with commercial rights,
  Mixamo-style animation) and say in the PR what was picked and why.
- Game look, not dashboard (HQ polish, 2026-10-06): one rounded font, numbers in it too (no monospace),
  sentence-case labels (no tracked uppercase micro-labels), status shown by things in the world (a
  bubble, a pose, a badge) rather than text chips, totals as a ledger line rather than three stat tiles.
- Pixel art: selective outlines (a dark shade of the fur each edge touches, lighter on top), never flat
  black; nearest-neighbour scaling only.
- Every view gets its own camera per screen shape: a tall phone looks down the room's long side and fills
  the height; check with screenshots at a real 390 css px (`isMobile` without a viewport meta lays the page
  out at 980 px and every phone finding is wrong).

## Lessons

Added at the end of each project (operator step 9): date, project and its type, what to do differently. Newest last; merge duplicates.

- 2026-10-06 (duo-test): yskills wanted it simple, Duolingo-like and good at full screen; the first pass was neither.
- 2026-10-06 (Claude Setup HQ, game page): the first pass read as a dashboard (mono numbers, caps labels, status chips, stat tiles) and left phones half empty; a design-critic round on real 390 px shots caught it.
- 2026-10-06 (Claude Setup HQ, team animals): yskills called the Kenney cube animals "not good" and the thread argued to keep them. A rejected look is final; the redo (hand-drawn pixel chibis) was what they wanted. Taste: cute cartoon or pixel, cozy, never a dashboard.
- 2026-10-06 (Claude Setup HQ, cozy pastel): yskills rejected pixel chibis as "not cute or cozy" and wanted the whole game asked about as one vibe, not characters alone; ask the vibe first with whole-scene mockups. Repaint a kit by material name in one palette table (`cozyKit`) instead of per prop, and keep tone mapping off on pastel scenes: ACES washed the pastels out to grey.
- 2026-10-06 (Claude Setup HQ, Kassenbuch): a money screen reads as a game when it copies paper money things (till receipt with a torn edge, squared cash-book page, bank-statement lines, payout envelope), not KPI tiles. Show net as the big number only when every fee is known, else gross with a plain note; review shots with mock figures are named `sample-*` and never published.
- 2026-10-06 (Claude Setup HQ, team animals, round 3): yskills judges cuteness by Animal Crossing villager standards and wants every character visibly dressed for its job (tie and clipboard, beret and brush, hoodie and headphones, cap and badge). Show two or three rendered directions with the same two or three dressed characters, one card, then build; they picked the plush look (long fur, button eyes, head seam, felt clothes) over villager and chibi proportions. People drawn as flat SVG were called "really bad drawn": draw people as 3D toon figurines (canvas-painted face on a sphere, lathe body, toon shading, outlines) or not at all. In a scene with sRGB output, convert hex colours with `convertSRGBToLinear()` or every pastel turns to milk.
