# Roadmap: from idea to money

Every new project follows this. You send the idea in a Claude Project (or a plain chat); the
project conversation becomes the **operator** (`operator` skill) and starts a thread per job. It
holds the goals, staffs the teams and pushes them until the goal is live. You answer one
brainstorm batch and three ok/no briefs; the gate merges every PR at 5/5 itself.
Each thread lives for one job, hands off through files and closes: long threads re-read their
whole history every turn.

## The phases

| # | Phase | Team (who) | Output | You do |
|---|---|---|---|---|
| 0 | Idea | you | one message | Send it |
| 1 | Brainstorm | operator | one batch of tap-card questions (incl. money questions from `sell`) | Answer once |
| 2 | Research, in parallel | **Inside:** our skills, catalog, lessons from `docs/TEST-PROJECTS.md`, your other repos. **Outside:** competitors, how the best similar products and open-source projects are built, tools (`toolbox`, Anthropic Directory). **Money:** who pays, how much, 3 pieces of evidence; none → the plan says no. **Legal:** the `legal` skill's table | one page each | Nothing |
| 3 | Plan | `planner` | `PLAN.md` (PRD, slices, marketing plan, keys, costs), `features.json` (acceptance criteria per slice, written before any code) | **Brief (a):** ok/no (it includes proof people pay) |
| 4 | Scaffold + design | one scaffold thread; design team (`frontend-design`, `impeccable`, `design-critic`) | default stack, `verify`, CI, Workers Builds config (`publish`; you connect it); 2-3 directions as screenshots | **Brief (b):** pick one; do the Cloudflare import it lists. Later keys come one card at a time, when a slice needs them |
| 5a | Probe (anything meant to earn) | one builder thread, then the marketing team | slice `probe` live: offer, price, waitlist; pushed in one channel for ~14 days against the go number from `PLAN.md` | Nothing if it hits the number; else one tap: kill, change or build anyway |
| 5 | Build | builder threads (Opus), one per slice, the next in a fresh thread after a merge; a second only when the slices share no file, never more than three; a small site is one thread, no slices | PRs with tests, screenshots, preview link; `PROGRESS.md` updated | Nothing |
| 6 | Gate each PR | QA: `evaluator` on the preview, fresh `code-reviewer`; security: `security-reviewer` + `red-team`; `design-critic` + `legal-reviewer` | a 5/5 table on the PR and the merge, or one review the builder fixes | nothing |
| 7 | Launch | full `red-team` and `legal-reviewer` pass; `publish`, `sell` go-live; PostHog for analytics and errors | live site | **Brief (c)** to read; the gate merges (auto-run); live keys when you want real money |
| 8 | Grow | marketing team (`market` skill, `seo-specialist`); a weekly routine | posts, launch, a weekly PR with the `metrics/` file Luna's cockpit reads and the next slice | The gate merges the weekly PR (you tap only if Claude Code's safety check blocks it); approve post batches, pay for ads |
| 9 | Learn | operator | each lesson becomes a rule, skill line, test or check in claude-setup | Nothing; the gate merges it (you tap only if Claude Code's safety check blocks it) |

After launch, phases 5-6 repeat for every improvement the weekly numbers suggest.

**Auto-run** (your choice, 2026-10-06): no taps. Every card shows its options with the
recommended one marked and work continues on it at once; the gate merges at 5/5 after a real
preview test and a fresh review; the project chat reports results and real blockers only. Your
"stop" and your taste calls (a rejected asset or look) are final and go into every brief. Only
what needs your own hands waits: keys, a domain, the Cloudflare import.

## Models

One rule, applied by the project chat when it starts a thread (`start_thread_session`'s
`model`), by the agent files (`model:` in `.claude/agents/*.md`, the same on your PC after
`node install.mjs`) and by `CLAUDE_CODE_SUBAGENT_MODEL` for built-in subagents:

| Work | Model | Where |
|---|---|---|
| Architecture and plans: the plan of a new project, a redesign, anything decided once | **Fable** `claude-fable-5-1` | `architect` agent, Architect threads, the project chat while it plans |
| Build slices and anything with design or judgement | **Opus** `claude-opus-5-5` | `planner`, Programmer slice threads, Designer threads, `design-critic`, `build-error-resolver`, `refactor-cleaner` |
| Follow-ups, small fixes, data wiring, tests, reviews, research | **Sonnet** `claude-sonnet-5-5` | gate threads, fix threads, reviewers, `evaluator`, `red-team`, `legal-reviewer`, research subagents, built-in subagents |
| Bulk text with no judgement, simple reading jobs (find, list, summarise a file) | Haiku | `doc-updater`, subagents that only read and report |
| local worker: research digests, asset scouting (links only, Claude downloads and checks), story drafts; never code, licences, taste, mail | Local Qwen via llama.cpp on the PC | repo `yskills/worker`, after its 10-job trial passes |

Agent files use the aliases `fable`, `opus`, `sonnet`, `haiku`, which follow the newest model of
each family; thread starts pass the full ids above. Rule of thumb: a thread that decides
something hard to undo or that you will look at runs on Opus; one that fills in what a plan
already decided runs on Sonnet; the plan itself comes from Fable. Default is Sonnet: Opus only
for design or judgement, and simple reading jobs go to Haiku subagents.

## The 5/5 gate

Five pass/fail checks by agents that didn't write the code: CI, evaluator on the preview, fresh
code review, security + red team, design + legal. 5/5 → the gate thread merges it, launch and claude-setup included (you tap **Merge it** only when
Claude Code's safety check blocks a thread's merge). 2 failed rounds → you get a
plain summary of what's wrong and tap options; the recommended one is taken at once. Until the first paying user the gate runs in
probe mode: no fresh code reviewer (the builder's ship-check counts), design review only on the
probe page and before launch, security whenever a PR stores what users type. Important PRs (auth, payments, migrations, secrets)
come with three lines: what changes, what could break, how to undo it.
claude-setup PRs go through the same gate. Details: `operator` skill, `gate.md`.

## Learning

Every correction, every failed gate round with a catchable cause and every test project ends as
a rule, skill line, test or check in this repo. That is the memory: committed, reviewed, loaded
by every thread. No memory plugin or Obsidian: ECC hooks from the PC install don't run in cloud threads (only the settings hooks `cloud/setup.sh` writes, like the context guard), and the repo already
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
- Legal texts: Claude writes them (official model texts word for word); a paid service such as
  eRecht24 once sales come in.
- Physical products: a Sendcloud account, plus LUCID and a packaging licence before the first
  parcel.

Deploys and previews: the `publish` skill.

## Security, always on

- `security-guidance` warns while code is being written.
- ECC hooks block secrets and `--no-verify` at commit time (on your PC; the ECC hooks of the PC install don't run in cloud threads).
- `security-reviewer` reads every risky diff; `red-team` attacks the preview before launch.
- GitHub secret scanning and `npm audit` are worth turning on per project.

## Where this comes from

Anthropic's harness posts (planner, generator and a separate evaluator; progress in files; a
fresh context per job; hard thresholds) and the ECC hackathon winner's flow (research and
scaffold first, thin vertical slices, test first, review before commit, lessons saved as skills).
Sources and what was left out: `docs/RESEARCH.md`.
