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
    projects: [{ revenueMonth: 28, revenueTotal: 28, working: 2, at: '2026-10-07T09:00:00Z', you: [{}, {}] }, { revenueMonth: '-5', revenueTotal: 'x', working: 3, you: 'no' }],
    you: 1, phases: [{ goals: [{ done: 1, total: 4 }] }, { goals: [{ done: 3, total: 4 }] }, {}], now: new Date('2026-10-07T10:00:00Z'),
  })
  assert.deepEqual({ ...n }, { month: 28, total: 28, todos: 1, pct: 50, working: 2, test: false })
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

test('a project row in test mode is tagged Testgeld; live money is not', () => {
  const row = { id: 'duo', revenueMonth: 6, revenueTotal: 28 }
  assert.equal(HQ.tagMoney({ ...row, revenueMode: 'test' }).testMoney, true)
  assert.equal(HQ.tagMoney({ ...row, revenueMode: 'live' }).testMoney, false)
  assert.equal(HQ.tagMoney(row).testMoney, false)
  assert.equal(HQ.deskNumbers({ projects: [HQ.tagMoney({ ...row, revenueMode: 'test' })] }).test, true)
  assert.equal(HQ.tagMoney({ ...row, revenueMode: 'test' }).revenueTotal, 28)
})

test('score comes only from real events', () => {
  const s = (events) => ({ ...HQ.scoreFrom(events) })
  assert.deepEqual(s([]), { xp: 0, coins: 0, test: 0, level: 1, from: 0, to: 100, pct: 0 })
  assert.deepEqual(s(undefined), s([]))
  assert.equal(s([{ kind: 'pr_merged' }]).xp, 50)
  assert.equal(s([{ kind: 'gate_passed' }]).xp, 20)
  assert.equal(s([{ kind: 'visit' }]).xp, 0)
  assert.equal(s([{ kind: 'launched' }]).xp, 100)
  const euros = s([{ kind: 'euro', amount: 12, mode: 'live' }])
  assert.equal(euros.xp, 120); assert.equal(euros.coins, 12)
  const live = (amount) => ({ kind: 'euro', amount, mode: 'live' })
  assert.equal(s([live(0.6), live(0.6)]).coins, 1)
  assert.equal(s([live(0.6), live(0.6)]).xp, 12)
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
  assert.equal(HQ.toastFor([{ kind: 'euro', amount: 3, mode: 'live' }]), '+30 XP · +3 coins')
  assert.equal(HQ.toastFor([{ kind: 'pr_merged' }, { kind: 'gate_passed' }]), '+70 XP')
  assert.equal(HQ.toastFor([{ kind: 'nope' }]), '')
  assert.equal(HQ.toastFor([{ kind: 'euro', amount: 1, mode: 'live' }]), '+10 XP · +1 coin')
})

test('a visit is one event per day', () => {
  assert.deepEqual({ ...HQ.visitEvent(new Date('2026-10-06T09:00:00Z')) }, { id: 'visit-2026-10-06', kind: 'visit', project: 'hq', at: '2026-10-06T09:00:00.000Z' })
  assert.equal(HQ.visitEvent(new Date('2026-10-06T23:30:00Z')).id, 'visit-2026-10-07')
})

test('a New project tap saves one tidy request row', () => {
  const now = new Date('2026-10-06T18:30:00Z')
  const r = HQ.requestDoc('  a   cozy\nfarming game  ', now, () => 0.5)
  assert.match(r.id, /^req-2026-10-06-[0-9a-z]{6}$/)
  assert.deepEqual({ ...r.data }, { text: 'a cozy farming game', at: '2026-10-06T18:30:00.000Z', status: 'new' })
  assert.equal(HQ.requestDoc('   '), null)
  assert.equal(HQ.requestDoc(null), null)
  assert.equal(HQ.requestDoc('x'.repeat(2000)).data.text.length, 600)
  assert.notEqual(HQ.requestDoc('a', now, () => 0.1).id, HQ.requestDoc('a', now, () => 0.2).id)
})

