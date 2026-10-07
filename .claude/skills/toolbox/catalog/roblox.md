# Roblox: build, run, see

Checked 2026-10-07. Research record: `/mnt/project-files/game-dev/roblox-loop.md`.

Claude checks a Roblox game in three layers. Only the last one gives pictures, and it needs
yskills' PC with Studio open: no Roblox API renders a place in the cloud.

| Layer | Where | What Claude sees | Setup |
|---|---|---|---|
| **Lune** tests and built-place checks | cloud threads, CI | pure logic, what the `.rbxl` holds | `rokit`, `lune run tests/run.luau` |
| **Open Cloud Luau Execution** | cloud, CI | a script run inside a real server on a place version: return values and `print` logs (5 min max, 10 at once per place); no player, no rendering | key scope `universe.place.luau-execution-session:write` and `:read`; POST `/cloud/v2/universes/<u>/places/<p>/versions/<v>/luau-execution-session-tasks`, poll the task, read `/logs`; example repo Roblox/place-ci-cd-demo |
| **Roblox Studio MCP server** (official, built into Studio) | Claude Code on yskills' PC | `screen_capture` from any camera, `start_stop_play`, `get_console_output`, `execute_luau`, `character_navigation`, keyboard and mouse input, game tree, script edits, `playtest` subagent | Studio > Assistant > `…` > Manage MCP Servers > Enable Studio as MCP server > Quick connect > Claude Code ([docs](https://create.roblox.com/docs/studio/mcp)) |

## The loop

1. Cloud thread: write Luau, Lune tests first, CI publishes to the test place (PR) or the live
   place (main).
2. Design and feel: a Remote Control session on the PC (CLAUDE.md, Remote Control) with
   Studio open on the test place: play, walk, use the shop, `screen_capture` at phone-like and
   wide views, read the output log, fix, play again.
3. Taste calls go to yskills with those screenshots; "done" carries a screenshot from step 2.

Skip community Studio MCPs (they need a Creator Store plugin and HTTP requests on; the official
server does more). Computer use from a cloud thread is slower and costlier than `screen_capture`.
