// Packs the nine Kenney Cube Pets HQ's team office uses, plus their shared colormap, into one script
// the dashboard loads next to it. Kenney's kits are CC0 (https://kenney.nl/assets/cube-pets). Re-run after changing PETS:
//   node scripts/pets-kit.mjs "<unzipped kit>/Models/GLB format"
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const PETS = ['polar', 'parrot', 'cat', 'beaver', 'bunny', 'penguin', 'dog', 'fox', 'panda']
const dir = process.argv[2]
if (!dir) { console.error('usage: node scripts/pets-kit.mjs <Kenney Cube Pets "GLB format" folder>'); process.exit(1) }
const kit = Object.fromEntries(PETS.map((p) => [p, readFileSync(join(dir, `animal-${p}.glb`)).toString('base64')]))
kit.colormap = `data:image/png;base64,${readFileSync(join(dir, 'Textures', 'colormap.png')).toString('base64')}`
const out = new URL('../.claude/skills/operator/templates/pets-kit.js', import.meta.url)
writeFileSync(out, `/* Kenney Cube Pets (CC0, kenney.nl), packed by scripts/pets-kit.mjs. Do not edit. */\nwindow.PETS_KIT=${JSON.stringify(kit)}\n`)
console.log(`${PETS.length} pets, ${Math.round(readFileSync(out).length / 1024)} KB`)
