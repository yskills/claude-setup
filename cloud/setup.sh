#!/usr/bin/env bash
# Setup script for Claude cloud environments (project threads).
# Paste it into Project settings > Cloud environment > Setup script. It installs the global
# plugins from config/plugins.json at user scope (minus those marked "cloud": false), so they load in every thread, whichever
# repo the thread runs in. scripts/check.mjs fails if this list drifts from config/plugins.json.
set -u

claude plugin marketplace add anthropics/claude-plugins-official || echo "claude-setup: marketplace anthropics/claude-plugins-official failed"
for id in \
  superpowers@claude-plugins-official \
  frontend-design@claude-plugins-official \
  security-guidance@claude-plugins-official \
  typescript-lsp@claude-plugins-official \
  pyright-lsp@claude-plugins-official \
  playwright@claude-plugins-official \
  commit-commands@claude-plugins-official
do
  claude plugin install "$id" --scope user || echo "claude-setup: could not install $id"
done

# Built-in subagents (Explore, general-purpose) default to Sonnet instead of inheriting Opus;
# agents with their own `model:` keep it. Same key as global/settings.json.
node -e '
const fs = require("fs"), p = require("os").homedir() + "/.claude/settings.json"
let s = {}; if (fs.existsSync(p)) s = JSON.parse(fs.readFileSync(p, "utf8"))
s.env = { ...(s.env || {}), CLAUDE_CODE_SUBAGENT_MODEL: "sonnet" }
fs.mkdirSync(require("path").dirname(p), { recursive: true }); fs.writeFileSync(p, JSON.stringify(s, null, 2))
' || echo "claude-setup: could not set CLAUDE_CODE_SUBAGENT_MODEL"

# Context guard: the same file as global/context-guard.mjs (scripts/check.mjs keeps them equal),
# run after every tool call so long threads get told to work leaner and then to hand off.
mkdir -p "$HOME/.claude/claude-setup"
cat > "$HOME/.claude/claude-setup/context-guard.mjs" <<'GUARD'
#!/usr/bin/env node
// PostToolUse hook: every tool call re-sends the whole context, so a long session pays for its
// size again on each call (cache reads were 98% of our usage). At WARN tokens of absolute context,
// tell Claude once to work leaner; at HANDOFF, to wrap up and leave the rest to a fresh session,
// and again every REFIRE tokens after that. Silent otherwise; never blocks.
import { closeSync, existsSync, openSync, readFileSync, readSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const WARN = Number(process.env.CLAUDE_SETUP_CONTEXT_WARN) || 150_000
const HANDOFF = Number(process.env.CLAUDE_SETUP_CONTEXT_HANDOFF) || 200_000
const REFIRE = 50_000 // after the hand-off, nag again every further REFIRE tokens
const CHUNK = 256 * 1024

const size = (u) => (u.input_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0)

function usages(text) {
  const out = []
  for (const line of text.split('\n')) {
    try {
      const u = JSON.parse(line).message?.usage
      if (u) out.push(size(u))
    } catch {} // the chunk's cut-off first or last line
  }
  return out.filter((n) => n > 0)
}

function tail(path) {
  const fd = openSync(path, 'r')
  try {
    const len = statSync(path).size
    const n = Math.min(CHUNK, len)
    const buf = Buffer.alloc(n)
    readSync(fd, buf, 0, n, len - n)
    return buf.toString('utf8')
  } finally { closeSync(fd) }
}

let raw = ''
process.stdin.setEncoding('utf8')
process.stdin.on('data', (c) => { raw += c })
process.stdin.on('end', () => {
  try {
    const { session_id: id = 'unknown', transcript_path: path } = JSON.parse(raw || '{}')
    if (!path || !existsSync(path)) return
    const stateFile = join(tmpdir(), `claude-context-guard-${String(id).replace(/[^\w-]/g, '')}.json`)
    const state = existsSync(stateFile) ? JSON.parse(readFileSync(stateFile, 'utf8')) : { fired: [] }
    const seen = usages(tail(path))
    const now = seen.at(-1)
    if (!now) return
    const k = (n) => `${Math.round(n / 1000)}k`
    // Absolute floors: a cold start already carries ~100k+ in project threads, so growth since the
    // first call hides the real size. Warn once at WARN, hand off at HANDOFF, then again every REFIRE.
    const next = state.next ?? HANDOFF
    let msg = ''
    if (now >= next) {
      msg = `Context guard: this session's context is ${k(now)} tokens and every tool call re-reads all of it. Finish the current step, write the state (PROGRESS.md, the PR or the thread's reply), and leave further work to a fresh session or thread instead of continuing here.`
      state.next = Math.max(next, Math.floor(now / REFIRE) * REFIRE) + REFIRE
      state.fired.push('warn', 'handoff')
    } else if (now >= WARN && !state.fired.includes('warn')) {
      msg = `Context guard: this session's context is ${k(now)} tokens and every tool call re-reads all of it. Batch independent calls, trim command output (tail, head, --quiet), and hand big reads or searches to a subagent that returns only the answer.`
      state.fired.push('warn')
    }
    writeFileSync(stateFile, JSON.stringify(state))
    if (msg) process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: msg } }))
  } catch {
    // A guard must never break a tool call.
  }
})
GUARD
node -e '
const fs = require("fs"), p = require("os").homedir() + "/.claude/settings.json"
const s = fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : {}
// Prefer the guard from a claude-setup checkout in the thread, so a change to it reaches every
// thread without pasting this script again; the copy above is the fallback.
const home = require("os").homedir()
const cmd = `for f in /home/user/claude-setup/global/context-guard.mjs /home/claude/claude-setup/global/context-guard.mjs "${home}/.claude/claude-setup/context-guard.mjs"; do [ -f "$f" ] && exec node "$f"; done`
s.hooks = s.hooks || {}
s.hooks.PostToolUse = (s.hooks.PostToolUse || []).filter((h) => !JSON.stringify(h).includes("context-guard.mjs"))
s.hooks.PostToolUse.push({ matcher: "*", hooks: [{ type: "command", command: cmd, timeout: 5 }] })
fs.writeFileSync(p, JSON.stringify(s, null, 2))
' || echo "claude-setup: could not add the context guard hook"
