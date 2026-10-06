import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Preview, RoleId, Run, TurnCost } from '../types'

// yskills' digital team, drawn from what Claude Code already does: the session itself is the
// Project Manager, each subagent it starts is a teammate in a role. A band above the prompt shows who is
// working; /team opens a pane with each role's task and a Watch link to what is being built.
const runs = atom({ plugin: 'team', key: 'runs' } as const, [] as Run[])
const isLeadWorking = atom({ plugin: 'team', key: 'isLeadWorking' } as const, false)
const preview = atom({ plugin: 'team', key: 'preview' } as const, null as Preview | null)
const last = atom({ plugin: 'team', key: 'last' } as const, null as TurnCost | null)

const PANE = 'team'
const KEPT_RUNS = 40

// The nine roles HQ and the thread titles use. The session itself is the Project Manager.
export const ROLES: { id: RoleId; name: string; agents: RegExp }[] = [
  { id: 'pm', name: 'Project Manager', agents: /^planner$|^architect$|^plan$/i },
  { id: 'researcher', name: 'Researcher', agents: /^$/ },
  { id: 'designer', name: 'Designer', agents: /design-critic|a11y/i },
  { id: 'programmer', name: 'Programmer', agents: /^$/ },
  { id: 'tester', name: 'Tester', agents: /evaluator|e2e/i },
  { id: 'reviewer', name: 'Reviewer', agents: /code-reviewer|typescript-reviewer|vue-reviewer|database-reviewer|silent-failure/i },
  { id: 'security', name: 'Security', agents: /security|red-team/i },
  { id: 'legal', name: 'Legal', agents: /legal/i },
  { id: 'marketer', name: 'Marketer', agents: /seo/i },
]

const RESEARCH = /^researcher|research|competitor/i

export function roleOf(agent: string, description = ''): RoleId {
  // Security and legal first so "security-reviewer" and "legal-reviewer" don't land in Reviewer;
  // anything unknown is a Programmer.
  for (const id of ['security', 'legal', 'designer', 'tester', 'reviewer', 'marketer', 'pm'] as const) {
    if (ROLES.find(r => r.id === id)!.agents.test(agent)) return id
  }
  return RESEARCH.test(description) ? 'researcher' : 'programmer'
}

// A dev server, a Worker preview or a page the test browser opened: what the team is building.
const PREVIEW_URL = /https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?[^\s'"<>)]*|https:\/\/[\w.-]+\.workers\.dev[^\s'"<>)]*/
export const findPreview = (text: string) => text.match(PREVIEW_URL)?.[0]?.replace(/[.,;:]+$/, '')

const k = (n: number) => `${Math.round(n / 1000)}k`
// The band and the pane must never hold up Claude's work: a failed write leaves old rows showing.
const quiet = () => undefined

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'team', description: 'Show your team: who works on what, and a Watch link' })
    return next(e)
  })

  on('command.run', { command: 'team' }, async $ => {
    await $.ui.open({ id: PANE, title: 'Team' })
    return { text: 'Team pane opened.' }
  })

  on('prompt.submit', async ($, e, next) => {
    await update($, runs, list => list.filter(r => !r.isDone)).catch(quiet)
    await update($, isLeadWorking, () => true).catch(quiet)
    return next(e)
  }).catch(($, e, next) => next(e))

  on('agent.spawn', async ($, e, next) => {
    const result = await next(e)
    if (result.agentId) {
      const agent = e.subagentType || 'general-purpose'
      const run: Run = { id: result.agentId, role: roleOf(agent, e.description), agent, task: e.description, isDone: false }
      await update($, runs, list => [...list, run].slice(-KEPT_RUNS)).catch(quiet)
    }
    return result
  }).catch(($, e, next) => next(e))

  on('tool.call', async ($, e, next) => {
    const ran = await next(e)
    // Only the test browser and a command that starts a server (dev, preview, wrangler) set it,
    // so a curl or a test log doesn't move the Watch link.
    const isServer = e.tool === 'Bash' && /\b(dev|preview|serve|start|wrangler)\b/.test(String((e as { command?: unknown }).command ?? ''))
    const url =
      e.tool.endsWith('browser_navigate') && typeof (e as { url?: unknown }).url === 'string'
        ? (e as { url: string }).url
        : isServer && !ran.deny ? findPreview(ran.text ?? '') : undefined
    if (url) await update($, preview, () => ({ url, from: e.tool === 'Bash' ? 'dev server' : 'test browser' })).catch(quiet)
    return ran
  }).catch(($, e, next) => next(e))

  on('turn.complete', async ($, e, next) => {
    if (e.agentId) {
      await update($, runs, list => list.map(r => (r.id === e.agentId ? { ...r, isDone: true } : r))).catch(quiet)
      const run = (await read($, runs)).find(r => r.id === e.agentId)
      if (run) $.ui.toast(`${ROLES.find(r => r.id === run.role)?.name}: finished ${run.task}`)
    } else {
      await update($, isLeadWorking, () => false).catch(quiet)
      if (e.usage) {
        const u = e.usage
        const cost: TurnCost = {
          tokens: u.input_tokens + u.cache_read_input_tokens + u.cache_creation_input_tokens + u.output_tokens,
          cacheRead: u.cache_read_input_tokens,
        }
        await update($, last, () => cost).catch(quiet)
      }
    }
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const list = await read($, runs)
    const lead = await read($, isLeadWorking)
    const cost = await read($, last)
    if (e.props.hasSurvey || (list.length === 0 && cost === null)) return next(e)

    const { Box, Text } = $.ui.resolve(e)
    const busy = new Set(list.filter(r => !r.isDone).map(r => r.role))
    if (lead) busy.add('pm')
    const shown = ROLES.filter(r => busy.has(r.id) || list.some(x => x.role === r.id))

    return (
      <Box flexDirection="column">
        <Text>
          {shown.map(r => `${busy.has(r.id) ? '●' : '○'} ${r.name}`).join('   ')}
          <Text dimColor>   /team for details</Text>
        </Text>
        {cost && (
          <Text dimColor>
            Last turn: {k(cost.tokens)} tokens, {k(cost.cacheRead)} of them re-read context
          </Text>
        )}
      </Box>
    )
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Link } = $.ui.resolve(e)
    const list = await read($, runs)
    const lead = await read($, isLeadWorking)
    const live = await read($, preview)

    return (
      <Box flexDirection="column">
        {ROLES.map(role => {
          const mine = list.filter(r => r.role === role.id)
          const now = mine.filter(r => !r.isDone)
          const isWorking = role.id === 'pm' ? lead || now.length > 0 : now.length > 0
          const task = now[0]?.task ?? (role.id === 'pm' ? (lead ? 'Working on your request' : 'Waiting for you') : mine.at(-1)?.task)
          return (
            <Box key={role.id} flexDirection="column" marginBottom={1}>
              <Text bold={isWorking} dimColor={!isWorking}>
                {isWorking ? '●' : '○'} {role.name}
                {now.length > 1 ? ` (${now.length})` : ''}
              </Text>
              <Text dimColor>  {task ?? 'idle'}{!isWorking && mine.length > 0 && role.id !== 'pm' ? ' (done)' : ''}</Text>
            </Box>
          )
        })}
        {live ? (
          <Text>
            Watch ({live.from}): <Link href={live.url} label={live.url} />
          </Text>
        ) : (
          <Text dimColor>Watch: nothing running yet. A dev server or the test browser shows up here.</Text>
        )}
      </Box>
    )
  })
}
