#!/usr/bin/env bash
# Setup script for Claude cloud environments (project threads).
# Paste it into Project settings > Cloud environment > Setup script. It installs the global
# plugins from config/plugins.json at user scope (minus those marked "cloud": false), so they load in every thread, whichever
# repo the thread runs in. scripts/check.mjs fails if this list drifts from config/plugins.json.
set -u

claude plugin marketplace add anthropics/claude-plugins-official || echo "claude-setup: marketplace anthropics/claude-plugins-official failed"
claude plugin marketplace add anthropics/skills || echo "claude-setup: marketplace anthropics/skills failed"
for id in \
  superpowers@claude-plugins-official \
  frontend-design@claude-plugins-official \
  security-guidance@claude-plugins-official \
  typescript-lsp@claude-plugins-official \
  pyright-lsp@claude-plugins-official \
  playwright@claude-plugins-official \
  commit-commands@claude-plugins-official \
  code-simplifier@claude-plugins-official \
  feature-dev@claude-plugins-official \
  claude-md-management@claude-plugins-official \
  claude-code-setup@claude-plugins-official
do
  claude plugin install "$id" --scope user || echo "claude-setup: could not install $id"
done

# Built-in subagents (Explore, general-purpose) default to Sonnet instead of inheriting Opus;
# agents with their own `model:` keep it. Same key as global/settings.json.
node -e '
const fs = require("fs"), p = require("os").homedir() + "/.claude/settings.json"
let s = {}; try { s = JSON.parse(fs.readFileSync(p, "utf8")) } catch {}
s.env = { ...(s.env || {}), CLAUDE_CODE_SUBAGENT_MODEL: "sonnet" }
fs.mkdirSync(require("path").dirname(p), { recursive: true }); fs.writeFileSync(p, JSON.stringify(s, null, 2))
' || echo "claude-setup: could not set CLAUDE_CODE_SUBAGENT_MODEL"
