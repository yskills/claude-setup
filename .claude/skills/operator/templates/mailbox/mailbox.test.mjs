import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { checkSend, sendMail, storeMail, toRow, tokenOk, MAX_BODY } from './inbox.mjs'

const fakeDb = () => {
  const calls = []
  return { calls, prepare: (sql) => ({ bind: (...args) => ({ run: async () => calls.push({ sql, args }) }) }) }
}
const raw = (s) => new Response(s).body
const msg = (over = {}) => ({ from: 'a@x.de', to: 'claude@y.de', rawSize: 42, raw: raw('x'), headers: new Headers({ subject: 'Hi' }), ...over })

test('a parsed mail is stored with from, to, subject, text, html, size and time', async () => {
  const db = fakeDb()
  const parse = async () => ({ from: { address: 'sender@x.de' }, subject: 'Hello', text: 'body', html: '<p>body</p>' })
  assert.equal(await storeMail(db, msg(), parse, 'id1', '2026-10-08T13:00:00Z'), 'id1')
  assert.deepEqual(db.calls[0].args, ['id1', '2026-10-08T13:00:00Z', 'sender@x.de', 'claude@y.de', 'Hello', 'body', '<p>body</p>', 42, 0])
})

test('a mail that fails to parse is kept with its envelope and header subject', async () => {
  const db = fakeDb()
  await storeMail(db, msg(), async () => { throw new Error('bad mime') }, 'id2', 'now')
  assert.deepEqual(db.calls[0].args, ['id2', 'now', 'a@x.de', 'claude@y.de', 'Hi', '', '', 42, 0])
})

test('huge bodies are cut and flagged', () => {
  const r = toRow(msg(), { text: 'a'.repeat(MAX_BODY + 5) }, 'i', 'n')
  assert.equal(r.text.length, MAX_BODY)
  assert.equal(r.truncated, 1)
})

test('send checks: recipients, one-line subject, text, sender', () => {
  const ok = { to: ['a@b.de'], subject: 'Hi', text: 'Hello' }
  assert.deepEqual(checkSend(ok, 'Claude <c@y.de>').mail, { from: 'Claude <c@y.de>', ...ok })
  assert.ok(checkSend(ok, '').error)
  assert.ok(checkSend({ ...ok, to: [] }, 'f').error)
  assert.ok(checkSend({ ...ok, to: ['a@b.de,evil@x.de'] }, 'f').error)
  assert.ok(checkSend({ ...ok, to: Array(6).fill('a@b.de') }, 'f').error)
  assert.ok(checkSend({ ...ok, subject: 'a\r\nBcc: x@y.de' }, 'f').error)
  assert.ok(checkSend({ ...ok, text: ' ' }, 'f').error)
  assert.ok(checkSend(null, 'f').error)
})

test('sendMail posts to Resend with the key, logs the send, and hides failure detail', async () => {
  const db = fakeDb()
  let seen
  const okFetch = async (url, init) => { seen = { url, init }; return Response.json({ id: 'r1' }) }
  const mail = { from: 'f', to: ['a@b.de'], subject: 's', text: 't' }
  assert.equal(await sendMail(db, { RESEND_API_KEY: 'k' }, mail, okFetch, 'sid', 'now'), 'r1')
  assert.equal(seen.url, 'https://api.resend.com/emails')
  assert.equal(seen.init.headers.authorization, 'Bearer k')
  assert.deepEqual(db.calls[0].args, ['sid', 'now', 'a@b.de', 's', 'r1'])
  await assert.rejects(sendMail(db, { RESEND_API_KEY: 'k' }, mail, async () => new Response('secret detail', { status: 403 })), /^Error: resend 403$/)
  assert.equal(db.calls.length, 1)
})

test('token: unset or short secrets never match; exact match only', () => {
  const s = 'x'.repeat(32)
  assert.ok(tokenOk(`Bearer ${s}`, s))
  assert.ok(!tokenOk(`Bearer ${s}y`, s))
  assert.ok(!tokenOk('Bearer short', 'short'))
  assert.ok(!tokenOk(undefined, s))
  assert.ok(!tokenOk('Bearer ', undefined))
})

test('previews get their own database, and no secret value sits in the config', () => {
  const cfg = JSON.parse(readFileSync(new URL('./wrangler.jsonc', import.meta.url), 'utf8').replace(/^\s*\/\/.*$/gm, ''))
  const live = cfg.d1_databases[0]
  const prev = cfg.previews.d1_databases[0]
  assert.notEqual(prev.database_name, live.database_name)
  assert.equal(prev.database_id, live.preview_database_id)
  assert.ok(!JSON.stringify(cfg).match(/re_[A-Za-z0-9]{20,}/))
})
