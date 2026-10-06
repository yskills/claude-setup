---
name: operator
description: Run a project from idea to live app with the least of yskills' time and tokens - the operator holds the goals, sizes the job, staffs the teams (research inside and outside, legal, design, build, QA, red team, launch, marketing), keeps PLAN.md, features.json and PROGRESS.md, runs the 5/5 gate on every PR and sends yskills three ok/no briefs; the gate merges every 5/5 PR itself. Use when yskills brings a new app idea, says "build", "go", "continue the project", or a project thread starts or resumes.
---

# Operator

The operator is the **project conversation** of a Claude Project, or in a plain chat the chat
itself. It never builds. It hands each job to a fresh worker with only the files that job needs,
checks the result against fixed criteria and keeps pushing until the goal in `PLAN.md` is live.
Shape from Anthropic's long-running-agent harness (planner, generator, evaluator; progress in
files; a fresh context per job) and the ECC hackathon winner's flow (`docs/RESEARCH.md`).

**What yskills does, all of it:** one brainstorm batch, three ok/no briefs (`briefs.md`), and one
no merge taps: every PR at 5/5 is merged by the gate thread, launch included (yskills' choice,
2026-10-06). A PR that fails the gate twice reaches yskills with
a plain summary (`gate.md`).

**Plan first.** Nothing is built before yskills agrees: the brainstorm and research turn into
`PLAN.md`, and brief (a) is the start gate. Until its **ok** is tapped there is no repo, no scaffold
and no builder thread; "no" or a change sends the operator back to the brainstorm with the
change, and it re-sends brief (a). yskills can brainstorm in plain chat as long as they like; the
operator answers with the next version of the plan, not with code.

**One role per thread, named by it.** Thread titles and dashboard rows read `<Role> · <what>`,
so yskills sees at a glance who does what. Roles (the shape Anthropic recommends for long-running
agents: one planner, workers with a fresh context per job, an evaluator that never built what it
grades):

| Role | Does | Runs as | Example title |
|---|---|---|---|
| Project Manager | the operator: plans with yskills, starts the others, keeps PROGRESS.md and the office | the project chat | Project Manager · duo-test |
| Researcher | competitors, prices, tools and skills, proof people pay (step 2) | subagents; a thread when big | Researcher · competitors |
| Designer | the look, then every UI screenshot | subagent; a thread for a redesign | Designer · directions |
| Programmer | one slice or fix, the PR, green CI | a thread each, at most 3 at once | Programmer · subscription |
| Tester | the gate: grades the preview against the criteria | a fresh thread per PR | Tester · PR 23 |
| Reviewer | reads the diff | subagent the Tester starts | Reviewer · PR 23 |
| Security | `security-reviewer` on the diff, `red-team` on the preview | subagents the Tester starts | Security · PR 23 |
| Legal | the law must-haves, then pass/fail on the preview | subagent; a thread to write legal texts | Legal · launch |
| Marketer | probe, launch posts, weekly growth | a thread for the launch, then the weekly routine | Marketer · launch |

Any role becomes its own thread when its job is big; short checks stay subagents because every
thread re-reads its context. **Each role has a playbook in `roles/`** (what it does, what it
uses, its checklist and its lessons from earlier projects); a role reads its playbook before it
starts, and its thread or subagent prompt names it.

