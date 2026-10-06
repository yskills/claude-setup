import { expect, test } from 'claude-code/testing'

import { findPreview, roleOf } from './register'

// Only the props the band and pane read; the rest don't matter here.
const BAND = { component: 'AbovePrompt', props: { hasSurvey: false, isWorking: true, maxRows: 4 } as never } as const
const PANE = { component: 'Pane', requestId: 'team', props: {} as never } as const
const turn = { answer: '', durationMs: 1000, isAborted: false, reason: 'answer' } as const
const usage = { model: 'test', input_tokens: 2, output_tokens: 1000, cache_read_input_tokens: 140000, cache_creation_input_tokens: 11000 }
const spawn = (subagentType: string, description: string) =>
  ({ tool_use_id: 't', prompt: '', provider: 'claude', subagentType, description }) as never

test('agents map to the team roles', async () => {
  expect(roleOf('security-reviewer')).toBe('security')
  expect(roleOf('red-team')).toBe('security')
  expect(roleOf('typescript-reviewer')).toBe('reviewer')
  expect(roleOf('legal-reviewer')).toBe('legal')
  expect(roleOf('design-critic')).toBe('designer')
  expect(roleOf('evaluator')).toBe('tester')
  expect(roleOf('planner')).toBe('pm')
  expect(roleOf('architect')).toBe('pm')
  expect(roleOf('code-architect')).toBe('programmer')
  expect(roleOf('build-error-resolver')).toBe('programmer')
  expect(roleOf('e2e-runner')).toBe('tester')
  expect(roleOf('a11y-architect')).toBe('designer')
  expect(roleOf('seo-specialist')).toBe('marketer')
  expect(roleOf('database-reviewer')).toBe('reviewer')
  expect(roleOf('silent-failure-hunter')).toBe('reviewer')
  expect(roleOf('general-purpose', 'Researcher: competitor apps')).toBe('researcher')
  expect(roleOf('general-purpose', 'Research pricing')).toBe('researcher')
  expect(roleOf('general-purpose', 'Fix the form')).toBe('programmer')
  expect(roleOf('something-new')).toBe('programmer')
})

test('a dev server or Worker preview in command output is found', async () => {
  expect(findPreview('  ➜  Local:   http://localhost:3000/\n')).toBe('http://localhost:3000/')
  expect(findPreview('Preview: https://fix-x-duo-test.yskills.workers.dev ok')).toBe('https://fix-x-duo-test.yskills.workers.dev')
  expect(findPreview('Local: http://localhost:3000/.')).toBe('http://localhost:3000/')
  expect(findPreview('nothing here')).toBeUndefined()
})

test('the band and pane show who works on what, and a Watch link', async ($, on) => {
  let n = 0
  on('agent.spawn', () => ({ model: 'sonnet', agentId: `a${++n}` }))
  on('turn.complete', () => ({ text: '' }))
  on('tool.call', () => ({ result: { stdout: 'Local: http://localhost:8787', stderr: '' }, text: 'Local: http://localhost:8787' }) as never)
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text key="engine">engine</Text>
  })

  await $.agent.spawn(spawn('code-reviewer', 'Review the diff'))
  await $.agent.spawn(spawn('security-reviewer', 'Check auth'))
  await $.turn.complete({ ...turn, turnId: 's1', agentId: 'a2' } as never)
  await $.turn.complete({ ...turn, turnId: 'm1', usage } as never)
  await $.tool.call({ tool: 'Bash', tool_use_id: 'b1', command: 'npm run dev' } as never)

  for (const surface of ['terminal', 'desktop'] as const) {
    const band = await $.ui.mount({ plugin: 'team', surface, ...BAND })
    expect(await band.find({ type: 'Text', text: /● Reviewer/ })).toBeDefined()
    expect(await band.find({ type: 'Text', text: /○ Security/ })).toBeDefined()
    expect(await band.find({ type: 'Text', text: /140k of them re-read context/ })).toBeDefined()
    await band.unmount()

    const pane = await $.ui.mount({ plugin: 'team', surface, ...PANE })
    expect(await pane.find({ type: 'Text', text: /Review the diff/ })).toBeDefined()
    expect(await pane.find({ type: 'Text', text: /Check auth \(done\)/ })).toBeDefined()
    expect(await pane.find({ type: 'Link' })).toBeDefined()
    await pane.unmount()
  }
})

test('the band stays out of the way with nothing to show', async ($, on) => {
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text key="engine">engine band</Text>
  })
  const ui = await $.ui.mount({ plugin: 'team', surface: 'terminal', ...BAND })
  expect(await ui.find({ type: 'Text', text: /engine band/ })).toBeDefined()
  await ui.unmount()
})
