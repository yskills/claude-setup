---
name: one-shot
description: Take a feature or a whole new project from one request to a verified result without the owner having to say "do this again". Asks every question once up front, writes testable acceptance criteria, builds, and checks the result against every criterion (tests, screenshots, review) before reporting. Use for any request bigger than a small fix, and whenever yskills says build, make, create or set up something.
---

# One-shot

Most "do this again" rounds come from three gaps: a misunderstood ask, a half-checked result,
and the same mistake repeated later. This workflow closes all three.

## 1. Understand once

- Read what exists first: the repo's `CLAUDE.md`, design doc, similar features, and for a new
  project the default stack in the global `CLAUDE.md`.
- Find every open question that would change the result. Ask them **all in one message**,
  each with your recommended answer, so yskills can reply "ok" or change one line. Skip
  questions with an obvious default; state the default instead.
- For a vague idea, run superpowers' `brainstorming` first; for a product idea, `product-lens`.

## 2. Write the contract

Write `docs/specs/<feature>.md` (or the PR description for small work) with:

- **Goal** in one sentence, from the owner's point of view.
- **Acceptance criteria**: a numbered list of observable checks, each one something a test,
  a command or a screenshot can prove. Include phone layout, empty/error/loading states,
  German and English text, and "CI green".
- **Out of scope**, so nothing grows silently.

For big work, turn it into a plan with superpowers' `writing-plans` and execute it with
`subagent-driven-development`.

## 3. Build

Small vertical slices, each runnable. Write tests alongside (TDD where the logic is
non-trivial). Use Context7 for library APIs instead of memory, and `search-first` before
writing anything a package already does.

## 4. Prove every criterion

Before saying anything is done:

1. Run `ship-check` (everything CI runs).
2. For UI: `ui-review` at phone and desktop, then `design-critic`; fix blocking findings.
3. Go through the acceptance criteria one by one and mark each **pass** with its evidence
   (test name, command output, screenshot). A criterion without evidence is not passed.
4. Run the `code-reviewer` agent (plus `security-reviewer` for auth, payments, user input) on
   the diff and fix what it finds.
5. Loop until every criterion passes. If one cannot pass, say exactly why instead of hiding it.

## 5. Report

One short message: what was built, the link (PR, preview URL), screenshots, the criteria table,
and anything yskills must do (secrets, approvals, DNS). Nothing they have to check by hand that
you could have checked.

## 6. Learn

When yskills corrects something or asks for a redo, fix it, then write the lesson down so it
never happens again: a line in the project's `CLAUDE.md` (project-specific) or a note to update
the global `CLAUDE.md` in yskills/claude-setup (applies everywhere). Prefer a check (test, lint
rule, hook) over a sentence when the mistake can be caught automatically.
