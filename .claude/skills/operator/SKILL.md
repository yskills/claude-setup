---
name: operator
description: "Run a project from idea to live app: sizes the job, staffs the roles, keeps PLAN/PROGRESS, runs the 5/5 gate. Use for a new app idea, \"build\", \"go\", \"continue the project\", or when a project thread starts."
---

# Operator

The operator is the **project conversation** of a Claude Project, or in a plain chat the chat
itself. It never builds. It hands each job to a fresh worker with only the files that job needs,
checks the result against fixed criteria and keeps pushing until the goal in `PLAN.md` is live.
Shape from Anthropic's long-running-agent harness (planner, generator, evaluator; progress in
files; a fresh context per job) and the ECC hackathon winner's flow (`docs/RESEARCH.md`).

**Auto-run (yskills, 2026-10-06 17:07: "just merge after test, skip everything, keep running
till everything is done").** No taps anywhere. Every card still shows the options with the
recommended one marked, but work continues on that option at once; a later tap or message
changes course. The gate merges every PR at 5/5 itself, launch and live money included, after a
real preview test and a fresh review. The coordinator posts results and real blockers only. The
only waits left are things nobody can undo that need yskills' own hands: live keys, a domain, a
Gewerbe (`briefs.md` key cards). A PR that fails the gate twice reaches yskills with a plain
summary (`gate.md`) and keeps going on the recommended way forward.

**Pauses and taste calls are final.** "Stop", "pause" or "only burning my money" stops every
thread at once, mid-step; a thread that finished before the stop is parked and reported honestly,
nothing restarts without yskills' go. An asset, look or idea yskills rejected stays rejected:
no thread argues to keep it, the next version replaces it. Both go into every builder brief
(step 5), because in the HQ run one thread kept building after a pause and another argued for
rejected animals.

**Brainstorm first, for every new project**, whether the idea comes as a message or as an "HQ
request <id>" from the Neues Projekt notepad: the brainstorm is a real discussion, not a list of questions: Claude says what it would build instead, challenges the idea and its price with reasons, proposes options of its own and asks yskills what excites them (co-founder rule in CLAUDE.md). It and the research turn into `PLAN.md`
with a recommended pick on every open question, posted as brief (a). Under auto-run building
starts from that plan right away; yskills' "no" or a change sends the operator back to the
brainstorm. No repo, scaffold or builder thread exists before the plan is posted.

**One role per thread, named by it.** Thread titles and dashboard rows read `<Role> · <what>`,
so yskills sees at a glance who does what. Roles (the shape Anthropic recommends for long-running
agents: one planner, workers with a fresh context per job, an evaluator that never built what it
grades):

| Role | Does | Runs as | Example title |
|---|---|---|---|
| Project Manager | the operator: plans with yskills, starts the others, keeps PROGRESS.md and its HQ rows | the project chat | Project Manager · duo-test |
| Researcher | competitors, prices, tools and skills, proof people pay (step 2) | subagents; a thread when big | Researcher · competitors |
| Designer | the look, then every UI screenshot | subagent; a thread for a redesign | Designer · directions |
| Programmer | one slice or fix, the PR, green CI | a thread each: one at a time, a second only when the slices share no file, never more than three | Programmer · subscription |
| Tester | the gate: grades the preview against the criteria | a fresh thread per PR | Tester · PR 23 |
| Reviewer | reads the diff | subagent the Tester starts | Reviewer · PR 23 |
| Security | `security-reviewer` on the diff, `red-team` on the preview | subagents the Tester starts | Security · PR 23 |
| Legal | the law must-haves, then pass/fail on the preview | subagent; a thread to write legal texts | Legal · launch |
| Marketer | probe, launch posts, weekly growth | a thread for the launch, then the weekly routine | Marketer · launch |

Any role becomes its own thread when its job is big; short checks stay subagents because every
thread re-reads its context. **Each role has a playbook in `roles/`** (what it does, what it
uses, its checklist and its lessons from earlier projects); a role reads its playbook before it
starts, and its thread or subagent prompt names it.

**Starting threads.** In a Claude Project the project conversation starts threads itself (`start_thread_session`, with
`model` by the routing rule in §5: `claude-fable-5-1` for architecture and plans, `claude-opus-5-5`
for build slices and anything with design or judgement, `claude-sonnet-5-5` for follow-ups, small
fixes, data wiring and tests); each
reports back when it finishes and keeps fixing CI and review comments on its PR. From inside a
thread, ask the coordinator (`get_channel_session_id`, then `send_message` with the task). In a
plain claude.ai/code chat use `create_session` (`model: claude-sonnet-5-5`, `outcome_branch` = the
task's branch) and check back with `send_later` plus `subscribe_pr_activity`. Project setup once:
**Thread model** Sonnet (the default; the coordinator passes the model per thread), **Thread
effort** medium, and `templates/project-instructions.md` pasted into Project instructions.

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
- **Dashboard: HQ is the only one.** yskills' live view of every project is HQ, "Company XY"
  (https://claude.ai/artifact/TmQ7UpL6EPjXKkpR9S4kJT; code in yskills/company-xy). **A project never
  publishes its own office page.** The Project Manager writes the project's rows into HQ's db with
  `ArtifactData`, in one batch with every `PROGRESS.md` write, exactly as `docs/hq-rows.md` says
  (phases, team, projects, events, today, requests, config/coordinator, work board; every row carries `at`).

## 4. The run

1. **Brainstorm.** Open with your own take: what you would build, what worries you, one or two ideas yskills did not ask for, then challenge their answers with reasons. One batch of tap cards: the idea's open questions, `sell`'s money questions if
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
   - **Demand probe** (if it should earn; the `product-lens` skill, Mode 1): one page,
     `docs/demand-probe.md`, before any repo or build slice: who pays (one specific person),
     where they are (the channel the probe will use), three signals checked with WebSearch (people
     already pay for this, people complain about the gap, a competitor's price), and a go or
     no-go. No-go → brief (a) recommends no or a smaller first version. This shows that others
     earn, not that yskills can find buyers; the probe slice (step 5) tests that.
   - **Legal:** the `legal` skill's table for this idea.
3. **Plan.** `planner` proposes; the operator writes `PLAN.md` and `features.json`. **Brief (a).**
   Its one task for yskills: create the private repo (threads get 403 on `create_repository`);
   then `add_repo` it.
   **Day one in HQ** (the same hour as brief (a), one `ArtifactData` batch, every row with `at`, as
   `docs/hq-rows.md` says): the `projects/<id>` row (`state` active, `revenueMode` test, traction
   fields 0, `firstEuroBy` = PLAN.md's go date), the `<id>-` phases and `team` rows, a `work/<session>`
   row for every thread started (phase, agents, `at`), and, if the project should earn, the **first
   euro list** as `you[]` with `firstSeen` = now: Gewerbe (link: the Gewerbeamt's online form for
   yskills' town, found with WebSearch, never guessed), tax registration (https://www.elster.de),
   Stripe live (https://dashboard.stripe.com/account/onboarding), Impressum data (the repo file that holds it,
   as a GitHub link) and mail for the order confirmation. Each `what` is one German sentence with a
   verb; steps are ticked off by deleting the entry. Nothing waits for them except the live key.
   **Cross-project reach.** A project chat starts its own threads (`start_thread_session`) and
   messages another project's chat by session id (`send_message`, id from that project's
   `config/coordinator` row). **In its first minute** the project chat checks it has
   `create_session` and `send_message` (a ToolSearch each) and writes the result into its own
   `config/coordinator` row (`{session, at, tools: {create_session, send_message}}`); a missing
   tool is one line to yskills and the threads fall back to the coordinator relay (§ Starting threads).
4. **Scaffold + design.** Scaffold thread: "Scaffold PLAN.md's app on branch `scaffold` with
   the `scaffold` skill (its file list, in order). Open a PR, don't merge." Its gate is CI only. The design team shoots 2-3
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
5. **Build.** One builder thread per slice: one at a time, the next in a fresh
   thread once the previous one is merged; a second only when the slices share no file; never more than three: "Build
   slice <id> of PLAN.md;
   its criteria are in features.json (read only). Read PLAN.md, PROGRESS.md and CLAUDE.md first. Do not read: node_modules, build output, lockfiles, generated files, screenshots, other slices' code, HANDOFF files of old threads; `grep` first, read only the part you need.
   Tests first, then code, then ship-check. Push branch `slice/<id>`, open a PR with phone and
   desktop screenshots and a 3-line progress note. Don't merge; keep fixing CI and the review
   findings on the PR until it is merged. Pull main into the branch right before the gate merges
   (other slices may edit the same file). yskills' pauses and taste calls are final: a 'stop'
   stops you mid-step, a rejected asset or look is replaced, not defended. Keep HQ's
   `work/<your session>` row current: one write at every phase and agent start and end
   (`docs/hq-rows.md`, Work board)." The first
   slice also commits the D1 ids from
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
6. **Gate.** A fresh gate thread per PR runs `gate.md` and either posts the 5/5 table and merges
   the PR (after pulling main into the branch when another PR merged since) or one review with
   the blocking findings, which the builder fixes. Two failed rounds: one message to yskills
   with tap options; under auto-run the recommended option is taken at once.
   **The whole journey, once.** After the last slice merges, one `evaluator` run walks the full
   first visit on live (or main's preview) along the journey criteria in `features.json` (one
   criterion per user journey that crosses slices) before yskills hears "ready to test". Test run
   1's slices each passed and broke at their seams.
7. **Launch.** The last PR gets the full `red-team` and `legal-reviewer` pass. **Brief (c)** is
   posted, and the gate merges at 5/5, which goes live (auto-run: launch included); live keys
   are the one thing on it that waits for yskills' hands. Then `sell`'s go-live (§4) if it sells.
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
   the gate checks and merges it. An error that hits paying users or checkout doesn't
   wait for the week: PostHog's alert starts the same fix right away.
9. **Learn.** Every correction, every gate round that failed for a catchable reason, every test
   project lesson becomes a rule, skill line, test or check in claude-setup, in a small PR. At the
   project's end (or a kill), each role that worked adds one dated line per lesson to its
   `roles/<role>.md` (project, type, what to do differently, which tools it needed), so the next
   project of the same kind starts with them.

**Waiting on yskills:** write the state to `PROGRESS.md` before each brief. A project
conversation can continue later; a plain chat idle for over an hour hands off to a fresh session.

## 5. Spend little

- **Model routing** (yskills, 2026-10-06; the table is in claude-setup `docs/WORKFLOW.md`,
  Models): **Fable** for architecture and plans (the `architect` agent, an Architect thread, the
  coordinator when it plans a project); **Opus** for build slices and anything with design or
  judgement (`planner`, Programmer slice threads, Designer threads, `design-critic`,
  `build-error-resolver`, `refactor-cleaner`); **Sonnet** for follow-ups, small fixes, data
  wiring, tests and reviews (gate threads, reviewers, `evaluator`, `red-team`, research
  subagents). Thread effort medium. Built-in subagents default to Sonnet via
  `CLAUDE_CODE_SUBAGENT_MODEL`. When in doubt: does the thread decide something that is hard to
  undo or that yskills will look at? Opus. Does it fill in what a plan already decided? Sonnet.
- Hand off or finish at 150k context (two long threads were 77% of usage on 2026-10-04); one brief = one slice that ends under it. A template over 2000 lines is split before the next change.
- Where 2026-10-07 burned tokens, and the rule that stops each: hand-offs at 270k (write the
  hand-off at the guard's first warning); `dashboard.html` read whole again and again (grep the
  part, read it once); the same answer in two threads (a thread checks the timeline before
  answering and a hand-off thread never repeats); research with many searches (one WebSearch per
  open fact); extra screenshots and subagents (only what the ask needs; simple reading jobs go to Haiku subagents).
- Literal mode and the cost rules go into every brief (`briefs.md`, last block).
- Remote Control (2026-10-07): yskills allows Claude Code on their PC. Anything that needs the PC (installs, local files and clones, Roblox Studio and its MCP server, screenshots of local apps, hardware reads, git with their logins) is done by a Remote Control session started on the user's message, never written out as steps for yskills. What stays with yskills: their web accounts (Cloudflare, Roblox Creator Hub, GitHub app access) and money. The PC session never reads, prints or sends keys, tokens or passwords. Briefs: PC work (a Roblox Studio run, an install, a local clone, a hardware read) goes to a Remote Control session, never to a hands list for yskills.
- Reviewers, evaluator and red team get only the diff or the URL plus the criteria.
- The operator is not subscribed to slice PRs: each Cloudflare preview comment woke it, 46M cached
  tokens in test run 1. Slice and gate threads report by message. The context guard
  (`global/context-guard.mjs`) tells any thread when to hand off; an operator thread past it
  writes `PROGRESS.md` and asks for a fresh one.
- One job per thread. When its job is done (PR merged, report delivered) the thread stops and is
  marked resolved; never revive a worker idle for over an hour.
- After a usage-limit stop a running thread waits and resumes by itself when the window resets;
  only Stop on the thread or Pause on the project holds it. The coordinator starts no new thread
  after a limit until yskills says go. To hold everything, yskills pauses the project. After
  yskills' "stop", nothing restarts: post one line ("paused at <step>") and wait for the go, then
  continue only what `PROGRESS.md` lists as open, one thread at a time.
- A thread stops watching its PR as soon as it is merged, and the coordinator never subscribes
  to PRs (46M cached tokens in test run 1). Fanning out several threads before anything is visible
  cost about 10 EUR and yskills' trust in test run 1; show something early, then spend.
- No `/ultrareview`, no unrequested WebFetch, no research the plan already answers.
- The evaluator runs once per gate round. Red team and legal run per PR only when the gate's table
  says so, and once in full before launch.
- Until the first paying user the gate runs in probe mode (`gate.md`): fewer reviewers, security
  still on for anything a user typed.
