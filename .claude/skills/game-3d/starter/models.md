# Standard models and assets

What a new project may start from. "Ship" means it may go into a paid game with the credit shown;
"HQ only" means fine in yskills' private HQ but never in a sold product; "study" means look, learn,
never copy files. Licences are as the source states them and as the VRM meta says; read both again
before shipping (`../scripts/check-assets.mjs` enforces the meta). Library paths are under
`/mnt/project-files/companyxy/vrm-library/` (fetch elsewhere with `tools/vrm/fetch-library.sh`).

## Our own builds

| Model | What | Built from | Use | Where |
|---|---|---|---|---|
| Mira, full size | adult anime woman, layered (body, underwear, outfits), faces, springs, dance | pixiv VRoid sample "Victoria" (VRoid Hub terms: everyone, commercial, edits, no credit) + Shino hair (CC0) + **drophunter garments (personal non-profit)** | HQ only until the drophunter garments are swapped for own or CC0 garments; then ship | company-xy `characters/` recipe (`roster.json`, `build.sh`, `tools/vrm/assemble.py`); outputs in `characters/out/` (gitignored) |
| Mira, chibi | ~2.2-head office chibi, Mollig key, faces, everyday outfit | Koban Chibi Base (CC0) + Mira's hair, own garments | ship | `tools/vrm/chibi_koban.py`; sample `characters/mira/laptop/chibi.vrm` |
| Test body | plain humanoid with breast spring chains, three layer collections | own | ship (as a rig test, not a hero) | share `research/test-body/` |

The other nine office figures follow Mira's recipe once yskills approves her. A standard model is
rebuilt from its recipe, never hand-edited in a binary: the recipe is what new games reuse.

## Bases and bodies

| Asset | Licence | Use | Path |
|---|---|---|---|
| Koban Wanko Chibi Base Mesh 1.0 (VRM 0, 80 ARP bones, 61 shape keys) | CC0 as stated on its Gumroad page (no licence file in the zip; keep the page link) | ship | `chibi/koban-wanko/` |
| VRoid samples D, D Darkness, E, F, G, Base Female/Male, Hair Samples, Shino, Fumiriya | CC0 (OpenGameArt) | ship | `opengameart-vroid-cc0/` |
| FLEUR, VULPEK, YUEJI | CC0 | ship | `karindou-shikigami/` |
| Blender Studio human base meshes v1.4.1 (17 bodies, all quad) | CC0 | ship | `blender-studio-cc/human-base-meshes-v1.4.1.blend` |
| Rain v3, Ellie, Victoria (Sprite Fright), Snow v4 | CC-BY 4.0, credit "Blender Studio (<name>)" | ship parts with credit; mainly craft reference (garment stacks, corrective keys, light rigs) | `blender-studio-cc/` (`manifest.json`) |
| MPFB 2 (MakeHuman in Blender, not in the library) | code GPLv3, generated figures CC0 | ship; best scriptable source for realistic bodies | install when a project needs it |
| Seed-san (VRM 1) | VRM Public Licence 1.0 | read its terms first | `vrm-c-samples/` |
| Alicia Solid | Niconi Solid licence | study | `vrm-c-samples/` |
| three-vrm-girl, Constraint Twist Sample, `test.vrma` | MIT repo; per-file VRM meta | ship after reading the meta | `pixiv-three-vrm/` |
| AvatarSample A, B, C | pixiv sample terms | read the meta | `vroid-samples-madjin/` |
| `fem_vroid`, `masc_vroid`, 8 unrigged clothing GLBs | unstated | study (shapes to model from) | `vroid-samples-madjin/` |
| Polygonal Mind Xmas chibis (Avatar03, Avatar10) | VRM meta: use only by an explicitly licensed person | study | `chibi/polygonalmind-xmas-chibis/` |

## Parts and moves

| Asset | Licence | Use | Path |
|---|---|---|---|
| Quaternius Universal Animation Library 1 + 2 (~90 clips, female mannequin) | CC0 | ship | `quaternius-ual/` |
| CharacterStudio drophunter traits (body, 10 hair, 10 tops, 9 bottoms, 10 shoes, jackets; VRM 1, one skeleton, grey, take any colour) | no licence file; meta personal non-profit | HQ only | `charstudio-drophunter/` |
| CharacterStudio Anata female + fantasy armour, robes, boots | meta: redistribution prohibited, private use | HQ only | `charstudio-anata-female/` |
| CharacterStudio loot animations (T-pose, idle, walk, wave FBX) | unstated | study | `charstudio-loot-animations/` |

No free source has a real bikini or lingerie mesh: those are our own cut-from-body garments
([figures.md](figures.md), Straps). A game that sells must replace every "HQ only" garment first.

## Never

- The Shadowheart file (yskills' download, company-xy local `assets/`, CC-BY-NC-ND game rip):
  study only, never reworked, pushed or shipped. Notes: share `research/shadowheart-study.md`.
- BlobCG: paid, adult, fan versions of other studios' characters; inspiration for the look only.
- Anything from BOOTH, VRoid Hub or Sketchfab that needs a login: yskills downloads it, and only
  after the licence is read. Paid assets need yskills' word first.
- Rule34-style aggregators and anything with underage-looking characters.
