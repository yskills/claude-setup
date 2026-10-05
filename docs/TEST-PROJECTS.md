# Test projects

Three test projects, each run through the whole `operator` flow end to end to find what breaks,
and each built to earn so the money path gets tested too. What they teach goes back into this
repo; then the next one starts.

| # | Project | Shape | What it proves |
|---|---|---|---|
| 1 | **duo-test**, the language-learning app (existing repo), finished end to end | the operator taking over an existing app, slices | Briefs, Workers Builds previews, the evaluator, the 5/5 gate ending in one merge tap, logins and D1 with `security-reviewer` and `red-team`, the `sell` kit in Stripe sandbox, the `legal` team, a migration PR flagged as important |
| 2 | **A Three.js web game** (new repo) | small: one build thread | Design directions for a game, performance on a phone, portal monetization (Poki or CrazyGames SDK) or in-game purchases via `sell`, the weekly metrics PR |
| 3 | **A Roblox game** (new repo, Rojo) | slices | A build thread on yskills' PC (Studio), Luau code reviewed in the cloud, game passes and developer products, what the gate can and can't check outside the web |

## Rules for a test run

- yskills sends the idea, answers the one brainstorm batch and the three briefs, and taps Merge
  it at 5/5; every other touch is a finding.
- The operator logs in `PROGRESS.md`: each thread, its model, its cost, gate rounds and why they
  failed.
- Payments stay in sandbox or test mode until yskills decides a test project goes live for real.
  Forms store submissions instead of sending mail.
- Only test 2 runs the weekly routine, for two weeks; every trigger a test created is deleted when
  it ends.

## After each run

1. One PR to claude-setup titled `fix(setup): lessons from test project <n>`: every finding
   becomes a rule, a skill line, a template fix, a test or a check, the smallest that would have
   prevented it.
2. A line in the table below.
3. The next test project starts only after that PR is merged.

| # | Date | Touches outside briefs | Gate rounds | Tokens | Lessons PR |
|---|---|---|---|---|---|
| 1 duo-test | | | | | |
| 2 Three.js game | | | | | |
| 3 Roblox game | | | | | |

## Then

The first real project. Every project reports status, revenue, spend and its own key numbers
into Luna's cockpit, the one dashboard over all apps (CLAUDE.md); the operator reads them weekly
and turns the best next step into a slice.
