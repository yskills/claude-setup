#!/usr/bin/env node
// Status line: model | repo:branch* | context bar
// Claude Code pipes session JSON on stdin (see https://code.claude.com/docs/en/statusline).
import { execFileSync } from 'node:child_process'
import { basename } from 'node:path'

let raw = ''
process.stdin.setEncoding('utf8')
process.stdin.on('data', (c) => { raw += c })
process.stdin.on('end', () => {
  let d = {}
  try { d = JSON.parse(raw) } catch {}
  const dir = d.workspace?.current_dir || d.cwd || process.cwd()
  const parts = [d.model?.display_name || 'Claude']

  let where = basename(dir)
  try {
    const git = (...a) => execFileSync('git', ['-C', dir, ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 800 }).trim()
    const branch = git('rev-parse', '--abbrev-ref', 'HEAD')
    const dirty = git('status', '--porcelain', '--untracked-files=no') ? '*' : ''
    where += ` ${branch}${dirty}`
  } catch {}
  parts.push(where)

  const left = d.context_window?.remaining_percentage
  if (typeof left === 'number') {
    const used = Math.max(0, Math.min(100, Math.round(100 - left)))
    const filled = Math.round(used / 10)
    const color = used >= 80 ? '\x1b[31m' : used >= 60 ? '\x1b[33m' : '\x1b[32m'
    parts.push(`${color}${'█'.repeat(filled)}${'░'.repeat(10 - filled)} ${used}%\x1b[0m`)
  }
  process.stdout.write(parts.join(' | '))
})
