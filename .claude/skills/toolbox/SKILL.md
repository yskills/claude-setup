---
name: toolbox
description: Pick and wire in the right tools for a project - plugins, MCP servers, APIs, libraries and extra skills - for any capability (video and audio editing, AI generation, LLM features, payments, ads, auth, email, analytics, social posting, mobile, scraping, 3D/games). Use when starting a new project or PRD, when adding a capability to an existing one, or when asked what an app needs.
---

# Toolbox

The global setup stays lean on purpose. Everything a specific kind of app needs is pulled into
that project only, from here.

## 1. List the capabilities

Break the app into capabilities, e.g. "paste a video, get social-ready clips" =
upload + storage, transcription, cutting, vertical reframe, captions and effects, AI copy,
export presets, optional auto-posting, payments, analytics.

## 2. Look them up

Read only the catalog files that match (each one is a short table with picks and how to add them):

| File | Covers |
|---|---|
| `catalog/video-audio.md` | editing, captions, reframing, programmatic video, AI video/image/voice/music, streaming, heavy processing |
| `catalog/ai.md` | Claude API features, agents, RAG and vectors, local models, LLM observability and cost |
| `catalog/money.md` | payments, subscriptions, in-app purchases, ads, EU VAT, German legal pages |
| `catalog/growth.md` | analytics, SEO, social publishing, email, marketing, A/B tests |
| `catalog/app-platform.md` | auth, databases, storage, jobs, realtime, mobile and desktop, hosting, docs/PDF |
| `catalog/data-web.md` | search, scraping, browser automation, 3D and games, maps |
| `catalog/claude-addons.md` | add-ons for Claude Code itself that videos push: token savers, model routers, rule packs |

Then search live, because tools change faster than the catalog (dated at the top of each file):

```
node <toolbox skill folder>/scripts/find.mjs video caption subtitle
```

It searches every installed plugin marketplace and all 293 ECC skills and prints install
commands. For anything still unclear, WebSearch "<capability> best API <current year>" and read
the vendor's docs (Context7) before choosing.

## 3. Choose

Per capability, prefer in this order: an official plugin or MCP server, a library that fits the
stack in the global CLAUDE.md, a hosted API. For each pick note: cost model, API key or OAuth,
license (e.g. Remotion is paid for companies over 3 people), DSGVO/GDPR impact, and whether it
runs in Cloudflare Workers or needs a container/server. Present the stack in the PRD as one
table; ask yskills only about picks that cost money or lock them in.

Anything from outside the official marketplace or ECC (a community plugin, a skill repo, an MCP
server from a video or post) gets read before it is installed: its scripts, hooks and MCP
config, what it sends where, and which env vars or files it reads. Skip it if anything is
unclear; agent skills shared online have shipped credential stealers.

## 4. Wire it into the project

Run from the project root:

- **Plugin:** `claude plugin install <name>@<marketplace> --scope project`
  (writes `.claude/settings.json`, so only this repo loads it).
- **MCP server:** `claude mcp add --scope project --transport http <name> <url>`
  (writes `.mcp.json`; OAuth ones are signed in with `/mcp`). Never put keys in `.mcp.json`;
  use `${ENV_VAR}` references and document them in `.env.example`.
- **ECC skill:** `node <toolbox skill folder>/scripts/add-skill.mjs <skill> [<skill>...]`
  (copies it into `.claude/skills/`, pinned to the ECC version this setup uses).
- **Library / CLI:** add to `package.json` or note the system tool (e.g. FFmpeg) in README and
  the CI workflow.

Then add a short **Tools** section to the project's `CLAUDE.md`: what each tool is for and which
env vars it needs. Start a new session (or `/reload-plugins`) so the additions load.

## 5. Keep it current

When a pick turns out wrong or a better tool appears, fix the catalog file in yskills/claude-setup
(`.claude/skills/toolbox/catalog/`) so the next project starts from the better answer.
