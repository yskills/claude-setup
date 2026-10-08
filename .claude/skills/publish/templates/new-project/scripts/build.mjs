// Writes src/commit.js from the commit Workers Builds is building, so /api/config can prove
// which commit is live (the live check in claude-setup's publish skill).
import { writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

let commit = process.env.WORKERS_CI_COMMIT_SHA || ''
if (!commit) {
  try { commit = execSync('git rev-parse HEAD', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() } catch { commit = 'dev' }
}
writeFileSync(new URL('../src/commit.js', import.meta.url), `export const COMMIT = '${commit}'\n`)
console.log(`commit ${commit}`)
