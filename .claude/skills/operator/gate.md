# The 5/5 merge gate

Five pass/fail checks, never a star score: AI judges grade their own team's work too kindly, so
each check is a hard yes or no from someone who did not write the code.

| # | Check | Who | Gets only | Applies |
|---|---|---|---|---|
| 1 | CI green on the PR's latest commit | GitHub | | always |
| 2 | Every acceptance criterion of the slice passes on the preview | `evaluator` agent | preview URL, slice id, `features.json` | always |
| 3 | Nothing blocking | a **fresh** `code-reviewer` | the diff + the slice goal in 2 sentences | always |
| 4 | Nothing blocking, no CRITICAL or HIGH | `security-reviewer` on the diff, `red-team` attacking the preview | the diff; the preview URL and route list | auth, payments, user input, secrets touched; `red-team` always once before launch |
| 5 | Nothing blocking | `design-critic` (and `legal-reviewer` on pages users see) | phone + desktop screenshots, the preview URL | UI changed |

A check that doesn't apply counts as passed; say so in the table.

## Rounds

- **5/5:** the operator merges (squash) and closes the builder thread. GitHub doesn't let an
  author approve their own PR and threads push as yskills, so the merge is the approval.
- **Less than 5/5:** the builder fixes every blocking finding, then the failed checks run
  again, each with a **fresh** agent. That is one round.
- **3 failed rounds:** stop. Send yskills one message: the PR link, which check keeps failing,
  the evaluator's or reviewer's last report, and two or three ways forward as tap options.

## After launch

Once the app has real users or real money, the gate still merges on 5/5 **except** diffs
touching auth, payments, database migrations or secrets: those get the 5/5 table posted on the
PR and wait for yskills' ok (confirmed by yskills 2026-10-05). claude-setup itself is always
merged by yskills.

## Post this on the PR before merging

```
Gate 5/5 (round <n>)
1 CI ............ pass  <run link>
2 Evaluator ..... pass  <n>/<n> criteria
3 Code review ... pass  (fresh, round <n>)
4 Security ...... pass | n/a
5 Design/legal .. pass | n/a
```
