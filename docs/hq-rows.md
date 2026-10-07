# HQ rows: what every Project Manager writes

HQ is Company XY: https://claude.ai/artifact/TmQ7UpL6EPjXKkpR9S4kJT (code, tests, publish recipe
and refresher in the private repo yskills/company-xy). This file is the row contract each
project's Project Manager writes into HQ's db with `ArtifactData`. Every write carries `at`.

**HQ is the only dashboard:** a first-person desk, a 3D office with one chibi animal per role, Plan, Team,
To-dos and Company with every project's money). **A project never publishes its own office page.**
The Project Manager writes the project's rows into HQ's db with `ArtifactData` (viewing costs no
tokens, only these writes do) and never republishes the page: that happens only from company-xy (publish recipe in its
README, pin writes with `if_version`). At project start it plans the phases (brief (a)'s plan:
research, plan, scaffold, one per slice or group of slices, launch, grow) and writes one batch,
every `phases` and `team` id prefixed `<project>-` so projects never overwrite each other (`pm/now`
is the Claude Setup project's own summary; any other project keeps its summary, live link and
needs-you list in its `projects/<id>` row): `phases/<id>` (`name, order, state` = done, active or next, `why, goals[{name,
done, total, link}]`; a slice's goal counts its passing criteria in `features.json`) and
`team/<id>` for the operator, each thread and each reviewer agent (`name, role, state` =
working, blocked, waiting, idle or done, `task, next, with[ids], link, linkLabel, preview,
order`; the desk follows the role word in `role` or the name: Project Manager, Researcher,
Designer, Programmer, Tester, Reviewer, Security, Legal, Marketer). Every write to `PROGRESS.md` updates the same rows in one batch (pin
each with `if_version`). The new project also gets a row `projects/<id>` (`name, state` = active,
paused or done, `progress` 0-100, `note, live, order, revenueMonth, revenueTotal`
(EUR numbers, from the project's public stats route, e.g. duo-test's `/api/stats` in cents divided by
100; Artifact pages cannot fetch other sites, so the manager copies them at every milestone),
`revenueMode` (`test` while Stripe is in test mode, HQ then says "Testgeld"), `revenueAt` (ISO time of
that read), `working` (count), `at` (ISO time, **every row any thread writes carries `at`; HQ greys a row after 6 hours and counts its `working` as 0**), `visitors7d, signups, paying, firstEuroBy` (traction: what real people did and the date of the first real euro; HQ shows these instead of a build percent), `you[{what, link, firstSeen}]` (a to-do lives only in its project row; `pm/now.you` is only Claude Setup's own and the fallback; the same text or link in two lists shows once; keep `firstSeen` when rewriting) (every `what` here and in `pm/now` is one plain German sentence with a verb, because HQ shows it as-is in Heute für dich); a project's `dashboard` link, if the project has no
Artifact of its own, is its project chat thread), and keeps it current with every `pm/now` write. **A revenue source is verified against real data before any UI reads it:** call
the route or query the table and check that the known payments show up (duo-test's `/api/stats`
went live summing rows that were never stored and showed 0 € for 28 € of payments); a source
that returns nothing yet is wired only together with its backfill. Luna's cockpit links to HQ.
**Game events:** HQ's level, XP and coins come only from `events/<id>` rows in HQ's db
(`{kind, project, at, amount?}`), nothing else counts. At each milestone, in the same batch as the
`PROGRESS.md` rows, the operator or gate thread writes one with a fixed id so a retry does not
count twice: `pr_merged` (id `pr-<repo>-<number>`, 50 XP), `gate_passed` (`gate-<repo>-<number>`,
20 XP, only at 5/5), `launched` (`launch-<project>`, 100 XP), `euro` (`euro-<project>-<yyyy-mm-dd>`,
`amount` = euros newly earned since the last event, from Stripe or `/api/stats`, 10 XP and 1 coin
each, **and `mode: 'live'`; without it the amount is Testgeld and scores nothing**; PRs of claude-setup and hq score nothing, visits score nothing; the finance row wins over the `revenue*` fields). The page writes `visit-<day>` itself. The rule is
`HQ.scoreFrom` in company-xy's `hq-rules.js`, tested there by `tests/hq-rules.test.mjs`.
**Heute für dich:** the desk phone's page reads `today/now` (`{refreshedAt, items[{what, kind you|info,
source, at, link}], sources[{name, ok, note}]}`), filled from live sources by the refresher thread
(`hq-refresh.md` in company-xy): HQ asks it on open when the list is over 150 minutes old; no routine of its own.
Rule: `HQ.todayFor`, `HQ.refreshDue`.
**New project tap:** HQ's yellow notepad saves `requests/<id>` (`{text, at, status}`: `new` saved,
`sent` the page reached the coordinator, `relayed` a thread passed it on, `started` the brainstorm
thread runs, with `link`) and messages the coordinator with the Claude Code Remote connector's
`send_message` ("HQ request <id>: <idea> ..."). The coordinator has no db tools, so threads keep
the address and the queue: **every project thread, at start and when it finishes,** calls
`get_channel_session_id` and writes HQ's `config/coordinator` (`{session, at}`,
pinned with `if_version`); **at start** it also lists `requests` and, for each row that is `new`
or `sent` with no `link`, sends the same "HQ request <id>: <text>" line to the coordinator with
`send_message` and sets the row to `relayed`. The coordinator answers each such message with one
`Researcher · <idea>` brainstorm thread whose brief names the request id, unless a thread for that
id already runs (a resend repeats it); that thread sets the row to `started` with its thread link.

**Work board:** `work/<session>` (`{thread, title, link, role, at, phases: [{title, state, start,
end, agents: [{label, model, state, start, end}]}]}`; states `running`, `done`, `failed`, `waiting`),
written at every phase start and end and at every agent start and finish, never per tool call
(one write per event, pinned with `if_version`, `at` = now). HQ shows the tree with durations, puts
the role's animal at its desk while a phase runs and greys rows older than 2 hours.
How: the doc id is the thread's own session id (`get_session` with no id); `thread` is the thread title
(`<Role> · <what>`), `title` the task in short German, `role` the role word. Write the planned phases
up front as `waiting`, then flip each to `running` (with `start`) and `done` or `failed` (with `end`);
a subagent the phase starts goes into its `agents` with its `label` (agent type) and `model`. Times
are ISO from the real clock (`date -u +%FT%TZ`), never guessed. A finished thread leaves its row (it
greys after 2 hours). Rule: `HQ.workTree` and `HQ.busyRoles` in company-xy's `hq-rules.js`.
