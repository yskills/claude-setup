# Roadmap: from idea to money

Every new project follows this. You send the idea in a Claude Project (or a plain chat); the
project conversation becomes the **operator** (`operator` skill) and starts a thread per job.
It holds the goals, staffs the teams, pushes them until the goal is live, and asks you exactly
three ok/no questions. Each thread lives for one job, hands off through files and closes: long
threads re-read their whole history every turn.

## The phases

| # | Phase | Team (who) | Output | You do |
|---|---|---|---|---|
| 0 | Idea | you | one message | Send it |
| 1 | Brainstorm | operator | one batch of tap-card questions (incl. money questions from `sell`) | Answer once |
| 2 | Research, in parallel | **Inside:** our skills, catalog, lessons from `docs/TEST-PROJECTS.md`, your other repos. **Outside:** competitors, how the best similar products and open-source projects are built, tools (`toolbox`, Anthropic Directory). **Money:** who pays, how much, 3 pieces of evidence; none → the plan says no. **Legal:** the `legal` skill's table | one page each | Nothing |
| 3 | Plan | `planner` | `PLAN.md` (PRD, slices, marketing plan, keys, costs), `features.json` (acceptance criteria per slice, written before any code) | **Brief (a):** ok/no (it includes proof people pay) |
| 4 | Scaffold + design | one scaffold thread; design team (`frontend-design`, `impeccable`, `design-critic`) | default stack, `verify`, CI, Workers Builds config (`publish`; you connect it); 2-3 directions as screenshots | **Brief (b):** pick one; do the one-time Cloudflare/keys steps it lists |
| 5 | Build | builder threads (Sonnet), one per slice, at most 3 in parallel; a small site is one thread, no slices | PRs with tests, screenshots, preview link; `PROGRESS.md` updated | Nothing |
| 6 | Gate each PR | QA: `evaluator` on the preview, fresh `code-reviewer`; security: `security-reviewer` + `red-team`; `design-critic` + `legal-reviewer` | 5/5 → the gate thread merges | Nothing, unless 3 rounds fail |
| 7 | Launch | full `red-team` and `legal-reviewer` pass; `publish`, `sell` go-live; Sentry, PostHog | live site | **Brief (c):** ok/no; live keys |
| 8 | Grow | marketing team (`market` skill, `seo-specialist`); a weekly routine | posts, launch, a weekly `metrics/` file per repo that Luna's cockpit reads (revenue, spend, own numbers) and the next slices | Approve post batches, pay for ads |
| 9 | Learn | operator | each lesson becomes a rule, skill line, test or check in claude-setup | Merge that PR |

After launch, phases 5-6 repeat for every improvement the weekly numbers suggest.

## The 5/5 gate

Five pass/fail checks by agents that didn't write the code: CI, evaluator on the preview, fresh
code review, security + red team, design + legal. 5/5 → the gate thread merges; 3 failed rounds →
you get pinged; after launch, auth/payments/migrations/secrets wait for you; claude-setup is
always you. Details: `operator` skill, `gate.md`. Token rules: its section 5.

## Learning

Every correction, every failed gate round with a catchable cause and every test project ends as
a rule, skill line, test or check in this repo. That is the memory: committed, reviewed, loaded
by every thread. No memory plugin or Obsidian: cloud threads run no hooks, and the repo already
does the job.

Claude Code's built-in auto-memory stays on as a scratchpad on your PC
(`~/.claude/projects/*/memory/`). **Memory check**, first session of each month or when you say
"memory check": read every memory file, move each lasting lesson into claude-setup (rule, skill
line or check, in one PR), delete notes that are wrong, stale or now in the repo, and tell you in
three lines what moved and what went. If the files keep holding things the repo should, it says
so; if they stay empty or useless twice in a row, it suggests turning auto-memory off.

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

Deploys and previews: the `publish` skill.

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
