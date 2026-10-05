# Test projects

Three throwaway projects, each harder than the last, run before the first real one. Each runs
the whole `operator` flow end to end and exists to find what breaks. What they teach goes back
into this repo; then the next one starts. Repos are private and get deleted or archived after.

| # | Project | Shape | What it proves |
|---|---|---|---|
| 1 | One-page site: a fake café with menu, opening hours and a contact form | One build thread + evaluator | Brief (a)-(c) templates, Workers Builds import and previews, the evaluator on a preview, the 5/5 gate merging by itself, the `legal` team (Impressum, Datenschutz, privacy scan clean), zero touches from yskills outside the briefs |
| 2 | Small app: a shared shopping list with email login and D1 | 3 slices, riskiest first | Slicing, `features.json` and `PROGRESS.md` handoffs across fresh threads, preview D1 and Previews Base secrets, `security-reviewer` in the gate, account deletion, the after-launch rule (a migration waits for yskills) |
| 3 | Paid digital product in Stripe sandbox: a 2 € PDF download | 2 slices | The `sell` kit on Workers Builds (Worker secrets, sandbox webhook made by hand, `deploy.mjs` as deploy command), order button wording, `legal-reviewer` on shop pages, a real sandbox checkout, the weekly smoke test |

## Rules for a test run

- yskills writes only the idea and answers the three briefs; every other touch is a finding.
- The operator logs in `PROGRESS.md`: each thread, its model, its token use (from the thread's
  usage), gate rounds and why they failed.
- Nothing goes live on a real domain and no real money moves.

## After each run

1. One PR to claude-setup titled `fix(setup): lessons from test project <n>`: every finding
   becomes a rule, a skill line, a template fix, a test or a check, the smallest that would have
   prevented it.
2. A line in the table below.
3. The next test project starts only after that PR is merged.

| # | Date | Touches outside briefs | Gate rounds | Tokens | Lessons PR |
|---|---|---|---|---|---|
| 1 | | | | | |
| 2 | | | | | |
| 3 | | | | | |

## Then

The first real project. Every project reports status, revenue, spend and its own key numbers
into Luna's cockpit, the one dashboard over all apps (CLAUDE.md); the operator reads them weekly
and turns the best next step into a slice.
