---
name: operator
description: Run a project from idea to live app with the least of yskills' time and tokens - the operator holds the goals, sizes the job, staffs the teams (research inside and outside, legal, design, build, QA, red team, launch, marketing), keeps PLAN.md, features.json and PROGRESS.md, runs the 5/5 merge gate and sends yskills exactly three ok/no briefs. Use when yskills brings a new app idea, says "build", "go", "continue the project", or a project thread starts or resumes.
---

# Operator

The operator is the **project conversation** of a Claude Project (the coordinator), or in a plain
chat the chat itself. It never builds. It decides what is needed,
hands each job to a fresh worker with only the files that job needs, checks the result against
fixed criteria and keeps pushing until the goal in `PLAN.md` is live. Shape from Anthropic's
long-running-agent harness (planner, generator, evaluator; progress in files; a fresh context per
job) and the ECC hackathon winner's flow; sources in claude-setup `docs/RESEARCH.md`.

**In a Claude Project** (preferred) the project conversation starts threads itself; each thread
reports back when it finishes, opens its PR and keeps fixing CI and review comments on it. When
the operator runs inside a thread instead, it asks the coordinator to start the thread
(`get_channel_session_id`, then `send_message` with the filled-in task). Project settings once:
**Thread model** Sonnet, **Thread effort** medium, coordinator Opus; paste
`templates/project-instructions.md` into Project instructions. **In a plain claude.ai/code
chat**, start workers with `create_session` (`model: claude-sonnet-5-5`, `outcome_branch` =
the branch the task names) and check on them with `send_later` plus `subscribe_pr_activity`,
because a finished session doesn't report back there.

## 1. Size the job first

| Idea | Shape |
|---|---|
| Landing page, small site, one-screen tool | **One build thread + the evaluator.** No slices. |
| Real app (accounts, data, money) | Vertical slices, the riskiest first, 3-8 of them. |
| Unclear | Start as the small shape; split only when the first build thread runs out of room. |

Find the simplest solution that works. Every extra thread re-reads its context; most tokens
in past projects went to threads re-reading their own history (`docs/RESEARCH.md`).

## 2. The teams

Workers are subagents (for research and reviews) or fresh threads (for building and for each
PR's gate). Each gets a short brief: the goal, the files to read, what to return.

| Team | Who (always on) | Add-ons, per project only when the plan needs them | Brings back |
|---|---|---|---|
| Research | `market-research`, `product-lens` skills; `search-first` + `toolbox` for tools | Anthropic `Marketing` plugin's `competitive-brief` | competitors, who pays and how much, tool picks with costs |
| Legal | `legal` skill + `legal-reviewer` agent; shops: `sell`'s `legal-de.md`; ads: `market` section 4 | Anthropic `privacy-legal` (DPIA, DPA review), `ip-legal` (trademark clearance, OSS licenses), `ai-governance-legal` | legal must-haves for the plan, then pass/fail on the preview |
| Design | `frontend-design`, `impeccable`, `ui-review`, `design-critic` agent | `Figma` plugin when yskills designs there; Canva connector for social assets | 2-3 directions as screenshots, then reviews |
| Build | builder threads (Sonnet); `architect`, `database-reviewer`, `build-error-resolver` on call | stack plugins via `toolbox` (Cloudflare, Stripe, Sentry, PostHog...) | a PR with green CI and a preview link |
| QA | `evaluator` agent, `code-reviewer`, `a11y-architect`, `performance-optimizer` | | the 5/5 gate (`gate.md`) |
| Security | `security-reviewer` (reads the diff), `red-team` agent (attacks the preview like an outsider) | | check 4 of the gate; a full red-team pass before launch |
| Launch | `publish` and `sell` skills, Sentry and PostHog through `toolbox` | | live site, errors and analytics on |
| Marketing | `market` skill, `seo-specialist` agent | Anthropic `Marketing` plugin (campaign plan, SEO audit, performance report) | the one-page plan, launch posts, the weekly numbers |

A team is a routing line, not a new agent: reuse what is listed before adding anything, and
search the Anthropic Directory (`SearchPlugins`) and `toolbox` before writing a new skill. The
Directory's legal and marketing plugins are US- and enterprise-flavoured; German law and this
stack's rules win.

Research subagents use WebSearch, not WebFetch (CLAUDE.md says why), and return at most one page.

## 3. Files are the memory

Threads forget; the repo doesn't. Templates in `templates/`.

- `PLAN.md`: for yskills. The PRD with locked decisions, the slices, the marketing plan, the
  keys list, the cost estimate.
- `features.json`: for agents. Every slice with its acceptance criteria, written **before** the
  slice is built. Builders never touch it; the gate thread records the evaluator's verdict in it
  (`passes`) on the PR branch. JSON because agents edit it less casually than Markdown.
- `PROGRESS.md`: the handoff between threads. What is done, what is next, what broke, which
  decision was made and why, and what each thread cost. Every thread reads it first; only
  the operator writes it. Keep it under 100 lines; fold old entries into one line each.
- `metrics/<yyyy>-W<ww>.json`: from launch on, one file a week with the numbers (template
  `templates/metrics.json`). Luna reads these from the repos; no app needs its own dashboard.

## 4. The run

1. **Brainstorm once.** One batch of questions as tap cards (`AskUserQuestion` or decision cards),
   including the `sell` skill's money questions when it sells and the Impressum data (name,
   postal address, email, a second contact channel) when the site is public. No more questions
   after this batch except the three briefs.