test('the request goes to a real coordinator address only', () => {
  assert.equal(HQ.coordinatorOf({ session: 'cse_0126AwHPE3P6rdJkJm3vkNzs' }, null), 'cse_0126AwHPE3P6rdJkJm3vkNzs')
  assert.equal(HQ.coordinatorOf(null, { session: 'session_0126AwHPE3P6rdJkJm3vkNzs' }), 'session_0126AwHPE3P6rdJkJm3vkNzs')
  assert.equal(HQ.coordinatorOf({ session: 'cse_bad id"; drop' }, { session: 'cse_0126AwHPE3P6rdJkJm3vkNzs' }), 'cse_0126AwHPE3P6rdJkJm3vkNzs')
  assert.equal(HQ.coordinatorOf({}, {}), null)
  assert.equal(HQ.coordinatorOf({ session: 42 }, undefined), null)
})

test('the message explains itself to a coordinator that starts cold', () => {
  const m = HQ.requestMessage('req-2026-10-06-abc123', 'a cozy farming game')
  assert.ok(m.startsWith('HQ request req-2026-10-06-abc123: a cozy farming game'))
  assert.match(m, /brainstorm thread/)
  assert.match(m, /requests\/req-2026-10-06-abc123 to started/)
})

test('only unsent requests are resent, and every state reads in German', () => {
  const rows = [{ id: 'a', text: 'x', status: 'new' }, { id: 'b', text: 'y', status: 'sent' }, { id: 'c', status: 'new' }, null, { id: 'd', text: 'z', status: 'started' }]
  assert.deepEqual(HQ.toResend(rows).map((r) => r.id), ['a'])
  assert.equal(HQ.toResend(undefined).length, 0)
  assert.equal(HQ.requestLine({ status: 'started' }), 'Brainstorm läuft')
  assert.equal(HQ.requestLine({ status: 'weird' }), 'gespeichert, Claude meldet sich')
  assert.match(HQ.sendTrouble('needs_reauth'), /Connectors/)
  assert.match(HQ.sendTrouble('not_in_manifest'), /nächste Thread/)
  assert.equal(HQ.sendTrouble('upstream_error'), 'Gespeichert, Claude meldet sich.')
})

/* The cash book: finance/<project> as duo-test's stats route returns it (docs/STATS-API.md), integer cents */
/* Plain copies: objects made in the vm's realm fail deepStrictEqual on their prototype */
const report = (r, now) => JSON.parse(JSON.stringify(HQ.moneyReport(r, now)))
const NOW = new Date('2026-10-06T22:00:00Z')
const row = {
  total: { grossCents: 2999, feeCents: 80, netCents: 2919, complete: true },
  month: { grossCents: 2999, feeCents: 80, netCents: 2919, complete: true },
  months: [{ month: '2026-10', grossCents: 2999, feeCents: 80, netCents: 2919, complete: true, payments: 1 }],
  payments: [
    { at: '2026-09-02T10:00:00Z', plan: 'monthly', grossCents: 499, feeCents: null, netCents: null, discountCents: 0 },
    { at: '2026-10-06T21:00:00Z', plan: 'yearly', grossCents: 2999, feeCents: 80, netCents: 2919, discountCents: 0 },
  ],
  subscriptions: { active: 1, trialing: 2, endingAtPeriodEnd: 0 },
  refunds: { count: 0, cents: 0 }, discounts: { count: 1, cents: 500 },
  nextPayout: { amountCents: 2919, arrivesAt: '2026-10-09T00:00:00Z', status: 'pending' },
  mode: 'test', asOf: '2026-10-06T21:50:00Z', savedAt: '2026-10-06T21:55:00Z', sync: 'ok', feeSync: 'ok', payoutSync: 'ok',
}

