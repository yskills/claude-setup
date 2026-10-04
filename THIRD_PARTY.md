# Third-party content

## Everything Claude Code

Source: https://github.com/affaan-m/ECC (MIT, see licenses/ECC-LICENSE)
Version: 2.2.3
Commit: c05b2d6614f62f6db0047669aa4eefb223d478f9

Copied by scripts/sync-ecc.mjs from the list in config/ecc.json. Do not edit these by hand;
change config/ecc.json and re-run the script.

- skills/search-first
- skills/strategic-compact
- skills/security-review
- skills/context-budget
- skills/product-lens
- skills/market-research
- skills/vue-patterns
- skills/nuxt4-patterns
- skills/vite-patterns
- skills/api-design
- skills/database-migrations
- skills/e2e-testing
- skills/make-interfaces-feel-better
- skills/design-system
- skills/i18n-sync
- skills/seo
- skills/docker-patterns
- agents/planner
- agents/architect
- agents/code-reviewer
- agents/typescript-reviewer
- agents/vue-reviewer
- agents/security-reviewer
- agents/database-reviewer
- agents/build-error-resolver
- agents/e2e-runner
- agents/refactor-cleaner
- agents/silent-failure-hunter
- agents/doc-updater
- agents/a11y-architect
- agents/performance-optimizer
- agents/seo-specialist
- rules/ecc (common, typescript, vue, nuxt, web)

## Ponytail

Source: https://github.com/DietrichGebert/ponytail (MIT, see .claude/skills/ponytail/LICENSE)
Version: 4.10.3
Commit: c982cd411abb53323c4baa1baa3c2f020b8d0b08

Only the core skill is copied, unchanged: .claude/skills/ponytail/SKILL.md. Its hooks (which
re-inject the skill on every session start and subagent) and its five extra skills are left
out. Read in full before adding; it runs nothing and makes no network calls.

## Impeccable

Source: https://github.com/pbakaus/impeccable (Apache-2.0, see licenses/IMPECCABLE-LICENSE)
Version: skill 4.5.0
Commit: 6e802bd

Copied unchanged into .claude/skills/impeccable. Read before adding: the skill is instructions
plus reference files; `scripts/impeccable detect` downloads the engine binary from the project's
GitHub releases and checks its sha256 before running it. It sends no code anywhere.

## Vercel Web Interface Guidelines

Source: https://github.com/vercel-labs/web-interface-guidelines (MIT, see
licenses/WEB-INTERFACE-GUIDELINES-LICENSE)
Commit: e3d624b

The guideline text is pinned in .claude/skills/web-interface-guidelines/SKILL.md instead of
fetched live, so a review never needs a web read.
