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
