# The three briefs

Besides the merge taps, the gate's summaries (2 failed rounds, or an important PR) and a probe that
misses its go number, yskills reads three
messages per project and answers each with ok or no
(or a tap on an option). Fixed templates, so they read the same every time. Short lines, no prose. German
labels only if yskills writes German in that project.

## (a) After the plan

```
Plan: <name>, <one line: what it does>
Für wen: <who>, <how many like them, source>
Geld: <how it earns, price>, <break-even: n paying users / month>
Beweis: <3 signs people already pay for this, with sources | none → recommend no or smaller | not meant to earn>
Probe: landing page + waitlist, <channel>, <n> days; go at <go number>, else a kill/change card
Größe: <small site: 1 build | app: n slices, riskiest first: <slice 1>>
Slices: 1. <name> 2. <name> ...
Rechtliches: <must-haves from the legal team, e.g. Impressum, Datenschutz, no cookie banner needed>
Keys: <none | what will be needed, each asked by a key card when its slice gets there>
Repo: create `<name>` (private) at https://github.com/new, then reply ok
Kosten: ~<€/month to run> + ~<tokens or $ to build>, estimate
Risiko: <the one thing most likely to fail>

ok / no
```

## (b) Design pick

Send 2-3 directions, each as one phone and one desktop screenshot (attach the images), each with
a two-word name and one line on the feel, built from yskills' references and the `ui-review`
skill's `TASTE.md`. Then tap options: the directions, plus "none, try again". yskills can also
answer in words or pictures ("this one but darker", a screenshot): the design team revises and
sends the next round. Each lasting like or dislike becomes a line in `TASTE.md`.

Below the pick, first the scaffold PR's merge tap (the import builds the default branch), then,
once per project, the setup only yskills can do (numbered steps with deep links
and exact names, from the `publish` skill and `sell`'s `keys.md`): Cloudflare import, D1 ids,
Previews Base secrets, and (with GitHub Pro) the auto-merge ruleset. Test keys come later by key card, when the slice that uses them
starts. Building starts when yskills replies "done".

## (c) Before launch

```
Launch: <name>
Preview: <url>
Gate: 5/5 on every PR so far (<n> merged); last PR <link> at 5/5, unmerged
Screens: <phone + desktop images attached>
Legal: <legal-reviewer result: pass, or what is open>
Live keys needed: <list with deep links, or none>
Branch builds off before live keys: <yes | not needed, no live keys>
Offene Risiken: <max 3 lines>

ok = set the keys above, then tap Merge it on <link>, which goes live / no
```

## Key card (any time a slice needs a key or account)

Not a brief: no ok/no, just steps. One card per slice, all its keys together.

```
Need: <what for, in user words, e.g. "so people can pay">
1. Open <exact deep link to the settings page>
2. <click path, exact field values>
3. Copy <what> and add it at <exact place>, name <SECRET_NAME>
Then reply "done". Meanwhile: <what the slice keeps building>
```
