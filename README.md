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
Flags: `--dry-run`, `--skip-plugins`, `--skip-hooks`. At the end it lists useful command-line
tools that are missing (gh, ffmpeg, docker, python, uv, fnm) with the install command for your OS.

## What you get

| Piece | What | Where it comes from |
|---|---|---|
| `CLAUDE.md` | How Claude works for you: owns tasks end to end, verifies before pushing, screenshot-reviews UI, your default stack | `CLAUDE.md` |
| Settings | Auto permission mode, safe allow list, asks before force-push and deploys, never reads `.env` files, high effort, status line with context bar | `global/settings.json` |
| 13 plugins on | superpowers, frontend-design, security-guidance, TypeScript and Python LSP, Context7, Playwright, commit-commands, code-simplifier, feature-dev, claude-md-management, claude-code-setup, skill-creator (`/code-review` and the `claude-api` skill are built into Claude Code now) | Anthropic's official marketplace, `config/plugins.json` |
| 7 plugins per project | Cloudflare, Firebase, Stripe, Sentry, PostHog, Supabase, Vercel: installed but off; a repo turns one on in its `.claude/settings.json` | same |
| 17 ECC skills | Vue, Nuxt 4, Vite, API design, security review, e2e, SEO, i18n... | `.claude/skills`, list in `config/ecc.json` |
| 15 ECC agents | planner, architect, code/TS/Vue/security/database reviewers, build-error-resolver, e2e-runner, a11y, performance, SEO... | `.claude/agents` |
| ECC rules | common + TypeScript, Vue, Nuxt, web (language rules load only for matching files) | `.claude/rules/ecc` |
| ECC hooks | session memory across restarts, quality gate after edits, design-quality warning, console.log and secret checks before commits, compaction hints (PC only: cloud threads don't run hooks) | `npx ecc-universal@2.2.3` |
| Toolbox | Knows which plugins, APIs and skills any kind of app needs (video, AI, payments, ads, auth, email, analytics, mobile, scraping...), searches all ~315 plugins, 293 ECC skills and skills.sh live (and points cloud threads at the Anthropic Directory), and adds them to that one project | `.claude/skills/toolbox` |
| Own skills | `operator` (idea to live app: sizes the job, staffs research/legal/design/build/QA/red team/launch/marketing, acceptance criteria before building, a 5/5 gate on every PR, three ok/no briefs, one merge tap per PR), `legal` (German law for any app, privacy scan of a preview, license and trademark checks), `onboard-project` (set a repo up for Claude in one PR), `publish` (deploys through Cloudflare Workers Builds with a preview per branch, no keys in GitHub), `ship-check` (run CI locally, then fresh `code-reviewer` passes until clean), `ui-review` (phone/desktop screenshots + critique), `sell` (checkout, shop and shipping from Germany: keys, tested Stripe-on-Workers code, German shop law, go-live), `market` (marketing plan in the PRD, launch, channels, German advertising law, weekly report), `watch` (watch a video or reel: frames plus transcript; vendored from claude-video, MIT) | `.claude/skills` |
| Own agents | `design-critic` (reviews screenshots for the "looks AI" problem), `evaluator` (clicks through a preview and grades a slice against its criteria), `legal-reviewer` (German must-haves on a preview), `red-team` (attacks your own preview like an outsider) | `.claude/agents` |
| Design taste | `impeccable` (design skill plus a local `detect` linter for AI-look patterns) and `web-interface-guidelines` (Vercel's UI checklist); `ui-review` runs both | `.claude/skills` (Apache-2.0 and MIT, see `THIRD_PARTY.md`) |
| Ponytail | Write the least code that works: reuse, standard library, platform, installed dependency, one line, then new code | `.claude/skills/ponytail` (MIT, see `THIRD_PARTY.md`) |


## Project threads (cloud)

Threads in a Claude project run in the cloud, not on your machine. Add this repo to the
project (Project settings, Repositories) and every thread loads `CLAUDE.md` and all skills,
agents and rules from `.claude/`, the same files the installer copies.

Per project, once: install the Claude GitHub App on
[all repositories](https://github.com/apps/claude/installations/select_target) so new project
repos are reachable, then in Project settings set **Thread model** Sonnet and **Thread effort** medium
(the default is Opus at high effort), and paste
[`operator/templates/project-instructions.md`](.claude/skills/operator/templates/project-instructions.md)
into Project instructions.

Plugins and network need a [cloud environment](https://code.claude.com/docs/en/cloud-environments)
(Project settings > Cloud environment > Add cloud environment). Pick the same one in every
project that uses this setup.

- **Setup script:** paste [`cloud/setup.sh`](cloud/setup.sh). It installs 11 of the 13 global
  plugins at user scope (Context7 and skill-creator stay on the PC: Context7 asks for a sign-in a
  thread can't do, and threads have Anthropic's skill-creator built in) and makes built-in
  subagents default to Sonnet. The result is cached and rebuilt about weekly, so threads don't
  pay for it each time. Plugin tools connect a few seconds after a thread starts.
- **Network access:** Custom, tick "Also include default list of common package managers", and
  add:
  - `cdn.jsdelivr.net`, `unpkg.com` (CDN scripts, e.g. GSAP for HyperFrames)
  - `*.yskills.workers.dev` (your own live sites and branch previews, so threads can open and
    screenshot what they deployed; blocked otherwise)
  - `*.youtube.com`, `*.googlevideo.com`, only if threads work on video
- **No deploy keys here.** Cloudflare Workers Builds deploys `main` and gives every other branch
  its own preview (the `publish` skill); GitHub only runs `verify` and holds no keys. Threads never
  deploy themselves: `wrangler deploy` through the cloud proxy fails, because the proxy replaces
  Workers' asset-upload token (401). Optional: a Stripe *test* key as an API credential
  for `api.stripe.com` (Pro/Max plans); the proxy adds it and Claude never sees it.

On your PC, `global/settings.json` lets Claude read the official docs of your stack (Nuxt, Vue,
Cloudflare, Stripe, GitHub, MDN, German law texts...) without asking each time. Cloud threads
still ask before opening a link nobody posted in the chat. That check belongs to the cloud
service, and whether these settings skip it there is untested.

## Using it

- **New idea:** just describe it. The `operator` skill sizes it, researches, plans and builds it, and sends you three ok/no briefs plus one merge tap per PR; `toolbox` adds the tools to that project only.
- **New to a repo:** "onboard this project" runs `onboard-project`: a short `CLAUDE.md`,
  `.claude/settings.json` with the right per-project plugins, and a `verify` skill matching CI.
- **Before every push:** Claude runs `ship-check` on its own; ask for it any time.
- **UI work:** `ui-review` takes the screenshots, `design-critic` lists what to fix.
- **Your own Chrome:** start Claude Code with `claude --chrome` (needs the Claude in Chrome
  extension) when a page needs your login; Playwright covers everything headless.
- **Bigger features:** superpowers' brainstorm and plan skills, or `/feature-dev`.

## Changing it

- Rules for how Claude works: edit `CLAUDE.md`.
- Plugins: edit `config/plugins.json` (move one between `global` and `project`).
- ECC subset: edit `config/ecc.json`, check out that ECC version, run
  `node scripts/sync-ecc.mjs <ECC checkout>`.
- `node scripts/check.mjs` validates everything; CI runs it plus a full install into a
  throwaway home directory.

Research notes and sources behind these choices: [docs/RESEARCH.md](docs/RESEARCH.md).
The roadmap every new project follows: [docs/WORKFLOW.md](docs/WORKFLOW.md). The practice runs
before the first real one: [docs/TEST-PROJECTS.md](docs/TEST-PROJECTS.md).
