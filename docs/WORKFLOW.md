# From idea to monetized app

## How the hackathon winner works

Affaan Mustafa won the Anthropic x Forum Ventures hackathon by building zenith.chat entirely with
Claude Code. Sources: his guides in the ECC repo
([short](https://github.com/affaan-m/ECC/blob/main/the-shortform-guide.md),
[long](https://github.com/affaan-m/ECC/blob/main/the-longform-guide.md)) and ECC's `orch-*`
build pipeline.

1. **Two Claudes on an empty repo.**
   - The first lays down the scaffold: structure, configs, CLAUDE.md, rules and agents.
   - The second does deep research and writes the PRD, architecture diagrams, and reference
     clips from the real docs (`llms.txt`).
2. **Plan as thin vertical slices.** The `planner` agent turns the PRD into slices. Each slice is
   one working path end to end, not "all the models, then all the views". He approves the plan
   before any code is written (gate 1).
3. **Build each slice test-first.** The test is written first, then the slice is built until the
   test passes.
4. **Score it with a second agent.** A generator agent builds and an evaluator agent scores the
   result against a rubric. The evaluator clicks through the real app with Playwright. The loop
   repeats until the score passes.
5. **Review, then commit.**
   - `code-reviewer` checks every slice; `security-reviewer` also checks anything touching
     auth, input or money.
   - Each slice gets one conventional commit, and he confirms it (gate 2).
6. **Hooks run the whole time.**
   - Session state is saved before compaction and at session end, and reloaded at the next
     start.
   - When he has to repeat himself, the pattern is saved as a skill.
   - `/compact` happens at milestones, not mid-task.
7. **Run in parallel only when needed.** Parallel work uses git worktrees with clear scopes, and
   at most three or four at once. He uses CLIs instead of MCP servers where possible, to save
   tokens.

## Our workflow (this setup + this project)

You send one message with the idea. Everything after that runs in project threads, and each
thread lives for one job: it hands off through files, then closes. Long threads re-read their
whole history on every turn (98% of this project's tokens on 2026-10-04), so no thread outlives
its plan or its PR.

| Step | What happens | You do |
|---|---|---|
| 1. Plan thread | One thread runs research subagents (competitors, money, legal, tech) and the `planner` agent, instead of separate research and plan threads that would each re-read everything. It researches competitors, monetization (ads, premium, in-app), legal (DSGVO, cookie consent, licensing) and the tech risks. It writes `PLAN.md` in the repo: the PRD with locked decisions, the slices (step 4) and a one-page marketing plan (who buys, positioning, 90-day goal, channels, budget). The same batch lists every key the project needs, each with its deep link and exact GitHub secret name, so nothing stalls mid-build. | Answer **one** batch of questions; add the keys in GitHub |
| 2. Scaffold | The default stack from CLAUDE.md is scaffolded with Node pinned, a `verify` script, CI, CLAUDE.md, security headers and a deploy target. Toolchain problems are solved here once, not halfway through. | Nothing |
| 3. Design first | 2 or 3 directions are shown as real screenshots at phone and desktop size. | Pick one |
| 4. Slices | `PLAN.md` lists vertical slices, the riskiest first. Then the plan thread closes. | Approve the slice list |
| 5. Each slice | One fresh thread per slice, reading only `PLAN.md` and its slice; independent slices run in parallel, three at most. Test first, then build. Screenshots are scored against the design by `design-critic`. Then `ship-check` (fresh reviewers until clean), a PR with screenshots and the preview link, and green CI. The project chat gets one line per merged slice or blocker. | Merge after launch (see below) |
| 6. Launch | Deploy through GitHub Actions, analytics (PostHog), errors (Sentry), payments (`sell` skill's go-live list) and ads. Numbers report into Luna's cockpit. | Swap test keys for live ones and approve the go-live |
| 7. Market | The marketing plan from the PRD (`market` skill) runs: landing page and waitlist 4 weeks before launch, short videos and posts, launch day, then ads only on the message that sells. | Approve each week's batch of posts; connect accounts; pay for ads |
| 8. Measure | A weekly routine reports which channel and post brought paying users, cost per sale, and next week's 3 actions; numbers go into Luna. | Read it, pick |
| 9. Learn | Every correction you make becomes a rule, test or hook, so it doesn't come back. | Nothing |

### Who merges

The gate is **green CI on the PR's latest commit and a clean fresh review** (`ship-check`). There
is no star score, and GitHub's auto-merge needs a paid plan on private repos, so the thread
merges itself once both hold.

- **Until launch** (no real users, no real money): the slice thread merges its own PR, then
  closes. UI PRs still carry their screenshots for you to look at afterwards.
- **After launch** (step 6 done, or real money or users): merging deploys to people, so you
  merge; the thread posts the PR with screenshots and the preview link and waits.
- **claude-setup**: always you. It changes every project, and Claude Code's permission check
  blocks thread merges there anyway.

### Selling (pages that bill, shops, shipping)

The `sell` skill carries everything: the questions, the keys, tested Stripe-on-Workers code, the
shipping setup and German shop law (order button, Widerrufsbutton, packaging, product safety),
with a dated table that is re-checked at every new project.

Once, before your first real sale (the skill links each step):
- Gewerbe and the ELSTER tax questionnaire (Kleinunternehmer or not).
- A Stripe account; activate it for live payments when the first shop is ready.
- A legal-text service (e.g. IT-Recht Kanzlei) for AGB, Widerruf, Datenschutz and Impressum.
- Physical products: a Sendcloud account, plus LUCID and a packaging licence before the first
  parcel.

Shop keys go into the repo's GitHub environment `production`, which only `main` can read, and
the deploy copies them into Cloudflare. The deploy token sits there too; PR previews get a
second token that can only touch the preview copy. Every deploy runs in GitHub, never from a
thread. Test keys first, live keys at go-live.
After adding or changing a key, press Run workflow on the repo's Actions page: Claude in cloud
threads can't start a run (GitHub answers 403), so the key would otherwise wait for the next merge.

### Security, always on
- `security-guidance` warns while code is being written.
- ECC hooks block secrets and `--no-verify` at commit time (on your PC; cloud threads don't run them).
- `security-reviewer` checks auth, payment and input changes.
- GitHub secret scanning and `npm audit` are worth turning on per project; the `sell` CI template doesn't add them.

### What would have changed for TellMeY
- **Toolchain:** the Node 20 / F5 hunt in phase 0 would already be solved by the template.
- **UI churn:** commits like "ui: one screen again" and the repeated header and menu rounds would
  have been settled in step 3, before building.
- **Daily-puzzle bugs:** the "fix(daily)" rounds would have been caught by tests written first
  for the daily resolver.
- **Monetization:** ad slots, analytics and the PWA-or-store decision would have been in the PRD
  from day one, not added in phase 5.