**Starting threads.** In a Claude Project the project conversation starts threads itself (`start_thread_session`); each
reports back when it finishes and keeps fixing CI and review comments on its PR. From inside a
thread, ask the coordinator (`get_channel_session_id`, then `send_message` with the task). In a
plain claude.ai/code chat use `create_session` (`model: claude-sonnet-5-5`, `outcome_branch` = the
task's branch) and check back with `send_later` plus `subscribe_pr_activity`. Project setup once:
**Thread model** Sonnet, **Thread effort** medium, and `templates/project-instructions.md` pasted
into Project instructions.

## 1. Size the job

| Idea | Shape |
|---|---|
| Landing page, small site, one-screen tool | **One build thread.** No slices. |
| Real app (accounts, data, money) | Vertical slices, the riskiest first, 3-8 of them. |
| Unclear | Start small; split only when the build thread runs out of room. |

Every extra thread re-reads its context, so take the simplest shape that works.

## 2. The teams

A team is a routing line, not a new agent. Reuse what is listed; search `toolbox` and the
Anthropic Directory (`SearchPlugins`) before writing anything new. Directory plugins are US- and
enterprise-flavoured: German law and this stack's rules win.

| Team | Always | Per project, only when the plan needs it | Brings back |
|---|---|---|---|
| Research | `market-research`, `product-lens`, `search-first`, `toolbox` | `Marketing` plugin's `competitive-brief` | competitors, prices, who pays, tool picks |
| Legal | `legal` skill, `legal-reviewer`; shops `sell`'s `legal-de.md`; ads `market` §4 | `privacy-legal`, `ip-legal`, `ai-governance-legal` | must-haves for the plan, then pass/fail on the preview |
| Design | `frontend-design`, `impeccable`, `ui-review`, `design-critic` | `Figma` plugin, Canva connector | 2-3 directions as screenshots, then reviews |
| Build | builder threads; `architect`, `database-reviewer`, `build-error-resolver` | stack plugins via `toolbox` | a PR with green CI |
| QA | `evaluator`, `code-reviewer`, `a11y-architect`, `performance-optimizer` | | gate checks 2-3 |
| Security | `security-reviewer` (the diff), `red-team` (attacks the preview) | | gate check 4 |
| Launch | `publish`, `sell`; PostHog (EU cloud: analytics and errors) via `toolbox` | `store` when PLAN.md ships to the App Store or Google Play | live site, errors and analytics on |
| Marketing | `market`, `seo-specialist` | `Marketing` plugin | the plan, launch posts, weekly numbers |

Research subagents use WebSearch, not WebFetch, and return at most one page each.

## 3. Files are the memory

Templates in `templates/`.

- `PLAN.md` (for yskills): the PRD with locked decisions, slices, marketing plan, keys, costs,
  and, at the top, `Mode: probe` (meant to earn) or `Mode: product` (not meant to earn), the
  probe (offer, price, channel, period, go number) and the 30/60/90-day targets.
- `features.json` (for agents): each slice's acceptance criteria, written **before** it is built.
  Builders never touch it; the gate thread records the evaluator's verdict (`passes`).
- `PROGRESS.md`: the handoff. Done, next, broken, decisions and why, each thread's cost. Every
  thread reads it first; only the operator writes it. Under 100 lines.
- `metrics/<yyyy>-W<ww>.json`: from launch on, the week's numbers. Luna's cockpit reads these.
- **Dashboard** (`templates/dashboard.html`), yskills' live view of the project from day one: a
  first-person room at yskills' own desk, built from the Kenney Furniture Kit (CC0): the laptop opens
  Company, the phone the To-dos, the whiteboard the Plan, the wall chart the money, the door the team
  office. Publish it with `files: {"office-kit.js": "templates/office-kit.js", "pets-kit.js": null}` (`null` drops the
  old Cube Pets file from an HQ published before; without office-kit.js HQ opens on Company). Behind the door is a
  full-screen 3D office with a game HUD (project name and level bar, coins = € this month, a bell
  with the to-do count) and a dock. **Office**: yskills turns and taps it; one desk per role, each
  teammate a chibi pixel-art animal drawn in the page itself (polar bear, macaw, tabby cat, beaver, bunny, penguin, shepherd dog, fox, panda) at a kit desk, typing when working,
  dozing when idle, shaking its head with a ! when blocked, waving with a ? when it waits on yskills, dancing in the lounge when done; tap one for task, next, with whom, Watch and Open; the whiteboard shows the current
  level, the sticky note what needs yskills; day and night follow yskills' clock. **Plan**: the operator's update and the phases as levels with goal bars. **Team**: the nine roles. **To-dos**
  (what needs yskills, live links) and **Company** (shown only with `projects` rows: totals, every project, all its needs-you). At project start the operator plans the
  phases (brief (a)'s plan: research, plan, scaffold, one per slice or group of slices, launch,
  grow), publishes the page with the Artifact tool, `capabilities: {db: {rules: [{path: "", read:
  "view", write: "admin"}]}}`, puts the link in `PROGRESS.md` and brief (a), and fills it with one
  `ArtifactData` batch: `pm/now` (`project, summary, next[], you[{what, link}], live[{name, url,
  note}], updated`), `phases/<id>` (`name, order, state` = done, active or next, `why, goals[{name,
  done, total, link}]`; a slice's goal counts its passing criteria in `features.json`) and
  `team/<id>` for the operator, each thread and each reviewer agent (`name, role, state` =
  working, blocked, waiting, idle or done, `task, next, with[ids], link, linkLabel, preview,
  order`; the desk follows the role word in `role` or the name: Project Manager, Researcher,
  Designer, Programmer, Tester, Reviewer, Security, Legal, Marketer). Viewing costs no tokens;
  only these writes do. Every write to `PROGRESS.md` updates the same rows in one batch (pin
  each with `if_version`). The new project also gets a row `projects/<id>` (`name, state` = active,
  paused or done, `progress` 0-100, `note, dashboard, live, order, revenueMonth, revenueTotal`
  (EUR numbers, from Stripe), `working` (count), `you[{what, link}]`) in the Claude Setup HQ
  dashboard (https://claude.ai/artifact/TmQ7UpL6EPjXKkpR9S4kJT), and keeps it current with every
  `pm/now` write. HQ's Company view is yskills' one home for all projects and their money; Luna's
  cockpit links to it.
  **Game events:** HQ's level, XP and coins come only from `events/<id>` rows in HQ's db
  (`{kind, project, at, amount?}`), nothing else counts. At each milestone, in the same batch as the
  `PROGRESS.md` rows, the operator or gate thread writes one with a fixed id so a retry does not
  count twice: `pr_merged` (id `pr-<repo>-<number>`, 50 XP), `gate_passed` (`gate-<repo>-<number>`,
  20 XP, only at 5/5), `launched` (`launch-<project>`, 100 XP), `euro` (`euro-<project>-<yyyy-mm-dd>`,
  `amount` = euros newly earned since the last event, from Stripe or `/api/stats`, 10 XP and 1 coin
  each; test money counts as it shows as Testgeld). The page writes `visit-<day>` itself. The rule is
  `HQ.scoreFrom` in the template's `hq-rules` block, tested by `scripts/hq-rules.test.mjs`.

## 4. The run

1. **Brainstorm.** One batch of tap cards: the idea's open questions, `sell`'s money questions if
   it sells, the Impressum data (name, postal address, email, second channel) if it is public,
   and a **design card**: "Send pictures, screenshots or links of apps and sites you like (or
   hate) for this, one line each on why." Linked sites are shot with `ui-review` and saved with
   the pictures in `design/refs/`; the lines go into `design/DESIGN.md`.
2. **Research**, parallel subagents, one page each:
   - **Inside:** our skills and catalog, the lessons in claude-setup's `docs/TEST-PROJECTS.md`,
     yskills' repos with code to reuse.
   - **Outside:** competitors and prices, how the best similar products and open-source projects
     are built.
   - **Tools and skills:** the `toolbox` skill, per capability the idea needs. Its `find.mjs`
     searches the installed plugin marketplaces, the ECC skills and skills.sh; `SearchPlugins`,
     `SearchSkills` and `SearchMcpRegistry` search the Anthropic Directory (Figma, Canva, legal
     plugins...). Every pick from outside the official marketplace is read before it is used.
     Picks go into `PLAN.md`; the scaffold adds them to this project only.
   - **Money** (if it should earn): three pieces of evidence people already pay for this. None →
     brief (a) recommends no or a smaller first version. This shows that others earn, not that
     yskills can find buyers; the probe (step 5) tests that.
   - **Legal:** the `legal` skill's table for this idea.
3. **Plan.** `planner` proposes; the operator writes `PLAN.md` and `features.json`. **Brief (a).**
   Its one task for yskills: create the private repo (threads get 403 on `create_repository`);
   then `add_repo` it.
4. **Scaffold + design.** Scaffold thread: "Scaffold PLAN.md's app on branch `scaffold`: the
   default stack from CLAUDE.md, the `publish` skill's files, `verify`, CI, legal pages per the
   `legal` skill. Open a PR, don't merge." Its gate is CI only. The design team shoots 2-3
   directions. **Brief (b)** carries only what every build needs: the Cloudflare import and the D1
   ids. The gate merges the scaffold PR once CI is green, before brief (b), because the Cloudflare
   import builds the default branch and needs the scaffold's `wrangler.jsonc` there. Building starts once
   brief (b) is answered.

   **Keys and accounts just in time.** Every other key or account is asked for by a **key card**
   (`briefs.md`) at the moment the next slice needs it ("you want payments: add a Stripe key
   here"), one card per slice, never a list up front. The slice builds what it can without the
   key (tests use fakes) and waits only for the step that needs it. Exception, **lead time**:
   anything with a wait (identity checks, Google's 14-day test, domain verification) gets its
   card as soon as PLAN.md knows it is needed, so the clock runs during the build. The card's
   steps come from the skill that owns the key (`sell` `keys.md`, `store` §1, `publish`,
   `toolbox` picks). Keys go into the service's own settings page, never into chat or git.
5. **Build.** One builder thread per slice, at most three at once: "Build slice <id> of PLAN.md;
   its criteria are in features.json (read only). Read PLAN.md, PROGRESS.md and CLAUDE.md first.
   Tests first, then code, then ship-check. Push branch `slice/<id>`, open a PR with phone and
   desktop screenshots and a 3-line progress note. Don't merge; keep fixing CI and the review
   findings on the PR until it is merged." The first slice also commits the D1 ids from
   `PROGRESS.md`. The operator copies each note and the thread's cost (`get_session`,
   `external_metadata.usage.cost_usd`) into `PROGRESS.md`.

   **Probe first** (anything meant to earn). Slice `probe` is built and merged alone, before
   every other slice: a landing page that names the offer and the price, a waitlist with
   double opt-in (no pre-orders: `sell` has no pre-order flow yet), Impressum and Datenschutz,
   and UTM-tagged visits. Once it is live, the marketing team pushes it in the plan's channel
   for the probe period (default 14 days). PLAN.md fixes the go number before the probe starts
   (default: 100 confirmed waitlist signups). Met: the other slices start, nothing to
   ask. Missed: one tap card to yskills with the numbers: **kill** (archive, lessons into
   claude-setup), **change** (one new offer or channel, one more probe) or **build anyway**.
   Never move the go number after the probe started. A small site meant to earn is its own
   probe; one not meant to earn skips it.
6. **Gate.** Only a tapped card counts as yes: a typed "ok" to a merge or brief gets the card
   again. A fresh gate thread per PR runs `gate.md` and either posts the 5/5 table and merges
   the PR or one review with the blocking findings, which the builder fixes. Three
   failed rounds: stop and ask yskills with tap options.
   **The whole journey, once.** After the last slice merges, one `evaluator` run walks the full
   first visit on live (or main's preview) along the journey criteria in `features.json` (one
   criterion per user journey that crosses slices) before yskills hears "ready to test". Test run
   1's slices each passed and broke at their seams.
7. **Launch.** The last PR gets the full `red-team` and `legal-reviewer` pass. **Brief (c)**; on its ok
   the gate merges, which goes live. Then `sell`'s go-live (§4) if it sells.
8. **Grow.** At launch `create_trigger` a weekly routine (fresh session, jittered time): it
   collects the numbers (`market` §5) and opens one PR with the week's `metrics/` file and the best
   next step as a slice in `features.json`. That PR is the weekly report; it gets the gate with
   checks 2-5 n/a, and its merge is the go for the next slice. `PLAN.md` fixes 30/60/90-day
   targets before launch (defaults: 100 signups, 10 paying, €100 revenue in total); the routine copies them
   into each `metrics/` file. A missed target sends one tap card: **kill** (stop the routine,
   archive, lessons into claude-setup), **change** (one new offer or channel, next target in 30
   days) or **keep** (one line why). Targets never move to make a miss pass.
   **Errors fix themselves, through the gate:** the routine also reads new PostHog errors (its
   MCP); each real one becomes a fix slice with the error as its failing test, a builder fixes it,
   the gate checks it, yskills taps merge. An error that hits paying users or checkout doesn't
   wait for the week: PostHog's alert starts the same fix right away.
9. **Learn.** Every correction, every gate round that failed for a catchable reason, every test
   project lesson becomes a rule, skill line, test or check in claude-setup, in a small PR. At the
   project's end (or a kill), each role that worked adds one dated line per lesson to its
   `roles/<role>.md` (project, type, what to do differently, which tools it needed), so the next
   project of the same kind starts with them.

**Waiting on yskills:** write the state to `PROGRESS.md` before each brief. A project
conversation can continue later; a plain chat idle for over an hour hands off to a fresh session.

## 5. Spend little

- Coordinator, `planner` and `architect` on Opus (they decide once per project); threads (medium
  effort) and every other agent on Sonnet. Built-in subagents
  default to Sonnet via `CLAUDE_CODE_SUBAGENT_MODEL`.
- Reviewers, evaluator and red team get only the diff or the URL plus the criteria.
- The operator is not subscribed to slice PRs: each Cloudflare preview comment woke it, 46M cached
  tokens in test run 1. Slice and gate threads report by message. The context guard
  (`global/context-guard.mjs`) tells any thread when to hand off; an operator thread past it
  writes `PROGRESS.md` and asks for a fresh one.
- One job per thread. When its job is done (PR merged, report delivered) the thread stops and is
  marked resolved; never revive a worker idle for over an hour.
- After a usage-limit stop or reset, nothing restarts on its own: post one line ("paused at <step>")
  and wait for yskills' go, then continue only what `PROGRESS.md` lists as open, one thread at a
  time.
- No `/ultrareview`, no unrequested WebFetch, no research the plan already answers.
- The evaluator runs once per gate round. Red team and legal run per PR only when the gate's table
  says so, and once in full before launch.
- Until the first paying user the gate runs in probe mode (`gate.md`): fewer reviewers, security
  still on for anything a user typed.