test('the cash book leads with net once every fee is known', () => {
  const r = report(row, NOW)
  assert.equal(r.has, true); assert.equal(r.test, true)
  assert.deepEqual(r.headline, { label: 'Netto', cents: 2919 })
  assert.deepEqual(r.total, { gross: 2999, fee: 80, net: 2919, complete: true })
  assert.equal(r.at, '2026-10-06T21:50:00Z')
  assert.deepEqual(r.trouble, [])
})

test('without every fee the big number is gross, with a plain note, never a too-high net', () => {
  const r = report({ ...row, total: { grossCents: 3498, feeCents: 80, netCents: 2919, complete: false } }, NOW)
  assert.equal(r.headline.label, 'Brutto'); assert.equal(r.headline.cents, 3498); assert.match(r.headline.note, /Netto folgt/)
})

test('no finance row, or junk, means no data rather than a made-up number', () => {
  assert.deepEqual(report(null), { has: false })
  assert.deepEqual(report('x'), { has: false })
  const r = report({ total: { grossCents: -5 }, month: { grossCents: 12.5 }, payments: [{ at: 'never', grossCents: 100 }, { at: '2026-10-01T00:00:00Z', grossCents: '100' }], refunds: { count: 1 }, nextPayout: { amountCents: 100 } }, NOW)
  assert.equal(r.has, false); assert.equal(r.total, null); assert.equal(r.month, null); assert.equal(r.headline, null)
  assert.deepEqual(r.payments, []); assert.equal(r.refunds, null); assert.equal(r.payout, null); assert.deepEqual(r.months, [])
})

test('only mode live is real money; anything else stays Testgeld', () => {
  assert.equal(report({ ...row, mode: 'live' }, NOW).test, false)
  assert.equal(report({ ...row, mode: undefined }, NOW).test, true)
})

test('the graph shows the last six Berlin months, quiet months at 0', () => {
  const m = report({ ...row, months: [...row.months, { month: '2026-07', grossCents: 499, feeCents: 32, netCents: 467, complete: true, payments: 1 }, { month: 'bad', grossCents: 1 }] }, NOW).months
  assert.deepEqual(m.map((x) => x.month), ['2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10'])
  assert.deepEqual(m.map((x) => x.label), ['Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt'])
  assert.equal(m[2].net, 467); assert.equal(m[3].gross, 0); assert.equal(m[5].payments, 1)
  const jan = report(row, new Date('2027-01-10T12:00:00Z')).months
  assert.equal(jan[0].label, 'Aug 26'); assert.equal(jan[5].label, 'Jan')
})

test('payments read newest first with their plan in German; unknown fees stay unknown', () => {
  const p = report(row, NOW).payments
  assert.deepEqual(p.map((x) => x.plan), ['Jahres-Abo', 'Monats-Abo'])
  assert.equal(p[1].fee, null); assert.equal(p[1].net, null)
  assert.equal(report({ ...row, payments: [{ at: row.payments[0].at, plan: 'weird', grossCents: 1 }] }, NOW).payments[0].plan, 'Sonstiges')
})

test('subscriptions, refunds, coupons and the payout come through as counted', () => {
  const r = report(row, NOW)
  assert.deepEqual(r.subs, { active: 1, trialing: 2, ending: 0 })
  assert.deepEqual(r.discounts, { count: 1, cents: 500 })
  assert.deepEqual(r.payout, { cents: 2919, at: '2026-10-09T00:00:00Z', status: 'pending' })
})

test('a failed Stripe sync is said plainly, with what Stripe answered', () => {
  const r = report({ ...row, feeSync: 'failed:403 The provided key does not have the required permissions', payoutSync: 'off' }, NOW)
  assert.deepEqual(r.trouble, ['Gebühren hakt: 403 The provided key does not have the required permissions', 'Auszahlung: kein Stripe-Schlüssel am Worker.'])
})

test('the money page opens from #money and its German names', () => {
  assert.equal(HQ.pickTab('#money', { hasProjects: false, room: true }), 'money')
  assert.equal(HQ.pickTab('#kassenbuch', { hasProjects: true, room: false }), 'money')
  assert.equal(HQ.worldFor('money', 'office'), 'office')
})

