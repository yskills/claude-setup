import PostalMime from 'postal-mime'
import { checkSend, sendMail, storeMail, tokenOk } from './inbox.mjs'

export default {
  // Cloudflare Email Routing calls this for every mail to the catch-all address.
  async email(message, env) {
    await storeMail(env.DB, message, (raw) => PostalMime.parse(raw))
  },

  // POST /send is the only way out and needs SEND_TOKEN, which only yskills holds: sending is
  // never automatic. Reading the inbox is not an endpoint at all (README, "Read the inbox").
  async fetch(request, env) {
    const { pathname } = new URL(request.url)
    if (request.method === 'GET' && pathname === '/') return new Response('mailbox ok')
    if (request.method !== 'POST' || pathname !== '/send') return new Response('not found', { status: 404 })
    if (!tokenOk(request.headers.get('authorization'), env.SEND_TOKEN)) return new Response('unauthorized', { status: 401 })
    const body = await request.json().catch(() => null)
    const { error, mail } = checkSend(body, env.MAIL_FROM)
    if (error) return Response.json({ error }, { status: 400 })
    try {
      return Response.json({ id: await sendMail(env.DB, env, mail) })
    } catch (err) {
      console.error('send failed', err?.message)
      return Response.json({ error: 'send failed' }, { status: 502 })
    }
  },
}
