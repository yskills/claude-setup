# Roadmap: from idea to money

Every new project follows this. You send the idea; the plan thread becomes the **operator**
(`operator` skill). It holds the goals, staffs the teams, pushes them until the goal is live,
and asks you exactly three ok/no questions. Each other thread lives for one job, hands off
through files and closes: long threads re-read their whole history every turn (98% of the
tokens on 2026-10-04 went there).

## The phases

| # | Phase | Team (who) | Output | You do |
|---|---|---|---|---|
| 0 | Idea | you | one message | Send it |
| 1 | Brainstorm | operator | one batch of tap-card questions (incl. money questions from `sell`) | Answer once |
| 2 | Research, in parallel | **Inside:** our skills, catalog, lessons from `docs/TEST-PROJECTS.md`, your other repos. **Outside:** competitors, prices, how the best similar products and open-source projects are built, tools (`toolbox`, Anthropic Directory). **Legal:** the `legal` skill's table | one page each | Nothing |
| 3 | Plan | `planner` | `PLAN.md` (PRD, slices, marketing plan, keys, costs), `features.json` (acceptance criteria per slice, written before any code) | **Brief (a):** ok/no; add keys in Cloudflare |
| 4 | Scaffold + design | one scaffold thread; design team (`frontend-design`, `impeccable`, `design-critic`) | default stack, `verify`, CI, Workers Builds (`publish`); 2-3 directions as screenshots | **Brief (b):** pick one |
| 5 | Build | builder threads (Sonnet), one per slice, at most 3 in parallel; a small site is one thread, no slices | PRs with tests, screenshots, preview link; `PROGRESS.md` updated | Nothing |
| 6 | Gate each PR | QA: `evaluator` on the preview, fresh `code-reviewer`; security: `security-reviewer` + `red-team`; `design-critic` + `legal-reviewer` | 5/5 → the thread merges | Nothing, unless 3 rounds fail |
| 7 | Launch | full `red-team` and `legal-reviewer` pass; `publish`, `sell` go-live; Sentry, PostHog | live site | **Brief (c):** ok/no; live keys |
| 8 | Grow | marketing team (`market` skill, `seo-specialist`) | posts, launch, weekly numbers into Luna's cockpit | Approve post batches, pay for ads |
| 9 | Learn | operator | each lesson becomes a rule, skill line, test or check in claude-setup | Merge that PR |

After launch, phases 5-6 repeat for every improvement the weekly numbers suggest.

## The 5/5 gate

Five pass/fail checks, never a star score: AI judges grade their own team's work too kindly, so
each check is a hard yes or no from someone who didn't write the code (`operator` skill,
`gate.md`).

1. CI green on the latest commit.
2. The `evaluator` passes every acceptance criterion on the branch's preview.
3. A fresh `code-reviewer` finds nothing blocking.
4. `security-reviewer` and `red-team` find nothing blocking, when auth, payments or user input
   are touched.
5. `design-critic` and `legal-reviewer` find nothing blocking, for UI changes.

- **5/5:** the thread merges. GitHub doesn't let an author approve their own PR and threads push
  as you, so the merge is the approval.
- **Less:** fix, re-check with fresh agents. **After 3 failed rounds** the thread stops and
  pings you with tap options.
- **After launch:** still merges on 5/5, except diffs touching auth, payments, DB migrations or
  secrets: those wait for your ok.
- **claude-setup:** always you.

## Spending tokens

- Operator and evaluator on Opus; builder threads on Sonnet at medium effort; reviewer agents
  run on Sonnet.
- Reviewers, the evaluator and the red team get only the diff or the URL plus the criteria,
  never the chat.
- Never revive a thread idle for more than an hour: its cache expired and it re-reads
  everything. Start a fresh one; it reads `PROGRESS.md`.
- No `/ultrareview`, no unrequested WebFetch. The always-on baseline is measured
  (`config/plugins.json`, README).

## Learning

Every correction, every failed gate round with a catchable cause and every test project ends as
a rule, skill line, test or check in this repo. That is the memory: committed, reviewed, loaded
by every thread. No memory plugin or Obsidian: cloud threads run no hooks, and the repo already
does the job.

Before the first real project, three test projects run this roadmap end to end
(`docs/TEST-PROJECTS.md`).

## Selling (pages that bill, shops, shipping)

The `sell` skill carries everything: the questions, the keys, tested Stripe-on-Workers code, the
shipping setup and German shop law, with a dated table re-checked at every new project.

Once, before your first real sale (the skill links each step):
- Gewerbe and the ELSTER tax questionnaire (Kleinunternehmer or not).
- A Stripe account; activate it for live payments when the first shop is ready.
- A legal-text service (e.g. IT-Recht Kanzlei) for AGB, Widerruf, Datenschutz and Impressum.
- Physical products: a Sendcloud account, plus LUCID and a packaging licence before the first
  parcel.

Deploys run through Cloudflare Workers Builds (`publish` skill): `main` goes live, every other
branch gets its own preview with its own data and keys, and GitHub holds no keys. Threads never
deploy themselves. Test keys first, live keys at go-live, and branch builds go off before the
first live key.

## Security, always on

- `security-guidance` warns while code is being written.
- ECC hooks block secrets and `--no-verify` at commit time (on your PC; cloud threads don't run
  them).
- `security-reviewer` reads every risky diff; `red-team` attacks the preview before launch.
- GitHub secret scanning and `npm audit` are worth turning on per project.

## Where this comes from

Anthropic's harness posts (planner, generator and a separate evaluator; progress in files; a
fresh context per job; hard thresholds) and the ECC hackathon winner's flow (research and
scaffold first, thin vertical slices, test first, review before commit, lessons saved as skills).
Sources and what was left out: `docs/RESEARCH.md`.
