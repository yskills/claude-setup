# Character workflow

One fixed way to make a character and to show yskills a 3D model. Every figure brief, build and
gate follows it; nobody switches the order.

## Why

Company XY's figures are not one-offs. The work builds a repeatable character-generation
workflow and a library (bases, hair, outfits, clips, tools) that every later character and
project reuses: the next figure should take a brief and a picture, not a new invention. In
2026-10-08 the process switched around (VRoid samples instead of the chosen characters, a model
file taken as "the basis", pictures without the reference beside them, eyes that vanished in the game),
and yskills had to say it twice. This page is the fix.

## The steps, in order

1. **Reference.** One picture per character, named after her, in
   `/mnt/project-files/<project>/references/named/<slug>.png`, listed in `references/README.md`
   (character, series, original file). "Basis" always means the character in that picture, never
   a model file. No reference picture, no build.
2. **Brief.** One thread per figure (`Programmer · <Name> figure`). The brief names the reference
   file and lists what is off, biggest first (eyes, hair, face, skin, body, outfits), from a
   diagnosis sheet: reference beside the current render.
3. **Build with the shared pipeline** (in company-xy: `tools/vrm/README.md`, Layer rule and
   Quality bar):
   - Start from the best free base in the library, never from scratch; keep its proportions.
   - Layer rule: intact skin body, underwear as its own meshes, outfits as separate objects on one
     armature, clipping by visibility-driven Mask modifiers. Never deleted faces, never painted
     clothes.
   - Adult rule: every figure is an adult woman with her grown-up look; a schoolgirl in her series
     gets her adult look, never a school look.
   - Content line: lingerie at most, a smooth non-explicit base, no nude renders.
   - No paid assets. Free only, licence noted in the library's `library.json`. A free download that
     needs a login is registered with the email yskills provides; its login is never guessed.
   - Poses and motion natural: clips from the library (Quaternius UAL, VRMA), spring bones settled,
     feet on the floor, arms outside the body.
4. **Self-check before anyone sees it.** The builder renders every outfit under the office lights
   and fixes, before showing: washed-out fabric, white blotches, clipping, wrong colours, shirt
   or skirt hems that gap or tear. `check_layers.py` prints ok.
   - Eyes are checked in the exported game file as the game renders it (three-vrm), not only in
     Blender: the iris has its own colour and clear contrast against the eye white. A colour boost
     made in Blender that never reaches the export does not count (Hinata, 2026-10-08: a near-white
     iris texture plus a big highlight vanished in the game).
   - Renders sit on a mid-tone background, never white, so pale skin and light clothes stay readable.
5. **Show yskills one way only: the comparison sheet.**
   - Reference picture beside the render, a face close-up, each outfit, the chibi.
   - Files `figure-shots/<slug>-v<n>-sheet-1440.png`, `-sheet-390.png`, `-face.png`, at 1440 and
     390 px.
   - Posted in the project chat with the character and version named ("Hinata v2").
   - Never a bare render, never a model file, never the sheet without the reference.
6. **Gate.** A fresh Tester runs `gate.md` on the figure's PR with fresh subagents. Extra
   criterion: likeness to the reference (a reviewer who gets only the sheet and the reference
   picture says yes or no on face, hair, body and outfits). Merge at 5/5; builders never merge.
7. **After the merge.**
   - The game exports go to the artifact's asset store; the `cards/<id>` row points at the new
     asset ids ([`docs/hq-rows.md`](hq-rows.md), Figures (cards)).
   - New reusable parts (a garment, a hair, a clip, a tool) get a library entry
     (`library.json` via `make_library.py`), so the next figure starts from them.
   - Republish HQ per company-xy `README.md` (Publish) and post the live shots.

## What a figure brief always says

The reference file, the diagnosis list, the order (head and hair, body, outfits, chibi, exports),
the deliverables of step 5, and a pointer to this page.
