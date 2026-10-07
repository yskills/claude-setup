# The 5/5 gate

A fresh gate thread runs this on one PR (in a plain chat: the operator, with fresh subagents).
Five pass/fail checks, never a star score: judges grade their own team's work too kindly, so each
check is a hard yes or no from someone who didn't write the code.

| # | Check | Who | Gets only | Applies |
|---|---|---|---|---|
| 1 | CI and `Workers Builds: <worker>` green on the head SHA | check runs | | always |
| 2 | Every acceptance criterion passes on the preview | `evaluator` | the head SHA's preview URL (from the Workers Builds check or Cloudflare's PR comment), the slice's criteria | always |
| 3 | Nothing blocking | a **fresh** `code-reviewer` (the builder's last ship-check pass counts if its report names this head SHA) | the diff, the slice goal in 2 sentences | always |
| 4 | Nothing blocking, no CRITICAL/HIGH | `security-reviewer` on the diff; `red-team` on the preview | the diff; the preview URL and routes | auth, payments, user input or secrets touched; red team always on the last PR before launch |
| 5 | Nothing blocking | `design-critic`; `legal-reviewer` when pages, forms, tracking, embeds or AI output change | phone and desktop screenshots, the preview URL | UI changed; `legal-reviewer` always on the last PR before launch |

A check that doesn't apply passes; say "n/a" in the table.

## Mode: probe or product

`PLAN.md` says `Mode: probe` until the first paying user; the operator (or the weekly routine,
whichever sees that payment first) switches it to `Mode: product`. Until someone pays, gate rounds go to finding out whether anyone will:

| # | Probe mode |
|---|---|
| 1, 2 | as above |
| 3 | the builder's ship-check report, when it names this head SHA; no fresh reviewer |
| 4 | `security-reviewer` whenever the PR touches logins, payments, secrets or stores anything a user typed (emails, notes, journal entries); `red-team` only on the last PR before launch |
| 5 | `legal-reviewer` when public pages, forms, tracking or embeds change; `design-critic` only on the probe slice and the last PR before launch |

No `Mode:` line in `PLAN.md` means product mode. Product mode is the full table above. The headline names the mode: `Gate 5/5 (probe, round <n>)`.

**Preview test:** check 2 opens the live preview and the evaluator attaches a screenshot of it;
nothing is called done without a screenshot of the live page (phone 390 px and desktop 1440 px).
Roblox projects have no preview URL: play the test place through the Studio MCP server and
`screen_capture` it (`toolbox/catalog/roblox.md`, The loop).

**No preview URL is not a pass.** Check 2 runs on the branch's Worker Preview. A PR without one
(the Deploy or Preview command isn't set up, `publish` §A new project) is not 5/5: the gate stops
and the operator fixes the deploy first. A flow that depends on mail (a confirm link, a mailed
cancel) passes check 4 only where mail is configured in that environment, else the flow is off.

**No preview yet or any more:** the scaffold PR (before Workers Builds is connected) needs CI
only. Once branch builds are off (live payment keys, `publish` skill), check 1 is CI only and the
gate runs the PR's build locally (`wrangler dev`) for checks 2, 4 and 5.

## Merge policy (the one source)

Under auto-run the gate thread merges (squash) every PR at 5/5: launch, live money and
claude-setup PRs included (yskills, "merge everything", 2026-10-06). That merge is the approved
production deploy. If Claude Code's safety check or auto mode refuses a merge, the gate asks
yskills for the tap on the card and tries no other way. Other files say this in one line and
point here.

Policy files (`CLAUDE.md`, this file, `hq-refresh.md`, `global/`, `cloud/`, `install.mjs`) are the
exception: the cloud safety check blocks commits to them, so a thread puts the diff in
`/mnt/project-files/claude-setup/patches/<letter>/` and yskills applies it on the PC.

How to undo a merge, by kind of change (write the line into the PR's "undo" line):

| Change | Undo |
|---|---|
| Code, Worker deploy | Cloudflare dashboard → Worker → Deployments → roll back to the previous version, or revert the PR and merge it |
| D1 migration | D1 Time Travel restores the database to a minute before the deploy (`wrangler d1 time-travel restore <db> --timestamp=<ISO>`); migrations stay additive so a code rollback works without it |
| Row in the HQ db | `ArtifactData` set the row back to its previous value (the PR comment quotes it) |
| Key or secret | rotate it in the provider's dashboard, then set the new value on the Worker |
| Docs, skills, templates | revert the PR |

## Rounds

- **5/5:** commit the evaluator's verdict into `features.json` (`passes`) on the PR branch, wait
  for check 1 on that commit (a commit touching only `features.json` doesn't restart checks 2-5),
  then post the table below as a PR comment. Then:
  - **Pull main first.** If main moved since the branch was cut, merge main into the branch and
    wait for CI again before merging: in the HQ run six slices edited one `dashboard.html`, and a
    merge without the pull would have dropped the previous slice's work.
  - **One batch at the merge:** write the events (`pr-<repo>-<number>` `pr_merged`, `gate-<repo>-<number>` `gate_passed`) together with `projects/<id>`, the `team/*` rows and `phases`, every doc stamped `at`, so XP and rows never disagree.
  - **Every PR**, launch and live money included: the gate thread merges it (squash). If
    Claude's auto mode refuses, it doesn't try another way: it asks yskills for the tap.
  - **claude-setup PRs:** the gate thread merges them too; only when Claude Code's safety check
    blocks the merge does yskills tap **Merge it** on the card or GitHub's Merge button.
- **Last PR before launch:** the operator posts brief (c) with the table; the gate merges at 5/5
  (auto-run, launch included). Live keys yskills has not set yet stay a key card; the site goes
  live without them.
- **Less:** post the blocking findings as one PR review and stop. The builder fixes them; the next
  round re-runs the failed checks with fresh agents on the new head.
- **2 failed rounds:** send one message to yskills: what the PR does, what is wrong in plain words (from
  the last reports), and two or three ways forward as tap options; under auto-run the recommended
  option is taken at once and the card only lets yskills change course.

**Important or hard PRs** (auth, payments, database migrations, secrets, anything that can lose
data or money, the last PR before launch, any PR that needed a second gate round) merge at 5/5
like every other under auto-run, but their table comes with three plain lines for yskills to read
afterwards: what changed, what could break, how to undo it.

```
Gate 5/5 (round <n>), merging | launch: brief (c) below   [risky: auth | payments | migration | secrets]
1 CI + Workers Builds .. pass  <run links>
2 Evaluator ............ pass  <n>/<n> criteria
3 Code review .......... pass
4 Security / red team .. pass | n/a
5 Design / legal ....... pass | n/a
```

A gate thread reads the PR diff, PLAN.md and features.json only. Do not read: node_modules, build output, lockfiles, generated files, screenshots, other slices' code, HANDOFF files of old threads; `grep` first, read only the part you need.
