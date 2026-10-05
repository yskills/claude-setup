# The three briefs

yskills reads exactly three messages per project and answers each with ok or no (or a tap on an
option). Fixed templates, so they read the same every time. Short lines, no prose. German
labels only if yskills writes German in that project.

## (a) After the plan

```
Plan: <name>, <one line: what it does>
Für wen: <who>, <how many like them, source>
Geld: <how it earns, price>, <break-even: n paying users / month>
Beweis: <3 signs people already pay for this, with sources | none → recommend no or smaller | not meant to earn>
Größe: <small site: 1 build | app: n slices, riskiest first: <slice 1>>
Slices: 1. <name> 2. <name> ...
Rechtliches: <must-haves from the legal team, e.g. Impressum, Datenschutz, no cookie banner needed>
Keys: <none | the list; you add them with brief (b)>
Repo: create `<name>` (private) at https://github.com/new, then reply ok
Kosten: ~<€/month to run> + ~<tokens or $ to build>, estimate
Risiko: <the one thing most likely to fail>

ok / no
```

## (b) Design pick

Send 2-3 directions, each as one phone and one desktop screenshot (attach the images), each with
a two-word name and one line on the feel. Then tap options: the directions, plus "none, try again".

Below the pick, once per project, the setup only yskills can do (numbered steps with deep links
and exact names, from the `publish` skill and `sell`'s `keys.md`): Cloudflare import, D1 ids,
Previews Base secrets, test keys. Building starts when yskills replies "done".

## (c) Before launch

```
Launch: <name>
Preview: <url>
Gate: 5/5 on every slice (<n> PRs) | open: <which>
Screens: <phone + desktop images attached>
Legal: <legal-reviewer result: pass, or what is open>
Live keys needed: <list with deep links, or none>
Branch builds off before live keys: <yes | not needed, no live keys>
Offene Risiken: <max 3 lines>

ok = go live / no
```