/* A 10 x 10 floor of 1 m cells with a wall down x = 5, open only at the bottom row */
const floor = (gap = true) => {
  const g = { x0: 0, z0: 0, size: 1, w: 10, h: 10, blocked: new Uint8Array(100) }
  for (let j = 0; j < 10; j++) if (!gap || j < 9) g.blocked[j * 10 + 5] = 1
  return g
}
const blockedAt = (g, x, z) => g.blocked[Math.floor(z) * g.w + Math.floor(x)] === 1

test('the team walks around furniture, never through it', () => {
  const g = floor(), path = HQ.findPath(g, [1.5, 1.5], [8.5, 1.5])
  assert.ok(path, 'a way exists through the gap')
  assert.deepEqual([...path[0]], [1.5, 1.5]); assert.deepEqual([...path.at(-1)], [8.5, 1.5])
  for (let k = 1; k < path.length; k++) {
    const [a, b] = [path[k - 1], path[k]]
    for (let s = 0; s <= 50; s++) assert.ok(!blockedAt(g, a[0] + (b[0] - a[0]) * s / 50, a[1] + (b[1] - a[1]) * s / 50), `leg ${k} crosses the wall`)
  }
  assert.ok(path.length <= 5, 'straight runs are merged')
  assert.equal(HQ.findPath(floor(false), [1.5, 1.5], [8.5, 1.5]), null, 'no way when walled off')
})

test('a walk may start on a chair and end on a sofa', () => {
  const g = floor(); g.blocked[1 * 10 + 1] = 1
  const path = HQ.findPath(g, [1.5, 1.5], [3.5, 1.5])
  assert.deepEqual([...path[0]], [1.5, 1.5]); assert.deepEqual([...path.at(-1)], [3.5, 1.5])
})

test('walkers give way and never stand inside each other', () => {
  const me = { x: 0, z: 0, rank: 3 }, aim = [1, 0]
  assert.deepEqual({ ...HQ.giveWay(me, aim, []) }, { x: 1, z: 0, wait: false })
  assert.equal(HQ.giveWay(me, aim, [{ x: 0.8, z: 0, walking: true, rank: 1 }]).wait, true, 'waits for one who goes first')
  assert.equal(HQ.giveWay({ ...me, impatient: true }, aim, [{ x: 0.8, z: 0.1, walking: true, rank: 1 }]).wait, false, 'not forever')
  const round = HQ.giveWay(me, aim, [{ x: 0.7, z: 0.2, walking: false, rank: 1 }])
  assert.equal(round.wait, false); assert.ok(round.z < -0.2, 'steps to the side away from one standing ahead'); assert.ok(round.x > 0, 'still moves on')
  assert.deepEqual({ ...HQ.giveWay(me, aim, [{ x: -0.7, z: 0, walking: true, rank: 1 }]) }, { x: 1, z: 0, wait: false }, 'ignores who is behind')
  assert.equal(HQ.giveWay({ x: 0, z: 0, rank: 1 }, aim, [{ x: 0.7, z: 0, walking: true, rank: 5, hx: 1, hz: 0 }]).wait, true, 'queues behind one going the same way')
  const out = HQ.giveWay(me, aim, [{ x: 0.2, z: 0, walking: true, rank: 1 }])
  assert.ok(out.x < 0, 'backs out of one it stands inside')
  const a = HQ.giveWay({ x: 0, z: 0, rank: 1 }, [1, 0], [{ x: 0.8, z: 0, walking: true, rank: 2 }])
  const b = HQ.giveWay({ x: 0.8, z: 0, rank: 2 }, [-1, 0], [{ x: 0, z: 0, walking: true, rank: 1 }])
  assert.ok(a.z !== 0 && !a.wait, 'head on: the first one steps aside'); assert.equal(b.wait, true, 'the second waits')
})

