// Packs the Kenney Furniture Kit pieces HQ uses into one script the dashboard loads next to it.
// Kenney's kits are CC0 (https://kenney.nl/assets/furniture-kit). Re-run after changing PIECES:
//   node scripts/office-kit.mjs "<unzipped kit>/Models/GLTF format"
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const PIECES = ['wall', 'wallWindow', 'wallDoorway', 'floorFull', 'desk', 'laptop', 'lampRoundTable',
  'lampRoundFloor', 'pottedPlant', 'plantSmall1', 'bookcaseOpen', 'books', 'loungeSofa', 'tableCoffee', 'rugRounded',
  'sideTable', 'kitchenCoffeeMachine', 'coatRackStanding', 'radio']
const dir = process.argv[2]
if (!dir) { console.error('usage: node scripts/office-kit.mjs <Kenney Furniture Kit "GLTF format" folder>'); process.exit(1) }
const kit = Object.fromEntries(PIECES.map((p) => [p, readFileSync(join(dir, `${p}.glb`)).toString('base64')]))
const out = new URL('../.claude/skills/operator/templates/office-kit.js', import.meta.url)
writeFileSync(out, `/* Kenney Furniture Kit (CC0, kenney.nl), packed by scripts/office-kit.mjs. Do not edit. */\nwindow.OFFICE_KIT=${JSON.stringify(kit)}\n`)
console.log(`${PIECES.length} pieces, ${Math.round(readFileSync(out).length / 1024)} KB`)
