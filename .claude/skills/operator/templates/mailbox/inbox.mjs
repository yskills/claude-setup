// Pure logic of the mailbox Worker, so `node --test` runs it without Cloudflare.
export const MAX_BODY = 200_000 // chars per text/html; a D1 row stays well under its 2 MB cap
export const MAX_RECIPIENTS = 5
const ADDRESS = /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/

const cut = (s) => String(s ?? '').slice(0, MAX_BODY)

// parsed: postal-mime's result (or null when parsing failed); message: the Email Worker message.
export function toRow(message, parsed, id, now) {
  const text = cut(parsed?.text)
  const html = cut(parsed?.html)
  return {
    id,
    received_at: now,
    from_addr: String(parsed?.from?.address ?? message.from ?? '').slice(0, 320),
    to_addr: String(message.to ?? '').slice(0, 320),
    subject: String(parsed?.subject ?? message.headers?.get?.('subject') ?? '').slice(0, 998),
    text,
    html,
    size: message.rawSize ?? 0,
    truncated: String(parsed?.text ?? '').length > MAX_BODY || String(parsed?.html ?? '').length > MAX_BODY ? 1 : 0,
  }
}

export async function storeMail(db, message, parse, id = crypto.randomUUID(), now = new Date().toISOString()) {
  let parsed = null
  try {
    parsed = await parse(await new Response(message.raw).arrayBuffer())
  } catch (err) {
    console.error('mail parse failed', err?.message) // keep the mail with headers only, never drop it
  }
  const r = toRow(message, parsed, id, now)
  await db
    .prepare('INSERT INTO mail (id, received_at, from_addr, to_addr, subject, text, html, size, truncated) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(r.id, r.received_at, r.from_addr, r.to_addr, r.subject, r.text, r.html, r.size, r.truncated)
    .run()
  return r.id
}

// Validates a send request; returns { error } or { mail } shaped for Resend.
export function checkSend(body, from) {
  const to = Array.isArray(body?.to) ? body.to : []
  if (!from) return { error: 'MAIL_FROM is not set' }
  if (to.length < 1 || to.length > MAX_RECIPIENTS || !to.every((a) => typeof a === 'string' && ADDRESS.test(a))) return { error: `to: 1 to ${MAX_RECIPIENTS} valid addresses` }
  if (typeof body.subject !== 'string' || !body.subject.trim() || body.subject.length > 200 || /[\r\n]/.test(body.subject)) return { error: 'subject: 1 to 200 chars, one line' }
  if (typeof body.text !== 'string' || !body.text.trim() || body.text.length > 20_000) return { error: 'text: 1 to 20000 chars' }
  return { mail: { from, to, subject: body.subject, text: body.text } }
}

export async function sendMail(db, env, mail, fetchFn = fetch, id = crypto.randomUUID(), now = new Date().toISOString()) {
  const res = await fetchFn('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json', 'idempotency-key': id },
    body: JSON.stringify(mail),
  })
  if (!res.ok) throw new Error(`resend ${res.status}`) // detail stays out of the caller's hands
  const { id: resendId } = await res.json()
  await db.prepare('INSERT INTO sent (id, sent_at, to_addr, subject, resend_id) VALUES (?, ?, ?, ?, ?)').bind(id, now, mail.to.join(','), mail.subject, String(resendId)).run()
  return resendId
}

// Constant-time token compare; an unset secret never matches.
export function tokenOk(header, secret) {
  if (!secret || secret.length < 32) return false
  const given = (header ?? '').replace(/^Bearer /, '')
  if (given.length !== secret.length) return false
  let diff = 0
  for (let i = 0; i < given.length; i++) diff |= given.charCodeAt(i) ^ secret.charCodeAt(i)
  return diff === 0
}
