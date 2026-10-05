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
| 5 | Nothing blocking | `design-critic`; `legal-reviewer` when pages, forms, tracking, embeds or AI output change | phone and desktop screenshots, the preview URL | UI changed; `legal-reviewer` always on the last PR before launch |

A check that doesn't apply passes; say "n/a" in the table.

## Mode: probe or product

`PLAN.md` says `Mode: probe` until the first paying user; the operator (or the weekly routine,
whichever sees that payment first) switches it to `Mode: product`. Until someone pays, gate rounds go to finding out whether anyone will:

| # | Probe mode |
|---|---|
| 1, 2 | as above |
| 3 | the builder's ship-check report, when it names this head SHA; no fresh reviewer |
| 4 | `security-reviewer` whenever the PR touches logins, payments, secrets or stores anything a user typed (emails, notes, journal entries); `red-team` only on the last PR before launch |
| 5 | `legal-reviewer` when public pages, forms, tracking or embeds change; `design-critic` only on the probe slice and the last PR before launch |

Product mode is the full table above. The headline names the mode: `Gate 5/5 (probe, round <n>)`.

**No preview yet or any more:** the scaffold PR (before Workers Builds is connected) needs CI
only. Once branch builds are off (live payment keys, `publish` skill), check 1 is CI only and the
gate runs the PR's build locally (`wrangler dev`) for checks 2, 4 and 5.

## Rounds

- **5/5:** commit the evaluator's verdict into `features.json` (`passes`) on the PR branch, wait
  for check 1 on that commit (a commit touching only `features.json` doesn't restart checks 2-5),
  then post the table below as a PR comment. yskills merges (squash) with **Merge it** on the gate
  thread's card, which tells the thread to merge, or with GitHub's own Merge button. The gate
  thread never merges unless yskills says so.
- **Last PR before launch:** head the table `hold: brief (c) first`; the operator sends brief (c),
  and its ok is the merge.
- **Less:** post the blocking findings as one PR review and stop. The builder fixes them; the next
  round re-runs the failed checks with fresh agents on the new head.
- **2 failed rounds:** stop. Send one message to yskills: what the PR does, what is wrong in plain words (from
  the last reports), and two or three ways forward as tap options.

**Important PRs** (auth, payments, database migrations, secrets, or anything that can lose data or
money): even at 5/5, the table comes with three plain lines for yskills: what changes, what could
break, how to undo it. claude-setup PRs always get yskills' full review.

```
Gate 5/5 (round <n>), ready to merge | hold: brief (c) first   [risky: auth | payments | migration | secrets]
1 CI + Workers Builds .. pass  <run links>
2 Evaluator ............ pass  <n>/<n> criteria
3 Code review .......... pass
4 Security / red team .. pass | n/a
5 Design / legal ....... pass | n/a
```
