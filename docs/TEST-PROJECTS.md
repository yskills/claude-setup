# Test projects

Three test projects, each run through the whole `operator` flow end to end to find what breaks,
and each built to earn so the money path gets tested too. Test 3 tests demand itself: whether
strangers sign up before anything is built. What they teach goes back into this
repo; then the next one starts.

| # | Project | Shape | What it proves |
|---|---|---|---|
| 1 | **duo-test**, the language-learning app (existing repo), finished end to end | the operator taking over an existing app, slices | Briefs, Workers Builds previews, the evaluator, the 5/5 gate ending in one merge tap, logins and D1 with `security-reviewer` and `red-team`, the `sell` kit in Stripe sandbox, the `legal` team, a migration PR flagged as important |
| 2 | **A Three.js web game** (new repo) | small: one build thread | Design directions for a game, performance on a phone, portal monetization (Poki or CrazyGames SDK) or in-game purchases via `sell`, the weekly metrics PR |
| 3 | **A journal app probe** (new repo) | the probe slice only, then build or kill | The probe step: offer, price, waitlist (no pre-orders yet), one channel for 14 days against a go number fixed in advance, the kill/change card, probe-mode gate. On go: the `store` path up to a TestFlight build and Google's closed test, recruited from the waitlist |

## Rules for a test run

- yskills sends the idea, answers the one brainstorm batch and the three briefs, and taps Merge
  it at 5/5; every other touch is a finding.
- The operator logs in `PROGRESS.md`: each thread, its model, its cost, gate rounds and why they
  failed.
- Payments stay in sandbox or test mode until yskills decides a test project goes live for real.
  Forms store submissions instead of sending mail.
- Every test meant to earn fixes its go number in `PLAN.md` before the probe starts and logs
  whether it hit it. 30/60/90-day targets are set too, but only checked for a test that launches
  and runs the weekly routine.
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
| 3 Journal probe | | | | | |

duo-test stays web-only in test 1; its App Store and Google Play release (`store` skill) is a
slice after test 1, once test 3 has proven the store path or the web version earns.

A Roblox game (Rojo, a build thread on yskills' PC) waits until after the first real project.

## Then

The first real project. Every project reports status, revenue, spend and its own key numbers
into Luna's cockpit, the one dashboard over all apps (CLAUDE.md); the operator reads them weekly
and turns the best next step into a slice.
