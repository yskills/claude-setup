# Characters

The character library for HQ and every three.js game to come. Format: **VRM** (a 3D figure file with skeleton,
face expressions, hair physics and its licence inside). Big files stay out of git: `build.sh` rebuilds them.

## What is here

- `roster.json`: the ten originals (name, base model, hair, eye and outfit colours, body shape, voice).
- `remix.py`: reshapes a VRoid body by bone weights (bust, hips, waist, thighs) and recolours hair, eyes and outfit.
- `build.sh [outDir]`: downloads pixiv's free samples and builds all ten into `out/<id>/model.vrm` (needs curl, unzip, python3
  with numpy and Pillow). One figure: `python3 -I remix.py in.vrm out.vrm '{"bust":0.35,"hair":"#c42a2a"}'`.
- `view.html` + `shot.mjs`: render figures side by side or as a 512 px portrait (`P=1`) with headless Chromium.
- `manifest.json`: every file with source, author and licence. `moves/`: shared animations.
- Built copies with portraits: `/mnt/project-files/claude-setup/hq-characters/remix/` in the Claude Setup project.

## Use them in a new three.js game

1. Run `characters/build.sh <game>/assets/characters` (writes `<id>/model.vrm`) and copy the rows of the figures you
   use from `manifest.json` into the game's `assets/manifest.json`.
2. Load and draw one (three r150+, `npm i three @pixiv/three-vrm`):

```js
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm'
const loader = new GLTFLoader()
loader.register((parser) => new VRMLoaderPlugin(parser))
const vrm = (await loader.loadAsync('/assets/characters/nyra/model.vrm')).userData.vrm
VRMUtils.rotateVRM0(vrm)                       // VRM 0 files face the other way
scene.add(vrm.scene)
const meta = vrm.meta                          // licence: refuse a model whose meta forbids your use
renderer.setAnimationLoop((t) => { vrm.update(clock.getDelta()); renderer.render(scene, camera) })
```

3. Expressions: `vrm.expressionManager.setValue('happy', 1)`; bones: `vrm.humanoid.getNormalizedBoneNode('head')`.

## New figures

- From a link (VRoid Hub, BOOTH, Sketchfab): download the `.vrm`, read its licence (`meta` in the file, or the
  page), add a manifest row, then remix or use as is. Never Honey Select, Koikatsu or other game rips.
- Your own: VRoid Studio (free) exports `.vrm` with any body shape; add it to `roster.json` only if it is a remix base.
- Content line: adult figures only, clothed, swimwear or lingerie looks; no nudity.