test('one panel at a time: a tap outside a page goes back to its room', () => {
  assert.equal(HQ.closeTo('company', 'room'), 'desk'); assert.equal(HQ.closeTo('team', 'office'), 'office')
  assert.equal(HQ.closeTo('money', 'room'), 'desk'); assert.equal(HQ.closeTo('todo', 'office'), 'office')
  assert.equal(HQ.closeTo('desk', 'room'), null); assert.equal(HQ.closeTo('office', 'office'), null); assert.equal(HQ.closeTo(null, 'room'), null)
})

test('bond: levels come from points, a few visits apart, and merged PRs count after the card came', () => {
  const now = new Date('2026-10-07T10:00:00Z')
  assert.equal(HQ.bondOf(null, [], now).level, 1)
  assert.equal(HQ.bondOf({ points: 2 }, [], now).toNext, 1)
  assert.equal(HQ.bondOf({ points: 3 }, [], now).level, 2)
  assert.equal(HQ.bondOf({ points: 99 }, [], now).level, 5)
  assert.equal(HQ.bondOf({ points: 99 }, [], now).toNext, null)
  assert.equal(HQ.bondOf({ points: -4 }, [], now).points, 0)
  const events = [{ kind: 'pr_merged', at: '2026-10-06T09:00:00Z' }, { kind: 'pr_merged', at: '2026-10-07T09:00:00Z' }, { kind: 'visit', at: '2026-10-07T09:00:00Z' }]
  assert.equal(HQ.bondOf({ points: 1, since: '2026-10-07T00:00:00Z' }, events, now).points, 2)
  assert.equal(HQ.bondOf({ points: 1 }, events, now).points, 1)
})

const plain = (x) => JSON.parse(JSON.stringify(x))
test('bond: unlocks are fixed by level (outfits at 3 and 5, desk items at 2, 4, 5)', () => {
  const at = (points) => HQ.bondOf({ points }, [], new Date('2026-10-07T10:00:00Z'))
  assert.deepEqual([at(0).outfits, at(7).outfits, at(18).outfits], [1, 2, 3])
  assert.deepEqual(plain(at(3).items), ['mug'])
  assert.deepEqual(plain(at(12).items), ['mug', 'poster'])
  assert.deepEqual(plain(at(18).items), ['mug', 'poster', 'trophy'])
  assert.equal(at(12).badge, false); assert.equal(at(18).badge, true)
})

test('bond: only three calls a Berlin day count, a new day starts fresh, nothing is lost', () => {
  const day1 = new Date('2026-10-07T10:00:00Z'), late = new Date('2026-10-07T21:59:00Z'), day2 = new Date('2026-10-07T22:30:00Z')
  let row = null
  for (let i = 0; i < 4; i++) row = HQ.afterCall(row, 2, day1)
  assert.equal(row.points, 6); assert.equal(row.calls, 4); assert.equal(row.added, 0)
  assert.equal(HQ.bondOf(row, [], late).callsLeft, 0)
  assert.equal(HQ.bondOf(row, [], day2).callsLeft, 3)
  row = HQ.afterCall(row, 5, day2)
  assert.equal(row.points, 8); assert.equal(row.calls, 1)
  assert.equal(row.since, '2026-10-07T10:00:00.000Z')
  assert.equal(HQ.afterCall(null, 'x', day1).points, 0)
})

test('seating: one card per desk, one desk per card, removed cards leave their desk', () => {
  const cards = [{ id: 'a' }, { id: 'b' }]
  assert.deepEqual(plain(HQ.seating({ pm: 'a', designer: 'a', legal: 'gone', tester: 'b' }, cards)), { pm: 'a', tester: 'b' })
  assert.deepEqual(plain(HQ.seatCard({ pm: 'a', tester: 'b' }, 'tester', 'a')), { tester: 'a' })
  assert.deepEqual(plain(HQ.seatCard({ pm: 'a' }, 'pm', null)), {})
  assert.equal(HQ.moodOf('blocked'), 'stuck'); assert.equal(HQ.moodOf('off'), 'free')
})

