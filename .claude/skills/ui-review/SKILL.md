---
name: ui-review
description: Screenshot a running web app (or any URL) at phone and desktop size with headless Chromium, look at the images, and get a design-critic review. Use after any UI change, before opening a PR, and to capture design references.
---

# UI review

yskills' lasting likes and dislikes are in `TASTE.md` next to this file; the critic gets it with
the screenshots.

## 1. Run the app

Start the project's dev or preview server in the background (`npm run dev`, `npm run preview`,
`nuxt dev`...) and note its URL. Prefer a production build (`build` + `preview`) when the change
is about performance or final look. Fill pages with realistic data; an empty page hides problems.

## 2. Shoot

```
node <ui-review skill folder>/scripts/shoot.mjs --base http://localhost:3000 --out .shots / /pricing
```

- The phone size runs as a touch device, and each shot waits for one-shot animations to end.
- Each target is saved as `<page>-phone.png` (390x844 @2x) and `<page>-desktop.png` (1440x900).
- `--full` captures the whole scrolling page, `--only phone|desktop` skips one size,
  `--wait 1500` waits longer for animations or WebGL.
- Absolute URLs are shot as-is: that is how you capture a design reference site.
- Console errors are printed; treat each one as a bug unless you know it is expected.
- Playwright is found in the project, then globally; otherwise install it once with
  `npm i -g playwright && npx playwright install chromium`.
- Keep `.shots/` out of git (add it to `.gitignore`).

For a page behind a login, log in with a throwaway local account; never use or print real
credentials.

## 3. Review

1. Open every PNG yourself first.
2. Run `.claude/skills/impeccable/scripts/impeccable detect` on the changed source files (a local
   linter for AI-look anti-patterns, no LLM; scan files, not a URL, because URL scans can't start
   Chromium as root in cloud threads) and check the diff against the
   `web-interface-guidelines` skill. Fix what they flag.
3. Run the `design-critic` agent with the screenshot paths, and tell it to return its findings as
   its final text (a report "delivered as a message" can get lost). Fix every **blocking** finding and
   the cheap **polish** ones, then shoot again.
4. Attach the final phone and desktop screenshots to the PR description.
