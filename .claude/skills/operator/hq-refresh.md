# HQ refresh ("Heute für dich")

HQ's desk phone opens "Heute für dich", read from the `today/now` row. Artifact pages cannot fetch
other sites, so a session fills that row. That session is one lean project thread, "HQ:
Heute-Abgleich" (Sonnet), kept resolved so it stays out of the way. It:

- writes `config/refresher` `{session: <its own session id>, at}` into HQ's db at start, so the page
  knows whom to ask;
- holds one routine of its own (fires into itself): every day at 8:07 Europe/Berlin;
- runs the prompt below on that routine and on every "HQ refresh" message. HQ sends that message
  through the Claude Code Remote connector when yskills opens it and the list is older than 30 minutes
  (and nobody asked in the last 10; `today/ask`), or when they tap "Jetzt abgleichen".
- answers with `no_reply_needed`; it never posts. When its context guard says hand off, it writes a
  short HANDOFF and the coordinator starts a fresh one, which rewrites `config/refresher`.

Why not hourly: a routine in a private project can only wake an existing session, and every wake
re-reads that session's whole context, so hourly would burn most of the plan's usage on a list
nobody is looking at. Asking on open costs a run only when yskills actually looks.

## Prompt

You refresh the "Heute für dich" list in yskills' Claude Setup HQ (Artifact
https://claude.ai/artifact/TmQ7UpL6EPjXKkpR9S4kJT). Work quietly: no messages, no PRs, no pushes, no
comments, no new threads. Only verified data: every item comes from a call you made in this run, and
its `at` is when you read it. Write item texts in short plain German a non-technical reader
understands, amounts with cents (29,99 €). Never write ids of people, emails or secrets.

1. Read HQ's rows with ArtifactData (url above): `today/now` (its `version`), `pm/now`,
   collection `projects`, `finance/duo-test` (its `version`).
2. GitHub (source "GitHub"): open pull requests in yskills/claude-setup, yskills/duo-test and
   yskills/kleingarten (GitHub MCP tools, `list_pull_requests` state open). For each: one item
   `{what: "<repo> PR <n>: <title>, Prüfungen <grün|rot|laufen>", kind: "info", link: <PR url>}`;
   kind "you" only when a review is requested from yskills. A repo you cannot reach goes in
   `sources` with ok false and a short note, never as a guess.
3. Money (source "Stripe"): `curl -s https://duo-test.yskills.workers.dev/api/stats`. When it answers
   JSON with `total.grossCents`, write `finance/duo-test` = that JSON plus `savedAt` (now, ISO), pinned
   with `if_version`, and add one info item: "duo-test: <net or gross> € <nach Gebühr|brutto> gesamt,
   <month> € diesen Monat" plus " (Testgeld)" unless `mode` is "live". No answer: sources ok false.
4. Roblox (source "Roblox"): the newest GitHub Actions run of yskills/kleingarten on main
   (`actions_list`): one info item "Kleingarten: letzter Upload <erfolgreich|fehlgeschlagen>, <age>".
   There is no Open Cloud key in this session; say so in the source note.
5. Team (source "Team"): from `projects` rows, every `you[]` entry of an active project as a kind "you"
   item (its `link` if https), and one info item per project with `working` > 0:
   "<name>: <n> arbeitet gerade". `pm/now.you` is shown by the page itself; do not copy it.
6. Write `today/now` with one `set` pinned to the version from step 1 (create it if missing):
   `{refreshedAt, items: [{what, kind, source, at, link?}], sources: [{name, ok, note?}]}`, at most
   20 items, "you" items first. On a version conflict, re-read once and redo the write.
7. End the run. If a step failed, the `sources` row says so; nothing else.