test('parts with no data are named once, so the cash book shows one quiet line instead of empty headings', () => {
  assert.deepEqual(report(row, NOW).missing, [])
  const bare = { total: row.total, month: row.month, months: row.months, mode: 'test' }
  assert.deepEqual(report(bare, NOW).missing, ['Einzelzahlungen', 'Abos', 'Erstattungen', 'Gutscheine', 'Auszahlung'])
})

test('Company, laptop and wall chart show the cash book amount with cents: net once every fee is known, else paid', () => {
  const plain = (p) => JSON.parse(JSON.stringify(p))
  const p = { id: 'duo-test', revenueTotal: 30, revenueMonth: 30, revenueMode: 'test' }
  const live = { total: { grossCents: 2999, feeCents: 119, netCents: 2880, complete: true }, month: { grossCents: 2999, feeCents: 119, netCents: 2880, complete: true }, mode: 'test' }
  assert.deepEqual(plain(HQ.withFinance(p, live, NOW)), { ...p, revenueTotal: 28.8, revenueMonth: 28.8, revenueNet: true, testMoney: true })
  const open = { ...live, total: { ...live.total, complete: false }, month: undefined, mode: 'live' }
  assert.deepEqual(plain(HQ.withFinance(p, open, NOW)), { ...p, revenueTotal: 29.99, revenueMonth: 30, revenueNet: false, testMoney: false })
  assert.deepEqual(plain(HQ.withFinance(p, undefined, NOW)), p)
})

test('Heute für dich: live items with source and age, the team list joins, stale when the refresh is old', () => {
  const now = new Date('2026-10-07T10:00:00Z')
  const today = {
    refreshedAt: '2026-10-07T09:48:00Z',
    items: [
      { what: 'duo-test: 29,99 € Testgeld eingegangen', kind: 'info', source: 'Stripe', at: '2026-10-07T09:47:00Z' },
      { what: 'claude-setup PR 51: CI rot', kind: 'you', source: 'GitHub', at: '2026-10-07T07:00:00Z', link: 'https://github.com/yskills/claude-setup/pull/51' },
      { what: 'no source', at: '2026-10-07T09:00:00Z' },
      { what: 'bad link', source: 'GitHub', at: '2026-10-07T09:00:00Z', link: 'javascript:alert(1)' },
      null,
    ],
    sources: [{ name: 'GitHub', ok: true }, { name: 'Roblox', ok: false, note: 'kein Schlüssel' }, { ok: true }],
  }
  const pm = { updated: '2026-10-05T10:00:00Z', you: [{ what: 'Kleingarten: Shop anlegen', link: 'https://create.roblox.com/x' }, { what: 'CLAUDE-SETUP PR 51: CI ROT' }] }
  const projects = [{ id: 'kleingarten', name: 'Kleingarten', at: '2026-10-05T10:00:00Z', you: [{ what: 'Kleingarten: Shop anlegen', link: 'https://create.roblox.com/x', firstSeen: '2026-10-04T10:00:00Z' }] }]
  const t = HQ.todayFor({ today, pm, projects }, now)
  assert.deepEqual([...t.items.map((i) => i.what)], ['claude-setup PR 51: CI rot', 'bad link', 'Kleingarten: Shop anlegen', 'duo-test: 29,99 € Testgeld eingegangen'])
  assert.equal(t.items[0].age, 'vor 3 Std.'); assert.equal(t.items[0].source, 'GitHub')
  assert.equal(t.items[1].link, null)
  assert.equal(t.items[2].source, 'Kleingarten'); assert.equal(t.items[2].age, 'vor 2 Tagen'); assert.equal(t.items[2].stale, true); assert.equal(t.items[2].waited, 'seit 3 Tagen')
  assert.equal(t.items[3].age, 'vor 13 Min.')
  assert.equal(t.you, 3); assert.equal(t.items[0].stale, false); assert.equal(t.items[3].stale, false); assert.equal(t.age, 'vor 12 Min.'); assert.equal(t.stale, false)
  assert.deepEqual(JSON.parse(JSON.stringify(t.sources)), [{ name: 'GitHub', ok: true, note: '' }, { name: 'Roblox', ok: false, note: 'kein Schlüssel' }])
  assert.equal(HQ.todayFor({ today: { ...today, refreshedAt: '2026-10-07T06:00:00Z' } }, now).stale, true)
  const empty = HQ.todayFor({}, now)
  assert.deepEqual([empty.items.length, empty.you, empty.at, empty.stale], [0, 0, null, true])
})

