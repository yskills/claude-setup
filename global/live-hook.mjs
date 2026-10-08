#!/usr/bin/env node
// PostToolUse hook for the Roblox Studio and Blender MCP tools: after Claude acts in one of them,
// capture that app's window (live-shot.ps1) so the newest frame is always on disk, ready for the
// `studio` skill to send to HQ. Windows only, at most one capture per app every MIN_GAP_MS, and
// prints nothing (no tokens spent).
import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const MIN_GAP_MS = 20_000 // a build step often fires several tool calls in a row; one frame per burst is enough
const CAPTURE_TIMEOUT_MS = 4_000 // under the hook's 5 s timeout
const APP_OF = [[/^mcp__Roblox_Studio__/, 'studio'], [/^mcp__Blender__/, 'blender']]

function main() {
  if (process.platform !== 'win32') return
  let input = {}
  try { input = JSON.parse(readFileSync(0, 'utf8') || '{}') } catch { return }
  const app = APP_OF.find(([re]) => re.test(String(input.tool_name ?? '')))?.[1]
  if (!app) return
  const stampPath = join(tmpdir(), `claude-live-${app}.stamp`)
  let last = 0
  try { last = Number(readFileSync(stampPath, 'utf8')) || 0 } catch {}
  if (Date.now() - last < MIN_GAP_MS) return
  writeFileSync(stampPath, String(Date.now()))
  const script = join(dirname(fileURLToPath(import.meta.url)), 'live-shot.ps1')
  // Waits for the capture (about a second): a detached child dies with the hook's job on Windows.
  // No pwsh or a minimised window: no frame, never a failed hook.
  spawnSync('pwsh', ['-NoProfile', '-NonInteractive', '-File', script, '-App', app], { stdio: 'ignore', windowsHide: true, timeout: CAPTURE_TIMEOUT_MS })
}

main()
