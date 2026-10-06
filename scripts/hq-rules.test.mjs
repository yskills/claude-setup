// Runs the rules block of the HQ dashboard template (the <script id="hq-rules"> in dashboard.html).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'

const html = readFileSync(new URL('../.claude/skills/operator/templates/dashboard.html', import.meta.url), 'utf8')
const code = html.match(/<script id="hq-rules">([\s\S]*?)<\/script>/)?.[1]
assert.ok(code, 'dashboard.html has a <script id="hq-rules"> block')
const window = {}
vm.runInNewContext(code, { window })
const HQ = window.HQ

test('day and night follow the clock', () => {
  assert.equal(HQ.modeOf(9), 'day'); assert.equal(HQ.modeOf(18), 'dusk'); assert.equal(HQ.modeOf(6), 'dusk')
  assert.equal(HQ.modeOf(23), 'night'); assert.equal(HQ.modeOf(3), 'night')
})

test('HQ opens at the desk, and falls back without 3D', () => {
  assert.equal(HQ.pickTab('', { hasProjects: true, room: true }), 'desk')
  assert.equal(HQ.pickTab('#ceo', { hasProjects: false, room: true }), 'desk')
  assert.equal(HQ.pickTab('', { hasProjects: true, room: false }), 'company')
  assert.equal(HQ.pickTab('#desk', { hasProjects: false, room: false }), 'plan')
  assert.equal(HQ.pickTab('#company', { hasProjects: false, room: true }), 'desk')
  assert.equal(HQ.pickTab('#you', { hasProjects: false, room: true }), 'todo')
  assert.equal(HQ.pickTab('#nope', { hasProjects: true, room: true }), 'desk')
})

test('pages keep the room they were opened from', () => {
  assert.equal(HQ.worldFor('desk', 'office'), 'room')
  assert.equal(HQ.worldFor('office', 'room'), 'office')
  assert.equal(HQ.worldFor('company', 'room'), 'room')
  assert.equal(HQ.worldFor('company', 'office'), 'office')
  assert.equal(HQ.worldFor('plan', undefined), 'room')
})

test('desk numbers add up and ignore junk', () => {
  const n = HQ.deskNumbers({
    projects: [{ revenueMonth: 28, revenueTotal: 28, working: 2, you: [{}, {}] }, { revenueMonth: '-5', revenueTotal: 'x', you: 'no' }],
    you: 1, phases: [{ goals: [{ done: 1, total: 4 }] }, { goals: [{ done: 3, total: 4 }] }, {}],
  })
  assert.deepEqual({ ...n }, { month: 28, total: 28, todos: 2, pct: 50, working: 2, test: false })
  assert.deepEqual({ ...HQ.deskNumbers({}) }, { month: 0, total: 0, todos: 0, pct: 0, working: 0, test: false })
})

test('every role has its own animal, and each state its own pose', () => {
  assert.equal(new Set(Object.values(HQ.PET_OF)).size, 9)
  const clip = (st, walking, t, still) => HQ.poseAt(st, walking, t, still).clip
  assert.equal(clip('working'), 'type'); assert.equal(clip('done'), 'dance'); assert.equal(clip('idle'), 'doze')
  assert.equal(clip('off'), 'doze'); assert.equal(clip('nope'), 'doze'); assert.equal(clip('done', true), 'walk')
  assert.equal(clip('blocked', false, 0.5), 'shake'); assert.equal(clip('waiting', false, 0.5), 'wave')
  const shown = ['working', 'done', 'blocked', 'waiting', 'idle'].map((s) => clip(s, false, 0.5))
  assert.equal(new Set(shown).size, 5)
})

test('gestures play every few seconds, not nonstop', () => {
  assert.equal(HQ.poseAt('blocked', false, 3).clip, 'fret'); assert.equal(HQ.poseAt('blocked', false, 4.6).clip, 'shake')
  assert.equal(HQ.poseAt('waiting', false, 3).clip, 'look'); assert.equal(HQ.poseAt('waiting', false, 9.2).clip, 'wave')
  for (const st of ['working', 'done', 'blocked', 'waiting', 'idle']) for (const t of [0, 0.3, 1.1, 2.7, 7.9]) {
    const { clip, frame } = HQ.poseAt(st, false, t)
    assert.ok(Number.isInteger(frame) && frame >= 0 && frame < HQ.FRAMES[clip], `${st} @${t}`)
  }
})