test('ages read in plain German', () => {
  const now = new Date('2026-10-07T10:00:00Z')
  assert.equal(HQ.ageDe('2026-10-07T09:59:40Z', now), 'gerade eben')
  assert.equal(HQ.ageDe('2026-10-07T10:05:00Z', now), 'gerade eben')
  assert.equal(HQ.ageDe('2026-10-07T09:01:00Z', now), 'vor 59 Min.')
  assert.equal(HQ.ageDe('2026-10-06T09:00:00Z', now), 'vor 1 Tag')
  assert.equal(HQ.ageDe('nope', now), '')
})

test('HQ opens on Heute für dich once a day, only from the desk and only when something needs yskills', () => {
  const now = new Date('2026-10-07T10:00:00Z')
  assert.equal(HQ.greetToday({ seen: '2026-10-06', you: 2, tab: 'desk' }, now), true)
  assert.equal(HQ.greetToday({ seen: '2026-10-07', you: 2, tab: 'desk' }, now), false)
  assert.equal(HQ.greetToday({ seen: null, you: 0, tab: 'desk' }, now), false)
  assert.equal(HQ.greetToday({ seen: null, you: 1, tab: 'money' }, now), false)
  assert.equal(HQ.berlinDay(new Date('2026-10-06T22:30:00Z')), '2026-10-07')
})

test('opening HQ asks for a fresh Heute list only when the last one is old and nobody asked just now', () => {
  const now = new Date('2026-10-07T10:00:00Z')
  const fresh = { refreshedAt: '2026-10-07T08:00:00Z' }, old = { refreshedAt: '2026-10-07T07:00:00Z' }
  assert.equal(HQ.refreshDue({ today: fresh, askedAt: null }, now), false)
  assert.equal(HQ.refreshDue({ today: old, askedAt: null }, now), true)
  assert.equal(HQ.refreshDue({ today: null, askedAt: null }, now), true)
  assert.equal(HQ.refreshDue({ today: old, askedAt: '2026-10-07T09:55:00Z' }, now), false)
  assert.equal(HQ.refreshDue({ today: old, askedAt: '2026-10-07T09:45:00Z' }, now), true)
  assert.equal(HQ.REFRESH_AFTER_MIN, 150)
  assert.equal(HQ.refresherOf({ session: 'cse_01ABCDEFGHJK' }), 'cse_01ABCDEFGHJK')
  assert.equal(HQ.refresherOf({ session: 'nope' }), null)
  assert.match(HQ.REFRESH_MESSAGE, /^HQ refresh/)
})

test('rows carry a stamp and go grey after 6 hours', () => {
  const now = new Date('2026-10-07T10:00:00Z')
  assert.equal(HQ.stamp({ a: 1 }, now).at, '2026-10-07T10:00:00.000Z')
  assert.equal(HQ.rowFresh({ at: '2026-10-07T04:30:00Z' }, now), true)
  assert.equal(HQ.rowFresh({ at: '2026-10-07T03:59:00Z' }, now), false)
  assert.equal(HQ.rowFresh({ updated: '2026-10-07T09:00:00Z' }, now), true)
  assert.equal(HQ.rowFresh({}, now), false)
  assert.equal(HQ.rowNote({ at: '2026-10-07T09:00:00Z' }, now), '')
  assert.match(HQ.rowNote({ at: '2026-10-06T09:00:00Z' }, now), /seit 6 Std\. nicht aktualisiert \(Stand vor 1 Tag\)/)
  assert.match(HQ.rowNote({}, now), /ohne Zeitstempel/)
})

