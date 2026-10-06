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
  assert.deepEqual({ ...n }, { month: 28, total: 28, todos: 2, pct: 50, working: 2 })
  assert.deepEqual({ ...HQ.deskNumbers({}) }, { month: 0, total: 0, todos: 0, pct: 0, working: 0 })
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
