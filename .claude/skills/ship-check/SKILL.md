---
name: ship-check
description: Run the checks CI runs, then review your own diff like a strict reviewer, before any push or PR update. Use whenever work is about to be committed, pushed, or called done.
---

# Ship check

## 1. Find what CI runs

In order of preference:

1. A repo skill named `verify` (`.claude/skills/verify/SKILL.md`): follow it and stop here.
2. A `verify`, `check`, `ci` or `ship` script in `package.json` (skip the deploy part of `ship`).
3. The steps in `.github/workflows/*.yml` that run on `pull_request`.
4. Otherwise whatever exists of: lint, typecheck (`vue-tsc --noEmit`, `tsc --noEmit`,
   `nuxt typecheck`, `pyright`), tests (`vitest run`, `npm test`, `pytest`), build.

Run them. If one fails, fix the cause and rerun; never skip, disable or loosen a check to get
green. If the repo has none of this, say so and suggest adding a `verify` script.

## 2. Review the diff

`git diff origin/HEAD...` (or against the base branch). Read it as a reviewer who wants to
reject it:

- Secrets, tokens, personal data, real emails in code, tests, fixtures or screenshots? `.env`
  files staged? `VITE_*` / `NUXT_PUBLIC_*` holding anything secret?
- Outside text (web, mail, user input) reaching SQL, a shell, a file path, `v-html`/`innerHTML`,
  or a model's system prompt?
- New routes without auth, write routes without CSRF protection where the app uses cookies?
- Leftover `console.log`, debug flags, commented-out code, TODOs you introduced?
- Tests for the new behavior? Did they fail before the change?
- Anything unrelated to the task? Move it to its own PR.

For changes touching auth, payments, tools or connectors, also run the `security-reviewer`
agent. For UI changes, run the `ui-review` skill.

## 3. Push

Push only when everything above is clean. After pushing, watch CI and fix what it finds; checks
you could not run locally (Docker builds, secret scanners, deploy previews) still count.
