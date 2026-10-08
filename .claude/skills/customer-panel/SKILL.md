---
name: customer-panel
description: "Simulated buyer panel before money is spent: 20 to 100 buyer subagents dealt from the target customer say buy or pass, why, and four price answers (Van Westendorp). Use when a plan asks would they buy, what price, or validate demand, and before the probe goes live."
---

# Customer panel

Copied 2026-10-08 from Jake Schincariol's MIT `founder-skill` (`founder-consumer` and
`founder-pricing`, github.com/Jakeschincariol/founder-skill), trimmed to the two tools worth
keeping and set to euros. The rest of that pack (board, CFO, marketing, brand, ops, launch,
plan) overlaps `product-lens`, `market-research`, `market` and the operator's PLAN.md.

**What it is good for:** objections, segments and wording you had not thought of, and a price
range to test. **What it is not:** a forecast. Language models lean agreeable, so the buy rate
is an upper bound; the probe slice (`operator`, a landing page with a price) is the real test.
Panel quotes are research, never testimonials (`market` §4).

## When it runs

- `operator` step 2 (proof people pay), by the Researcher, after competitors and prices: the
  result goes into PLAN.md next to the probe's go number.
- `market` §1 point 1 (Buyer): the top three objections shape the landing page copy.
- Any time yskills asks "would people buy this" or "what price".

## Run

Standard-library Python, no network. State lives in `founder/panel/` of the project
(`--dir` to change it). `PANEL` below is `python3 "${CLAUDE_SKILL_DIR}/panel.py"`.

1. **Customer.** Write `founder/customer.json` (shape: `customer.example.json` here):
   `business`, `target`, `age`, 2 to 4 `segments` with `share` and yearly `income` in €,
   4 to 8 `behaviours`, 4 to 8 `objections`, optional `habits`. Ground it in what the research
   found (competitor reviews, real interviews); say which parts are guesses. Show yskills the
   profile in a few lines and let them correct it before dealing.
2. **Pitch.** Write `founder/pitch.md`: what a buyer sees, three to six plain lines with the
   price, no superlatives (`pitch.example.md`).
3. **Deal and run.**
   ```bash
   PANEL init --customer founder/customer.json --pitch founder/pitch.md --n 20
   PANEL prompts
   ```
   Default 20 buyers (one wave of 10 Sonnet subagents twice); 100 only when yskills asks, it is
   100 subagent calls. For each wave send one message with one Agent call per buyer:
   `subagent_type: general-purpose`, `description: panel <id>`,
   `prompt: Read <brief path> and follow it exactly. It is your whole brief.` Wait for the wave.
   Then `PANEL check` (re-run `PANEL prompts` for the missing ones once), `PANEL tally`.
   A buyer that printed JSON instead of writing it: `PANEL save <id>` with the reply on stdin.
   Never write an answer for a buyer.
4. **Price.** `python3 "${CLAUDE_SKILL_DIR}/van_westendorp.py" founder/panel/answers --price 4.99`
   gives the acceptable range (PMC to PME) and the optimal point. Decimal point, not comma, in
   any CSV from a real survey.

## Report (in the thread, short)

1. Headline: "8 buy · 12 pass" and the rate, with the upper-bound caveat once.
2. Segments and behaviours that differ most.
3. Top three reasons to pass, one quote each, as written.
4. What would flip a no.
5. One line on what to change before the probe, and the price range to test.

## Tests

```bash
python3 -m unittest discover -s .claude/skills/customer-panel/tests
```
