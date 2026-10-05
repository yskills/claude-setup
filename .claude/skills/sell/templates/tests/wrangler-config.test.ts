import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// Bindings that wrangler does not copy from the top level into an environment, and that the
// preview Worker repeats with its own resources (D1 ids are filled in by deploy.mjs).
const PREVIEW_BINDINGS = ['d1_databases', 'ratelimits']
// These name a resource in the config itself, so a PR could point the preview at live data.
// Before adding one: create a preview-only resource in deploy.mjs --preview, fill its id in at
// deploy time like D1, and allow it in ci.yml's preview guard.
const UNGUARDED_BINDINGS = ['kv_namespaces', 'r2_buckets', 'services', 'queues', 'hyperdrive', 'vectorize', 'analytics_engine_datasets']

type Binding = { binding?: string; name?: string }
type Config = Record<string, unknown> & { env: { preview: Record<string, unknown> } }

const bindingNames = (section: Record<string, unknown>, key: string) =>
  ((section[key] ?? []) as Binding[]).map((b) => b.binding ?? b.name).sort()

describe('wrangler.jsonc', () => {
  const text = readFileSync('wrangler.jsonc', 'utf8')

  it('is plain JSON, because deploy.mjs and the CI preview guard parse it without comments', () => {
    expect(() => JSON.parse(text), 'Move comments out of wrangler.jsonc (e.g. next to the code that uses the binding)').not.toThrow()
  })

  it('gives PR previews every binding the live Worker has', () => {
    const config = JSON.parse(text) as Config
    for (const key of PREVIEW_BINDINGS) {
      expect(bindingNames(config.env.preview, key), `env.preview.${key}`).toEqual(bindingNames(config, key))
    }
  })

  it('uses no binding the preview guard cannot isolate', () => {
    const config = JSON.parse(text) as Config
    for (const key of UNGUARDED_BINDINGS) {
      expect(config[key] ?? config.env.preview[key], `${key}: see UNGUARDED_BINDINGS above`).toBeUndefined()
    }
  })
})
