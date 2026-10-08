# Using Claude as your project manager

One page, made for a phone. Every number has its source; "not measured yet" means nobody has.

## Start an app

Write **one message** in the Company XY project, as short as you like: what it is, who it is for,
and what you would charge, if anything. Or tap the notepad in HQ. That is all. You do not name
files, tools or models.

## What happens next

1. **Brainstorm.** Claude says what it would build instead, pushes back with reasons, then sends
   one batch of tap cards. Answer once.
2. **Research, plan.** Market, prices, law, tools. Result: `PLAN.md` and the acceptance criteria.
3. **Brief (a): ok or no.** The first thing you get. Your one job there: create the private repo
   (threads cannot).
4. **Build.** One thread per slice. Every change is a PR that a separate gate thread checks
   (CI, a live test of the preview, a fresh review, security, design and law). At 5/5 it **merges
   itself**, and the thread says `Done: <what changed>`.
5. **Launch and after.** The loop reads errors and feedback every day (`docs/LOOP.md`).

You see threads, cards, PR links, `Done:` lines and the HQ rows (`docs/hq-rows.md`).
Cards show options with one recommended; work continues on it at once.

## When Claude asks you

Only for: real money (live key, purchase, ads), mail or posts sent, deleting data, force-push,
rotating a secret, a choice with no clear default, design input (a look, an asset), or a step
only you can do. Everything else it just does and tells you.
Home of the rule: `CLAUDE.md` (How to work).

You get a notification only when needed, plus big milestones.
Say "stop" or "pause" and everything stops; a look you reject stays rejected.

## What stays with you, and why

| Step | Why Claude can't |
|---|---|
| Create the repo (and, for a new app, the Cloudflare import click) | Cloud threads get a 403 on creating repos and can't reach Cloudflare's settings (audit/AUDIT.md, 2026-10-07; still true 2026-10-08) |
| Delete a branch, re-run Actions, CLAUDE.md edits | Cloud threads get a 403 on branch deletes and Actions re-runs, and the safety check refuses CLAUDE.md edits and secret reads (rechecked 2026-10-08); a PC session deletes branches; CLAUDE.md edits need your Allow |
| Keys and tokens | They live in GitHub and the Worker, never in chat |
| Real money: Stripe live, ads, Gewerbe, domain | Legal and money steps need your name and hands |
| Web accounts (Roblox, Cloudflare) | Claude Code's safety check blocks them |
| The laptop | It must be on; Remote Control only runs while it is |

## What it costs

| Item | Number | Source |
|---|---|---|
| Claude itself | your Max plan (about 90 €/month); no per-message euros. When the usage window fills, threads wait and resume by themselves | memory, 2026-10-07 |
| API calls (the laptop worker's Haiku) | billed apart from the plan; set a monthly limit | `yskills/worker` PR 4 |
| Always loaded in a session | ~6k tokens from this repo | STRUCTURE.md |
| A project thread starts at | ~110k tokens, ~104k of it harness and memory outside this repo | STRUCTURE.md |
| Hand-off | warns at 150k, hand off by 200k | `global/context-guard.mjs` |
| Hosting, all apps together | Cloudflare 0 to 4,35 €/month, even at 10,000 users | research/hosting.md |
| The daily loop check | no euros: one short turn on the plan | not measured in tokens yet |
| Example of waste | fanning out several threads before anything was visible cost about 10 € of tokens in test run 1 | operator `SKILL.md` |
| Cost per finished app | not measured yet | |

Keep it cheap: one app at a time, at most three working threads, ask for a first visible result
before more.