test('Testgeld and toolkit PRs earn nothing', () => {
  const s = (e) => ({ ...HQ.scoreFrom(e) })
  const test = s([{ kind: 'euro', amount: 28.8 }, { kind: 'euro', amount: 1, mode: 'test' }])
  assert.deepEqual([test.xp, test.coins, test.test], [0, 0, 29.8])
  assert.equal(s([{ kind: 'pr_merged', project: 'claude-setup' }, { kind: 'gate_passed', project: 'hq' }]).xp, 0)
  assert.equal(s([{ kind: 'pr_merged', project: 'duo-test' }]).xp, 50)
})

test('to-dos: one place each, deduped by text and by link, first seen kept', () => {
  const now = new Date('2026-10-07T10:00:00Z')
  const at = '2026-10-07T09:00:00Z'
  const projects = [
    { id: 'a', name: 'A', at, you: [{ what: 'Schritt 1', link: 'https://x.test/s' }, { what: 'Schritt 2', link: 'https://x.test/s' }] },
    { id: 'b', name: 'B', at, you: [{ what: 'Gleicher Link, anderer Text', link: 'https://x.test/s' }, { what: 'schritt 1' }] },
  ]
  const t = HQ.todayFor({ projects, pm: { at, you: [{ what: 'Nur im PM' }] } }, now)
  assert.deepEqual([...t.items.map((i) => i.what)], ['Schritt 1', 'Schritt 2'])
  const only = HQ.todayFor({ pm: { at, you: [{ what: 'Nur im PM', firstSeen: '2026-10-07T07:00:00Z' }] } }, now)
  assert.deepEqual([only.items[0].source, only.items[0].waited], ['Claude-Team', 'seit 3 Std.'])
})

test('Heute note and wait text', () => {
  const now = new Date('2026-10-07T10:00:00Z')
  const t = (refreshedAt) => HQ.todayFor({ today: { refreshedAt, items: [] } }, now)
  assert.equal(HQ.todayNote(HQ.todayFor({}, now), null, now), 'Noch kein Abgleich gelaufen.')
  assert.equal(HQ.todayNote(t('2026-10-07T09:48:00Z'), null, now), 'Abgeglichen vor 12 Min.')
  assert.equal(HQ.todayNote(t('2026-10-07T09:48:00Z'), '2026-10-07T09:00:00Z', now), 'Abgeglichen vor 12 Min. · neu bei jedem Öffnen')
  assert.equal(HQ.todayNote(t('2026-10-07T01:00:00Z'), null, now), 'Stand vor 9 Std., evtl. veraltet')
  assert.equal(HQ.sinceDe('2026-10-04T10:00:00Z', now), 'seit 3 Tagen')
})

test('progress is traction, not build percent', () => {
  const now = new Date('2026-10-07T10:00:00Z')
  const a = HQ.tractionOf({ visitors7d: 12, signups: 0, paying: 0, firstEuroBy: '2026-10-17T10:00:00Z' }, now)
  assert.deepEqual(JSON.parse(JSON.stringify(a.parts)), [{ label: 'Besucher (7 Tage)', value: 12 }, { label: 'Anmeldungen', value: 0 }, { label: 'Zahlende', value: 0 }])
  assert.equal(a.countdown, 'Erster Euro in 10 Tagen'); assert.equal(a.overdue, false)
  assert.equal(HQ.tractionOf({ firstEuroBy: '2026-10-05T10:00:00Z' }, now).countdown, 'Erster Euro 2 Tage überfällig')
  assert.equal(HQ.tractionOf({}, now).countdown, 'Kein Datum für den ersten Euro')
  assert.equal(HQ.tractionOf({ revenueMode: 'live', revenueTotal: 5 }, now).real, true)
  assert.equal(HQ.tractionOf({ revenueTotal: 28.8 }, now).real, false)
})
