# claude-setup

yskills' global Claude Code setup: one command makes every project on a machine use the same
rules, skills, agents, hooks and plugins. Built on
[Everything Claude Code](https://github.com/affaan-m/ECC) (the Anthropic hackathon winner's
setup), curated to this stack so it costs about a fifth of the context the full version does.

## Install

Needs Node 20+ (24 recommended), Git and Claude Code.

```bash
git clone https://github.com/yskills/claude-setup ~/claude-setup && node ~/claude-setup/install.mjs
```

Windows (PowerShell) is the same command with `$HOME` instead of `~`.

Update later:

```bash
git -C ~/claude-setup pull && node ~/claude-setup/install.mjs
```

Re-running is safe. Your old `~/.claude/CLAUDE.md` and `settings.json` are backed up to
`~/.claude/backups/` each time; your own notes in `CLAUDE.md` outside the managed block, your
own skills and agents, and settings keys this setup doesn't touch are kept.
Flags: `--dry-run`, `--skip-plugins`, `--skip-hooks`.

## What you get

| Piece | What | Where it comes from |
|---|---|---|
| `CLAUDE.md` | How Claude works for you: owns tasks end to end, verifies before pushing, screenshot-reviews UI, your default stack | `global/CLAUDE.md` |
| Settings | Auto permission mode, safe allow list, asks before force-push and deploys, never reads `.env` files, high effort, status line with context bar | `global/settings.json` |
| 15 plugins on | superpowers, frontend-design, code-review, security-guidance, TypeScript and Python LSP, Context7, Playwright, Chrome DevTools, commit-commands, code-simplifier, feature-dev, claude-md-management, claude-code-setup, skill-creator | official Anthropic marketplace, `config/plugins.json` |
| 7 plugins per project | Cloudflare, Firebase, Stripe, Sentry, PostHog, Supabase, Vercel: installed but off; a repo turns one on in its `.claude/settings.json` | same |
| 26 ECC skills | Vue, Nuxt 4, Vite, API design, security review, e2e, SEO, i18n, deep research, continuous learning... | `vendor/ecc`, list in `config/ecc.json` |
| 16 ECC agents | planner, architect, code/TS/Vue/Python/security/database reviewers, build-error-resolver, e2e-runner, a11y, performance, SEO... | `vendor/ecc` |
| ECC rules | common + TypeScript, Vue, Nuxt, web, Python (language rules load only for matching files) | `vendor/ecc/rules` |
| ECC hooks | session memory across restarts, quality gate after edits, design-quality warning, console.log and secret checks before commits, compaction hints | `npx ecc-universal@2.2.3` |
| Own skills | `onboard-project` (set a repo up for Claude in one PR), `ship-check` (run CI locally + self-review), `ui-review` (phone/desktop screenshots + critique) | `skills/` |
| Own agent | `design-critic`: reviews screenshots for the "looks AI" problem | `agents/` |

Measured in a fresh session: about 37k tokens of a 500k window before you type anything
(skills 9.9k, CLAUDE.md + rules 7.6k, agents 1.9k; MCP tools are deferred). The full ECC plugin
alone would add ~45k.

## Using it

- **New to a repo:** "onboard this project" runs `onboard-project`: a short `CLAUDE.md`,
  `.claude/settings.json` with the right per-project plugins, and a `verify` skill matching CI.
- **Before every push:** Claude runs `ship-check` on its own; ask for it any time.
- **UI work:** `ui-review` takes the screenshots, `design-critic` lists what to fix.
- **Your own Chrome:** start Claude Code with `claude --chrome` (needs the Claude in Chrome
  extension) when a page needs your login; Playwright covers everything headless.
- **Bigger features:** superpowers' brainstorm and plan skills, or `/feature-dev`.

## Changing it

- Rules for how Claude works: edit `global/CLAUDE.md`.
- Plugins: edit `config/plugins.json` (move one between `global` and `project`).
- ECC subset: edit `config/ecc.json`, check out that ECC version, run
  `node scripts/sync-ecc.mjs <ECC checkout>`.
- `node scripts/check.mjs` validates everything; CI runs it plus a full install into a
  throwaway home directory.

Research notes and sources behind these choices: [docs/RESEARCH.md](docs/RESEARCH.md).
