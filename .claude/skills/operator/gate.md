# The 5/5 gate

A fresh gate thread runs this on one PR (in a plain chat: the operator, with fresh subagents).
Five pass/fail checks, never a star score: judges grade their own team's work too kindly, so each
check is a hard yes or no from someone who didn't write the code.

| # | Check | Who | Gets only | Applies |
|---|---|---|---|---|
| 1 | CI and `Workers Builds: <worker>` green on the head SHA | check runs | | always |
| 2 | Every acceptance criterion passes on the preview | `evaluator` | the head SHA's preview URL (from the Workers Builds check or Cloudflare's PR comment), the slice's criteria | always |
| 3 | Nothing blocking | a **fresh** `code-reviewer` (the builder's last ship-check pass counts if its report names this head SHA) | the diff, the slice goal in 2 sentences | always |
| 4 | Nothing blocking, no CRITICAL/HIGH | `security-reviewer` on the diff; `red-team` on the preview | the diff; the preview URL and routes | auth, payments, user input or secrets touched; red team always on the last PR before launch |
| 5 | Nothing blocking | `design-critic`; `legal-reviewer` when pages, forms, tracking, embeds or AI output change | phone and desktop screenshots, the preview URL | UI changed |

A check that doesn't apply passes; say "n/a" in the table.

**No preview yet or any more:** the scaffold PR (before Workers Builds is connected) needs CI
only. Once branch builds are off (live payment keys, `publish` skill), check 1 is CI only and the
gate runs the PR's build locally (`wrangler dev`) for checks 2, 4 and 5.

## Rounds

- **5/5:** commit the evaluator's verdict into `features.json` (`passes`) on the PR branch, wait
  for check 1 on that commit (a commit touching only `features.json` doesn't restart checks 2-5),
  then post the table below. yskills merges with one tap.
- **Less:** post the blocking findings as one PR review and stop. The builder fixes them; the next
  round re-runs the failed checks with fresh agents on the new head.
- **3 failed rounds:** stop. One message to yskills: the PR, the check that keeps failing, its last
  report, and two or three ways forward as tap options.

PRs touching auth, payments, database migrations or secrets say so on the table's first line, so
yskills knows which taps deserve a look. claude-setup PRs always get yskills' full review.

```
Gate 5/5 (round <n>), ready to merge   [risky: auth | payments | migration | secrets]
1 CI + Workers Builds .. pass  <run links>
2 Evaluator ............ pass  <n>/<n> criteria
3 Code review .......... pass
4 Security / red team .. pass | n/a
5 Design / legal ....... pass | n/a
```
