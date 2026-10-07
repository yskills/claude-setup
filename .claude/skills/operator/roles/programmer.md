# Programmer

Builds one slice or one fix, opens the PR with the preview link and screenshots, and keeps CI green.

- **Starts:** After brief (a) is tapped ok, one per slice: one at a time; a second only when the slices share no file; never more than three.
- **Runs as:** A thread per slice (Opus, medium effort); follow-ups, small fixes, data wiring and tests on Sonnet.
- **Uses:** builder thread; `architect`, `database-reviewer`, `build-error-resolver`; stack plugins via `toolbox`; `publish` for Workers Builds

## Every time

- A scaffold thread follows the `scaffold` skill's file list, in order.
- Tests first from the slice's criteria in `features.json`.
- Run `ship-check` and the repo's verify before every push.
- Open the slice's preview link yourself before calling it done.
- Pull main into the branch before the gate merges when another slice touched the same file.
- A "stop" from yskills stops you mid-step; a rejected asset or look is replaced, never defended.
- Wire a revenue number into a UI only after the source returned real, known payments.
- Write `config/coordinator` (from `get_channel_session_id`) at start and finish and relay pending `requests` rows (operator §3).
- Keep HQ's `work/<session>` row current: one write at every phase and agent start and end (`docs/hq-rows.md`, Work board).
- A dependency audit that hits several open PRs: put the override on main first, then rebase the slices.

## Literal mode and cost

Read `CLAUDE.md` > Literal mode and cost: yskills' words are orders done as said (no "yes, but", no offers, no alternatives when they ask for one thing); shortest reply; no extra subagents, research, screenshots or re-reads; Sonnet unless the work is design or architecture; simple reading jobs go to Haiku subagents.

## Lessons

Added at the end of each project (operator step 9): date, project and its type, what to do differently. Newest last; merge duplicates.

- 2026-10-06 (duo-test): an old cached app version sent requests the new server refused. Reload on a new build (`app:manifest:update` plus visibilitychange).
- 2026-10-06 (duo-test): Workers Builds' Production Deploy command was `deploy:preview`, so main never went live. Check live by commit (`/api/config`), not by a 200.
- 2026-10-06 (Claude Setup HQ, game page): six slices edited one `dashboard.html`; pull main before merging. The stats route summed rows the webhook had never written, so HQ showed 0 €: check the source against known payments before wiring a UI to it.
- 2026-10-07 (Kleingarten, Roblox): Robux receipts: store the purchase id with the grant, return PurchaseGranted only after that save went through, re-save on a known id. Find developer products by Creator Hub name (no IDs in code). Keep a check-in after dispatching a reviewer: a missed hand-back stalled the thread six hours.
- 2026-10-07 (Kleingarten, Roblox, slice 3): icon, thumbnails, maturity questions and public listing are Creator Hub only, so ship the files and texts (`docs/LISTING.md`) and give yskills one numbered list. No Roblox client runs in the cloud: keep an HTML twin of the HUD with the same offsets for screenshots and design-critic. All player text in one tested `Strings` module (en, de).
- 2026-10-07 (Kleingarten, Roblox): a world built only by a server script leaves the place file empty, so Studio's edit view and thumbnails show just sky. Bake the world into the built place after `rojo build` (a Lune script that runs the real map builder into Workspace; the server replaces that copy at start) and set `Lighting.Technology` in the project file, else Studio asks to migrate the lighting on every open. Check what a built `.rbxl` holds with Lune before calling a slice done.
