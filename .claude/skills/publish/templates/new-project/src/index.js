import { COMMIT } from './commit.js'

const texts = {
  de: { title: '__NAME__', line: 'Hier entsteht gerade etwas.', note: 'Bald mehr.' },
  en: { title: '__NAME__', line: 'Something is being made here.', note: 'More soon.' },
}

function page(lang) {
  const t = texts[lang]
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${t.title}</title>
<style>
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; font: 18px/1.5 system-ui, sans-serif; color: #1f2937; background: #fffdf7; }
  main { padding: 24px; max-width: 32rem; }
  h1 { font-size: 2rem; margin: 0 0 8px; color: #1f3fbf; }
  p { margin: 0; }
  small { color: #6b7280; }
</style>
</head>
<body>
<main>
  <h1>${t.title}</h1>
  <p>${t.line}</p>
  <p><small>${t.note}</small></p>
</main>
</body>
</html>`
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    if (url.pathname === '/api/config') {
      return Response.json({ commit: COMMIT, db: Boolean(env.DB) })
    }
    const lang = (request.headers.get('accept-language') || '').toLowerCase().startsWith('en') ? 'en' : 'de'
    return new Response(page(lang), { headers: { 'content-type': 'text/html; charset=utf-8' } })
  },
}
