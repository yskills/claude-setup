---
name: operator
description: Run a project from idea to live app with the least of yskills' time and tokens - the operator holds the goals, sizes the job, staffs the teams (research inside and outside, legal, design, build, QA, red team, launch, marketing), keeps PLAN.md, features.json and PROGRESS.md, runs the 5/5 merge gate and sends yskills exactly three ok/no briefs. Use when yskills brings a new app idea, says "build", "go", "continue the project", or a project thread starts or resumes.
---

# Operator

The operator is the project's plan thread (Opus). It never builds. It decides what is needed,
hands each job to a fresh worker with only the files that job needs, checks the result against
fixed criteria and keeps pushing until the goal in `PLAN.md` is live. Shape from Anthropic's
long-running-agent harness (planner, generator, evaluator; progress in files; a fresh context per
job) and the ECC hackathon winner's flow; sources in claude-setup `docs/RESEARCH.md`.

## 1. Size the job first

| Idea | Shape |
|---|---|
| Landing page, small site, one-screen tool | **One build thread + the evaluator.** No slices. |
| Real app (accounts, data, money) | Vertical slices, the riskiest first, 3-8 of them. |
| Unclear | Start as the small shape; split only when the first build thread runs out of room. |

Find the simplest solution that works. Every extra thread re-reads its context; most tokens
in past projects went to threads re-reading their own history (`docs/RESEARCH.md`).

## 2. The teams

Workers are subagents (inside the operator thread, for reviews and research) or fresh project
threads (for building). Each gets a short brief: the goal, the files to read, what to return.

| Team | Who (always on) | Add-ons, per project only when the plan needs them | Brings back |
|---|---|---|---|
| Research | `market-research`, `product-lens` skills; `search-first` + `toolbox` for tools | Anthropic `Marketing` plugin's `competitive-brief` | competitors, who pays and how much, tool picks with costs |
| Legal | `legal` skill + `legal-reviewer` agent; shops: `sell`'s `legal-de.md`; ads: `market` section 4 | Anthropic `privacy-legal` (DPIA, DPA review), `ip-legal` (trademark clearance, OSS licenses), `ai-governance-legal` | legal must-haves for the plan, then pass/fail on the preview |
| Design | `frontend-design`, `impeccable`, `ui-review`, `design-critic` agent | `Figma` plugin when yskills designs there; Canva connector for social assets | 2-3 directions as screenshots, then reviews |
| Build | builder threads (Sonnet); `architect`, `database-reviewer`, `build-error-resolver` on call | stack plugins via `toolbox` (Cloudflare, Stripe, Sentry, PostHog...) | a PR with green CI and a preview link |
| QA | `evaluator` agent (Opus), `code-reviewer`, `a11y-architect`, `performance-optimizer` | | the 5/5 gate (`gate.md`) |
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
  slice is built. Builders never touch it; the operator records the evaluator's verdict in it
  (`passes`) on the PR branch. JSON because agents edit it less casually than Markdown.
- `PROGRESS.md`: the handoff between threads. What is done, what is next, what broke, which
  decision was made and why, and what each thread cost. Every thread reads it first; only
  the operator writes it. Keep it under 100 lines; fold old entries into one line each.
- `metrics/<yyyy>-W<ww>.json`: from launch on, one file a week with the numbers (template
  `templates/metrics.json`). Luna reads these from the repos; no app needs its own dashboard.

## 4. The run

1. **Brainstorm once.** One batch of questions as tap cards (`AskUserQuestion` or decision cards),
   including the `sell` skill's money questions when it sells. No more questions after this
   batch except the three briefs.
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
   `features.json` from it (criteria per slice, each testable on a preview by clicking). The
   operator creates the private repo itself (`create_repository`, then `add_repo`). Send **brief (a)**.
4. **Scaffold + design.** One thread scaffolds the default stack (CLAUDE.md) with `publish`'s
   setup, `verify`, CI. The design team shoots 2-3 directions. Send **brief (b)**; it carries
   yskills' one-time setup from the `publish` skill (Cloudflare import, D1, Previews Base) and
   any test keys as numbered deep links, so nothing asks again later.
5. **Build.** One fresh builder thread per slice (or one for a small site), at most three in
   parallel, each reading only `PLAN.md`, its slice in `features.json` and `PROGRESS.md`. Test
   first, then build, `ship-check`, PR with screenshots and the preview link. Mechanics:
   - start it with `create_session` (`source_url` = the project repo, `model` = Sonnet; effort
     can't be set per session) and this prompt, filled in: "Build slice <id> of PLAN.md; its
     criteria are in features.json (read only, never edit it). Read PLAN.md, PROGRESS.md and
     CLAUDE.md first. Write the tests first, then the code. Run ship-check. Push branch
     `slice/<id>` and open a PR with phone and desktop screenshots, the preview link and a
     3-line progress note in its body. Then stop." The first slice's prompt also says "commit
     the D1 ids from PROGRESS.md into wrangler.jsonc";
   - one `send_later` check-in after about 50 minutes (a finished child session doesn't report
     back): find the PR by branch `slice/<id>`, `subscribe_pr_activity` on it and gate it. No PR
     yet: check again once; still none, ping yskills with the session link;
   - only the operator writes `PROGRESS.md`: it copies the builder's progress note from the PR
     and adds the session's cost (`get_session`, `usage.cost_usd`), so parallel builders never
     conflict.
6. **Gate each PR** with `gate.md`. 5/5 merges. Less fixes and re-checks; after 3 failed rounds,
   stop and ping yskills with the evaluator's report.
7. **Launch.** A full `red-team` and `legal-reviewer` pass on the preview, then **brief (c)**.
   On ok, the go-live steps of `publish` (and `sell`).
8. **Grow.** At launch, `create_trigger` a weekly routine (fresh session per run, jittered time).
   It collects the numbers (`market` skill's section 5) and opens one PR with that week's
   `metrics/` file and the best next step as a new slice with criteria in `features.json`; the
   operator merges docs-only PRs on CI alone. If the step fits in one slice it starts a fresh
   operator (`create_session`) to build it; anything bigger goes to yskills as tap options.
9. **Learn.** Anything yskills corrects, any gate round that failed for a reason a rule could
   catch, and anything a test project taught goes into claude-setup (a rule in CLAUDE.md, a skill
   line, a test or a check) in a small PR.

**Waiting on yskills.** Before sending a brief, write the state to `PROGRESS.md`. If the answer
comes back after more than an hour, don't continue in the cold thread: start a fresh operator
(`create_session`, "continue the project: brief <x> answered <ok/no>, read PROGRESS.md") and stop.

The three briefs are in `briefs.md`. One message each, fixed template, ok/no answer.

## 5. Spend little

- **Models.** Operator and evaluator: Opus (the evaluator's skepticism is the one judgment
  Anthropic kept on its strongest model). Builder threads: Sonnet. Reviewer agents run on Sonnet.
- **Fresh context.** Reviewers and the evaluator get only the diff or the URL plus the criteria,
  never the chat. A thread lives for one job (one plan or one PR) and then closes.
- **Never revive a thread idle for more than an hour**: its cache is gone and it re-reads
  everything. Start a fresh one that reads `PROGRESS.md`.
- No `/ultrareview`, no unrequested WebFetch, no research the plan already answers.
- The evaluator runs once per gate round, never in a fix-until-pass loop of its own.
- Red team and legal run once before launch for a small site; per PR only when the gate's
  table says they apply.
