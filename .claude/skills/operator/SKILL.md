---
name: operator
description: Run a project from idea to live app with the least of yskills' time and tokens - the operator holds the goals, sizes the job, staffs the teams (research inside and outside, legal, design, build, QA, red team, launch, marketing), keeps PLAN.md, features.json and PROGRESS.md, runs the 5/5 gate on every PR and sends yskills three ok/no briefs plus one merge tap per PR. Use when yskills brings a new app idea, says "build", "go", "continue the project", or a project thread starts or resumes.
---

# Operator

The operator is the **project conversation** of a Claude Project, or in a plain chat the chat
itself. It never builds. It hands each job to a fresh worker with only the files that job needs,
checks the result against fixed criteria and keeps pushing until the goal in `PLAN.md` is live.
Shape from Anthropic's long-running-agent harness (planner, generator, evaluator; progress in
files; a fresh context per job) and the ECC hackathon winner's flow (`docs/RESEARCH.md`).

**What yskills does, all of it:** one brainstorm batch, three ok/no briefs (`briefs.md`), and one
**Merge it** tap per PR once the gate posts 5/5. A PR that fails the gate twice, or an important
one (auth, payments, migrations, secrets), reaches yskills with a plain summary first
(`gate.md`). Claude's auto mode blocks a thread from merging a PR no human approved (tested
2026-10-05), so the tap is the approval.

**Starting threads.** In a Claude Project the project conversation starts threads itself; each
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
| Launch | `publish`, `sell`; Sentry and PostHog via `toolbox` | `store` when PLAN.md ships to the App Store or Google Play | live site, errors and analytics on |
| Marketing | `market`, `seo-specialist` | `Marketing` plugin | the plan, launch posts, weekly numbers |

Research subagents use WebSearch, not WebFetch, and return at most one page each.

## 3. Files are the memory

Templates in `templates/`.

- `PLAN.md` (for yskills): the PRD with locked decisions, slices, marketing plan, keys, costs,
  and the probe: offer, price, channel, period, go number.
- `features.json` (for agents): each slice's acceptance criteria, written **before** it is built.
  Builders never touch it; the gate thread records the evaluator's verdict (`passes`).
- `PROGRESS.md`: the handoff. Done, next, broken, decisions and why, each thread's cost. Every
  thread reads it first; only the operator writes it. Under 100 lines.
- `metrics/<yyyy>-W<ww>.json`: from launch on, the week's numbers. Luna's cockpit reads these.

## 4. The run

1. **Brainstorm.** One batch of tap cards: the idea's open questions, `sell`'s money questions if
   it sells, the Impressum data (name, postal address, email, second channel) if it is public.
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
   directions. **Brief (b)** carries the one-time Cloudflare setup and test keys. Building starts
   once the scaffold PR is merged and brief (b) is answered.
5. **Build.** One builder thread per slice, at most three at once: "Build slice <id> of PLAN.md;
   its criteria are in features.json (read only). Read PLAN.md, PROGRESS.md and CLAUDE.md first.
   Tests first, then code, then ship-check. Push branch `slice/<id>`, open a PR with phone and
   desktop screenshots and a 3-line progress note. Don't merge; keep fixing CI and the review
   findings on the PR until it is merged." The first slice also commits the D1 ids from
   `PROGRESS.md`. The operator copies each note and the thread's cost (`get_session`,
   `external_metadata.usage.cost_usd`) into `PROGRESS.md`.

   **Probe first** (anything meant to earn). Slice `probe` is built and merged alone, before
   every other slice: a landing page that names the offer and the price, a waitlist (or a
   refundable Stripe pre-order via `sell`, if PLAN.md picked one), Impressum and Datenschutz,
   and UTM-tagged visits. Once it is live, the marketing team pushes it in the plan's channel
   for the probe period (default 14 days). PLAN.md fixes the go number before the probe starts
   (default: 100 waitlist signups or 10 pre-orders). Met: the other slices start, nothing to
   ask. Missed: one tap card to yskills with the numbers: **kill** (archive, lessons into
   claude-setup), **change** (one new offer or channel, one more probe) or **build anyway**.
   Never move the go number after the probe started. A small site meant to earn is its own
   probe; one not meant to earn skips it.
6. **Gate.** A fresh gate thread per PR runs `gate.md` and either posts the 5/5 table (yskills
   taps **Merge it**) or one review with the blocking findings, which the builder fixes. Three
   failed rounds: stop and ask yskills with tap options.
7. **Launch.** The last PR gets the full `red-team` and `legal-reviewer` pass. **Brief (c)**; its
   ok is the merge tap, which goes live. Then `sell`'s go-live (§4) if it sells.
8. **Grow.** At launch `create_trigger` a weekly routine (fresh session, jittered time): it
   collects the numbers (`market` §5) and opens one PR with the week's `metrics/` file and the best
   next step as a slice in `features.json`. That PR is the weekly report; it gets the gate with
   checks 2-5 n/a, and yskills' merge tap is the go for the next slice. `PLAN.md` fixes 30/60/90-day
   targets before launch (defaults: 100 signups, 10 paying, €100 a month); the routine copies them
   into each `metrics/` file. A missed target sends one tap card: **kill** (stop the routine,
   archive, lessons into claude-setup), **change** (one new offer or channel, next target in 30
   days) or **keep** (one line why). Targets never move to make a miss pass.
9. **Learn.** Every correction, every gate round that failed for a catchable reason, every test
   project lesson becomes a rule, skill line, test or check in claude-setup, in a small PR.

**Waiting on yskills:** write the state to `PROGRESS.md` before each brief. A project
conversation can continue later; a plain chat idle for over an hour hands off to a fresh session.

## 5. Spend little

- Coordinator on Opus; threads (medium effort) and every agent on Sonnet. Built-in subagents
  default to Sonnet via `CLAUDE_CODE_SUBAGENT_MODEL`.
- Reviewers, evaluator and red team get only the diff or the URL plus the criteria.
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