2. **Research, in parallel subagents, one page each:**
   - **Inside:** what we already have. claude-setup's skills and catalog, the lessons table in
     its `docs/TEST-PROJECTS.md`, yskills' other repos with code to reuse (`list_repos`).
   - **Outside:** competitors and what they charge, how the best similar products and open-source
     projects are built, the tools (`toolbox`, Anthropic Directory).
   - **Money** (if the idea is meant to earn): who pays, how much, and three pieces of
     evidence that they already pay for something like it (competitor prices, reviews, search
     volume). No evidence → brief (a) recommends **no** or a smaller first version.
   - **Legal:** the `legal` skill's table for this idea (plus `sell` or `market` parts).
3. **Plan.** `planner` (read-only) proposes the plan; the operator writes `PLAN.md` and
   `features.json` from it (criteria per slice, each testable on a preview by clicking). Send
   **brief (a)**; its one step for yskills is creating the private repo at
   [github.com/new](https://github.com/new) with the plan's exact name (threads get 403 on
   `create_repository`). Then `add_repo` it.
4. **Scaffold + design.** One thread scaffolds ("Scaffold PLAN.md's app on branch `scaffold`:
   the default stack from CLAUDE.md, the `publish` skill's files, `verify`, CI, legal pages
   written per the `legal` skill. Open a PR, don't merge, stop."). The design team shoots 2-3 directions. Send **brief (b)**; it carries
   yskills' one-time setup from the `publish` skill (Cloudflare import, D1, Previews Base) and
   any test keys as numbered deep links, so nothing asks again later.
5. **Build.** One fresh builder thread per slice (or one for a small site), at most three in
   parallel, each reading only `PLAN.md`, its slice in `features.json` and `PROGRESS.md`. Test
   first, then build, `ship-check`, PR with screenshots and the preview link. The builder's task
   text, filled in: "Build slice <id> of PLAN.md; its criteria are in features.json (read only,
   never edit it). Read PLAN.md, PROGRESS.md and CLAUDE.md first. Write the tests first, then the
   code. Run ship-check. Push branch `slice/<id>` and open a PR with phone and desktop
   screenshots and a 3-line progress note in its body. Don't merge. Keep fixing CI and the
   review findings posted on the PR until it is merged or closed." The first slice's task also says "commit the D1 ids from PROGRESS.md
   into wrangler.jsonc". Only the operator writes `PROGRESS.md`: it copies the builder's note
   from the PR and the thread's cost (`get_session`: `external_metadata.usage.cost_usd`), so parallel builders never conflict.
6. **Gate each PR** in a fresh gate thread ("Run the operator skill's gate.md on PR <link>,
   slice <id>"), so the verdict comes from a context that never saw the build. The preview URL
   comes from the `Workers Builds` check or Cloudflare's PR comment, not from the builder. Less
   than 5/5: the gate thread posts the blocking findings as one PR review and stops; the builder
   fixes them and the next gate round starts on the new head. 5/5 merges. Less fixes and re-checks; after 3 failed rounds,
   stop and ping yskills with the evaluator's report.
7. **Launch.** The last PR before launch (the only one for a small site) gets the full
   `red-team` and `legal-reviewer` pass in its gate and does **not** merge at 5/5: send
   **brief (c)** first, because merging to `main` is going live. On ok: merge, plus `sell`'s
   go-live (section 4) when it sells.
8. **Grow.** At launch, `create_trigger` a weekly routine (fresh session per run, jittered time).
   It collects the numbers (`market` skill's section 5) and opens one PR with that week's
   `metrics/` file and the best next step as a new slice with criteria in `features.json`; the
   operator merges docs-only PRs on CI alone and starts a builder thread for a step that fits in
   one slice; anything bigger goes to yskills as tap options.
9. **Learn.** Anything yskills corrects, any gate round that failed for a reason a rule could
   catch, and anything a test project taught goes into claude-setup (a rule in CLAUDE.md, a skill
   line, a test or a check) in a small PR.

**Waiting on yskills.** Before sending a brief, write the state to `PROGRESS.md`. A project
conversation works from recent messages and memory, so it can simply continue. A plain chat
idle for more than an hour hands off instead: a fresh session reads `PROGRESS.md`.

The three briefs are in `briefs.md`. One message each, fixed template, ok/no answer.

## 5. Spend little

- **Models.** The coordinator on Opus; everything else on Sonnet: threads at medium effort via
  Project settings (not the default Opus/high), and every agent including the evaluator, which
  follows a fixed checklist. Built-in subagents default to Sonnet too (`CLAUDE_CODE_SUBAGENT_MODEL`).
- **Fresh context.** Reviewers and the evaluator get only the diff or the URL plus the criteria,
  never the chat. A thread lives for one job (one plan or one PR) and then closes.
- **Never revive a worker thread idle for more than an hour**: its cache is gone and it re-reads
  everything. Start a fresh one that reads `PROGRESS.md`.
- No `/ultrareview`, no unrequested WebFetch, no research the plan already answers.
- The evaluator runs once per gate round, never in a fix-until-pass loop of its own.
- Red team and legal run once before launch for a small site; per PR only when the gate's
  table says they apply.
