# Chibi roadmap

How to make a game chibi that yskills accepts, in order. Each step has a check; nothing moves on
until it passes. Script: company-xy `tools/vrm/chibi_koban.py` (headless Blender, about one
minute). Numbers below are where Mira's chibi ended; tune per game, then write the new numbers back.

## 0. What a chibi is here

- A **style**, not a squashed full figure: about 2.2 heads, big simple shapes, readable from a
  top-down camera, cute like the plush office animals and TFT/League chibis ("chunkified").
- Chibis wear **dressed outfits only**, never swimwear or lingerie. Full-size figures carry those.
- One figure, two outputs: full size (visits, close-ups) and chibi (office, crowds).

## 1. Base: a finished chibi, proportions untouched

- Base: Koban Wanko Chibi Base Mesh (CC0, VRM 0, 80 Auto-Rig-Pro bones, 61 shape keys incl.
  ARKit face keys). Path in [models.md](models.md).
- Scale **uniformly** to the target height standing on the shoe soles, then apply transforms so
  bones, mesh and shape keys are the new rest.
- **Check:** arms, hands, feet and joints match the base exactly. Rejected before: scaling a full
  figure's bones into a chibi (`tools/vrm/chibi.py`, v4-v7) looked broken.

## 2. Body style by shape key

- Chubbier or curvier is a **shape key** ("Mollig"): soft inflate along the normals on cheeks,
  upper arms, thighs and a little belly, smooth falloff, zero at hands, feet and joints, seams welded.
- **Check:** render base and styled side by side (front and 3/4). yskills says "more" to push;
  raise the key, never rescale bones.

## 3. Face

- Recolour the base's flat face materials (tell them apart by face count and position: skin has
  most faces, brows sit highest, iris fewest near the eyes, mouth lowest).
- Iris disc with a rim and a soft pupil; brows drawn over the bangs, dark navy, tapered.
- Expressions as part mixes over the ARKit keys (`MOODS`), plus "Roete" (blush ovals that open
  from under the skin by a shape key). Comedy beats get small 2D stickers (sweat drop, anger vein,
  sparkles), Animal Crossing style.
- **Check:** a faces sheet where every mood reads at a glance and no two look alike (Mira's v11
  faces were "too similar" first time).

## 4. Hair

- Take the full-size figure's hair and map it onto the chibi skull by direction from the head
  centre (ratio chibi skull / full skull per direction, smoothed, never touching the skin). Cut at
  mid back, cap holes, bind to the head bone.
- Hair normals 35 % toward "away from the head centre" so it shades as one shape; highlights
  painted, not lit.
- **Check:** no skin through the hair from any side; the silhouette still says who she is.

## 5. Clothes

- Shells lifted off the body, hems cut with `bisect_plane` (clean, not stair-stepped), given
  thickness. Shoes on a darker sole slab from the foot outline. A flared skirt is lathed around the
  hips from ray-cast body girth.
- Everything on the same armature; the **body is never cut or painted**. Garments carry the
  "Mollig" key too so nothing pokes through when it is pushed.
- **Check:** turnaround (front, 3/4, back) with no skin through cloth, at rest and in the walk.

## 6. Look (MToon, so three-vrm draws it like the office)

| Setting | Value |
|---|---|
| Shading toony | 0.92 to 0.95 (crisp cel edge) |
| Shade colours (sRGB) | skin (0.98, 0.74, 0.70), cloth (0.80, 0.68, 0.76), hair (0.62, 0.58, 0.82); face shading shift -0.45 so it stays lit |
| Rim | (0.20, 0.18, 0.24), Fresnel 5, lift 0.05, lighting mix 0.8 |
| Face normals | 60 % toward a head ellipsoid (no blotchy face shadows) |
| Matcap | off (it lit hair and trousers in white stripes) |
| Outline | **world** mode, model metres: cloth 0.008, body 0.006, hair 0.0025, face 0.004; colours dark tints of the base (plum, warm brown, navy), never black |

World, not screen, outlines: three-vrm 1.0.10 applies the screen offset before the divide by w, so
screen lines still thin out at office distance (8 px close, under 1 px at 28 units).

## 7. Moves and physics

- Shared VRMA or Quaternius UAL clips (CC0), never baked per figure. The base warns standard
  animations may not fit a chibi: play idle, walk, wave and sit on it before calling it done.
- Spring bones on hair and skirt with head, hip and thigh colliders; `vrm.update(delta)` takes
  **seconds**, delta clamped to 50 ms.
- **Check:** walk and idle in the browser, no hair through the head, no skirt through the legs.

## 8. Export and previews

- Export VRM 0 with meta (author, licence, credit). Previews: Cycles CPU toon stand-in (no GPU or
  EGL in cloud threads), soft 3-point light, warm light-grey backdrop: sheet (front, 3/4, back,
  face), compare (base vs styled), faces.
- **Check:** the VRM meta's licence matches [models.md](models.md); the game's manifest has a row.

## 9. In the game

- Load it with three-vrm in the real scene, screenshot at 390 and 1440 px from the game camera
  (outline width and readability are judged there, not in Blender), `design-critic` with the
  reference pictures next to it.
- Show yskills in this order: inspiration, base vs styled, outfits, faces, in-game shot. Every
  reply names what is still weak.
