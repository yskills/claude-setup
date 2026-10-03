# Research behind this setup (2026-10-03)

## The base: Everything Claude Code

"The hackathon winner" is Affaan Mustafa's Everything Claude Code (now `affaan-m/ECC`, v2.2.3,
MIT). It won an Anthropic hackathon and is the most-starred Claude Code setup.
Sources: [36kr](https://eu.36kr.com/en/p/3823966768943239),
[Augment](https://www.augmentcode.com/learn/everything-claude-code-github),
[ROBOCO](https://roboco.io/en/posts/everything-claude-code-distilled/).

Measured with `claude plugin details ecc@ecc`: the full plugin has 387 skills and 68 agents and
adds **~44.8k tokens to every session**, mostly for stacks yskills doesn't use (Kotlin, Laravel,
healthcare, supply chain...). Plugin skills can't be switched off one by one (`skillOverrides`
ignores plugin skills), so this repo vendors a curated subset (`config/ecc.json`) and installs
ECC's hook runtime through its own installer. Hook changes from ECC's defaults:

- GateGuard off: it blocks the first edit and command of each session until Claude restates
  facts; slow for an owner who wants things done.
- tmux reminders and dev-server rewriting off: they assume tmux, which Windows and VS Code
  setups usually lack.

## Plugins

All from the official marketplace `claude-plugins-official` (auto-added by Claude Code, ~315
plugins). Always-on token costs were measured with `claude plugin details`; see
`config/plugins.json`. Notable calls:

- **superpowers** is the most broadly endorsed methodology plugin and the only community one in
  the official marketplace. It covers TDD and planning, so ECC's `tdd-workflow` is left out.
- **pr-review-toolkit** (2k tokens) overlaps `code-review` + ECC reviewers: left out.
- **mattpocock-skills** (1.6k tokens, 25 skills) overlaps superpowers: left out; easy to add.
- **posthog** costs ~30k tokens always-on, so it and the other product plugins (Stripe,
  Cloudflare, Sentry, Firebase, Supabase, Vercel) are installed but off, enabled per project.
- `chrome-devtools-mcp` is the correct plugin name (some blogs say `chrome-devtools`).

Sources: [Anthropic marketplaces](https://code.claude.com/docs/en/plugins/anthropic-marketplaces),
[discover plugins](https://code.claude.com/docs/en/discover-plugins),
[ZTM](https://zerotomastery.io/blog/best-claude-code-plugins/),
[composio](https://composio.dev/content/top-claude-code-plugins),
[turbodocx](https://www.turbodocx.com/blog/best-claude-code-skills-plugins-mcp-servers).

## MCP servers

MCP tools are deferred by default (tool search), so they cost little until used. Context7,
Playwright and Chrome DevTools come in through their plugins. Remote servers for later
products, all OAuth via `/mcp`: Stripe `https://mcp.stripe.com`, Sentry
`https://mcp.sentry.dev/mcp`, Vercel `https://mcp.vercel.com`, PostHog
`https://mcp.posthog.com/mcp`, Supabase `https://mcp.supabase.com/mcp`, Linear
`https://mcp.linear.app/mcp`. GitHub MCP needs a personal access token; the `gh` CLI covers the
same ground without one, so it is not installed.
Source: [MCP docs](https://code.claude.com/docs/en/mcp).

## Browser

- **Your own Chrome:** Claude in Chrome extension (v1.0.36+), then `claude --chrome`; `/chrome`
  for status and "enabled by default". Shares your logged-in sessions; needs a Pro/Max/Team plan
  login (not an API key); not under WSL.
  [Docs](https://code.claude.com/docs/en/chrome)
- **Headless / separate Chrome:** Playwright MCP (screenshots, e2e) and Chrome DevTools MCP
  (console, network, performance traces).

## Settings

- `permissions.defaultMode: "auto"` (a classifier approves safe actions; default since v2.1.283;
  only honored in user settings). [Docs](https://code.claude.com/docs/en/permission-modes)
- `effortLevel: "high"`, `alwaysThinkingEnabled: true`.
- Best-practice notes applied in `global/CLAUDE.md`: keep it short, give Claude a way to verify
  its work, `/clear` between tasks, subagents for big reads.
  [Docs](https://code.claude.com/docs/en/best-practices)

## Videos

YouTube pages and transcript sites were blocked from this environment (403/429), so no
transcript was read. Found but not watched: "Claude Code Official Plugins: Stop Wasting Setup
Time on the Wrong Tools", "Claude Code Setup That Actually Works", "Matt Pocock's EXACT System
To 10x Your Claude Skills". One video ("Top 5 Claude Code Plugins", Nick Automates) was read via
its [written version](https://justbeingresourceful.com/2026/08/21/5-claude-code-plugins-worth-installing-in-2026-and-the-fine-print-on-the-unlimited-tokens-claim/);
its picks: claude-code-setup (included), claude-mem (ECC's session hooks cover this), Headroom,
OmniRoute (its "unlimited tokens" claim is misleading).