test('reduced motion shows a finished still pose for each state', () => {
  assert.deepEqual({ ...HQ.poseAt('blocked', false, 3, true) }, { clip: 'fret', frame: 0 })
  assert.deepEqual({ ...HQ.poseAt('waiting', false, 3, true) }, { clip: 'wave', frame: 0 })
  assert.equal(HQ.poseAt('done', true, 3, true).clip, 'dance')
  const shown = ['working', 'done', 'blocked', 'waiting', 'idle'].map((s) => HQ.poseAt(s, false, 0, true).clip)
  assert.equal(new Set(shown).size, 5)
})

test('a project\'s live stats replace the saved money and carry the Testgeld label', () => {
  const row = { id: 'duo', revenueMonth: 1, revenueTotal: 2 }
  const test = HQ.withStats(row, { revenueTotalCents: 2800, revenueMonthCents: 600, mode: 'test' })
  assert.equal(test.revenueTotal, 28); assert.equal(test.revenueMonth, 6); assert.equal(test.testMoney, true)
  assert.equal(HQ.withStats(row, { revenueTotalCents: 2800, revenueMonthCents: 600, mode: 'live' }).testMoney, false)
  assert.equal(HQ.deskNumbers({ projects: [test] }).test, true)
  assert.deepEqual(HQ.withStats(row, null), row)
  assert.deepEqual(HQ.withStats(row, { revenueTotalCents: 'x', revenueMonthCents: 1 }), row)
  assert.deepEqual(HQ.withStats(row, { revenueTotalCents: -5, revenueMonthCents: 0 }), row)
})

test('score comes only from real events', () => {
  const s = (events) => ({ ...HQ.scoreFrom(events) })
  assert.deepEqual(s([]), { xp: 0, coins: 0, level: 1, from: 0, to: 100, pct: 0 })
  assert.deepEqual(s(undefined), s([]))
  assert.equal(s([{ kind: 'pr_merged' }]).xp, 50)
  assert.equal(s([{ kind: 'gate_passed' }]).xp, 20)
  assert.equal(s([{ kind: 'visit' }]).xp, 5)
  assert.equal(s([{ kind: 'launched' }]).xp, 100)
  const euros = s([{ kind: 'euro', amount: 12 }])
  assert.equal(euros.xp, 120); assert.equal(euros.coins, 12)
  assert.equal(s([{ kind: 'euro', amount: 0.6 }, { kind: 'euro', amount: 0.6 }]).coins, 1)
  assert.equal(s([{ kind: 'euro', amount: 0.6 }, { kind: 'euro', amount: 0.6 }]).xp, 12)
})

test('score ignores junk, repeats and fake money', () => {
  const xp = (events) => HQ.scoreFrom(events).xp
  assert.equal(xp([{ kind: 'nope' }, null, 'x', {}, { kind: 'euro' }, { kind: 'euro', amount: -5 }, { kind: 'euro', amount: 'NaN' }]), 0)
  assert.equal(xp([{ id: 'a', kind: 'pr_merged' }, { id: 'a', kind: 'pr_merged' }, { id: 'b', kind: 'pr_merged' }]), 100)
})

test('levels follow floor(sqrt(xp/100)) + 1 and the bar fills toward the next', () => {
  const at = (xp) => HQ.scoreFrom(Array.from({ length: xp / 50 }, () => ({ kind: 'pr_merged' })))
  assert.equal(at(50).level, 1); assert.equal(at(50).pct, 50)
  assert.equal(at(100).level, 2); assert.deepEqual([at(100).from, at(100).to], [100, 400])
  assert.equal(at(350).level, 2); assert.equal(at(400).level, 3); assert.equal(at(850).level, 3); assert.equal(at(900).level, 4)
  assert.equal(at(250).pct, 50)
})

test('a toast names what the new events earned', () => {
  assert.equal(HQ.toastFor([{ kind: 'pr_merged' }]), '+50 XP')
  assert.equal(HQ.toastFor([{ kind: 'euro', amount: 3 }]), '+30 XP · +3 coins')
  assert.equal(HQ.toastFor([{ kind: 'pr_merged' }, { kind: 'gate_passed' }]), '+70 XP')
  assert.equal(HQ.toastFor([{ kind: 'nope' }]), '')
  assert.equal(HQ.toastFor([{ kind: 'euro', amount: 1 }]), '+10 XP · +1 coin')
})

test('a visit is one event per day', () => {
  assert.deepEqual({ ...HQ.visitEvent(new Date('2026-10-06T09:00:00Z')) }, { id: 'visit-2026-10-06', kind: 'visit', project: 'hq', at: '2026-10-06T09:00:00.000Z' })
  assert.equal(HQ.visitEvent(new Date('2026-10-06T23:30:00Z')).id, 'visit-2026-10-07')
})
